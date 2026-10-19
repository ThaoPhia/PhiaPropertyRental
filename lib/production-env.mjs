import { createDecipheriv, createHmac, pbkdf2Sync, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import { parse } from 'dotenv';
import { expand } from 'dotenv-expand';

export const iterations = 210000;
const header = Buffer.from('Salted__');

function deriveKeys(payload, password) {
  if (!/^[a-f0-9]{64}$/i.test(password || '')) {
    throw new Error('PRODUCTION_ENV_KEY must be a 64-character hexadecimal secret.');
  }
  if (payload.length < 40 || !payload.subarray(0, 8).equals(header) ||
      (payload.length - 24) % 16 !== 0) {
    throw new Error('Invalid OpenSSL encrypted environment payload.');
  }
  // OpenSSL derives the same first 48 bytes for its AES key and IV.
  return pbkdf2Sync(password, payload.subarray(8, 24), iterations, 80, 'sha256');
}

export function authenticatePayload(payload, password) {
  const keys = deriveKeys(payload, password);
  return createHmac('sha256', keys.subarray(48)).update(payload).digest();
}

export function decryptEnvironment(contents, password) {
  const envelope = JSON.parse(contents);
  if (envelope.version !== 1 || typeof envelope.payload !== 'string' ||
      typeof envelope.hmac !== 'string' || !/^[a-f0-9]{64}$/.test(envelope.hmac)) {
    throw new Error('Invalid encrypted production environment format.');
  }
  const payload = Buffer.from(envelope.payload, 'base64');
  const keys = deriveKeys(payload, password);
  const expected = createHmac('sha256', keys.subarray(48)).update(payload).digest();
  if (!timingSafeEqual(expected, Buffer.from(envelope.hmac, 'hex'))) {
    throw new Error('Production environment authentication failed: incorrect key or modified file.');
  }
  const decipher = createDecipheriv('aes-256-cbc', keys.subarray(0, 32), keys.subarray(32, 48));
  return Buffer.concat([decipher.update(payload.subarray(24)), decipher.final()]).toString('utf8');
}

export function loadProductionEnvironment() {
  if (!process.env.PRODUCTION_ENV_KEY) {
    throw new Error('Set PRODUCTION_ENV_KEY in Vercel before deploying.');
  }
  const contents = decryptEnvironment(
    fs.readFileSync('.env.production.enc', 'utf8'),
    process.env.PRODUCTION_ENV_KEY,
  );
  expand({ parsed: parse(contents), processEnv: process.env });
}
