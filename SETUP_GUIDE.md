# PM2 WebUI Setup Guide

## ⚠️ IMPORTANT: How PM2 WebUI Works

**PM2 WebUI ONLY manages PM2 processes on the SAME machine where it's installed.**

It **CANNOT** remotely connect to PM2 on other VMs. Think of it as a web-based wrapper around the local PM2 CLI.

```
┌─────────────────────────────────────┐
│         VM1 (Production)            │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Your Node.js Apps           │  │
│  │  ├─ API Server (PM2)         │  │
│  │  ├─ Worker (PM2)             │  │
│  │  └─ WebSocket Server (PM2)   │  │
│  └──────────────────────────────┘  │
│                ▲                    │
│                │ local PM2 API      │
│  ┌─────────────┴────────────────┐  │
│  │  PM2 WebUI                   │  │
│  │  (Install HERE - on VM1)     │  │
│  │  Manages VM1 apps only       │  │
│  └──────────────────────────────┘  │
│         Access via: http://VM1:4343 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│         VM2 (Staging)               │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Your Node.js Apps           │  │
│  │  ├─ API Server (PM2)         │  │
│  │  └─ Background Jobs (PM2)    │  │
│  └──────────────────────────────┘  │
│                ▲                    │
│                │ local PM2 API      │
│  ┌─────────────┴────────────────┐  │
│  │  PM2 WebUI                   │  │
│  │  (Install HERE TOO - on VM2) │  │
│  │  Manages VM2 apps only       │  │
│  └──────────────────────────────┘  │
│         Access via: http://VM2:4343 │
└─────────────────────────────────────┘
```

## Installation Approaches

### Approach 1: One Instance Per VM (Recommended for Production)
✅ Install PM2 WebUI on **each VM** that has PM2 processes
✅ Each instance manages only that VM's apps
✅ Access each dashboard separately

**Use this when**: You have separate production/staging/dev environments

### Approach 2: SSH Tunneling (For Remote Access)
✅ Install PM2 WebUI on each VM (same as above)
✅ Use SSH tunnels to access all dashboards from your local machine
✅ No need to open firewall ports

**Use this when**: VMs are not publicly accessible or you want extra security

### Approach 3: Single VM Only
✅ Install PM2 WebUI on one VM
✅ Only manage that VM's processes

**Use this when**: You only have one server to manage

---

## Quick Start (Single VM)

### Prerequisites
- Node.js 14.13.0+ installed
- PM2 installed (`npm install -g pm2`)
- Your Node.js applications already running under PM2

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/suryamodulus/pm2-webui
cd pm2-webui

# 2. Install dependencies
npm install

# 3. Copy environment configuration
cp env.example .env

# 4. Setup admin user
npm run setup-admin-user
# Follow the prompts to create username/password

# 5. Start PM2 WebUI
npm start
```

The web interface will be available at `http://127.0.0.1:4343`

---

## Production Setup: Multiple VMs

### Scenario: 2 VMs with Node.js Applications

```
Your Infrastructure:
┌─────────────────────────────────────────────────────────────┐
│  VM1 (192.168.1.10) - Production                           │
│  Running: API Server, Worker, WebSocket Server (all PM2)   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  VM2 (192.168.1.20) - Staging                              │
│  Running: API Server, Background Jobs (all PM2)            │
└─────────────────────────────────────────────────────────────┘
```

### Step-by-Step Installation

#### Prerequisites (on EACH VM)
- ✅ Node.js 14.13.0+ installed
- ✅ PM2 installed globally (`npm install -g pm2`)
- ✅ Your applications already running via PM2 (`pm2 list` shows your apps)

---

#### Step 1: Install on VM1 (Production)

```bash
# SSH into VM1
ssh user@192.168.1.10

# Navigate to installation directory (can be anywhere)
cd /opt  # or /home/user or wherever you prefer

# Clone repository
git clone https://github.com/suryamodulus/pm2-webui
cd pm2-webui

# Install dependencies
npm install

# Configure environment
cp env.example .env
nano .env
```

**Edit `.env` file on VM1:**
```bash
# IMPORTANT: Set to 0.0.0.0 to allow access from your network
HOST=0.0.0.0

# Default port
PORT=4343

# HTTPS (optional, but recommended for production)
HTTPS_ENABLED=false
# HTTPS_KEY_PATH=/path/to/ssl/key.pem
# HTTPS_CERT_PATH=/path/to/ssl/cert.pem
```

