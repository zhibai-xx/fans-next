import puppeteer from 'puppeteer';

const FRONTEND_BASE_URL =
  process.env.FRONTEND_BASE_URL || 'http://127.0.0.1:3001';
const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'Aa123456';
const SYSTEM_INGEST_SCAN_PATH =
  process.env.SYSTEM_INGEST_SCAN_PATH ||
  '/Users/houjiawei/Desktop/Projects/Scripts/weibo-crawler/weibo';

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const waitForButtonByText = async (page, text) => {
  await page.waitForFunction(
    (buttonText) =>
      Array.from(document.querySelectorAll('button')).some((button) =>
        button.textContent?.includes(buttonText),
      ),
    {},
    text,
  );
};

const clickButtonByText = async (page, text) => {
  const handle = await page.evaluateHandle((buttonText) => {
    return Array.from(document.querySelectorAll('button')).find((button) =>
      button.textContent?.includes(buttonText),
    );
  }, text);
  const element = handle.asElement();
  if (!element) {
    throw new Error(`未找到按钮: ${text}`);
  }
  await element.click();
};

const run = async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const consoleErrors = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  try {
    await page.goto(`${FRONTEND_BASE_URL}/images`, { waitUntil: 'networkidle2' });
    assert(page.url().includes('/images'), '游客访问图片页失败');

    await page.goto(`${FRONTEND_BASE_URL}/admin`, { waitUntil: 'networkidle2' });
    assert(page.url().includes('/login'), '游客访问后台未被重定向到登录页');

    await page.goto(`${FRONTEND_BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.type('#username', ADMIN_USERNAME);
    await page.type('#password', ADMIN_PASSWORD);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    await page.goto(`${FRONTEND_BASE_URL}/admin/dashboard`, {
      waitUntil: 'networkidle2',
    });
    assert(
      page.url().includes('/admin/dashboard'),
      '管理员访问后台首页失败',
    );

    await page.goto(`${FRONTEND_BASE_URL}/system-ingest`, {
      waitUntil: 'networkidle2',
    });
    await page.waitForSelector('#scan-path');
    await page.$eval('#scan-path', (input) => {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.type('#scan-path', SYSTEM_INGEST_SCAN_PATH);

    await waitForButtonByText(page, '开始扫描');
    await clickButtonByText(page, '开始扫描');

    await page.waitForFunction(
      () =>
        document.body.innerText.includes('总文件数') &&
        document.body.innerText.includes('用户数量'),
      { timeout: 30000 },
    );

    const summary = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        totalFiles: text.match(/总文件数\s+(\d+)/)?.[1] || null,
        userCount: text.match(/用户数量\s+(\d+)/)?.[1] || null,
        currentUrl: window.location.href,
      };
    });

    assert(summary.totalFiles !== null, 'system-ingest 扫描后未显示总文件数');
    assert(summary.userCount !== null, 'system-ingest 扫描后未显示用户数量');
    assert(consoleErrors.length === 0, `页面控制台存在错误: ${consoleErrors.join('\n')}`);

    console.log(
      JSON.stringify(
        {
          success: true,
          summary,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
};

run().catch((error) => {
  console.error(
    JSON.stringify(
      {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
