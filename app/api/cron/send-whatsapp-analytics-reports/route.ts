import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { runWhatsappAnalyticsReportTick } from "@/lib/whatsapp-analytics-report";

const JOB_NAME = "send-whatsapp-analytics-reports";

export async function GET(request: NextRequest) {
  const cronJobId = await createCronJobRecord(JOB_NAME);

  try {
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = getProvidedSecret(request);

    if (cronSecret && providedSecret !== cronSecret) {
      await updateCronJobRecord(cronJobId, "failed", "Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await runWhatsappAnalyticsReportTick();
    await updateCronJobRecord(
      cronJobId,
      "completed",
      null,
      result as unknown as Prisma.InputJsonValue,
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[CRON] WhatsApp analytics reports failed:", error);
    await updateCronJobRecord(cronJobId, "failed", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

function getProvidedSecret(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  const bearerMatch = authHeader?.match(/^Bearer\s+(.+)$/i);
  const headerToken = bearerMatch?.[1] ?? null;
  const queryToken =
    request.nextUrl.searchParams.get("token") ||
    request.nextUrl.searchParams.get("secret");

  return headerToken || request.headers.get("x-cron-secret") || queryToken;
}

async function createCronJobRecord(jobName: string): Promise<string> {
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
    where: { id },
    data: {
      status,
      completedAt: new Date(),
      error,
      metadata,
    },
  });
}