```bash
# Create admin user
npm run setup-admin-user
# Enter username (e.g., "admin")
# Enter password (strong password with symbols, uppercase, numbers)
# Confirm

# Start PM2 WebUI using PM2 (so it auto-restarts)
pm2 start src/app.js --name pm2-webui
pm2 save
pm2 startup  # Enable auto-start on boot
```

**Test VM1 installation:**
```bash
# From VM1
curl http://localhost:4343

# From your local machine (if firewall allows)
# Open browser: http://192.168.1.10:4343
```

---

#### Step 2: Install on VM2 (Staging)

```bash
# SSH into VM2
ssh user@192.168.1.20

# Repeat EXACT same steps as VM1
cd /opt
git clone https://github.com/suryamodulus/pm2-webui
cd pm2-webui
npm install
cp env.example .env
nano .env  # Set HOST=0.0.0.0
npm run setup-admin-user  # Can use same or different credentials
pm2 start src/app.js --name pm2-webui
pm2 save
pm2 startup
```

---

#### Step 3: Configure Firewall (Important!)

**On VM1:**
```bash
# Option A: Allow from specific IPs only (recommended)
sudo ufw allow from YOUR_IP_ADDRESS to any port 4343
sudo ufw allow from YOUR_OFFICE_NETWORK/24 to any port 4343

# Option B: Allow from anywhere (less secure)
sudo ufw allow 4343

# Check status
sudo ufw status
```

**On VM2:**
```bash
# Same as VM1
sudo ufw allow from YOUR_IP_ADDRESS to any port 4343
sudo ufw status
```

---

#### Step 4: Access Your Dashboards

**Bookmark these URLs:**
- 📊 **Production (VM1)**: `http://192.168.1.10:4343`
- 📊 **Staging (VM2)**: `http://192.168.1.20:4343`

**Login** with the admin credentials you created.

**What you'll see:**
- VM1 dashboard shows ONLY VM1's PM2 apps
- VM2 dashboard shows ONLY VM2's PM2 apps

---

### Verification Checklist

After installation, verify everything works:

**On VM1:**
```bash
# 1. Check PM2 WebUI is running
pm2 list
# Should show "pm2-webui" as "online"

# 2. Check port is listening
sudo netstat -tulpn | grep 4343
# Should show node listening on port 4343

# 3. Check your apps are visible
curl http://localhost:4343/api/apps
# Should return JSON with your apps (after login)

# 4. Check logs if issues
pm2 logs pm2-webui
```

**On VM2:**
```bash
# Same checks as VM1
pm2 list
sudo netstat -tulpn | grep 4343
pm2 logs pm2-webui
```

---

### Important Notes

#### 🔴 Common Mistake:
**DO NOT install PM2 WebUI on a 3rd VM and expect it to manage VM1 and VM2.**

Each VM needs its own PM2 WebUI installation.

#### ✅ Correct Setup:
```
VM1 → PM2 WebUI on VM1 → Manages VM1 apps ✓
VM2 → PM2 WebUI on VM2 → Manages VM2 apps ✓
```

#### ❌ Incorrect Setup:
```
VM3 → PM2 WebUI on VM3 → Cannot manage VM1 or VM2 ✗
```

#### 💡 Why?
PM2 WebUI uses the local PM2 API (`pm2.connect()`) which only works on the same machine. It's not designed for remote connections.

#### 🔒 Security:
- Each dashboard has its own authentication
- Use different passwords for production vs staging
- Consider HTTPS for production (see HTTPS section below)
- Restrict firewall access to trusted IPs only

---

### Method 2: Central Dashboard with SSH Tunneling

Run PM2 WebUI on your local machine and use SSH tunnels to access each VM's PM2.

#### On Your Local Machine:

```bash
# Terminal 1 - Tunnel to VM1
ssh -L 4343:localhost:4343 user@192.168.1.10

# Terminal 2 - Tunnel to VM2
ssh -L 4344:localhost:4343 user@192.168.1.20
```

