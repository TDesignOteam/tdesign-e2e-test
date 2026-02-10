import type { Page } from 'puppeteer';
import { type PageAction, type AfterActionCheck } from '../config/types';

/**
 * 等待指定毫秒
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 在页面上下文中递归穿透 Shadow DOM 查找元素
 *
 * 支持两种选择器格式：
 * 1. 普通选择器：如 "header"、".TDesign-header"，会自动递归 Shadow DOM 查找
 * 2. 穿透组合选择器：如 "td-header >>> .TDesign-header"，先找到宿主元素再进入其 Shadow DOM 查找
 */
async function deepQuerySelector(page: Page, selector: string): Promise<any> {
  return page.evaluateHandle((sel: string) => {
    // 递归穿透 Shadow DOM 查找元素
    function deepFind(root: Document | ShadowRoot | Element, query: string): Element | null {
      // 先在当前层级用 querySelector 查找
      try {
        const found = root.querySelector(query);
        if (found) return found;
      } catch {
        // 选择器语法在某些 ShadowRoot 上可能报错，忽略
      }

      // 获取当前层级所有元素，递归进入 Shadow DOM
      const allElements = root.querySelectorAll('*');
      for (const el of allElements) {
        if (el.shadowRoot) {
          const result = deepFind(el.shadowRoot, query);
          if (result) return result;
        }
        // 兼容 slot 分发内容：检查 assignedElements
        if (el instanceof HTMLSlotElement) {
          const assigned = el.assignedElements({ flatten: true });
          for (const slotEl of assigned) {
            try {
              const found = slotEl.querySelector(query);
              if (found) return found;
            } catch {
              // 忽略
            }
            if (slotEl.matches && slotEl.matches(query)) return slotEl;
            if (slotEl.shadowRoot) {
              const result = deepFind(slotEl.shadowRoot, query);
              if (result) return result;
            }
          }
        }
      }
      return null;
    }

    // 支持 ">>>" 穿透组合选择器
    if (sel.includes('>>>')) {
      const parts = sel.split('>>>').map(s => s.trim());
      let current: Document | ShadowRoot | Element = document;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const el: any = (current instanceof Document || current instanceof ShadowRoot)
          ? deepFind(current, part)
          : deepFind(current.shadowRoot || current, part);

        if (!el) return null;

        // 如果不是最后一段，进入 Shadow DOM
        if (i < parts.length - 1) {
          if (!el.shadowRoot) return null;
          current = el.shadowRoot;
        } else {
          return el;
        }
      }
      return null;
    }

    // 普通选择器：自动递归穿透 Shadow DOM 查找
    return deepFind(document, sel);
  }, selector);
}

/**
 * 判断一个 JSHandle 指向的元素是否为 null
 */
async function isElementHandleNull(handle: any): Promise<boolean> {
  const value = await handle.evaluate((el: any) => el === null || el === undefined);
  return value;
}

/**
 * 等待元素可见（支持 Shadow DOM 穿透，带超时）
 */
async function waitForVisible(page: Page, selector: string, timeout = 10000): Promise<boolean> {
  const start = Date.now();
  const interval = 300;

  while (Date.now() - start < timeout) {
    try {
      const handle = await deepQuerySelector(page, selector);
      const isNull = await isElementHandleNull(handle);

      if (!isNull) {
        // 检查是否可见
        const visible = await handle.evaluate((el: Element) => {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.visibility !== 'hidden' &&
            style.display !== 'none' &&
            style.opacity !== '0'
          );
        });
        await handle.dispose();
        if (visible) return true;
      } else {
        await handle.dispose();
      }
    } catch {
      // 忽略中间错误，继续轮询
    }
    await delay(interval);
  }
  return false;
}

/**
 * 白屏检测
 * 检查页面是否渲染了有意义的内容，防止白屏
 * 支持 Web Components / Shadow DOM 场景
 */
