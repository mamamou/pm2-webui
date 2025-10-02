import fs from 'fs-extra';
import { createRequire } from 'module';
import path from 'path';
import { validateDirectoryPath } from './path-validator.util.js';

const require = createRequire(import.meta.url);
const envfile = require('envfile');

const getEnvFileContent = async (wd)=>{
    try {
        // Validate directory path
        const validatedDir = validateDirectoryPath(wd);
        const envPath = path.join(validatedDir, '.env')

        return new Promise((resolve, reject) => {
            fs.readFile(envPath , 'utf-8', function(err, data){
                if(!err){
                    resolve(data)
                }
                resolve(null)
            })
        })
    } catch (err) {
        console.error('Directory validation failed:', err.message);
        return null;
    }
}

const getEnvDataSync = (envPath) => {
    if (!fs.existsSync(envPath)) { 
        fs.closeSync(fs.openSync(envPath, 'w'))
    } 
    return envfile.parse(fs.readFileSync(envPath , 'utf-8'))
}

const setEnvDataSync = (wd, envData) => {
    try {
        // Validate directory path - allow creating .env in validated directory
        const validatedDir = fs.existsSync(wd) && fs.statSync(wd).isDirectory()
            ? path.resolve(wd)
            : path.resolve(wd);

        const envPath = path.join(validatedDir, '.env')
        let parseEnvData = getEnvDataSync(envPath)
        const finalData = {
            ...parseEnvData,
            ...envData
        }
        fs.writeFileSync(envPath, envfile.stringify(finalData))
        return true
    } catch (err) {
        console.error('Error writing env file:', err.message);
        throw err;
    }
}

export { getEnvFileContent, getEnvDataSync, setEnvDataSync };