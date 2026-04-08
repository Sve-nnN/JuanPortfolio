const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const cookies = JSON.parse(fs.readFileSync('content/dinorank-kw-session.json', 'utf-8'));
  await context.addCookies(cookies);
  const page = await context.newPage();
  
  await page.goto('https://dinorank.com/keyword-research');
  await page.waitForTimeout(2000);
  
  console.log("Clicking despliegaMas...");
  await page.locator('#despliegaMas').click({ force: true }).catch(console.error);
  await page.waitForTimeout(1000);
  
  console.log("Filling grupokeywordbuscar...");
  // Make sure it's visible or force evaluate
  await page.evaluate(() => {
    document.getElementById('grupokeywordbuscar').style.display = 'block';
  });
  
  await page.locator('#grupokeywordbuscar').fill('keyword bulk 1\nkeyword bulk 2');
  
  await page.waitForTimeout(1000);
  
  console.log("Clicking buscaKresearch...");
  const btn = page.locator('#buscaKresearch').first();
  await btn.click({ force: true });
  
  await page.waitForTimeout(10000);
  await browser.close();
})();
