import fs from 'fs-extra';
import config from '../config/index.js';
import { validateFilePath } from './path-validator.util.js';

const readLogsReverse = async (params) => {
  let { filePath, nextKey: endBytes = null, linesPerRequest: lines = config.DEFAULTS.LINES_PER_REQUEST } = params
  endBytes = parseInt(endBytes)
  lines = parseInt(lines)
  return new Promise((resolve) => {
    if(!filePath || lines < 1 || isNaN(lines)){
      console.error('Input params error : ', {filePath, lines})
      return resolve({lines: [], nextKey: -1, linesPerRequest: config.DEFAULTS.LINES_PER_REQUEST})
    }

    // Validate file path for security
    try {
      filePath = validateFilePath(filePath);
    } catch (err) {
      console.error('File path validation failed:', err.message);
      return resolve({lines: [], nextKey: -1, linesPerRequest: config.DEFAULTS.LINES_PER_REQUEST})
    }

    const fileSize = fs.statSync(filePath).size
    const end = endBytes && endBytes >= 0? endBytes : fileSize
    const dataSize = lines * 200
    const start = Math.max(0, end - dataSize);
    let data = '';
    const logFile = fs.createReadStream(filePath, {start : start, end});
    logFile.on('data', function(chunk) { data += chunk.toString(); });
    logFile.on('end', function() {
      data = data.split('\n')
      data = data.slice(-(lines+1));
      const sentDataSize = Buffer.byteLength(data.join('\n'), 'utf-8')
      const nextKey = (end - sentDataSize)
      data.pop();
      return resolve({lines: data, nextKey, linesPerRequest: lines});
    });
  })
}

export { readLogsReverse };