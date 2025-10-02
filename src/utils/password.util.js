import bcrypt from 'bcryptjs';
import config from '../config/index.js';

export const hashPasswordSync = (password) => {
    return bcrypt.hashSync(password, config.DEFAULTS.BCRYPT_HASH_ROUNDS);
};

export const hashPassword = async (password) => {
    return bcrypt.hash(password, config.DEFAULTS.BCRYPT_HASH_ROUNDS);
};

export const comparePassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};