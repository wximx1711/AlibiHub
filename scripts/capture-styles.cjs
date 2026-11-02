const { chromium } = require('@playwright/test');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve('dist');

const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname.replace(/\/$/, '/index.html'));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' : file.endsWith('.html') ? 'text/html' : file.endsWith('.wav') ? 'audio/wav' : 'application/octet-stream');
    res.end(data);
  });
});

async function main() {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('dialog', d => d.accept());

  try {
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.getByText('AlibiHub', { exact: true }).waitFor();

    // 1. Home screenshot
    await page.screenshot({ path: 'docs/screenshots/home_redesigned.png' });

    // 2. Settings screenshot
    await page.getByText('⚙️ Cài đặt').click();
    await page.getByText('PHONG CÁCH GIAO DIỆN CUỘC GỌI').waitFor();
    await page.screenshot({ path: 'docs/screenshots/settings_appearance.png', fullPage: true });
    await page.getByText('Đóng').click();

    // 3. Test & capture each of the 4 styles by configuring outside the call in SmartCallSetupScreen
    const stylesToTest = [
      { name: 'android', label: 'Android' },
      { name: 'ios', label: 'iOS' },
      { name: 'zalo', label: 'Zalo' },
      { name: 'messenger', label: 'Messenger' },
    ];

    for (const st of stylesToTest) {
      await page.getByText('Gọi mô phỏng', { exact: true }).click();
      await page.getByText('Thiết lập Cuộc gọi', { exact: true }).waitFor();

      // Select style outside the call
      await page.getByText(st.label, { exact: true }).click();
      await page.getByText('Ngay tức thì', { exact: true }).click();

      // Launch call
      await page.getByText('📞 GỌI MÔ PHỎNG NGAY', { exact: true }).click();
      await page.getByText('Trả lời', { exact: true }).waitFor();

      // Verify no top style tabs exist
      const bodyText = await page.locator('body').innerText();
      if (bodyText.includes('Android / iOS / Zalo')) {
        throw new Error('Call screen must NOT show style switchers!');
      }

      // Capture incoming screenshot
      await page.screenshot({ path: `docs/screenshots/incoming_${st.name}.png` });

      // Answer call
      await page.getByText('Trả lời', { exact: true }).click();
      await page.getByTestId('end-call-btn').or(page.getByLabel('KẾT THÚC CUỘC GỌI')).waitFor();

      // Capture active screenshot
      await page.screenshot({ path: `docs/screenshots/active_${st.name}.png` });

      // End call
      await page.getByTestId('end-call-btn').or(page.getByLabel('KẾT THÚC CUỘC GỌI')).click();
      await page.getByText('Thiết lập Cuộc gọi', { exact: true }).waitFor();
    }

    console.log('Successfully captured screenshots for all 4 styles selected outside call!');
  } finally {
    await browser.close();
    await new Promise(r => server.close(r));
  }
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
  server.close();
});
