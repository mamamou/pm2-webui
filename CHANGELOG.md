# Changelog

## [Unreleased] - 2025-10-02

### High Priority Security & Stability Improvements

#### Security Enhancements
- **Replaced child_process.exec with execa** - Eliminated shell injection vulnerabilities in git operations
- **Added comprehensive path validation** - Created path-validator utility to prevent directory traversal attacks
- **Updated all dependencies** - Reduced vulnerabilities from 39 to 7
  - PM2: 5.1.2 → 6.0.13
  - koa2-ratelimit: 0.9.1 → 1.1.3
  - All other packages updated to latest compatible versions
- **Added HTTPS support** - Configurable HTTPS with certificate management
- **Implemented CSRF protection** - Using koa-csrf with SameSite cookies for enhanced security

#### Bug Fixes
- **Fixed NaN comparison bug** - Changed `lines === NaN` to `isNaN(lines)` in log reader
- **Fixed typo** - Renamed `sentDateSize` to `sentDataSize` in read-logs utility

### Medium Priority Feature Additions

#### Error Handling & Logging
- **Added global error handler middleware** - Consistent error responses for API and HTML requests
- **Added request logging middleware** - Logs all HTTP requests with timing and request IDs
- **Improved route error handling** - All routes now have comprehensive try-catch blocks with proper error propagation

#### Security Features
- **CSRF Protection** - Implemented for all state-changing operations (POST requests)
  - Added CSRF token meta tag to base template
  - Updated client-side code to include CSRF tokens in requests
  - Configured SameSite strict cookies

#### User Management
- **Multi-user support with roles** - Added role-based access control
  - Two roles: `admin` (full access) and `viewer` (read-only)
  - Created user service with CRUD operations
  - Automatic migration from old single-admin system
  - Role-based middleware for protecting admin-only routes
  - Viewers can view apps and logs but cannot restart/stop/reload

#### Code Quality
- **Replaced fs with fs-extra** - Using fs-extra throughout codebase for better file operations
- **Better input validation** - Added validation for app names and log types in API routes
- **Improved code structure** - Cleaner error handling and more maintainable code

### Files Added
- `src/middlewares/error-handler.js` - Global error handling
- `src/middlewares/logger.js` - Request logging
- `src/middlewares/role-check.js` - Role-based access control
- `src/services/user.service.js` - Multi-user management
- `src/config/users.json` - User database
- `src/utils/path-validator.util.js` - Path validation utilities

### Configuration Changes
- Added HTTPS configuration options to env.example:
  - `HTTPS_ENABLED` - Enable/disable HTTPS
  - `HTTPS_KEY_PATH` - Path to SSL private key
  - `HTTPS_CERT_PATH` - Path to SSL certificate

### Breaking Changes
- Session configuration now includes `sameSite: 'strict'` and `httpOnly: true`
- API error responses now use consistent format: `{ error: { message, status } }`
- Admin-only routes now return 403 for non-admin users instead of allowing access

### Remaining Known Issues
- 7 vulnerabilities remain from indirect dependencies (koa-ejs→ejs and koa2-ratelimit→mongoose/sequelize)
- These are dev/optional dependencies not critical for runtime security

## [Unreleased] - 2025-10-02 (Part 2)

### Major Migration: CommonJS to ES Modules

#### Modernization
- **Migrated entire codebase from CommonJS to ES Modules (ESM)**
  - Added `"type": "module"` to package.json
  - Converted all `require()` to `import` statements
  - Converted all `module.exports` to `export` statements
  - Added `__dirname` and `__filename` polyfills using `fileURLToPath` and `import.meta.url`
  - Used `createRequire` for legacy CommonJS-only packages (envfile)

#### Dependency Updates
- **execa**: 5.1.1 → 9.6.0 (latest version, now possible with ESM)
- **All other packages remain at latest versions**

#### Benefits
- Modern JavaScript module system
- Better tree-shaking and optimization
- Access to latest package versions
- Future-proof codebase
- Improved developer experience

#### Files Modified
- All `.js` files converted to use ES Module syntax
- Import paths updated to include `.js` extensions (ESM requirement)
- `/src/app.js` - Main application file
- `/src/config/index.js` - Configuration
- `/src/routes/index.js` - Route definitions  
- `/src/services/*.js` - All service files
- `/src/middlewares/*.js` - All middleware files
- `/src/utils/*.js` - All utility files
- `/src/providers/pm2/*.js` - PM2 provider files
- `/src/bin/setup-admin-user.js` - Setup script

#### Breaking Changes
- Project now requires Node.js with ES Module support (Node 14.13.0+)
- All imports must include file extensions (`.js`)
- Cannot use `require()` without `createRequire` helper

### All Libraries Now Up-to-Date ✅
Every library is now at its latest version with no outdated packages!
