(function(){
'use strict';

// ---------- data ----------
const TOPICS = {1:'Electricity',2:'Capacitors & signals',3:'Heat',4:'Semiconductors',5:'MOSFETs',6:'Analog',7:'Binary & number formats',8:'CMOS gates',9:'Combinational logic',10:'Latches & flip-flops',11:'Timing',12:'Counters & FSMs',13:'Delay',14:'Power',15:'PVT & temperature',16:'Wires & links',17:'Manufacturing',18:'Memory circuits',19:'RTL & verification',20:'Architecture',21:'GPUs & number formats',22:'Computer arithmetic'};
const DIFF = {E:'Easy', M:'Medium', H:'Hard'};
const ROMAN = ['I','II','III','IV','V','VI','VII'];
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
  {key:'sk-gpu', name:'GPUs and CUDA', ch:[21]}
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
    {req:'Basic C, C++, Python, Perl or MATLAB', v:'partial', book:'Chapter 23 covers C and Python for hardware engineers; Perl and MATLAB are not taught', list:null, todo:'This trainer is hardware only, as you asked. Keep coding practice separate (your OA coding question was a linked list).'},
    {req:'Problem solving, adaptability, and the desire to learn new concepts and tools', v:'good', book:'Chapter 24 (aptitude and puzzles) and Chapter 25 (a full practice assessment)', list:null, todo:'Weekly sets and the timed mock build this habit.'}
  ]},
  {group:'Ways to stand out', items:[
    {req:'Understanding of CMOS transistors and circuits', v:'strong', book:'Chapters 4, 5, 6 and 8', list:'sk-cmos', todo:'Most of your OA questions came from here. Keep the swapped-inverter and pass-transistor sets at 100%.'},
    {req:'Understanding of VLSI design', v:'strong', book:'Chapters 8, 13, 16, 17 and 18 (gates, delay, wires, manufacturing, memory)', list:'sk-vlsi', todo:'Deeper topics (DIBL, subthreshold slope, CRPR, keepers) are in the trainer as beyond-the-book problems.'},
    {req:'Understanding of computer architecture', v:'good', book:'Chapters 18, 20 and 21 (memory, pipelines, caches, GPUs)', list:'sk-arch', todo:'Out-of-order execution and register renaming appear only as beyond-the-book problems.'},
    {req:'Understanding of computer arithmetic', v:'strong', book:'Chapter 22: overflow and saturation, shifters, fast and carry-save adders, multipliers and Booth recoding, division, fixed point, floating-point addition, multiplication and rounding. Number formats in Chapters 7 and 21', list:'sk-arith', todo:'Do Quest 22, then build the BF16 processing element of Appendix D Project 2 and check it against a reference model.'},
    {req:'Basic Verilog, SystemVerilog or VHDL', v:'good', book:'Chapter 19: Verilog, SystemVerilog, CDC, FIFOs, and a verification section (self-checking testbenches, constrained-random tests, assertions, coverage, formal, UVM). VHDL is not taught', list:'sk-hdl', todo:'Multiple choice cannot teach you to write RTL. Keep writing and verifying it in HDLBits and the companion books; VHDL is easy to pick up once Verilog is solid.'},
    {req:'Background in CUDA or OpenCL', v:'good', book:'Chapter 21 (CUDA model, warps, memory hierarchy); OpenCL is only named', list:'sk-gpu', todo:'Write and profile one small CUDA kernel, as in the Appendix D GPU project.'},
    {req:'Initiative in AI, machine learning, computer vision, robotics or parallel computing', v:'partial', book:'Chapters 20–21 cover parallelism and AI hardware (tensor cores, low-precision formats, roofline). Machine learning itself, vision and robotics are not covered', list:'sk-gpu', todo:'Show this with a project rather than a quiz.'},
    {req:'Basic mechanical CAD (CATIA, Siemens NX, SolidWorks, Creo)', v:'none', book:'Not taught. Appendix D Project 7 suggests a heat-sink design in SolidWorks or Onshape, sized with Chapter 3', list:null, todo:'This matters for mechanical and thermal teams, not for the OA. Do Project 7 only if those teams interest you.'},
    {req:'Looking for a first industry internship', v:'na', book:'Not applicable', list:null, todo:'Eligibility, not study material.'}
  ]}
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
const emptyState = () => ({v:2, updatedAt:0, q:{}, weeks:{}, hist:[], learn:{cards:{}, units:{}, mux:{}}});
function normalize(s){
  const e = emptyState();
  if (!s || typeof s !== 'object') return e;
  e.updatedAt = +s.updatedAt || 0;
  if (s.q && typeof s.q === 'object') e.q = s.q;
  if (s.weeks && typeof s.weeks === 'object') e.weeks = s.weeks;
  if (Array.isArray(s.hist)) e.hist = s.hist;
  const l = s.learn || {};
  e.learn = {cards:l.cards || {}, units:l.units || {}, mux:l.mux || {}};
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
const TABS = ['quest', 'problems', 'weekly', 'jobs'];
const blankFilters = () => ({q:'', ch:'all', d:'all', status:'all', type:'all', list:'all'});
const ui = {tab:'quest', view:'tab', session:null, unit:null, pv:null, back:null, cardPick:{}, cardPerm:{}, f:blankFilters(), confirmReset:false, timer:null};
function setHash(h){ try { history.replaceState(null, '', '#' + h); } catch (e) { /* ignore */ } }
function goTab(t){
  ui.tab = t; ui.view = 'tab'; stopTimer(); setHash(t);
  render(); window.scrollTo(0, 0);
}

// ---------- shared pieces ----------
function renderHeader(){
  const solved = solvedIn(BANK.map(Q => Q.id));
  $('#solved').innerHTML = ring(solved / BANK.length, 22, 3.5, `${solved} of ${BANK.length} solved`) + `<span><b>${solved}</b><span class="muted">/${BANK.length}</span> solved</span>`;
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
  m.className = 'wrap main' + (ui.view === 'tab' && ui.tab === 'problems' ? ' wide' : '');
  if (ui.view === 'quiz') { m.innerHTML = viewQuiz(); updateTimer(); }
  else if (ui.view === 'results') m.innerHTML = viewResults();
  else if (ui.view === 'unit') { m.innerHTML = viewUnit(); afterUnitRender(); }
  else if (ui.view === 'problem') m.innerHTML = viewProblem();
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
    <section class="card"><h2>Past weeks</h2>${weeks.length ? `<div class="hist">${weeks.map(k => `<div><span>${k.replace('-W', ' · week ')}</span><span class="mono">${state.weeks[k].score}/${state.weeks[k].ids.length}</span></div>`).join('')}</div>` : '<p class="muted">Finished weekly sets show up here.</p>'}</section>
    <section class="card"><div class="row between"><div><h2>Your progress</h2><p class="muted">${esc(store.status)}.</p></div>
      ${ui.confirmReset ? '<div class="row"><span>Erase all progress?</span><button type="button" class="btn small" data-act="reset-yes">Erase everything</button><button type="button" class="btn small primary" data-act="reset-no">Keep my progress</button></div>' : '<button type="button" class="btn small ghost" data-act="reset">Reset progress</button>'}</div></section>`;
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
    <p><b>Bottom line:</b> every hardware topic in the posting (CMOS, VLSI, timing, power, computer architecture, computer arithmetic, Verilog and verification, GPUs) is taught in the book and practiced here, and every question from your OA has many variants. What remains is outside multiple choice: VHDL, Perl and MATLAB are not taught, mechanical CAD is only a suggested project, and clubs, projects and coding are things you show on your resume.</p></div></section>
    <section class="card"><h2>Your OA questions</h2><p class="muted">Every question you reported is in the bank word for word, plus variants that test the same idea from other angles.</p>
    <div class="tablewrap"><table class="rtable"><thead><tr><th>OA topic</th><th>Book</th><th>Exact</th><th>Variants</th><th>Practice</th></tr></thead><tbody>${oaRows}</tbody></table></div>
    <p class="muted small">Your coding question (a linked list) is taught in Chapter 23; this trainer is hardware only.</p></section>
    <section class="card"><h2>Topics other candidates reported</h2><p class="muted">Every topic from the book's "Seen on the assessment" boxes, where the book teaches it, and the problems that drill it. ${listCell('rep')} carry the reported tag.</p>
    <div class="tablewrap"><table class="rtable"><thead><tr><th>Reported topic</th><th>Book</th><th>Practice</th></tr></thead><tbody>${repRows}</tbody></table></div></section>`;
  REVIEW.forEach(g => {
    html += `<section class="card"><h2>${esc(g.group)}</h2><div class="reviews">`;
    g.items.forEach(it => {
      const [label, cls] = VERDICT[it.v];
      html += `<article class="review"><div class="rhead"><b>${esc(it.req)}</b><span class="vpill ${cls}">${label}</span></div>
        <dl><div><dt>In the book</dt><dd>${esc(it.book)}</dd></div><div><dt>In this trainer</dt><dd>${listCell(it.list)}</dd></div><div><dt>What to do</dt><dd>${esc(it.todo)}</dd></div></dl></article>`;
    });
    html += '</div></section>';
  });
  html += `<section class="card"><h2>Internship teams in the posting</h2><p class="muted">The quests that matter most for each team.</p><div class="areas">` +
    AREAS.map(a => `<div class="area"><b>${esc(a.name)}</b><div class="row">${a.ch.map(c => `<button type="button" class="topicchip" data-act="open-unit" data-u="${c}">Quest ${c} · ${esc(TOPICS[c])}</button>`).join('')}</div></div>`).join('') + '</div></section>';
  return html;
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
  }
}
function returnFrom(from){
  if (from && from.view === 'unit' && ui.unit) { ui.view = 'unit'; render(); return; }
  goTab(from && from.tab ? from.tab : 'quest');
}
document.addEventListener('input', e => { if (e.target.closest('.fbar')) readFilters(); });
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
  if (TABS.includes(h)) ui.tab = h;
  else if (h === 'learn') ui.tab = 'quest';
  else if (h === 'practice') ui.tab = 'weekly';
  else if (h === 'bank') ui.tab = 'problems';
  if (m && BANK[+m[1] - 1]) { ui.tab = 'problems'; ui.back = {view:'tab', tab:'problems'}; ui.pv = {id:BANK[+m[1] - 1].id, list:BANK.map(Q => Q.id), pick:undefined, result:null, reveal:false, perm:shuffle([0, 1, 2, 3])}; ui.view = 'problem'; }
})();
render();
setSync(store.status);
initStore();
})();
