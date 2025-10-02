#!/usr/bin/env node

import config from './config/index.js';
import { setEnvDataSync } from './utils/env.util.js';
import { generateRandomString } from './utils/random.util.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import https from 'https';
import http from 'http';
import serve from 'koa-static';
import render from 'koa-ejs';
import { koaBody } from 'koa-body';
import session from 'koa-session';
import CSRF from 'koa-csrf';
import Koa from 'koa';
import logger from './middlewares/logger.js';
import errorHandler from './middlewares/error-handler.js';
import router from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Init Application

if(!config.APP_USERNAME || !config.APP_PASSWORD){
    console.log("You must first setup admin user. Run command -> npm run setup-admin-user")
    process.exit(2)
}

if(!config.APP_SESSION_SECRET){
    const randomString = generateRandomString()
    setEnvDataSync(config.APP_DIR, { APP_SESSION_SECRET: randomString})
    config.APP_SESSION_SECRET = randomString
}

// Create App Instance
const app = new Koa();

// App Settings
app.proxy = true;
app.keys = [config.APP_SESSION_SECRET];

// Middlewares
// Request logging (first to log everything)
app.use(logger);

const sessionConfig = {
    sameSite: 'strict', // CSRF protection via SameSite cookie
    httpOnly: true,
    secure: config.HTTPS_ENABLED, // Only send over HTTPS when enabled
};
app.use(session(sessionConfig, app));

app.use(koaBody());

// CSRF protection for state-changing operations
app.use(new CSRF({
    invalidTokenMessage: 'Invalid CSRF token',
    invalidTokenStatusCode: 403,
    excludedMethods: ['GET', 'HEAD', 'OPTIONS'],
    disableQuery: false
}));

app.use(serve(path.join(__dirname, 'public')));

// Error handling middleware
app.use(errorHandler);

app.use(router.routes());

render(app, {
    root: path.join(__dirname, 'views'),
    layout: 'base',
    viewExt: 'html',
    cache: false,
    debug: false
});

// Start server with HTTPS or HTTP
if (config.HTTPS_ENABLED) {
    if (!config.HTTPS_KEY_PATH || !config.HTTPS_CERT_PATH) {
        console.error('HTTPS is enabled but HTTPS_KEY_PATH or HTTPS_CERT_PATH is not set');
        process.exit(1);
    }

    try {
        const httpsOptions = {
            key: fs.readFileSync(config.HTTPS_KEY_PATH),
            cert: fs.readFileSync(config.HTTPS_CERT_PATH)
        };

        https.createServer(httpsOptions, app.callback()).listen(config.PORT, config.HOST, () => {
            console.log(`Application started at https://${config.HOST}:${config.PORT}`);
        });
    } catch (err) {
        console.error('Failed to start HTTPS server:', err.message);
        process.exit(1);
    }
} else {
    http.createServer(app.callback()).listen(config.PORT, config.HOST, () => {
        console.log(`Application started at http://${config.HOST}:${config.PORT}`);
    });
}