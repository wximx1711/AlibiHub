const fs = require('fs'), assert = require('node:assert/strict');
const { proxyUrl, STYLES, validateAiScenario } = require('../src/utils/validation');
async function main() {
  const url = proxyUrl(process.env.EXPO_PUBLIC_AI_PROXY_URL || process.argv[2] || '');
  async function request(path, body) {
    const response = await fetch(url + path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(120000) });
    assert.equal(response.ok, true, `${path}: HTTP ${response.status}`);
    return response.json();
  }
  const health = await request('/api/health'); assert.equal(health.hasKey, true);
  const results = { url, timestamp: new Date().toISOString(), messages: [] };
  for (const style of STYLES) {
    const result = await request('/api/ai/message', { situation: 'Tôi muốn từ chối lịch sự lời mời đi ăn vì cần nghỉ ngơi.', style });
    assert.ok(typeof result.text === 'string' && result.text.length > 10);
    results.messages.push(result); console.log('PASS HTTPS AI1', style);
  }
  const result = await request('/api/ai/scenario', { situationDescription: 'Tôi cần về sớm khỏi buổi họp bạn bè để nghỉ ngơi.' });
  results.scenario = validateAiScenario(result.scenario); console.log('PASS HTTPS AI2');
  fs.writeFileSync('docs/https-ai-results.json', JSON.stringify(results, null, 2));
}
main().catch(err => { console.error(err.message); process.exitCode = 1; });
