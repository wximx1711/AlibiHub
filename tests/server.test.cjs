process.env.NODE_ENV = 'test';
delete process.env.GEMINI_API_KEY;
const { test } = require('node:test');
const assert = require('node:assert/strict');
const server = require('../server/index');
test('real HTTP server rejects key changes, invalid JSON, oversized bodies and absent credentials', async () => {
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body)=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body});
  try {
    const health = await (await fetch(base+'/api/health')).json(); assert.equal(health.hasKey,false); assert.equal('keyPrefix' in health,false);
    assert.equal((await post('/api/config/key',JSON.stringify({apiKey:'unit-test-not-a-key'}))).status,403);
    for (const path of ['/api/ai/message', '/api/ai/scenario', '/api/ai/dialogue', '/api/ai/call-reply', '/api/ai/tts']) assert.equal((await post(path, '{}')).status, 401);
    for (const value of ['null','[]','{bad']) assert.equal((await post('/api/ai/message',value)).status,400);
    assert.equal((await post('/api/ai/message',JSON.stringify({situation:'x'.repeat(17000)}))).status,413);
    assert.equal((await fetch(base+'/missing')).status,404);
    let response; for(let i=0;i<42;i++) response=await fetch(base+'/api/health');
    assert.equal(response.status,429);
  } finally { await new Promise(resolve=>server.close(resolve)); }
});
