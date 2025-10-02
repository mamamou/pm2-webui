import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { hashPasswordSync, comparePassword } from '../utils/password.util.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_FILE = path.join(__dirname, '../config/users.json');

/**
 * User roles: admin, viewer
 * - admin: full access to all PM2 operations
 * - viewer: read-only access (can view apps and logs, cannot restart/stop/reload)
 */

// Ensure users file exists
async function ensureUsersFile() {
    try {
        await fs.ensureFile(USERS_FILE);
        const content = await fs.readFile(USERS_FILE, 'utf-8');
        if (!content.trim()) {
            await fs.writeJson(USERS_FILE, { users: [] });
        }
    } catch (err) {
        await fs.writeJson(USERS_FILE, { users: [] });
    }
}

// Get all users
async function getUsers() {
    await ensureUsersFile();
    const data = await fs.readJson(USERS_FILE);
    return data.users || [];
}

// Get user by username
async function getUserByUsername(username) {
    const users = await getUsers();
    return users.find(u => u.username === username);
}

// Create new user
async function createUser(username, password, role = 'viewer') {
    if (!username || !password) {
        throw new Error('Username and password are required');
    }

    if (!['admin', 'viewer'].includes(role)) {
        throw new Error('Role must be admin or viewer');
    }

    const users = await getUsers();

    // Check if user already exists
    if (users.find(u => u.username === username)) {
        throw new Error('User already exists');
    }

    const newUser = {
        username,
        password: hashPasswordSync(password),
        role,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await fs.writeJson(USERS_FILE, { users }, { spaces: 2 });

    return { username, role, createdAt: newUser.createdAt };
}

// Validate user credentials
async function validateUser(username, password) {
    const user = await getUserByUsername(username);

    if (!user) {
        throw new Error('User does not exist');
    }

    const isPasswordCorrect = await comparePassword(password, user.password);

    if (!isPasswordCorrect) {
        throw new Error('Password is incorrect');
    }

    return { username: user.username, role: user.role };
}

// Update user password
async function updateUserPassword(username, newPassword) {
    const users = await getUsers();
    const userIndex = users.findIndex(u => u.username === username);

    if (userIndex === -1) {
        throw new Error('User not found');
    }

    users[userIndex].password = hashPasswordSync(newPassword);
    users[userIndex].updatedAt = new Date().toISOString();

    await fs.writeJson(USERS_FILE, { users }, { spaces: 2 });
    return true;
}

// Delete user
async function deleteUser(username) {
    const users = await getUsers();
    const filteredUsers = users.filter(u => u.username !== username);

    if (filteredUsers.length === users.length) {
        throw new Error('User not found');
    }

    await fs.writeJson(USERS_FILE, { users: filteredUsers }, { spaces: 2 });
    return true;
}

// Migrate from old admin user system
async function migrateAdminUser(username, hashedPassword) {
    const users = await getUsers();

    // Check if admin already exists
    if (!users.find(u => u.username === username)) {
        const adminUser = {
            username,
            password: hashedPassword,
            role: 'admin',
            createdAt: new Date().toISOString()
        };
        users.push(adminUser);
        await fs.writeJson(USERS_FILE, { users }, { spaces: 2 });
    }
}

export {
    getUsers,
    getUserByUsername,
    createUser,
    validateUser,
    updateUserPassword,
    deleteUser,
    migrateAdminUser
};
