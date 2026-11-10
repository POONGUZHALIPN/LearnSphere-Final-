const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = __dirname;
const backendPort = process.env.BACKEND_PORT || '3000';

function run(command, args, extraEnv = {}, spawnOptions = {}) {
  return spawn(command, args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...(spawnOptions.env || extraEnv) },
    windowsHide: false,
    ...spawnOptions
  });
}

// Start the existing Node.js backend.
const backend = run(process.execPath, [path.join(root, 'server.js')], {
  PORT: backendPort
});

// Start Vite directly. This avoids Windows `npm exec`/child-process spawn issues.
const viteCommand = process.platform === 'win32'
  ? path.join(root, 'node_modules', '.bin', 'vite.cmd')
  : path.join(root, 'node_modules', '.bin', 'vite');

if (!fs.existsSync(viteCommand)) {
  console.error('\nVite is not installed yet.');
  console.error('Run: npm install');
  console.error('Then run: npm run dev\n');
  backend.kill();
  process.exit(1);
}

const vite = run(viteCommand, ['--config', path.join(root, 'vite.config.js')], {}, {
  // Windows .cmd files must be launched through a shell.
  shell: process.platform === 'win32'
});

function shutdown() {
  if (backend && !backend.killed) backend.kill();
  if (vite && !vite.killed) vite.kill();
}

process.on('SIGINT', () => { shutdown(); process.exit(0); });
process.on('SIGTERM', () => { shutdown(); process.exit(0); });

backend.on('error', err => {
  console.error('Backend failed to start:', err.message);
});

vite.on('error', err => {
  console.error('Vite failed to start:', err.message);
});

backend.on('exit', code => {
  if (code !== 0 && code !== null) {
    console.error(`Backend stopped with code ${code}`);
  }
});

vite.on('exit', code => {
  if (code !== 0 && code !== null) {
    console.error(`Vite stopped with code ${code}`);
  }
  shutdown();
  process.exit(code ?? 0);
});
