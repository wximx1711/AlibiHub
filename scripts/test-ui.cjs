const { chromium } = require('@playwright/test');
const http=require('http'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve('dist');
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.html')?'text/html':file.endsWith('.wav')?'audio/wav':'application/octet-stream');res.end(data);});
});
async function main(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844}}), errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  try{
    await page.goto(`http://127.0.0.1:${server.address().port}`);await page.getByText('AlibiHub',{exact:true}).waitFor();
    fs.mkdirSync('docs/screenshots',{recursive:true}); await page.screenshot({path:'docs/screenshots/home.png'});
    await page.getByText('Thư viện',{exact:true}).click();
    await page.getByPlaceholder('Tìm theo sếp, việc gấp, gia đình, shipper...').fill('khongtimthay123');
    assert.ok((await page.locator('body').innerText()).includes('Không tìm thấy'));
    await page.getByText('Gọi mô phỏng',{exact:true}).click();
    await page.getByText('Ngay tức thì',{exact:true}).click();
    await page.screenshot({path:'docs/screenshots/setup.png',fullPage:true});
    const launch=page.getByText('📞 GỌI MÔ PHỎNG NGAY',{exact:true});
    await launch.click();
    await page.getByText('Trả lời',{exact:true}).waitFor();
    await page.screenshot({path:'docs/screenshots/incoming.png'});
    await page.getByText('Trả lời',{exact:true}).click();
    await page.getByText('Tắt tiếng',{exact:true}).click();
    await page.getByText('Đã tắt tiếng',{exact:true}).waitFor();
    await page.getByText('KẾT THÚC CUỘC GỌI',{exact:true}).click();
    await page.getByText('Kho Vault',{exact:true}).click();
    await page.getByText(/Lịch sử \(/).click();
    assert.ok((await page.locator('body').innerText()).includes('Cuộc gọi của tôi'));
    await page.reload();await page.getByText('AlibiHub',{exact:true}).waitFor();
    await page.getByText('Kho Vault',{exact:true}).click();await page.getByText(/Lịch sử \(/).click();
    assert.ok((await page.locator('body').innerText()).includes('Cuộc gọi của tôi'));
    assert.deepEqual(errors,[]);
    console.log('PASS browser: search, setup, incoming, accept, mute, end, history, restart; no uncaught JS errors');
  }catch(err){console.log('Browser errors:',errors);console.log((await page.locator('body').innerText()).slice(-2000));await page.screenshot({path:'docs/screenshots/failure.png'});throw err;}finally{await browser.close();await new Promise(r=>server.close(r));}
}
main().catch(err=>{console.error(err);process.exitCode=1;server.close();});
