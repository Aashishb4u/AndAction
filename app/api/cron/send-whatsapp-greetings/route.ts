/**
 * app/api/cron/send-whatsapp-greetings/route.ts
 *
 * Manual / standalone trigger for the artist WhatsApp welcome greeting.
 *
 * The same batch can also run from the Instagram refresh cron, so this
 * endpoint exists for testing, targeting a single artist, or draining the
 * backlog faster when explicitly enabled.
 *
 * GET /api/cron/send-whatsapp-greetings
 *   ?limit=50        how many artists this run handles
 *   ?artistId=<id>   target a single artist
 *   ?force=true      ignore isWhatsappGreetingSent (requires artistId)
 *   ?dryRun=true     resolve recipients but send nothing and write nothing
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isWhatsappConfigured } from "@/lib/whatsapp";
import {
  runWhatsappGreetingBatch,
  WHATSAPP_MAX_PER_RUN,
} from "@/lib/whatsapp-greetings";
import type { Prisma } from "@prisma/client";

const ENABLE_STANDALONE_WHATSAPP_GREETING_ROUTE = false;
const JOB_NAME = "send-whatsapp-greetings";

/** A run "started" longer ago than this is treated as dead, not active. */
const STALE_LOCK_MINUTES = Math.max(
  Number(process.env.WHATSAPP_GREETING_STALE_LOCK_MINUTES || 30),
  1,
);

export async function GET(request: NextRequest) {
  let cronJobId: string | null = null;

  const cronSecret = process.env.CRON_SECRET;
  const bearerMatch = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(.+)$/i);
  const providedSecret =
    bearerMatch?.[1] ||
    request.headers.get("x-cron-secret") ||
    request.nextUrl.searchParams.get("token") ||
    request.nextUrl.searchParams.get("secret");

  if (cronSecret && providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ENABLE_STANDALONE_WHATSAPP_GREETING_ROUTE) {
    return NextResponse.json(
      {
        success: false,
        error:
          "This endpoint is disabled. WhatsApp greetings only run from /api/cron/refresh-instagram-urls.",
      },
      { status: 410 },
    );
  }

  try {
    const params = request.nextUrl.searchParams;
    const artistId = params.get("artistId");
    const force = params.get("force")?.toLowerCase() === "true";
    const dryRun = params.get("dryRun")?.toLowerCase() === "true";
    const limitParam = Number(params.get("limit"));
    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.floor(limitParam)
        : WHATSAPP_MAX_PER_RUN;

    if (force && !artistId) {
      return NextResponse.json(
        { success: false, error: "artistId is required when force=true" },
        { status: 400 },
      );
    }

    if (!isWhatsappConfigured() && !dryRun) {
      return NextResponse.json(
        {
          success: false,
          error:
            "WhatsApp is not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN.",
        },
        { status: 503 },
      );
    }

    const staleBefore = new Date(Date.now() - STALE_LOCK_MINUTES * 60 * 1000);
    const activeJob = await prisma.cronJob.findFirst({
      where: {
        jobName: JOB_NAME,
        status: "started",
        completedAt: null,
        startedAt: { gt: staleBefore },
      },
      orderBy: { startedAt: "desc" },
    });

    if (activeJob && !artistId) {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: "WhatsApp greeting job is already running",
        activeCronJobId: activeJob.id,
        activeCronJobStartedAt: activeJob.startedAt.toISOString(),
      });
    }

    const job = await prisma.cronJob.create({
      data: { jobName: JOB_NAME, status: "started" },
    });
    cronJobId = job.id;

    const result = await runWhatsappGreetingBatch({
      limit,
      artistId,
      force,
      dryRun,
    });

    const metadata = {
      ...result,
      forced: force,
      targetedArtistId: artistId,
      limit,
    };

    await prisma.cronJob.update({
      where: { id: cronJobId },
      data: {
        status: "completed",
        completedAt: new Date(),
        metadata: metadata as unknown as Prisma.InputJsonValue,
      },
    });

    console.log("[WHATSAPP] Job completed:", {
      sent: result.sent,
      failed: result.failed,
      skippedInvalidNumber: result.skippedInvalidNumber,
    });

    return NextResponse.json({
      success: true,
      message: dryRun
        ? "Dry run completed - nothing sent, nothing updated"
        : "WhatsApp greeting run completed",
      ...metadata,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (cronJobId) {
      await prisma.cronJob
        .update({
          where: { id: cronJobId },
          data: {
            status: "failed",
            completedAt: new Date(),
            error: errorMessage,
          },
        })
        .catch(() => {});
    }

    console.error("[WHATSAPP] Job failed:", error);

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
