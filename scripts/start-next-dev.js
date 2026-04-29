// Minimal Next.js dev server launcher that bypasses npm workspaces quirks
// Starts the frontend app from ./frontend on a custom port.

const http = require('http');
const path = require('path');
const next = require('next');

// Defaults for local dev
if (!process.env.NEXT_PUBLIC_API_URL) {
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8090';
}

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3050;
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  // Ensure CWD is the frontend folder so Tailwind/PostCSS locate their configs
  const frontendDir = path.join(__dirname, '..', 'frontend');
  process.chdir(frontendDir);

  const app = next({ dev: true, dir: '.' });
  const handle = app.getRequestHandler();

  await app.prepare();

  const server = http.createServer((req, res) => {
    handle(req, res);
  });

  server.listen(PORT, HOST, () => {
    console.log(`Next.js dev server ready at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
    console.log(`CWD: ${process.cwd()}`);
  });
}

main().catch((err) => {
  console.error('Failed to start Next.js dev server:', err);
  process.exit(1);
});
