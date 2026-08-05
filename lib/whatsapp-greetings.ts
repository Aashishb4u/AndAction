/**
 * One-time WhatsApp welcome greeting for artists.
 *
 * Lives here (not in a route) so it can be driven from two places:
 *   - the standalone endpoint  /api/cron/send-whatsapp-greetings  (manual / testing)
 *   - the Instagram refresh cron, which already runs on a schedule
 *
 * runWhatsappGreetingBatch never throws. Callers embedded in another job can
 * ignore the result entirely and their own work is unaffected.
 */

import { prisma } from "@/lib/prisma";
import {
  buildArtistProfileLink,
  isWhatsappConfigured,
  sendArtistWelcomeTemplate,
  toWhatsappRecipient,
} from "@/lib/whatsapp";

/** Gap between WhatsApp calls, floored so we can never hammer the API. */
export const WHATSAPP_SEND_DELAY_MS = Math.max(
  Number(process.env.WHATSAPP_SEND_DELAY_MS || 2000),
  2000,
);

/** Default batch size for the standalone endpoint. */
export const WHATSAPP_MAX_PER_RUN = Math.max(
  Number(process.env.WHATSAPP_GREETING_MAX_PER_RUN || 50),
  1,
);

/**
 * Smaller default when piggybacking on the Instagram cron, so the greeting
 * work can't meaningfully stretch that job's runtime.
 * 20 x 2s = ~40s. Set to 0 to disable the piggyback entirely.
 */
export const WHATSAPP_GREETINGS_PER_INSTAGRAM_RUN = Math.max(
  Number(process.env.WHATSAPP_GREETINGS_PER_INSTAGRAM_RUN || 20),
  0,
);

/**
 * The Instagram cron ticks every 30 minutes (48x/day), but greetings should go
 * out far less often. This throttles the piggyback to N batches per day by
 * requiring a minimum gap since the last one.
 *
 * The gap is enforced against a marker row in cron_jobs, so it survives
 * restarts and deploys - it is not in-memory state.
 */
export const WHATSAPP_GREETING_RUNS_PER_DAY = Math.max(
  Number(process.env.WHATSAPP_GREETING_RUNS_PER_DAY || 3),
  1,
);

export const WHATSAPP_GREETING_MIN_INTERVAL_MS = Math.floor(
  (24 * 60 * 60 * 1000) / WHATSAPP_GREETING_RUNS_PER_DAY,
);

/** cron_jobs marker recording when a throttled batch last ran. */
const THROTTLE_JOB_NAME = "whatsapp-greeting-batch";

export interface WhatsappGreetingFailure {
  artistId: string;
  to: string | null;
  error: string;
}

export interface WhatsappGreetingBatchResult {
  ran: boolean;
  reason?: string;
  dryRun: boolean;
  candidates: number;
  sent: number;
  failed: number;
  skippedInvalidNumber: number;
  pendingBeforeRun: number;
  pendingAfterRun: number;
  sentArtistIds: string[];
  failures: WhatsappGreetingFailure[];
  durationMs: number;
}

interface GreetingCandidate {
  id: string;
  stageName: string | null;
  contactNumber: string | null;
  whatsappNumber: string | null;
  user: {
    firstName: string | null;
    lastName: string | null;
    name: string | null;
    countryCode: string | null;
  } | null;
}

