import { PDFDocument } from 'pdf-lib';
export function expandRecipe(recipe, sources) {
 if (typeof recipe !== 'string' || !recipe.trim()) throw new Error('Enter a page recipe such as A:1-3,B:2,A:5.');
 const result = [];
 for (const [index, raw] of recipe.split(',').entries()) {
  const match = /^\s*([A-Z]+)\s*:\s*(\d+)\s*(?:-\s*(\d+)\s*)?$/.exec(raw);
  if (!match) throw new Error(`Item ${index + 1}: expected ALIAS:page or ALIAS:first-last.`);
  const [, alias, first, last] = match; const count = sources[alias]?.pages;
  if (!Number.isSafeInteger(count) || count < 1) throw new Error(`Item ${index + 1}: unknown source ${alias}.`);
  const start = Number(first); const end = Number(last ?? first);
  if (![start, end].every(page => Number.isSafeInteger(page) && page >= 1 && page <= count)) throw new Error(`Item ${index + 1}: ${alias} has pages 1–${count}.`);
  const direction = start <= end ? 1 : -1;
  for (let page = start; ; page += direction) { result.push({ alias, page }); if (result.length > 10000) throw new Error('A recipe is limited to 10,000 output pages.'); if (page === end) break; }
 }
 return result;
}
export function saveRecipe(recipe, sources) {
 expandRecipe(recipe, sources);
 return { version: 1, recipe, sources: Object.entries(sources).map(([alias, source]) => ({ alias, name: source.name, pages: source.pages })) };
}
export function loadRecipe(value, sources) {
 if (!value || value.version !== 1 || !Array.isArray(value.sources)) throw new Error('Unsupported recipe JSON.');
 for (const expected of value.sources) { const source = sources[expected.alias]; if (!source || source.name !== expected.name || source.pages !== expected.pages) throw new Error(`Select source ${expected.alias}: ${expected.name} (${expected.pages} pages). File contents must be checked by you.`); }
 expandRecipe(value.recipe, sources); return value.recipe;
}
export async function exportPdf(recipe, sources) {
 const sequence = expandRecipe(recipe, sources); const output = await PDFDocument.create(); const loaded = new Map();
 for (const { alias, page } of sequence) {
  if (!loaded.has(alias)) loaded.set(alias, await PDFDocument.load(sources[alias].bytes));
  const [copy] = await output.copyPages(loaded.get(alias), [page - 1]); output.addPage(copy);
 }
 output.setTitle('Reading packet — Page Recipe'); output.setProducer('Page Recipe (pdf-lib)');
 return output.save();
}
