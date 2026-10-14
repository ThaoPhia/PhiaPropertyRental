import { spawnSync } from 'node:child_process';
import { X509Certificate } from 'node:crypto';
import fs from 'node:fs';

const [docker, action] = process.argv.slice(2);

function compose(args, options = {}) {
  const result = spawnSync(docker, ['compose', ...args], {
    stdio: 'inherit',
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`docker compose ${args[0]} failed (exit ${result.status}).`);
  }
  return result;
}

compose(['version']);
const config = JSON.parse(compose(['config', '--format', 'json'], {
  env: { ...process.env, DOCKER_SITE_NAME: 'site-name-validation' },
  stdio: ['ignore', 'pipe', 'inherit'],
  encoding: 'utf8',
}).stdout);
const site = config.services.app.environment;
const volumePrefix = (site.SITE_NAME || '').trim().toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
if (!volumePrefix) throw new Error('SITE_NAME must contain letters or numbers.');
if (!/^[0-9]+$/.test(site.SITE_PORT || '') ||
    Number(site.SITE_PORT) < 1 || Number(site.SITE_PORT) > 65535) {
  throw new Error('SITE_PORT must be an integer between 1 and 65535.');
}
const siteUrl = new URL(site.SITE_URL);
if (!['http:', 'https:'].includes(siteUrl.protocol) || siteUrl.username || siteUrl.password ||
    siteUrl.pathname !== '/' || siteUrl.search || siteUrl.hash ||
    Number(siteUrl.port || (siteUrl.protocol === 'https:' ? 443 : 80)) !== Number(site.SITE_PORT)) {
  throw new Error('SITE_URL must be an HTTP or HTTPS origin matching SITE_PORT (for example https://phiapropertyrental.test:3000).');
}
process.env.DOCKER_SITE_NAME = volumePrefix;

function ensureCertificate() {
  const certPath = 'certificates/docker-local.pem';
  const keyPath = 'certificates/docker-local-key.pem';
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    const cert = new X509Certificate(fs.readFileSync(certPath));
    if (cert.checkHost(siteUrl.hostname) && cert.checkHost('localhost') &&
        Date.parse(cert.validTo) > Date.now() + 86400000) {
      return;
    }
  }
  fs.mkdirSync('certificates', { recursive: true, mode: 0o700 });
  const result = spawnSync('openssl', [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '30',
    '-keyout', keyPath, '-out', certPath,
    '-subj', '/CN=Local Docker Development',
    '-addext', `subjectAltName=DNS:${siteUrl.hostname},DNS:localhost,IP:127.0.0.1`,
    '-addext', 'extendedKeyUsage=serverAuth',
  ], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('Failed to generate the local HTTPS certificate with OpenSSL.');
  fs.chmodSync(keyPath, 0o600);
  console.log('Created a self-signed local certificate. Trust certificates/docker-local.pem on your Mac for browser access without warnings.');
}

compose(['config', '--quiet']);
switch (action) {
  case 'up':
  case 'restart':
    if (siteUrl.protocol === 'https:') ensureCertificate();
    compose(['build']);
    compose(['down', '--volumes']);
    try {
      compose(['up', '--detach', '--wait', '--wait-timeout', '240']);
    } catch (error) {
      compose(['logs', '--tail', '80']);
      throw error;
    }
    console.log(`App is healthy: ${siteUrl.protocol}//localhost:${site.SITE_PORT}`);
    console.log(`Site URL: ${siteUrl.origin}`);
    console.log(`Docker volumes: ${volumePrefix}-node-modules, ${volumePrefix}-next-cache`);
    console.log(`For the custom domain, add '127.0.0.1 ${siteUrl.hostname}' to /etc/hosts.`);
    break;
  case 'down':
    compose(['down', '--volumes']);
    break;
  case 'logs':
    compose(['logs', '--follow', '--tail', '100', 'app']);
    break;
  default:
    throw new Error('Expected up, restart, down, or logs.');
}
