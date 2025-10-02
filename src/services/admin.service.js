import config from '../config/index.js';
import { setEnvDataSync } from '../utils/env.util.js';
import { hashPasswordSync, comparePassword } from '../utils/password.util.js';
import { validateUser, migrateAdminUser } from './user.service.js';

const createAdminUser = (username, password) => {
    const adminUser = {
        APP_USERNAME: username,
        APP_PASSWORD: hashPasswordSync(password)
    }
    setEnvDataSync(config.APP_DIR, adminUser)
}

const validateAdminUser = async (username, password) => {
    // Try new multi-user system first
    try {
        const user = await validateUser(username, password);
        return user;
    } catch (err) {
        // Fallback to old single admin user from .env
        if (username !== config.APP_USERNAME) {
            throw new Error('User does not exist')
        }
        const isPasswordCorrect = await comparePassword(password, config.APP_PASSWORD)
        if (!isPasswordCorrect) {
            throw new Error('Password is incorrect')
        }

        // Migrate old admin user to new system
        try {
            await migrateAdminUser(config.APP_USERNAME, config.APP_PASSWORD);
        } catch (migrationErr) {
            console.error('Failed to migrate admin user:', migrationErr);
        }

        return { username: config.APP_USERNAME, role: 'admin' };
    }
}

export { createAdminUser, validateAdminUser };