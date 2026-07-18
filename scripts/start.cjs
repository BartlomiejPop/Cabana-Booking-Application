const { spawn } = require('node:child_process');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const options = {
    map: process.env.npm_config_map || './api/map.ascii',
    bookings: process.env.npm_config_bookings || process.env.npm_config_boking || './api/bookings.json',
    apiBaseUrl: process.env.npm_config_api_base_url || 'http://localhost:3000',
  };

  const positionalArgs = [];

  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];

    if (flag === '--map') {
      if (!value) throw new Error('Missing value for --map');
      options.map = value;
      i += 1;
      continue;
    }

    if (flag === '--bookings' || flag === '--boking') {
      if (!value) throw new Error(`Missing value for ${flag}`);
      options.bookings = value;
      i += 1;
      continue;
    }

    if (flag === '--api-base-url') {
      if (!value) throw new Error('Missing value for --api-base-url');
      options.apiBaseUrl = value;
      i += 1;
      continue;
    }

    if (!flag.startsWith('--')) {
      positionalArgs.push(flag);
      continue;
    }

    throw new Error(`Unknown argument: ${flag}`);
  }

  if (positionalArgs.length > 0) {
    options.map = positionalArgs[0];
  }

  if (positionalArgs.length > 1) {
    options.bookings = positionalArgs[1];
  }

  if (positionalArgs.length > 2) {
    throw new Error('Too many positional arguments. Use: <mapPath> <bookingsPath>');
  }

  return options;
}

const args = parseArgs(process.argv.slice(2));

const resolvedMapPath = path.resolve(rootDir, args.map);
const resolvedBookingsPath = path.resolve(rootDir, args.bookings);
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

const tsxCli = path.join(backendDir, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const viteCli = path.join(frontendDir, 'node_modules', 'vite', 'bin', 'vite.js');

const backend = spawn(
  process.execPath,
  [tsxCli, 'src/index.ts', '--map', resolvedMapPath, '--bookings', resolvedBookingsPath],
  {
    cwd: backendDir,
    stdio: 'inherit',
  },
);

const frontend = spawn(process.execPath, [viteCli], {
  cwd: frontendDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_API_BASE_URL: args.apiBaseUrl,
  },
});

let isShuttingDown = false;

function shutdown() {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  if (!backend.killed) {
    backend.kill('SIGTERM');
  }

  if (!frontend.killed) {
    frontend.kill('SIGTERM');
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

backend.on('exit', (code) => {
  if (!isShuttingDown) {
    shutdown();
  }

  if (code && code !== 0) {
    process.exit(code);
  }
});

frontend.on('exit', (code) => {
  if (!isShuttingDown) {
    shutdown();
  }

  if (code && code !== 0) {
    process.exit(code);
  }
});