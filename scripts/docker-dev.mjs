import { spawnSync } from 'node:child_process';
import { X509Certificate } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const [docker, action] = process.argv.slice(2);

function dockerCommand(args) {
  const result = spawnSync(docker, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`docker ${args.join(' ')} failed (exit ${result.status}).`);
}

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
    siteUrl.hostname !== 'phiapropertyrental.test' || siteUrl.protocol !== 'https:' || siteUrl.port) {
  throw new Error('Local proxy routing requires SITE_URL=https://phiapropertyrental.test (without a port).');
}
if (Number(site.SITE_PORT) === 443) {
  throw new Error('SITE_PORT must not be 443; that port belongs to the shared HTTPS proxy. Use 444 for direct access.');
}
process.env.DOCKER_SITE_NAME = volumePrefix;

function ensureCertificate() {
  const certPath = 'certificates/docker-local.pem';
  const keyPath = 'certificates/docker-local-key.pem';
  const caResult = spawnSync('mkcert', ['-CAROOT'], { encoding: 'utf8' });
  if (caResult.error) throw caResult.error;
  if (caResult.status !== 0) throw new Error('mkcert is required for local HTTPS. Run mkcert -install first.');
  const rootPath = path.join(caResult.stdout.trim(), 'rootCA.pem');
  if (!fs.existsSync(rootPath)) {
    throw new Error('The mkcert local authority is missing. Run mkcert -install first.');
  }
  const root = new X509Certificate(fs.readFileSync(rootPath));
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    const cert = new X509Certificate(fs.readFileSync(certPath));
    if (cert.verify(root.publicKey) &&
        cert.checkHost(siteUrl.hostname) && cert.checkHost('localhost') &&
        Date.parse(cert.validTo) > Date.now() + 86400000) {
      return;
    }
  }
  fs.mkdirSync('certificates', { recursive: true, mode: 0o700 });
  const result = spawnSync('mkcert', [
    '-cert-file', certPath, '-key-file', keyPath,
    siteUrl.hostname, 'localhost', '127.0.0.1', '::1',
  ], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('Failed to generate the local HTTPS certificate with mkcert.');
  fs.chmodSync(keyPath, 0o600);
  console.log('Created a local HTTPS certificate signed by mkcert. Run mkcert -install if your browser does not trust it.');
}

compose(['config', '--quiet']);
switch (action) {
  case 'up':
  case 'restart':
    if (siteUrl.protocol === 'https:') ensureCertificate();
    const networks = spawnSync(docker, ['network', 'ls', '--format', '{{.Name}}'], { encoding: 'utf8' });
    if (networks.error) throw networks.error;
    if (networks.status !== 0) throw new Error('Failed to list Docker networks.');
    if (!networks.stdout.split('\n').includes('local-https')) {
      dockerCommand(['network', 'create', 'local-https']);
    }
    compose(['build']);
    compose(['down', '--volumes']);
    try {
      compose(['up', '--detach', '--wait', '--wait-timeout', '240']);
    } catch (error) {
      compose(['logs', '--tail', '80']);
      throw error;
    }
    compose(['-f', 'docker/proxy/compose.yaml', 'up', '--detach', '--wait']);
    console.log(`Direct app access: ${siteUrl.protocol}//localhost:${site.SITE_PORT}`);
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
