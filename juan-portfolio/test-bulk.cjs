const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const cookies = JSON.parse(fs.readFileSync('content/dinorank-kw-session.json', 'utf-8'));
  await context.addCookies(cookies);
  const page = await context.newPage();
  
  await page.goto('https://dinorank.com/keyword-research');
  await page.waitForTimeout(4000);
  
  const isLoginPage = await page.url().includes('/login');
  if (isLoginPage) {
    console.log("Got redirected to login!");
    await browser.close();
    return;
  }
  
  await page.screenshot({ path: '/tmp/bulk-test-1.png' });
  
  console.log("Clicking tituloAvanzado...");
  const advTitle = Object.keys(await page.evaluate(() => {
    return document.body.innerHTML.includes('tituloAvanzado');
  }));
  console.log("Has tituloAvanzado:", await page.evaluate(() => !!document.querySelector('#tituloAvanzado')));
  
  await page.evaluate(() => {
     const title = document.querySelector('#tituloAvanzado');
     if (title) title.click();
  });
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: '/tmp/bulk-test-2.png' });
  
  console.log("Has grupokeywordbuscar:", await page.evaluate(() => !!document.querySelector('#grupokeywordbuscar')));
  console.log("Has keywordnuevainsertar:", await page.evaluate(() => !!document.querySelector('#keywordnuevainsertar')));
  
  await browser.close();
})();
