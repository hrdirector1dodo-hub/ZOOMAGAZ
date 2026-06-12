/* global process, fetch */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productsPath = path.join(__dirname, 'src', 'data', 'products.json');
const articlesPath = path.join(__dirname, 'src', 'data', 'articles.json');

const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));

const testUrl = async (url) => {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return { ok: false, reason: 'Invalid or empty URL structure' };
  }
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    if (res.status === 404) {
      return { ok: false, reason: '404 Not Found' };
    }
    if (res.status === 403) {
      return { ok: false, reason: '403 Forbidden' };
    }
    if (!res.ok) {
      return { ok: false, reason: `HTTP status ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    // If HEAD fails, try GET just in case HEAD is blocked
    try {
      const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(5000) });
      if (res.ok) return { ok: true };
      return { ok: false, reason: `HTTP status ${res.status} (GET)` };
    } catch (e) {
      return { ok: false, reason: `Fetch error: ${err.message}` };
    }
  }
};

const runDiagnostics = async () => {
  console.log('Starting full catalog image diagnostics...\n');

  const brokenProducts = [];
  const brokenArticles = [];

  let checkedProductsCount = 0;
  let brokenProductsCount = 0;

  console.log(`Checking ${products.length} products...`);
  for (const p of products) {
    checkedProductsCount++;
    const images = p.images || [];
    if (images.length === 0) {
      brokenProducts.push({
        id: p.id,
        name: p.name,
        category: p.categoryName || p.category,
        url: 'None',
        reason: 'Missing image field or empty array'
      });
      brokenProductsCount++;
      continue;
    }

    // Check primary image (first one)
    const primaryUrl = images[0];
    const check = await testUrl(primaryUrl);
    if (!check.ok) {
      brokenProducts.push({
        id: p.id,
        name: p.name,
        category: p.categoryName || p.category,
        url: primaryUrl,
        reason: check.reason
      });
      brokenProductsCount++;
    }
  }

  console.log(`Checking ${articles.length} articles...`);
  for (const a of articles) {
    const check = await testUrl(a.image);
    if (!check.ok) {
      brokenArticles.push({
        id: a.id,
        name: a.title,
        category: a.category,
        url: a.image,
        reason: check.reason
      });
    }
  }

  // Create report markdown
  const reportPath = 'C:\\Users\\Lenovo\\.gemini\\antigravity-ide\\brain\\b411d5a0-b4f4-4986-9e10-b40f7786df90\\catalog_image_report.md';
  let md = `# Catalog Image Diagnostic Report\n\n`;
  md += `Checked **${products.length}** products and **${articles.length}** articles.\n\n`;
  md += `### Summary\n`;
  md += `- Products with broken/missing primary images: **${brokenProductsCount}**\n`;
  md += `- Articles with broken/missing images: **${brokenArticles.length}**\n\n`;

  md += `## Broken Products\n\n`;
  md += `| ID | Название | Категория | Текущий URL | Причина |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- |\n`;
  brokenProducts.forEach(p => {
    md += `| ${p.id} | ${p.name} | ${p.category} | \`${p.url}\` | ${p.reason} |\n`;
  });

  md += `\n## Broken Articles\n\n`;
  md += `| ID | Заголовок | Категория | Текущий URL | Причина |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- |\n`;
  brokenArticles.forEach(a => {
    md += `| ${a.id} | ${a.name} | ${a.category} | \`${a.url}\` | ${a.reason} |\n`;
  });

  fs.writeFileSync(reportPath, md, 'utf8');

  console.log(`\nDiagnostics finished!`);
  console.log(`Broken products count: ${brokenProductsCount}`);
  console.log(`Report written to: ${reportPath}`);
};

runDiagnostics();
