const {test} = require('node:test');
const assert = require('node:assert/strict');
const {loader,memoryStorage} = require('./load-service.cjs');
test('actual client releases request lock on config/network errors and rejects malformed AI', async () => {
  const storage = memoryStorage(); let calls=0;
  const load = loader({'@react-native-async-storage/async-storage':storage},{process:{env:{}},fetch:async()=>{calls++; throw new TypeError('Failed to fetch');}});
  const service = load('src/services/aiService.js');
  await assert.rejects(service.generateExitMessage('Tôi muốn về sớm'), /HTTPS/);
  await assert.rejects(service.generateExitMessage('Tôi muốn về sớm'), /HTTPS/);
  await load('src/services/storageService.js').saveSettings({proxyUrl:'https://example.com'});
  await assert.rejects(service.generateExitMessage('Tôi muốn về sớm'), /Internet/);
  await assert.rejects(service.generateExitMessage('Tôi muốn về sớm'), /Internet/);
  assert.equal(calls,2);
  assert.throws(()=>service.scenarioFromResponse({},'test'));
});
test('actual Gemini parser rejects fabricated/missing structured fields and sends key in header only', async()=>{
  const original = global.fetch;
  const {generateScenario,generateMessage} = require('../server/geminiProxy');
  let requested=false;
  global.fetch=async(url,options)=>{
    requested=true; assert.ok(!url.includes('unit-key')); assert.equal(options.headers['x-goog-api-key'],'unit-key');
    return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'{}'}]}}]})};
  };
  try {
    await assert.rejects(generateScenario('unit-key',{situationDescription:'Tôi cần rời buổi họp'}));
    assert.equal(requested,true);
    await assert.rejects(generateMessage('unit-key',{situation:123}));
  } finally { global.fetch=original; }
});
