import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { decryptEnvironment } from '../lib/production-env.mjs';

test('OpenSSL whole-file encryption interoperates with Node and rejects tampering', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'phia-openssl-'));
  const password = randomBytes(32).toString('hex');
  const plaintext = '# hidden comment\nSECRET_NAME=private-value\nREFERENCE=${SECRET_NAME}/path\n';
  const script = new URL('./production-env.mjs', import.meta.url);
  const moduleUrl = new URL('../lib/production-env.mjs', import.meta.url).href;
  const env = { PATH: process.env.PATH, PRODUCTION_ENV_KEY: password, VERCEL: '1' };
  try {
    fs.writeFileSync(path.join(dir, '.env.production'), plaintext);
    const result = spawnSync(process.execPath, [script.pathname, 'encrypt'], {
      cwd: dir, env, encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    const contents = fs.readFileSync(path.join(dir, '.env.production.enc'), 'utf8');
    for (const text of ['hidden comment', 'SECRET_NAME', 'private-value']) {
      assert.ok(!contents.includes(text));
    }
    assert.equal(decryptEnvironment(contents, password), plaintext);
    assert.throws(() => decryptEnvironment(contents, randomBytes(32).toString('hex')), /authentication failed/);
    assert.throws(() => decryptEnvironment(contents, 'short-key'), /64-character/);
    const envelope = JSON.parse(contents);
    const payload = Buffer.from(envelope.payload, 'base64');
    payload[24] ^= 1;
    envelope.payload = payload.toString('base64');
    assert.throws(() => decryptEnvironment(JSON.stringify(envelope), password), /authentication failed/);
    assert.throws(() => decryptEnvironment('{"version":2}', password), /Invalid/);

    const original = JSON.parse(contents);
    const openssl = spawnSync('openssl', [
      'enc', '-d', '-aes-256-cbc', '-pbkdf2', '-iter', '210000',
      '-md', 'sha256', '-saltlen', '16', '-pass', 'env:PRODUCTION_ENV_KEY',
    ], { input: Buffer.from(original.payload, 'base64'), env, encoding: 'utf8' });
    assert.equal(openssl.status, 0, openssl.stderr);
    assert.equal(openssl.stdout, plaintext);

    fs.unlinkSync(path.join(dir, '.env.production'));
    const loadScript = `
      import assert from 'node:assert/strict';
      import { loadProductionEnvironment } from ${JSON.stringify(moduleUrl)};
      loadProductionEnvironment();
      assert.equal(process.env.SECRET_NAME, 'platform-value');
      assert.equal(process.env.REFERENCE, 'platform-value/path');
    `;
    const loaded = spawnSync(process.execPath, ['--input-type=module', '-e', loadScript], {
      cwd: dir, env: { ...env, SECRET_NAME: 'platform-value' }, encoding: 'utf8',
    });
    assert.equal(loaded.status, 0, loaded.stderr);
    const missing = spawnSync(process.execPath, ['--input-type=module', '-e', loadScript], {
      cwd: dir, env: { PATH: process.env.PATH, VERCEL: '1' }, encoding: 'utf8',
    });
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /Set PRODUCTION_ENV_KEY/);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});
