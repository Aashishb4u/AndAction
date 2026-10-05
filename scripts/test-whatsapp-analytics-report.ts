import assert from "node:assert/strict";
import {
  formatWhatsappAnalyticsMessage,
  isReportDue,
  reportPeriod,
} from "../lib/whatsapp-analytics-report";

const day = 24 * 60 * 60 * 1000;
const now = new Date("2026-10-05T03:30:00.000Z"); // 09:00 IST

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

console.log("whatsapp analytics report checks passed");
