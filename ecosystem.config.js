module.exports = {
  apps: [
    {
      name: "andaction-cron",
      script: "./scripts/cron-jobs.js",
      cwd: __dirname,
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      time: true,
      max_restarts: 10,
      restart_delay: 5000,
      env: {
        NODE_ENV: "production",
        CRON_TIMEZONE: process.env.CRON_TIMEZONE || "Asia/Kolkata",
        CRON_REQUEST_TIMEOUT_MS:
          process.env.CRON_REQUEST_TIMEOUT_MS || "60000",
        CRON_RUN_ON_STARTUP: process.env.CRON_RUN_ON_STARTUP || "false",
      },
    },
  ],
};
