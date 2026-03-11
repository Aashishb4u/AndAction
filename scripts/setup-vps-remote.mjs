// Script to setup VPS for file uploads via HTTP
// Run with: VPS_PASSWORD=Vishantt@8474 node scripts/setup-vps-remote.mjs

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Client } = require("ssh2");

const config = {
  host: process.env.VPS_HOST || "72.62.227.114",
  port: 22,
  username: process.env.VPS_USER || "root",
  password: process.env.VPS_PASSWORD,
};

// Node.js upload server that will run on the VPS
const uploadServerCode = `
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = '/var/www/uploads';
const PORT = 3089;
const UPLOAD_SECRET = process.env.VPS_UPLOAD_SECRET || '';

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-upload-secret, x-file-key');

  if (req.method === 'OPTIONS') { res.writeHead(200); return res.end(); }

  // Auth check
  if (UPLOAD_SECRET && req.headers['x-upload-secret'] !== UPLOAD_SECRET) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Forbidden' }));
  }

  // Upload
  if (req.method === 'POST' && req.url === '/upload') {
    const fileKey = req.headers['x-file-key'];
    if (!fileKey) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'x-file-key header required' }));
    }

    // Sanitize key to prevent path traversal
    const sanitized = path.normalize(fileKey).replace(/^\\.\\.([\\\\/]|$)/g, '');
    const filePath = path.join(UPLOAD_DIR, sanitized);
    if (!filePath.startsWith(UPLOAD_DIR)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid file key' }));
    }

    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });

    const ws = fs.createWriteStream(filePath);
    req.pipe(ws);
    ws.on('finish', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, key: sanitized }));
    });
    ws.on('error', (err) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // Delete
  if (req.method === 'DELETE' && req.url === '/delete') {
    const fileKey = req.headers['x-file-key'];
    if (!fileKey) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'x-file-key header required' }));
    }

    const sanitized = path.normalize(fileKey).replace(/^\\.\\.([\\\\/]|$)/g, '');
    const filePath = path.join(UPLOAD_DIR, sanitized);
    if (!filePath.startsWith(UPLOAD_DIR)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid file key' }));
    }

    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('Upload server running on port ' + PORT);
});
`;

const commands = [
  "mkdir -p /var/www/uploads",
  "chmod 755 /var/www/uploads",
  // Install Node.js if not available
  "which node || (curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs)",
  // Install nginx if needed
  "apt-get update -qq 2>/dev/null",
  "apt-get install -y -qq nginx 2>/dev/null",
  // Write the upload server
  `cat > /opt/upload-server.js << 'UPLOADEOF'
${uploadServerCode}
UPLOADEOF`,
  // Create systemd service for the upload server
  `cat > /etc/systemd/system/upload-server.service << 'SERVICEEOF'
[Unit]
Description=File Upload Server
After=network.target

[Service]
ExecStart=/usr/bin/node /opt/upload-server.js
Restart=always
Environment=VPS_UPLOAD_SECRET=andaction-upload-secret-key-2026
WorkingDirectory=/opt

[Install]
WantedBy=multi-user.target
SERVICEEOF`,
  "systemctl daemon-reload",
  "systemctl enable upload-server",
  "systemctl restart upload-server",
  // Write nginx config — proxy /api/upload to Node server, serve /uploads/ as static
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

    location /api/upload {
        proxy_pass http://127.0.0.1:3089/upload;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 100M;
    }

    location /api/delete {
        proxy_pass http://127.0.0.1:3089/delete;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
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
  // Verify
  "sleep 1 && systemctl is-active upload-server && echo '=== VPS SETUP COMPLETE ==='",
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
