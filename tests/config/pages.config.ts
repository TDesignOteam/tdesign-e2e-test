import { type PageConfig } from './types';

/**
 * TDesign E2E 测试配置
 *
 * 在此文件中配置需要测试的页面 URL 和检测规则
 *
 * 选择器说明：
 * - 普通选择器（如 ".TDesign-header"）会自动递归穿透 Shadow DOM 查找
 * - 穿透组合选择器（如 "td-header >>> .TDesign-header"）先找宿主元素再进入 Shadow DOM
 * - 自定义元素选择器（如 "td-doc-layout"）直接匹配 Web Components 标签
 */
const config: PageConfig[] = [
  // ===== 示例配置 =====

  // 1. 基础页面访问 —— 检测白屏和关键元素（Web Components 场景）
  {
    name: 'TDesign 官网首页',
    url: 'https://tdesign.tencent.com/',
    // 白屏检测：检查页面 body 是否有内容（自动穿透 Shadow DOM）
    whiteScreenCheck: true,
    // 关键元素选择器列表：自动递归穿透 Shadow DOM 查找
    expectedSelectors: [
      'td-header',                           // 自定义元素：顶部导航
      // 'td-doc-layout',                       // 自定义元素：文档布局
      // '.TDesign-header',                     // Shadow DOM 内部：头部容器（自动穿透查找）
    ],
  },

  // 2. 组件 Demo 页面
  {
    name: 'Button 组件 Demo',
    url: 'https://tdesign.tencent.com/vue-next/components/button',
    whiteScreenCheck: true,
    expectedSelectors: [
      'td-doc-layout',                       // 页面布局
      'td-header',                           // 头部导航
      '.TDesign-doc-demo',                   // Demo 展示区域（自动穿透查找）
    ],
  },

  // 3. 点击跳转模式 —— 先访问入口页，再点击元素跳转到目标页
  {
    name: '从首页点击跳转到组件页',
    url: 'https://tdesign.tencent.com/uniapp/overview',
    whiteScreenCheck: true,
    actions: [
      {
        type: 'click',
        // 穿透组合选择器：先找到 td-header，再进入其 Shadow DOM 查找导航链接
        selector: 'td-doc-aside >>> a[href*="/uniapp/components/button"]',
        description: '点击 button 组件',
      },
    ],
    // 跳转后的检测
    afterActionCheck: {
      expectedSelectors: ['iframe[src*="/uniapp/live#/pages-more/button/button"]'],
      whiteScreenCheck: true,
    },
  },

  // 4. 带路由导航的 SPA 页面
  {
    name: '路由导航测试',
    url: 'https://tdesign.tencent.com/vue-next/components/button',
    whiteScreenCheck: true,
    actions: [
      {
        type: 'navigate',
        // 通过修改 URL 进行路由跳转
        targetUrl: 'https://tdesign.tencent.com/vue-next/components/input',
        description: '路由跳转到 Input 组件',
      },
    ],
    afterActionCheck: {
      expectedSelectors: ['.TDesign-doc-demo'],
      whiteScreenCheck: true,
    },
  },

  // 5. 带悬浮操作的模式
  {
    name: '悬浮展开菜单测试',
    url: 'https://tdesign.tencent.com/',
    whiteScreenCheck: true,
    actions: [
      {
        type: 'hover',
        // 穿透 Shadow DOM 找到导航项
        selector: 'td-header >>> .TDesign-header-nav',
        description: '悬浮展开导航菜单',
      },
    ],
    afterActionCheck: {
      expectedSelectors: ['td-header'],
      whiteScreenCheck: true,
    },
  },
];

export default config;
