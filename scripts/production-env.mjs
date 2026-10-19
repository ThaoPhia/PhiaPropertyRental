import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { authenticatePayload, decryptEnvironment, iterations, loadProductionEnvironment } from '../lib/production-env.mjs';

function readKey() {
  if (process.env.PRODUCTION_ENV_KEY) return process.env.PRODUCTION_ENV_KEY;
  if (process.env.VERCEL) throw new Error('Set PRODUCTION_ENV_KEY in Vercel before deploying.');
  return fs.readFileSync('.env.production.key', 'utf8').trim();
}

const [command, ...args] = process.argv.slice(2);
if (command === 'encrypt') {
  const plaintext = fs.readFileSync('.env.production');
  if (!process.env.PRODUCTION_ENV_KEY && !fs.existsSync('.env.production.key')) {
    if (fs.existsSync('.env.production.enc')) {
      throw new Error('Restore the existing key before updating the encrypted production file.');
    }
    fs.writeFileSync('.env.production.key', randomBytes(32).toString('hex') + '\n', {
      mode: 0o600, flag: 'wx',
    });
  }
  const password = readKey();
  const result = spawnSync('openssl', [
    'enc', '-aes-256-cbc', '-pbkdf2', '-iter', String(iterations),
    '-md', 'sha256', '-salt', '-saltlen', '16', '-pass', 'env:PRODUCTION_ENV_KEY',
  ], {
    input: plaintext,
    env: { ...process.env, PRODUCTION_ENV_KEY: password },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`OpenSSL encryption failed: ${result.stderr.toString().trim()}`);
  }
  const contents = JSON.stringify({
    version: 1,
    payload: result.stdout.toString('base64'),
    hmac: authenticatePayload(result.stdout, password).toString('hex'),
  }) + '\n';
  if (decryptEnvironment(contents, password) !== plaintext.toString('utf8')) {
    throw new Error('OpenSSL round-trip verification failed.');
  }
  fs.writeFileSync('.env.production.enc', contents);
  console.log('Encrypted the entire production file with OpenSSL and authenticated it with HMAC-SHA256.');
} else if (command === 'build' || command === 'start') {
  process.env.PRODUCTION_ENV_KEY = readKey();
  loadProductionEnvironment();
  const require = createRequire(import.meta.url);
  const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), command, ...args], {
    stdio: 'inherit', env: process.env,
  });
  child.on('error', error => {
    console.error(error);
    process.exit(1);
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => child.kill(signal));
  }
  child.on('exit', (code, signal) => {
    if (signal) console.error(`Next.js terminated by ${signal}.`);
    process.exit(code ?? 1);
  });
} else {
  throw new Error('Expected encrypt, build, or start.');
}
