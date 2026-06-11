# Institute ERP — Deployment Guide

> Each phase is **fully independent** and self-contained.
> Do not mix steps between phases. Follow only the phase you are deploying.

---

## Project Overview

| Layer     | Technology                                      | Dev Port | Prod Port |
|-----------|-------------------------------------------------|----------|-----------|
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS        | 5173     | —         |
| Backend   | Python 3.13, FastAPI, SQLAlchemy, Uvicorn       | 5000     | 5000      |
| Database  | SQLite (file-based)                             | —        | —         |
| Auth      | JWT (python-jose + bcrypt)                      | —        | —         |
| Container | Docker multi-stage (Node 22 + Python 3.13)      | —        | 5000      |

### Environment Variables (All Phases)

```dotenv
PORT=5000
NODE_ENV=production
DATABASE_URL=sqlite:///./data/prod.db
JWT_SECRET=<generate-strong-64-char-secret>
QR_HMAC_SECRET=<generate-strong-64-char-secret>
```

### Generate Strong Secrets

```bash
python3 -c "import secrets; print(secrets.token_hex(64))"
```

### Default Credentials (Change After First Login)

| Role       | Email                     | Password      |
|------------|---------------------------|---------------|
| Admin      | admin@institute.com       | admin123      |
| Trainer    | trainer1@institute.com    | trainer123    |
| Counsellor | counsellor1@institute.com | counsellor123 |
| Student    | student1@institute.com    | student123    |

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PHASE 1 — AWS EC2 ONLY
# Manual deployment, no CI/CD, no Docker
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Phase 1 — Architecture

```
Developer Machine
      │
      │  git pull / deploy.sh (SSH)
      ▼
[ AWS EC2 Instance — Ubuntu 22.04 ]
      │
      ├── Nginx :80 / :443  ──► reverse proxy
      │         │
      │         ▼
      ├── Uvicorn :5000 (FastAPI)
      │         │
      │         ├── /api/*         (REST API)
      │         ├── /uploads/*     (file serving)
      │         └── /*             (React SPA static)
      │
      ├── /opt/Institute-ERP/backend/data/prod.db   (SQLite)
      └── /opt/Institute-ERP/backend/uploads/       (files)
```

---

## Phase 1 — Step 1: AWS EC2 Setup

### Instance Configuration

| Setting        | Value                    |
|----------------|--------------------------|
| Instance type  | t3.small or t3.medium    |
| AMI            | Ubuntu 22.04 LTS (64-bit)|
| Storage        | 30 GB gp3 SSD            |
| Key pair       | Create new `.pem` file   |
| Elastic IP     | Assign one (stable IP)   |

### Security Group — Inbound Rules

| Type       | Protocol | Port | Source        | Reason                          |
|------------|----------|------|---------------|---------------------------------|
| SSH        | TCP      | 22   | Your IP only  | Admin SSH access                |
| HTTP       | TCP      | 80   | 0.0.0.0/0     | Web traffic via Nginx           |
| HTTPS      | TCP      | 443  | 0.0.0.0/0     | Secure web traffic              |
| Custom TCP | TCP      | 5000 | Your IP only  | Direct API test (remove later)  |

> After Nginx is working, remove port 5000 from inbound rules.
> All public traffic must go through port 80/443 → Nginx → localhost:5000.

### Security Group — Outbound Rules

| Type       | Protocol | Port | Destination | Reason                         |
|------------|----------|------|-------------|--------------------------------|
| All traffic| All      | All  | 0.0.0.0/0   | apt, pip, npm, GitHub access   |

---

## Phase 1 — Step 2: Connect to EC2

```bash
# Download your .pem key file from AWS console
# Set correct permissions (Linux/Mac)
chmod 400 your-key.pem

# Connect to instance
ssh -i "your-key.pem" ubuntu@<EC2_PUBLIC_IP>
```

---

## Phase 1 — Step 3: Install Required Software

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Python 3.13
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.13 python3.13-venv python3.13-dev

# Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx and Git
sudo apt install -y nginx git

# Verify all versions
python3.13 --version    # Python 3.13.x
node --version           # v22.x.x
npm --version            # 10.x.x
nginx -v                 # nginx/1.x.x
git --version            # git version 2.x.x
```

---

## Phase 1 — Step 4: Deploy Application

```bash
# Clone the repository
cd /opt
sudo git clone https://github.com/your-org/Institute-ERP.git
sudo chown -R ubuntu:ubuntu /opt/Institute-ERP
cd /opt/Institute-ERP

# Build the frontend (output goes to frontend/dist/)
cd frontend
npm ci
npm run build
cd ..

# Setup Python virtual environment
cd backend
python3.13 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Create required directories
mkdir -p data uploads

# Create production .env file
cat > .env << 'ENVEOF'
PORT=5000
NODE_ENV=production
DATABASE_URL=sqlite:///./data/prod.db
JWT_SECRET=REPLACE_WITH_YOUR_GENERATED_SECRET
QR_HMAC_SECRET=REPLACE_WITH_YOUR_GENERATED_SECRET
ENVEOF

# Restrict .env file permissions
chmod 600 .env

# Seed the database (FIRST DEPLOYMENT ONLY)
# Skip this on subsequent deployments
python seed.py

# Test the app manually
uvicorn app.main:app --host 0.0.0.0 --port 5000
# Visit http://<EC2_IP>:5000/api/health  →  should return {"status":"ok"}
# Press Ctrl+C after confirming it works
```

---

## Phase 1 — Step 5: Create Systemd Service

```bash
sudo nano /etc/systemd/system/institute-erp.service
```

Paste the following:

```ini
[Unit]
Description=Institute ERP FastAPI Application
After=network.target
Wants=network.target

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=/opt/Institute-ERP/backend
Environment="PATH=/opt/Institute-ERP/backend/venv/bin"
EnvironmentFile=/opt/Institute-ERP/backend/.env
ExecStart=/opt/Institute-ERP/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 5000 --workers 2
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=institute-erp

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable institute-erp
sudo systemctl start institute-erp

