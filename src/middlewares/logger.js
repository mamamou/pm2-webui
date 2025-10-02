/**
 * Request logging middleware
 * Logs all HTTP requests with timing information
 */
const logger = async (ctx, next) => {
    const start = Date.now();
    const requestId = Math.random().toString(36).substring(7);

    // Log incoming request
    console.log(`[${requestId}] --> ${ctx.method} ${ctx.path}`, {
        ip: ctx.ip,
        userAgent: ctx.get('user-agent'),
        timestamp: new Date().toISOString()
    });

    try {
        await next();

        // Log successful response
        const duration = Date.now() - start;
        console.log(`[${requestId}] <-- ${ctx.method} ${ctx.path} ${ctx.status} ${duration}ms`);
    } catch (err) {
        // Log error response
        const duration = Date.now() - start;
        console.error(`[${requestId}] <-- ${ctx.method} ${ctx.path} ERROR ${duration}ms`, {
            error: err.message,
            stack: err.stack
        });
        throw err; // Re-throw to be caught by error handler
    }
};

export default logger;
