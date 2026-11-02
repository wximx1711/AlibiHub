const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loader, memoryStorage } = require('./load-service.cjs');
const v = require('../src/utils/validation');
test('production validation rejects invalid input and preserves immediate schedules', () => {
  assert.equal(v.delay(0),0);
  for (const value of ['', null, false, -1, 0.5, Infinity, 86401, '12x']) assert.throws(()=>v.delay(value));
  for (const value of ['', 'abc', '123']) assert.throws(()=>v.phone(value));
  assert.equal(v.phone('0912 345 678'), '0912 345 678');
  assert.throws(()=>v.dialogue(['']));
  assert.throws(()=>v.validateAiScenario({}));
  for (const url of ['http://localhost:3001', 'https://localhost', 'https://example.com?key=secret', 'https://user:password@example.com']) assert.throws(()=>v.proxyUrl(url));
  assert.equal(v.proxyUrl('https://example.com/'),'https://example.com');
});
test('production storage CRUD, empty persistence, concurrency, templates and write errors', async () => {
  const native = memoryStorage();
  const load = loader({ '@react-native-async-storage/async-storage': native });
  let storage = load('src/services/storageService.js');
  await storage.initializeStorageIfNeeded();
  for(const c of await storage.getCallers()) await storage.deleteCaller(c.id);
  storage = loader({ '@react-native-async-storage/async-storage': native })('src/services/storageService.js');
  await storage.initializeStorageIfNeeded();
  assert.equal((await storage.getCallers()).length, 0, 'deleted callers stay deleted after restart');
  await Promise.all(Array.from({length:10},(_,i)=>storage.saveCaller({name:`Caller ${i}`,phoneNumber:'0912345678'})));
  assert.equal((await storage.getCallers()).length,10,'no lost concurrent writes');
  const caller = (await storage.getCallers())[0];
  await storage.saveCaller({...caller,name:'Updated'});
  assert.equal((await storage.getCallers()).length,10);
  const template = await storage.saveScenario({ title:'Test template', caller:{name:'Mẹ',phoneNumber:'0912345678'}, delaySeconds:0, ambientSound:'none', dialogue:['Con về nhé'], ambientVolume:0, voiceVolume:0 });
  assert.equal(template.callerName,'Mẹ'); assert.equal(template.delaySeconds,0); assert.equal(template.ambientVolume,0);
  const favorite = await storage.toggleScenarioFavorite(template.id); assert.equal(favorite.isFavorite,true);
  await storage.saveScenario({...favorite,title:'Edited'});
  assert.equal((await storage.getScenarios()).filter(s=>s.id===template.id).length,1);
  for(const s of await storage.getScenarios()) await storage.deleteScenario(s.id);
  assert.equal((await storage.getScenarios()).length,0);
  await Promise.all(Array.from({length:55},()=>storage.addCallHistoryEntry({callerName:'Mẹ',durationSeconds:12})));
  assert.equal((await storage.getCallHistory()).length,50);
  await storage.clearCallHistory(); assert.equal((await storage.getCallHistory()).length,0);
  native.values.set('@alibihub_callers_v1','broken JSON');
  await assert.rejects(storage.saveCaller({name:'Test',phoneNumber:'0912345678'}));
  assert.equal(native.values.get('@alibihub_callers_v1'),'broken JSON');
  native.setItem = async()=>{throw new Error('disk full');};
  await assert.rejects(storage.saveSettings({ambientVolume:0}),/disk full/);
});
test('production scheduler restores, fires once, cancels, and never launches in background', async () => {
  const native = memoryStorage();
  const state = { currentState: 'active', addEventListener:()=>({remove(){}}) };
  const notifications = { setNotificationHandler(){}, setNotificationChannelAsync:async()=>{}, getPermissionsAsync:async()=>({granted:true}), scheduleNotificationAsync:async input=>{assert.equal(input.trigger.type,'timeInterval');return 'notification';}, cancelScheduledNotificationAsync:async()=>{}, addNotificationResponseReceivedListener:()=>({remove(){}}), SchedulableTriggerInputTypes:{TIME_INTERVAL:'timeInterval'}, AndroidImportance:{HIGH:4} };
  const load = loader({'@react-native-async-storage/async-storage':native,'react-native':{Platform:{OS:'android'},AppState:state,Alert:{alert(){}}},'expo-notifications':notifications});
  const {ScheduledCallService} = load('src/services/notificationService.js');
  const service = new ScheduledCallService(); let count=0;
  await service.scheduleCall({caller:{name:'Mẹ'},delaySeconds:30},()=>count++);
  assert.ok(native.values.has('@alibihub_schedule_v1'));
  clearInterval(service.timer);
  const restarted = new ScheduledCallService(); const detach = restarted.attach(()=>count++); await restarted.queue;
  assert.equal(restarted.getScheduledInfo().isScheduled,true);
  state.currentState='background'; restarted.payload.targetTimestamp=Date.now()-10; restarted.checkDue(); await restarted.queue; assert.equal(count,0);
  state.currentState='active'; restarted.checkDue(); restarted.checkDue(); await restarted.queue; assert.equal(count,1);
  assert.equal(native.values.has('@alibihub_schedule_v1'),false);
  await restarted.scheduleCall({caller:{name:'Mẹ'},delaySeconds:30},()=>count++);
  await restarted.cancelScheduledCall(); assert.equal(restarted.getScheduledInfo().isScheduled,false); detach();
});
test('production dynamic roleplay dialogue and offline conversational replies', () => {
  const load = loader({});
  const { getVoiceProfile, detectCallerPersona, getDynamicRoleDialogue, generateOfflineCallReply } = load('src/services/dialogueService.js');

  assert.equal(detectCallerPersona({ name: 'Sếp Hoàng', role: 'Trưởng phòng' }), 'BOSS');
  assert.equal(detectCallerPersona({ name: 'Mẹ Yêu', role: 'Gia đình' }), 'FAMILY_MOM');
  assert.equal(detectCallerPersona({ name: 'Bố', role: 'Gia đình' }), 'FAMILY_DAD');
  assert.equal(detectCallerPersona({ name: 'Shipper Nam', role: 'Giao hàng' }), 'SHIPPER');
  assert.equal(detectCallerPersona({ name: 'Bạn thân', role: 'Bạn bè' }), 'FRIEND');

  const bossVoice = getVoiceProfile({ name: 'Sếp Hoàng' });
  assert.ok(bossVoice.pitch && bossVoice.rate);

  const replyBoss = generateOfflineCallReply({
    caller: { name: 'Sếp Hoàng', role: 'Trưởng phòng' },
    scenarioTitle: 'Server lỗi',
    category: 'Công sở',
    userUtterance: 'Dạ em nghe anh ơi',
  });
  assert.ok(replyBoss.includes('server') || replyBoss.includes('máy') || replyBoss.includes('lỗi') || replyBoss.length > 10);

  const replyMom = generateOfflineCallReply({
    caller: { name: 'Mẹ Yêu', role: 'Gia đình' },
    scenarioTitle: 'Việc gia đình',
    category: 'Gia đình',
    userUtterance: 'Con đang trên đường về rồi mẹ ơi!',
  });
  assert.ok(replyMom.includes('nhanh') || replyMom.includes('mẹ') || replyMom.includes('cẩn thận'));
});
