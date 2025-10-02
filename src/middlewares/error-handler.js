/**
 * Global error handling middleware for Koa
 * Catches all errors and provides consistent error responses
 */
const errorHandler = async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        // Log error details
        console.error('Error occurred:', {
            message: err.message,
            stack: err.stack,
            path: ctx.path,
            method: ctx.method,
            ip: ctx.ip,
            timestamp: new Date().toISOString()
        });

        // Set status code
        ctx.status = err.status || err.statusCode || 500;

        // Determine if this is an API request
        const isApiRequest = ctx.path.startsWith('/api/');

        if (isApiRequest) {
            // API error response
            ctx.body = {
                error: {
                    message: ctx.status === 500 ? 'Internal server error' : err.message,
                    status: ctx.status
                }
            };
        } else {
            // For HTML requests, redirect to error page or login
            if (ctx.status === 401 || ctx.status === 403) {
                ctx.redirect('/login');
            } else {
                // Render error page or show generic error
                ctx.body = `
                    <html>
                        <head><title>Error ${ctx.status}</title></head>
                        <body>
                            <h1>Error ${ctx.status}</h1>
                            <p>${ctx.status === 500 ? 'Internal server error' : err.message}</p>
                            <a href="/apps">Go to Dashboard</a>
                        </body>
                    </html>
                `;
            }
        }

        // Emit error event for potential logging services
        ctx.app.emit('error', err, ctx);
    }
};

export default errorHandler;
