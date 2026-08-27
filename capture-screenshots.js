/**
 * capture-screenshots.js
 * Ambil screenshot asli UI FVMS untuk disisipkan ke proposal.
 *
 * Jalankan di komputer Anda (bukan di sandbox), setelah:
 *   npm install
 *   npx playwright install chromium
 *
 * Cara pakai (isi kredensial sesuai role yang diinginkan, mis. admin):
 *   FVMS_EMAIL=admin@fvms.com FVMS_PASSWORD="Admin123!" node capture-screenshots.js
 *
 * Hasil: proposal/assets/{dashboard,schedules,visit,reports,lahan}.png
 * Lalu jalankan: node build-proposal.js  (proposal otomatis pakai screenshot tersebut)
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.FVMS_BASE || "https://fvms-eight.vercel.app";
const EMAIL = process.env.FVMS_EMAIL;
const PASS = process.env.FVMS_PASSWORD;

if (!EMAIL || !PASS) {
  console.error("ERROR: set FVMS_EMAIL dan FVMS_PASSWORD (env).");
  console.error('Contoh: FVMS_EMAIL=admin@fvms.com FVMS_PASSWORD="Admin123!" node capture-screenshots.js');
  process.exit(1);
}

const OUT = path.join(__dirname, "proposal", "assets");
fs.mkdirSync(OUT, { recursive: true });

const shots = [
  { name: "dashboard", path: "/dashboard" },
  { name: "schedules", path: "/schedules" },
  { name: "reports", path: "/reports" },
  { name: "lahan", path: "/pengajuan-lahan" },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1366, height: 820 },
    deviceScaleFactor: 1.5,
  });
  const page = await ctx.newPage();

  console.log("Login ke", BASE + "/login");
  await page.goto(BASE + "/login", { waitUntil: "networkidle", timeout: 60000 });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard**", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2500);
  console.log("Login OK. Meng-capture halaman...");

  for (const s of shots) {
    try {
      await page.goto(BASE + s.path, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(OUT, s.name + ".png") });
      console.log("  ✓", s.name + ".png");
    } catch (e) {
      console.log("  ✗", s.name, "->", e.message.split("\n")[0]);
    }
  }

  // Kunjungan (detail GPS+Foto): klik tautan kunjungan pertama
  try {
    await page.goto(BASE + "/schedules", { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);
    const link = page.locator('a[href^="/visits/"]').first();
    if ((await link.count()) > 0) {
      await link.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(OUT, "visit.png") });
      console.log("  ✓ visit.png");
    } else {
      console.log("  - visit: tidak ada tautan /visits/, lewati");
    }
  } catch (e) {
    console.log("  ✗ visit ->", e.message.split("\n")[0]);
  }

  await browser.close();
  console.log("Selesai. File ada di:", OUT);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
