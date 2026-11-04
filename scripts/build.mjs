import { mkdir, writeFile, readFile, cp, readdir } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site, articles, introduction, tool, editorial } from '../site/content.mjs';
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
 en: `<h2>About this site</h2><p>${esc(site.name)} publishes practical tools and notes for financial research and document workflows. Explore the examples, inspect the source and use the documented limits when applying a result.</p><h2>Local processing and privacy</h2><p>The tools perform their documented calculations or file operations locally. This static site has no login, document-upload endpoint, analytics script or database. Loading the site requests its public HTML, styles and JavaScript from the hosting provider. External services have their own processing policies; KolmoPDF uploads documents for cloud conversion.</p><h2>Source and examples</h2><p>Source code and synthetic examples are available under MIT. Financial scenarios are not investment advice. A structural document check does not establish factual accuracy.</p><p><a href="${repo}">Source, license and issue tracker</a> · <a href="https://eqvero.com/">Eqvero</a> · <a href="https://www.kolmopdf.com/">KolmoPDF</a> · <a href="https://komopdf.com/">KomoPDF</a></p>`,
 ja: `<h2>このサイトについて</h2><p>${esc(site.japaneseName)}は、財務調査と文書作業に役立つツールと実践ノートを掲載しています。サンプルとソースを確認し、結果を利用する際は各ツールの対応範囲を確認してください。</p><h2>ローカル処理とプライバシー</h2><p>記載した計算やファイル処理はローカルで行います。この静的サイトにはログイン、文書のアップロード先、アクセス解析スクリプト、データベースがありません。表示時にはホスティング事業者からHTML・CSS・JavaScriptを取得します。外部サービスにはそれぞれの処理方針があり、KolmoPDFのクラウド変換では文書をアップロードします。</p><h2>ソースとサンプル</h2><p>ソースと合成例はMITライセンスで公開しています。財務シナリオは投資助言ではなく、文書の構造点検は事実の正確性を確認するものではありません。</p><p><a href="${repo}">ソース・ライセンス・問題報告</a> · <a href="https://eqvero.com/">Eqvero</a> · <a href="https://www.kolmopdf.com/">KolmoPDF</a> · <a href="https://komopdf.com/">KomoPDF</a></p>`
};

function editorialPresentation(slug, lang, title, description, canonical, seoTitle) {
 const article = articles.find(item => item.slug === slug);
 const brand = lang === 'en' ? site.name : site.japaneseName;
 const tags = { 'og:title': seoTitle, 'og:description': description, 'og:url': canonical, 'og:type': article ? 'article' : 'website', 'og:site_name': brand, 'og:locale': lang === 'en' ? 'en_US' : 'ja_JP', 'og:locale:alternate': lang === 'en' ? 'ja_JP' : 'en_US' };
 let head = Object.entries(tags).map(([property, content]) => '<meta property="' + property + '" content="' + esc(content) + '">').join('');
 if (!article) return { head, breadcrumb: '', byline: '', related: '' };
 const author = editorial.author[lang];
 const homeName = lang === 'en' ? 'Home' : 'ホーム';
 const data = { '@context': 'https://schema.org', '@graph': [
  { '@type': site.repo === 'paperwork-fieldnotes' ? 'BlogPosting' : 'Article', '@id': canonical + '#article', headline: title, description, url: canonical, mainEntityOfPage: { '@type': 'WebPage', '@id': canonical }, inLanguage: lang, author: { '@type': 'Organization', name: author, url: 'https://github.com/kolmo2026' }, publisher: { '@type': 'Organization', name: brand, url: site.host + route('home', lang) }, datePublished: editorial.published, dateModified: editorial.modified },
  { '@type': 'BreadcrumbList', '@id': canonical + '#breadcrumb', itemListElement: [ { '@type': 'ListItem', position: 1, name: homeName, item: site.host + route('home', lang) }, { '@type': 'ListItem', position: 2, name: title, item: canonical } ] }
 ] };
 head += '<script type="application/ld+json">' + JSON.stringify(data).replace(/</g, '\\u003c') + '</script>';
 const breadcrumb = '<nav class="breadcrumbs" aria-label="' + (lang === 'en' ? 'Breadcrumb' : '現在位置') + '"><a href="' + route('home', lang) + '">' + homeName + '</a><span aria-hidden="true"> / </span><span aria-current="page">' + esc(title) + '</span></nav>';
 const byline = '<div class="byline"><p><a rel="author" href="https://github.com/kolmo2026">' + esc(author) + '</a> · <a href="' + route('about', lang) + '">' + (lang === 'en' ? 'About' : '運営について') + '</a></p><p>' + (lang === 'en' ? 'Published ' : '公開 ') + '<time datetime="' + editorial.published + '">' + editorial.published + '</time> · ' + (lang === 'en' ? 'Updated ' : '更新 ') + '<time datetime="' + editorial.modified + '">' + editorial.modified + '</time></p></div>';
 const related = '<section class="related-reading"><h2>' + (lang === 'en' ? 'Related reading' : 'あわせて読む') + '</h2><ul>' + articles.filter(item => item.slug !== slug).map(item => '<li><a href="' + route(item.slug, lang) + '">' + esc(item.title[lang]) + '</a></li>').join('') + '</ul></section>';
 return { head, breadcrumb, byline, related };
}

