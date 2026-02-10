import puppeteer, { type Browser, type Page } from 'puppeteer';
import pagesConfig from './config/pages.config';
import {
  checkWhiteScreen,
  checkExpectedSelectors,
  executeActions,
  executeAfterActionCheck,
} from './utils/helpers';

/**
 * TDesign E2E 测试 (Puppeteer + Jest)
 *
 * 根据 pages.config.ts 中的配置自动生成测试用例
 * 支持以下检测能力：
 * 1. 白屏检测 —— 防止页面无内容渲染
 * 2. 元素丢失检测 —— 确保关键元素存在
 * 3. 操作模式 —— 支持点击跳转、悬浮、路由导航、滚动、输入等
 */

let browser: Browser;

beforeAll(async () => {
  // CI 环境下使用 headless 模式
  const isCI = process.env.CI === 'true';

  browser = await puppeteer.launch({
    headless: isCI,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
    defaultViewport: { width: 1280, height: 720 },
  });
});

afterAll(async () => {
  if (browser) {
    await browser.close();
  }
});

// 根据配置自动生成测试用例
describe('TDesign E2E 测试', () => {
  for (const pageConfig of pagesConfig) {
    // 支持跳过配置
    const testFn = pageConfig.skip ? test.skip : test;

    testFn(`[${pageConfig.name}] ${pageConfig.url}`, async () => {
      const page: Page = await browser.newPage();

      try {
        // 设置自定义视口
        if (pageConfig.viewport) {
          await page.setViewport(pageConfig.viewport);
        }

        // 收集控制台错误
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });

        // 收集页面错误（JS 异常）
        page.on('pageerror', (error: any) => {
          consoleErrors.push(`PageError: ${error.message}`);
        });

        // 访问页面
        const response = await page.goto(pageConfig.url, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });

        // 检查 HTTP 状态码
        if (response) {
          const status = response.status();
          if (status >= 400) {
            throw new Error(
              `[${pageConfig.name}] 页面返回异常状态码: ${status}`,
            );
          }
        }

        // 页面加载后额外等待
        if (pageConfig.waitAfterLoad) {
          await new Promise((resolve) => setTimeout(resolve, pageConfig.waitAfterLoad));
        }

        // 等待网络空闲，确保页面资源加载完成
        await page.waitForNetworkIdle({ timeout: 15000 }).catch(() => {
          // networkIdle 可能超时，不阻塞测试
        });

        // === 白屏检测 ===
        if (pageConfig.whiteScreenCheck !== false) {
          await checkWhiteScreen(page, pageConfig.name);
        }

        // === 元素丢失检测 ===
        if (pageConfig.expectedSelectors?.length) {
          await checkExpectedSelectors(
            page,
            pageConfig.name,
            pageConfig.expectedSelectors,
          );
        }

        // === 执行操作序列 ===
        if (pageConfig.actions?.length) {
          await executeActions(page, pageConfig.actions);

          // === 操作后检查 ===
          if (pageConfig.afterActionCheck) {
            await executeAfterActionCheck(
              page,
              pageConfig.name,
              pageConfig.afterActionCheck,
            );
          }
        }

        // 打印收集到的控制台错误（用于调试，不阻塞测试）
        if (consoleErrors.length > 0) {
          console.warn(
            `[${pageConfig.name}] 页面存在 ${consoleErrors.length} 个控制台错误:`,
            consoleErrors.slice(0, 5).join('\n'),
          );
        }
      } finally {
        // 确保页面关闭，避免内存泄漏
        await page.close();
      }
    });
  }
});
