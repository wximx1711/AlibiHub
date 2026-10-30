const fs=require('fs'),{execFileSync}=require('child_process');
const known=[];
for(const file of ['server/.env','.env']) if(fs.existsSync(file)) for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)) {
  const match=line.match(/^(?:GEMINI_API_KEY|RENDER_API_KEY|GITHUB_TOKEN|GH_TOKEN)=(.+)$/);
  if(match && match[1].trim().length>12)known.push(match[1].trim().replace(/^["']|["']$/g,''));
}
const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const failures=[];
for(const file of files){
  if(/(^|\/)\.env($|\.)/.test(file)&&!file.endsWith('.env.example')) failures.push(file+': environment file');
  const data=execFileSync('git',['show',':'+file],{maxBuffer:20*1024*1024}).toString('utf8');
  if(known.some(key=>data.includes(key)) || /AIza[0-9A-Za-z_-]{30,}|gh[pousr]_[0-9A-Za-z]{30,}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(data))failures.push(file+': credential pattern');
}
let commits=[];try{commits=execFileSync('git',['rev-list','--all'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim().split('\n').filter(Boolean);}catch{}
for(const commit of commits){
  const patch=execFileSync('git',['show','--format=','--root',commit],{maxBuffer:30*1024*1024}).toString('utf8');
  if(known.some(key=>patch.includes(key)))failures.push(commit+': secret in history');
}
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log(`PASS: ${files.length} staged files and ${commits.length} commits scanned; no known secrets or private keys.`);
