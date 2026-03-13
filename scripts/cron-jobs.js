const cron = require("node-cron");

// Load environment variables
require("dotenv").config({ path: ".env" });

const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

if (!CRON_SECRET) {
  console.error("❌ CRON_SECRET not found in environment variables");
  process.exit(1);
}

console.log("🚀 Cron Jobs Runner Started");
console.log(`📍 Target URL: ${APP_URL}`);

cron.schedule(
  "0 0 * * *",
  async () => {
    console.log(`\n${"=".repeat(60)}`);
    console.log(
      `⏰ [${new Date().toISOString()}] Running Instagram URL Refresh`,
    );
    console.log("=".repeat(60));

    try {
      const response = await fetch(
        `${APP_URL}/api/cron/refresh-instagram-urls`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${CRON_SECRET}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        console.log("✅ Job completed successfully");
        console.log("📊 Results:", JSON.stringify(data, null, 2));
      } else {
        console.error("❌ Job failed");
        console.error("📄 Response:", JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error("❌ Error running cron job:", error.message);
    }

    console.log("=".repeat(60) + "\n");
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata", // India timezone (IST - UTC+5:30)
  },
);

cron.schedule(
  "30 0 * * *",
  async () => {
    console.log(`\n${"=".repeat(60)}`);
    console.log(
      `⏰ [${new Date().toISOString()}] Running YouTube 7-day Rolling Sync`,
    );
    console.log("=".repeat(60));

    try {
      const response = await fetch(
        `${APP_URL}/api/cron/sync-youtube-videos`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${CRON_SECRET}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        console.log("✅ Job completed successfully");
        console.log("📊 Results:", JSON.stringify(data, null, 2));
      } else {
        console.error("❌ Job failed");
        console.error("📄 Response:", JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error("❌ Error running cron job:", error.message);
    }

    console.log("=".repeat(60) + "\n");
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata", // India timezone (IST - UTC+5:30)
  },
);

console.log("\n📅 Scheduled Jobs:");
console.log(
  "  - Instagram URL Refresh: Daily at 00:00 IST (midnight India time)",
);
console.log(
  "  - YouTube 7-day Rolling Sync: Daily at 00:30 IST (per artist every ~7 days)",
);
console.log("\n✨ Waiting for scheduled tasks...\n");

// Keep the process running
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down cron jobs...");
  process.exit(0);
});
