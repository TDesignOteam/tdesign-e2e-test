import { batchSendWxRobotMarkdown } from 't-comm';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 企业微信机器人通知脚本
 *
 * 读取 Jest 测试结果 JSON，解析失败用例，发送 Markdown 通知到企业微信机器人
 *
 * 环境变量：
 * - WECOM_WEBHOOK_URL: 企业微信机器人 Webhook 地址（必须）
 * - WECOM_CHAT_ID: 会话 ID，支持逗号分隔多个（必须）
 * - GITHUB_RUN_URL: GitHub Actions 运行链接（可选）
 */

interface JestTestResult {
  numFailedTestSuites: number;
  numPassedTestSuites: number;
  numTotalTestSuites: number;
  numFailedTests: number;
  numPassedTests: number;
  numTotalTests: number;
  success: boolean;
  testResults: Array<{
    name: string;
    status: string;
    message: string;
    assertionResults: Array<{
      ancestorTitles: string[];
      fullName: string;
      status: string;
      title: string;
      failureMessages: string[];
    }>;
  }>;
}

async function main() {
  const webhookUrl = process.env.WECOM_WEBHOOK_URL || '';
  const chatIdEnv = process.env.WECOM_CHAT_ID || 'ALL';
  const githubRunUrl = process.env.GITHUB_RUN_URL || '';

  if (!webhookUrl) {
    console.error('❌ 缺少环境变量 WECOM_WEBHOOK_URL');
    process.exit(1);
  }

  if (!chatIdEnv) {
    console.error('❌ 缺少环境变量 WECOM_CHAT_ID');
    process.exit(1);
  }

  // 支持逗号分隔多个 chatId
  const chatId = chatIdEnv.includes(',')
    ? chatIdEnv.split(',').map((s) => s.trim())
    : chatIdEnv.trim();

  // 读取测试结果
  const resultPath = path.resolve(__dirname, '../test-results/results.json');
  let testResult: JestTestResult | null = null;
  let failedDetails: string[] = [];

  if (fs.existsSync(resultPath)) {
    try {
      const raw = fs.readFileSync(resultPath, 'utf-8');
      testResult = JSON.parse(raw) as JestTestResult;

      // 提取失败用例信息
      for (const suite of testResult.testResults) {
        if (suite.status === 'failed') {
          const failedAssertions = suite.assertionResults?.filter(
            (a) => a.status === 'failed',
          ) || [];

          for (const assertion of failedAssertions) {
            const errorMsg = assertion.failureMessages?.[0]
              ?.split('\n')
              .slice(0, 3)
              .join('\n')
              .substring(0, 200) || '未知错误';

            failedDetails.push(
              `> **${assertion.title}**\n> ${errorMsg}`,
            );
          }

          // 如果没有 assertionResults，使用 suite message
          if (failedAssertions.length === 0 && suite.message) {
            failedDetails.push(
              `> **${path.basename(suite.name)}**\n> ${suite.message.substring(0, 200)}`,
            );
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ 解析测试结果 JSON 失败:', e);
    }
  }

  // 如果没有 JSON 结果，尝试读取日志输出
  if (!testResult) {
    const logPath = path.resolve(__dirname, '../test-results/output.log');
    if (fs.existsSync(logPath)) {
      const logContent = fs.readFileSync(logPath, 'utf-8');
      const lastLines = logContent.split('\n').slice(-20).join('\n');
      failedDetails.push(`> \`\`\`\n> ${lastLines.substring(0, 500)}\n> \`\`\``);
    }
  }

  // 构建 Markdown 消息
  const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

  let content = `## ❌ TDesign E2E 测试失败告警<@guowangyang>\n\n`;
  content += `**时间**: ${now}\n`;

  if (testResult) {
    content += `**通过**: ${testResult.numPassedTests}/${testResult.numTotalTests}\n`;
    content += `**失败**: <font color="warning">${testResult.numFailedTests}</font> 个用例\n`;
  }

  if (githubRunUrl) {
    content += `**详情**: [查看 Actions 日志](${githubRunUrl})\n`;
  }

  if (failedDetails.length > 0) {
    content += `\n### 失败详情\n\n`;
    // 最多显示 5 条失败信息，避免消息过长
    const displayDetails = failedDetails.slice(0, 5);
    content += displayDetails.join('\n\n');

    if (failedDetails.length > 5) {
      content += `\n\n> ... 还有 ${failedDetails.length - 5} 个失败用例，请查看 Actions 日志`;
    }
  }

  // 发送通知
  try {
    console.log('📤 正在发送企业微信机器人通知...');
    await batchSendWxRobotMarkdown({
      content,
      chatId,
      webhookUrl,
    });
    console.log('✅ 通知发送成功');
  } catch (error) {
    console.error('❌ 通知发送失败:', error);
    process.exit(1);
  }
}

main();
