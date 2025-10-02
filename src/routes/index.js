import config from '../config/index.js';
import { RateLimit } from 'koa2-ratelimit';
import Router from '@koa/router';
import { listApps, describeApp, reloadApp, restartApp, stopApp } from '../providers/pm2/api.js';
import { validateAdminUser } from '../services/admin.service.js';
import { readLogsReverse } from '../utils/read-logs.util.js';
import { getCurrentGitBranch, getCurrentGitCommit } from '../utils/git.util.js';
import { getEnvFileContent, writeEnvFileContent } from '../utils/env.util.js';
import { isAuthenticated, checkAuthentication } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/role-check.js';
import AnsiConverter from 'ansi-to-html';

const router = new Router();
const ansiConvert = new AnsiConverter();

const loginRateLimiter = RateLimit.middleware({
    interval: 2*60*1000, // 2 minutes
    max: 100,
    prefixKey: '/login' // to allow the bdd to Differentiate the endpoint 
  });

router.get('/', async (ctx) => {
    return ctx.redirect('/login')
})

router.get('/login', loginRateLimiter, checkAuthentication, async (ctx) => {
    return await ctx.render('auth/login', {layout : false, login: { username: '', password:'', error: null }, csrf: ctx.csrf})
})

router.post('/login', loginRateLimiter, checkAuthentication, async (ctx) => {
    const { username, password } = ctx.request.body;
    try {
        const user = await validateAdminUser(username, password)
        ctx.session.isAuthenticated = true;
        ctx.session.user = user; // Store user info including role
        return ctx.redirect('/apps')
    }
    catch(err){
        return await ctx.render('auth/login', {layout : false, login: { username, password, error: err.message }, csrf: ctx.csrf})
    }
})

router.get('/apps', isAuthenticated, async (ctx) => {
    try {
        const apps = await listApps()
        return await ctx.render('apps/dashboard', {
            apps,
            csrf: ctx.csrf
        });
    } catch (err) {
        console.error('Failed to list apps:', err);
        throw err;
    }
});

router.get('/logout', (ctx)=>{
    ctx.session = null;
    return ctx.redirect('/login')
})

router.get('/apps/:appName', isAuthenticated, async (ctx) => {
    try {
        const { appName } = ctx.params

        if (!appName || typeof appName !== 'string') {
            ctx.throw(400, 'Invalid app name');
        }

        let app = await describeApp(appName)

        if (!app) {
            return ctx.redirect('/apps')
        }

        app.git_branch = await getCurrentGitBranch(app.pm2_env_cwd)
        app.git_commit = await getCurrentGitCommit(app.pm2_env_cwd)
        app.env_file = await getEnvFileContent(app.pm2_env_cwd)

        const stdout = await readLogsReverse({filePath: app.pm_out_log_path})
        const stderr = await readLogsReverse({filePath: app.pm_err_log_path})

        stdout.lines = stdout.lines.map(log => ansiConvert.toHtml(log)).join('<br/>')
        stderr.lines = stderr.lines.map(log => ansiConvert.toHtml(log)).join('<br/>')

        return await ctx.render('apps/app', {
            app,
            logs: {
                stdout,
                stderr
            },
            csrf: ctx.csrf
        });
    } catch (err) {
        console.error('Failed to fetch app details:', err);
        throw err;
    }
});

router.get('/api/apps/:appName/logs/:logType', isAuthenticated, async (ctx) => {
    try {
        const { appName, logType } = ctx.params
        const { linePerRequest, nextKey } = ctx.query

        if (logType !== 'stdout' && logType !== 'stderr') {
            ctx.throw(400, 'Log Type must be stdout or stderr');
        }

        if (!appName) {
            ctx.throw(400, 'App name is required');
        }

        const app = await describeApp(appName)

        if (!app) {
            ctx.throw(404, 'App not found');
        }

        const filePath = logType === 'stdout' ? app.pm_out_log_path : app.pm_err_log_path
        let logs = await readLogsReverse({filePath, nextKey})

        logs.lines = logs.lines.map(log => ansiConvert.toHtml(log)).join('<br/>')

        ctx.body = { logs };
    } catch (err) {
        console.error('Failed to fetch logs:', err);
        throw err;
    }
});

