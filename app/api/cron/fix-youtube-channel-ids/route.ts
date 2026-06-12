import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const cronJobId = await createCronJobRecord(
    "fix-youtube-channel-ids",
  );

  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    const bearerMatch = authHeader?.match(/^Bearer\s+(.+)$/i);
    const headerToken = bearerMatch?.[1] ?? null;

    const queryToken =
      request.nextUrl.searchParams.get("token") ||
      request.nextUrl.searchParams.get("secret");

    const providedSecret =
      headerToken || request.headers.get("x-cron-secret") || queryToken;

    if (cronSecret && providedSecret !== cronSecret) {
      await updateCronJobRecord(
        cronJobId,
        "failed",
        "Unauthorized",
      );

      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    console.log(
      "[CRON] Starting YouTube Channel ID repair...",
    );

    const artists = await prisma.artist.findMany({
      where: {
        OR: [
          {
            youtubeChannelId: null,
          },
          {
            youtubeChannelId: {
              startsWith: "UU",
            },
          },
        ],
      },
      select: {
        id: true,
        stageName: true,
        youtubeChannelId: true,
      },
    });

    console.log(
      `[CRON] Found ${artists.length} artists to repair`,
    );

    let processed = 0;
    let fixedUU = 0;
    let fixedNull = 0;
    let errors = 0;

    const errorMessages: string[] = [];

    for (const artist of artists) {
      try {
        console.log(
          `[CRON] Processing ${artist.stageName}`,
        );

        /**
         * Case 1:
         * Upload Playlist ID stored instead of Channel ID
         *
         * UUxxxxxxxxxxxxx
         * ->
         * UCxxxxxxxxxxxxx
         */
        if (
          artist.youtubeChannelId &&
          artist.youtubeChannelId.startsWith("UU")
        ) {
          const channelId =
            "UC" + artist.youtubeChannelId.substring(2);

          await prisma.artist.update({
            where: {
              id: artist.id,
            },
            data: {
              youtubeChannelId: channelId,
            },
          });

          fixedUU++;
          processed++;

          console.log(
            `[CRON] Fixed playlist ID -> channel ID for ${artist.stageName}`,
          );

          continue;
        }

        /**
         * Case 2:
         * Missing YouTube channel ID
         */
        if (!artist.youtubeChannelId) {
         const channelId = await searchYoutubeChannel(
                artist.stageName ?? "",
          );
          if (!channelId) {
            throw new Error(
              "No YouTube channel found",
            );
          }

          await prisma.artist.update({
            where: {
              id: artist.id,
            },
            data: {
              youtubeChannelId: channelId,
            },
          });

          fixedNull++;
          processed++;

          console.log(
            `[CRON] Found channel ${channelId} for ${artist.stageName}`,
          );
        }
      } catch (error) {
        errors++;

        const message =
          error instanceof Error
            ? error.message
            : "Unknown error";

        errorMessages.push(
          `${artist.stageName}: ${message}`,
        );

        console.error(
          `[CRON] Error fixing ${artist.stageName}`,
          error,
        );
      }
    }

    const metadata = {
      artistsFound: artists.length,
      processed,
      fixedUU,
      fixedNull,
      errors,
      errorMessages,
    };

    await updateCronJobRecord(
      cronJobId,
      "completed",
      null,
      metadata,
    );

    return NextResponse.json({
      success: true,
      message:
        "YouTube Channel ID repair completed",
      ...metadata,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error";

    await updateCronJobRecord(
      cronJobId,
      "failed",
      errorMessage,
    );

    console.error(
      "[CRON] YouTube Channel ID repair failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      {
        status: 500,
      },
    );
  }
}

async function searchYoutubeChannel(
  artistName: string,
): Promise<string | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "YOUTUBE_API_KEY is missing",
    );
  }

  const url =
    `https://www.googleapis.com/youtube/v3/search` +
    `?part=snippet` +
    `&q=${encodeURIComponent(artistName)}` +
    `&type=channel` +
    `&maxResults=1` +
    `&key=${apiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `YouTube search failed: ${errorText}`,
    );
  }

  const data = await response.json();

  return (
    data?.items?.[0]?.id?.channelId || null
  );
}

async function createCronJobRecord(
  jobName: string,
): Promise<string> {
  const cronJob = await prisma.cronJob.create({
    data: {
      jobName,
      status: "started",
    },
  });

  return cronJob.id;
}

async function updateCronJobRecord(
  id: string,
  status: "completed" | "failed",
  error: string | null = null,
  metadata:
    | Prisma.InputJsonValue
    | Prisma.NullableJsonNullValueInput
    | undefined = undefined,
): Promise<void> {
  await prisma.cronJob.update({
    where: {
      id,
    },
    data: {
      status,
      completedAt: new Date(),
      error,
      metadata,
    },
  });
}