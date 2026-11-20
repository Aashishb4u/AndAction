/** Accepts DEEPSEEK_API_KEY (preferred) or DEEPSEEK_API. */
export function getDeepSeekKey(): string | undefined {
  return process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API || undefined;
}
