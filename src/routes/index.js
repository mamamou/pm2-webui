import config from '../config/index.js';
import { RateLimit } from 'koa2-ratelimit';
import Router from '@koa/router';
import { listApps, describeApp, reloadApp, restartApp, stopApp } from '../providers/pm2/api.js';
import { validateAdminUser } from '../services/admin.service.js';
import { readLogsReverse } from '../utils/read-logs.util.js';
import { getCurrentGitBranch, getCurrentGitCommit } from '../utils/git.util.js';
import { getEnvFileContent } from '../utils/env.util.js';
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
    return await ctx.render('auth/login', {layout : false, login: { username: '', password:'', error: null }})
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
        return await ctx.render('auth/login', {layout : false, login: { username, password, error: err.message }})
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

export default router;