async function page(slug, lang, title, description, body, script = '') {
 const path = route(slug, lang); const other = lang === 'en' ? 'ja' : 'en'; const canonical = site.host + path; urls.push(canonical);
 const home = route('home', lang); const articleNav = articles.map(article => `<a href="${route(article.slug, lang)}">${esc(article.nav[lang])}</a>`).join('');
 const seoTitle = `${slug === 'home' ? (lang === 'en' ? 'Reorder PDF Pages with Local Page Recipes' : 'PDFページの並べ替え・結合ツール') : title} — ${lang === 'en' ? site.name : site.japaneseName}`;
 const meta = editorialPresentation(slug, lang, title, description, canonical, seoTitle);
 const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(seoTitle)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="en" href="${site.host + route(slug, 'en')}"><link rel="alternate" hreflang="ja" href="${site.host + route(slug, 'ja')}"><link rel="alternate" hreflang="x-default" href="${site.host + route(slug, 'en')}"><link rel="stylesheet" href="/assets/style.css">${meta.head}</head><body class="${site.theme}"><a class="skip" href="#main">${lang === 'en' ? 'Skip to content' : '本文へ'}</a><header><a class="wordmark" href="${home}">${esc(lang === 'en' ? site.name : site.japaneseName)}</a><span class="edition">${esc(site.edition[lang])}</span><nav aria-label="${lang === 'en' ? 'Primary navigation' : 'メインナビゲーション'}"><a href="${home}">${lang === 'en' ? 'Home' : 'ホーム'}</a>${tool ? `<a href="${route('tool', lang)}">${lang === 'en' ? 'Open tool' : 'ツール'}</a>` : ''}<a href="${route('about', lang)}">${lang === 'en' ? 'About' : '運営について'}</a><a lang="${other}" hreflang="${other}" href="${route(slug, other)}">${other === 'ja' ? '日本語' : 'English'}</a></nav></header><main id="main"><div class="section-label">${esc(site.eyebrow[lang])}</div>${meta.breadcrumb}<h1>${esc(title)}</h1>${meta.byline}${body}${meta.related}</main><aside class="reading-nav"><h2>${lang === 'en' ? 'In this notebook' : 'このノートの内容'}</h2>${articleNav}</aside><footer><p>${lang === 'en' ? 'Local tools. Stated assumptions. Reproducible work.' : 'ローカルな道具。明示した前提。再現できる作業。'}</p><a href="${repo}">GitHub · MIT</a> <a href="${route('about', lang)}">${lang === 'en' ? 'About' : '運営について'}</a></footer>${script ? `<script type="module" src="${script}"></script>` : ''}</body></html>`;
 const destination = join(docs, path, 'index.html'); await mkdir(dirname(destination), { recursive: true }); await writeFile(destination, html);
}
for (const lang of ['en', 'ja']) {
 const cards = articles.map((article, i) => `<article class="article-card"><span class="article-number">0${i + 1}</span><h2><a href="${route(article.slug, lang)}">${esc(article.title[lang])}</a></h2><p>${esc(article.description[lang])}</p></article>`).join('');
 await page('home', lang, site.tagline[lang], site.description[lang], `<div class="intro">${introduction[lang]}</div>${tool ? `<a class="button" href="${route('tool', lang)}">${lang === 'en' ? 'Use the local tool' : 'ローカルツールを使う'} <span aria-hidden="true">↗</span></a>` : ''}<section class="article-grid" aria-label="${lang === 'en' ? 'Articles' : '記事'}">${cards}</section>`);
 await page('about', lang, lang === 'en' ? 'About' : '運営について', lang === 'en' ? `Tools, local processing and examples at ${site.name}.` : `${site.japaneseName}の運営、ローカル処理、利用上の制約について。`, about[lang]);
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
