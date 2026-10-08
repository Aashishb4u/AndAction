import assert from "node:assert/strict";
import {
  formatWhatsappAnalyticsMessage,
  isReportDue,
  isWhatsappReportCronPaused,
  reportPeriod,
} from "../lib/whatsapp-analytics-report";
import {
  acceptedSendRecord,
  applyDeliveryEvent,
  verifyWebhookSubscription,
  type WhatsappReportDeliveryRow,
} from "../lib/whatsapp-report-delivery";

const day = 24 * 60 * 60 * 1000;
const now = new Date("2026-10-05T03:30:00.000Z"); // 09:00 IST

assert.equal(isWhatsappReportCronPaused(null), false, "missing control stays active");
assert.equal(isWhatsappReportCronPaused(undefined), false, "unset control stays active");
assert.equal(isWhatsappReportCronPaused(false), false, "explicit resume stays active");
assert.equal(isWhatsappReportCronPaused(true), true, "admin pause stops new sends");

assert.equal(isReportDue(null, 7, now), true, "weekly with no previous report");
assert.equal(
  isReportDue(new Date(now.getTime() - 6 * day), 7, now),
  false,
  "weekly last report under 7 days",
);
assert.equal(
  isReportDue(new Date(now.getTime() - 7 * day), 7, now),
  true,
  "weekly report due",
);
assert.equal(isReportDue(null, 30, now), true, "monthly with no previous report");
assert.equal(
  isReportDue(new Date(now.getTime() - 29 * day), 30, now),
  false,
  "monthly last report under 30 days",
);
assert.equal(
  isReportDue(new Date(now.getTime() - 30 * day), 30, now),
  true,
  "monthly report due",
);

const weekly = reportPeriod(7, now);
assert.equal(weekly.from, "2026-09-28");
assert.equal(weekly.to, "2026-10-05");
assert.equal(weekly.label, "28 Sep → 05 Oct");

const message = formatWhatsappAnalyticsMessage({
  periodLabel: weekly.label,
  profileViews: 12,
  whatsappClicks: 3,
  callClicks: 1,
  platformUsers: 4,
  visitors: 8,
});
assert.match(message, /Profile Views: 12/);
assert.match(message, /Platform Users: 4/);
assert.match(message, /Visitors: 8/);
assert.doesNotMatch(message, /phone|name/i);

const again = reportPeriod(7, now);
assert.deepEqual(
  [again.periodStart.toISOString(), again.periodEnd.toISOString()],
  [weekly.periodStart.toISOString(), weekly.periodEnd.toISOString()],
  "same reporting period is stable so the unique key blocks a second send",
);

const sentAt = new Date("2026-10-05T04:00:00.000Z");
const accepted = acceptedSendRecord({
  message: message,
  messageId: "wamid.accepted",
  sentAt,
});
assert.equal(accepted.status, "SENT");
assert.equal(accepted.messageId, "wamid.accepted");
assert.equal(accepted.sentAt, sentAt);

const base = (status: WhatsappReportDeliveryRow["status"]): WhatsappReportDeliveryRow => ({
  status,
  sentAt: status === "PENDING" ? null : sentAt,
  deliveredAt: null,
  readAt: null,
  failedAt: null,
  failureReason: null,
});

const at = (iso: string) => new Date(iso);

const afterSent = applyDeliveryEvent(base("SENT"), {
  status: "sent",
  timestamp: at("2026-10-05T04:01:00.000Z"),
  failureReason: null,
});
assert.equal(afterSent.status, "SENT");

const delivered = applyDeliveryEvent(afterSent, {
  status: "delivered",
  timestamp: at("2026-10-05T04:02:00.000Z"),
  failureReason: null,
});
assert.equal(delivered.status, "DELIVERED");
assert.ok(delivered.deliveredAt);

const read = applyDeliveryEvent(delivered, {
  status: "read",
  timestamp: at("2026-10-05T04:03:00.000Z"),
  failureReason: null,
});
assert.equal(read.status, "READ");
assert.ok(read.readAt);

const failed = applyDeliveryEvent(base("SENT"), {
  status: "failed",
  timestamp: at("2026-10-05T04:04:00.000Z"),
  failureReason: "Message undeliverable: code 131026",
});
assert.equal(failed.status, "FAILED");
assert.equal(failed.failureReason, "Message undeliverable: code 131026");
assert.ok(failed.failedAt);

const duplicate = applyDeliveryEvent(delivered, {
  status: "delivered",
  timestamp: at("2026-10-05T05:00:00.000Z"),
  failureReason: null,
});
assert.equal(duplicate.status, "DELIVERED");
assert.equal(duplicate.deliveredAt?.toISOString(), delivered.deliveredAt?.toISOString());

const noDowngrade = applyDeliveryEvent(read, {
  status: "delivered",
  timestamp: at("2026-10-05T04:02:30.000Z"),
  failureReason: null,
});
assert.equal(noDowngrade.status, "READ");

const readStays = applyDeliveryEvent(read, {
  status: "failed",
  timestamp: at("2026-10-05T04:05:00.000Z"),
  failureReason: "late failure",
});
assert.equal(readStays.status, "READ");

assert.deepEqual(
  verifyWebhookSubscription({
    mode: "subscribe",
    verifyToken: "wrong",
    challenge: "123",
    expectedToken: "expected",
  }),
  { ok: false },
);
assert.deepEqual(
  verifyWebhookSubscription({
    mode: "subscribe",
    verifyToken: null,
    challenge: "123",
    expectedToken: undefined,
  }),
  { ok: false },
);
const verified = verifyWebhookSubscription({
  mode: "subscribe",
  verifyToken: "expected",
  challenge: "123",
  expectedToken: "expected",
});
assert.equal(verified.ok, true);

console.log("whatsapp analytics report checks passed");