export async function checkWhiteScreen(page: Page, pageName: string): Promise<void> {
  // 1. 检查 body 是否有子元素
  const bodyChildCount = await page.evaluate(() => {
    return document.body?.children?.length ?? 0;
  });
  expect(bodyChildCount).toBeGreaterThan(0);
  if (bodyChildCount === 0) {
    throw new Error(`[${pageName}] 页面 body 没有子元素，疑似白屏`);
  }

  // 2. 检查 body 的 innerHTML 长度（过短可能是白屏）
  const bodyContentLength = await page.evaluate(() => {
    return document.body?.innerHTML?.length ?? 0;
  });
  if (bodyContentLength <= 50) {
    throw new Error(`[${pageName}] 页面内容长度过短（${bodyContentLength}），疑似白屏`);
  }

  // 3. 检查页面是否有可见元素（递归穿透 Shadow DOM）
  const hasVisibleContent = await page.evaluate(() => {
    // 递归收集所有可见文本和元素（包括 Shadow DOM 内部）
    function collectVisibleContent(root: Document | ShadowRoot | Element): boolean {
      // 检查当前层级
      if (root instanceof Element || root instanceof ShadowRoot) {
        const el = root instanceof ShadowRoot ? root.host : root;
        if (el instanceof HTMLElement) {
          const text = el.innerText?.trim() ?? '';
          if (text.length > 0) return true;
        }
      }

      // 检查子元素
      const elements = root.querySelectorAll('*');
      for (const el of elements) {
        // 检查文本内容
        if (el instanceof HTMLElement && el.children.length === 0) {
          const text = el.innerText?.trim() ?? '';
          if (text.length > 0) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) return true;
          }
        }

        // 检查可见图片
        if (el instanceof HTMLImageElement) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) return true;
        }

        // 检查 canvas / svg / video
        if (el instanceof HTMLCanvasElement || el instanceof SVGElement || el instanceof HTMLVideoElement) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) return true;
        }

        // 递归进入 Shadow DOM
        if (el.shadowRoot) {
          if (collectVisibleContent(el.shadowRoot)) return true;
        }
      }
      return false;
    }

    return collectVisibleContent(document);
  });
  if (!hasVisibleContent) {
    throw new Error(`[${pageName}] 页面没有可见内容（含 Shadow DOM 内部），疑似白屏`);
  }

  // 4. 检查页面的根挂载点（常见的 SPA 挂载点和 Web Components 自定义元素）
  const hasAppRoot = await page.evaluate(() => {
    // 检查传统 SPA 挂载点
    const spaSelectors = ['#app', '#root', '#__nuxt', '#__next', '[data-app]'];
    for (const sel of spaSelectors) {
      const el = document.querySelector(sel);
      if (el && el.children.length > 0) return true;
    }

    // 检查 Web Components 自定义元素（标签名包含 "-" 的即为自定义元素）
    const allElements = document.body.querySelectorAll('*');
    for (const el of allElements) {
      if (el.tagName.includes('-')) {
        // 自定义元素存在且有 Shadow DOM 或子元素
        if (el.shadowRoot?.children?.length || el.children.length > 0) return true;
      }
    }

    // 兜底：body 有内容就通过
    return (document.body?.children?.length ?? 0) > 0;
  });
  if (!hasAppRoot) {
    throw new Error(`[${pageName}] 找不到应用根挂载点，疑似白屏`);
  }
}

/**
 * 元素存在检测（支持 Shadow DOM 穿透）
 * 检查页面中是否包含期望的元素
 */
export async function checkExpectedSelectors(
  page: Page,
  pageName: string,
  selectors: string[],
): Promise<void> {
  for (const selector of selectors) {
    const visible = await waitForVisible(page, selector, 10000);
    if (!visible) {
      throw new Error(`[${pageName}] 期望元素 "${selector}" 不存在或不可见（已穿透 Shadow DOM 查找）`);
    }
  }
}

/**
 * 执行页面操作（支持 Shadow DOM 穿透）
 */
