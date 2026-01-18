// File: botsFile.js
const fs = require('fs').promises;
const path = require('path');

const botsFilePath = path.resolve(process.cwd(), 'bots.json');

async function ensureFileExists() {
  try {
    await fs.access(botsFilePath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.writeFile(botsFilePath, '{}', 'utf8');
    } else {
      throw err;
    }
  }
}

async function readBots() {
  await ensureFileExists();
  try {
    const data = await fs.readFile(botsFilePath, 'utf8');
    if (!data) return {};
    return JSON.parse(data);
  } catch (err) {
    // If JSON corrupted, reset file to empty object and return {}
    console.error('bots.json read/parse error — resetting file:', err);
    await fs.writeFile(botsFilePath, '{}', 'utf8');
    return {};
  }
}

async function writeBots(obj) {
  const tmpPath = botsFilePath + '.tmp';
  const str = JSON.stringify(obj, null, 2);
  // write to temp then rename for safer write
  await fs.writeFile(tmpPath, str, 'utf8');
  await fs.rename(tmpPath, botsFilePath);
}

module.exports = {
  readBots,
  writeBots,
  botsFilePath,
};
