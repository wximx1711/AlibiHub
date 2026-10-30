// Run: node --env-file=server/.env scripts/deploy-render.cjs
// Uses the user's authorized Render Free plan only; never logs environment values.
const fs = require('fs');
const repo = 'https://github.com/wximx1711/AlibiHub';
async function api(route, options = {}) {
  const res = await fetch('https://api.render.com/v1' + route, { ...options, headers: { Authorization: `Bearer ${process.env.RENDER_API_KEY}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`Render HTTP ${res.status}. Kiểm tra quyền tài khoản và giới hạn Free trong Dashboard.`);
  return res.json();
}
async function main() {
  if (!process.env.RENDER_API_KEY) throw new Error('Cần RENDER_API_KEY trong server/.env hoặc kết nối Render.');
  if (!process.env.GEMINI_API_KEY) throw new Error('Cần GEMINI_API_KEY trên máy chủ.');
  const owners = await api('/owners?limit=100');
  const ownerId = process.env.RENDER_OWNER_ID || (owners.length === 1 ? owners[0].owner.id : null);
  if (!ownerId) throw new Error('Có nhiều workspace Render. Đặt RENDER_OWNER_ID cho workspace muốn dùng.');
  const services = await api(`/services?ownerId=${encodeURIComponent(ownerId)}&limit=100`);
  let service = services.map(item => item.service).find(item => item.name === 'alibihub-api');
  if (service && service.repo?.replace(/\.git$/, '') !== repo) throw new Error('Tên service đã được dùng cho repository khác. Không thay đổi service đó.');
  if (!service) {
    const created = await api('/services', { method: 'POST', body: JSON.stringify({
      type: 'web_service', name: 'alibihub-api', ownerId, repo, branch: 'main', autoDeployTrigger: 'commit',
      envVars: [ { key: 'GEMINI_API_KEY', value: process.env.GEMINI_API_KEY }, { key: 'GEMINI_MODEL', value: 'gemini-3.1-flash-lite' }, { key: 'NODE_ENV', value: 'production' } ],
      serviceDetails: { runtime: 'docker', plan: 'free', region: 'singapore', healthCheckPath: '/api/health', envSpecificDetails: { dockerfilePath: './server/Dockerfile', dockerContext: '.' } },
    }) });
    service = created.service;
  }
  const deployments = await api(`/services/${service.id}/deploys?limit=1`);
  const result = { serviceId: service.id, url: service.serviceDetails?.url, dashboard: `https://dashboard.render.com/web/${service.id}`, status: deployments[0]?.deploy?.status || 'unknown' };
  fs.mkdirSync('docs', { recursive: true }); fs.writeFileSync('docs/render-deployment.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
  console.log('Chạy lại lệnh để kiểm tra trạng thái. Chỉ kiểm thử HTTPS khi deployment có trạng thái live.');
}
main().catch(err => { console.error(err.message); process.exitCode = 1; });
