import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log('Console:', msg.text());
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.error('Page error:', error.message);
  });
  
  // Navigate to the page
  await page.goto('http://localhost:3000');
  
  // Wait for a few seconds to capture any console logs
  await page.waitForTimeout(5000);
  
  await browser.close();
})();
