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
  window.FIREBASE_ADMINS = ['u1'];
  window.__fb = {users:{u1:{updatedAt:5, state:JSON.stringify({v:2, updatedAt:5, q:{'01-05':{n:1, c:1, ok:true, at:5}, '02-03':{n:1, c:1, ok:true, at:5}}, weeks:{}, hist:[], learn:{cards:{}, units:{}, mux:{}}})},
    u2:{updatedAt:Date.now(), name:'Ada', email:'ada@test.dev', state:JSON.stringify({v:2, updatedAt:Date.now(), q:{'11-01':{n:4, c:0, ok:false, at:Date.now()}, '11-02':{n:2, c:1, ok:true, at:Date.now()}, '01-01':{n:1, c:1, ok:true, at:Date.now()}}, learn:{cards:{}, units:{1:{passed:1, best:5}}, mux:{}}, code:{'c-01':{src:null, solved:Date.now(), at:Date.now(), subs:[{at:Date.now() - 9e5, v:'Wrong Answer', p:3, t:7}, {at:Date.now(), v:'Accepted', p:7, t:7}]}}, log:[[Date.now() - 9e5, 'c-01', 0], [Date.now(), 'c-01', 1], [Date.now(), '11-02', 1]]})}}};
  (function(){ let cb = null, cur = null; const tell = () => setTimeout(() => cb && cb(cur), 0);
    const auth = () => ({ onAuthStateChanged(f){ cb = f; tell(); }, signInWithPopup(){ const uid = window.__fbUid || 'u1'; cur = {uid, email:uid === 'u1' ? 'me@test.dev' : uid + '@test.dev', displayName:uid === 'u1' ? 'Me' : uid.toUpperCase(), metadata:{creationTime:'Mon, 01 Sep 2026 10:00:00 GMT', lastSignInTime:new Date().toUTCString()}, providerData:[{providerId:'google.com'}], delete(){ cur = null; tell(); return Promise.resolve(); }}; tell(); return Promise.resolve(); }, signOut(){ cur = null; tell(); return Promise.resolve(); },
      get currentUser(){ return cur; },
      createUserWithEmailAndPassword(email){ cur = {uid:'u9', email, displayName:'', emailVerified:false, providerData:[{providerId:'password'}], metadata:{},
        sendEmailVerification(){ window.__verifySent = (window.__verifySent || 0) + 1; return Promise.resolve(); }, reload(){ return Promise.resolve(); }, getIdToken(){ return Promise.resolve('t'); }}; tell(); return Promise.resolve({user:cur}); },
      signInWithEmailAndPassword(){ return Promise.reject(Object.assign(new Error('bad'), {code:'auth/invalid-credential'})); } });
    auth.GoogleAuthProvider = function(){};
    window.firebase = { initializeApp(){}, auth,
      // Collections like Firestore's, with the two Premium rules enforced: only the admin writes premium records,
      // and premium_content is readable only by the admin or an active Premium account.
      firestore: () => ({ collection: name => {
        const store = () => window.__fb[name] || (window.__fb[name] = {}), me = () => cur && cur.uid, admin = () => (window.FIREBASE_ADMINS || []).includes(me());
        const denied = () => Promise.reject(Object.assign(new Error('Missing or insufficient permissions.'), {code:'permission-denied'}));
        if (name === 'premium_content' && !window.__fb.premium_content) { window.__fb.premium_content = {main:{data:JSON.stringify(window.PREMIUM_INLINE), updatedAt:1}}; Object.entries(window.INTERVIEWS_INLINE || {}).forEach(([co, l]) => { window.__fb.premium_content['interviews-' + co] = {data:JSON.stringify(l), updatedAt:1}; }); }
        return { get: () => Promise.resolve({docs:Object.keys(store()).map(id => ({id, data: () => store()[id]}))}),
          doc: id => ({ get: () => {
              if (name === 'premium_content' && !admin() && !((window.__fb.premium || {})[me()] || {}).active) return denied();
              return Promise.resolve({exists: !!store()[id], data: () => store()[id]});
            },
            set: d => { if (name !== 'users' && !admin()) return denied(); store()[id] = d; return Promise.resolve(); },
            delete: () => { delete store()[id]; return Promise.resolve(); } }) };
      } }) };
  })();`;
[1, 2, 3, 4, 5, 6].forEach(p => {
  const pre = `<script>window.__PHASE=${p};${p === 2 ? seedAllUnlocked : p === 5 ? fakeFirebase : 'localStorage.clear();'}</script>\n`;
  const i = html.indexOf('<script>');
  fs.writeFileSync(path.join(outDir, `test${p}.html`), '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' +
    html.slice(0, i) + pre + html.slice(i) + '<script>' + test + '</script></body></html>');
});
fs.copyFileSync(path.join(__dirname, 'phone.html'), path.join(outDir, 'phone.html'));
