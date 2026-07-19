const { spawn } = require('node:child_process');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
function stripAnsi(value) {
  return value.replace(/\u001b\[[0-9;]*m/g, '');
}

function parseBackendStats(output) {
  const clean = stripAnsi(output);

  const testsMatch = clean.match(/#\s*tests\s+(\d+)\b/i);
  const passMatch = clean.match(/#\s*pass\s+(\d+)\b/i) || clean.match(/\bpass\s+(\d+)\b/i);
  const failMatch = clean.match(/#\s*fail\s+(\d+)\b/i) || clean.match(/\bfail\s+(\d+)\b/i);

  if (testsMatch) {
    return {
      passed: passMatch ? Number(passMatch[1]) : 0,
      total: Number(testsMatch[1]),
    };
  }

  const okLines = clean.match(/^ok\s+\d+/gm);
  if (passMatch || failMatch) {
    const passed = passMatch ? Number(passMatch[1]) : okLines ? okLines.length : 0;
    const failed = failMatch ? Number(failMatch[1]) : 0;
    return {
      passed,
      total: passed + failed,
    };
  }

  if (okLines) {
    return {
      passed: okLines.length,
      total: okLines.length,
    };
  }

  return {
    passed: 0,
    total: 0,
  };
}

function parseFrontendStats(output) {
  const clean = stripAnsi(output);

  // Vitest prints a dedicated "Tests" summary line, e.g.:
  // "Tests  1 failed | 40 passed (41)"
  const lines = clean.split(/\r?\n/);
  const testsLine = lines.find((line) => /^\s*Tests\b/i.test(line));
  if (testsLine) {
    const passedMatch = testsLine.match(/(\d+)\s+passed\b/i);
    const failedMatch = testsLine.match(/(\d+)\s+failed\b/i);
    const totalMatch = testsLine.match(/\((\d+)\)/);

    const passed = passedMatch ? Number(passedMatch[1]) : 0;

    if (totalMatch) {
      return { passed, total: Number(totalMatch[1]) };
    }

    if (passedMatch || failedMatch) {
      const failed = failedMatch ? Number(failedMatch[1]) : 0;
      return { passed, total: passed + failed };
    }
  }

  const genericPassedMatch = clean.match(/\b(\d+)\s+passed\b/i);
  if (genericPassedMatch) {
    const passed = Number(genericPassedMatch[1]);
    return { passed, total: passed };
  }

  return { passed: 0, total: 0 };
}

function runTestCommand(projectName, cwd, commandArgs) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, commandArgs, {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let output = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });

    child.on('close', (code) => {
      resolve({
        projectName,
        code: code ?? 1,
        output,
      });
    });
  });
}

async function main() {
  const backendDir = path.join(rootDir, 'backend');
  const frontendDir = path.join(rootDir, 'frontend');

  const tsxCli = path.join(backendDir, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const vitestCli = path.join(frontendDir, 'node_modules', 'vitest', 'vitest.mjs');

  const backendResult = await runTestCommand('backend', backendDir, [
    tsxCli,
    '--test',
    'src/routes/tests/**/*.test.ts',
    'src/services/tests/**/*.test.ts',
  ]);

  const frontendResult = await runTestCommand('frontend', frontendDir, [vitestCli, 'run']);

  const backendStats = parseBackendStats(backendResult.output);
  const frontendStats = parseFrontendStats(frontendResult.output);

  console.log('');
  console.log('=== Test Summary ===');
  console.log(`Backend passed: ${backendStats.passed}/${backendStats.total}`);
  console.log(`Frontend passed: ${frontendStats.passed}/${frontendStats.total}`);

  if (backendResult.code !== 0 || frontendResult.code !== 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});