/**
 * 模块化配置汇总导出
 *
 * 每个模块对应 TDesign 的一个子站/框架，
 * 新增模块时只需在此处导入并添加到 allPages 数组中即可。
 */
export { default as homePages } from './home';
export { default as uniappPages } from './uniapp';
export { default as miniprogramPages } from './miniprogram';
export { default as vueNextPages } from './vue-next';
export { default as mobileVuePages } from './mobile-vue';
