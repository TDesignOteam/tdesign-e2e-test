import type { Config } from 'jest';

const config: Config = {
  /* 使用 ts-jest 转换 TypeScript */
  preset: 'ts-jest',
  testEnvironment: 'node',
  /* 测试文件匹配 */
  testMatch: ['<rootDir>/tests/**/*.spec.ts'],
  /* 单个测试超时时间（毫秒） */
  testTimeout: 60 * 1000,
  /* 显示详细输出 */
  verbose: true,
};

export default config;
