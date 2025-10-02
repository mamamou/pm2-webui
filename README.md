### PM2 WebUI
Opensource Alternative to PM2 Plus

##### FEATURES
- Secure Login :white_check_mark:
- App Management :white_check_mark:
- Log Viewer :white_check_mark:
- Responsive UI :white_check_mark:
- Manual and Auto(Github webhooks) Deployment
- Environment Management

##### QUICK START
```bash
git clone https://github.com/suryamodulus/pm2-webui
cd pm2-webui
npm install
cp env.example .env
npm run setup-admin-user  # Required for login
npm start
```

**Access**: `http://localhost:4343`

📚 **Documentation**:
- 🚀 [Quick Start for Multiple VMs](QUICK_START.md) - Start here!
- 📖 [Complete Setup Guide](SETUP_GUIDE.md) - Advanced configurations

##### FOR DEVELOPMENT USE
```bash
npm run start:dev
```

#### COMPLETED ✅
- [x] use fs-extra for filesystem operations
- [x] replace exec.util with [execa](https://www.npmjs.com/package/execa)
- [x] add multi-user support with roles (admin/viewer)
- [x] add CSRF protection
- [x] add request logging
- [x] add comprehensive error handling
- [x] add HTTPS support
- [x] migrate to ES Modules (ESM)

#### TODO
- [ ] support for relative paths
- [ ] use [jsonfile](https://www.npmjs.com/package/jsonfile) for config management
- [ ] add form based env management
- [ ] add realtime logs (WebSocket/SSE)
- [ ] add log viewer for deployments
- [ ] add deployment abort functionality
- [ ] add deployment triggers
- [ ] add web terminal
- [ ] add zero downtime deployment strategies - blue-green, rolling etc
- [ ] add docker provider support
- [ ] add metrics/monitoring dashboard

##### SCREENSHOTS
![PM2 Webui Login](/screenshots/login.png?raw=true "PM2 WebUI Login")
![PM2 Webui Dashboard](/screenshots/dashboard.png?raw=true "PM2 WebUI Dashboard")
![PM2 Webui App](/screenshots/app.png?raw=true "PM2 WebUI App")

##### LICENSE
MIT - Copyright (c) 2022 Surya T
