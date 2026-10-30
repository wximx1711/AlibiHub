// Uses existing Windows Git Credential Manager; credentials never touch disk or logs.
const {execFileSync,spawnSync}=require('child_process');
async function main(){
  const result=spawnSync('git',['credential','fill'],{input:'protocol=https\nhost=github.com\n\n',encoding:'utf8',env:{...process.env,GCM_INTERACTIVE:'never',GIT_TERMINAL_PROMPT:'0'}});
  const fields=Object.fromEntries((result.stdout||'').trim().split('\n').map(line=>{const i=line.indexOf('=');return[line.slice(0,i),line.slice(i+1)];}));
  if(!fields.password)throw new Error('GitHub authentication required.');
  const headers={Authorization:`Bearer ${fields.password}`,'User-Agent':'AlibiHub','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'};
  const userResponse=await fetch('https://api.github.com/user',{headers});if(!userResponse.ok)throw new Error('GitHub authentication failed.');
  const user=await userResponse.json();
  const exists=await fetch(`https://api.github.com/repos/${user.login}/AlibiHub`,{headers});
  if(exists.ok)throw new Error('AlibiHub repository already exists; inspect it before publishing.');
  if(exists.status!==404)throw new Error(`Repository lookup failed: ${exists.status}`);
  execFileSync('node',['scripts/scan-secrets.cjs'],{stdio:'inherit'});
  const response=await fetch('https://api.github.com/user/repos',{method:'POST',headers,body:JSON.stringify({name:'AlibiHub',private:false,description:'Vietnamese social communication assistant — Expo React Native and server-side Gemini AI',auto_init:false})});
  const repo=await response.json();if(!response.ok)throw new Error(`Repository creation failed: ${response.status}`);
  execFileSync('git',['config','user.name',user.login]);
  execFileSync('git',['config','user.email',`${user.id}+${user.login}@users.noreply.github.com`]);
  execFileSync('git',['commit','-m','Complete core AlibiHub workflows and verify real Gemini integration'],{stdio:'inherit'});
  execFileSync('node',['scripts/scan-secrets.cjs'],{stdio:'inherit'});
  execFileSync('git',['remote','add','origin',repo.clone_url]);
  execFileSync('git',['push','-u','origin','main'],{stdio:'inherit'});
  console.log('Public repository:',repo.html_url);
}
main().catch(err=>{console.error(err.message);process.exitCode=1;});
