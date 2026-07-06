/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const cron = require("node-cron");

// Load environment variables using an absolute path so PM2 can start from any cwd.
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = (process.env.CRON_APP_URL || "http://127.0.0.1:3000").replace(
  /\/+$/,
  "",
);
const CRON_TIMEZONE = process.env.CRON_TIMEZONE || "Asia/Kolkata";
const REQUEST_TIMEOUT_MS = Number(process.env.CRON_REQUEST_TIMEOUT_MS || 60000);
const RUN_ON_STARTUP = process.env.CRON_RUN_ON_STARTUP === "true";

const JOBS = [
  {
    name: "Instagram URL Refresh",
    slug: "refresh-instagram-urls",
    schedule: "0 6 * * *",
    endpoint: "/api/cron/refresh-instagram-urls",
  },
  {
    name: "YouTube 7-day Rolling Sync",
    slug: "sync-youtube-videos",
    schedule: "30 0 * * *",
    endpoint: "/api/cron/sync-youtube-videos",
  },
];

if (!CRON_SECRET) {
  console.error("❌ CRON_SECRET not found in environment variables");
  process.exit(1);
}

if (typeof fetch !== "function") {
  console.error(
    "❌ Global fetch is unavailable. Run this script with Node.js 18+.",
  );
  process.exit(1);
}

try {
  new URL(APP_URL);
} catch {
  console.error(`❌ Invalid APP_URL/CRON_APP_URL: ${APP_URL}`);
  process.exit(1);
}

console.log("🚀 Cron Jobs Runner Started");
console.log(`📍 Target URL: ${APP_URL}`);
console.log(`🌍 Timezone: ${CRON_TIMEZONE}`);
console.log(`⏱️ Request timeout: ${REQUEST_TIMEOUT_MS}ms`);

async function runJob(job) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`⏰ [${new Date().toISOString()}] Running ${job.name}`);
  console.log("=".repeat(60));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${APP_URL}${job.endpoint}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
        "x-cron-source": "pm2-node-cron",
      },
      signal: controller.signal,
    });

    const responseText = await response.text();
    let data = responseText;

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      // Keep raw text if endpoint does not return JSON.
    }

    if (response.ok) {
      console.log(`✅ ${job.slug} completed successfully`);
      console.log("📊 Results:", JSON.stringify(data, null, 2));
    } else {
      console.error(`❌ ${job.slug} failed with status ${response.status}`);
      console.error("📄 Response:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    const message =
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "AbortError"
        ? `Request timed out after ${REQUEST_TIMEOUT_MS}ms`
        : error.message;
    console.error(`❌ Error running ${job.slug}:`, message);
  } finally {
    clearTimeout(timeout);
    console.log("=".repeat(60) + "\n");
  }
}

JOBS.forEach((job) => {
  cron.schedule(job.schedule, () => runJob(job), {
    scheduled: true,
    timezone: CRON_TIMEZONE,
  });
});

if (RUN_ON_STARTUP) {
  console.log(
    "▶️ CRON_RUN_ON_STARTUP=true, running all jobs once at startup...",
  );
  JOBS.forEach((job) => {
    runJob(job).catch((error) => {
      console.error(`❌ Startup run failed for ${job.slug}:`, error.message);
    });
  });
}

console.log("\n📅 Scheduled Jobs:");
JOBS.forEach((job) => {
  console.log(
    `  - ${job.name}: ${job.schedule} (${CRON_TIMEZONE}) -> ${job.endpoint}`,
  );
});
console.log("\n✨ Waiting for scheduled tasks...\n");

// Keep the process running
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down cron jobs...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n👋 Received SIGTERM. Shutting down cron jobs...");
  process.exit(0);
});

process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled promise rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught exception:", error);
  process.exit(1);
});