#### On Each VM:
```bash
# Install and run PM2 WebUI locally
cd ~/pm2-webui
npm install
cp env.example .env
npm run setup-admin-user
npm start
```

#### Access from Local Machine:
- VM1: `http://localhost:4343`
- VM2: `http://localhost:4344`

---

### Method 3: Nginx Reverse Proxy (Production Setup)

Use Nginx as a reverse proxy to access multiple PM2 WebUI instances from a single domain.

#### Nginx Configuration:

```nginx
# /etc/nginx/sites-available/pm2-webui

server {
    listen 80;
    server_name pm2.yourdomain.com;

    # VM1 - Production
    location /vm1/ {
        proxy_pass http://192.168.1.10:4343/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # VM2 - Staging
    location /vm2/ {
        proxy_pass http://192.168.1.20:4343/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/pm2-webui /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Access:
- VM1: `http://pm2.yourdomain.com/vm1`
- VM2: `http://pm2.yourdomain.com/vm2`

---

## Configuration Options

### Environment Variables (.env)

```bash
# Network Configuration
HOST=127.0.0.1          # 0.0.0.0 for external access
PORT=4343               # Web interface port

# HTTPS Configuration (Optional)
HTTPS_ENABLED=false
HTTPS_KEY_PATH=/path/to/private.key
HTTPS_CERT_PATH=/path/to/certificate.crt

# Authentication (Set via npm run setup-admin-user)
APP_USERNAME=admin
APP_PASSWORD=<bcrypt_hashed_password>
APP_SESSION_SECRET=<auto_generated>

# Features
SHOW_GIT_INFO=false     # Show git branch/commit info
SHOW_ENV_FILE=false     # Show environment variables
```

---

## Security Best Practices

### 1. Use HTTPS in Production

```bash
# Generate self-signed certificate (development)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Update .env
HTTPS_ENABLED=true
HTTPS_KEY_PATH=/path/to/key.pem
HTTPS_CERT_PATH=/path/to/cert.pem
```

### 2. Firewall Rules

Only allow trusted IPs to access the web interface:

```bash
# UFW (Ubuntu)
sudo ufw allow from 192.168.1.0/24 to any port 4343
sudo ufw deny 4343

# iptables
sudo iptables -A INPUT -p tcp -s 192.168.1.0/24 --dport 4343 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 4343 -j DROP
```

### 3. User Roles

PM2 WebUI supports two roles:

- **admin**: Full access (restart, stop, reload apps)
- **viewer**: Read-only access (view apps and logs only)

```bash
# Add viewer user (after first startup)
# Use the user management API or modify src/config/users.json
{
  "users": [
    {
      "username": "admin",
      "password": "<bcrypt_hash>",
      "role": "admin",
      "createdAt": "2025-10-02T..."
    },
    {
      "username": "developer",
      "password": "<bcrypt_hash>",
      "role": "viewer",
      "createdAt": "2025-10-02T..."
    }
  ]
}
```

### 4. Run as systemd Service

Create `/etc/systemd/system/pm2-webui.service`:

```ini
[Unit]
Description=PM2 Web UI
After=network.target

[Service]
Type=simple
User=nodejs
WorkingDirectory=/opt/pm2-webui
ExecStart=/usr/bin/node /opt/pm2-webui/src/app.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=pm2-webui

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable pm2-webui
sudo systemctl start pm2-webui
sudo systemctl status pm2-webui
```

---

## Common Use Cases

### Use Case 1: Managing Multiple Apps on One Server

1. Start your Node.js apps with PM2:
```bash
pm2 start app1.js --name "api-server"
pm2 start app2.js --name "worker-service"
pm2 start app3.js --name "websocket-server"
pm2 save
```

2. Access PM2 WebUI at `http://your-server:4343`
3. View all apps, logs, restart/reload as needed

### Use Case 2: Development + Production Separation

**Production VM** (198.51.100.10):
```bash
cd /opt/pm2-webui
nano .env
# HOST=0.0.0.0
# PORT=4343
npm start
```

**Staging VM** (198.51.100.20):
```bash
cd /opt/pm2-webui
nano .env
# HOST=0.0.0.0
# PORT=4343
npm start
```

Bookmark both URLs:
- Production: `http://198.51.100.10:4343`
- Staging: `http://198.51.100.20:4343`

