export type WhatsappReportDeliveryStatus =
  | "PENDING"
  | "SENT"
  | "DELIVERED"
  | "READ"
  | "FAILED";

export interface WhatsappReportDeliveryRow {
  status: WhatsappReportDeliveryStatus;
  sentAt: Date | null;
  deliveredAt: Date | null;
  readAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
}

export interface WhatsappDeliveryEvent {
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: Date;
  failureReason: string | null;
}

const RANK: Record<Exclude<WhatsappReportDeliveryStatus, "FAILED">, number> = {
  PENDING: 0,
  SENT: 1,
  DELIVERED: 2,
  READ: 3,
};

/**
 * Applies one Meta status without moving a report backwards.
 * FAILED replaces SENT, DELIVERED, or PENDING. It does not replace READ.
 */
export function applyDeliveryEvent(
  current: WhatsappReportDeliveryRow,
  event: WhatsappDeliveryEvent,
): WhatsappReportDeliveryRow {
  if (event.status === "failed") {
    if (current.status === "READ" || current.status === "FAILED") {
      return {
        ...current,
        failedAt: current.failedAt ?? event.timestamp,
        failureReason: current.failureReason ?? event.failureReason,
      };
    }
    return {
      ...current,
      status: "FAILED",
      failedAt: event.timestamp,
      failureReason: event.failureReason,
    };
  }

  const nextStatus = event.status.toUpperCase() as Exclude<
    WhatsappReportDeliveryStatus,
    "PENDING" | "FAILED"
  >;
  const keepStatus =
    current.status === "FAILED" || RANK[current.status] >= RANK[nextStatus]
      ? current.status
      : nextStatus;

  return {
    status: keepStatus,
    sentAt:
      event.status === "sent" ? current.sentAt ?? event.timestamp : current.sentAt,
    deliveredAt:
      event.status === "delivered"
        ? current.deliveredAt ?? event.timestamp
        : current.deliveredAt,
    readAt:
      event.status === "read" ? current.readAt ?? event.timestamp : current.readAt,
    failedAt: current.failedAt,
    failureReason: current.failureReason,
  };
}

export function acceptedSendRecord(input: {
  message: string;
  messageId: string;
  sentAt: Date;
}) {
  return {
    status: "SENT" as const,
    message: input.message,
    messageId: input.messageId,
    sentAt: input.sentAt,
  };
}

export function verifyWebhookSubscription(input: {
  mode: string | null;
  verifyToken: string | null;
  challenge: string | null;
  expectedToken: string | undefined;
}): { ok: true; challenge: string } | { ok: false } {
  if (
    input.mode === "subscribe" &&
    input.expectedToken &&
    input.verifyToken === input.expectedToken &&
    input.challenge
  ) {
    return { ok: true, challenge: input.challenge };
  }
  return { ok: false };
}

export function metaStatusTimestamp(value: unknown, fallback: Date): Date {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return fallback;
  return new Date(seconds * 1000);
}

export function metaFailureReason(errors: unknown): string | null {
  if (!Array.isArray(errors) || errors.length === 0) return null;
  const parts = errors.map((error) => {
    if (!error || typeof error !== "object") return "";
    const record = error as { title?: unknown; message?: unknown; code?: unknown };
    const title = typeof record.title === "string" ? record.title : "";
    const message = typeof record.message === "string" ? record.message : "";
    const code = record.code != null ? String(record.code) : "";
    return [title, message, code ? `code ${code}` : ""].filter(Boolean).join(": ");
  });
  const text = parts.filter(Boolean).join("; ");
  return text || null;
}
