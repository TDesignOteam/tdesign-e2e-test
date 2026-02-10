import { type PageConfig } from '../types';

/**
 * TDesign 小程序相关配置
 */
const miniprogramPages: PageConfig[] = [
  // 小程序概览页
  {
    name: '小程序 - 概览页',
    url: 'https://tdesign.tencent.com/miniprogram/overview',
    whiteScreenCheck: true,
    expectedSelectors: [
      'td-header',
      'td-doc-layout',
    ],
  },

  // 小程序 - 点击跳转到 Button 组件
  {
    name: '小程序 - 跳转到 Button 组件',
    url: 'https://tdesign.tencent.com/miniprogram/overview',
    whiteScreenCheck: true,
    actions: [
      {
        type: 'click',
        selector: 'td-doc-aside >>> a[href*="/miniprogram/components/button"]',
        description: '点击 Button 组件',
      },
    ],
    afterActionCheck: {
      expectedSelectors: ['iframe[src*="//tdesign.tencent.com/miniprogram/live/m2w/program/miniprogram/#!pages/button/button.html"]'],
      whiteScreenCheck: true,
    },
  },
];

export default miniprogramPages;