# Check it is running
sudo systemctl status institute-erp

# View live logs
sudo journalctl -u institute-erp -f
```

> `--host 127.0.0.1` binds Uvicorn to localhost only. Nginx handles public traffic.

---

## Phase 1 — Step 6: Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/institute-erp
```

Paste the following:

```nginx
server {
    listen 80;
    server_name <YOUR_EC2_PUBLIC_IP_OR_DOMAIN>;

    # Allow large uploads (assignments and resources)
    client_max_body_size 50M;

    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout    60s;
        proxy_read_timeout    60s;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/institute-erp /etc/nginx/sites-enabled/

# Remove the default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test config — must print "test is successful"
sudo nginx -t

# Start and enable Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Verify — should return health JSON
curl http://<EC2_PUBLIC_IP>/api/health
```

---

## Phase 1 — Step 7: Update / Redeploy Script

Save as `/opt/Institute-ERP/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "[1/4] Pulling latest code..."
cd /opt/Institute-ERP
git pull origin main

echo "[2/4] Rebuilding frontend..."
cd frontend
npm ci
npm run build

echo "[3/4] Updating backend dependencies..."
cd ../backend
source venv/bin/activate
pip install -r requirements.txt

echo "[4/4] Restarting application service..."
sudo systemctl restart institute-erp

echo "Deployment complete — $(date)"
```

```bash
chmod +x /opt/Institute-ERP/deploy.sh

# Run future deployments with:
/opt/Institute-ERP/deploy.sh
```

---

## Phase 1 — Step 8: File Permissions & Security

```bash
# Restrict sensitive files
chmod 600 /opt/Institute-ERP/backend/.env
chmod 700 /opt/Institute-ERP/backend/uploads
chmod 755 /opt/Institute-ERP

# Disable root SSH login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Disable password auth (key-only login)
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Enable UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## Phase 1 — Step 9: Verify Deployment

```bash
# Health check
curl http://<EC2_PUBLIC_IP>/api/health
# Expected: {"success":true,"data":{"status":"ok"},"message":"Server is running"}

# Check service status
sudo systemctl status institute-erp

# Check Nginx status
sudo systemctl status nginx

# Check logs for errors
sudo journalctl -u institute-erp --since "5 minutes ago" --no-pager
```

---

## Phase 1 — Rollback

```bash
cd /opt/Institute-ERP

# View recent commits
git log --oneline -10

# Rollback to a specific commit
git checkout <COMMIT_HASH>

# Rebuild and restart
cd frontend && npm ci && npm run build
cd ../backend && source venv/bin/activate && pip install -r requirements.txt
sudo systemctl restart institute-erp
```

---

## Phase 1 — Port Summary

| Service         | Port | Accessible From   |
|-----------------|------|-------------------|
| SSH             | 22   | Your IP only      |
| Nginx (HTTP)    | 80   | Internet          |
| Nginx (HTTPS)   | 443  | Internet          |
| Uvicorn/FastAPI | 5000 | Localhost only    |

---
---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PHASE 2 — AWS + JENKINS
# Automated CI/CD pipeline, no Docker
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Phase 2 — Architecture

```
Developer pushes to GitHub
        │
        │  webhook trigger
        ▼
[ Jenkins EC2 — t3.medium ]
        │
        │  1. git checkout
        │  2. npm ci + build
        │  3. pytest
        │  4. SSH deploy to App EC2
        │
        ▼ SSH
[ App EC2 — Ubuntu 22.04 ]
        │
        ├── git pull + rebuild
        ├── Nginx :80 / :443
        └── Uvicorn :5000 (FastAPI)
                  │
                  ├── SQLite /data/prod.db
                  └── Uploads /uploads/
```

---

## Phase 2 — Step 1: App EC2 Setup

### App Server — Instance Configuration

| Setting        | Value                     |
|----------------|---------------------------|
| Instance type  | t3.small or t3.medium     |
| AMI            | Ubuntu 22.04 LTS (64-bit) |
| Storage        | 30 GB gp3 SSD             |
| Key pair       | Create new `.pem` file    |
| Elastic IP     | Assign one                |

### App Server — Security Group Inbound Rules

| Type       | Protocol | Port | Source              | Reason                        |
|------------|----------|------|---------------------|-------------------------------|
| SSH        | TCP      | 22   | Your IP only        | Admin access                  |
| SSH        | TCP      | 22   | Jenkins SG          | Jenkins deploys via SSH       |
| HTTP       | TCP      | 80   | 0.0.0.0/0           | Web traffic                   |
| HTTPS      | TCP      | 443  | 0.0.0.0/0           | Secure web traffic            |

---

## Phase 2 — Step 2: Jenkins EC2 Setup

### Jenkins Server — Instance Configuration

| Setting        | Value                     |
|----------------|---------------------------|
| Instance type  | t3.medium                 |
| AMI            | Ubuntu 22.04 LTS (64-bit) |
| Storage        | 30 GB gp3 SSD             |
| Key pair       | Same or separate `.pem`   |

### Jenkins Server — Security Group Inbound Rules

| Type       | Protocol | Port  | Source        | Reason                         |
|------------|----------|-------|---------------|--------------------------------|
| SSH        | TCP      | 22    | Your IP only  | Admin access                   |
| Custom TCP | TCP      | 8080  | Your IP only  | Jenkins web dashboard          |
| Custom TCP | TCP      | 50000 | App server SG | Jenkins agent JNLP connection  |

> Never expose Jenkins port 8080 to the internet (0.0.0.0/0).
> It contains your SSH keys and deployment credentials.

---

## Phase 2 — Step 3: Provision App EC2

```bash
# SSH into App EC2
ssh -i "your-key.pem" ubuntu@<APP_EC2_IP>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.13
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.13 python3.13-venv python3.13-dev

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx and Git
sudo apt install -y nginx git

