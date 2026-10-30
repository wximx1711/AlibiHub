const { proxyUrl } = require('../src/utils/validation');
const config = require('../eas.json');
try {
  proxyUrl(process.env.EXPO_PUBLIC_AI_PROXY_URL || config.build.preview.env?.EXPO_PUBLIC_AI_PROXY_URL || '');
  for (const key of Object.keys(process.env)) if (/^EXPO_PUBLIC_.*(API_KEY|SECRET|TOKEN|PASSWORD)/i.test(key) && process.env[key]) throw new Error('Không đưa secret vào EXPO_PUBLIC_*');
  console.log('PASS: public HTTPS backend configuration; no public secret variables.');
} catch (err) { console.error('BUILD BLOCKED:', err.message); process.exitCode = 1; }
