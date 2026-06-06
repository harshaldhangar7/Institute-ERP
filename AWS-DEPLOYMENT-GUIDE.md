# Institute ERP — AWS EC2 Deployment Guide

## Prerequisites
- AWS Account
- A domain name (optional but recommended)
- Institute ERP project files

---

## Step 1: Launch an EC2 Instance

1. Go to **AWS Console → EC2 → Launch Instance**
2. Choose:
   - **Name:** `institute-erp`
   - **AMI:** Ubuntu Server 24.04 LTS (Free tier eligible)
   - **Instance type:** `t2.small` (recommended) or `t2.micro` (free tier)
   - **Key pair:** Create new → Download `.pem` file (keep it safe!)
3. Under **Network settings:**
   - Allow SSH (port 22) — Your IP only
   - Allow HTTP (port 80) — Anywhere
   - Allow HTTPS (port 443) — Anywhere
   - Allow Custom TCP port **5000** — Anywhere (for direct access)
4. **Storage:** 20 GB (default is fine)
5. Click **Launch Instance**

---

## Step 2: Connect to Your Server

On Windows, open PowerShell:

```powershell
# Set permissions on key file (Windows)
icacls "C:\path\to\your-key.pem" /inheritance:r /grant:r "%username%":"(R)"

# Connect via SSH
ssh -i "C:\path\to\your-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP
```

---

## Step 3: Install Dependencies on Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Apply group changes (re-login or run)
newgrp docker

# Verify
docker --version
docker-compose --version
```

---

## Step 4: Upload Your Project

On your **local Windows machine** (PowerShell):

```powershell
# Zip the project (excluding node_modules and venv)
# First create a .zip excluding unwanted folders
cd e:\Institute-ERP

# Upload to EC2
scp -i "C:\path\to\your-key.pem" -r . ubuntu@YOUR_EC2_PUBLIC_IP:~/institute-erp
```

Or use **Git** (recommended):

```bash
# On EC2 server
git clone https://github.com/YOUR_USERNAME/institute-erp.git
cd institute-erp
```

---

## Step 5: Configure Environment Variables

```bash
cd ~/institute-erp

# Create production .env file
cat > backend/.env << 'EOF'
PORT=5000
DATABASE_URL=sqlite:///./data/dev.db
JWT_SECRET=CHANGE_THIS_TO_A_RANDOM_64_CHAR_STRING
QR_HMAC_SECRET=CHANGE_THIS_TO_ANOTHER_RANDOM_STRING
NODE_ENV=production
EOF

# Generate a secure JWT secret
python3 -c "import secrets; print(secrets.token_hex(32))"
# Copy the output and replace JWT_SECRET above
```

---

## Step 6: Build and Run with Docker

```bash
cd ~/institute-erp

# Build the Docker image (this builds frontend + backend)
docker build -t institute-erp .

# Run the container
docker run -d \
  --name institute-erp \
  --restart unless-stopped \
  -p 5000:5000 \
  -e JWT_SECRET=YOUR_SECRET_HERE \
  -e QR_HMAC_SECRET=YOUR_QR_SECRET_HERE \
  -e NODE_ENV=production \
  -v $(pwd)/data:/app/backend/data \
  -v $(pwd)/uploads:/app/backend/uploads \
  institute-erp

# Check it's running
docker ps
docker logs institute-erp
```

Access your app at: `http://YOUR_EC2_PUBLIC_IP:5000`

---

## Step 7: Run with Docker Compose (Easier)

```bash
cd ~/institute-erp

# Edit docker-compose.yml to set your secrets
nano docker-compose.yml
# Change JWT_SECRET to a secure value

# Start
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Step 8: Set Up Nginx (Port 80 instead of 5000)

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/institute-erp
```

Paste this config:
```nginx
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP;  # or your domain name

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/institute-erp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Now accessible at http://YOUR_EC2_PUBLIC_IP (port 80)
```

---

## Step 9: Seed the Database (First Time Only)

```bash
# Run seed inside the container
docker exec -it institute-erp python seed.py

# Or if using docker-compose
docker-compose exec app python seed.py
```

---

## Step 10: HTTPS with SSL Certificate (Optional but Recommended)

If you have a domain name:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Point your domain DNS A record to EC2 Public IP first, then:
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

---

## Step 11: Useful Commands

```bash
# View running containers
docker ps

# View app logs
docker logs institute-erp -f

# Restart the app
docker restart institute-erp

# Stop the app
docker stop institute-erp

# Update the app (after code changes)
git pull
docker build -t institute-erp .
docker stop institute-erp
docker rm institute-erp
docker run -d --name institute-erp --restart unless-stopped \
  -p 5000:5000 \
  -e JWT_SECRET=YOUR_SECRET \
  -e NODE_ENV=production \
  -v $(pwd)/data:/app/backend/data \
  -v $(pwd)/uploads:/app/backend/uploads \
  institute-erp

# Backup database
docker cp institute-erp:/app/backend/data/dev.db ./backup-$(date +%Y%m%d).db
```

---

## Step 12: Monitor the Server

```bash
# Check disk usage
df -h

# Check memory
free -h

# Check CPU
top

# Check Docker container resource usage
docker stats
```

---

## Default Credentials After Seed

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@institute.com | admin123 |
| Trainer | trainer1@institute.com | trainer123 |
| Counsellor | counsellor1@institute.com | counsellor123 |
| Student | student1@institute.com | student123 |

> **Important:** Change all passwords immediately after first login in production!

---

## Security Checklist Before Going Live

- [ ] Change `JWT_SECRET` to a random 64+ character string
- [ ] Change `QR_HMAC_SECRET` to a random string
- [ ] Change all default passwords
- [ ] Restrict SSH access to your IP only in Security Groups
- [ ] Remove port 5000 from Security Groups if using Nginx
- [ ] Enable HTTPS with SSL certificate
- [ ] Set up automated database backups

---

## Troubleshooting

**App not starting:**
```bash
docker logs institute-erp
```

**Can't connect to the site:**
- Check EC2 Security Group allows port 80/5000
- Check `docker ps` — is the container running?
- Check `sudo systemctl status nginx`

**Database issues:**
```bash
# Re-run seed
docker exec -it institute-erp python seed.py
```

**Out of disk space:**
```bash
# Clean unused Docker images
docker system prune -a
```
