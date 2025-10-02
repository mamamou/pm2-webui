import crypto from 'crypto';

export const generateRandomString = (len = 20) => {
    return crypto.randomBytes(len).toString('hex');
};