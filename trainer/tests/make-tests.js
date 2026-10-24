// Wraps the built page fragment with tests/smoke.js into four test pages (test1.html ... test4.html).
// Phase 1: a fresh user. Phase 2: every quest unlocked, to open every lesson and widget.
// Phase 3: deep link to a problem. Phase 4: layout at phone width (run inside phone.html).
const fs = require('fs'), path = require('path');
const [,, fragmentFile, outDir] = process.argv;
const html = fs.readFileSync(fragmentFile, 'utf8'), test = fs.readFileSync(path.join(__dirname, 'smoke.js'), 'utf8');
const seedAllUnlocked = `localStorage.clear(); const units = {}, cards = {};
  for (let u = 1; u <= 40; u++) { units[u] = {passed: 1, best: 4}; for (let c = 0; c < 10; c++) cards['u' + u + 'c' + c] = 1; }
  localStorage.setItem('ground-up-trainer-v1', JSON.stringify({v:2, updatedAt:1, q:{}, weeks:{}, hist:[], learn:{cards, units, mux:{}}}));`;
fs.mkdirSync(outDir, {recursive: true});
// Phase 5 replaces Firebase with an in-memory stand-in holding one account with two solved problems.
const fakeFirebase = `localStorage.clear();
  localStorage.setItem('ground-up-trainer-v1', JSON.stringify({v:2, updatedAt:1, q:{'01-01':{n:1, c:1, ok:true, at:1}}, weeks:{}, hist:[], learn:{cards:{}, units:{}, mux:{}}}));
  window.FIREBASE_CONFIG = {projectId:'test'};
  window.__fb = {users:{u1:{updatedAt:5, state:JSON.stringify({v:2, updatedAt:5, q:{'01-05':{n:1, c:1, ok:true, at:5}, '02-03':{n:1, c:1, ok:true, at:5}}, weeks:{}, hist:[], learn:{cards:{}, units:{}, mux:{}}})}}};
  (function(){ let cb = null, cur = null; const tell = () => setTimeout(() => cb && cb(cur), 0);
    const auth = () => ({ onAuthStateChanged(f){ cb = f; tell(); }, signInWithPopup(){ cur = {uid:'u1', email:'me@test.dev', displayName:'Me'}; tell(); return Promise.resolve(); }, signOut(){ cur = null; tell(); return Promise.resolve(); } });
    auth.GoogleAuthProvider = function(){};
    window.firebase = { initializeApp(){}, auth,
      firestore: () => ({ collection: () => ({ doc: id => ({ get: () => Promise.resolve({exists: !!window.__fb.users[id], data: () => window.__fb.users[id]}), set: d => { window.__fb.users[id] = d; return Promise.resolve(); } }) }) }) };
  })();`;
[1, 2, 3, 4, 5, 6].forEach(p => {
  const pre = `<script>window.__PHASE=${p};${p === 2 ? seedAllUnlocked : p === 5 ? fakeFirebase : 'localStorage.clear();'}</script>\n`;
  const i = html.indexOf('<script>');
  fs.writeFileSync(path.join(outDir, `test${p}.html`), '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' +
    html.slice(0, i) + pre + html.slice(i) + '<script>' + test + '</script></body></html>');
});
fs.copyFileSync(path.join(__dirname, 'phone.html'), path.join(outDir, 'phone.html'));