### Use Case 3: Team Access with Different Permissions

1. Create admin account:
```bash
npm run setup-admin-user
# Username: admin
# Password: <strong-password>
```

2. Add viewer accounts by editing `src/config/users.json`:
```json
{
  "users": [
    {
      "username": "admin",
      "password": "$2a$10$...",
      "role": "admin",
      "createdAt": "2025-10-02T10:00:00Z"
    },
    {
      "username": "dev_team",
      "password": "$2a$10$...",
      "role": "viewer",
      "createdAt": "2025-10-02T10:05:00Z"
    }
  ]
}
```

3. Developers log in with `dev_team` account (read-only)
4. DevOps uses `admin` account (full control)

---

## Troubleshooting

### Port Already in Use
```bash
# Find what's using port 4343
sudo lsof -i :4343
# Or
sudo netstat -tulpn | grep 4343

# Kill the process or change PORT in .env
```

### Cannot Connect Remotely
```bash
# Check HOST setting in .env
# Should be 0.0.0.0 not 127.0.0.1

# Check firewall
sudo ufw status
sudo iptables -L -n | grep 4343
```

### PM2 Apps Not Showing
```bash
# Ensure PM2 daemon is running
pm2 list

# Check PM2 WebUI is running as same user as PM2
whoami
ps aux | grep PM2

# PM2 WebUI must run as the same user who started PM2
```

### EACCES: Permission Denied
```bash
# Run as the correct user
sudo -u nodejs npm start

# Or fix permissions
sudo chown -R nodejs:nodejs /opt/pm2-webui
```

---

## Advanced Features

### Viewing Real-time Logs

1. Click on an app name in the dashboard
2. View stdout and stderr logs
3. Logs are paginated (50 lines per page)
4. Scroll to load more

### Git Information

Enable in `.env`:
```bash
SHOW_GIT_INFO=true
```

Shows current branch and commit for each app (if running from a git repo).

### Environment Variables

Enable in `.env`:
```bash
SHOW_ENV_FILE=true
```

View `.env` file contents for each app directory.

---

## Upgrading

```bash
cd pm2-webui
git pull origin main
npm install
pm2 restart pm2-webui  # If running via PM2
# Or
sudo systemctl restart pm2-webui  # If using systemd
```

---

## Support & Contributing

- **Issues**: https://github.com/suryamodulus/pm2-webui/issues
- **Docs**: https://github.com/suryamodulus/pm2-webui
- **License**: MIT

---

## Quick Reference

| Action | Command |
|--------|---------|
| Install | `npm install` |
| Setup Admin | `npm run setup-admin-user` |
| Start (Dev) | `npm run start:dev` |
| Start (Prod) | `npm start` |
| Access Local | `http://localhost:4343` |
| Access Remote | `http://your-server-ip:4343` |
| View Logs | Click app name → View logs tab |
| Restart App | Click app → Restart button |
| Reload App | Click app → Reload button (0 downtime) |
| Stop App | Click app → Stop button |

---

## Example Multi-VM Setup

```
                    ┌─────────────────┐
                    │  Your Browser   │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
         ┌──────▼──────┐          ┌──────▼──────┐
         │   VM1:4343  │          │   VM2:4343  │
         │ (Production)│          │  (Staging)  │
         └──────┬──────┘          └──────┬──────┘
                │                        │
         ┌──────▼──────┐          ┌──────▼──────┐
         │ PM2 WebUI   │          │ PM2 WebUI   │
         │   Instance  │          │   Instance  │
         └──────┬──────┘          └──────┬──────┘
                │                        │
         ┌──────▼──────┐          ┌──────▼──────┐
         │    PM2      │          │    PM2      │
         │  Daemon     │          │  Daemon     │
         └──────┬──────┘          └──────┬──────┘
                │                        │
    ┌───────────┴───────────┐   ┌────────┴────────┐
    │                       │   │                 │
┌───▼───┐  ┌───▼───┐  ┌───▼───┐  ┌───▼───┐  ┌───▼───┐
│ App1  │  │ App2  │  │ App3  │  │ App4  │  │ App5  │
└───────┘  └───────┘  └───────┘  └───────┘  └───────┘
```

Each VM runs its own PM2 WebUI instance managing its local PM2 processes.
