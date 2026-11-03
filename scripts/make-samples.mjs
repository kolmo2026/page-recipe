import { PDFDocument } from 'pdf-lib';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const folder = resolve(dirname(fileURLToPath(import.meta.url)), '../examples'); await mkdir(folder, { recursive: true });
for (const [name, count, base] of [['paper', 5, 501], ['supplement', 2, 601]]) {
 const pdf = await PDFDocument.create();
 for (let i = 1; i <= count; i++) { const page = pdf.addPage([base + i - 1, 800]); page.drawText(`${name}.pdf / physical page ${i}`, { x: 35, y: 720, size: 18 }); page.drawText('Synthetic workflow fixture. MIT. No actual financial disclosure.', { x: 35, y: 680, size: 10 }); page.drawText(`Source marker: ${name.toUpperCase()}-${i}`, { x: 35, y: 630, size: 14 }); }
 pdf.setTitle(`Synthetic ${name} - Page Recipe example`); await writeFile(resolve(folder, `${name}.pdf`), await pdf.save());
}
await writeFile(resolve(folder, 'recipe.json'), JSON.stringify({ version: 1, recipe: 'A:1-3,B:2,A:5', sources: [{ alias: 'A', name: 'paper.pdf', pages: 5 }, { alias: 'B', name: 'supplement.pdf', pages: 2 }] }, null, 2) + '\n');
console.log('Generated synthetic paper.pdf (5 pages), supplement.pdf (2 pages), and recipe.json.');