function resolveArtistName(artist: GreetingCandidate): string {
  const stage = artist.stageName?.trim();
  if (stage) return stage;

  const full = [artist.user?.firstName, artist.user?.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  if (full) return full;

  return artist.user?.name?.trim() || "Artist";
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function emptyResult(
  reason: string,
  dryRun = false,
): WhatsappGreetingBatchResult {
  return {
    ran: false,
    reason,
    dryRun,
    candidates: 0,
    sent: 0,
    failed: 0,
    skippedInvalidNumber: 0,
    pendingBeforeRun: 0,
    pendingAfterRun: 0,
    sentArtistIds: [],
    failures: [],
    durationMs: 0,
  };
}

export async function runWhatsappGreetingBatch(options: {
  limit: number;
  artistId?: string | null;
  force?: boolean;
  dryRun?: boolean;
}): Promise<WhatsappGreetingBatchResult> {
  const { limit, artistId = null, force = false, dryRun = false } = options;
  const startedAt = Date.now();

  if (limit <= 0) {
    return emptyResult("limit is 0 - greeting batch disabled", dryRun);
  }

  if (!isWhatsappConfigured() && !dryRun) {
    return emptyResult(
      "WhatsApp not configured (WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN missing)",
      dryRun,
    );
  }

  const where = {
    ...(artistId ? { id: artistId } : {}),
    ...(force ? {} : { isWhatsappGreetingSent: false }),
    // No number means nothing to send to - don't count them as failures.
    OR: [{ contactNumber: { not: null } }, { whatsappNumber: { not: null } }],
  };

  const [candidates, pendingBeforeRun] = await Promise.all([
    prisma.artist.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        stageName: true,
        contactNumber: true,
        whatsappNumber: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            name: true,
            countryCode: true,
          },
        },
      },
    }),
    prisma.artist.count({ where: { isWhatsappGreetingSent: false } }),
  ]);

  if (candidates.length === 0) {
    return {
      ...emptyResult("no artists pending a greeting", dryRun),
      ran: true,
      pendingBeforeRun,
      pendingAfterRun: pendingBeforeRun,
      durationMs: Date.now() - startedAt,
    };
  }

  console.log(
    `[WHATSAPP] ${candidates.length} artist(s) selected (${pendingBeforeRun} pending overall, dryRun=${dryRun})`,
  );

  let sent = 0;
  let failed = 0;
  let skippedInvalidNumber = 0;
  const failures: WhatsappGreetingFailure[] = [];
  const sentArtistIds: string[] = [];

  for (let index = 0; index < candidates.length; index++) {
    const artist = candidates[index];

    // 2s gap BETWEEN calls (not before the first one).
    if (index > 0) {
      await sleep(WHATSAPP_SEND_DELAY_MS);
    }

    const to = toWhatsappRecipient(
      artist.whatsappNumber || artist.contactNumber,
      artist.user?.countryCode,
    );

    if (!to) {
      skippedInvalidNumber++;
      failures.push({
        artistId: artist.id,
        to: null,
        error: "No valid Indian WhatsApp number",
      });
      console.warn(`[WHATSAPP] Artist ${artist.id}: unusable number, skipped`);
      continue;
    }

    const artistName = resolveArtistName(artist);
    const profileLink = buildArtistProfileLink(artist.id);

    if (dryRun) {
      sent++;
      sentArtistIds.push(artist.id);
      console.log(
        `[WHATSAPP] (dry run) would send to ${to} as "${artistName}" -> ${profileLink}`,
      );
      continue;
    }

    const result = await sendArtistWelcomeTemplate({
      to,
      artistName,
      profileLink,
    });

    if (result.success) {
      // Flip the flag only after Meta confirms the message id.
      await prisma.artist.update({
        where: { id: artist.id },
        data: { isWhatsappGreetingSent: true },
      });

      sent++;
      sentArtistIds.push(artist.id);
      console.log(
        `[WHATSAPP] Sent to ${to} (artist ${artist.id}, message ${result.messageId})`,
      );
      continue;
    }

    failed++;
    failures.push({
      artistId: artist.id,
      to,
      error: result.error || "Unknown error",
    });

    // Permanent failures would otherwise be retried forever, so mark them done
    // and surface them in the run metadata instead.
    if (result.isPermanentFailure) {
      await prisma.artist.update({
        where: { id: artist.id },
        data: { isWhatsappGreetingSent: true },
      });
      console.error(
        `[WHATSAPP] Permanent failure for artist ${artist.id} (${to}): ${result.error} - marked as sent to stop retries`,
      );
    } else {
      console.error(
        `[WHATSAPP] Temporary failure for artist ${artist.id} (${to}): ${result.error} - will retry next run`,
      );
    }
  }

  const pendingAfterRun = await prisma.artist.count({
    where: { isWhatsappGreetingSent: false },
  });

  return {
    ran: true,
    dryRun,
    candidates: candidates.length,
    sent,
    failed,
    skippedInvalidNumber,
    pendingBeforeRun,
    pendingAfterRun,
    sentArtistIds,
    failures,
    durationMs: Date.now() - startedAt,
  };
}

