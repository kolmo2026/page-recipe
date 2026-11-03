import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../docs');
const arg = process.argv.indexOf('--port'); const port = arg < 0 ? 4173 : Number(process.argv[arg + 1]);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.pdf': 'application/pdf', '.xml': 'application/xml', '.txt': 'text/plain' };
createServer(async (req, res) => { try { let path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403); res.end(); return; } if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html'); const bytes = await readFile(path); res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream' }); res.end(bytes); } catch { res.writeHead(404); res.end('Not found'); } }).listen(port, '127.0.0.1', () => console.log('Local site: http://127.0.0.1:' + port));
