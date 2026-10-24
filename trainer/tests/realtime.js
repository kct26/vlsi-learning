// Opens a test page in headless Chrome and waits in real time (not virtual time) for its results.
// Used for phase 6, whose Python runs download Pyodide in a Web Worker.
// usage: node tests/realtime.js <file-url> [seconds]
const {spawn} = require('child_process');
const os = require('os'), path = require('path'), fs = require('fs');
const [url, secs = '180'] = process.argv.slice(2);
const chrome = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'gu-test-'));
const port = 9300 + Math.floor(Math.random() * 500);
const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files',
  `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, '--window-size=1280,900', url], {stdio: 'ignore'});
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  let ws;
  for (let i = 0; i < 50 && !ws; i++) {
    await sleep(200);
    try {
      const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const page = pages.find(p => p.type === 'page');
      if (page) ws = new WebSocket(page.webSocketDebuggerUrl);
    } catch (e) { /* not up yet */ }
  }
  if (!ws) { console.log('could not connect to Chrome'); proc.kill(); process.exit(1); }
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0;
  const call = (method, params) => new Promise(resolve => {
    const my = ++id;
    const on = ev => { const m = JSON.parse(ev.data); if (m.id === my) { ws.removeEventListener('message', on); resolve(m.result); } };
    ws.addEventListener('message', on);
    ws.send(JSON.stringify({id: my, method, params}));
  });
  const deadline = Date.now() + Number(secs) * 1000;
  let text = null;
  while (Date.now() < deadline) {
    const r = await call('Runtime.evaluate', {expression: "(document.getElementById('testlog') || {}).textContent || ''", returnByValue: true});
    if (r && r.result && r.result.value) { text = r.result.value; break; }
    await sleep(1000);
  }
  console.log(text ? text.split('===')[0].trim() : 'timed out waiting for results');
  ws.close(); proc.kill();
  await sleep(500);
  try { fs.rmSync(profile, {recursive: true, force: true, maxRetries: 5, retryDelay: 200}); } catch (e) { /* temp dir; the OS cleans it later */ }
  process.exit(text && / 0 failed, 0 errors/.test(text.split('===')[0]) ? 0 : 1);
})();
