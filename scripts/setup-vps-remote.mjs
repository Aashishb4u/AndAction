// Script to setup VPS for file uploads
// Run with: node scripts/setup-vps-remote.mjs

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Client } = require("ssh2");

const config = {
  host: process.env.VPS_HOST || "72.62.227.114",
  port: 22,
  username: process.env.VPS_USER || "root",
  password: process.env.VPS_PASSWORD,
};

const commands = [
  "mkdir -p /var/www/uploads",
  "chmod 755 /var/www/uploads",
  // Install nginx if needed
  "apt-get update -qq",
  "apt-get install -y -qq nginx",
  // Write nginx config
  `cat > /etc/nginx/sites-available/uploads << 'NGINXEOF'
server {
    listen 80;
    server_name 72.62.227.114;

    client_max_body_size 100M;

    location /uploads/ {
        alias /var/www/uploads/;
        autoindex off;
        expires 30d;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options DENY;
        add_header Access-Control-Allow-Origin *;
    }

    location / {
        return 404;
    }
}
NGINXEOF`,
  "ln -sf /etc/nginx/sites-available/uploads /etc/nginx/sites-enabled/uploads",
  "rm -f /etc/nginx/sites-enabled/default",
  "nginx -t",
  "systemctl restart nginx",
  "systemctl enable nginx",
  "echo '=== VPS SETUP COMPLETE ==='",
];

function runCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let output = "";
      stream.on("data", (data) => {
        output += data.toString();
        process.stdout.write(data.toString());
      });
      stream.stderr.on("data", (data) => {
        process.stderr.write(data.toString());
      });
      stream.on("close", (code) => {
        resolve({ code, output });
      });
    });
  });
}

const conn = new Client();
conn
  .on("ready", async () => {
    console.log("Connected to VPS!\n");
    for (const cmd of commands) {
      console.log(`\n> ${cmd.substring(0, 60)}...`);
      try {
        await runCommand(conn, cmd);
      } catch (e) {
        console.error(`Error running command: ${e.message}`);
      }
    }
    conn.end();
    console.log("\nDone! Files will be served at http://72.62.227.114/uploads/");
  })
  .on("error", (err) => {
    console.error("Connection error:", err.message);
  })
  .connect(config);
