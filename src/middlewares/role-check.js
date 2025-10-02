/**
 * Middleware to check if user has required role
 */
const requireRole = (requiredRole) => {
    return async (ctx, next) => {
        if (!ctx.session.user) {
            ctx.throw(401, 'Not authenticated');
        }

        const userRole = ctx.session.user.role;

        // Admin has access to everything
        if (userRole === 'admin') {
            return await next();
        }

        // Check specific role requirement
        if (requiredRole === 'admin' && userRole !== 'admin') {
            ctx.throw(403, 'Insufficient permissions. Admin role required.');
        }

        await next();
    };
};

export { requireRole };
