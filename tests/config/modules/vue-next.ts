import { type PageConfig } from '../types';

/**
 * TDesign Vue Next（桌面端 Vue3）相关配置
 */
const vueNextPages: PageConfig[] = [
  // Vue Next - Button 组件页
  {
    name: 'Vue Next - Button 组件',
    url: 'https://tdesign.tencent.com/vue-next/components/button',
    whiteScreenCheck: true,
    expectedSelectors: [
      'td-doc-layout',
      'td-header',
      '.TDesign-doc-demo',
    ],
  },

  // Vue Next - 路由导航测试
  {
    name: 'Vue Next - 路由跳转到 Input 组件',
    url: 'https://tdesign.tencent.com/vue-next/components/button',
    whiteScreenCheck: true,
    actions: [
      {
        type: 'navigate',
        targetUrl: 'https://tdesign.tencent.com/vue-next/components/input',
        description: '路由跳转到 Input 组件',
      },
    ],
    afterActionCheck: {
      expectedSelectors: ['.TDesign-doc-demo'],
      whiteScreenCheck: true,
    },
  },
];

export default vueNextPages;
