#!/bin/bash
# VPS Setup Script for AndAction file uploads
# This script configures Nginx to serve uploaded files
# Run on the VPS: ssh root@72.62.227.114

set -e

echo "=== Setting up VPS for file uploads ==="

# Create upload directory
mkdir -p /var/www/uploads
chmod 755 /var/www/uploads

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    apt-get update
    apt-get install -y nginx
fi

# Create Nginx config for serving uploads
cat > /etc/nginx/sites-available/uploads <<'EOF'
server {
    listen 80;
    server_name 72.62.227.114;

    # Serve uploaded files
    location /uploads/ {
        alias /var/www/uploads/;
        autoindex off;

        # Cache static assets
        expires 30d;
        add_header Cache-Control "public, immutable";

        # Security headers
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options DENY;

        # Allow cross-origin requests for media
        add_header Access-Control-Allow-Origin *;

        # Limit file types served
        location ~* \.(jpg|jpeg|png|gif|webp|svg|mp4|mov|webm|avi)$ {
            try_files $uri =404;
        }
    }

    # Block everything else
    location / {
        return 404;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/uploads /etc/nginx/sites-enabled/uploads

# Remove default site if exists
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx

echo "=== VPS setup complete ==="
echo "Upload directory: /var/www/uploads"
echo "Files will be accessible at: http://72.62.227.114/uploads/"
