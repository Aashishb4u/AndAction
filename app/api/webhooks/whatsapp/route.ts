import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  applyDeliveryEvent,
  metaFailureReason,
  metaStatusTimestamp,
  verifyWebhookSubscription,
  type WhatsappDeliveryEvent,
} from "@/lib/whatsapp-report-delivery";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const result = verifyWebhookSubscription({
    mode: params.get("hub.mode"),
    verifyToken: params.get("hub.verify_token"),
    challenge: params.get("hub.challenge"),
    expectedToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
  });

  if (!result.ok) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return new NextResponse(result.challenge, { status: 200 });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const statuses = collectStatuses(body);
  let matched = 0;

  for (const item of statuses) {
    const report = await prisma.whatsappReport.findFirst({
      where: { messageId: item.wamid },
      select: {
        id: true,
        status: true,
        sentAt: true,
        deliveredAt: true,
        readAt: true,
        failedAt: true,
        failureReason: true,
      },
    });

    if (!report) {
      console.log(
        `[WHATSAPP] delivery status ignored wamid=${item.wamid} status=${item.event.status} at=${item.event.timestamp.toISOString()}`,
      );
      continue;
    }

    const next = applyDeliveryEvent(
      {
        status: report.status,
        sentAt: report.sentAt,
        deliveredAt: report.deliveredAt,
        readAt: report.readAt,
        failedAt: report.failedAt,
        failureReason: report.failureReason,
      },
      item.event,
    );

    await prisma.whatsappReport.update({
      where: { id: report.id },
      data: next,
    });
    matched++;
    console.log(
      `[WHATSAPP] delivery status wamid=${item.wamid} status=${item.event.status} reportId=${report.id} at=${item.event.timestamp.toISOString()} stored=${next.status}`,
    );
  }

  return NextResponse.json({ success: true, matched });
}

function collectStatuses(body: unknown): { wamid: string; event: WhatsappDeliveryEvent }[] {
  if (!body || typeof body !== "object") return [];
  const entries = (body as { entry?: unknown }).entry;
  if (!Array.isArray(entries)) return [];

  const found: { wamid: string; event: WhatsappDeliveryEvent }[] = [];
  for (const entry of entries) {
    const changes = (entry as { changes?: unknown })?.changes;
    if (!Array.isArray(changes)) continue;
    for (const change of changes) {
      const statuses = (change as { value?: { statuses?: unknown } })?.value?.statuses;
      if (!Array.isArray(statuses)) continue;
      for (const status of statuses) {
        const parsed = parseStatus(status);
        if (parsed) found.push(parsed);
      }
    }
  }
  return found;
}

function parseStatus(status: unknown): { wamid: string; event: WhatsappDeliveryEvent } | null {
  if (!status || typeof status !== "object") return null;
  const record = status as {
    id?: unknown;
    status?: unknown;
    timestamp?: unknown;
    errors?: unknown;
  };
  const wamid = typeof record.id === "string" ? record.id : "";
  const name = typeof record.status === "string" ? record.status : "";
  if (!wamid || !isDeliveryStatus(name)) return null;
  return {
    wamid,
    event: {
      status: name,
      timestamp: metaStatusTimestamp(record.timestamp, new Date()),
      failureReason: name === "failed" ? metaFailureReason(record.errors) : null,
    },
  };
}

function isDeliveryStatus(
  value: string,
): value is WhatsappDeliveryEvent["status"] {
  return value === "sent" || value === "delivered" || value === "read" || value === "failed";
}