router.post('/api/apps/:appName/reload', isAuthenticated, requireRole('admin'), async (ctx) => {
    try {
        const { appName } = ctx.params

        if (!appName) {
            ctx.throw(400, 'App name is required');
        }

        const apps = await reloadApp(appName)

        if (Array.isArray(apps) && apps.length > 0) {
            ctx.body = { success: true }
        } else {
            ctx.body = { success: false, message: 'Failed to reload app' }
        }
    } catch (err) {
        console.error('Failed to reload app:', err);
        throw err;
    }
});

router.post('/api/apps/:appName/restart', isAuthenticated, requireRole('admin'), async (ctx) => {
    try {
        const { appName } = ctx.params

        if (!appName) {
            ctx.throw(400, 'App name is required');
        }

        const apps = await restartApp(appName)

        if (Array.isArray(apps) && apps.length > 0) {
            ctx.body = { success: true }
        } else {
            ctx.body = { success: false, message: 'Failed to restart app' }
        }
    } catch (err) {
        console.error('Failed to restart app:', err);
        throw err;
    }
});

router.post('/api/apps/:appName/stop', isAuthenticated, requireRole('admin'), async (ctx) => {
    try {
        const { appName } = ctx.params

        if (!appName) {
            ctx.throw(400, 'App name is required');
        }

        const apps = await stopApp(appName)

        if (Array.isArray(apps) && apps.length > 0) {
            ctx.body = { success: true }
        } else {
            ctx.body = { success: false, message: 'Failed to stop app' }
        }
    } catch (err) {
        console.error('Failed to stop app:', err);
        throw err;
    }
});

router.get('/api/apps/:appName/logs/:logType/stream', isAuthenticated, async (ctx) => {
    try {
        const { appName, logType } = ctx.params;

        if (logType !== 'stdout' && logType !== 'stderr') {
            ctx.throw(400, 'Log type must be stdout or stderr');
        }

        if (!appName) {
            ctx.throw(400, 'App name is required');
        }

        const app = await describeApp(appName);

        if (!app) {
            ctx.throw(404, 'App not found');
        }

        const filePath = logType === 'stdout' ? app.pm_out_log_path : app.pm_err_log_path;

        // Set SSE headers
        ctx.request.socket.setTimeout(0);
        ctx.req.socket.setNoDelay(true);
        ctx.req.socket.setKeepAlive(true);
        ctx.set({
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        });

        ctx.status = 200;

        // Import event-stream for tailing files
        const { createRequire } = await import('module');
        const require = createRequire(import.meta.url);
        const es = require('event-stream');
        const fs = require('fs-extra');

        const stream = fs.createReadStream(filePath, {
            encoding: 'utf-8',
            start: Math.max(0, (await fs.stat(filePath)).size - 10000) // Start from last 10KB
        });

        // Set up the response stream
        ctx.body = stream.pipe(es.split()).pipe(es.map((line, cb) => {
            if (line) {
                const html = ansiConvert.toHtml(line);
                cb(null, `data: ${JSON.stringify({ line: html })}\n\n`);
            } else {
                cb();
            }
        }));

        // Watch for new lines being appended to the file
        const watcher = fs.watch(filePath, async (eventType) => {
            if (eventType === 'change') {
                // File changed, send a ping to keep connection alive
                ctx.res.write(': ping\n\n');
            }
        });

        // Clean up on connection close
        ctx.req.on('close', () => {
            watcher.close();
        });

    } catch (err) {
        console.error('Failed to stream logs:', err);
        throw err;
    }
});

router.post('/api/apps/:appName/env', isAuthenticated, requireRole('admin'), async (ctx) => {
    try {
        const { appName } = ctx.params;
        const { envContent } = ctx.request.body;

        if (!appName) {
            ctx.throw(400, 'App name is required');
        }

        if (typeof envContent !== 'string') {
            ctx.throw(400, 'Environment content must be a string');
        }

        const app = await describeApp(appName);

        if (!app) {
            ctx.throw(404, 'App not found');
        }

        // Save the env file with raw content (preserves comments and formatting)
        await writeEnvFileContent(app.pm2_env_cwd, envContent);

        ctx.body = { success: true, message: 'Environment file saved successfully' };
    } catch (err) {
        console.error('Failed to save env file:', err);
        ctx.body = { success: false, message: err.message };
    }
});

export default router;