/**
 * Fire-and-forget wrapper for jobs that only want the side effect.
 *
 * Throttled to WHATSAPP_GREETING_RUNS_PER_DAY batches per day, so it can be
 * called from a cron that ticks far more often. Swallows every error so the
 * calling job can never be broken by it.
 */
export async function runWhatsappGreetingBatchSafely(
  limit = WHATSAPP_GREETINGS_PER_INSTAGRAM_RUN,
): Promise<
  | (WhatsappGreetingBatchResult & { nextEligibleAt?: string })
  | { ran: false; reason: string; nextEligibleAt?: string }
> {
  try {
    if (limit <= 0) {
      return { ran: false, reason: "limit is 0 - greeting batch disabled" };
    }

    const lastRun = await prisma.cronJob.findFirst({
      where: { jobName: THROTTLE_JOB_NAME },
      orderBy: { startedAt: "desc" },
      select: { startedAt: true },
    });

    const now = Date.now();

    if (lastRun) {
      const elapsed = now - lastRun.startedAt.getTime();

      if (elapsed < WHATSAPP_GREETING_MIN_INTERVAL_MS) {
        const nextEligibleAt = new Date(
          lastRun.startedAt.getTime() + WHATSAPP_GREETING_MIN_INTERVAL_MS,
        );
        const hoursLeft = (
          (WHATSAPP_GREETING_MIN_INTERVAL_MS - elapsed) /
          3600000
        ).toFixed(1);

        console.log(
          `[WHATSAPP] Throttled: last batch ${(elapsed / 3600000).toFixed(1)}h ago, ` +
            `${WHATSAPP_GREETING_RUNS_PER_DAY}x/day allows one every ` +
            `${(WHATSAPP_GREETING_MIN_INTERVAL_MS / 3600000).toFixed(1)}h. Next in ${hoursLeft}h.`,
        );

        return {
          ran: false,
          reason: `throttled to ${WHATSAPP_GREETING_RUNS_PER_DAY} runs/day`,
          nextEligibleAt: nextEligibleAt.toISOString(),
        };
      }
    }

    // Claim this slot BEFORE sending, so a long batch can't let the next cron
    // tick start a second one alongside it.
    const marker = await prisma.cronJob.create({
      data: { jobName: THROTTLE_JOB_NAME, status: "started" },
    });

    let result: WhatsappGreetingBatchResult;

    try {
      result = await runWhatsappGreetingBatch({ limit });
    } catch (error) {
      await prisma.cronJob
        .update({
          where: { id: marker.id },
          data: {
            status: "failed",
            completedAt: new Date(),
            error: error instanceof Error ? error.message : "Unknown error",
          },
        })
        .catch(() => {});
      throw error;
    }

    await prisma.cronJob
      .update({
        where: { id: marker.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          metadata: {
            sent: result.sent,
            failed: result.failed,
            candidates: result.candidates,
            pendingAfterRun: result.pendingAfterRun,
          },
        },
      })
      .catch(() => {});

    return {
      ...result,
      nextEligibleAt: new Date(
        now + WHATSAPP_GREETING_MIN_INTERVAL_MS,
      ).toISOString(),
    };
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Unknown greeting batch error";
    console.error("[WHATSAPP] Greeting batch failed (ignored):", error);
    return { ran: false, reason };
  }
}
