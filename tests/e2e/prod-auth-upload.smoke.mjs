import puppeteer from 'puppeteer';
import crypto from 'node:crypto';

const FRONTEND_BASE_URL =
  process.env.FRONTEND_BASE_URL || 'https://enjoycorner.com';
const SMOKE_USERNAME = process.env.PROD_SMOKE_USERNAME;
const SMOKE_PASSWORD = process.env.PROD_SMOKE_PASSWORD;

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const failIfMissingEnv = () => {
  const missing = [];

  if (!SMOKE_USERNAME) {
    missing.push('PROD_SMOKE_USERNAME');
  }

  if (!SMOKE_PASSWORD) {
    missing.push('PROD_SMOKE_PASSWORD');
  }

  if (missing.length > 0) {
    throw new Error(`缺少环境变量: ${missing.join(', ')}`);
  }
};

const run = async () => {
  failIfMissingEnv();

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const consoleErrors = [];
  const failedRequests = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  page.on('response', (response) => {
    if (response.status() >= 400) {
      failedRequests.push(`${response.status()} ${response.url()}`);
    }
  });

  try {
    await page.goto(`${FRONTEND_BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.type('#username', SMOKE_USERNAME);
    await page.type('#password', SMOKE_PASSWORD);

    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForFunction(() => window.location.pathname !== '/login', {
        timeout: 30000,
      }),
    ]);

    const sessionResponse = await page.evaluate(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/auth/session`, {
        credentials: 'include',
      });

      const body = await response.json();

      return {
        ok: response.ok,
        status: response.status,
        body,
      };
    }, FRONTEND_BASE_URL);

    assert(sessionResponse.ok, `获取 session 失败: ${sessionResponse.status}`);
    assert(
      sessionResponse.body?.accessToken,
      'session 中未返回 accessToken，无法继续上传 smoke',
    );

    const fileMd5 = crypto
      .createHash('md5')
      .update(`prod-auth-upload-smoke:${Date.now()}`)
      .digest('hex');

    const uploadInitResponse = await page.evaluate(
      async ({ baseUrl, accessToken, fileMd5: fileMd5Value }) => {
        const initResponse = await fetch(`${baseUrl}/api/upload/init`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            filename: 'prod-smoke-image.webp',
            fileSize: 1024,
            fileType: 'image',
            fileMd5: fileMd5Value,
            title: 'prod-smoke-image',
            description: 'temporary smoke upload init',
            tagNames: [],
          }),
        });

        let initBody = null;
        try {
          initBody = await initResponse.json();
        } catch {
          initBody = null;
        }

        let cancelStatus = null;

        if (initResponse.ok && initBody?.uploadId && initBody?.needUpload) {
          const cancelResponse = await fetch(
            `${baseUrl}/api/upload/${initBody.uploadId}`,
            {
              method: 'DELETE',
              credentials: 'include',
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          );
          cancelStatus = cancelResponse.status;
        }

        return {
          status: initResponse.status,
          body: initBody,
          cancelStatus,
        };
      },
      {
        baseUrl: FRONTEND_BASE_URL,
        accessToken: sessionResponse.body.accessToken,
        fileMd5,
      },
    );

    assert(
      uploadInitResponse.status < 400,
      `upload init 失败: ${uploadInitResponse.status} ${JSON.stringify(uploadInitResponse.body)}`,
    );

    if (uploadInitResponse.body?.needUpload) {
      assert(
        uploadInitResponse.cancelStatus === 204,
        `upload init 后取消清理失败: ${uploadInitResponse.cancelStatus}`,
      );
    }

    const authExpiredErrors = consoleErrors.filter((entry) =>
      entry.includes('登录状态已失效'),
    );
    assert(authExpiredErrors.length === 0, authExpiredErrors.join('\n'));

    console.log(
      JSON.stringify(
        {
          success: true,
          baseUrl: FRONTEND_BASE_URL,
          currentUrl: page.url(),
          uploadInit: uploadInitResponse,
          failedRequests,
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
