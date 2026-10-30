/**
 * Test Suite 4: Server Proxy Endpoints & Security Tests
 * Uses pure in-process HTTP dispatch (Runs 100% reliably in sandboxed environments).
 */

const assert = require('assert');
const { EventEmitter } = require('events');
const server = require('../server/index');

function dispatchRequest(method, urlPath, bodyObj = null) {
  return new Promise((resolve, reject) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = urlPath;
    req.headers = { host: 'localhost' };
    req.socket = { remoteAddress: '127.0.0.1' };

    let resHeaders = {};
    let statusCode = 200;
    let resBody = '';

    const res = {
      writeHead: (status, headers) => {
        statusCode = status;
        resHeaders = headers;
      },
      end: (chunk) => {
        if (chunk) resBody += chunk;
        let json = null;
        try {
          if (resBody) json = JSON.parse(resBody);
        } catch (_) { }
        resolve({ status: statusCode, headers: resHeaders, body: resBody, json });
      },
    };

    // Emit request event on server
    server.emit('request', req, res);

    // Send body if POST
    if (bodyObj) {
      req.emit('data', JSON.stringify(bodyObj));
    }
    req.emit('end');
  });
}

async function runServerTests() {
  console.log('\n--- Running Server Proxy Endpoints & Security Tests ---');

  // 1. GET /api/health
  const healthRes = await dispatchRequest('GET', '/api/health');
  assert.strictEqual(healthRes.status, 200);
  assert.strictEqual(healthRes.json.status, 'online');
  assert.strictEqual(healthRes.json.service, 'AlibiHub Gemini Proxy');
  console.log('✓ GET /api/health returned 200 OK and online status');

  // 2. AI1 without API Key returns 401 MISSING_API_KEY
  const msgRes = await dispatchRequest('POST', '/api/ai/message', {
    situation: 'Bị ép uống rượu tại tiệc',
  });
  assert.strictEqual(msgRes.status, 401);
  assert.strictEqual(msgRes.json.code, 'MISSING_API_KEY');
  console.log('✓ POST /api/ai/message safely rejects missing API key with 401 code');

  // 3. AI2 without API Key returns 401 MISSING_API_KEY
  const scRes = await dispatchRequest('POST', '/api/ai/scenario', {
    situationDescription: 'Bị ép uống rượu tại tiệc liên hoan',
  });
  assert.strictEqual(scRes.status, 401);
  assert.strictEqual(scRes.json.code, 'MISSING_API_KEY');
  console.log('✓ POST /api/ai/scenario safely rejects missing API key with 401 code');

  // 4. Update API key dynamically via /api/config/key
  const keyRes = await dispatchRequest('POST', '/api/config/key', {
    apiKey: 'AIzaSy_TEST_KEY_DUMMY_FOR_CHECK',
  });
  assert.strictEqual(keyRes.status, 200);
  assert.strictEqual(keyRes.json.success, true);
  console.log('✓ POST /api/config/key dynamically updates in-memory key');

  // 5. Verify /api/health reflects key presence
  const healthRes2 = await dispatchRequest('GET', '/api/health');
  assert.strictEqual(healthRes2.json.hasKey, true);
  assert.strictEqual(healthRes2.json.keyPrefix, 'AIza...');
  console.log('✓ Masked key prefix correctly reported in /api/health');

  // 6. Non-existent route returns 404
  const notFoundRes = await dispatchRequest('GET', '/api/non_existent_endpoint');
  assert.strictEqual(notFoundRes.status, 404);
  console.log('✓ Unknown routes return 404 Not Found');

  console.log('✓ Server tests completed successfully!\n');
}

module.exports = { runServerTests };
if (require.main === module) runServerTests();