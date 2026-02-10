import { type PageConfig } from './types';
import {
  homePages,
  uniappPages,
  miniprogramPages,
  vueNextPages,
  mobileVuePages,
} from './modules';

/**
 * TDesign E2E 测试配置汇总
 *
 * 各模块配置位于 modules/ 目录下，按 TDesign 子站/框架拆分：
 *   - home.ts        —— TDesign 官网首页
 *   - uniapp.ts      —— UniApp 相关页面
 *   - miniprogram.ts —— 小程序相关页面
 *   - vue-next.ts    —— Vue Next（桌面端 Vue3）相关页面
 *   - mobile-vue.ts  —— Mobile Vue（移动端）相关页面
 *
 * 新增模块步骤：
 *   1. 在 modules/ 目录下创建新的配置文件（如 react.ts）
 *   2. 在 modules/index.ts 中导出
 *   3. 在此文件中导入并添加到 config 数组
 *
 * 选择器说明：
 *   - 普通选择器（如 ".TDesign-header"）会自动递归穿透 Shadow DOM 查找
 *   - 穿透组合选择器（如 "td-header >>> .TDesign-header"）先找宿主元素再进入 Shadow DOM
 *   - 自定义元素选择器（如 "td-doc-layout"）直接匹配 Web Components 标签
 */
const config: PageConfig[] = [
  ...homePages,
  ...uniappPages,
  ...miniprogramPages,
  ...vueNextPages,
  ...mobileVuePages,
];

export default config;
