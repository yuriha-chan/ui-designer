import { chromium, type FullConfig } from "@playwright/test";

async function globalSetup(_config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.addInitScript({
    content: `
      const style = document.createElement('style');
      style.textContent = 'html { font-family: "Noto Sans JP", "Noto Sans", sans-serif; }';
      document.head.appendChild(style);
    `,
  });
  await browser.close();
}

export default globalSetup;
