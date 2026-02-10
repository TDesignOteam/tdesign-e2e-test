import { type PageConfig } from '../types';

/**
 * TDesign Mobile Vue（移动端 Vue）相关配置
 */
const mobileVuePages: PageConfig[] = [
  // Mobile Vue - 概览页
  {
    name: 'Mobile Vue - 概览页',
    url: 'https://tdesign.tencent.com/mobile-vue/overview',
    whiteScreenCheck: true,
    expectedSelectors: [
      'td-header',
      'td-doc-layout',
    ],
  },

  // Mobile Vue - Button 组件（移动端视口）
  {
    name: 'Mobile Vue - Button 组件',
    url: 'https://tdesign.tencent.com/mobile-vue/demos/button',
    viewport: { width: 375, height: 812 },
    whiteScreenCheck: true,
  },
];

export default mobileVuePages;
