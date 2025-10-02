import path from 'path';
import fs from 'fs-extra';

/**
 * Validates that a file path is safe to read
 * Prevents directory traversal attacks and ensures file exists
 */
function validateFilePath(filePath, allowedBasePath = null) {
    if (!filePath || typeof filePath !== 'string') {
        throw new Error('Invalid file path');
    }

    // Resolve to absolute path to prevent directory traversal
    const resolvedPath = path.resolve(filePath);

    // If an allowed base path is provided, ensure the file is within it
    if (allowedBasePath) {
        const resolvedBasePath = path.resolve(allowedBasePath);
        if (!resolvedPath.startsWith(resolvedBasePath)) {
            throw new Error('File path is outside allowed directory');
        }
    }

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
        throw new Error('File does not exist');
    }

    // Check if it's actually a file (not a directory)
    const stats = fs.statSync(resolvedPath);
    if (!stats.isFile()) {
        throw new Error('Path is not a file');
    }

    return resolvedPath;
}

/**
 * Validates that a directory path is safe to access
 */
function validateDirectoryPath(dirPath, allowedBasePath = null) {
    if (!dirPath || typeof dirPath !== 'string') {
        throw new Error('Invalid directory path');
    }

    // Resolve to absolute path to prevent directory traversal
    const resolvedPath = path.resolve(dirPath);

    // If an allowed base path is provided, ensure the directory is within it
    if (allowedBasePath) {
        const resolvedBasePath = path.resolve(allowedBasePath);
        if (!resolvedPath.startsWith(resolvedBasePath)) {
            throw new Error('Directory path is outside allowed directory');
        }
    }

    // Check if directory exists
    if (!fs.existsSync(resolvedPath)) {
        throw new Error('Directory does not exist');
    }

    // Check if it's actually a directory
    const stats = fs.statSync(resolvedPath);
    if (!stats.isDirectory()) {
        throw new Error('Path is not a directory');
    }

    return resolvedPath;
}

export { validateFilePath, validateDirectoryPath };