# Clone repository
cd /opt
sudo git clone https://github.com/your-org/Institute-ERP.git
sudo chown -R ubuntu:ubuntu /opt/Institute-ERP
cd /opt/Institute-ERP

# Build frontend
cd frontend && npm ci && npm run build && cd ..

# Setup Python venv
cd backend
python3.13 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create directories
mkdir -p data uploads

# Create .env file
cat > .env << 'ENVEOF'
PORT=5000
NODE_ENV=production
DATABASE_URL=sqlite:///./data/prod.db
JWT_SECRET=REPLACE_WITH_YOUR_GENERATED_SECRET
QR_HMAC_SECRET=REPLACE_WITH_YOUR_GENERATED_SECRET
ENVEOF
chmod 600 .env

# Seed database (first deployment only)
python seed.py
```

### Systemd Service on App EC2

```bash
sudo nano /etc/systemd/system/institute-erp.service
```

```ini
[Unit]
Description=Institute ERP FastAPI Application
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/Institute-ERP/backend
Environment="PATH=/opt/Institute-ERP/backend/venv/bin"
EnvironmentFile=/opt/Institute-ERP/backend/.env
ExecStart=/opt/Institute-ERP/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 5000 --workers 2
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable institute-erp
sudo systemctl start institute-erp
```

### Nginx on App EC2

```bash
sudo nano /etc/nginx/sites-available/institute-erp
```

```nginx
server {
    listen 80;
    server_name <APP_EC2_IP_OR_DOMAIN>;
    client_max_body_size 50M;

    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/institute-erp /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Phase 2 — Step 4: Provision Jenkins EC2

```bash
# SSH into Jenkins EC2
ssh -i "your-key.pem" ubuntu@<JENKINS_EC2_IP>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Java 21 (Jenkins requirement)
sudo apt install -y fontconfig openjdk-21-jre

# Install Node.js 22 (for frontend build in pipeline)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python 3.13 (for backend test in pipeline)
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.13 python3.13-venv python3.13-dev

# Install Git
sudo apt install -y git

# Add Jenkins repository and install
sudo wget -O /usr/share/keyrings/jenkins-keyring.asc \
  https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key

echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/" | \
  sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null

sudo apt update
sudo apt install -y jenkins

# Start Jenkins
sudo systemctl enable jenkins
sudo systemctl start jenkins

# Get initial admin password for setup wizard
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

Access Jenkins at `http://<JENKINS_EC2_IP>:8080` and complete the setup wizard.

---

## Phase 2 — Step 5: Install Jenkins Plugins

Go to **Manage Jenkins → Plugins → Available plugins** and install:

| Plugin Name                 | Purpose                                    |
|-----------------------------|--------------------------------------------|
| Git plugin                  | Checkout source code from Git              |
| GitHub Integration          | Receive GitHub push webhooks               |
| SSH Agent plugin            | SSH into App EC2 for deployment            |
| Credentials Binding plugin  | Inject secrets as env vars in pipeline     |
| Pipeline plugin             | Declarative Jenkinsfile support            |
| Blue Ocean *(optional)*     | Visual pipeline UI                         |

Restart Jenkins after installing plugins.

---

## Phase 2 — Step 6: Configure Jenkins Credentials

Go to **Manage Jenkins → Credentials → System → Global credentials → Add Credential:**

| Credential ID   | Type                    | What to Enter                                     |
|-----------------|-------------------------|---------------------------------------------------|
| `ec2-ssh-key`   | SSH Username with key   | Username: `ubuntu` / Private Key: paste `.pem` content |
| `github-token`  | Username with password  | GitHub username + Personal Access Token (PAT)     |

> To create a GitHub PAT: GitHub → Settings → Developer settings → Personal access tokens → Generate new token → select `repo` scope.

---

## Phase 2 — Step 7: Create Jenkinsfile

Create `Jenkinsfile` in the root of the project (commit and push to GitHub):

```groovy
pipeline {
    agent any

    environment {
        APP_SERVER = '<APP_EC2_PUBLIC_IP>'
        APP_USER   = 'ubuntu'
        DEPLOY_DIR = '/opt/Institute-ERP'
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    credentialsId: 'github-token',
                    url: 'https://github.com/your-org/Institute-ERP.git'
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }

        stage('Test Backend') {
            steps {
                dir('backend') {
                    sh '''
                        python3.13 -m venv venv
                        . venv/bin/activate
                        pip install -r requirements.txt
                        python -m pytest tests/ -v --tb=short
                    '''
                }
            }
        }

        stage('Deploy to App Server') {
            steps {
                sshagent(credentials: ['ec2-ssh-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${APP_USER}@${APP_SERVER} '
                            cd ${DEPLOY_DIR} &&
                            git pull origin main &&
                            cd frontend && npm ci && npm run build && cd .. &&
                            cd backend && source venv/bin/activate &&
                            pip install -r requirements.txt && cd .. &&
                            sudo systemctl restart institute-erp
                        '
                    """
                }
            }
        }

        stage('Health Check') {
            steps {
                sh 'sleep 10'
                sh "curl -sf http://${APP_SERVER}/api/health | grep -q 'ok'"
            }
        }

    }

    post {
        success {
            echo "Build #${env.BUILD_NUMBER} deployed successfully"
        }
        failure {
            echo "Build #${env.BUILD_NUMBER} FAILED — check pipeline logs"
        }
    }
}
```

---

## Phase 2 — Step 8: Create Jenkins Pipeline Job

1. Open Jenkins → **New Item**
2. Name: `institute-erp-deploy` → select **Pipeline** → OK
3. Under **Build Triggers** → check **GitHub hook trigger for GITScm polling**
4. Under **Pipeline** → Definition: **Pipeline script from SCM**
5. SCM: **Git** → Repository URL: your GitHub repo URL
6. Credentials: select `github-token`
7. Branch: `*/main`
8. Script Path: `Jenkinsfile`
9. Click **Save**

---

## Phase 2 — Step 9: GitHub Webhook Setup

In your GitHub repository → **Settings → Webhooks → Add webhook:**

| Field         | Value                                            |
|---------------|--------------------------------------------------|
| Payload URL   | `http://<JENKINS_EC2_IP>:8080/github-webhook/`  |
| Content type  | `application/json`                               |
| Secret        | *(leave empty or add one)*                       |
| Events        | Just the **push** event                          |
| Active        | ✓ checked                                        |

Every `git push` to `main` now automatically triggers the Jenkins pipeline.

---

## Phase 2 — Step 10: Verify Pipeline

```bash
# Trigger manually or push a commit, then check:
# Jenkins dashboard → institute-erp-deploy → last build → Console Output

# On App EC2, verify the service restarted
sudo systemctl status institute-erp

# Health check
curl http://<APP_EC2_IP>/api/health
```

---

## Phase 2 — Rollback

```bash
# On App EC2 — rollback via git
cd /opt/Institute-ERP
git log --oneline -10
git checkout <GOOD_COMMIT_HASH>
cd frontend && npm ci && npm run build
cd ../backend && source venv/bin/activate && pip install -r requirements.txt
sudo systemctl restart institute-erp
```

---

## Phase 2 — Port Summary

| Server          | Service         | Port  | Accessible From          |
|-----------------|-----------------|-------|--------------------------|
| App EC2         | SSH             | 22    | Your IP + Jenkins IP     |
| App EC2         | Nginx HTTP      | 80    | Internet                 |
| App EC2         | Nginx HTTPS     | 443   | Internet                 |
| App EC2         | Uvicorn         | 5000  | Localhost only           |
| Jenkins EC2     | SSH             | 22    | Your IP only             |
| Jenkins EC2     | Jenkins UI      | 8080  | Your IP only             |
| Jenkins EC2     | Jenkins JNLP    | 50000 | App server SG only       |

---
---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PHASE 3 — AWS + JENKINS + DOCKER
# Containerized deployment via ECR
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Phase 3 — Architecture

```
Developer pushes to GitHub
        │
        │  webhook trigger
        ▼
[ Jenkins EC2 — t3.medium ]
        │
        │  1. git checkout
        │  2. pytest (backend tests)
        │  3. docker build (multi-stage)
        │  4. docker push → AWS ECR
        │  5. SSH → App EC2
        │     └── docker compose pull + up
        ▼ SSH
[ App EC2 — Ubuntu 22.04 ]
        │
        ├── Nginx :80 / :443
        └── Docker container → Uvicorn :5000
                  │
                  ├── Volume: db-data  → SQLite prod.db
                  └── Volume: uploads  → uploaded files
```

---

## Phase 3 — Step 1: AWS ECR Setup

```bash
# Run on your local machine with AWS CLI configured
# Create ECR repository
aws ecr create-repository \
  --repository-name institute-erp \
  --region <YOUR_AWS_REGION>

# The output gives you the repository URI:
# <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/institute-erp
# Save this URI — you will use it throughout Phase 3
```

---

## Phase 3 — Step 2: App EC2 Setup

### App Server — Instance Configuration

| Setting        | Value                     |
|----------------|---------------------------|
| Instance type  | t3.small or t3.medium     |
| AMI            | Ubuntu 22.04 LTS (64-bit) |
| Storage        | 30 GB gp3 SSD             |
| Key pair       | Create new `.pem` file    |
| Elastic IP     | Assign one                |

### App Server — Security Group Inbound Rules

| Type       | Protocol | Port | Source        | Reason                       |
|------------|----------|------|---------------|------------------------------|
| SSH        | TCP      | 22   | Your IP only  | Admin access                 |
| SSH        | TCP      | 22   | Jenkins SG    | Jenkins deploys via SSH      |
| HTTP       | TCP      | 80   | 0.0.0.0/0     | Web traffic                  |
| HTTPS      | TCP      | 443  | 0.0.0.0/0     | Secure web traffic           |

---

## Phase 3 — Step 3: Install Docker on App EC2

```bash
# SSH into App EC2
ssh -i "your-key.pem" ubuntu@<APP_EC2_IP>

# Update system
sudo apt update && sudo apt upgrade -y

# Add Docker's official GPG key
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine and Compose plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Allow ubuntu user to run Docker without sudo
sudo usermod -aG docker ubuntu

# Install AWS CLI (to authenticate with ECR)
sudo apt install -y unzip
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf awscliv2.zip aws

# Install Nginx
sudo apt install -y nginx

# Verify
docker --version          # Docker version 24.x.x
docker compose version    # Docker Compose version v2.x.x
aws --version             # aws-cli/2.x.x

# Log out and back in for docker group to take effect
exit
ssh -i "your-key.pem" ubuntu@<APP_EC2_IP>
```

---

## Phase 3 — Step 4: Configure AWS CLI on App EC2

```bash
# Configure AWS credentials on App EC2 (needed for ECR login)
aws configure
# AWS Access Key ID:     <your-access-key>
# AWS Secret Access Key: <your-secret-key>
# Default region name:   <your-region>
# Default output format: json
```

---

## Phase 3 — Step 5: Create Production Env File on App EC2

```bash
sudo mkdir -p /opt/Institute-ERP
sudo chown ubuntu:ubuntu /opt/Institute-ERP

# Create production .env file
cat > /opt/Institute-ERP/.env.prod << 'ENVEOF'
PORT=5000
NODE_ENV=production
DATABASE_URL=sqlite:///./data/prod.db
JWT_SECRET=REPLACE_WITH_YOUR_GENERATED_SECRET
QR_HMAC_SECRET=REPLACE_WITH_YOUR_GENERATED_SECRET
ENVEOF

chmod 600 /opt/Institute-ERP/.env.prod
```

---

## Phase 3 — Step 6: Create docker-compose.prod.yml on App EC2

```bash
nano /opt/Institute-ERP/docker-compose.prod.yml
```

```yaml
version: '3.8'

services:
  app:
    image: ${ECR_REPO}:${IMAGE_TAG:-latest}
    ports:
      - '127.0.0.1:5000:5000'
    env_file:
      - /opt/Institute-ERP/.env.prod
    volumes:
      - db-data:/app/backend/data
      - uploads:/app/backend/uploads
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  db-data:
    driver: local
  uploads:
    driver: local
```

> `127.0.0.1:5000:5000` binds the container to localhost only. Nginx proxies public traffic.

---

## Phase 3 — Step 7: Configure Nginx on App EC2

```bash
sudo nano /etc/nginx/sites-available/institute-erp
```

```nginx
server {
    listen 80;
    server_name <APP_EC2_IP_OR_DOMAIN>;
    client_max_body_size 50M;

    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout    60s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/institute-erp /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Phase 3 — Step 8: Jenkins EC2 Setup

### Jenkins Server — Instance Configuration

| Setting        | Value                     |
|----------------|---------------------------|
| Instance type  | t3.medium                 |
| AMI            | Ubuntu 22.04 LTS (64-bit) |
| Storage        | 30 GB gp3 SSD             |

### Jenkins Server — Security Group Inbound Rules

| Type       | Protocol | Port  | Source        | Reason                        |
|------------|----------|-------|---------------|-------------------------------|
| SSH        | TCP      | 22    | Your IP only  | Admin access                  |
| Custom TCP | TCP      | 8080  | Your IP only  | Jenkins web dashboard         |
| Custom TCP | TCP      | 50000 | App server SG | Jenkins agent connections     |

---

## Phase 3 — Step 9: Install Jenkins and Docker on Jenkins EC2

```bash
# SSH into Jenkins EC2
ssh -i "your-key.pem" ubuntu@<JENKINS_EC2_IP>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Java 21
sudo apt install -y fontconfig openjdk-21-jre

# Install Python 3.13 (for backend tests)
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.13 python3.13-venv python3.13-dev

# Install Git
sudo apt install -y git

# Install Jenkins
sudo wget -O /usr/share/keyrings/jenkins-keyring.asc \
  https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/" | \
  sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt update
sudo apt install -y jenkins

# Install Docker on Jenkins server
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add jenkins user to docker group
sudo usermod -aG docker jenkins

# Install AWS CLI on Jenkins server
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf awscliv2.zip aws

# Restart Jenkins so group changes take effect
sudo systemctl restart jenkins
sudo systemctl enable jenkins

# Get initial admin password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

Access Jenkins at `http://<JENKINS_EC2_IP>:8080` and complete the setup wizard.

---

## Phase 3 — Step 10: Jenkins Plugins

Go to **Manage Jenkins → Plugins → Available plugins:**

| Plugin Name                 | Purpose                              |
|-----------------------------|--------------------------------------|
| Git plugin                  | Source code checkout                 |
| GitHub Integration          | Webhook trigger                      |
| SSH Agent plugin            | SSH deploy to App EC2                |
| Credentials Binding plugin  | Inject AWS keys, tokens as env vars  |
| Pipeline plugin             | Declarative Jenkinsfile support      |

---

## Phase 3 — Step 11: Jenkins Credentials

Go to **Manage Jenkins → Credentials → System → Global credentials:**

| Credential ID     | Type                    | Value                                        |
|-------------------|-------------------------|----------------------------------------------|
| `ec2-ssh-key`     | SSH Username with key   | Username: `ubuntu` / paste `.pem` content    |
| `github-token`    | Username with password  | GitHub username + PAT                        |
| `aws-access-key`  | Secret text             | AWS Access Key ID                            |
| `aws-secret-key`  | Secret text             | AWS Secret Access Key                        |
| `aws-account-id`  | Secret text             | 12-digit AWS account ID                      |
| `aws-region`      | Secret text             | e.g., `us-east-1`                            |

---

## Phase 3 — Step 12: Jenkinsfile (Docker + ECR)

Create `Jenkinsfile` in the project root and push to GitHub:

```groovy
pipeline {
    agent any

    environment {
        APP_SERVER  = '<APP_EC2_PUBLIC_IP>'
        APP_USER    = 'ubuntu'
        AWS_REGION  = credentials('aws-region')
        AWS_ACCOUNT = credentials('aws-account-id')
        ECR_REPO    = "${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/institute-erp"
        IMAGE_TAG   = "${env.BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    credentialsId: 'github-token',
                    url: 'https://github.com/your-org/Institute-ERP.git'
            }
        }

        stage('Test Backend') {
            steps {
                dir('backend') {
                    sh '''
                        python3.13 -m venv venv
                        . venv/bin/activate
                        pip install -r requirements.txt
                        python -m pytest tests/ -v --tb=short
                    '''
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${ECR_REPO}:${IMAGE_TAG} -t ${ECR_REPO}:latest ."
            }
        }

        stage('Push to ECR') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh """
                        aws ecr get-login-password --region ${AWS_REGION} | \
                          docker login --username AWS --password-stdin ${ECR_REPO}
                        docker push ${ECR_REPO}:${IMAGE_TAG}
                        docker push ${ECR_REPO}:latest
                    """
                }
            }
        }

        stage('Deploy to App Server') {
            steps {
                sshagent(credentials: ['ec2-ssh-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${APP_USER}@${APP_SERVER} \
                            'aws ecr get-login-password --region ${AWS_REGION} | \
                               docker login --username AWS --password-stdin ${ECR_REPO} &&
                             export ECR_REPO=${ECR_REPO} IMAGE_TAG=${IMAGE_TAG} &&
                             docker compose -f /opt/Institute-ERP/docker-compose.prod.yml pull &&
                             docker compose -f /opt/Institute-ERP/docker-compose.prod.yml up -d &&
                             docker image prune -f'
                    """
                }
            }
        }

        stage('Health Check') {
            steps {
                sh 'sleep 15'
                sh "curl -sf http://${APP_SERVER}/api/health | grep -q 'ok'"
            }
        }

    }

    post {
        always {
            sh "docker rmi ${ECR_REPO}:${IMAGE_TAG} || true"
        }
        success {
            echo "Build #${env.BUILD_NUMBER} deployed successfully"
        }
        failure {
            echo "Build #${env.BUILD_NUMBER} FAILED"
        }
    }
}
```

---

## Phase 3 — Step 13: GitHub Webhook

In GitHub repo → **Settings → Webhooks → Add webhook:**

| Field        | Value                                            |
|--------------|--------------------------------------------------|
| Payload URL  | `http://<JENKINS_EC2_IP>:8080/github-webhook/`  |
| Content type | `application/json`                               |
| Events       | Just the **push** event                          |

---

## Phase 3 — Step 14: Verify Deployment

```bash
# Check running containers on App EC2
ssh -i "your-key.pem" ubuntu@<APP_EC2_IP>
docker ps

# View container logs
docker compose -f /opt/Institute-ERP/docker-compose.prod.yml logs -f

# Health check
curl http://<APP_EC2_IP>/api/health
```

---

## Phase 3 — Rollback

```bash
# SSH into App EC2
ssh -i "your-key.pem" ubuntu@<APP_EC2_IP>

# Pull and run the previous build image
export ECR_REPO=<YOUR_ECR_REPO_URI>
export IMAGE_TAG=<PREVIOUS_BUILD_NUMBER>

docker compose -f /opt/Institute-ERP/docker-compose.prod.yml up -d
```

---

## Phase 3 — Port Summary

| Server       | Service         | Port  | Accessible From       |
|--------------|-----------------|-------|-----------------------|
| App EC2      | SSH             | 22    | Your IP + Jenkins IP  |
| App EC2      | Nginx HTTP      | 80    | Internet              |
| App EC2      | Nginx HTTPS     | 443   | Internet              |
| App EC2      | Docker/Uvicorn  | 5000  | Localhost only        |
| Jenkins EC2  | SSH             | 22    | Your IP only          |
| Jenkins EC2  | Jenkins UI      | 8080  | Your IP only          |
| Jenkins EC2  | Jenkins JNLP    | 50000 | App server SG only    |

---
---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PHASE 4 — AWS + JENKINS + DOCKER + KUBERNETES
# Production-grade with EKS, auto-scaling, zero-downtime
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Phase 4 — Architecture

```
Developer pushes to GitHub
        │
        │  webhook trigger
        ▼
[ Jenkins EC2 — t3.medium ]
        │
        │  1. git checkout
        │  2. pytest
        │  3. docker build + push to ECR
        │  4. kubectl set image → EKS rolling update
        │
        ▼ kubectl
[ AWS EKS Cluster ]
        │
        ├── [ Ingress — AWS ALB :80/:443 ]
        │         │
        │         ▼
        ├── [ Service — ClusterIP :80 ]
        │         │
        │         ▼
        ├── [ Pod 1: Uvicorn :5000 ]   ← rolling update
        ├── [ Pod 2: Uvicorn :5000 ]   ← zero-downtime
        │
        ├── [ PVC: db-data  10Gi EBS ]  → SQLite prod.db
        └── [ PVC: uploads  20Gi EBS ]  → uploaded files
```

---

## Phase 4 — Step 1: Prerequisites on Local Machine

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
aws --version

# Configure AWS credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region, output format (json)

# Install eksctl
curl --location \
  "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" \
  | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin
eksctl version

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -sL https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin
kubectl version --client

# Install Helm (for ALB controller)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm version
```

---

## Phase 4 — Step 2: AWS ECR Repository

```bash
# Create the ECR repository
aws ecr create-repository \
  --repository-name institute-erp \
  --region <YOUR_AWS_REGION>

# Save the repository URI from the output:
# <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/institute-erp
```

---

## Phase 4 — Step 3: Create EKS Cluster

```bash
# Create EKS cluster (takes approx 15-20 minutes)
eksctl create cluster \
  --name institute-erp \
  --region <YOUR_AWS_REGION> \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 4 \
  --managed

# Connect kubectl to the new cluster
aws eks update-kubeconfig \
  --region <YOUR_AWS_REGION> \
  --name institute-erp

# Verify nodes are ready
kubectl get nodes
# All nodes should show STATUS = Ready
```

---

## Phase 4 — Step 4: Required IAM Policies for EKS Nodes

The managed node group IAM role requires these AWS-managed policies.
Add them in **AWS Console → IAM → Roles → find the EKS node role → Attach policies:**

| Policy Name                           | Purpose                          |
|---------------------------------------|----------------------------------|
| AmazonEKSWorkerNodePolicy             | Node group operations            |
| AmazonEC2ContainerRegistryReadOnly    | Pull images from ECR             |
| AmazonEKS_CNI_Policy                  | Pod networking (VPC CNI)         |

---

## Phase 4 — Step 5: Create Kubernetes Namespace and Secrets

```bash
# Create dedicated namespace for the app
kubectl create namespace institute-erp

# Create Kubernetes Secret for app credentials
# (values are stored base64-encoded, not in plain text)
kubectl create secret generic erp-secrets \
  --namespace institute-erp \
  --from-literal=JWT_SECRET='<your-strong-jwt-secret>' \
  --from-literal=QR_HMAC_SECRET='<your-strong-qr-secret>'

# Verify secret was created
kubectl get secrets -n institute-erp
```

---

## Phase 4 — Step 6: Create Kubernetes Manifests

Create a `k8s/` directory in the project root with these files:

**k8s/namespace.yaml**

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: institute-erp
  labels:
    app: institute-erp
```

---

**k8s/pvc.yaml** — Persistent volumes for SQLite and file uploads

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: erp-db-pvc
  namespace: institute-erp
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: gp2
  resources:
    requests:
      storage: 10Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: erp-uploads-pvc
  namespace: institute-erp
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: gp2
  resources:
    requests:
      storage: 20Gi
```

---

**k8s/deployment.yaml**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: institute-erp
  namespace: institute-erp
  labels:
    app: institute-erp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: institute-erp
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: institute-erp
    spec:
      containers:
        - name: erp-app
          image: <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/institute-erp:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 5000
          env:
            - name: PORT
              value: "5000"
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              value: "sqlite:////app/backend/data/prod.db"
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: erp-secrets
                  key: JWT_SECRET
            - name: QR_HMAC_SECRET
              valueFrom:
                secretKeyRef:
                  name: erp-secrets
                  key: QR_HMAC_SECRET
          volumeMounts:
            - name: db-storage
              mountPath: /app/backend/data
            - name: uploads-storage
              mountPath: /app/backend/uploads
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /api/health
              port: 5000
            initialDelaySeconds: 30
            periodSeconds: 15
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /api/health
              port: 5000
            initialDelaySeconds: 15
            periodSeconds: 10
            failureThreshold: 3
      volumes:
        - name: db-storage
          persistentVolumeClaim:
            claimName: erp-db-pvc
        - name: uploads-storage
          persistentVolumeClaim:
            claimName: erp-uploads-pvc
```

---

**k8s/service.yaml**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: institute-erp-svc
  namespace: institute-erp
spec:
  selector:
    app: institute-erp
  ports:
    - protocol: TCP
      port: 80
      targetPort: 5000
  type: ClusterIP
```

---

**k8s/ingress.yaml** — AWS Application Load Balancer

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: institute-erp-ingress
  namespace: institute-erp
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP":80},{"HTTPS":443}]'
    alb.ingress.kubernetes.io/ssl-redirect: "443"
spec:
  rules:
    - host: erp.yourdomain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: institute-erp-svc
                port:
                  number: 80
```

---

**k8s/hpa.yaml** — Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: erp-hpa
  namespace: institute-erp
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: institute-erp
  minReplicas: 2
  maxReplicas: 6
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

---

## Phase 4 — Step 7: Install AWS Load Balancer Controller

```bash
# Download the IAM policy for the ALB controller
curl -O https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.7.0/docs/install/iam_policy.json

# Create the IAM policy
aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam_policy.json

# Create IAM service account
eksctl create iamserviceaccount \
  --cluster=institute-erp \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --role-name AmazonEKSLoadBalancerControllerRole \
  --attach-policy-arn=arn:aws:iam::<AWS_ACCOUNT_ID>:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve

# Install ALB controller via Helm
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  --namespace kube-system \
  --set clusterName=institute-erp \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller

# Verify controller is running
kubectl get deployment -n kube-system aws-load-balancer-controller
```

---

## Phase 4 — Step 8: Apply Kubernetes Manifests

```bash
# Apply in order
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/pvc.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

# Watch pods come up
kubectl get pods -n institute-erp -w

# Check ingress — copy the ALB DNS name and use as CNAME for your domain
kubectl get ingress -n institute-erp

# Verify app is healthy
kubectl get pods -n institute-erp
kubectl describe deployment institute-erp -n institute-erp
```

---

## Phase 4 — Step 9: Jenkins EC2 Setup

### Jenkins Server — Instance Configuration

| Setting        | Value                     |
|----------------|---------------------------|
| Instance type  | t3.medium                 |
| AMI            | Ubuntu 22.04 LTS (64-bit) |
| Storage        | 30 GB gp3 SSD             |

### Jenkins Server — Security Group Inbound Rules

| Type       | Protocol | Port  | Source        | Reason                        |
|------------|----------|-------|---------------|-------------------------------|
| SSH        | TCP      | 22    | Your IP only  | Admin access                  |
| Custom TCP | TCP      | 8080  | Your IP only  | Jenkins web dashboard         |
| Custom TCP | TCP      | 50000 | 0.0.0.0/0     | Jenkins agent connections     |

---

## Phase 4 — Step 10: Install Jenkins, Docker, kubectl on Jenkins EC2

```bash
# SSH into Jenkins EC2
ssh -i "your-key.pem" ubuntu@<JENKINS_EC2_IP>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Java 21
sudo apt install -y fontconfig openjdk-21-jre

# Install Python 3.13 (for backend tests)
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.13 python3.13-venv python3.13-dev

# Install Git
sudo apt install -y git

# Install Jenkins
sudo wget -O /usr/share/keyrings/jenkins-keyring.asc \
  https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/" | \
  sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt update
sudo apt install -y jenkins

# Install Docker
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add jenkins user to docker group
sudo usermod -aG docker jenkins

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf awscliv2.zip aws

# Install kubectl on Jenkins server
curl -LO "https://dl.k8s.io/release/$(curl -sL https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin

# Restart Jenkins so docker group change takes effect
sudo systemctl restart jenkins
sudo systemctl enable jenkins

# Get initial admin password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

Access Jenkins at `http://<JENKINS_EC2_IP>:8080` and complete the setup wizard.

---

## Phase 4 — Step 11: Jenkins Plugins

Go to **Manage Jenkins → Plugins → Available plugins:**

| Plugin Name                 | Purpose                              |
|-----------------------------|--------------------------------------|
| Git plugin                  | Source code checkout                 |
| GitHub Integration          | Webhook trigger                      |
| Credentials Binding plugin  | Inject AWS keys, kubeconfig          |
| Pipeline plugin             | Declarative Jenkinsfile support      |

---

## Phase 4 — Step 12: Jenkins Credentials

Go to **Manage Jenkins → Credentials → System → Global credentials:**

| Credential ID     | Type                    | Value                                              |
|-------------------|-------------------------|----------------------------------------------------|
| `github-token`    | Username with password  | GitHub username + Personal Access Token            |
| `aws-access-key`  | Secret text             | AWS Access Key ID                                  |
| `aws-secret-key`  | Secret text             | AWS Secret Access Key                              |
| `aws-account-id`  | Secret text             | 12-digit AWS account ID                            |
| `aws-region`      | Secret text             | e.g., `us-east-1`                                  |
| `kubeconfig`      | Secret file             | Upload the `~/.kube/config` file from your machine |

> To get the kubeconfig file:
> `aws eks update-kubeconfig --name institute-erp --region <REGION>`
> The file is at `~/.kube/config` on your local machine.

---

## Phase 4 — Step 13: Jenkinsfile (Kubernetes)

Create `Jenkinsfile` in the project root and push to GitHub:

```groovy
pipeline {
    agent any

    environment {
        AWS_REGION  = credentials('aws-region')
        AWS_ACCOUNT = credentials('aws-account-id')
        ECR_REPO    = "${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/institute-erp"
        IMAGE_TAG   = "${env.BUILD_NUMBER}"
        K8S_NS      = 'institute-erp'
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    credentialsId: 'github-token',
                    url: 'https://github.com/your-org/Institute-ERP.git'
            }
        }

        stage('Test Backend') {
            steps {
                dir('backend') {
                    sh '''
                        python3.13 -m venv venv
                        . venv/bin/activate
                        pip install -r requirements.txt
                        python -m pytest tests/ -v --tb=short
                    '''
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${ECR_REPO}:${IMAGE_TAG} -t ${ECR_REPO}:latest ."
            }
        }

        stage('Push to ECR') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh """
                        aws ecr get-login-password --region ${AWS_REGION} | \
                          docker login --username AWS --password-stdin ${ECR_REPO}
                        docker push ${ECR_REPO}:${IMAGE_TAG}
                        docker push ${ECR_REPO}:latest
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                    sh """
                        kubectl set image deployment/institute-erp \
                          erp-app=${ECR_REPO}:${IMAGE_TAG} \
                          -n ${K8S_NS}

                        kubectl rollout status deployment/institute-erp \
                          -n ${K8S_NS} \
                          --timeout=120s
                    """
                }
            }
        }

        stage('Verify') {
            steps {
                withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                    sh """
                        kubectl get pods -n ${K8S_NS}
                        kubectl get svc  -n ${K8S_NS}
                    """
                }
            }
        }

    }

    post {
        failure {
            // Auto-rollback on failure
            withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                sh "kubectl rollout undo deployment/institute-erp -n ${K8S_NS}"
                echo "Auto-rolled back to previous deployment"
            }
        }
        always {
            sh "docker rmi ${ECR_REPO}:${IMAGE_TAG} || true"
        }
        success {
            echo "Build #${env.BUILD_NUMBER} deployed to Kubernetes successfully"
        }
    }
}
```

---

## Phase 4 — Step 14: GitHub Webhook

In GitHub repo → **Settings → Webhooks → Add webhook:**

| Field        | Value                                            |
|--------------|--------------------------------------------------|
| Payload URL  | `http://<JENKINS_EC2_IP>:8080/github-webhook/`  |
| Content type | `application/json`                               |
| Events       | Just the **push** event                          |

---

## Phase 4 — Step 15: Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n institute-erp

# Check ingress ALB DNS
kubectl get ingress -n institute-erp

# Check HPA status
kubectl get hpa -n institute-erp

# View pod logs
kubectl logs -l app=institute-erp -n institute-erp -f

# Health check via ALB DNS
curl http://<ALB_DNS_NAME>/api/health
```

---

## Phase 4 — Rollback

```bash
# Instant rollback to previous revision
kubectl rollout undo deployment/institute-erp -n institute-erp

# View all available revisions
kubectl rollout history deployment/institute-erp -n institute-erp

# Rollback to a specific revision number
kubectl rollout undo deployment/institute-erp \
  --to-revision=<REVISION_NUMBER> \
  -n institute-erp

# Confirm rollback completed
kubectl rollout status deployment/institute-erp -n institute-erp
kubectl get pods -n institute-erp
```

---

## Phase 4 — Port Summary

| Component          | Service          | Port  | Accessible From           |
|--------------------|------------------|-------|---------------------------|
| Jenkins EC2        | SSH              | 22    | Your IP only              |
| Jenkins EC2        | Jenkins UI       | 8080  | Your IP only              |
| Jenkins EC2        | Jenkins JNLP     | 50000 | Agent connections         |
| EKS — ALB          | HTTP             | 80    | Internet                  |
| EKS — ALB          | HTTPS            | 443   | Internet                  |
| EKS — Service      | ClusterIP        | 80    | Inside cluster only       |
| EKS — Pod          | Uvicorn/FastAPI  | 5000  | Inside cluster only       |
| EKS — API Server   | Kubernetes API   | 6443  | kubectl clients           |

---

*Institute ERP Deployment Guide — Last updated: June 2026*
