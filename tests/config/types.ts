/**
 * 操作类型定义
 */
export interface PageAction {
  /** 操作类型 */
  type: 'click' | 'hover' | 'navigate' | 'scroll' | 'input';
  /** 目标元素选择器（click / hover / input 时必填） */
  selector?: string;
  /** 路由跳转目标 URL（navigate 时必填） */
  targetUrl?: string;
  /** 输入内容（input 时必填） */
  inputValue?: string;
  /** 滚动像素量（scroll 时使用） */
  scrollY?: number;
  /** 操作描述，用于日志和报告 */
  description?: string;
  /** 操作前等待时间（毫秒） */
  waitBefore?: number;
  /** 操作后等待时间（毫秒） */
  waitAfter?: number;
}

/**
 * 操作后检查配置
 */
export interface AfterActionCheck {
  /** 需要检查的选择器列表 */
  expectedSelectors?: string[];
  /** 是否检查白屏 */
  whiteScreenCheck?: boolean;
  /** 期望的 URL 模式（正则或字符串） */
  expectedUrlPattern?: string;
}

/**
 * 页面配置
 */
export interface PageConfig {
  /** 测试用例名称 */
  name: string;
  /** 页面 URL */
  url: string;
  /** 是否进行白屏检测，默认 true */
  whiteScreenCheck?: boolean;
  /** 期望存在的元素选择器列表 */
  expectedSelectors?: string[];
  /** 页面加载后执行的操作序列 */
  actions?: PageAction[];
  /** 操作执行后的检查 */
  afterActionCheck?: AfterActionCheck;
  /** 页面加载等待时间（毫秒），默认无额外等待 */
  waitAfterLoad?: number;
  /** 自定义视口大小 */
  viewport?: { width: number; height: number };
  /** 是否跳过该配置 */
  skip?: boolean;
}
