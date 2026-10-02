// npm install --prefix node_modules/.responsive-test --no-save --package-lock=false playwright
// node tests/responsive-pages.mjs
// Uses a local mock Supabase server and an isolated browser session, never live data.
import { chromium } from '../node_modules/.responsive-test/node_modules/playwright/index.mjs';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdirSync, createWriteStream, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { once } from 'node:events';
import assert from 'node:assert/strict';

const output = 'node_modules/.responsive-test/results';
mkdirSync(output, { recursive: true });
const generatedConfig = ['tsconfig.json', 'next-env.d.ts'].map((file) => [file, readFileSync(file)]);
const user = { id: '00000000-0000-4000-8000-000000000001', email: 'responsive-test@example.test', aud: 'authenticated', role: 'authenticated' };
const token = [
  { alg: 'HS256', typ: 'JWT' },
  { sub: user.id, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 86400 },
].map((value) => Buffer.from(JSON.stringify(value)).toString('base64url')).join('.') + '.dGVzdA';
const session = { access_token: token, refresh_token: 'local-test', token_type: 'bearer', expires_at: Math.floor(Date.now() / 1000) + 86400, user };
const customers = [
  { id: 1, name: 'Alexandra Long Client Name', email: `${'long'.repeat(16)}@example.test`, phone: '1234567890', address: 'Long address\nNew York', notes: 'Notes '.repeat(30), is_vip: true, is_interior_designer: true },
  { id: 2, name: 'Second Client', is_vip: false, is_interior_designer: false },
];
const artist = { id: 1, name: 'Long Artist Name', name_en: 'Long Artist Name', name_jp: '作家の名前', artist_photo_url: '/Onishi_Gallery_Logo.png', bio: 'Biography '.repeat(35), nationality: 'Japanese', birth_year: '1970', selected_exhibitions: 'Exhibition\n'.repeat(4), selected_public_collections: 'Collection', contact_info: `${'contact'.repeat(20)}@example.test`, additional_materials: 'https://example.test/' + 'material'.repeat(20) };
const artworks = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1, artist_id: 1, artist_name: artist.name, title_en: 'Long artwork title ' + 'edition'.repeat(8), title_jp: '作品の名前',
  artwork_photo_url: '/Onishi_Gallery_Logo.png', artist_photo_url: '/Onishi_Gallery_Logo.png',
  year: '2026', material: 'Ceramic and mixed materials', dimensions: '120 × 80 × 60 cm', category: 'Ceramics',
  is_unique: false, is_sold: true, is_unavailable: false, buyer_id: 1, buyer_ids: [1, 2], buyer_quantities: { 1: 3, 2: 2 },
  market_price: 1234567, cost: 100, note: 'Note '.repeat(40), copy_info: 'Artwork information '.repeat(30),
  extra_photo_link: '', fact_sheet_link: '', created_at: '2026-10-02T00:00:00Z', customers, artists: artist,
}));
const mock = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'authorization,apikey,content-type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.end(); return; }
  const url = new URL(req.url, 'http://127.0.0.1');
  if (url.pathname === '/auth/v1/user') { res.end(JSON.stringify(user)); return; }
  if (url.pathname === '/auth/v1/token') { res.end(JSON.stringify(session)); return; }
  let rows = url.pathname.endsWith('/customers') ? customers.map((client) => ({ ...client, artworks }))
    : url.pathname.endsWith('/artists') ? [artist] : artworks;
  const id = url.searchParams.get('id');
  if (id?.startsWith('eq.')) rows = rows.filter((row) => row.id === Number(id.slice(3)));
  res.setHeader('Content-Range', `0-${rows.length - 1}/${rows.length}`);
  res.end(JSON.stringify(req.headers.accept?.includes('vnd.pgrst.object') ? rows[0] : rows));
});
mock.listen(0, '127.0.0.1');
await once(mock, 'listening');
const api = `http://127.0.0.1:${mock.address().port}`;
const log = createWriteStream(`${output}/next.log`);
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--webpack', '--port', '3107'], {
  env: { ...process.env, RESPONSIVE_TEST: '1', NEXT_PUBLIC_SUPABASE_URL: api, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'local-test-key', NEXT_TELEMETRY_DISABLED: '1' },
  stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
});
server.stdout.pipe(log); server.stderr.pipe(log);
let browser;
try {
  for (let attempt = 0; attempt < 120; attempt++) {
    if (server.exitCode !== null) throw new Error(`Test server exited; inspect ${output}/next.log`);
    try { await fetch('http://127.0.0.1:3107/auth/login'); break; } catch { await new Promise((resolve) => setTimeout(resolve, 1000)); }
  }
  const executablePath = process.env.RESPONSIVE_BROWSER || [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
  ].find(existsSync);
  browser = await chromium.launch({ executablePath, headless: true, args: ['--no-proxy-server'] });
  const context = await browser.newContext();
  await context.addCookies([{ name: 'sb-127-auth-token', value: 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url'), domain: '127.0.0.1', path: '/' }]);
  const page = await context.newPage();
  const browserErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') console.error('Console:', message.text()); });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('requestfailed', (request) => console.error('Request failed:', request.url(), request.failure()?.errorText));
  const failures = [];
  let checks = 0;
  async function check(label) {
    await page.waitForTimeout(150);
    const overflow = await page.evaluate(() => {
      const width = document.documentElement.clientWidth;
      return { width, scroll: document.documentElement.scrollWidth,
        elements: [...document.querySelectorAll('body *')].filter((node) => {
          if (node.closest('.price-list-preview, .price-list-measurement, nextjs-portal')) return false;
          const rect = node.getBoundingClientRect();
          return rect.width > 0 && (rect.right > width + 1 || rect.left < -1);
        }).slice(0, 8).map((node) => ({ tag: node.tagName, class: node.className, text: node.textContent?.slice(0, 60) })) };
    });
    checks++;
    if (overflow.scroll > overflow.width + 1 || overflow.elements.length) {
      failures.push({ label, ...overflow });
      console.log('Overflow:', JSON.stringify({ label, ...overflow }));
    }
  }
  const selectedRoutes = process.argv.find((argument) => argument.startsWith('--routes='))?.slice(9).split(',');
  const routes = selectedRoutes || ['/', '/artworks', '/artists', '/clients', '/clients/export', '/artworks/1', '/artists/1', '/clients/1', '/artworks/new', '/artists/new', '/clients/new', '/artworks/price-list', '/auth/login', '/auth/sign-up', '/auth/forgot-password', '/auth/update-password', '/auth/sign-up-success', '/auth/error', '/protected'];
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      const response = await page.goto(`http://127.0.0.1:3107${route}`, { waitUntil: 'networkidle' });
      assert(response.ok(), `${route}: HTTP ${response.status()}`);
      if (!route.startsWith('/auth') && route !== '/') assert(!page.url().includes('/auth/login'), `Unexpected login redirect: ${route}`);
      await page.waitForFunction(() => ![...document.querySelectorAll('main p')].some((node) => /^Loading/.test(node.textContent?.trim() || '')));
      const edit = { '/artworks/1': 'Edit Artwork', '/artists/1': 'Edit Artist', '/clients/1': 'Edit Client' }[route];
      if (edit) await page.getByRole('button', { name: edit, exact: true }).waitFor({ state: 'visible' });
      await check(`${width} ${route}`);
      if (edit) {
        await page.getByRole('button', { name: edit, exact: true }).click();
        await check(`${width} ${route} edit`);
      }
      if (route === '/clients/new') {
        await page.getByRole('checkbox').last().check();
        await check(`${width} ${route} quantity`);
      }
      if (route === '/artworks/price-list') {
        await page.getByRole('checkbox').first().check();
        await page.getByRole('button', { name: 'Preview Price List', exact: true }).click();
        await page.locator('.price-list-preview > .price-list-sheet').first().waitFor();
        await check(`${width} price list preview`);
        assert.equal(await page.locator('.price-list-preview > .price-list-sheet').first().evaluate((node) => Math.round(node.getBoundingClientRect().width)), 816);
      }
      if ([320, 1440].includes(width) && ['/artworks', '/clients/1', '/artworks/price-list'].includes(route)) {
        await page.screenshot({ path: `${output}/${width}-${route.replaceAll('/', '_')}.png`, fullPage: false });
      }
    }
    console.log(`Checked ${width}px`);
  }
  assert.deepEqual(failures, [], JSON.stringify(failures, null, 2));
  assert.deepEqual(browserErrors, [], 'No browser runtime errors');
  console.log(`${checks} responsive page checks passed.`);
} finally {
  await browser?.close();
  server.kill();
  await Promise.race([once(server, 'exit'), new Promise((resolve) => setTimeout(resolve, 5000))]);
  mock.close();
  log.end();
  // Next writes generated type paths for its alternate build directory.
  for (const [file, contents] of generatedConfig) writeFileSync(file, contents);
}
