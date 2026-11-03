import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { expandRecipe, exportPdf, saveRecipe, loadRecipe } from '../src/recipe.js';
async function source(name, widths) { const doc = await PDFDocument.create(); widths.forEach((width, i) => { const page = doc.addPage([width, 800]); page.drawText(`${name} page ${i + 1}`, { x: 20, y: 700 }); }); return { name, pages: widths.length, bytes: await doc.save() }; }
const meta = { A: { name: 'paper.pdf', pages: 5 }, B: { name: 'supplement.pdf', pages: 2 } };
test('cross-file recipe expansion', () => { assert.deepEqual(expandRecipe('A:1-3,B:2,A:5', meta).map(x => `${x.alias}${x.page}`), ['A1', 'A2', 'A3', 'B2', 'A5']); });
test('reverse and repeat expansion', () => { assert.deepEqual(expandRecipe('A:5-3,A:1,A:1', meta).map(x => x.page), [5, 4, 3, 1, 1]); });
test('invalid recipes rejected', () => { for (const recipe of ['', 'A:0', 'A:6', 'C:1', 'A:2-8', 'A:one', 'A:1,']) assert.throws(() => expandRecipe(recipe, meta)); });
test('JSON roundtrip and source mismatch', () => { const recipe = 'A:5-3,A:1,A:1'; const saved = JSON.parse(JSON.stringify(saveRecipe(recipe, meta))); assert.equal(loadRecipe(saved, meta), recipe); assert.throws(() => loadRecipe(saved, { ...meta, A: { name: 'wrong.pdf', pages: 5 } })); });
test('actual multi-page PDF export preserves cross-source order and input bytes', async () => { const sources = { A: await source('paper.pdf', [501, 502, 503, 504, 505]), B: await source('supplement.pdf', [601, 602]) }; const original = sources.A.bytes.slice(); const result = await PDFDocument.load(await exportPdf('A:1-3,B:2,A:5', sources)); assert.deepEqual(result.getPages().map(x => x.getWidth()), [501, 502, 503, 602, 505]); assert.deepEqual(sources.A.bytes, original); const input = await PDFDocument.load(sources.A.bytes); assert.equal(input.getPageCount(), 5); });
test('actual exported PDF reverse and duplicate pages', async () => { const sources = { A: await source('paper.pdf', [501, 502, 503, 504, 505]) }; const result = await PDFDocument.load(await exportPdf('A:5-3,A:1,A:1', sources)); assert.equal(result.getPageCount(), 5); assert.deepEqual(result.getPages().map(x => x.getWidth()), [505, 504, 503, 501, 501]); });
