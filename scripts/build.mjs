import { mkdir, writeFile, readFile, cp, readdir } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site, articles, introduction, tool } from '../site/content.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'); const docs = join(root, 'docs');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const route = (slug, lang) => slug === 'home' ? (lang === 'en' ? '/' : '/ja/') : `/${lang}/${slug}/`;
const urls = [];
await mkdir(join(docs, 'assets'), { recursive: true });
await cp(join(root, 'site/style.css'), join(docs, 'assets/style.css'));
if (site.repo === 'page-recipe') await import('./make-samples.mjs');
if (site.repo !== 'paperwork-fieldnotes') await cp(join(root, 'examples'), join(docs, 'examples'), { recursive: true });
const repo = `https://github.com/kolmo2026/${site.repo}`;
const about = {
 en: `<h2>Who maintains this site?</h2><p>${esc(site.name)} is maintained through the GitHub account <a href="https://github.com/kolmo2026">kolmo2026</a> by the same maintenance team developing tools for the Eqvero, KolmoPDF and KomoPDF ecosystem. These are related projects, not an independent review or third-party endorsement. No personal expert biography or institutional affiliation is claimed.</p><h2>Processing and privacy</h2><p>The open-source tools perform their documented calculations or file operations locally. This static site has no login, upload endpoint, analytics script or database. Loading the site still requests its public HTML, styles and JavaScript from the hosting provider. Following a product link leaves this site; the cloud service KolmoPDF uploads documents for processing, unlike these local utilities.</p><h2>Scope and corrections</h2><p>Examples are synthetic and are published with the source under MIT. Financial scenarios are explanations of stated inputs, not investment advice. Document checks cannot establish factual accuracy. Read each tool’s limitations before using a result.</p><p><a href="${repo}">Source, license and issue tracker</a> · <a href="https://eqvero.com/">Eqvero</a> · <a href="https://www.kolmopdf.com/">KolmoPDF</a> · <a href="https://komopdf.com/">KomoPDF</a></p>`,
 ja: `<h2>運営・関連プロジェクト</h2><p>${esc(site.japaneseName)}は、GitHubアカウント<a href="https://github.com/kolmo2026">kolmo2026</a>を通じて、Eqvero・KolmoPDF・KomoPDFのエコシステム向けツールを開発する同じ保守チームが運営しています。独立した第三者によるレビューや推薦ではありません。架空の専門家、所属機関、個人経歴を名乗るものではありません。</p><h2>処理とプライバシー</h2><p>オープンソースツールは、記載した計算やファイル処理をローカルで実行します。この静的サイトにはログイン、アップロード先、アクセス解析スクリプト、データベースがありません。ただし、サイト表示にはホスティング事業者からHTML・CSS・JavaScriptを取得する通信が発生します。製品リンクの移動先は別サービスです。クラウドサービスのKolmoPDFは文書をアップロードして処理するため、これらのローカルツールとは異なります。</p><h2>利用範囲と訂正</h2><p>例示データは合成したもので、ソースとともにMITライセンスで公開します。財務シナリオは入力条件の説明であり、投資助言ではありません。文書点検だけで事実の正確性は確認できません。結果を利用する前に、各ツールの制約を確認してください。</p><p><a href="${repo}">ソース・ライセンス・問題報告</a> · <a href="https://eqvero.com/">Eqvero</a> · <a href="https://www.kolmopdf.com/">KolmoPDF</a> · <a href="https://komopdf.com/">KomoPDF</a></p>`
};
async function page(slug, lang, title, description, body, script = '') {
 const path = route(slug, lang); const other = lang === 'en' ? 'ja' : 'en'; const canonical = site.host + path; urls.push(canonical);
 const home = route('home', lang); const articleNav = articles.map(article => `<a href="${route(article.slug, lang)}">${esc(article.nav[lang])}</a>`).join('');
 const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} — ${esc(lang === 'en' ? site.name : site.japaneseName)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="en" href="${site.host + route(slug, 'en')}"><link rel="alternate" hreflang="ja" href="${site.host + route(slug, 'ja')}"><link rel="alternate" hreflang="x-default" href="${site.host + route(slug, 'en')}"><link rel="stylesheet" href="/assets/style.css"></head><body class="${site.theme}"><a class="skip" href="#main">${lang === 'en' ? 'Skip to content' : '本文へ'}</a><header><a class="wordmark" href="${home}">${esc(lang === 'en' ? site.name : site.japaneseName)}</a><span class="edition">${esc(site.edition[lang])}</span><nav aria-label="${lang === 'en' ? 'Primary navigation' : 'メインナビゲーション'}"><a href="${home}">${lang === 'en' ? 'Home' : 'ホーム'}</a>${tool ? `<a href="${route('tool', lang)}">${lang === 'en' ? 'Open tool' : 'ツール'}</a>` : ''}<a href="${route('about', lang)}">${lang === 'en' ? 'About' : '運営について'}</a><a lang="${other}" hreflang="${other}" href="${route(slug, other)}">${other === 'ja' ? '日本語' : 'English'}</a></nav></header><main id="main"><div class="section-label">${esc(site.eyebrow[lang])}</div><h1>${esc(title)}</h1>${body}</main><aside class="reading-nav"><h2>${lang === 'en' ? 'In this notebook' : 'このノートの内容'}</h2>${articleNav}</aside><footer><p>${lang === 'en' ? 'Local tools. Stated assumptions. Reproducible work.' : 'ローカルな道具。明示した前提。再現できる作業。'}</p><a href="${repo}">GitHub · MIT</a> <a href="${route('about', lang)}">${lang === 'en' ? 'Shared maintenance disclosure' : '関連プロジェクトの開示'}</a></footer>${script ? `<script type="module" src="${script}"></script>` : ''}</body></html>`;
 const destination = join(docs, path, 'index.html'); await mkdir(dirname(destination), { recursive: true }); await writeFile(destination, html);
}
for (const lang of ['en', 'ja']) {
 const cards = articles.map((article, i) => `<article class="article-card"><span class="article-number">0${i + 1}</span><h2><a href="${route(article.slug, lang)}">${esc(article.title[lang])}</a></h2><p>${esc(article.description[lang])}</p></article>`).join('');
 await page('home', lang, site.tagline[lang], site.description[lang], `<div class="intro">${introduction[lang]}</div>${tool ? `<a class="button" href="${route('tool', lang)}">${lang === 'en' ? 'Use the local tool' : 'ローカルツールを使う'} <span aria-hidden="true">↗</span></a>` : ''}<section class="article-grid" aria-label="${lang === 'en' ? 'Articles' : '記事'}">${cards}</section>`);
 await page('about', lang, lang === 'en' ? 'About & maintenance disclosure' : '運営・関連プロジェクトについて', lang === 'en' ? `Ownership, local processing and limitations at ${site.name}.` : `${site.japaneseName}の運営、ローカル処理、利用上の制約について。`, about[lang]);
 for (const article of articles) await page(article.slug, lang, article.title[lang], article.description[lang], `<article class="prose">${article.body[lang]}</article>`);
 if (tool) await page('tool', lang, tool.title[lang], tool.description[lang], tool.body[lang], tool.script || '');
}
await writeFile(join(docs, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${url}</loc></url>`).join('')}</urlset>`);
await writeFile(join(docs, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site.host}/sitemap.xml\n`);
await writeFile(join(docs, 'CNAME'), new URL(site.host).hostname + '\n'); await writeFile(join(docs, '.nojekyll'), '');
if (site.repo === 'share-slice') { for (const name of ['app.js', 'calculate.js']) await cp(join(root, 'src', name), join(docs, 'assets', name)); }
if (site.repo === 'page-recipe') { const { build } = await import('esbuild'); await build({ entryPoints: [join(root, 'src/app.js')], bundle: true, format: 'esm', minify: true, outfile: join(docs, 'assets/app.js'), legalComments: 'eof' }); }
// Keep all installed dependency license texts with the project and browser bundle.
let notices = '';
async function licenses(dir) {
 let entries; try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
 for (const entry of entries) { if (!entry.isDirectory() || entry.name.startsWith('.')) continue; const pkgdir = join(dir, entry.name); if (entry.name.startsWith('@')) { await licenses(pkgdir); continue; } let pkg; try { pkg = JSON.parse(await readFile(join(pkgdir, 'package.json'), 'utf8')); } catch { continue; } const files = await readdir(pkgdir); for (const name of files.filter(x => /^(?:licen[cs]e|copying)(?:\.|$)/i.test(x))) { try { notices += `\n=== ${pkg.name}@${pkg.version} (${pkg.license || 'see text'}) ===\n${await readFile(join(pkgdir, name), 'utf8')}\n`; } catch {} } }
}
await licenses(join(root, 'node_modules'));
if (notices) { await writeFile(join(root, 'THIRD-PARTY-NOTICES.txt'), notices); await writeFile(join(docs, 'assets/THIRD-PARTY-NOTICES.txt'), notices); }
console.log(`${site.repo}: ${urls.length} HTML pages built for ${site.host}`);
