#!/usr/bin/env node
const { spawn, exec } = require('child_process');
const path = require('path');

// Read port from project env config so it honors .env overrides
const envPath = path.join(__dirname, '..', 'server', 'config', 'env.js');
let port = 3000;
try {
  const cfg = require(envPath);
  port = cfg.port || port;
} catch (e) {
  // fallback
}

const url = `http://localhost:${port}`;
console.log(`Starting server and opening ${url} ...`);

// Spawn npm start in a detached child so this script can exit while server runs
const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['start'], {
  detached: true,
  stdio: 'ignore',
  cwd: process.cwd(),
});
child.unref();

// Give the server a small moment to start, then open default browser (macOS `open`)
setTimeout(() => {
  const openCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${openCmd} "${url}"`, (err) => {
    if (err) console.error('Failed to open browser:', err.message);
  });
}, 1000);
