import { type PageConfig } from '../types';

/**
 * TDesign UniApp 相关配置
 */
const uniappPages: PageConfig[] = [
  // UniApp 概览页
  {
    name: 'UniApp - 概览页',
    url: 'https://tdesign.tencent.com/uniapp/overview',
    whiteScreenCheck: true,
    expectedSelectors: [
      'td-header',
      'td-doc-layout',
    ],
  },

  // UniApp - 点击跳转到 Button 组件
  {
    name: 'UniApp - 跳转到 Button 组件',
    url: 'https://tdesign.tencent.com/uniapp/overview',
    whiteScreenCheck: true,
    actions: [
      {
        type: 'click',
        selector: 'td-doc-aside >>> a[href*="/uniapp/components/button"]',
        description: '点击 Button 组件',
      },
    ],
    afterActionCheck: {
      expectedSelectors: ['iframe[src*="/uniapp/live#/pages-more/button/button"]'],
      whiteScreenCheck: true,
    },
  },

  // 示例
  {
    name: 'UniApp - Button Demo',
    url: 'https://tdesign.tencent.com/uniapp/live/#',
    whiteScreenCheck: true,
    actions: [
      {
        type: 'click',
        selector: 'text=基础',
        description: '点击 Button 组件',
      },
      {
        type: 'click',
        selector: 'text=Button 按钮',
        description: '点击 Button 组件',
      },
    ],
    afterActionCheck: {
      expectedSelectors: ['.t-button__content'],
      whiteScreenCheck: true,
    },
  },
];

export default uniappPages;
