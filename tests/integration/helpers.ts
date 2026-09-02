import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ReadableStream, TransformStream } from 'node:stream/web';
import { TextDecoder, TextEncoder } from 'node:util';
import { MessageChannel, MessagePort } from 'node:worker_threads';

const dbPaths: string[] = [];
const originalEnv: Record<string, string | undefined> = {};

// Remembers the original value of an environment variable so it can be restored later.
function rememberEnv(name: string) {
  if (!(name in originalEnv)) {
    originalEnv[name] = process.env[name];
  }
}

// Closes the global SQLite database connection if it exists.
export function closeGlobalDb() {
  const state = (globalThis as typeof globalThis & {
    phiaDbState?: { db?: { close: () => void } | null };
  }).phiaDbState;

  state?.db?.close();
}

// Installs web API globals (TextDecoder, TextEncoder, ReadableStream, TransformStream, MessageChannel, MessagePort, Headers, Request, Response) for integration tests.
export function installWebApiGlobals() {
  const globalObject = globalThis as Record<string, unknown>;

  globalObject.TextDecoder ??= TextDecoder;
  globalObject.TextEncoder ??= TextEncoder;
  globalObject.ReadableStream ??= ReadableStream;
  globalObject.TransformStream ??= TransformStream;
  globalObject.MessageChannel ??= MessageChannel;
  globalObject.MessagePort ??= MessagePort;

  const undici = jest.requireActual('undici') as {
    Headers: typeof Headers;
    Request: typeof Request;
    Response: typeof Response;
  };

  globalObject.Headers ??= undici.Headers;
  globalObject.Request ??= undici.Request;
  globalObject.Response ??= undici.Response;
}

// Prepares the environment and database for an integration test with a unique SQLite database file.
export function prepareIntegrationTest(prefix: string, env: Record<string, string | undefined> = {}) {
  closeGlobalDb();
  jest.resetModules();

  const dbPath = path.join(os.tmpdir(), `${prefix}-${crypto.randomUUID()}.db`);
  dbPaths.push(dbPath);

  const nextEnv = {
    SQLITE_DB_PATH: dbPath,
    RECAPTCHA_E2E_TOKEN: 'integration-recaptcha-token',
    ...env,
  };

  Object.entries(nextEnv).forEach(([name, value]) => {
    rememberEnv(name);
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  });

  delete (globalThis as typeof globalThis & { phiaDbState?: unknown }).phiaDbState;
  installWebApiGlobals();
}

// Creates a mock JSON request object for integration tests.
export function createJsonRequest(body: Record<string, unknown>) {
  return {
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: async () => body,
  };
}

// Creates a mock GET request object for integration tests.
export function createGetRequest(url: string, cookieHeader?: string) {
  const cookieValue = cookieHeader?.match(/(?:^|;)\s*cms_session=([^;]*)/)?.[1];

  return {
    cookies: { get: () => cookieValue ? { value: cookieValue } : undefined },
    nextUrl: new URL(url),
  };
}

// Cleans up the environment and database after integration tests.
export async function cleanupIntegrationTests() {
  closeGlobalDb();
  delete (globalThis as typeof globalThis & { phiaDbState?: unknown }).phiaDbState;

  Object.entries(originalEnv).forEach(([name, value]) => {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  });

  await Promise.all(
    dbPaths.flatMap((dbPath) => [dbPath, `${dbPath}-shm`, `${dbPath}-wal`]).map((dbPath) =>
      fs.rm(dbPath, { force: true })
    )
  );
}