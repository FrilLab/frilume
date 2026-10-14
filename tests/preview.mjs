import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const fixturePath = resolve(root, 'tests/fixture.html');
const skinPath = resolve(root, 'skin.html');
const skinHtml = await readFile(skinPath, 'utf8');
const scripts = [...skinHtml.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
if (!scripts.length) throw new Error('skin.html has no inline code-copy script');
const codeCopyScript = `<script>${scripts.at(-1)[1]}</script>`;

const mimeTypes = { '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const transparentPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p7sAAAAASUVORK5CYII=', 'base64');
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (/^\/images\/ico_package(?:_2x)?\.png$/.test(url.pathname)) {
      response.writeHead(200, { 'content-type': 'image/png' }).end(transparentPng);
      return;
    }
    const filePath = resolve(root, `.${decodeURIComponent(url.pathname)}`);
    if (!filePath.startsWith(root + sep) && filePath !== root) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    let content = await readFile(filePath);
    if (filePath === fixturePath) {
      content = Buffer.from(content.toString('utf8').replace('<!-- PREVIEW_SERVER_INJECTS_SKIN_CODE_COPY_SCRIPT -->', codeCopyScript));
    }
    response.writeHead(200, { 'content-type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
    response.end(content);
  } catch {
    response.writeHead(404).end('Not found');
  }
});

server.listen(4173, '127.0.0.1', () => {
  console.log('Frilume mock preview: http://127.0.0.1:4173/tests/fixture.html');
});
