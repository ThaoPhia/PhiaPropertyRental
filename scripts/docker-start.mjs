import { spawn } from 'node:child_process';

const siteUrl = new URL(process.env.SITE_URL);
const args = ['run', 'dev', '--', '--hostname', '0.0.0.0', '--port', '3000'];
if (siteUrl.protocol === 'https:') {
  args.push(
    '--experimental-https',
    '--experimental-https-key', '/app/certificates/docker-local-key.pem',
    '--experimental-https-cert', '/app/certificates/docker-local.pem',
  );
}
const child = spawn('npm', args, { stdio: 'inherit' });
child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => child.kill(signal));
}
child.on('exit', (code, signal) => {
  if (signal) console.error(`Development server terminated by ${signal}.`);
  process.exit(code ?? 1);
});
