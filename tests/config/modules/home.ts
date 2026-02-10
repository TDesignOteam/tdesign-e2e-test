import { type PageConfig } from '../types';

/**
 * TDesign 官网首页相关配置
 */
const homePages: PageConfig[] = [
  // 首页 —— 检测白屏和关键元素
  {
    name: '首页',
    url: 'https://tdesign.tencent.com/',
    whiteScreenCheck: true,
    expectedSelectors: [
      'td-header',         // 顶部导航
    ],
  },

  // 悬浮展开菜单测试
  {
    name: '首页 - 悬浮展开菜单',
    url: 'https://tdesign.tencent.com/',
    whiteScreenCheck: true,
    actions: [
      {
        type: 'hover',
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

export default homePages;
