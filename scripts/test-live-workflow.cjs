// Real network: client -> local HTTP proxy -> Gemini. Only native storage is replaced.
const fs = require('fs');
const assert = require('node:assert/strict');
const { loader, memoryStorage } = require('../tests/load-service.cjs');
const { STYLES } = require('../src/utils/validation');
const server = require('../server/index');
async function main() {
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const native = memoryStorage();
  const load=loader({'@react-native-async-storage/async-storage':native},{process:{env:{EXPO_PUBLIC_AI_PROXY_URL:'https://integration.alibihub.test'}},fetch:(url,options)=>fetch(url.replace('https://integration.alibihub.test',origin),options)});
  const ai=load('src/services/aiService.js'), storage=load('src/services/storageService.js');
  const results={timestamp:new Date().toISOString(),transport:'local HTTP proxy to real Gemini; production HTTPS and physical device remain untested',messages:[]};
  try {
    for(const style of STYLES) {
      const started=Date.now();
      const result=await ai.generateExitMessage('Tôi mệt và muốn từ chối lời mời đi ăn tối với đồng nghiệp.',style,'Đồng nghiệp');
      assert.ok(result.text.length>10);
      results.messages.push({...result,latencyMs:Date.now()-started}); console.log('PASS AI1',style);
    }
    const generated=await ai.generateStructuredScenario('Tôi muốn rời buổi gặp bạn bè sớm để về nghỉ vì mệt.','Bạn bè');
    generated.scenario.title='Bản đã chỉnh sửa: về nghỉ';
    generated.scenario.delaySeconds=0;
    const saved=await storage.saveScenario(generated.scenario);
    const restarted=loader({'@react-native-async-storage/async-storage':native})('src/services/storageService.js');
    const restored=(await restarted.getScenarios()).find(s=>s.id===saved.id);
    assert.equal(restored.title,generated.scenario.title);assert.equal(restored.delaySeconds,0);
    const {ScheduledCallService}=loader({'@react-native-async-storage/async-storage':native,'react-native':{Platform:{OS:'web'},Alert:{alert(){}},AppState:{currentState:'active'}},'expo-notifications':{}})('src/services/notificationService.js');
    const scheduler=new ScheduledCallService();let launched;
    await scheduler.scheduleCall({...restored,caller:{name:restored.callerName,phoneNumber:restored.callerPhone}},p=>{launched=p;});
    assert.equal(launched.caller.name,restored.callerName);
    assert.equal(launched.dialogue[0],restored.dialogue[0]);
    results.scenario=restored;results.workflow='PASS: generate, edit, save, reload service, FE1 dispatch (native audio/UI not covered)';
    fs.mkdirSync('docs',{recursive:true});fs.writeFileSync('docs/live-ai-results.json',JSON.stringify(results,null,2));
    console.log('PASS AI2 → edit → storage restart → FE1 dispatcher');
  } finally { await new Promise(resolve=>server.close(resolve)); }
}
main().catch(err=>{console.error(err.message);process.exitCode=1;});
