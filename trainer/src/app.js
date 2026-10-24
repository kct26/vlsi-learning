(function(){
'use strict';

// ---------- data ----------
const TOPICS = {1:'Electricity',2:'Capacitors & signals',3:'Heat',4:'Semiconductors',5:'MOSFETs',6:'Analog',7:'Binary & number formats',8:'CMOS gates',9:'Combinational logic',10:'Latches & flip-flops',11:'Timing',12:'Counters & FSMs',13:'Delay',14:'Power',15:'PVT & temperature',16:'Wires & links',17:'Manufacturing',18:'Memory circuits',19:'RTL & verification',20:'Architecture',21:'GPUs & number formats',22:'Computer arithmetic',23:'Programming & Linux'};
const DIFF = {E:'Easy', M:'Medium', H:'Hard'};
const ROMAN = ['I','II','III','IV','V','VI','VII','VIII'];
const BANK = RAW.map((r, i) => {
  const [id, d, q, ans, e, tags] = r, t = tags || '';
  const Q = {id, n:i + 1, ch:parseInt(id.slice(0, 2), 10), d, q, e, tags:t, oa:t.includes('o'), beyond:t.includes('b')};
  if (Array.isArray(ans)) { Q.k = 'm'; Q.o = ans; } else { Q.k = 't'; Q.a = ans; }
  Q.hay = (q + ' ' + (Q.o ? Q.o.join(' ') : '') + ' ' + e + ' ' + TOPICS[Q.ch]).toLowerCase();
  return Q;
});
const BY_ID = Object.fromEntries(BANK.map(q => [q.id, q]));
const CH_IDS = {};
BANK.forEach(q => (CH_IDS[q.ch] = CH_IDS[q.ch] || []).push(q.id));
const WEEK_N = 25, MOCK_N = 15, MOCK_MIN = 50, UNIT_N = 5, UNIT_PASS = 4;
const MUX_NAMES = {OR:'OR', AND:'AND', NOTA:'NOT A', NAND:'NAND', NOR:'NOR', XOR:'XOR'};

// Study lists: your OA, its topics, sources, and the skills NVIDIA's posting names.
const hasTag = (Q, t) => Q.tags.includes(t);
const oaish = Q => hasTag(Q, 'o') || hasTag(Q, 'v');
const OA_TOPICS = [
  {key:'oa-ff', name:'Flip-flop vs latch', ch:[10, 11], book:'Ch 10, 11'},
  {key:'oa-mux', name:'OR gate from a 2:1 mux', ch:[9], book:'Ch 9'},
  {key:'oa-inv', name:'Inverter with swapped supplies', ch:[5, 8], book:'Ch 5, 8'},
  {key:'oa-pow', name:'Dynamic power, f×2 and V×2', ch:[3, 14], book:'Ch 14'},
  {key:'oa-temp', name:'Mobility and wire resistance vs temperature', ch:[4, 15], book:'Ch 4, 15'},
  {key:'oa-ant', name:'Antenna rule', ch:[17], book:'Ch 17'}
];
// Topics other candidates reported online (the book's "Seen on the assessment" boxes), matched by chapter and keyword.
const REPORTED = [
  {name:'Ground (GND) connections', ch:1, kw:/ground|floating|return current/},
  {name:'Decoupling capacitors', ch:2, kw:/decoupling|esl|esr|bulk/},
  {name:'Heat sinks and cooling', ch:3, kw:/heat sink|fins|fan|paste|heat pipe|cold plate|water/},
  {name:'NMOS pass-transistor node voltages', ch:5, kw:/passes|pass transistor|weak 1|node x/},
  {name:'Bit masks and 4 KB pages', ch:7, kw:/mask|page/},
  {name:'XOR and XNOR chains', ch:9, kw:/chained/},
  {name:'Gate delays with rise and fall times', ch:9, kw:/rise delay|fall delay|rise 2 ns/},
  {name:'Flip-flops and latches from 2:1 muxes', ch:10, kw:/mux/},
  {name:'Shift-register hold timing', ch:11, kw:/shift register/},
  {name:'Retiming flip-flops on long wires', ch:11, kw:/ mm|retiming/},
  {name:'Counter size from measured periods', ch:12, kw:/most significant bit|top bit|its msb/},
  {name:'Clock dividers and duty cycle', ch:12, kw:/divide-by|duty/},
  {name:'Traffic-light FSM size', ch:12, kw:/traffic/},
  {name:'Dynamic power variants', ch:14, kw:/frequency|voltage (doubles|halves|rises)/},
  {name:'Power-gating efficiency', ch:14, kw:/power gated|gated with/},
  {name:'Crosstalk timing windows', ch:16, kw:/after the clock/},
  {name:'Read completion packets', ch:16, kw:/read starts|replies/},
  {name:'Blocking vs nonblocking and $display', ch:19, kw:/<=|blocking|\$display/},
  {name:'Glitch-filter buffers', ch:19, kw:/glitch/},
  {name:'FIFO design and depth', ch:19, kw:/fifo/},
  {name:'Five-stage pipeline', ch:20, kw:/pipeline|stage/}
];
const SKILLS = [
  {key:'sk-basics', name:'Hardware basics', ch:[1, 2, 7, 9]},
  {key:'sk-cmos', name:'CMOS transistors and circuits', ch:[4, 5, 6, 8]},
  {key:'sk-vlsi', name:'VLSI design', ch:[8, 13, 16, 17, 18]},
  {key:'sk-pd', name:'Physical design and timing', ch:[11, 13, 15, 16, 17]},
  {key:'sk-power', name:'Power', ch:[3, 14, 15]},
  {key:'sk-arch', name:'Computer architecture', ch:[18, 20, 21]},
  {key:'sk-arith', name:'Computer arithmetic', tag:'a'},
  {key:'sk-hdl', name:'Verilog and verification', ch:[10, 12, 19]},
  {key:'sk-gpu', name:'GPUs and CUDA', ch:[21]},
  {key:'sk-prog', name:'Programming, Linux and scripting', ch:[23]}
];
const LISTS = {
  'oa': {name:'Your OA questions', test:Q => hasTag(Q, 'o')},
  'oav': {name:'Your OA + variants', test:oaish},
  'rep': {name:'Reported online', test:Q => hasTag(Q, 'r')},
  'beyond': {name:'Beyond the book', test:Q => hasTag(Q, 'b')}
};
OA_TOPICS.forEach(t => { LISTS[t.key] = {name:'OA topic: ' + t.name, test:Q => oaish(Q) && t.ch.includes(Q.ch)}; });
SKILLS.forEach(s => { LISTS[s.key] = {name:'Skill: ' + s.name, test:Q => s.tag ? hasTag(Q, s.tag) : s.ch.includes(Q.ch)}; });
REPORTED.forEach((r, i) => { r.key = 'rp-' + i; LISTS[r.key] = {name:'Reported: ' + r.name, test:Q => Q.ch === r.ch && r.kw.test(Q.hay)}; });
const listIds = key => BANK.filter(LISTS[key].test).map(Q => Q.id);

// Review of the book and this trainer against NVIDIA's posting (read October 24, 2026).
const JD = {title:'NVIDIA 2027 Ignite Internships: Hardware Engineering', req:'JR2027047', url:'https://jobs.nvidia.com/careers/job/893397961094'};
const VERDICT = {strong:['Strong match', 'ok'], good:['Good match', 'ok'], partial:['Partial', 'warn'], none:['Not covered', 'bad'], na:['Not study material', '']};
const REVIEW = [
  {group:'What they need to see', items:[
    {req:'First- or second-year undergrad in EE, CE, CS, math or a related field, with the graduation month and year on the resume', v:'na', book:'Not applicable', list:null, todo:'This is eligibility and resume formatting. Put your expected graduation month and year near the top of your resume.'},
    {req:'Passion shown through clubs, leadership roles and projects', v:'partial', book:'Appendix D gives resume projects matched to the NVIDIA teams in this posting', list:null, todo:'Study material cannot show this on your resume. Finish one Appendix D project before applications open.'},
    {req:'Courses geared toward hardware basics', v:'strong', book:'Chapters 1–12 build hardware from zero; the Drexel course list maps them to classes', list:'sk-basics', todo:'Do Quests 1–12 in order, then keep up the weekly sets.'},
    {req:'Basic C, C++, Python, Perl or MATLAB', v:'good', book:'Chapter 23 covers C and Python basics. Linux, git, make, Tcl, Perl and MATLAB are taught here as beyond-the-book problems', list:'sk-prog', code:['C and C++', 'Python and MATLAB', 'Linux and scripting'], todo:'Do Quest 23 and the Coding tab. Keep solving one LeetCode-style linked-list or bit problem a week; your OA coding question was a linked list.'},
    {req:'Problem solving, adaptability, and the desire to learn new concepts and tools', v:'good', book:'Chapter 24 (aptitude and puzzles) and Chapter 25 (a full practice assessment)', list:null, todo:'Weekly sets and the timed mock build this habit.'}
  ]},
  {group:'Ways to stand out', items:[
    {req:'Understanding of CMOS transistors and circuits', v:'strong', book:'Chapters 4, 5, 6 and 8', list:'sk-cmos', todo:'Most of your OA questions came from here. Keep the swapped-inverter and pass-transistor sets at 100%.'},
    {req:'Understanding of VLSI design', v:'strong', book:'Chapters 8, 13, 16, 17 and 18 (gates, delay, wires, manufacturing, memory)', list:'sk-vlsi', todo:'Deeper topics (DIBL, subthreshold slope, CRPR, keepers) are in the trainer as beyond-the-book problems.'},
    {req:'Understanding of computer architecture', v:'good', book:'Chapters 18, 20 and 21 (memory, pipelines, caches, GPUs)', list:'sk-arch', todo:'Out-of-order execution and register renaming appear only as beyond-the-book problems.'},
    {req:'Understanding of computer arithmetic', v:'strong', book:'Chapter 22: overflow and saturation, shifters, fast and carry-save adders, multipliers and Booth recoding, division, fixed point, floating-point addition, multiplication and rounding. Number formats in Chapters 7 and 21', list:'sk-arith', todo:'Do Quest 22, then build the BF16 processing element of Appendix D Project 2 and check it against a reference model.'},
    {req:'Basic Verilog, SystemVerilog or VHDL', v:'good', book:'Chapter 19: Verilog, SystemVerilog, CDC, FIFOs, and a verification section (self-checking testbenches, constrained-random tests, assertions, coverage, formal, UVM). VHDL is not taught', list:'sk-hdl', code:['RTL design', 'Verification'], todo:'Solve the Coding tab\'s RTL problems (judged in the browser) and its verification problems (run them in Icarus Verilog or EDA Playground). VHDL is easy to pick up once Verilog is solid.'},
    {req:'Background in CUDA or OpenCL', v:'good', book:'Chapter 21 (CUDA model, warps, memory hierarchy); OpenCL is only named', list:'sk-gpu', code:['GPU and CUDA'], todo:'Do the Coding tab\'s CUDA problems on a real GPU (Google Colab works), then the Appendix D CUDA project.'},
    {req:'Initiative in AI, machine learning, computer vision, robotics or parallel computing', v:'partial', book:'Chapters 20–21 cover parallelism and AI hardware (tensor cores, low-precision formats, roofline). Machine learning itself, vision and robotics are not covered', list:'sk-gpu', todo:'Show this with a project rather than a quiz.'},
    {req:'Basic mechanical CAD (CATIA, Siemens NX, SolidWorks, Creo)', v:'none', book:'Not taught. Appendix D Project 7 suggests a heat-sink design in SolidWorks or Onshape, sized with Chapter 3', list:null, todo:'This matters for mechanical and thermal teams, not for the OA. Do Project 7 only if those teams interest you.'},
    {req:'Looking for a first industry internship', v:'na', book:'Not applicable', list:null, todo:'Eligibility, not study material.'}
  ]}
];
// NVIDIA hardware roles beyond Ignite, with the quests and coding track that prepare for each.
const ROLES = [
  {name:'ASIC Design (RTL)', fit:'Strong', ch:[9, 10, 11, 12, 19, 22], code:'RTL design', add:'Write RTL every week and build the Appendix D processor and systolic-array projects.'},
  {name:'ASIC / GPU Verification', fit:'Good', ch:[19, 12, 10], code:'Verification', add:'Real SystemVerilog testbenches, assertions and coverage, then UVM or cocotb; verify your own projects.'},
  {name:'Physical Design and Timing', fit:'Good', ch:[11, 13, 15, 16, 17], code:'Physical design', add:'Run an open flow (OpenLane/OpenROAD or Tiny Tapeout) and read its timing reports; script in Tcl.'},
  {name:'Power Architect / Power and Thermal', fit:'Strong', ch:[3, 14, 15], code:'Python and MATLAB', add:'Measure GPU power and fit it to the power model (Appendix D Project 6); analyze data in Python.'},
  {name:'GPU / Hardware Architecture and Performance', fit:'Good', ch:[18, 20, 21], code:'GPU and CUDA', add:'Build performance models in C++ or Python and optimize CUDA kernels (Appendix D Project 4).'},
  {name:'Hardware / CPU Infrastructure', fit:'Good', ch:[20, 23], code:'Linux and scripting', add:'Automate flows with Python, Perl and Linux tools; learn job schedulers and regression systems.'},
  {name:'Firmware and Embedded C', fit:'Good', ch:[7, 20, 23], code:'C and C++', add:'Write drivers for a microcontroller or FPGA soft core: registers, interrupts and ring buffers.'},
  {name:'Circuit Design (custom, SRAM, SerDes)', fit:'Medium', ch:[5, 6, 8, 18], code:null, add:'Deeper analog design (Razavi) and SPICE simulation (Appendix D Project 5).'},
  {name:'DFT (Design for Test)', fit:'Medium', ch:[17, 10], code:'RTL design', add:'Scan insertion, ATPG and memory BIST in depth.'},
  {name:'Signal / Power Integrity and Boards', fit:'Medium', ch:[2, 16], code:'Python and MATLAB', add:'PCB design (KiCad), SI/PI simulation and lab measurements with an oscilloscope.'},
  {name:'Mechanical / Thermal', fit:'Light', ch:[3], code:null, add:'CAD and thermal simulation (Appendix D Project 7).'}
];
const AREAS = [
  {name:'AI Developer Technology', ch:[20, 21, 22]},
  {name:'ASIC Physical Design and Timing', ch:[11, 13, 15, 16, 17]},
  {name:'GPU Verification and Design', ch:[10, 12, 19, 21, 22]},
  {name:'Hardware ASIC', ch:[8, 9, 10, 11, 14, 19, 22]},
  {name:'Hardware CPU Infrastructure', ch:[18, 20]},
  {name:'Hardware Infrastructure Content/Performance', ch:[20, 21]},
  {name:'Power Architect', ch:[3, 14, 15]}
];

// ---------- helpers ----------
const $ = (s, r) => (r || document).querySelector(s);
function hashStr(s){ let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rngFrom(seed){ let a = hashStr(String(seed)); return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffle(arr, rnd){ const a = arr.slice(), r = rnd || Math.random; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function isCorrect(Q, c){ return Q.k === 'm' ? c === 0 : c === Q.a; }
function choiceText(Q, c){ return Q.k === 'm' ? Q.o[c] : (c ? 'True' : 'False'); }
function correctText(Q){ return Q.k === 'm' ? Q.o[0] : (Q.a ? 'True' : 'False'); }
function dayStr(ts){ return new Date(ts).toLocaleDateString(undefined, {month:'short', day:'numeric'}); }
function pct(a, b){ return b ? (a / b * 100).toFixed(1) : '0'; }
function isoWeek(d){
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const num = Math.ceil(((t - y0) / 864e5 + 1) / 7);
  const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  return {key:t.getUTCFullYear() + '-W' + String(num).padStart(2, '0'), num, mon};
}
const ICON = {
  solved:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  attempted:'<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-dasharray="3 2.4"/></svg>',
  wrong:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  lock:'<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="7" width="9" height="6.5" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5.5 7V5.2a2.5 2.5 0 015 0V7" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  flag:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 14V2.5M4 3h7.5l-1.8 2.7L11.5 8.5H4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>'
};
function ring(frac, size, stroke, label){
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, frac));
  return `<svg class="ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${esc(label)}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bg" stroke-width="${stroke}"/>` +
    `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fg" stroke-width="${stroke}" stroke-dasharray="${(c * f).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`;
}

// ---------- state and saving ----------
const LS_KEY = 'ground-up-trainer-v1';
const emptyState = () => ({v:2, updatedAt:0, q:{}, weeks:{}, hist:[], learn:{cards:{}, units:{}, mux:{}}, code:{}, codeWeek:null});
function normalize(s){
  const e = emptyState();
  if (!s || typeof s !== 'object') return e;
  e.updatedAt = +s.updatedAt || 0;
  if (s.q && typeof s.q === 'object') e.q = s.q;
  if (s.weeks && typeof s.weeks === 'object') e.weeks = s.weeks;
  if (Array.isArray(s.hist)) e.hist = s.hist;
  const l = s.learn || {};
  e.learn = {cards:l.cards || {}, units:l.units || {}, mux:l.mux || {}};
  if (s.code && typeof s.code === 'object') e.code = s.code;
  if (s.codeWeek && s.codeWeek.wk) e.codeWeek = s.codeWeek;
  return e;
}
let state = emptyState();
const store = {mode:'local', ref:null, chain:Promise.resolve(), timer:null, status:'Saved in this browser'};
function lsLoad(){ try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function lsSave(){ try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ } }
function setSync(text){ store.status = text; const el = $('#sync'); if (el) { el.textContent = text; el.title = text; } }
function save(){
  state.updatedAt = Date.now();
  lsSave();
  if (store.mode === 'db') { clearTimeout(store.timer); setSync('Saving…'); store.timer = setTimeout(flush, 700); }
  else if (store.mode === 'cloud') { clearTimeout(acct.timer); setSync('Saving…'); acct.timer = setTimeout(cloudFlush, 800); }
}
const FATAL = ['invalid_argument', 'quota_exceeded', 'not_granted', 'revoked', 'capability_disabled'];
function flush(attempt){
  if (store.mode !== 'db') return;
  attempt = attempt || 0;
  const body = JSON.parse(JSON.stringify(state));
  store.chain = store.chain.then(() => store.ref.set(body)).then(() => setSync('Saved to your account')).catch(err => {
    const code = err && err.code;
    if (FATAL.indexOf(code) >= 0) { store.mode = 'local'; setSync('Saved in this browser'); }
    else if (attempt < 2) { setSync('Saving…'); setTimeout(() => flush(attempt + 1), 2500 * (attempt + 1) + Math.random() * 1000); }
    else setSync('Saved in this browser for now');
  });
}
async function initStore(){
  try {
    if (!(window.claude && typeof window.claude.use === 'function')) return;
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    if (!db || !user) return;
    const id = await user.id();
    if (!id) return;
    const ref = db.doc('data/users/' + id + '/trainer');
    const snap = await ref.get();
    store.ref = ref; store.mode = 'db';
    if (snap.exists) {
      const remote = normalize(JSON.parse(JSON.stringify(snap.data())));
      if (remote.updatedAt >= state.updatedAt) { state = remote; lsSave(); render(); }
      else flush();
    } else if (state.updatedAt) flush();
    setSync('Saved to your account');
  } catch (e) { store.mode = 'local'; setSync('Saved in this browser'); }
}

// Combines two progress records so nothing is lost when a second device or a backup file joins.
function mergeStates(a, b){
  const m = normalize(JSON.parse(JSON.stringify(a))), o = normalize(b);
  Object.keys(o.q).forEach(id => {
    const x = m.q[id], y = o.q[id];
    m.q[id] = !x ? y : {n:Math.max(x.n, y.n), c:Math.max(x.c, y.c), ok:y.at > x.at ? y.ok : x.ok, at:Math.max(x.at, y.at)};
  });
  Object.keys(o.weeks).forEach(k => {
    const x = m.weeks[k], y = o.weeks[k], size = w => Object.keys(w.ans || {}).length;
    if (!x || (!x.done && (y.done || size(y) > size(x)))) m.weeks[k] = y;
  });
  const seen = new Set();
  m.hist = [...m.hist, ...o.hist].sort((h1, h2) => h2.at - h1.at).filter(h => { const k = h.at + '|' + h.label; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 60);
  Object.keys(o.learn.cards).forEach(k => { if (!m.learn.cards[k]) m.learn.cards[k] = o.learn.cards[k]; });
  Object.keys(o.learn.mux).forEach(k => { if (!m.learn.mux[k]) m.learn.mux[k] = o.learn.mux[k]; });
  Object.keys(o.learn.units).forEach(k => {
    const x = m.learn.units[k] || {}, y = o.learn.units[k];
    m.learn.units[k] = {best:Math.max(x.best || 0, y.best || 0), passed:x.passed || y.passed || 0};
  });
  Object.keys(o.code).forEach(id => {
    const x = m.code[id], y = o.code[id];
    const subs = {};
    (x ? x.subs || [] : []).concat(y.subs || []).forEach(u => { subs[u.at] = u; });
    m.code[id] = !x ? y : {src:(y.at || 0) > (x.at || 0) ? y.src : x.src, solved:x.solved || y.solved || 0, at:Math.max(x.at || 0, y.at || 0)};
    if (x && Object.keys(subs).length) m.code[id].subs = Object.values(subs).sort((u, w) => u.at - w.at).slice(-20);
  });
  m.updatedAt = Math.max(m.updatedAt, o.updatedAt);
  return m;
}

// ---------- accounts on the standalone site (optional Google sign-in through Firebase) ----------
// Turned on by docs/firebase-config.js; the Claude-hosted version saves to the Claude account instead.
const STANDALONE = !window.claude;
const FB_VERSION = '10.12.2';
const acct = {ready:false, user:null, ref:null, timer:null, chain:Promise.resolve()};
function loadScript(src){ return new Promise((resolve, reject) => { const s = document.createElement('script'); s.src = src; s.onload = resolve; s.onerror = () => reject(new Error('Could not load ' + src)); document.head.appendChild(s); }); }
async function initAccounts(){
  if (!STANDALONE || !window.FIREBASE_CONFIG) return;
  try {
    if (!window.firebase) for (const m of ['app', 'auth', 'firestore']) await loadScript(`https://www.gstatic.com/firebasejs/${FB_VERSION}/firebase-${m}-compat.js`);
    firebase.initializeApp(window.FIREBASE_CONFIG);
    acct.ready = true;
    firebase.auth().onAuthStateChanged(onAuth);
  } catch (e) { acct.ready = false; }
  renderAccount();
}
async function onAuth(user){
  acct.user = user || null; acct.ref = null;
  if (!user) { store.mode = 'local'; setSync('Saved in this browser'); renderAccount(); if (ui.tab === 'weekly' && ui.view === 'tab') render(); return; }
  setSync('Syncing…');
  try {
    const ref = firebase.firestore().collection('users').doc(user.uid);
    const snap = await ref.get();
    if (snap.exists && snap.data().state) state = mergeStates(state, JSON.parse(snap.data().state));
    acct.ref = ref; store.mode = 'cloud';
    lsSave(); render(); cloudFlush();
  } catch (e) { store.mode = 'local'; setSync('Could not reach your account; saved in this browser'); }
  renderAccount();
}
function cloudFlush(){
  if (store.mode !== 'cloud' || !acct.ref) return;
  const body = {state:JSON.stringify(state), updatedAt:state.updatedAt || Date.now()};
  acct.chain = acct.chain.then(() => acct.ref.set(body)).then(() => setSync('Saved to your account'))
    .catch(() => { setSync('Saving failed; will retry'); clearTimeout(acct.timer); acct.timer = setTimeout(cloudFlush, 5000); });
}
function signIn(){
  firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(e => {
    const code = (e && e.code) || '';
    if (code === 'auth/unauthorized-domain') toast('Sign-in is not allowed on this address yet. Add it under Authentication → Settings → Authorized domains in Firebase.');
    else if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') toast('Sign-in failed: ' + (e.message || code));
  });
}
function renderAccount(){
  const el = $('#acct'); if (!el) return;
  if (!acct.ready) { el.innerHTML = ''; return; }
  const u = acct.user;
  el.innerHTML = u ? `<button type="button" class="avatar" data-act="to-progress" title="Signed in as ${esc(u.email || u.displayName || 'you')}" aria-label="Your account">${esc(((u.displayName || u.email || '?')[0] || '?').toUpperCase())}</button>`
    : '<button type="button" class="acctbtn" data-act="signin">Sign in</button>';
}

// ---------- backup file ----------
function exportProgress(){
  const blob = new Blob([JSON.stringify(state, null, 1)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ground-up-progress-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
async function importProgress(file){
  try {
    const data = JSON.parse(await file.text());
    if (!data || typeof data !== 'object' || !data.q) throw new Error('not a progress file');
    state = mergeStates(state, data);
    save(); render();
    toast('Progress imported and merged');
  } catch (e) { toast('That file is not a Ground Up progress file.'); }
}

// ---------- progress ----------
const statusOf = id => { const s = state.q[id]; return !s ? 'todo' : (s.c > 0 ? 'solved' : 'attempted'); };
const isSolved = id => statusOf(id) === 'solved';
const solvedIn = ids => ids.filter(isSolved).length;
function record(Q, choice){
  const ok = isCorrect(Q, choice);
  const s = state.q[Q.id] || (state.q[Q.id] = {n:0, c:0, ok:false, at:0});
  s.n++; if (ok) s.c++; s.ok = ok; s.at = Date.now();
  return ok;
}
function unitPassed(u){ return !!(state.learn.units[u] && state.learn.units[u].passed); }
function unitUnlocked(u){ return u === 1 || unitPassed(u - 1) || unitPassed(u); }
function cardsDone(U){ return U.cards.filter((c, i) => state.learn.cards['u' + U.id + 'c' + i]).length; }
function nextUnit(){ return UNITS.find(U => !unitPassed(U.id) && unitUnlocked(U.id)); }
function toast(text){
  const box = $('#toasts'); if (!box) return;
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = text;
  box.appendChild(t);
  setTimeout(() => t.remove(), 4200);
}

// ---------- UI state ----------
const TABS = ['quest', 'problems', 'coding', 'weekly', 'jobs'];
const blankFilters = () => ({q:'', ch:'all', d:'all', status:'all', type:'all', list:'all'});
const ui = {tab:'quest', view:'tab', session:null, unit:null, pv:null, back:null, cardPick:{}, cardPerm:{}, f:blankFilters(), confirmReset:false, timer:null, cf:null, cp:null, cback:null, codeTimer:null};
function setHash(h){ try { history.replaceState(null, '', '#' + h); } catch (e) { /* ignore */ } }
function goTab(t){
  saveEditorNow();
  ui.tab = t; ui.view = 'tab'; stopTimer(); setHash(t);
  render(); window.scrollTo(0, 0);
}

// ---------- shared pieces ----------
function renderHeader(){
  const solved = solvedIn(BANK.map(Q => Q.id));
  const cs = codeSolvedIn(CODING);
  $('#solved').innerHTML = ring(solved / BANK.length, 22, 3.5, `${solved} of ${BANK.length} solved`) + `<span><b>${solved}</b><span class="muted">/${BANK.length}</span> solved</span>` +
    `<span class="codecount"><b>${cs}</b><span class="muted">/${CODING.length}</span> code</span>`;
  document.querySelectorAll('.navlinks button').forEach(b => b.setAttribute('aria-current', b.dataset.tab === ui.tab && ui.view === 'tab' ? 'page' : 'false'));
}
function statusCell(id){
  const s = statusOf(id);
  return s === 'solved' ? `<span class="st solved" title="Solved">${ICON.solved}</span>` : s === 'attempted' ? `<span class="st attempted" title="Attempted">${ICON.attempted}</span>` : '<span class="st todo" title="Not tried"></span>';
}
function tagChips(Q){
  let h = '';
  if (hasTag(Q, 'o')) h += '<span class="tag t-oa">Your OA</span>';
  else if (hasTag(Q, 'v')) h += '<span class="tag t-var">OA variant</span>';
  if (hasTag(Q, 'r')) h += '<span class="tag t-rep">Reported</span>';
  if (hasTag(Q, 'b')) h += '<span class="tag t-bey">Beyond the book</span>';
  return h;
}
function rowsHTML(ids, cols){
  return ids.map(id => {
    const Q = BY_ID[id];
    return `<tr data-open="${id}"><td class="c-st">${statusCell(id)}</td><td class="c-ti"><a href="#p${Q.n}" data-open="${id}" title="${esc(Q.q)}">${Q.n}. ${esc(Q.q)}</a><span class="tags">${tagChips(Q)}</span></td>` +
      (cols === 'compact' ? '' : `<td class="c-tp">${esc(TOPICS[Q.ch])}</td><td class="c-ty">${Q.k === 'm' ? 'MCQ' : 'T/F'}</td>`) +
      `<td class="c-df d-${Q.d}">${DIFF[Q.d]}</td></tr>`;
  }).join('');
}
function tableHTML(ids, cols, bodyId){
  const head = cols === 'compact' ? '<th class="c-st">Status</th><th class="c-ti">Problem</th><th class="c-df">Difficulty</th>' :
    '<th class="c-st">Status</th><th class="c-ti">Problem</th><th class="c-tp">Topic</th><th class="c-ty">Type</th><th class="c-df">Difficulty</th>';
  return `<div class="tablewrap"><table class="ptable${cols === 'compact' ? ' compact' : ''}"><thead><tr>${head}</tr></thead><tbody${bodyId ? ` id="${bodyId}"` : ''}>${rowsHTML(ids, cols)}</tbody></table></div>`;
}
function optsHTML(Q, perm, chosen, reveal, scope){
  const items = Q.k === 'm' ? perm.map(p => ({val:p, code:String(p), text:Q.o[p]})) : [{val:true, code:'T', text:'True'}, {val:false, code:'F', text:'False'}];
  return `<div class="opts" role="radiogroup" data-scope="${scope}">` + items.map((it, j) => {
    let cls = 'opt';
    const sel = chosen === it.val;
    if (sel) cls += ' sel';
    if (reveal) { if (isCorrect(Q, it.val)) cls += ' right'; else if (sel) cls += ' wrong'; }
    return `<button type="button" class="${cls}" role="radio" aria-checked="${sel}" data-pick="${it.code}"${reveal ? ' disabled' : ''}><span class="key">${'ABCD'[j]}</span><span>${esc(it.text)}</span></button>`;
  }).join('') + '</div>';
}
function parsePick(code){ return code === 'T' ? true : (code === 'F' ? false : parseInt(code, 10)); }
function taughtLine(Q){ return Q.beyond ? 'Beyond the book: this explanation is the lesson.' : `Taught in Chapter ${Q.ch} (${esc(TOPICS[Q.ch])}) of Hardware from the Ground Up.`; }
function verdictHTML(Q, chosen){
  const ok = isCorrect(Q, chosen);
  return `<div class="verdict ${ok ? 'ok' : 'bad'}" role="status"><b>${ok ? 'Accepted' : 'Wrong Answer'}</b>${ok ? '' : `<span>Correct answer: ${esc(correctText(Q))}</span>`}</div>` +
    `<div class="sol"><p>${esc(Q.e)}</p><small>${taughtLine(Q)}</small></div>`;
}

function render(){
  renderHeader();
  const m = $('#main');
  m.className = 'wrap main' + ((ui.view === 'tab' && (ui.tab === 'problems' || ui.tab === 'coding')) || ui.view === 'code' ? ' wide' : '');
  if (ui.view === 'quiz') { m.innerHTML = viewQuiz(); updateTimer(); }
  else if (ui.view === 'results') m.innerHTML = viewResults();
  else if (ui.view === 'unit') { m.innerHTML = viewUnit(); afterUnitRender(); }
  else if (ui.view === 'problem') m.innerHTML = viewProblem();
  else if (ui.view === 'code') m.innerHTML = viewCode();
  else if (ui.tab === 'coding') m.innerHTML = viewCoding();
  else if (ui.tab === 'quest') m.innerHTML = viewQuest();
  else if (ui.tab === 'problems') m.innerHTML = viewProblems();
  else if (ui.tab === 'weekly') m.innerHTML = viewWeekly();
  else m.innerHTML = viewJobs();
}

// ---------- Quest map ----------
function viewQuest(){
  const done = UNITS.filter(U => unitPassed(U.id)).length, nu = nextUnit();
  let html = `<section class="card hero"><div><p class="eyebrow">Quest map</p><h1>Learn hardware one quest at a time</h1>
    <p class="muted">Each quest follows one chapter of <em>Hardware from the Ground Up</em>: short lessons with hands-on widgets, then a 5-problem checkpoint. Get 4 right to unlock the next quest, or test out of one you already know.</p>
    ${nu ? `<div class="row"><button type="button" class="btn primary" data-act="open-unit" data-u="${nu.id}">${cardsDone(nu) ? 'Continue' : 'Start'}: Quest ${nu.id} · ${esc(nu.title)}</button></div>` : '<p><b>Every quest is complete.</b> Keep your weekly sets going.</p>'}</div>
    <div class="herostat">${ring(done / UNITS.length, 88, 8, `${done} of ${UNITS.length} quests complete`)}<div><b>${done}<span class="muted">/${UNITS.length}</span></b><span>quests complete</span></div></div></section>`;
  PARTS.forEach(p => {
    const pd = p.units.filter(unitPassed).length;
    html += `<section class="realm"><header class="realmhead"><div><span class="eyebrow">Part ${ROMAN[p.n - 1]}</span><h2>${esc(p.name)}</h2></div><span class="pill${pd === p.units.length ? ' ok' : ''}">${pd}/${p.units.length} complete</span></header><ol class="path">`;
    p.units.forEach(uid => {
      const U = UNITS[uid - 1], passed = unitPassed(uid), open = unitUnlocked(uid), cd = cardsDone(U), cur = nu && nu.id === uid;
      const ids = CH_IDS[uid], sv = solvedIn(ids);
      const cls = passed ? 'done' : (open ? (cur ? 'current' : 'open') : 'locked');
      const orb = passed ? ICON.solved : (open ? `<span>${uid}</span>` : ICON.lock);
      html += `<li class="node ${cls}"><button type="button" class="nodebtn" data-act="open-unit" data-u="${uid}"><span class="orb">${orb}</span>
        <span class="nlabel"><span class="nnum">QUEST ${String(uid).padStart(2, '0')}${cur ? ' · UP NEXT' : ''}</span><b>${esc(U.title)}</b>
        <small>Lessons ${cd}/${U.cards.length} · Checkpoint ${passed ? 'passed' : 'not yet'} · ${sv}/${ids.length} solved</small></span></button></li>`;
    });
    html += '</ol></section>';
  });
  return html;
}

function openUnit(id){
  const U = UNITS[id - 1];
  let step = U.cards.findIndex((c, i) => !state.learn.cards['u' + id + 'c' + i]);
  if (step < 0) step = unitPassed(id) ? 0 : U.cards.length;
  ui.unit = {id, step}; ui.view = 'unit'; setHash('quest'); render(); window.scrollTo(0, 0);
}
function maxStep(U){ const i = U.cards.findIndex((c, k) => !state.learn.cards['u' + U.id + 'c' + k]); return i < 0 ? U.cards.length : i; }

function viewUnit(){
  const U = UNITS[ui.unit.id - 1], step = ui.unit.step, n = U.cards.length, open = unitUnlocked(U.id);
  const part = PARTS.find(p => p.units.includes(U.id)), ms = maxStep(U), best = state.learn.units[U.id] && state.learn.units[U.id].best;
  const ids = CH_IDS[U.id], sv = solvedIn(ids);
  let html = `<div class="unitv"><nav class="crumbs" aria-label="Breadcrumb"><button type="button" class="linkbtn" data-act="to-quest">Quest map</button><span>/</span><span>Part ${ROMAN[part.n - 1]}</span><span>/</span><span>Quest ${U.id}</span></nav>
    <header class="unithead"><div><p class="eyebrow">Quest ${String(U.id).padStart(2, '0')} · Chapter ${U.id}</p><h1>${esc(U.title)}</h1><p class="muted">${esc(U.goal)}</p></div>
    <dl class="ustats"><div><dt>Lessons</dt><dd>${cardsDone(U)}/${n}</dd></div><div><dt>Checkpoint</dt><dd>${unitPassed(U.id) ? 'Passed' : (best !== undefined ? `Best ${best}/${UNIT_N}` : 'Not yet')}</dd></div><div><dt>Solved</dt><dd>${sv}/${ids.length}</dd></div></dl></header>`;
  if (!open) {
    html += `<section class="card locked"><div class="lockline">${ICON.lock}<div><h2>Quest ${U.id} is locked</h2><p class="muted">Pass Quest ${U.id - 1}'s checkpoint to unlock it, or test out now: get ${UNIT_PASS} of ${UNIT_N} problems from Chapter ${U.id} right.</p></div></div>
      <div class="row"><button type="button" class="btn primary" data-act="unit-quiz" data-u="${U.id}">Test out of Quest ${U.id}</button><button type="button" class="btn" data-act="open-unit" data-u="${U.id - 1}">Go to Quest ${U.id - 1}</button></div></section>`;
  } else {
    html += '<ol class="steps" aria-label="Quest steps">' + U.cards.map((c, i) => {
      const done = !!state.learn.cards['u' + U.id + 'c' + i];
      return `<li><button type="button" class="step${done ? ' done' : ''}${i === step ? ' cur' : ''}" data-act="step" data-i="${i}"${i > ms ? ' disabled' : ''} aria-label="Lesson ${i + 1}${done ? ', done' : ''}">${done ? ICON.solved : i + 1}</button></li>`;
    }).join('') + `<li><button type="button" class="step check${unitPassed(U.id) ? ' done' : ''}${step === n ? ' cur' : ''}" data-act="step" data-i="${n}"${ms < n ? ' disabled' : ''} aria-label="Checkpoint">${unitPassed(U.id) ? ICON.solved : ICON.flag}</button></li></ol>`;
    if (step < n) {
      const c = U.cards[step], key = 'u' + U.id + 'c' + step;
      html += `<section class="card lessoncard"><p class="eyebrow">Lesson ${step + 1} of ${n}</p><h2>${esc(c.t)}</h2><div class="body">${c.b.map(p => `<p>${esc(p)}</p>`).join('')}</div>
        ${c.w ? '<div class="widget"><span class="wlabel">Try it</span><div id="widget-host"></div></div>' : ''}
        ${c.q ? '<div id="card-check"></div>' : ''}
        <div class="row between"><button type="button" class="btn" data-act="card-prev" ${step === 0 ? 'disabled' : ''}>Back</button>
        <button type="button" class="btn primary" id="card-next" data-act="card-next" data-key="${key}">${step === n - 1 ? 'Go to checkpoint' : 'Next lesson'}</button></div></section>`;
    } else {
      html += `<section class="card"><p class="eyebrow">Checkpoint</p><h2>${unitPassed(U.id) ? 'Quest complete' : 'Ready for the checkpoint?'}</h2>
        <p>${UNIT_N} problems from Chapter ${U.id}, with feedback after each. Get ${UNIT_PASS} or more right to complete the quest${U.id < UNITS.length ? ' and unlock Quest ' + (U.id + 1) : ''}.${best !== undefined ? ` Your best so far: ${best}/${UNIT_N}.` : ''}</p>
        <div class="row"><button type="button" class="btn primary" data-act="unit-quiz" data-u="${U.id}">${best !== undefined ? 'Take it again' : 'Start the checkpoint'}</button><button type="button" class="btn" data-act="card-prev">Back to the lessons</button></div></section>`;
    }
  }
  html += `<section class="card"><div class="row between"><div><h2>Problems in this quest</h2><p class="muted">${sv} of ${ids.length} solved</p></div><button type="button" class="btn" data-act="topic" data-ch="${U.id}">Practice 10</button></div>${tableHTML(ids, 'compact')}</section>`;
  return html + '</div>';
}
function afterUnitRender(){
  const U = UNITS[ui.unit.id - 1], step = ui.unit.step;
  if (!unitUnlocked(U.id) || step >= U.cards.length) return;
  const c = U.cards[step], host = $('#widget-host');
  if (host && c.w) mountWidget(host, c.w, {
    onSolve: t => { if (!state.learn.mux[t]) { state.learn.mux[t] = Date.now(); toast('Mux builder: ' + MUX_NAMES[t] + ' solved'); save(); } },
    solved: () => state.learn.mux
  });
  if (c.q) renderCardCheck();
}
function renderCardCheck(){
  const U = UNITS[ui.unit.id - 1], step = ui.unit.step, c = U.cards[step], key = 'u' + U.id + 'c' + step, Q = BY_ID[c.q];
  if (!ui.cardPerm[key]) ui.cardPerm[key] = shuffle([0, 1, 2, 3]);
  const chosen = ui.cardPick[key], answered = chosen !== undefined;
  $('#card-check').innerHTML = `<div class="qcard inline"><div class="qmeta"><span class="eyebrow">Quick check</span><span class="mono">#${Q.n}</span><span class="d-${Q.d}">${DIFF[Q.d]}</span>${tagChips(Q)}</div>
    <p class="qtext">${esc(Q.q)}</p>${optsHTML(Q, ui.cardPerm[key], chosen, answered, 'card')}${answered ? verdictHTML(Q, chosen) : ''}</div>`;
  const locked = !answered && !state.learn.cards[key], nb = $('#card-next');
  if (nb) { nb.disabled = locked; nb.title = locked ? 'Answer the quick check first' : ''; }
}

// ---------- Problems list ----------
function filtered(){
  const f = ui.f, term = f.q.trim().toLowerCase(), L = LISTS[f.list];
  return BANK.filter(Q => (f.ch === 'all' || Q.ch === +f.ch) && (f.d === 'all' || Q.d === f.d) && (f.type === 'all' || Q.k === f.type) &&
    (f.status === 'all' || statusOf(Q.id) === f.status) && (!L || L.test(Q)) && (!term || Q.hay.indexOf(term) >= 0));
}
function sel(id, label, cur, opts){ return `<select id="${id}" aria-label="${label}">${opts.map(o => `<option value="${o[0]}"${cur === o[0] ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`; }
function viewProblems(){
  const f = ui.f, list = filtered(), all = BANK.map(Q => Q.id), solved = solvedIn(all);
  const chips = `<button type="button" class="tchip${f.ch === 'all' ? ' on' : ''}" data-act="f-ch" data-v="all">All topics <span>${BANK.length}</span></button>` +
    Object.keys(TOPICS).map(c => `<button type="button" class="tchip${f.ch === c ? ' on' : ''}" data-act="f-ch" data-v="${c}">${esc(TOPICS[c])} <span>${CH_IDS[c].length}</span></button>`).join('');
  const listOpts = [['all', 'All problems'], ...['oa', 'oav', 'rep', 'beyond'].map(k => [k, LISTS[k].name]), ...OA_TOPICS.map(t => [t.key, LISTS[t.key].name]), ...SKILLS.map(s => [s.key, LISTS[s.key].name]), ...REPORTED.map(r => [r.key, LISTS[r.key].name])];
  const byD = d => { const ids = BANK.filter(Q => Q.d === d).map(Q => Q.id); return [solvedIn(ids), ids.length]; };
  const attempted = all.filter(id => statusOf(id) === 'attempted').length;
  const studyBtn = (key, label) => { const ids = listIds(key); return `<button type="button" class="slist${f.list === key ? ' on' : ''}" data-act="f-list" data-v="${key}"><span>${esc(label)}</span><span class="mono">${solvedIn(ids)}/${ids.length}</span></button>`; };
  return `<div class="pgrid"><section class="pmain">
    <div class="chiprow" role="toolbar" aria-label="Filter by topic">${chips}</div>
    <div class="fbar">
      <input type="search" id="f-q" placeholder="Search problems" value="${esc(f.q)}" aria-label="Search problems">
      ${sel('f-d', 'Difficulty', f.d, [['all', 'Difficulty'], ['E', 'Easy'], ['M', 'Medium'], ['H', 'Hard']])}
      ${sel('f-status', 'Status', f.status, [['all', 'Status'], ['todo', 'Todo'], ['solved', 'Solved'], ['attempted', 'Attempted']])}
      ${sel('f-type', 'Type', f.type, [['all', 'Type'], ['m', 'Multiple choice'], ['t', 'True / false']])}
      ${sel('f-list', 'List', f.list, listOpts)}
      <div class="fbtns"><button type="button" class="btn small ghost" data-act="f-reset">Reset</button><button type="button" class="btn small primary" id="pick-one" data-act="pick-one"${list.length ? '' : ' disabled'}>Pick one</button></div>
    </div>
    <p class="fcount" id="f-count">${countLine(list)}</p>
    ${tableHTML(list.map(Q => Q.id), 'full', 'prows')}
  </section>
  <aside class="pside">
    <section class="card progcard"><h2>Progress</h2><div class="progring">${ring(solved / BANK.length, 120, 9, `${solved} of ${BANK.length} solved`)}<div class="ringlabel"><b>${solved}</b><span>/${BANK.length}</span><small>Solved</small></div></div>
      <div class="dbars">${['E', 'M', 'H'].map(d => { const [s, t] = byD(d); return `<div class="dbar"><span class="d-${d}">${DIFF[d]}</span><span class="mono">${s}/${t}</span><i class="bar d-${d}"><b style="width:${pct(s, t)}%"></b></i></div>`; }).join('')}</div>
      <p class="muted small">${attempted} attempted, not solved yet</p></section>
    <section class="card studycard"><h2>Study lists</h2><div class="slists">
      ${studyBtn('oa', 'Your OA questions')}${studyBtn('oav', 'Your OA + variants')}
      ${OA_TOPICS.map(t => studyBtn(t.key, t.name)).join('')}
      <p class="eyebrow sub">From the job posting</p>${SKILLS.map(s => studyBtn(s.key, s.name)).join('')}
      <p class="eyebrow sub">By source</p>${studyBtn('rep', 'Reported online')}${studyBtn('beyond', 'Beyond the book')}
    </div></section>
  </aside></div>`;
}
function countLine(list){ const s = solvedIn(list.map(Q => Q.id)); return `${list.length} problem${list.length === 1 ? '' : 's'} · ${s} solved${ui.f.list !== 'all' ? ` · ${esc(LISTS[ui.f.list].name)}` : ''}`; }
function refreshRows(){
  const list = filtered();
  $('#prows').innerHTML = list.length ? rowsHTML(list.map(Q => Q.id), 'full') : '<tr><td colspan="5" class="empty">No problems match. Reset the filters or try another search.</td></tr>';
  $('#f-count').innerHTML = countLine(list);
  $('#pick-one').disabled = !list.length;
}
function readFilters(){
  ui.f.q = $('#f-q').value; ui.f.d = $('#f-d').value; ui.f.status = $('#f-status').value; ui.f.type = $('#f-type').value;
  const lv = $('#f-list').value;
  if (lv !== ui.f.list) { ui.f.list = lv; $('#main').innerHTML = viewProblems(); return; }
  refreshRows();
}

// ---------- Problem page ----------
function openProblem(id, list, back){
  ui.pv = {id, list:list && list.length ? list : BANK.map(Q => Q.id), pick:undefined, result:null, reveal:false, perm:shuffle([0, 1, 2, 3])};
  if (back) ui.back = back;
  ui.view = 'problem'; setHash('p' + BY_ID[id].n); render(); window.scrollTo(0, 0);
}
function moveProblem(id){ openProblem(id, ui.pv.list); }
const backLabel = () => !ui.back ? 'Problem list' : ui.back.view === 'unit' ? 'Back to quest' : ui.back.tab === 'weekly' ? 'Back to weekly' : ui.back.tab === 'jobs' ? 'Back to job match' : 'Problem list';
function viewProblem(){
  const P = ui.pv, Q = BY_ID[P.id], pos = P.list.indexOf(P.id), s = state.q[Q.id], st = statusOf(Q.id);
  const locked = P.result === 'ok' || P.reveal;
  const showMarks = locked || P.result === 'bad';
  let html = `<div class="pv"><div class="pvbar"><button type="button" class="btn ghost small" data-act="pv-back">← ${backLabel()}</button>
    <div class="row"><span class="muted mono">${pos + 1} / ${P.list.length}</span>
    <button type="button" class="iconbtn" data-act="pv-prev" aria-label="Previous problem"${pos <= 0 ? ' disabled' : ''}>‹</button>
    <button type="button" class="iconbtn" data-act="pv-next" aria-label="Next problem"${pos >= P.list.length - 1 ? ' disabled' : ''}>›</button>
    <button type="button" class="btn small" data-act="pv-rand">Pick one</button></div></div>
    <article class="card pvcard"><div class="pvhead"><h1>${Q.n}. ${esc(TOPICS[Q.ch])}</h1>${st === 'solved' ? `<span class="solvedmark">${ICON.solved} Solved</span>` : st === 'attempted' ? '<span class="attmark">Attempted</span>' : ''}</div>
    <div class="qmeta"><span class="dpill d-${Q.d}">${DIFF[Q.d]}</span><button type="button" class="topicchip" data-act="topic-filter" data-ch="${Q.ch}">${esc(TOPICS[Q.ch])}</button><span>${Q.k === 'm' ? 'Multiple choice' : 'True / false'}</span>${tagChips(Q)}${s ? `<span class="muted">Submissions: ${s.n}</span>` : ''}</div>
    <p class="qtext">${esc(Q.q)}</p>`;
  const items = Q.k === 'm' ? P.perm.map(p => ({val:p, code:String(p), text:Q.o[p]})) : [{val:true, code:'T', text:'True'}, {val:false, code:'F', text:'False'}];
  html += '<div class="opts" role="radiogroup" data-scope="pv">' + items.map((it, j) => {
    const selected = P.pick === it.val;
    let cls = 'opt' + (selected ? ' sel' : '');
    if (showMarks && selected && !isCorrect(Q, it.val)) cls += ' wrong';
    if (locked && isCorrect(Q, it.val)) cls += ' right';
    return `<button type="button" class="${cls}" role="radio" aria-checked="${selected}" data-pv="${it.code}"${locked ? ' disabled' : ''}><span class="key">${'ABCD'[j]}</span><span>${esc(it.text)}</span></button>`;
  }).join('') + '</div>';
  if (P.result === 'ok') html += '<div class="verdict ok" role="status"><b>Accepted</b><span>Nice work.</span></div>';
  else if (P.result === 'bad') html += `<div class="verdict bad" role="status"><b>Wrong Answer</b><span>${P.reveal ? '' : 'Pick another answer and submit again, or view the solution.'}</span></div>`;
  if (locked) html += `<section class="sol"><h2>Solution</h2><p><b>Answer:</b> ${esc(correctText(Q))}</p><p>${esc(Q.e)}</p><small>${taughtLine(Q)}</small></section>`;
  html += '<div class="row between pvactions">';
  if (!locked) html += `<button type="button" class="btn ghost" data-act="pv-reveal">View solution</button><button type="button" class="btn primary" data-act="pv-submit"${P.pick === undefined || P.result === 'bad' ? ' disabled' : ''}>Submit</button>`;
  else html += `<span class="muted">Press Enter for the next problem.</span><button type="button" class="btn primary" data-act="pv-next"${pos >= P.list.length - 1 ? ' disabled' : ''}>Next problem →</button>`;
  return html + '</div></article></div>';
}
function pvPick(code){
  const P = ui.pv; if (!P || P.result === 'ok' || P.reveal) return;
  P.pick = parsePick(code); P.result = null;
  $('#main').innerHTML = viewProblem();
}
function pvSubmit(){
  const P = ui.pv, Q = BY_ID[P.id];
  if (P.pick === undefined || P.result) return;
  const ok = record(Q, P.pick);
  P.result = ok ? 'ok' : 'bad';
  save(); renderHeader();
  $('#main').innerHTML = viewProblem();
}

// ---------- sessions ----------
function startSession(kind, ids, opts){
  opts = opts || {};
  if (!ids.length) { toast('Nothing to practice here yet.'); return; }
  const S = {kind, ids, i:0, ans:{}, reveal:{}, perm:{}, title:opts.title || 'Practice', feedback:kind !== 'mock', unit:opts.unit || null, week:opts.week || null, deadline:kind === 'mock' ? Date.now() + MOCK_MIN * 60000 : null, from:opts.from || {view:'tab', tab:ui.tab}};
  ids.forEach(id => { S.perm[id] = BY_ID[id].k === 'm' ? shuffle([0, 1, 2, 3], opts.seed ? rngFrom(opts.seed + id) : null) : null; });
  if (kind === 'week') {
    const w = state.weeks[opts.week];
    Object.keys(w.ans).forEach(id => { S.ans[id] = w.ans[id]; S.reveal[id] = true; });
    const first = ids.findIndex(id => !(id in w.ans));
    S.i = first < 0 ? ids.length - 1 : first;
  }
  ui.session = S; ui.view = 'quiz';
  render(); startTimer(); window.scrollTo(0, 0);
}
function startTimer(){ stopTimer(); if (ui.session && ui.session.deadline) ui.timer = setInterval(updateTimer, 1000); }
function stopTimer(){ if (ui.timer) { clearInterval(ui.timer); ui.timer = null; } }
function updateTimer(){
  const S = ui.session, el = $('#timer');
  if (!S || !S.deadline || !el) return;
  const left = Math.max(0, S.deadline - Date.now()), m = Math.floor(left / 60000), s = Math.floor(left / 1000) % 60;
  el.textContent = m + ':' + String(s).padStart(2, '0');
  el.classList.toggle('low', left < 5 * 60000);
  if (left <= 0) finishSession();
}
function viewQuiz(){
  const S = ui.session, id = S.ids[S.i], Q = BY_ID[id], chosen = S.ans[id], reveal = S.feedback && S.reveal[id];
  const answered = S.ids.filter(x => x in S.ans).length;
  let html = `<div class="quiz"><div class="qtop"><div><p class="eyebrow">${esc(S.title)}</p><h1>Problem ${S.i + 1} of ${S.ids.length}</h1></div>
    <div class="row">${S.deadline ? '<span class="timer" id="timer">50:00</span>' : ''}<button type="button" class="btn small" data-act="quit">${S.kind === 'week' ? 'Save and exit' : 'Exit'}</button></div></div>
    <div class="progress" role="img" aria-label="${answered} of ${S.ids.length} answered"><i style="width:${pct(answered, S.ids.length)}%"></i></div>`;
  if (!S.feedback) html += `<div class="qnav" aria-label="Jump to problem">${S.ids.map((x, k) => `<button type="button" class="${x in S.ans ? 'ans' : ''}${k === S.i ? ' cur' : ''}" data-act="jump" data-k="${k}" aria-label="Problem ${k + 1}">${k + 1}</button>`).join('')}</div>`;
  html += `<section class="card qcard"><div class="qmeta"><span class="mono">#${Q.n}</span><span class="dpill d-${Q.d}">${DIFF[Q.d]}</span><span>${esc(TOPICS[Q.ch])}</span>${tagChips(Q)}</div>
    <p class="qtext">${esc(Q.q)}</p>${optsHTML(Q, S.perm[id], chosen, reveal, 'quiz')}${reveal ? verdictHTML(Q, chosen) : ''}</section>`;
  const last = S.i === S.ids.length - 1;
  if (S.feedback) html += `<div class="row between"><span class="muted">${reveal ? 'Press Enter for the next problem.' : 'Pick an answer, or press 1–4 (T or F for true/false).'}</span><button type="button" class="btn primary" data-act="next" ${reveal ? '' : 'disabled'}>${last ? 'See results' : 'Next problem'}</button></div>`;
  else html += `<div class="row between"><button type="button" class="btn" data-act="prev" ${S.i === 0 ? 'disabled' : ''}>Back</button><div class="row"><button type="button" class="btn" data-act="next" ${last ? 'disabled' : ''}>Next</button><button type="button" class="btn primary" data-act="submit">Submit (${answered}/${S.ids.length})</button></div></div>`;
  return html + '</div>';
}
function pick(code){
  const S = ui.session, id = S.ids[S.i], Q = BY_ID[id], val = parsePick(code);
  if (S.feedback) {
    if (S.reveal[id]) return;
    S.ans[id] = val; S.reveal[id] = true;
    record(Q, val);
    if (S.kind === 'week') state.weeks[S.week].ans[id] = val;
    save(); renderHeader();
  } else S.ans[id] = val;
  $('#main').innerHTML = viewQuiz(); updateTimer();
}
function finishSession(){
  const S = ui.session; if (!S || S.done) return;
  stopTimer();
  let score = 0;
  if (S.kind === 'mock') S.ids.forEach(id => { if (id in S.ans && record(BY_ID[id], S.ans[id])) score++; });
  else score = S.ids.filter(id => id in S.ans && isCorrect(BY_ID[id], S.ans[id])).length;
  if (S.kind === 'week') { const w = state.weeks[S.week]; if (!w.done) { w.done = true; w.score = score; w.at = Date.now(); } }
  if (S.kind === 'unit') {
    const u = state.learn.units[S.unit] || (state.learn.units[S.unit] = {});
    u.best = Math.max(u.best || 0, score);
    if (score >= UNIT_PASS && !u.passed) { u.passed = Date.now(); toast(`Quest ${S.unit} complete${S.unit < UNITS.length ? `. Quest ${S.unit + 1} is unlocked.` : '.'}`); }
  }
  state.hist.unshift({at:Date.now(), mode:S.kind, label:S.title, score, total:S.ids.length});
  state.hist = state.hist.slice(0, 60);
  S.score = score; S.done = true;
  save();
  ui.view = 'results'; render(); window.scrollTo(0, 0);
}
function viewResults(){
  const S = ui.session, total = S.ids.length;
  let sub = '';
  if (S.kind === 'unit') sub = S.score >= UNIT_PASS ? (S.unit < UNITS.length ? `Quest ${S.unit} complete. Quest ${S.unit + 1} is unlocked.` : 'You completed the final quest.') : `You need ${UNIT_PASS} of ${UNIT_N} to complete the quest. Review the misses below and try again.`;
  else if (S.kind === 'mock') sub = S.score / total >= 0.8 ? 'Test-ready pace. Keep it up weekly.' : 'Review the misses below, then practice the topics they came from.';
  else if (S.kind === 'week') sub = 'This week\'s set is done. A new set unlocks on Monday.';
  const missed = S.ids.filter(id => !(id in S.ans) || !isCorrect(BY_ID[id], S.ans[id]));
  let html = `<div class="quiz"><section class="card"><p class="eyebrow">${esc(S.title)} · results</p><div class="row between"><div class="scoreline">${ring(S.score / total, 64, 6, `${S.score} of ${total} correct`)}<div><b class="big">${S.score}<span class="muted">/${total}</span></b><span class="muted">correct</span></div></div>
    <div class="row">${S.kind === 'unit' && S.score >= UNIT_PASS && S.unit < UNITS.length ? `<button type="button" class="btn primary" data-act="open-unit" data-u="${S.unit + 1}">Start Quest ${S.unit + 1}</button>` : ''}
    ${S.kind === 'unit' && S.score < UNIT_PASS ? `<button type="button" class="btn primary" data-act="unit-quiz" data-u="${S.unit}">Try the checkpoint again</button>` : ''}
    ${missed.length && S.kind !== 'unit' ? `<button type="button" class="btn" data-act="retry-missed">Retry the ${missed.length} missed</button>` : ''}
    <button type="button" class="btn" data-act="done-results">Done</button></div></div>${sub ? `<p>${esc(sub)}</p>` : ''}</section>
    <section class="card"><h2>Every problem</h2><div class="results">`;
  S.ids.forEach(id => {
    const Q = BY_ID[id], has = id in S.ans, ok = has && isCorrect(Q, S.ans[id]);
    html += `<details class="result"><summary><span class="st ${has ? (ok ? 'solved' : 'wrongmark') : 'todo'}">${has ? (ok ? ICON.solved : ICON.wrong) : ''}</span><span class="rq">${Q.n}. ${esc(Q.q)}</span><span class="d-${Q.d} small">${DIFF[Q.d]}</span></summary>
      <div class="rbody">${has && !ok ? `<p>Your answer: ${esc(choiceText(Q, S.ans[id]))}</p>` : ''}${!has ? '<p>Not answered.</p>' : ''}<p><b>Answer:</b> ${esc(correctText(Q))}</p><p>${esc(Q.e)}</p><small class="muted">${taughtLine(Q)}</small></div></details>`;
  });
  return html + '</div></section></div>';
}

// ---------- Weekly ----------
function buildWeek(wk){
  const rnd = rngFrom('week:' + wk), now = Date.now();
  const attempted = [], wrongLast = [], oaDue = [], unseen = [], stale = [], rest = [];
  BANK.forEach(Q => {
    const s = state.q[Q.id];
    if (s && s.c === 0) attempted.push(Q.id);
    else if (s && !s.ok) wrongLast.push(Q.id);
    else if (oaish(Q) && (!s || s.c < 2)) oaDue.push(Q.id);
    else if (!s) unseen.push(Q.id);
    else if (now - s.at > 21 * 864e5) stale.push(Q.id);
    else rest.push(Q.id);
  });
  const pickIds = [];
  const add = id => { if (pickIds.length < WEEK_N && pickIds.indexOf(id) < 0) pickIds.push(id); };
  attempted.sort((a, b) => state.q[a].at - state.q[b].at).slice(0, 6).forEach(add);
  shuffle(wrongLast, rnd).slice(0, 3).forEach(add);
  shuffle(oaDue, rnd).slice(0, 5).forEach(add);
  const byCh = {};
  shuffle(unseen, rnd).forEach(id => (byCh[BY_ID[id].ch] = byCh[BY_ID[id].ch] || []).push(id));
  const order = shuffle(Object.keys(byCh), rnd);
  let more = true;
  while (pickIds.length < WEEK_N && more) { more = false; order.forEach(ch => { const l = byCh[ch]; if (l.length) { add(l.pop()); more = true; } }); }
  shuffle(stale, rnd).forEach(add); attempted.forEach(add); wrongLast.forEach(add); shuffle(rest, rnd).forEach(add);
  return shuffle(pickIds, rnd);
}
function startWeek(){
  const wk = isoWeek(new Date()).key;
  if (!state.weeks[wk]) {
    state.weeks[wk] = {ids:buildWeek(wk), ans:{}, done:false, score:null, at:null};
    Object.keys(state.weeks).sort().slice(0, -40).forEach(k => delete state.weeks[k]);
    save();
  }
  const w = state.weeks[wk];
  if (w.done) { ui.session = {kind:'week', ids:w.ids, i:0, ans:Object.assign({}, w.ans), reveal:{}, perm:{}, title:'Weekly set', feedback:true, week:wk, score:w.score, done:true, from:{view:'tab', tab:'weekly'}}; ui.view = 'results'; render(); window.scrollTo(0, 0); return; }
  startSession('week', w.ids, {week:wk, title:'Weekly set', seed:wk, from:{view:'tab', tab:'weekly'}});
}
function viewWeekly(){
  const wi = isoWeek(new Date()), w = state.weeks[wi.key];
  const ansN = w ? Object.keys(w.ans).length : 0, right = w ? w.ids.filter(id => id in w.ans && isCorrect(BY_ID[id], w.ans[id])).length : 0;
  const attemptedIds = BANK.filter(Q => statusOf(Q.id) === 'attempted').map(Q => Q.id);
  const oavIds = listIds('oav'), mocks = state.hist.filter(h => h.mode === 'mock').slice(0, 5);
  let body;
  if (!w) body = `<p>${WEEK_N} problems picked for you: anything you attempted but have not solved, your OA topics until you have each one right twice, and new problems spread across every chapter.</p><div class="row"><button type="button" class="btn primary" data-act="week">Start this week's set</button></div>`;
  else if (!w.done) body = `<div class="progress" role="img" aria-label="${ansN} of ${w.ids.length} answered"><i style="width:${pct(ansN, w.ids.length)}%"></i></div><p>${ansN} of ${w.ids.length} answered, ${right} correct. Your place is saved.</p><div class="row"><button type="button" class="btn primary" data-act="week">Continue</button></div>`;
  else body = `<p><b>${w.score}/${w.ids.length}</b> correct. The next set unlocks on Monday.</p><div class="row"><button type="button" class="btn" data-act="week">Review answers</button></div>`;
  let rows = '';
  if (w) rows = `<div class="tablewrap"><table class="ptable compact"><thead><tr><th class="c-st">Result</th><th class="c-ti">Problem</th><th class="c-df">Difficulty</th></tr></thead><tbody>` + w.ids.map(id => {
    const Q = BY_ID[id], has = id in w.ans, ok = has && isCorrect(Q, w.ans[id]);
    const mark = has ? (ok ? `<span class="st solved">${ICON.solved}</span>` : `<span class="st wrongmark">${ICON.wrong}</span>`) : '<span class="st todo"></span>';
    const title = w.done ? `<a href="#p${Q.n}" data-open="${id}" data-from="weekly">${Q.n}. ${esc(Q.q)}</a>` : `<span class="plain">${Q.n}. ${esc(Q.q)}</span>`;
    return `<tr${w.done ? ` data-open="${id}" data-from="weekly"` : ''}><td class="c-st">${mark}</td><td class="c-ti">${title}</td><td class="c-df d-${Q.d}">${DIFF[Q.d]}</td></tr>`;
  }).join('') + '</tbody></table></div>' + (w.done ? '' : '<p class="muted small">Problems open for review once the set is finished.</p>');
  const weeks = Object.keys(state.weeks).sort().reverse().filter(k => state.weeks[k].done).slice(0, 10);
  return `<section class="card"><div class="row between"><div><p class="eyebrow">Week ${wi.num} · from ${wi.mon.toLocaleDateString(undefined, {month:'short', day:'numeric'})}</p><h1>This week's set</h1></div>${w ? `<span class="pill">${right}/${w.ids.length} correct</span>` : ''}</div>${body}${rows}</section>
    <div class="grid2">
      <section class="card"><h2>Timed mock assessment</h2><p class="muted">${MOCK_N} random problems in ${MOCK_MIN} minutes, with no feedback until you submit, like the real OA.</p>
        ${mocks.length ? `<div class="hist">${mocks.map(h => `<div><span>${dayStr(h.at)}</span><span class="mono">${h.score}/${h.total}</span></div>`).join('')}</div>` : ''}
        <div class="row"><button type="button" class="btn primary" data-act="mock">Start a mock</button></div></section>
      <section class="card"><h2>Review</h2><p class="muted">Short sets with feedback after each problem.</p>
        <div class="slists"><button type="button" class="slist" data-act="review-attempted"${attemptedIds.length ? '' : ' disabled'}><span>Attempted, not solved</span><span class="mono">${attemptedIds.length}</span></button>
        <button type="button" class="slist" data-act="review-oa"><span>Your OA + variants (20 at random)</span><span class="mono">${solvedIn(oavIds)}/${oavIds.length}</span></button></div></section>
    </div>
    ${weekCodingHTML(wi)}
    <section class="card"><h2>Past weeks</h2>${weeks.length ? `<div class="hist">${weeks.map(k => `<div><span>${k.replace('-W', ' · week ')}</span><span class="mono">${state.weeks[k].score}/${state.weeks[k].ids.length}</span></div>`).join('')}</div>` : '<p class="muted">Finished weekly sets show up here.</p>'}</section>
    <section class="card" id="progress-card"><div class="row between"><div><h2>Your progress</h2><p class="muted">${esc(store.status)}.</p></div>
      ${ui.confirmReset ? '<div class="row"><span>Erase all progress?</span><button type="button" class="btn small" data-act="reset-yes">Erase everything</button><button type="button" class="btn small primary" data-act="reset-no">Keep my progress</button></div>' : '<button type="button" class="btn small ghost" data-act="reset">Reset progress</button>'}</div>
      ${acct.ready ? (acct.user ? `<div class="row between acctrow"><span>Signed in as <b>${esc(acct.user.email || acct.user.displayName || 'you')}</b>. Progress syncs to every device where you sign in.</span><button type="button" class="btn small" data-act="signout">Sign out</button></div>`
        : '<div class="row between acctrow"><span>Sign in with Google to keep your progress on every device.</span><button type="button" class="btn small primary" data-act="signin">Sign in with Google</button></div>') : ''}
      ${STANDALONE ? '<div class="row between acctrow"><span class="muted">Backup: download your progress as a file, or load one from another device (it merges, nothing is lost).</span><div class="row"><button type="button" class="btn small" data-act="export">Export progress</button><button type="button" class="btn small" data-act="import">Import progress</button><input type="file" id="import-file" accept=".json,application/json" hidden></div></div>' : ''}</section>`;
}
function weekCodingHTML(wi){
  const cw = weekCoding().map(id => CODE_BY_ID[id]);
  return `<section class="card"><div class="row between"><div><p class="eyebrow">Coding · week ${wi.num}</p><h2>This week's coding</h2></div><span class="pill">${cw.filter(p => codeStatus(p.id) === 'solved').length}/${cw.length} solved</span></div>
    <p class="muted">One easy, one medium and one hard problem from the Coding tab, picked from the ones you have not solved yet.</p>
    <div class="tablewrap"><table class="ptable compact ctable"><tbody>${cw.map(p => `<tr data-copen="${p.id}" data-from="weekly"><td class="c-st">${codeStatusCell(p.id)}</td><td class="c-ti"><a href="#code${p.n}" data-copen="${p.id}" data-from="weekly">${esc(p.title)}</a></td><td class="c-ty">${esc(LANGS[p.lang])}</td><td class="c-df d-${p.d}">${DIFF[p.d]}</td></tr>`).join('')}</tbody></table></div></section>`;
}
function topicIds(ch){
  const ids = CH_IDS[ch];
  const att = ids.filter(id => statusOf(id) === 'attempted'), un = ids.filter(id => statusOf(id) === 'todo'), ok = ids.filter(isSolved);
  return [...shuffle(att), ...shuffle(un), ...shuffle(ok)].slice(0, 10);
}
function unitQuizIds(u){
  const ids = CH_IDS[u];
  const notYet = ids.filter(id => !(state.q[id] && state.q[id].ok)), okIds = ids.filter(id => state.q[id] && state.q[id].ok);
  return [...shuffle(notYet), ...shuffle(okIds)].slice(0, UNIT_N);
}

// ---------- Job match ----------
function viewJobs(){
  const listCell = key => {
    if (!key) return '<span class="muted">Not in this trainer</span>';
    const ids = listIds(key);
    return `<button type="button" class="linkbtn" data-act="f-list-go" data-v="${key}">${ids.length} problems</button><span class="muted"> · ${solvedIn(ids)} solved</span>`;
  };
  const oaRows = OA_TOPICS.map(t => {
    const ids = listIds(t.key), exact = ids.filter(id => hasTag(BY_ID[id], 'o')).length;
    return `<tr><td>${esc(t.name)}</td><td>${t.book}</td><td class="mono">${exact}</td><td class="mono">${ids.length - exact}</td><td>${listCell(t.key)}</td></tr>`;
  }).join('');
  const repRows = REPORTED.map(r => `<tr><td>${esc(r.name)}</td><td>Ch ${r.ch}</td><td>${listCell(r.key)}</td></tr>`).join('');
  let html = `<section class="card hero"><div><p class="eyebrow">Job match review</p><h1>Does this match what NVIDIA asks for?</h1>
    <p class="muted">Every requirement in <a href="${JD.url}" target="_blank" rel="noopener">${esc(JD.title)}</a> (${JD.req}), checked against <em>Hardware from the Ground Up</em> and this trainer. Problem counts update as you solve.</p>
    <p><b>Bottom line:</b> every hardware topic in the posting (CMOS, VLSI, timing, power, computer architecture, computer arithmetic, Verilog and verification, GPUs) is taught in the book and practiced here, every question from your OA has many variants, and the Coding tab covers the hands-on side: RTL, testbenches, C, Python, Linux, Tcl and CUDA. What remains: VHDL is not taught, mechanical CAD is only a suggested project, and clubs and projects are things you show on your resume.</p></div></section>
    <section class="card"><h2>Your OA questions</h2><p class="muted">Every question you reported is in the bank word for word, plus variants that test the same idea from other angles.</p>
    <div class="tablewrap"><table class="rtable"><thead><tr><th>OA topic</th><th>Book</th><th>Exact</th><th>Variants</th><th>Practice</th></tr></thead><tbody>${oaRows}</tbody></table></div>
    <p class="muted small">Your coding question (a linked list) is taught in Chapter 23 and practiced in the Coding tab: ${codeCell(['C and C++'])}.</p></section>
    <section class="card"><h2>Topics other candidates reported</h2><p class="muted">Every topic from the book's "Seen on the assessment" boxes, where the book teaches it, and the problems that drill it. ${listCell('rep')} carry the reported tag.</p>
    <div class="tablewrap"><table class="rtable"><thead><tr><th>Reported topic</th><th>Book</th><th>Practice</th></tr></thead><tbody>${repRows}</tbody></table></div></section>`;
  REVIEW.forEach(g => {
    html += `<section class="card"><h2>${esc(g.group)}</h2><div class="reviews">`;
    g.items.forEach(it => {
      const [label, cls] = VERDICT[it.v];
      html += `<article class="review"><div class="rhead"><b>${esc(it.req)}</b><span class="vpill ${cls}">${label}</span></div>
        <dl><div><dt>In the book</dt><dd>${esc(it.book)}</dd></div><div><dt>In this trainer</dt><dd>${listCell(it.list)}${it.code ? '<br>' + codeCell(it.code) : ''}</dd></div><div><dt>What to do</dt><dd>${esc(it.todo)}</dd></div></dl></article>`;
    });
    html += '</div></section>';
  });
  html += `<section class="card"><h2>Internship teams in the posting</h2><p class="muted">The quests that matter most for each team.</p><div class="areas">` +
    AREAS.map(a => `<div class="area"><b>${esc(a.name)}</b><div class="row">${a.ch.map(c => `<button type="button" class="topicchip" data-act="open-unit" data-u="${c}">Quest ${c} · ${esc(TOPICS[c])}</button>`).join('')}</div></div>`).join('') + '</div></section>';
  html += `<section class="card"><h2>Other NVIDIA hardware roles</h2><p class="muted">Ignite only takes first- and second-years. These are the regular internship and new-grad roles to aim for next, with what this kit covers for each and what to add.</p><div class="reviews">` +
    ROLES.map(r => `<article class="review"><div class="rhead"><b>${esc(r.name)}</b><span class="vpill ${r.fit === 'Strong' || r.fit === 'Good' ? 'ok' : r.fit === 'Medium' ? 'warn' : ''}">${r.fit} fit</span></div>
      <dl><div><dt>Quests</dt><dd><div class="row">${r.ch.map(c => `<button type="button" class="topicchip" data-act="open-unit" data-u="${c}">Quest ${c} · ${esc(TOPICS[c])}</button>`).join('')}</div></dd></div>
      <div><dt>Coding track</dt><dd>${r.code ? codeCell([r.code]) : '<span class="muted">No coding track: this role is mostly analog or mechanical</span>'}</dd></div>
      <div><dt>Also do</dt><dd>${esc(r.add)}</dd></div></dl></article>`).join('') + '</div></section>';
  return html;
}

// ---------- Coding problems ----------
CODING.forEach((p, i) => { p.n = i + 1; p.hay = (p.title + ' ' + p.p.join(' ') + ' ' + LANGS[p.lang] + ' ' + p.area).toLowerCase(); });
const CODE_BY_ID = Object.fromEntries(CODING.map(p => [p.id, p]));
const CODE_MAX = 4000;   // characters of your code kept per problem
const blankCodeFilters = () => ({q:'', area:'all', lang:'all', d:'all', status:'all'});
ui.cf = blankCodeFilters();
const codeStatus = id => { const s = state.code[id]; return !s ? 'todo' : (s.solved ? 'solved' : 'attempted'); };
const codeSolvedIn = list => list.filter(p => codeStatus(p.id) === 'solved').length;
function setCode(id, patch){ state.code[id] = Object.assign({src:null, solved:0}, state.code[id], patch, {at:Date.now()}); }
function inlineCode(t){ return esc(t).replace(/`([^`]+)`/g, '<code>$1</code>'); }
function codeStatusCell(id){
  const s = codeStatus(id);
  return s === 'solved' ? `<span class="st solved" title="Solved">${ICON.solved}</span>` : s === 'attempted' ? `<span class="st attempted" title="Attempted">${ICON.attempted}</span>` : '<span class="st todo" title="Not tried"></span>';
}
function codeCell(areas){
  return areas.map(a => { const l = CODING.filter(p => p.area === a); return `<button type="button" class="linkbtn" data-act="c-area-go" data-v="${esc(a)}">${l.length} ${esc(a)} coding problems</button><span class="muted"> · ${codeSolvedIn(l)} solved</span>`; }).join('<br>');
}
function codeFiltered(){
  const f = ui.cf, term = f.q.trim().toLowerCase();
  return CODING.filter(p => (f.area === 'all' || p.area === f.area) && (f.lang === 'all' || p.lang === f.lang) && (f.d === 'all' || p.d === f.d) &&
    (f.status === 'all' || codeStatus(p.id) === f.status) && (!term || p.hay.indexOf(term) >= 0));
}
function codeRowsHTML(list){
  return list.length ? list.map(p => `<tr data-copen="${p.id}"><td class="c-st">${codeStatusCell(p.id)}</td><td class="c-ti"><a href="#code${p.n}" data-copen="${p.id}">${p.n}. ${esc(p.title)}</a>${p.run ? '<span class="tags"><span class="tag t-run">Judged</span></span>' : ''}</td>` +
    `<td class="c-tp">${esc(p.area)}</td><td class="c-ty">${esc(LANGS[p.lang])}</td><td class="c-df d-${p.d}">${DIFF[p.d]}</td></tr>`).join('')
    : '<tr><td colspan="5" class="empty">No coding problems match. Reset the filters or try another search.</td></tr>';
}
function viewCoding(){
  const f = ui.cf, list = codeFiltered(), solved = codeSolvedIn(CODING);
  const chips = `<button type="button" class="tchip${f.area === 'all' ? ' on' : ''}" data-act="cf-area" data-v="all">All areas <span>${CODING.length}</span></button>` +
    CODE_AREAS.map(a => `<button type="button" class="tchip${f.area === a ? ' on' : ''}" data-act="cf-area" data-v="${esc(a)}">${esc(a)} <span>${CODING.filter(p => p.area === a).length}</span></button>`).join('');
  const langOpts = [['all', 'Language'], ...Object.keys(LANGS).filter(l => CODING.some(p => p.lang === l)).map(l => [l, LANGS[l]])];
  const byD = d => { const l = CODING.filter(p => p.d === d); return [codeSolvedIn(l), l.length]; };
  return `<div class="pgrid"><section class="pmain">
    <div class="chiprow" role="toolbar" aria-label="Filter by area">${chips}</div>
    <div class="fbar cfbar">
      <input type="search" id="cf-q" placeholder="Search coding problems" value="${esc(f.q)}" aria-label="Search coding problems">
      ${sel('cf-lang', 'Language', f.lang, langOpts)}
      ${sel('cf-d', 'Difficulty', f.d, [['all', 'Difficulty'], ['E', 'Easy'], ['M', 'Medium'], ['H', 'Hard']])}
      ${sel('cf-status', 'Status', f.status, [['all', 'Status'], ['todo', 'Todo'], ['solved', 'Solved'], ['attempted', 'Attempted']])}
      <div class="fbtns"><button type="button" class="btn small ghost" data-act="cf-reset">Reset</button><button type="button" class="btn small primary" id="cpick" data-act="cpick"${list.length ? '' : ' disabled'}>Pick one</button></div>
    </div>
    <p class="fcount" id="cf-count">${list.length} problems · ${codeSolvedIn(list)} solved</p>
    <div class="tablewrap"><table class="ptable ctable"><thead><tr><th class="c-st">Status</th><th class="c-ti">Problem</th><th class="c-tp">Area</th><th class="c-ty">Language</th><th class="c-df">Difficulty</th></tr></thead><tbody id="crows">${codeRowsHTML(list)}</tbody></table></div>
  </section>
  <aside class="pside">
    <section class="card progcard"><h2>Coding progress</h2><div class="progring">${ring(solved / CODING.length, 120, 9, `${solved} of ${CODING.length} solved`)}<div class="ringlabel"><b>${solved}</b><span>/${CODING.length}</span><small>Solved</small></div></div>
      <div class="dbars">${['E', 'M', 'H'].map(d => { const [s, t] = byD(d); return `<div class="dbar"><span class="d-${d}">${DIFF[d]}</span><span class="mono">${s}/${t}</span><i class="bar d-${d}"><b style="width:${pct(s, t)}%"></b></i></div>`; }).join('')}</div>
      <p class="muted small">Problems marked Judged run hidden tests right here: Python, C and C++ (compiled in your browser) and Verilog RTL (synthesized and simulated). Run tries the examples; Submit runs every test. The rest you check in a real tool.</p></section>
    <section class="card studycard"><h2>Tracks by NVIDIA role</h2><div class="slists">${ROLES.filter(r => r.code).map(r => { const l = CODING.filter(p => p.area === r.code); return `<button type="button" class="slist${f.area === r.code ? ' on' : ''}" data-act="cf-area" data-v="${esc(r.code)}"><span>${esc(r.name)}</span><span class="mono">${codeSolvedIn(l)}/${l.length}</span></button>`; }).join('')}</div></section>
  </aside></div>`;
}
function refreshCodeRows(){
  ui.cf.q = $('#cf-q').value; ui.cf.lang = $('#cf-lang').value; ui.cf.d = $('#cf-d').value; ui.cf.status = $('#cf-status').value;
  const list = codeFiltered();
  $('#crows').innerHTML = codeRowsHTML(list);
  $('#cf-count').textContent = `${list.length} problems · ${codeSolvedIn(list)} solved`;
  $('#cpick').disabled = !list.length;
}

// Coding problem page, laid out like LeetCode: description, solution and submissions on the left;
// the editor on the right with a console below it. Run tries the example cases; Submit runs every hidden test.
const blankCodePage = (id, list) => ({id, list, hints:0, ltab:'desc', ctab:'case', ccase:0, rcase:0, run:null, busy:null});
function openCode(id, list, back){
  saveEditorNow();
  ui.cp = blankCodePage(id, list && list.length ? list : CODING.map(p => p.id));
  if (back) ui.cback = back;
  ui.view = 'code'; setHash('code' + CODE_BY_ID[id].n); render(); window.scrollTo(0, 0);
}
function saveEditorNow(){
  const ed = $('#code-editor');
  clearTimeout(ui.codeTimer);
  if (!ed || !ui.cp || ui.view !== 'code') return;
  const id = ui.cp.id, s = state.code[id], v = ed.value.slice(0, CODE_MAX);
  if (s ? s.src !== v : v !== CODE_BY_ID[id].starter) { setCode(id, {src:v}); save(); }
}
const judged = p => !!p.run;
// The example cases shown in the Testcase tab and checked by Run.
function exampleCount(p){
  const R = p.run;
  if (!R) return 0;
  if (R.kind === 'v') return R.benches ? 1 : 0;
  return Math.min(3, R.tests.length);
}
function caseLabel(p, t){
  if (!p.run.kind) return p.run.fn + '(' + t[0].map(pyRepr).join(', ') + ')';
  return t[3] || t[0];
}
function testcaseHTML(p){
  const R = p.run, C = ui.cp;
  if (R.kind === 'v') {
    const b = R.benches && R.benches[0];
    const what = R.check ? 'This design is checked for the properties in the statement, under random traffic. Run and Submit both run every check.'
      : 'Your module gets the same inputs as the reference design, and every output must match on every cycle' + (b.clk ? ` (sampled just before each rising edge of ${b.clk})` : '') + '.';
    return `<div class="tcase"><p class="muted small">${what}</p>${b ? `<div class="kv"><span>Example</span><code>${esc(b.name)}</code></div><div class="kv"><span>Inputs</span><code>${esc((b.clk ? [b.clk] : []).concat(b.in).join(', '))}</code></div>
      ${b.rows ? `<div class="kv"><span>First rows</span><pre class="code">${esc(b.in.join(' ') + '\n' + b.rows.slice(0, 6).join('\n') + (b.rows.length > 6 ? '\n…' : ''))}</pre></div>` : ''}` : ''}
      ${R.benches && R.benches.length > 1 ? `<p class="muted small">Run uses this bench. Submit runs all ${R.benches.length}, including corner cases and random stimulus.</p>` : ''}</div>`;
  }
  const n = exampleCount(p), i = Math.min(C.ccase, n - 1), t = R.tests[i];
  return `<div class="casechips">${R.tests.slice(0, n).map((_, k) => `<button type="button" class="casechip${k === i ? ' on' : ''}" data-act="c-case" data-v="${k}">Case ${k + 1}</button>`).join('')}</div>
    <div class="tcase"><div class="kv"><span>Input</span><pre class="code">${esc(caseLabel(p, t))}</pre></div>
    <div class="kv"><span>Expected</span><pre class="code">${esc(R.kind ? t[1] : pyRepr(t[1]))}</pre></div>
    <p class="muted small">Submit also runs ${R.tests.length - n} hidden test${R.tests.length - n === 1 ? '' : 's'}.</p></div>`;
}
function verdictClass(v){ return v === 'Accepted' ? 'ok' : 'bad'; }
function resultHTML(p){
  const C = ui.cp, R = C.run;
  if (C.busy) return `<p class="runmsg"><span class="spin" aria-hidden="true"></span>${esc(C.busy)}</p>`;
  if (!R) return '<p class="muted small">You must run your code first.</p>';
  const head = `<div class="vhead"><h3 class="v-${verdictClass(R.verdict)}">${esc(R.verdict)}</h3>${R.total ? `<span class="muted">${R.passed} / ${R.total} testcases passed</span>` : ''}${R.ms != null ? `<span class="muted">Runtime ${R.ms} ms</span>` : ''}</div>`;
  if (R.error) return head + `<pre class="code err">${esc(R.error)}</pre>`;
  const out = R.stdout ? `<div class="kv"><span>Stdout</span><pre class="code">${esc(R.stdout)}</pre></div>` : '';
  const caseBox = r => `${r.at ? `<div class="kv"><span>When</span><pre class="code">${esc(r.at)}</pre></div>` : ''}
    <div class="kv"><span>${R.mode === 'submit' && !r.ok ? 'Input' : 'Test'}</span><pre class="code">${esc(r.label)}</pre></div>
    ${r.exp !== '' || r.got !== '' ? `<div class="kv"><span>Output</span><pre class="code${r.ok ? '' : ' err'}">${esc(r.got)}</pre></div><div class="kv"><span>Expected</span><pre class="code">${esc(r.exp)}</pre></div>` : ''}`;
  if (R.mode === 'submit') {
    const bad = R.results.find(r => !r.ok);
    return head + (bad ? `<p class="eyebrow">First failing testcase</p>${caseBox(bad)}` : '<p class="muted small">Every hidden test passed. Compare your approach with the Solution tab.</p>') + out;
  }
  const i = Math.min(C.rcase, R.results.length - 1);
  return head + `<div class="casechips">${R.results.map((r, k) => `<button type="button" class="casechip ${r.ok ? 'pass' : 'fail'}${k === i ? ' on' : ''}" data-act="c-rcase" data-v="${k}">${r.ok ? '✓' : '✗'} ${R.results.length > 3 ? esc(r.label.slice(0, 26)) : 'Case ' + (k + 1)}</button>`).join('')}</div>` + caseBox(R.results[i]) + out;
}
function consoleWrapHTML(p){
  const C = ui.cp, st = codeStatus(p.id);
  return `<div class="console"><div class="ctabs" role="tablist">${judged(p) ? `<button type="button" role="tab" aria-selected="${C.ctab === 'case'}" data-act="c-ctab" data-v="case">Testcase</button><button type="button" role="tab" aria-selected="${C.ctab === 'result'}" data-act="c-ctab" data-v="result">Test Result</button>` : '<span class="ctitle">Check it yourself</span>'}
    <span class="spacer"></span>
    ${judged(p) ? `<button type="button" class="btn small" data-act="c-run"${C.busy ? ' disabled' : ''}>Run</button><button type="button" class="btn small go" data-act="c-submit"${C.busy ? ' disabled' : ''}>Submit</button>`
      : `<button type="button" class="btn small${st === 'solved' ? '' : ' go'}" data-act="c-mark">${st === 'solved' ? 'Mark as not solved' : 'Mark as solved'}</button>`}</div>
    ${consoleHTML(p)}</div>`;
}
function consoleHTML(p){
  const C = ui.cp;
  if (!judged(p)) return `<div class="cbody"><p class="muted small">${toolNote(p.lang)}</p></div>`;
  return `<div class="cbody" id="run-out">${C.ctab === 'case' ? testcaseHTML(p) : resultHTML(p)}</div>`;
}
function codeTabsHTML(){
  const C = ui.cp, s = state.code[C.id] || {}, n = (s.subs || []).length;
  return [['desc', 'Description'], ['sol', 'Solution'], ['subs', 'Submissions' + (n ? ` (${n})` : '')]]
    .map(([k, t]) => `<button type="button" role="tab" aria-selected="${C.ltab === k}" data-act="c-ltab" data-v="${k}">${t}</button>`).join('');
}
function codeLeftHTML(){
  const C = ui.cp, p = CODE_BY_ID[C.id], st = codeStatus(p.id), s = state.code[p.id] || {};
  let body;
  if (C.ltab === 'sol') body = `<section class="sol"><pre class="code">${esc(p.sol)}</pre>${p.why.map(t => `<p>${inlineCode(t)}</p>`).join('')}</section>`;
  else if (C.ltab === 'subs') {
    const subs = (s.subs || []).slice().reverse();
    body = subs.length ? `<table class="subs"><thead><tr><th>Status</th><th>Tests</th><th>When</th></tr></thead><tbody>${subs.map(x =>
      `<tr><td class="v-${verdictClass(x.v)}">${esc(x.v)}</td><td class="mono">${x.t ? `${x.p}/${x.t}` : '–'}</td><td class="muted">${esc(new Date(x.at).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}))}</td></tr>`).join('')}</tbody></table>`
      : `<p class="muted">${judged(p) ? 'No submissions yet. Submit runs every hidden test and records the verdict here.' : 'This problem is checked by hand: run it in a real tool, then mark it solved.'}</p>`;
  } else body = `<div class="qmeta"><span class="dpill d-${p.d}">${DIFF[p.d]}</span><span class="topicchip">${esc(p.area)}</span><span>${esc(LANGS[p.lang])}</span>${judged(p) ? '<span class="tag t-run">Judged here</span>' : ''}</div>
    <div class="body">${p.p.map(t => `<p>${inlineCode(t)}</p>`).join('')}</div>
    ${p.ex ? `<div><p class="eyebrow">Example</p><pre class="code">${esc(p.ex)}</pre></div>` : ''}
    <div class="hintbox">${p.hints.slice(0, C.hints).map((h, i) => `<p><b>Hint ${i + 1}.</b> ${inlineCode(h)}</p>`).join('')}
      ${C.hints < p.hints.length ? `<button type="button" class="btn small ghost" data-act="c-hint">Show hint ${C.hints + 1} of ${p.hints.length}</button>` : ''}</div>`;
  return `<article class="cstate panel"><div class="ptabs" role="tablist">${codeTabsHTML()}</div><div class="pscroll">
    <div class="pvhead"><h1>${p.n}. ${esc(p.title)}</h1>${st === 'solved' ? `<span class="solvedmark">${ICON.solved} Solved</span>` : st === 'attempted' ? '<span class="attmark">Attempted</span>' : ''}</div>
    ${body}</div></article>`;
}
function toolNote(lang){
  return ({verilog:'Run it free with Icarus Verilog (iverilog) or online at EDA Playground, then compare with the solution.',
    sv:'Run it in a SystemVerilog simulator (EDA Playground has free ones), then compare with the solution.',
    c:'Compile and test it with gcc or clang, then compare with the solution.', cpp:'Compile and test it with g++ or clang++, then compare with the solution.',
    python:'Run it with a simulator and cocotb on your computer.', bash:'Try it in a Linux or macOS terminal.', tcl:'Try it in tclsh or your EDA tool.',
    perl:'Run it with perl on any Linux or macOS machine.', cuda:'Compile it with nvcc on a machine with an NVIDIA GPU (Google Colab works).', matlab:'Run it in MATLAB or GNU Octave.'}[lang] || '') + ' Mark it solved when your version works.';
}
const JUDGE_NAME = {python:'Python (Pyodide)', c:'C (Clang, WebAssembly)', cpp:'C++17 (Clang, WebAssembly)', verilog:'Verilog (Yosys + gate simulator)'};
function viewCode(){
  const C = ui.cp, p = CODE_BY_ID[C.id], pos = C.list.indexOf(C.id), s = state.code[p.id] || {}, st = codeStatus(p.id);
  const src = s.src != null ? s.src : p.starter;
  const back = ui.cback && ui.cback.tab === 'weekly' ? 'Back to weekly' : 'Coding problems';
  return `<div class="cpv-wrap"><div class="pvbar"><button type="button" class="btn ghost small" data-act="c-back">← ${back}</button>
    <div class="row"><span class="muted mono">${pos + 1} / ${C.list.length}</span>
    <button type="button" class="iconbtn" data-act="c-prev" aria-label="Previous problem"${pos <= 0 ? ' disabled' : ''}>‹</button>
    <button type="button" class="iconbtn" data-act="c-next" aria-label="Next problem"${pos >= C.list.length - 1 ? ' disabled' : ''}>›</button></div></div>
    <div class="cpv">${codeLeftHTML()}
    <section class="ceditor panel"><div class="ehead"><span class="elang">${esc(JUDGE_NAME[p.lang] && judged(p) ? JUDGE_NAME[p.lang] : LANGS[p.lang])}</span><span class="spacer"></span>
      <button type="button" class="btn small ghost" data-act="c-reset">Reset</button></div>
      <div class="editor" data-lang="${p.lang}"><pre class="gutter" aria-hidden="true">${gutter(src)}</pre><div class="ed-area"><pre class="hl" aria-hidden="true">${highlight(src, p.lang)}\n</pre>
        <textarea id="code-editor" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Your code (Tab inserts spaces; Esc leaves the editor)">${esc(src)}</textarea></div></div>
      ${consoleWrapHTML(p)}</section></div></div>`;
}

// ---------- the editor: line numbers and light syntax colouring under a plain textarea ----------
const KW = {
  c:'auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while bool true false NULL size_t uint8_t uint16_t uint32_t uint64_t int8_t int16_t int32_t int64_t uintptr_t',
  cpp:'class public private protected template typename namespace using new delete this virtual override explicit nullptr operator friend std vector string list unordered_map map pair priority_queue const_cast static_cast',
  verilog:'module endmodule input output inout wire reg logic always always_ff always_comb always_latch assign begin end if else case casez casex endcase default posedge negedge or and not parameter localparam integer genvar generate endgenerate for function endfunction task endtask initial signed unsigned',
  sv:'interface endinterface class endclass extends virtual rand randc constraint covergroup endgroup coverpoint bins property endproperty assert assume cover sequence endsequence program endprogram package endpackage import typedef enum struct packed bit byte int string automatic new this super fork join join_any join_none forever repeat wait',
  python:'and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield',
  bash:'if then else elif fi for in do done while until case esac function return local export echo exit set',
  tcl:'proc set if else elseif foreach for while return puts expr incr lappend list llength lindex string dict namespace source',
  perl:'my our sub if elsif else unless foreach for while return print use strict warnings open close next last',
  cuda:'__global__ __device__ __host__ __shared__ __syncthreads threadIdx blockIdx blockDim gridDim dim3 cudaMalloc cudaMemcpy cudaFree',
  matlab:'function end if elseif else for while return switch case otherwise',
};
const KW_SET = {};
const kwFor = lang => KW_SET[lang] || (KW_SET[lang] = new Set((KW[lang] + ' ' + ({cpp:KW.c, cuda:KW.c + ' ' + KW.cpp, sv:KW.verilog}[lang] || '')).split(/\s+/)));
function highlight(src, lang){
  const hash = ['python', 'bash', 'tcl', 'perl'].includes(lang), pct = lang === 'matlab', hdl = lang === 'verilog' || lang === 'sv';
  const re = new RegExp([
    hash ? '#[^\\n]*' : pct ? '%[^\\n]*' : '\\/\\*[\\s\\S]*?(?:\\*\\/|$)|\\/\\/[^\\n]*',
    hdl ? '"(?:\\\\.|[^"\\\\\\n])*"' : '"(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\'',
    hdl ? "\\d*'[sS]?[bBoOdDhH][0-9a-fA-FxXzZ_]+|\\b\\d[\\d_]*(?:\\.\\d+)?\\b" : '\\b0[xX][0-9a-fA-F]+[uUlL]*\\b|\\b\\d+(?:\\.\\d+)?[uUlLfF]*\\b',
    '[A-Za-z_$][\\w$]*', hash || pct ? '(?!)' : '^[ \\t]*#\\s*\\w+'].map(x => '(' + x + ')').join('|'), 'gm');
  const kw = kwFor(lang);
  let out = '', last = 0, m;
  while ((m = re.exec(src))) {
    if (m[0] === '') { re.lastIndex++; continue; }
    out += esc(src.slice(last, m.index));
    const t = esc(m[0]);
    out += m[1] ? `<i class="t-c">${t}</i>` : m[2] ? `<i class="t-s">${t}</i>` : m[3] ? `<i class="t-n">${t}</i>` : m[5] ? `<i class="t-k">${t}</i>`
      : kw.has(m[0]) ? `<i class="t-k">${t}</i>` : (hdl && m[0][0] === '$') ? `<i class="t-f">${t}</i>` : t;
    last = re.lastIndex;
  }
  return out + esc(src.slice(last));
}
const gutter = src => Array.from({length:src.split('\n').length}, (_, i) => i + 1).join('\n');
function syncEditor(){
  const ed = $('#code-editor'); if (!ed || !ui.cp) return;
  const p = CODE_BY_ID[ui.cp.id];
  $('.editor .hl').innerHTML = highlight(ed.value, p.lang) + '\n';
  $('.editor .gutter').textContent = gutter(ed.value);
  syncScroll();
}
function syncScroll(){
  const ed = $('#code-editor'); if (!ed) return;
  $('.editor .hl').scrollTop = ed.scrollTop; $('.editor .hl').scrollLeft = ed.scrollLeft; $('.editor .gutter').scrollTop = ed.scrollTop;
}
function pyRepr(v){
  if (v === true) return 'True';
  if (v === false) return 'False';
  if (v === null) return 'None';
  if (typeof v === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(pyRepr).join(', ') + ']';
  if (typeof v === 'object') return '{' + Object.keys(v).map(k => JSON.stringify(k) + ': ' + pyRepr(v[k])).join(', ') + '}';
  return String(v);
}
function showRun(){
  if (!ui.cp || ui.view !== 'code') return;
  const c = $('.console'); if (!c) return;
  const t = document.createElement('div'); t.innerHTML = consoleWrapHTML(CODE_BY_ID[ui.cp.id]);
  c.replaceWith(t.firstElementChild);
}

// Python runs in the browser with Pyodide, inside a Web Worker so a runaway loop can be stopped.
const PYODIDE = 'https://cdn.jsdelivr.net/npm/pyodide@0.26.2/';
const pyRun = {worker:null, ready:false, main:null};
const PY_WORKER = `importScripts('${PYODIDE}pyodide.js');
let py = null;
self.onmessage = async (e) => {
  try {
    if (!py) { py = await loadPyodide({indexURL: '${PYODIDE}'}); self.postMessage({type: 'loaded'}); }
    const out = [];
    py.setStdout({batched: (s) => out.push(s)});
    py.setStderr({batched: (s) => out.push(s)});
    const g = py.globals.get('dict')();
    const result = await py.runPythonAsync(e.data.code, {globals: g});
    g.destroy();
    self.postMessage({type: 'done', result: String(result), stdout: out.join('\\n')});
  } catch (err) {
    self.postMessage({type: 'error', error: String((err && err.message) || err)});
  }
};`;
function harness(p, src, tests){
  return [src, '', 'import json as __json',
    'def __norm(v):',
    '    if isinstance(v, tuple): v = list(v)',
    '    if isinstance(v, list): return [__norm(x) for x in v]',
    '    if isinstance(v, dict): return {str(k): __norm(x) for k, x in v.items()}',
    '    return v',
    '__res = []',
    `for __args, __exp in __json.loads(${JSON.stringify(JSON.stringify(tests))}):`,
    '    try:',
    `        __got = __norm(${p.run.fn}(*__args))`,
    '        __res.append([__got == __exp, repr(__got)])',
    '    except Exception as __e:',
    '        __res.append([False, type(__e).__name__ + ": " + str(__e)])',
    '__json.dumps(__res)'].join('\n');
}
function cleanPyError(s){ return s.split('\n').filter(l => !/_pyodide|pyodide\.asm|File "\/lib\//.test(l)).join('\n').trim(); }
function setBusy(msg){ if (ui.cp && ui.cp.busy) { ui.cp.busy = msg; showRun(); } }
async function execOnMain(code){
  try {
    if (!pyRun.main) {
      if (!window.loadPyodide) await loadScript(PYODIDE + 'pyodide.js');
      pyRun.main = await window.loadPyodide({indexURL:PYODIDE});
    }
    const py = pyRun.main, out = [];
    py.setStdout({batched:s => out.push(s)}); py.setStderr({batched:s => out.push(s)});
    const g = py.globals.get('dict')();
    const result = await py.runPythonAsync(code, {globals:g});
    g.destroy();
    return {result:String(result), stdout:out.join('\n')};
  } catch (e) { return {error:cleanPyError(String((e && e.message) || e)) || 'Python could not be loaded. Check your connection.'}; }
}
function execPython(code){
  return new Promise(resolve => {
    let w = pyRun.worker;
    if (!w) {
      try { w = pyRun.worker = new Worker(URL.createObjectURL(new Blob([PY_WORKER], {type:'text/javascript'}))); pyRun.ready = false; }
      catch (e) { execOnMain(code).then(resolve); return; }
    }
    let timer = null;
    const finish = r => { clearTimeout(timer); w.onmessage = null; w.onerror = null; resolve(r); };
    const kill = (msg, tle) => { w.terminate(); pyRun.worker = null; pyRun.ready = false; finish({error:msg, tle}); };
    timer = setTimeout(() => kill(pyRun.ready ? 'Your code ran for more than 8 seconds (an infinite loop?).' : 'Python did not finish loading. Check your connection and try again.', pyRun.ready), pyRun.ready ? 8000 : 120000);
    w.onerror = ev => { if (ev.preventDefault) ev.preventDefault(); clearTimeout(timer); w.terminate(); pyRun.worker = null; pyRun.ready = false; execOnMain(code).then(resolve); };
    w.onmessage = ev => {
      const m = ev.data;
      if (m.type === 'loaded') {
        pyRun.ready = true; clearTimeout(timer);
        timer = setTimeout(() => kill('Your code ran for more than 8 seconds (an infinite loop?).', true), 8000);
        setBusy('Running…');
      } else if (m.type === 'done') finish({result:m.result, stdout:m.stdout});
      else if (m.type === 'error') finish({error:cleanPyError(m.error)});
    };
    w.postMessage({code});
  });
}
async function judgePython(p, src, all){
  const tests = all ? p.run.tests : p.run.tests.slice(0, exampleCount(p));
  if (!pyRun.ready && !pyRun.main) setBusy('Loading Python in your browser (the first run downloads about 10 MB)…');
  const res = await execPython(harness(p, src, tests));
  if (res.error) return {verdict:res.tle ? 'Time Limit Exceeded' : /SyntaxError|IndentationError/.test(res.error) ? 'Compile Error' : 'Runtime Error', error:res.error};
  let raw;
  try { raw = JSON.parse(res.result); } catch (e) { return {verdict:'Runtime Error', error:'Could not read the test results.'}; }
  return {results:raw.map((r, i) => ({ok:r[0], label:caseLabel(p, tests[i]), exp:pyRepr(tests[i][1]), got:r[1]})), stdout:res.stdout};
}
const mb = (d, t) => t ? ` ${Math.round(100 * d / t)}%` : '';
async function judgeC(p, src, all){
  const cpp = p.lang === 'cpp', sub = Object.assign({}, p.run, {tests:all ? p.run.tests : p.run.tests.slice(0, exampleCount(p))});
  const prob = Object.assign({}, p, {run:sub});
  const file = cpp ? 'solution.cpp' : 'solution.c';
  setBusy('Compiling…');
  const args = cpp ? ['clang++', '-O1', '-std=c++17', '-fno-exceptions'] : ['clang', '-O1', '-std=gnu17'];
  const r = await toolRun('clang', args.concat([file, '-o', 'a.wasm']),
    {[file]:cHarness(prob, src, cpp)}, 'a.wasm',
    m => setBusy(m.type === 'loading' ? 'Loading the C/C++ compiler (the first run downloads about 25 MB)…' : 'Downloading the compiler…' + mb(m.done, m.total)));
  if (r.type === 'fail') return {verdict:'Error', error:'The compiler could not be loaded: ' + r.error + '\nCheck your connection and try again.'};
  if (!r.ok) return {verdict:'Compile Error', error:cleanToolLog(r.log) || 'Compilation failed.'};
  setBusy('Running…');
  const x = await wasiRun(r.out, 6000);
  if (x.tle) return {verdict:'Time Limit Exceeded', error:'Your program ran for more than 6 seconds (an infinite loop?).', ...cResults(prob, '', '')};
  const res = cResults(prob, x.out, x.trap ? 'runtime error: ' + x.trap : x.code ? `exited with code ${x.code}` : '');
  if (x.err) res.stdout = (res.stdout ? res.stdout + '\n' : '') + x.err;
  res.ms = x.ms;
  if (x.trap) { res.verdict = 'Runtime Error'; res.error = x.trap.replace(/^RuntimeError: /, '') + (/unreachable/.test(x.trap) ? '\n(a crash, such as a function that ends without returning a value)' : ''); }
  return res;
}
const refNets = {};
async function synthV(p, code, onEvent){
  const merged = {modules:{}};
  for (const top of vTops(p)) {
    const r = await toolRun('yosys', ['-q', '-p', YOSYS_SCRIPT(top)], {'design.v':code}, 'net.json', onEvent);
    if (r.type === 'fail') return {fail:'Yosys could not be loaded: ' + r.error + '\nCheck your connection and try again.'};
    if (!r.ok) return {error:yosysErrors(r.log) || 'Synthesis failed.'};
    const j = JSON.parse(typeof r.out === 'string' ? r.out : new TextDecoder().decode(r.out));
    Object.assign(merged.modules, j.modules);
  }
  return {net:merged};
}
async function judgeV(p, src, all){
  const ev = m => setBusy(m.type === 'loading' ? 'Loading Yosys in your browser (the first run downloads about 15 MB)…' : 'Downloading Yosys…' + mb(m.done, m.total));
  setBusy('Synthesizing your design…');
  const u = await synthV(p, src, ev);
  if (u.fail) return {verdict:'Error', error:u.fail};
  if (u.error) return {verdict:'Compile Error', error:u.error};
  let ref = null;
  if (p.run.benches) {
    if (!refNets[p.id]) { setBusy('Preparing the reference design…'); const r = await synthV(p, p.sol, ev); if (!r.net) return {verdict:'Error', error:r.fail || r.error}; refNets[p.id] = r.net; }
    ref = refNets[p.id];
  }
  setBusy('Simulating…');
  const t0 = performance.now();
  const prob = all || !p.run.benches ? p : Object.assign({}, p, {run:Object.assign({}, p.run, {benches:p.run.benches.slice(0, 1), check:undefined})});
  const results = vJudge(prob, u.net, ref);
  return {results, ms:Math.round(performance.now() - t0)};
}
async function judgeCode(mode){
  const C = ui.cp, p = CODE_BY_ID[C.id], src = $('#code-editor').value, id = p.id, all = mode === 'submit';
  if (C.busy) return;
  setCode(id, {src:src.slice(0, CODE_MAX)}); save();
  C.busy = 'Pending…'; C.ctab = 'result'; C.rcase = 0; showRun();
  let res;
  try { res = await (p.run.kind === 'c' ? judgeC : p.run.kind === 'v' ? judgeV : judgePython)(p, src, all); }
  catch (e) { res = {verdict:'Error', error:String(e && e.message || e)}; }
  if (!ui.cp || ui.cp.id !== id) return;
  const results = res.results || [], passed = results.filter(r => r.ok).length;
  const verdict = res.verdict || (passed === results.length && results.length ? 'Accepted' : 'Wrong Answer');
  C.busy = null;
  C.run = Object.assign({}, res, {mode, verdict, results, passed, total:res.error && !results.length ? 0 : results.length});
  if (all) {
    const s = state.code[id] || {};
    setCode(id, {subs:(s.subs || []).concat([{at:Date.now(), v:verdict, p:passed, t:results.length}]).slice(-20)});
    if (verdict === 'Accepted' && codeStatus(id) !== 'solved') { setCode(id, {solved:Date.now()}); toast('Accepted: ' + p.title); }
    save(); renderHeader();
    const left = $('.cstate'); if (left) left.outerHTML = codeLeftHTML();
  }
  showRun();
}

// This week's coding: one easy, one medium and one hard problem, chosen once per week from unsolved ones.
function weekCoding(){
  const wk = isoWeek(new Date()).key;
  if (!state.codeWeek || state.codeWeek.wk !== wk) {
    const rnd = rngFrom('code:' + wk);
    const ids = ['E', 'M', 'H'].map(d => {
      const all = CODING.filter(p => p.d === d), todo = all.filter(p => codeStatus(p.id) !== 'solved'), pool = todo.length ? todo : all;
      return pool[Math.floor(rnd() * pool.length)].id;
    });
    state.codeWeek = {wk, ids}; save();
  }
  return state.codeWeek.ids.filter(id => CODE_BY_ID[id]);
}

// ---------- events ----------
document.addEventListener('click', e => {
  if (e.target.closest('[data-home]')) { e.preventDefault(); goTab('quest'); return; }
  const tabBtn = e.target.closest('.navlinks button');
  if (tabBtn) { goTab(tabBtn.dataset.tab); return; }
  const pv = e.target.closest('[data-pv]');
  if (pv && !pv.disabled) { pvPick(pv.dataset.pv); return; }
  const pickBtn = e.target.closest('[data-pick]');
  if (pickBtn && !pickBtn.disabled) {
    const scope = pickBtn.closest('[data-scope]');
    if (scope && scope.dataset.scope === 'card') {
      const U = UNITS[ui.unit.id - 1], c = U.cards[ui.unit.step], key = 'u' + U.id + 'c' + ui.unit.step;
      if (ui.cardPick[key] !== undefined) return;
      const val = parsePick(pickBtn.dataset.pick);
      ui.cardPick[key] = val; record(BY_ID[c.q], val); save(); renderHeader(); renderCardCheck();
    } else pick(pickBtn.dataset.pick);
    return;
  }
  const a = e.target.closest('[data-act]');
  if (a && !a.disabled) { e.preventDefault(); act(a); return; }
  const co = e.target.closest('[data-copen]');
  if (co) {
    e.preventDefault();
    if (co.dataset.from === 'weekly') openCode(co.dataset.copen, weekCoding(), {view:'tab', tab:'weekly'});
    else openCode(co.dataset.copen, codeFiltered().map(p => p.id), {view:'tab', tab:'coding'});
    return;
  }
  const op = e.target.closest('[data-open]');
  if (op) {
    e.preventDefault();
    const id = op.dataset.open, from = op.dataset.from;
    if (from === 'weekly') { const w = state.weeks[isoWeek(new Date()).key]; openProblem(id, w ? w.ids : null, {view:'tab', tab:'weekly'}); }
    else if (ui.view === 'unit') openProblem(id, CH_IDS[ui.unit.id], {view:'unit'});
    else openProblem(id, filtered().map(Q => Q.id), {view:'tab', tab:'problems'});
  }
});
function act(a){
  const S = ui.session, P = ui.pv;
  switch (a.dataset.act) {
    case 'open-unit': openUnit(+a.dataset.u); break;
    case 'to-quest': goTab('quest'); break;
    case 'step': ui.unit.step = +a.dataset.i; render(); break;
    case 'card-prev': ui.unit.step = Math.max(0, ui.unit.step - 1); render(); window.scrollTo(0, 0); break;
    case 'card-next': {
      const key = a.dataset.key;
      if (!state.learn.cards[key]) state.learn.cards[key] = Date.now();
      save(); ui.unit.step++; render(); window.scrollTo(0, 0); break;
    }
    case 'unit-quiz': { const u = +a.dataset.u; startSession('unit', unitQuizIds(u), {unit:u, title:`Quest ${u} checkpoint · ${UNITS[u - 1].title}`, from:{view:'unit'}}); break; }
    case 'topic': { const ch = +a.dataset.ch; startSession('practice', topicIds(ch), {title:`Chapter ${ch} · ${TOPICS[ch]}`, from:ui.view === 'unit' ? {view:'unit'} : {view:'tab', tab:ui.tab}}); break; }
    case 'next':
      if (S.i === S.ids.length - 1) { if (S.feedback) finishSession(); }
      else { S.i++; $('#main').innerHTML = viewQuiz(); updateTimer(); window.scrollTo(0, 0); }
      break;
    case 'prev': S.i = Math.max(0, S.i - 1); $('#main').innerHTML = viewQuiz(); updateTimer(); break;
    case 'jump': S.i = +a.dataset.k; $('#main').innerHTML = viewQuiz(); updateTimer(); break;
    case 'submit': finishSession(); break;
    case 'quit': stopTimer(); returnFrom(S.from); break;
    case 'done-results': returnFrom(S.from); window.scrollTo(0, 0); break;
    case 'retry-missed': startSession('practice', S.ids.filter(id => !(id in S.ans) || !isCorrect(BY_ID[id], S.ans[id])), {title:'Retry the misses', from:S.from}); break;
    case 'week': startWeek(); break;
    case 'mock': startSession('mock', shuffle(BANK.map(q => q.id)).slice(0, MOCK_N), {title:'Timed mock assessment', from:{view:'tab', tab:'weekly'}}); break;
    case 'review-attempted': startSession('practice', shuffle(BANK.filter(Q => statusOf(Q.id) === 'attempted').map(Q => Q.id)).slice(0, 25), {title:'Attempted, not solved', from:{view:'tab', tab:'weekly'}}); break;
    case 'review-oa': startSession('practice', shuffle(listIds('oav')).slice(0, 20), {title:'Your OA + variants', from:{view:'tab', tab:'weekly'}}); break;
    case 'f-ch': ui.f.ch = a.dataset.v; $('#main').innerHTML = viewProblems(); break;
    case 'f-list': ui.f = Object.assign(blankFilters(), {list:a.dataset.v}); $('#main').innerHTML = viewProblems(); break;
    case 'f-list-go': ui.f = Object.assign(blankFilters(), {list:a.dataset.v}); goTab('problems'); break;
    case 'topic-filter': ui.f = Object.assign(blankFilters(), {ch:a.dataset.ch}); goTab('problems'); break;
    case 'f-reset': ui.f = blankFilters(); $('#main').innerHTML = viewProblems(); break;
    case 'cf-area': ui.cf.area = a.dataset.v; $('#main').innerHTML = viewCoding(); break;
    case 'cf-reset': ui.cf = blankCodeFilters(); $('#main').innerHTML = viewCoding(); break;
    case 'c-area-go': ui.cf = Object.assign(blankCodeFilters(), {area:a.dataset.v}); goTab('coding'); break;
    case 'cpick': {
      const list = codeFiltered(), todo = list.filter(p => codeStatus(p.id) !== 'solved'), pool = todo.length ? todo : list;
      if (pool.length) openCode(pool[Math.floor(Math.random() * pool.length)].id, list.map(p => p.id), {view:'tab', tab:'coding'});
      break;
    }
    case 'c-back': saveEditorNow(); goTab(ui.cback && ui.cback.tab ? ui.cback.tab : 'coding'); break;
    case 'c-prev': case 'c-next': {
      const C = ui.cp, i = C.list.indexOf(C.id) + (a.dataset.act === 'c-next' ? 1 : -1);
      if (i >= 0 && i < C.list.length) openCode(C.list[i], C.list);
      break;
    }
    case 'c-hint': ui.cp.hints++; $('.cstate').outerHTML = codeLeftHTML(); break;
    case 'c-ltab': ui.cp.ltab = a.dataset.v; $('.cstate').outerHTML = codeLeftHTML(); break;
    case 'c-ctab': ui.cp.ctab = a.dataset.v; showRun(); break;
    case 'c-case': ui.cp.ccase = +a.dataset.v; showRun(); break;
    case 'c-rcase': ui.cp.rcase = +a.dataset.v; showRun(); break;
    case 'c-reset': { const p = CODE_BY_ID[ui.cp.id]; $('#code-editor').value = p.starter; setCode(p.id, {src:p.starter}); save(); syncEditor(); break; }
    case 'c-run': judgeCode('run'); break;
    case 'c-submit': judgeCode('submit'); break;
    case 'c-mark': {
      saveEditorNow();
      const id = ui.cp.id;
      setCode(id, {solved:codeStatus(id) === 'solved' ? 0 : Date.now()}); save();
      $('#main').innerHTML = viewCode(); renderHeader();
      break;
    }
    case 'pick-one': {
      const list = filtered(), todo = list.filter(Q => !isSolved(Q.id)), pool = todo.length ? todo : list;
      if (pool.length) openProblem(pool[Math.floor(Math.random() * pool.length)].id, list.map(Q => Q.id), {view:'tab', tab:'problems'});
      break;
    }
    case 'pv-back': returnFrom(ui.back || {view:'tab', tab:'problems'}); break;
    case 'pv-prev': { const i = P.list.indexOf(P.id); if (i > 0) moveProblem(P.list[i - 1]); break; }
    case 'pv-next': { const i = P.list.indexOf(P.id); if (i < P.list.length - 1) moveProblem(P.list[i + 1]); break; }
    case 'pv-rand': {
      const others = P.list.filter(id => id !== P.id), todo = others.filter(id => !isSolved(id)), pool = todo.length ? todo : others;
      if (pool.length) moveProblem(pool[Math.floor(Math.random() * pool.length)]);
      break;
    }
    case 'pv-submit': pvSubmit(); break;
    case 'pv-reveal': P.reveal = true; $('#main').innerHTML = viewProblem(); break;
    case 'reset': ui.confirmReset = true; render(); break;
    case 'reset-no': ui.confirmReset = false; render(); break;
    case 'reset-yes': state = emptyState(); ui.confirmReset = false; save(); toast('Progress erased'); render(); break;
    case 'signin': signIn(); break;
    case 'signout': firebase.auth().signOut(); break;
    case 'to-progress': goTab('weekly'); { const c = $('#progress-card'); if (c) c.scrollIntoView(); } break;
    case 'export': exportProgress(); break;
    case 'import': $('#import-file').click(); break;
  }
}
function returnFrom(from){
  if (from && from.view === 'unit' && ui.unit) { ui.view = 'unit'; render(); return; }
  goTab(from && from.tab ? from.tab : 'quest');
}
document.addEventListener('input', e => {
  if (e.target.id === 'code-editor') { syncEditor(); clearTimeout(ui.codeTimer); ui.codeTimer = setTimeout(saveEditorNow, 500); return; }
  if (e.target.closest('.cfbar')) { refreshCodeRows(); return; }
  if (e.target.closest('.fbar')) readFilters();
});
// In the code editor, Tab inserts two spaces and Esc leaves the editor (so the keyboard can move on).
document.addEventListener('keydown', e => {
  if (e.target.id !== 'code-editor') return;
  if (e.key === 'Escape') { e.target.blur(); return; }
  if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'Enter' || e.key === "'")) {
    e.preventDefault();
    if (judged(CODE_BY_ID[ui.cp.id])) judgeCode(e.key === 'Enter' ? 'submit' : 'run');
    return;
  }
  if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {   // keep the line's indentation
    const t = e.target, line = t.value.slice(0, t.selectionStart).split('\n').pop(), ind = /^[ \t]*/.exec(line)[0];
    const more = /[{(\[]\s*$|\bbegin\s*$|:\s*$/.test(line) ? '  ' : '';
    e.preventDefault();
    t.setRangeText('\n' + ind + more, t.selectionStart, t.selectionEnd, 'end');
    t.dispatchEvent(new Event('input', {bubbles:true}));
    return;
  }
  if (e.key !== 'Tab' || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
  e.preventDefault();
  e.target.setRangeText('  ', e.target.selectionStart, e.target.selectionEnd, 'end');
  e.target.dispatchEvent(new Event('input', {bubbles:true}));
});
document.addEventListener('scroll', e => { if (e.target.id === 'code-editor') syncScroll(); }, true);
document.addEventListener('change', e => { if (e.target.id === 'import-file' && e.target.files[0]) importProgress(e.target.files[0]); });
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target.matches('input, select, textarea, button, summary, a')) return;
  const k = e.key.toLowerCase();
  let Q, btns;
  if (ui.view === 'quiz') { Q = BY_ID[ui.session.ids[ui.session.i]]; btns = Array.from(document.querySelectorAll('.opts[data-scope="quiz"] [data-pick]:not(:disabled)')); }
  else if (ui.view === 'problem') { Q = BY_ID[ui.pv.id]; btns = Array.from(document.querySelectorAll('.opts[data-scope="pv"] [data-pv]:not(:disabled)')); }
  else return;
  let idx = k.length === 1 ? '1234'.indexOf(k) : -1;
  if (idx < 0 && k.length === 1) idx = 'abcd'.indexOf(k);
  if (Q.k === 't' && (k === 't' || k === 'f')) idx = k === 't' ? 0 : 1;
  if (idx >= 0 && btns[idx]) {
    e.preventDefault();
    if (ui.view === 'quiz') pick(btns[idx].dataset.pick); else pvPick(btns[idx].dataset.pv);
    return;
  }
  if (k !== 'enter') return;
  if (ui.view === 'quiz' && ui.session.feedback) { const nb = $('[data-act="next"]:not(:disabled)'); if (nb) { e.preventDefault(); nb.click(); } }
  if (ui.view === 'problem') { const b = $('[data-act="pv-submit"]:not(:disabled)') || $('.pvactions [data-act="pv-next"]:not(:disabled)'); if (b) { e.preventDefault(); b.click(); } }
});

// ---------- boot ----------
const local = lsLoad();
if (local) state = normalize(local);
(function readHash(){
  const h = location.hash.replace('#', ''), m = /^p(\d+)$/.exec(h);
  const cm = /^code(\d+)$/.exec(h);
  if (TABS.includes(h)) ui.tab = h;
  if (cm && CODING[+cm[1] - 1]) { ui.tab = 'coding'; ui.cback = {view:'tab', tab:'coding'}; ui.cp = blankCodePage(CODING[+cm[1] - 1].id, CODING.map(p => p.id)); ui.view = 'code'; }
  else if (h === 'learn') ui.tab = 'quest';
  else if (h === 'practice') ui.tab = 'weekly';
  else if (h === 'bank') ui.tab = 'problems';
  if (m && BANK[+m[1] - 1]) { ui.tab = 'problems'; ui.back = {view:'tab', tab:'problems'}; ui.pv = {id:BANK[+m[1] - 1].id, list:BANK.map(Q => Q.id), pick:undefined, result:null, reveal:false, perm:shuffle([0, 1, 2, 3])}; ui.view = 'problem'; }
})();
render();
setSync(store.status);
initStore();
initAccounts();
})();
