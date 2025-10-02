# PM2 WebUI - Quick Start for Multiple VMs

## TL;DR - What is this?

PM2 WebUI is a web dashboard to manage your Node.js applications running under PM2 (Process Manager 2). Think of it as a prettier, more accessible alternative to running `pm2 list`, `pm2 logs`, and `pm2 restart` in the terminal.

## ⚠️ Critical Understanding

**PM2 WebUI ONLY manages PM2 processes on the SAME machine where it's installed.**

It **CANNOT** remotely connect to PM2 on other VMs. It's a local web interface for the local PM2 daemon.

```
✅ CORRECT:                          ❌ WRONG:
Each VM has its own instance         One VM manages all others

VM1 + PM2 WebUI → VM1 apps           VM3 + PM2 WebUI → ✗ Can't reach VM1/VM2
VM2 + PM2 WebUI → VM2 apps
```

### For Your 2 VMs Setup:

**You MUST install PM2 WebUI on BOTH VMs.**

Each installation manages only that VM's PM2 processes.

#### Option 1: Install on Each VM (Simplest)

```bash
# On VM1 (Production)
git clone https://github.com/mamamou/pm2-webui
cd pm2-webui
npm install
cp env.example .env
nano .env  # Set HOST=0.0.0.0 to allow remote access
npm run setup-admin-user
npm start
```

```bash
# On VM2 (Staging) - Same steps
git clone https://github.com/mamamou/pm2-webui
cd pm2-webui
npm install
cp env.example .env
nano .env  # Set HOST=0.0.0.0
npm run setup-admin-user
npm start
```

**Access:**
- VM1: `http://192.168.1.10:4343` (manages VM1's apps)
- VM2: `http://192.168.1.20:4343` (manages VM2's apps)

#### Option 2: SSH Tunneling (One Dashboard Locally)

If you prefer accessing both from your local machine:

```bash
# Terminal 1 - Connect to VM1
ssh -L 4343:localhost:4343 user@vm1-ip

# Terminal 2 - Connect to VM2  
ssh -L 4344:localhost:4343 user@vm2-ip
```

Then access:
- VM1: `http://localhost:4343`
- VM2: `http://localhost:4344`

## What Can You Do?

Once logged in, you can:

### View All Apps
See all PM2 processes with:
- Status (online/stopped/errored)
- CPU usage
- Memory usage
- Uptime

### Manage Apps
- **Reload**: Zero-downtime restart (keeps connections alive)
- **Restart**: Hard restart (kills and restarts)
- **Stop**: Stop the application

### View Logs
- Real-time stdout/stderr logs
- Paginated for easy browsing
- Color-coded for better readability

### See Git Info
- Current branch
- Latest commit hash

## Configuration

Edit `.env` file:

```bash
# Allow connections from other machines (not just localhost)
HOST=0.0.0.0

# Change port if needed
PORT=4343

# Enable HTTPS (optional, for production)
HTTPS_ENABLED=false
HTTPS_KEY_PATH=/path/to/key.pem
HTTPS_CERT_PATH=/path/to/cert.pem
```

## Security

### User Roles

Two types of users:

1. **admin**: Full control (can restart/stop apps)
2. **viewer**: Read-only (can only view apps and logs)

### Firewall

Only allow your IP to access the web interface:

```bash
# Ubuntu/Debian
sudo ufw allow from YOUR_IP to any port 4343

# Or use IP range for your office network
sudo ufw allow from 192.168.1.0/24 to any port 4343
```

### HTTPS

For production, enable HTTPS:

```bash
# Generate certificate (self-signed for testing)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Update .env
HTTPS_ENABLED=true
HTTPS_KEY_PATH=/path/to/key.pem
HTTPS_CERT_PATH=/path/to/cert.pem
```

## Running in Production

### Keep it Running with PM2 (Inception!)

```bash
# Use PM2 to manage PM2 WebUI itself
pm2 start src/app.js --name pm2-webui
pm2 save
pm2 startup  # Enable auto-start on boot
```

### Or Use systemd

Create `/etc/systemd/system/pm2-webui.service`:

```ini
[Unit]
Description=PM2 Web UI
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/pm2-webui
ExecStart=/usr/bin/node /path/to/pm2-webui/src/app.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable pm2-webui
sudo systemctl start pm2-webui
```

## Typical Workflow

### Daily Operations:

1. **Check Status**: Open web dashboard → see all apps at a glance
2. **View Logs**: Click app name → scroll through logs
3. **Deploy Update**: 
   - SSH to server
   - Pull latest code
   - Return to dashboard → Click "Reload" button (zero downtime!)

### Troubleshooting:

1. App crashed? See it instantly on dashboard (red status)
2. Click app name → view error logs
3. Click "Restart" to recover

## Example: Real-World Setup

### VM1 - Production (IP: 10.0.1.10)
Running:
- API Server (Node.js)
- Worker Service (Node.js)
- WebSocket Server (Node.js)

**PM2 WebUI**: `http://10.0.1.10:4343`

### VM2 - Staging (IP: 10.0.1.20)
Running:
- API Server (Node.js)
- Background Jobs (Node.js)

**PM2 WebUI**: `http://10.0.1.20:4343`

### Your Workflow:

1. Bookmark both URLs
2. Check VM1 dashboard for production health
3. Check VM2 dashboard for staging tests
4. Deploy to staging → test → reload production apps

## Common Issues

### Can't access from browser?
- Check `HOST=0.0.0.0` in `.env`
- Check firewall allows port 4343
- Check PM2 WebUI is running: `ps aux | grep node`

### Apps not showing?
- Ensure PM2 WebUI runs as **same user** as PM2
- Check: `pm2 list` (should show your apps)

### "Must setup admin user" error?
- Run: `npm run setup-admin-user`

## Need More Details?

📖 **Full documentation**: [SETUP_GUIDE.md](SETUP_GUIDE.md)

## Questions?

- GitHub Issues: https://github.com/mamamou/pm2-webui/issues
- PM2 Docs: https://pm2.keymetrics.io/

---

**Summary**: Install PM2 WebUI on each VM. Each instance manages that VM's PM2 processes. Simple, secure, and works great for multiple servers! 🚀