export async function executeActions(page: Page, actions: PageAction[]): Promise<void> {
  for (const action of actions) {
    // 操作前等待
    if (action.waitBefore) {
      await delay(action.waitBefore);
    }

    switch (action.type) {
      case 'click': {
        if (!action.selector) throw new Error(`click 操作缺少 selector: ${action.description}`);
        const clickVisible = await waitForVisible(page, action.selector, 10000);
        if (!clickVisible) {
          throw new Error(`click 操作目标元素 "${action.selector}" 不存在或不可见: ${action.description}`);
        }
        // 通过穿透查询找到元素，获取其屏幕坐标
        const clickHandle = await deepQuerySelector(page, action.selector);
        const isNull = await isElementHandleNull(clickHandle);
        if (isNull) throw new Error(`click 操作找不到元素 "${action.selector}": ${action.description}`);

        // 获取元素中心坐标，滚动到可见位置
        const clickBox = await clickHandle.evaluate((el: Element) => {
          // 先将元素滚动到视口中
          el.scrollIntoView({ block: 'center', inline: 'center' });
          const rect = el.getBoundingClientRect();
          return {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
            tagName: el.tagName.toLowerCase(),
            href: (el as HTMLAnchorElement).href || '',
          };
        });
        await clickHandle.dispose();

        // 使用真实的鼠标点击（而非 JS click），这样才能正确触发：
        // 1. <a> 标签的浏览器原生导航
        // 2. Shadow DOM 内部元素的事件冒泡
        // 3. 各种框架的事件委托
        const navigationPromise = page.waitForNavigation({
          waitUntil: 'domcontentloaded',
          timeout: 10000,
        }).catch(() => {
          // 如果没有导航发生则忽略超时
        });

        await page.mouse.click(clickBox.x, clickBox.y);

        // 如果是 <a> 标签或有 href，等待导航完成
        if (clickBox.tagName === 'a' || clickBox.href) {
          await navigationPromise;
          // 导航后等待网络空闲
          await page.waitForNetworkIdle({ timeout: 10000 }).catch(() => {});
        } else {
          // 非链接点击，给页面一点时间渲染
          await delay(1000);
        }
        break;
      }
      case 'hover': {
        if (!action.selector) throw new Error(`hover 操作缺少 selector: ${action.description}`);
        const hoverVisible = await waitForVisible(page, action.selector, 10000);
        if (!hoverVisible) {
          throw new Error(`hover 操作目标元素 "${action.selector}" 不存在或不可见: ${action.description}`);
        }
        const hoverHandle = await deepQuerySelector(page, action.selector);
        const hoverIsNull = await isElementHandleNull(hoverHandle);
        if (hoverIsNull) throw new Error(`hover 操作找不到元素 "${action.selector}": ${action.description}`);

        // 获取元素位置后用 page.mouse.move 来触发 hover
        const box = await hoverHandle.evaluate((el: Element) => {
          const rect = el.getBoundingClientRect();
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        });
        await hoverHandle.dispose();
        await page.mouse.move(box.x, box.y);
        break;
      }
      case 'navigate': {
        if (!action.targetUrl) throw new Error(`navigate 操作缺少 targetUrl: ${action.description}`);
        await page.goto(action.targetUrl, { waitUntil: 'domcontentloaded' });
        break;
      }
      case 'scroll': {
        const scrollAmount = action.scrollY ?? 500;
        await page.evaluate((y) => window.scrollBy(0, y), scrollAmount);
        break;
      }
      case 'input': {
        if (!action.selector) throw new Error(`input 操作缺少 selector: ${action.description}`);
        if (action.inputValue === undefined) throw new Error(`input 操作缺少 inputValue: ${action.description}`);
        const inputVisible = await waitForVisible(page, action.selector, 10000);
        if (!inputVisible) {
          throw new Error(`input 操作目标元素 "${action.selector}" 不存在或不可见: ${action.description}`);
        }
        const inputHandle = await deepQuerySelector(page, action.selector);
        const inputIsNull = await isElementHandleNull(inputHandle);
        if (inputIsNull) throw new Error(`input 操作找不到元素 "${action.selector}": ${action.description}`);

        // 聚焦、清空并输入
        await inputHandle.evaluate((el: Element) => {
          (el as HTMLInputElement).focus();
          (el as HTMLInputElement).value = '';
        });
        await inputHandle.dispose();
        await page.keyboard.type(action.inputValue);
        break;
      }
      default:
        throw new Error(`未知的操作类型: ${(action as PageAction).type}`);
    }

    // 操作后等待
    if (action.waitAfter) {
      await delay(action.waitAfter);
    }
  }
}

/**
 * 执行操作后的检查
 */
export async function executeAfterActionCheck(
  page: Page,
  pageName: string,
  check: AfterActionCheck,
): Promise<void> {
  if (check.whiteScreenCheck) {
    await checkWhiteScreen(page, `${pageName} (操作后)`);
  }

  if (check.expectedSelectors?.length) {
    await checkExpectedSelectors(page, `${pageName} (操作后)`, check.expectedSelectors);
  }

  if (check.expectedUrlPattern) {
    const currentUrl = page.url();
    const regex = new RegExp(check.expectedUrlPattern);
    if (!regex.test(currentUrl)) {
      throw new Error(
        `[${pageName}] 操作后 URL "${currentUrl}" 不匹配预期模式 "${check.expectedUrlPattern}"`,
      );
    }
  }
}
