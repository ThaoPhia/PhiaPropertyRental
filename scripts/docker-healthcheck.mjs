import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';

const secure = new URL(process.env.SITE_URL).protocol === 'https:';
const client = secure ? https : http;
const request = client.get({
  hostname: '127.0.0.1',
  port: 3000,
  path: '/cms/login',
  ...(secure ? {
    ca: fs.readFileSync('/app/certificates/docker-local.pem'),
    allowPartialTrustChain: true,
    servername: 'localhost',
  } : {}),
  timeout: 8000,
}, (response) => {
  response.resume();
  if (response.statusCode !== 200) {
    console.error(`Health check returned HTTP ${response.statusCode}.`);
    process.exit(1);
  }
});
request.on('timeout', () => request.destroy(new Error('Health check timed out.')));
request.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
