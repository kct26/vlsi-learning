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
const MOCK_N = 15, MOCK_MIN = 50, UNIT_N = 5, UNIT_PASS = 4;
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
// The parts of VLSI, grouped the way the industry splits the work. Each area is a set of book chapters.
const VLSI_AREAS = [
  {group:'Devices and circuits', items:[
    {key:'va-dev', name:'Devices and process technology', ch:[4, 5]},
    {key:'va-ana', name:'Analog and mixed-signal basics', ch:[1, 2, 6]},
    {key:'va-mem', name:'Memory design (SRAM, DRAM, flash)', ch:[18]}]},
  {group:'Front-end design', items:[
    {key:'va-logic', name:'Digital logic and CMOS gates', ch:[7, 8, 9]},
    {key:'va-seq', name:'Sequential design and FSMs', ch:[10, 12]},
    {key:'va-rtl', name:'RTL design and verification', ch:[19]},
    {key:'va-arch', name:'Computer architecture and GPUs', ch:[20, 21]},
    {key:'va-arith', name:'Datapath and computer arithmetic', ch:[22]}]},
  {group:'Back-end and signoff', items:[
    {key:'va-sta', name:'Static timing analysis', ch:[11, 13]},
    {key:'va-pwr', name:'Power, thermal and PVT', ch:[3, 14, 15]},
    {key:'va-si', name:'Interconnect and signal integrity', ch:[16]},
    {key:'va-pd', name:'Physical design, DFT and manufacturing', ch:[17]}]},
  {group:'Tools', items:[
    {key:'va-eda', name:'EDA tools, Linux and scripting', ch:[23]}]}
];
VLSI_AREAS.forEach(g => g.items.forEach(a => { LISTS[a.key] = {name:a.name, test:Q => a.ch.includes(Q.ch)}; }));
// The quest map as a VLSI theory roadmap: one stage per part of the book, in learning order.
const ROADMAP = {
  1:{stage:'Circuit foundations', area:'Analog basics', goal:'Read any circuit: Ohm\'s and Kirchhoff\'s laws, RC time constants, and why chips get hot.'},
  2:{stage:'Semiconductor devices', area:'Devices', goal:'Explain how a MOSFET switches and amplifies: doping, threshold voltage, operating regions.'},
  3:{stage:'CMOS logic design', area:'Front-end', goal:'Build any Boolean function in static CMOS and reason about its transistors.'},
  4:{stage:'Sequential logic and timing', area:'Front-end · STA', goal:'Design with latches, flip-flops and FSMs, and check setup and hold timing.'},
  5:{stage:'Delay, power and variation', area:'Signoff', goal:'Estimate gate delay and dynamic and leakage power, and how PVT corners move them.'},
  6:{stage:'Physical design and silicon', area:'Back-end', goal:'Handle interconnect RC and crosstalk, manufacturing, test (DFT) and memory arrays.'},
  7:{stage:'RTL, architecture and arithmetic', area:'Front-end', goal:'Write and verify RTL, cross clock domains, and design datapaths for CPUs and GPUs.'},
  8:{stage:'Engineering tools', area:'EDA and CAD', goal:'Automate flows the way design teams do: C, Python, Linux, Tcl and git.'}
};
const listIds = key => BANK.filter(LISTS[key].test).map(Q => Q.id);

// What hardware internship and new-grad postings ask for, checked against the book and this trainer.
const VERDICT = {strong:['Strong match', 'ok'], good:['Good match', 'ok'], partial:['Partial', 'warn'], none:['Not covered', 'bad'], na:['Not study material', '']};
const SKILL_REVIEW = [
  {req:'Hardware basics: circuits and digital logic', v:'strong', book:'Chapters 1–12 build hardware from zero', list:'sk-basics', todo:'Work through roadmap stages 1–4, then practice those areas in Theory.'},
  {req:'CMOS transistors and circuits', v:'strong', book:'Chapters 4, 5, 6 and 8', list:'sk-cmos', todo:'The most common screening questions live here: inverters, pass transistors, sizing. Keep these sets near 100%.'},
  {req:'VLSI design', v:'strong', book:'Chapters 8, 13, 16, 17 and 18 (gates, delay, wires, manufacturing, memory)', list:'sk-vlsi', todo:'Deeper topics (DIBL, subthreshold slope, CRPR, keepers) are practiced as beyond-the-book problems.'},
  {req:'Static timing and physical design', v:'strong', book:'Chapters 11, 13, 15, 16 and 17', list:'sk-pd', code:['Physical design'], todo:'Run an open flow (OpenLane or Tiny Tapeout) and read its timing reports.'},
  {req:'Power and thermal', v:'strong', book:'Chapters 3, 14 and 15', list:'sk-power', todo:'Know dynamic and leakage power cold, and how voltage, frequency and temperature move them.'},
  {req:'Computer architecture', v:'good', book:'Chapters 18, 20 and 21 (memory, pipelines, caches, GPUs)', list:'sk-arch', todo:'Out-of-order execution and register renaming appear only as beyond-the-book problems.'},
  {req:'Computer arithmetic', v:'strong', book:'Chapter 22: adders, multipliers and Booth recoding, division, fixed and floating point, rounding', list:'sk-arith', todo:'Pair it with the RTL problems: an ALU, a leading-zero counter, a multiplier.'},
  {req:'Verilog, SystemVerilog or VHDL', v:'good', book:'Chapter 19: Verilog, SystemVerilog, CDC, FIFOs and verification. VHDL is not taught', list:'sk-hdl', code:['RTL design', 'Verification'], todo:'Solve the judged RTL problems here. VHDL is quick to pick up once Verilog is solid.'},
  {req:'Programming: C, C++, Python, Perl or MATLAB', v:'good', book:'Chapter 23 covers C and Python basics; the rest are taught as beyond-the-book problems', list:'sk-prog', code:['C and C++', 'Python and MATLAB'], todo:'Keep solving one linked-list or bit-manipulation problem a week.'},
  {req:'Linux, scripting and version control', v:'good', book:'Chapter 23 and beyond-the-book problems (shell, git, make, Tcl, Perl)', list:'sk-prog', code:['Linux and scripting'], todo:'Live in a Linux terminal for a week; script one real task in Python or Tcl.'},
  {req:'GPU programming: CUDA or OpenCL', v:'good', book:'Chapter 21 (CUDA model, warps, memory hierarchy); OpenCL is only named', list:'sk-gpu', code:['GPU and CUDA'], todo:'Run the CUDA problems on a real GPU (Google Colab works).'},
  {req:'Problem solving and aptitude', v:'good', book:'Chapter 24 (aptitude and puzzles) and Chapter 25 (a full practice assessment)', list:null, todo:'The timed mock in Theory builds this habit; keep a daily streak going.'},
  {req:'Projects, clubs and leadership', v:'partial', book:'Appendix D gives resume projects matched to hardware teams', list:null, todo:'Study material cannot show this on a resume. Finish one Appendix D project and write it up.'},
  {req:'Mechanical CAD (CATIA, NX, SolidWorks, Creo)', v:'none', book:'Not taught. Appendix D Project 7 suggests a heat-sink design', list:null, todo:'Only matters for mechanical and thermal roles; take a CAD course if you aim there.'}
];
// Hardware roles across the industry, with the quests and coding track that prepare for each.
const ROLES = [
  {name:'ASIC Design (RTL)', fit:'Strong', ch:[9, 10, 11, 12, 19, 22], code:'RTL design', what:'Write the Verilog or SystemVerilog that becomes the chip: datapaths, control, FIFOs and clock-domain crossings.', add:'Write RTL every week and build the Appendix D processor and systolic-array projects.'},
  {name:'Design Verification', fit:'Good', ch:[19, 12, 10], code:'Verification', what:'Prove the RTL works before tape-out with testbenches, constrained-random tests, assertions and coverage.', add:'Real SystemVerilog testbenches, assertions and coverage, then UVM or cocotb; verify your own projects.'},
  {name:'Physical Design and Timing', fit:'Good', ch:[11, 13, 15, 16, 17], code:'Physical design', what:'Turn the netlist into layout: floorplan, placement, clock trees, routing, and closing timing at every corner.', add:'Run an open flow (OpenLane/OpenROAD or Tiny Tapeout) and read its timing reports; script in Tcl.'},
  {name:'Power and Thermal', fit:'Strong', ch:[3, 14, 15], code:'Python and MATLAB', what:'Model, measure and reduce power across voltage, frequency and temperature.', add:'Measure a real chip\'s power and fit it to the power model (Appendix D Project 6); analyze data in Python.'},
  {name:'Architecture and Performance', fit:'Good', ch:[18, 20, 21], code:'GPU and CUDA', what:'Decide what the next chip should be, using performance models, simulators and benchmarks.', add:'Build performance models in C++ or Python and optimize CUDA kernels (Appendix D Project 4).'},
  {name:'Post-silicon Validation', fit:'Good', ch:[10, 11, 16, 17, 23], code:'Linux and scripting', what:'Bring up first silicon in the lab and find the bugs that escaped verification.', add:'Get comfortable with lab tools (oscilloscope, logic analyzer) and scripting test automation.'},
  {name:'CAD and Hardware Infrastructure', fit:'Good', ch:[20, 23], code:'Linux and scripting', what:'Build the flows, scripts and regression systems that design teams run every day.', add:'Automate flows with Python, Perl and Linux tools; learn job schedulers and regression systems.'},
  {name:'Firmware and Embedded C', fit:'Good', ch:[7, 20, 23], code:'C and C++', what:'Write the low-level software that boots and controls the hardware: drivers, registers and interrupts.', add:'Write drivers for a microcontroller or FPGA soft core: registers, interrupts and ring buffers.'},
  {name:'Custom Circuit Design (SRAM, analog, SerDes)', fit:'Medium', ch:[5, 6, 8, 18], code:null, what:'Design transistor-level circuits where standard cells are not enough.', add:'Deeper analog design (Razavi) and SPICE simulation (Appendix D Project 5).'},
  {name:'DFT (Design for Test)', fit:'Medium', ch:[17, 10], code:'RTL design', what:'Add scan chains, BIST and compression so every manufactured chip can be tested.', add:'Scan insertion, ATPG and memory BIST in depth.'},
  {name:'Signal and Power Integrity, Boards', fit:'Medium', ch:[2, 16], code:'Python and MATLAB', what:'Make sure fast signals and power arrive clean across packages and boards.', add:'PCB design (KiCad), SI/PI simulation and lab measurements with an oscilloscope.'},
  {name:'Mechanical and Thermal', fit:'Light', ch:[3], code:null, what:'Design heat sinks, enclosures and cooling for chips and systems.', add:'CAD and thermal simulation (Appendix D Project 7).'}
];
// NVIDIA's internship teams (shown on NVIDIA's company page), with the quests that matter most for each.
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
const emptyState = () => ({v:2, updatedAt:0, q:{}, weeks:{}, hist:[], learn:{cards:{}, units:{}, mux:{}}, code:{}, codeWeek:null, log:[], oa:null, oaHist:[]});
const LOG_MAX = 5000;   // submissions kept for the profile's heatmap, streaks and recent list
// Rebuilds a submission log from older saves that predate it: one entry per answered problem and per code submission.
function backfillLog(e){
  const log = [];
  Object.keys(e.q).forEach(id => { const x = e.q[id]; if (x && x.at) log.push([x.at, id, x.ok ? 1 : 0]); });
  Object.keys(e.code).forEach(id => (e.code[id].subs || []).forEach(u => log.push([u.at, id, u.v === 'Accepted' ? 1 : 0])));
  return log.sort((a, b) => a[0] - b[0]).slice(-LOG_MAX);
}
// Saved progress can come from this browser, the account, or an imported file, so every field is rebuilt
// with the type it should have. Text that will be shown is limited to known values; the rest are numbers.
const num = v => { const n = +v; return isFinite(n) && n >= 0 ? n : 0; };
const knownId = id => typeof id === 'string' && (id in BY_ID || CODING.some(p => p.id === id));
const VERDICTS = ['Accepted', 'Wrong Answer', 'Compile Error', 'Runtime Error', 'Time Limit Exceeded', 'Error'];
function normalize(s){
  const e = emptyState();
  if (!s || typeof s !== 'object') return e;
  e.updatedAt = num(s.updatedAt);
  if (s.q && typeof s.q === 'object') Object.keys(s.q).forEach(id => { const x = s.q[id]; if (knownId(id) && x && typeof x === 'object') e.q[id] = {n:num(x.n), c:num(x.c), ok:!!x.ok, at:num(x.at)}; });
  if (s.weeks && typeof s.weeks === 'object') e.weeks = s.weeks;   // no longer shown; kept so older saves round-trip
  if (Array.isArray(s.hist)) e.hist = s.hist.filter(h => h && typeof h === 'object').slice(0, 60)
    .map(h => ({at:num(h.at), mode:['mock', 'unit', 'practice', 'week'].includes(h.mode) ? h.mode : 'practice', label:String(h.label || '').slice(0, 120), score:num(h.score), total:num(h.total)}));
  const l = s.learn && typeof s.learn === 'object' ? s.learn : {}, obj = o => o && typeof o === 'object' ? o : {};
  Object.keys(obj(l.cards)).forEach(k => { if (/^u\d+c\d+$/.test(k)) e.learn.cards[k] = num(l.cards[k]); });
  Object.keys(obj(l.units)).forEach(k => { const x = obj(l.units[k]); if (/^\d+$/.test(k)) e.learn.units[k] = {best:num(x.best), passed:num(x.passed)}; });
  Object.keys(obj(l.mux)).forEach(k => { if (/^\w{1,12}$/.test(k)) e.learn.mux[k] = num(l.mux[k]); });
  if (s.code && typeof s.code === 'object') Object.keys(s.code).forEach(id => {
    const x = s.code[id]; if (!knownId(id) || !x || typeof x !== 'object') return;
    e.code[id] = {src:typeof x.src === 'string' ? x.src.slice(0, CODE_MAX) : null, solved:num(x.solved), at:num(x.at)};
    if (Array.isArray(x.subs)) e.code[id].subs = x.subs.filter(u => u && VERDICTS.includes(u.v)).slice(-20).map(u => ({at:num(u.at), v:u.v, p:num(u.p), t:num(u.t)}));
  });
  if (s.codeWeek && s.codeWeek.wk) e.codeWeek = s.codeWeek;
  if (Array.isArray(s.oaHist)) e.oaHist = s.oaHist.filter(h => h && typeof h === 'object' && CO_BY_ID[h.co]).slice(0, 30)
    .map(h => ({at:num(h.at), co:h.co, right:num(h.right), wrong:num(h.wrong), n:num(h.n), codeDone:num(h.codeDone), codeN:num(h.codeN), score:num(h.score), total:num(h.total), pct:Math.min(100, num(h.pct)), used:num(h.used), neg:!!h.neg}));
  if (s.oa && typeof s.oa === 'object' && CO_BY_ID[s.oa.co] && Array.isArray(s.oa.items)) {
    const items = s.oa.items.filter(x => x && ((x.t === 'q' && BY_ID[x.id]) || (x.t === 'c' && CODING.some(p => p.id === x.id)))).map(x => ({t:x.t, id:x.id, s:num(x.s)}));
    if (items.length) {
      const o = {co:s.oa.co, start:num(s.oa.start), end:num(s.oa.end), neg:!!s.oa.neg, items, perm:{}, ans:{}, src:{}, flag:{}, i:Math.min(num(s.oa.i), items.length - 1)};
      const P = obj(s.oa.perm), An = obj(s.oa.ans), Sr = obj(s.oa.src), F = obj(s.oa.flag);
      items.forEach(x => {
        if (x.t === 'q') {
          const p = P[x.id]; o.perm[x.id] = Array.isArray(p) && p.length === 4 && [0, 1, 2, 3].every(d => p.includes(d)) ? p.map(Number) : [0, 1, 2, 3];
          const a = An[x.id]; if (typeof a === 'boolean' || [0, 1, 2, 3].includes(a)) o.ans[x.id] = a;
        } else if (typeof Sr[x.id] === 'string') o.src[x.id] = Sr[x.id].slice(0, CODE_MAX);
        if (F[x.id]) o.flag[x.id] = 1;
      });
      e.oa = o;
    }
  }
  e.log = Array.isArray(s.log) ? s.log.filter(x => Array.isArray(x) && x.length === 3 && knownId(x[1])).map(x => [num(x[0]), x[1], x[2] ? 1 : 0]).slice(-LOG_MAX) : backfillLog(e);
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
  const lk = {};
  m.log.concat(o.log).forEach(x => { lk[x[0] + '|' + x[1]] = x; });
  m.log = Object.values(lk).sort((a, b) => a[0] - b[0]).slice(-LOG_MAX);
  const hk = {};
  m.oaHist.concat(o.oaHist).forEach(h => { hk[h.at] = h; });
  m.oaHist = Object.values(hk).sort((x, y) => y.at - x.at).slice(0, 30);
  if (o.oa && (!m.oa || o.oa.start > m.oa.start)) m.oa = o.oa;
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
  if (!STANDALONE || !window.FIREBASE_CONFIG) { renderAccount(); return; }
  try {
    if (!window.firebase) for (const m of ['app', 'auth', 'firestore']) await loadScript(`https://www.gstatic.com/firebasejs/${FB_VERSION}/firebase-${m}-compat.js`);
    firebase.initializeApp(window.FIREBASE_CONFIG);
    acct.ready = true;
    firebase.auth().onAuthStateChanged(onAuth);
    if (ui.view === 'tab' && ui.tab === 'home') render();
  } catch (e) { acct.ready = false; acct.failed = true; render(); }   // if accounts cannot load, the site stays open
  renderAccount();
}
async function onAuth(user){
  acct.user = user || null; acct.ref = null; acct.known = true;
  if (user && ui.auth) closeAuth(true);
  if (user && ui.after) { Object.assign(ui, ui.after); ui.after = null; }   // go where they were heading before signing in
  if (!user && ui.after) openAuth();
  if (!user && ui.view === 'tab' && ui.tab === 'home') render();
  if (user && ui.tab === 'admin' && !ui.adm) setTimeout(loadAdmin, 0);
  if (!user) { if (premium.loaded || premium.status !== 'none') { clearPremium(); premium.status = 'none'; premium.mine = null; } store.mode = 'local'; setSync('Saved in this browser'); renderAccount(); if (ui.tab === 'profile' && ui.view === 'tab') render(); return; }
  if (needsVerify()) { store.mode = 'local'; setSync('Verify your email to save to your account'); renderAccount(); render(); return; }
  setSync('Syncing…');
  try {
    const ref = firebase.firestore().collection('users').doc(user.uid);
    const snap = await ref.get();
    if (snap.exists && snap.data().state) state = mergeStates(state, JSON.parse(snap.data().state));
    acct.ref = ref; store.mode = 'cloud';
    lsSave(); render(); cloudFlush();
    loadPremium();
  } catch (e) { store.mode = 'local'; setSync('Could not reach your account; saved in this browser'); }
  renderAccount();
}
function cloudFlush(){
  if (store.mode !== 'cloud' || !acct.ref) return;
  const u = acct.user || {};
  // name and email let the owner's admin dashboard tell accounts apart (see the Privacy page)
  const md = u.metadata || {}, prov = ((u.providerData || [])[0] || {}).providerId || '';
  const body = {state:JSON.stringify(state), updatedAt:state.updatedAt || Date.now(), name:String(u.displayName || '').slice(0, 100), email:String(u.email || '').slice(0, 200),
    provider:String(prov).slice(0, 40), created:Date.parse(md.creationTime) || 0, lastLogin:Date.parse(md.lastSignInTime) || 0};
  acct.chain = acct.chain.then(() => acct.ref.set(body)).then(() => setSync('Saved to your account'))
    .catch(() => { setSync('Saving failed; will retry'); clearTimeout(acct.timer); acct.timer = setTimeout(cloudFlush, 5000); });
}
function renderAccount(){
  const el = $('#acct'); if (!el) return;
  const u = acct.user;
  const me = `<button type="button" class="avatar${u ? '' : ' guest'}" data-act="to-progress" title="${u ? 'Signed in as ' + esc(u.email || u.displayName || 'you') : 'Your profile'}" aria-label="Your profile">` +
    (u && u.photoURL ? `<img src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">` : u ? esc(((u.displayName || u.email || '?')[0] || '?').toUpperCase()) : '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>') + '</button>';
  el.innerHTML = (acct.ready && !u ? '<button type="button" class="acctbtn" data-act="signin">Sign in</button>' : '') + me;
}

// Deletes the signed-in account: first its progress document (which only that account may delete), then the login.
async function deleteAccount(){
  const u = acct.user; if (!u) return;
  const doc = firebase.firestore().collection('users').doc(u.uid);
  store.mode = 'local'; acct.ref = null;   // stop syncing before the document goes
  try {
    await doc.delete();
    try { await u.delete(); }
    catch (e) {
      if (!e || e.code !== 'auth/requires-recent-login') throw e;
      const google = (u.providerData || []).some(p => p.providerId === 'google.com');
      if (!google) { toast('Your progress was deleted. To delete the login too, sign out, sign in again, and press Delete once more.'); await firebase.auth().signOut(); return; }
      await u.reauthenticateWithPopup(new firebase.auth.GoogleAuthProvider());
      await u.delete();
    }
    state = emptyState(); lsSave();
    toast('Your account and its saved progress were deleted.');
    render();
  } catch (e) { toast('Delete failed: ' + ((e && e.message) || e)); render(); }
}

// ---------- backup file ----------
function exportProgress(){
  const blob = new Blob([JSON.stringify(state, null, 1)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'hardcode-progress-' + new Date().toISOString().slice(0, 10) + '.json';
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
  } catch (e) { toast('That file is not a HardCode progress file.'); }
}

// ---------- progress ----------
const statusOf = id => { const s = state.q[id]; return !s ? 'todo' : (s.c > 0 ? 'solved' : 'attempted'); };
const isSolved = id => statusOf(id) === 'solved';
const solvedIn = ids => ids.filter(isSolved).length;
function record(Q, choice){
  const ok = isCorrect(Q, choice);
  const s = state.q[Q.id] || (state.q[Q.id] = {n:0, c:0, ok:false, at:0});
  s.n++; if (ok) s.c++; s.ok = ok; s.at = Date.now();
  logSubmit(Q.id, ok);
  return ok;
}
function logSubmit(id, ok){ state.log.push([Date.now(), id, ok ? 1 : 0]); if (state.log.length > LOG_MAX) state.log.splice(0, state.log.length - LOG_MAX); }
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
const TABS = ['home', 'theory', 'coding', 'oa', 'quest', 'companies', 'roles', 'profile', 'privacy', 'admin', 'premium'];
const blankFilters = () => ({q:'', ch:'all', d:'all', status:'all', type:'all', list:'all', co:'all'});
const ui = {tab:'home', co:null, coq:'', auth:null, home:{word:0, tab:1, tryi:0, faq:0, tryv:{v:0.9, f:2, b:5, T:1, l:0.6, x:200}, timers:[]}, view:'tab', session:null, unit:null, pv:null, back:null, cardPick:{}, cardPerm:{}, f:blankFilters(), confirmReset:false, timer:null, cf:null, cp:null, cback:null, codeTimer:null};
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
function rowsHTML(ids, cols, from){
  return ids.map(id => {
    const Q = BY_ID[id];
    return `<tr data-open="${id}"${from ? ` data-from="${from}"` : ''}><td class="c-st">${statusCell(id)}</td><td class="c-ti"><a href="#p${Q.n}" data-open="${id}" title="${esc(Q.q)}">${Q.n}. ${esc(Q.q)}</a><span class="tags">${tagChips(Q)}</span></td>` +
      (cols === 'compact' ? '' : `<td class="c-tp">${esc(TOPICS[Q.ch])}</td><td class="c-ty">${Q.k === 'm' ? 'MCQ' : 'T/F'}</td><td class="c-co">${coMini(id)}</td>`) +
      `<td class="c-df"><span class="dbadge d-${Q.d}">${DIFF[Q.d]}</span></td></tr>`;
  }).join('');
}
function tableHTML(ids, cols, bodyId, from){
  const head = cols === 'compact' ? '<th class="c-st">Status</th><th class="c-ti">Problem</th><th class="c-df">Difficulty</th>' :
    '<th class="c-st">Status</th><th class="c-ti">Problem</th><th class="c-tp">Topic</th><th class="c-ty">Type</th><th class="c-co">Companies</th><th class="c-df">Difficulty</th>';
  return `<div class="tablewrap"><table class="ptable${cols === 'compact' ? ' compact' : ''}"><thead><tr>${head}</tr></thead><tbody${bodyId ? ` id="${bodyId}"` : ''}>${ids.length ? rowsHTML(ids, cols, from) : `<tr><td colspan="6" class="empty">No problems here.</td></tr>`}</tbody></table></div>`;
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

// On the standalone site with accounts turned on, signed-out visitors can only see Home (and Privacy).
// Anything else opens sign-in and comes back to it afterwards. This guards the experience, not the content:
// the whole trainer is in the page source, which a static site cannot hide.
const OPEN_TABS = ['home', 'privacy', 'premium'];
const gated = () => STANDALONE && !!window.FIREBASE_CONFIG && !acct.failed && !acct.user;
function render(){
  if (gated() && !(ui.view === 'tab' && OPEN_TABS.includes(ui.tab))) {
    if (!ui.after) ui.after = {tab:ui.tab, view:ui.view, pv:ui.pv, cp:ui.cp, co:ui.co, back:ui.back, cback:ui.cback, unit:ui.unit};
    ui.tab = 'home'; ui.view = 'tab'; setHash('home');
    if (acct.ready && acct.known && !ui.auth) setTimeout(openAuth, 0);
  }
  renderHeader();
  document.body.classList.toggle('noprem', !hasPremium());
  if (needsVerify() && !(ui.view === 'tab' && ui.tab === 'privacy')) { homeStop(); oaStop(); const mv = $('#main'); mv.className = 'wrap main'; mv.innerHTML = viewVerify(); return; }
  const m = $('#main'), home = ui.view === 'tab' && ui.tab === 'home';
  m.className = home ? 'main home' : 'wrap main' + ((ui.view === 'tab' && ['theory', 'coding', 'companies', 'profile', 'quest', 'admin', 'oa'].includes(ui.tab)) || ui.view === 'code' || ui.view === 'company' ? ' wide' : '');
  if (!home) homeStop();
  oaStop();
  if (ui.view === 'quiz') { m.innerHTML = viewQuiz(); updateTimer(); }
  else if (ui.view === 'results') m.innerHTML = viewResults();
  else if (ui.view === 'unit') { m.innerHTML = viewUnit(); afterUnitRender(); }
  else if (ui.view === 'problem') m.innerHTML = viewProblem();
  else if (ui.view === 'code') m.innerHTML = viewCode();
  else if (ui.view === 'company') m.innerHTML = viewCompany();
  else if (home) { m.innerHTML = viewHome(); homeStart(); }
  else if (ui.tab === 'coding') m.innerHTML = viewCoding();
  else if (ui.tab === 'quest') { m.innerHTML = viewQuest(); if (ui.rm.fit) { ui.rm.fit = false; rmZoom('fit'); } }
  else if (ui.tab === 'theory') m.innerHTML = viewProblems();
  else if (ui.tab === 'profile') m.innerHTML = viewProfile();
  else if (ui.tab === 'privacy') m.innerHTML = viewPrivacy();
  else if (ui.tab === 'admin') m.innerHTML = viewAdmin();
  else if (ui.tab === 'premium') m.innerHTML = viewPremium();
  else if (ui.tab === 'oa') { m.innerHTML = viewOA(); if (oaActive()) oaTickStart(); }
  else if (ui.tab === 'companies') m.innerHTML = viewCompanies();
  else m.innerHTML = viewRoles();
}

// ---------- Quest map ----------
function viewQuest(){
  const done = UNITS.filter(U => unitPassed(U.id)).length, nu = nextUnit();
  if (!ui.rm) ui.rm = {sel:'u' + (nu ? nu.id : 1), z:1, tx:60, ty:24, fit:true};
  let html = `<section class="pagehead"><p class="eyebrow">VLSI roadmap</p><h1>The <em>VLSI</em> roadmap</h1>
    ${nu ? `<div class="row"><button type="button" class="btn primary" data-act="open-unit" data-u="${nu.id}">${cardsDone(nu) ? 'Continue' : 'Start'}: Quest ${nu.id} · ${esc(nu.title)}</button></div>` : '<p><b>Every stage is complete.</b> Keep practicing in Theory and Coding.</p>'}</section>
    <h2 class="hh2 left stagesh">Stages in detail</h2>`;
  PARTS.forEach(p => {
    const pd = p.units.filter(unitPassed).length, R = ROADMAP[p.n] || {stage:p.name, area:'', goal:''};
    const sc = pd === p.units.length ? 'done' : p.units.some(u => nu && nu.id === u) ? 'current' : p.units.some(unitUnlocked) ? 'open' : 'locked';
    html += `<section class="realm stage ${sc}"><div class="srail" aria-hidden="true"><span class="snode">${pd === p.units.length ? ICON.solved : p.n}</span></div><div class="sbody">
      <header class="realmhead"><div><span class="eyebrow">Stage ${p.n} · ${esc(R.area)}</span><h2>${esc(R.stage)}</h2><p class="muted small sgoal">${esc(R.goal)}</p></div><span class="pill${pd === p.units.length ? ' ok' : ''}">${pd}/${p.units.length} complete</span></header><ol class="path qgrid">`;
    p.units.forEach(uid => {
      const U = UNITS[uid - 1], passed = unitPassed(uid), open = unitUnlocked(uid), cd = cardsDone(U), cur = nu && nu.id === uid;
      const ids = CH_IDS[uid], sv = solvedIn(ids);
      const cls = passed ? 'done' : (open ? (cur ? 'current' : 'open') : 'locked');
      const state = passed ? `<span class="qst ok">${ICON.solved} Done</span>` : cur ? '<span class="qst cur">Up next</span>' : open ? '<span class="qst">Open</span>' : `<span class="qst lock">${ICON.lock} Locked</span>`;
      html += `<li class="node ${cls}"><button type="button" class="nodebtn" data-act="open-unit" data-u="${uid}">
        <span class="qtop"><span class="qnum">${String(uid).padStart(2, '0')}</span>${state}</span>
        <b class="qtitle">${esc(U.title)}</b>
        <span class="qbar"><i style="width:${passed ? 100 : pct(cd, U.cards.length + 1)}%"></i></span>
        <small>Lessons ${cd}/${U.cards.length} · ${sv}/${ids.length} solved${passed ? '' : ` · checkpoint ${open ? 'open' : 'locked'}`}</small>
        ${cur ? `<span class="qgo">${cd ? 'Continue' : 'Start'} →</span>` : ''}</button></li>`;
    });
    html += '</ol></div></section>';
  });
  return html + `<h2 class="hh2 left stagesh" id="rmmap">Roadmap map</h2><p class="muted rmintro">Every topic and how they connect. Drag to move, scroll or pinch to zoom, and click a topic for its details.</p>${roadmapHTML()}`;
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
    (f.status === 'all' || statusOf(Q.id) === f.status) && coHas(Q.id, f.co) && (!L || L.test(Q)) && (!term || Q.hay.indexOf(term) >= 0));
}
function sel(id, label, cur, opts){ return `<select id="${id}" aria-label="${label}">${opts.map(o => `<option value="${o[0]}"${cur === o[0] ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`; }
function viewProblems(){
  const f = ui.f, list = filtered(), all = BANK.map(Q => Q.id), solved = solvedIn(all);
  const chips = `<button type="button" class="tchip${f.ch === 'all' ? ' on' : ''}" data-act="f-ch" data-v="all">All topics <span>${BANK.length}</span></button>` +
    Object.keys(TOPICS).map(c => `<button type="button" class="tchip${f.ch === c ? ' on' : ''}" data-act="f-ch" data-v="${c}">${esc(TOPICS[c])} <span>${CH_IDS[c].length}</span></button>`).join('');
  const listOpts = [['all', 'VLSI area'], ...VLSI_AREAS.flatMap(g => g.items.map(a => [a.key, a.name])), ...(LISTS[f.list] && !/^va-/.test(f.list) ? [[f.list, LISTS[f.list].name]] : [])];
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
      ${sel('f-co', 'Company', f.co, coOpts())}
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
    <section class="card studycard"><h2>VLSI areas</h2><p class="muted small">Every problem belongs to a part of VLSI. Pick one to practice it.</p><div class="slists">
      ${VLSI_AREAS.map(g => `<p class="eyebrow sub">${esc(g.group)}</p>` + g.items.map(a => studyBtn(a.key, a.name)).join('')).join('')}
    </div></section>
    <section class="card"><h2>Practice sets</h2><div class="slists">
      <button type="button" class="slist" data-act="mock"><span>Timed mock: ${MOCK_N} problems, ${MOCK_MIN} min</span><span class="mono">OA</span></button>
      <button type="button" class="slist" data-act="review-attempted"${attempted ? '' : ' disabled'}><span>Attempted, not solved</span><span class="mono">${attempted}</span></button>
    </div></section>
  </aside></div>`;
}
function countLine(list){ const s = solvedIn(list.map(Q => Q.id)); return `${list.length} problem${list.length === 1 ? '' : 's'} · ${s} solved${ui.f.list !== 'all' ? ` · ${esc(LISTS[ui.f.list].name)}` : ''}`; }
function refreshRows(){
  const list = filtered();
  $('#prows').innerHTML = list.length ? rowsHTML(list.map(Q => Q.id), 'full') : '<tr><td colspan="6" class="empty">No problems match. Reset the filters or try another search.</td></tr>';
  $('#f-count').innerHTML = countLine(list);
  $('#pick-one').disabled = !list.length;
}
function readFilters(){
  ui.f.q = $('#f-q').value; ui.f.d = $('#f-d').value; ui.f.status = $('#f-status').value; ui.f.type = $('#f-type').value; ui.f.co = $('#f-co').value;
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
const backLabel = () => !ui.back ? 'Theory' : ui.back.view === 'unit' ? 'Back to quest' : ui.back.view === 'company' ? 'Back to ' + CO_BY_ID[ui.back.co].name : ui.back.tab === 'profile' ? 'Back to profile' : ui.back.tab === 'roles' ? 'Back to roles' : 'Theory';
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
    <p class="qtext">${esc(Q.q)}</p>${coChips(Q.id)}`;
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
  else if (S.kind === 'mock') sub = S.score / total >= 0.8 ? 'Test-ready pace. Keep your streak going.' : 'Review the misses below, then practice the topics they came from.';
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

// ---------- Coding problems ----------
CODING.forEach((p, i) => { p.n = i + 1; p.hay = (p.title + ' ' + p.p.join(' ') + ' ' + LANGS[p.lang] + ' ' + p.area).toLowerCase(); });
const CODE_BY_ID = Object.fromEntries(CODING.map(p => [p.id, p]));
const CODE_MAX = 4000;   // characters of your code kept per problem
const blankCodeFilters = () => ({q:'', area:'all', lang:'all', d:'all', status:'all', co:'all'});
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
    (f.status === 'all' || codeStatus(p.id) === f.status) && coHas(p.id, f.co) && (!term || p.hay.indexOf(term) >= 0));
}
function codeRowsHTML(list, from){
  return list.length ? list.map(p => `<tr data-copen="${p.id}"${from ? ` data-from="${from}"` : ''}><td class="c-st">${codeStatusCell(p.id)}</td><td class="c-ti"><a href="#code${p.n}" data-copen="${p.id}">${p.n}. ${esc(p.title)}</a><span class="tags">${p.run ? '<span class="tag t-run">Judged</span>' : ''}</span></td>` +
    `<td class="c-tp">${esc(p.area)}</td><td class="c-ty">${esc(LANGS[p.lang])}</td><td class="c-co">${coMini(p.id)}</td><td class="c-df"><span class="dbadge d-${p.d}">${DIFF[p.d]}</span></td></tr>`).join('')
    : '<tr><td colspan="6" class="empty">No coding problems match. Reset the filters or try another search.</td></tr>';
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
      ${sel('cf-co', 'Company', f.co, coOpts())}
      <div class="fbtns"><button type="button" class="btn small ghost" data-act="cf-reset">Reset</button><button type="button" class="btn small primary" id="cpick" data-act="cpick"${list.length ? '' : ' disabled'}>Pick one</button></div>
    </div>
    <p class="fcount" id="cf-count">${list.length} problems · ${codeSolvedIn(list)} solved</p>
    <div class="tablewrap"><table class="ptable ctable"><thead><tr><th class="c-st">Status</th><th class="c-ti">Problem</th><th class="c-tp">Area</th><th class="c-ty">Language</th><th class="c-co">Companies</th><th class="c-df">Difficulty</th></tr></thead><tbody id="crows">${codeRowsHTML(list)}</tbody></table></div>
  </section>
  <aside class="pside">
    <section class="card progcard"><h2>Coding progress</h2><div class="progring">${ring(solved / CODING.length, 120, 9, `${solved} of ${CODING.length} solved`)}<div class="ringlabel"><b>${solved}</b><span>/${CODING.length}</span><small>Solved</small></div></div>
      <div class="dbars">${['E', 'M', 'H'].map(d => { const [s, t] = byD(d); return `<div class="dbar"><span class="d-${d}">${DIFF[d]}</span><span class="mono">${s}/${t}</span><i class="bar d-${d}"><b style="width:${pct(s, t)}%"></b></i></div>`; }).join('')}</div>
      <p class="muted small">Problems marked Judged run hidden tests right here: Python, C and C++ (compiled in your browser) and Verilog RTL (synthesized and simulated). Run tries the examples; Submit runs every test. The rest you check in a real tool.</p></section>
    <section class="card studycard"><h2>Tracks by NVIDIA role</h2><div class="slists">${ROLES.filter(r => r.code).map(r => { const l = CODING.filter(p => p.area === r.code); return `<button type="button" class="slist${f.area === r.code ? ' on' : ''}" data-act="cf-area" data-v="${esc(r.code)}"><span>${esc(r.name)}</span><span class="mono">${codeSolvedIn(l)}/${l.length}</span></button>`; }).join('')}</div></section>
  </aside></div>`;
}
function refreshCodeRows(){
  ui.cf.q = $('#cf-q').value; ui.cf.lang = $('#cf-lang').value; ui.cf.d = $('#cf-d').value; ui.cf.status = $('#cf-status').value; ui.cf.co = $('#cf-co').value;
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
  const C = ui.cp;
  return `<div class="console"><div class="ctabs" role="tablist">${judged(p) ? `<button type="button" role="tab" aria-selected="${C.ctab === 'case'}" data-act="c-ctab" data-v="case">Testcase</button><button type="button" role="tab" aria-selected="${C.ctab === 'result'}" data-act="c-ctab" data-v="result">Test Result</button>` : '<span class="ctitle">Check it yourself</span>'}
</div>
    ${consoleHTML(p)}</div>`;
}
function actionsHTML(p){
  const C = ui.cp, st = codeStatus(p.id);
  return `<span class="eacts">${judged(p) ? `<button type="button" class="btn small" data-act="c-run"${C.busy ? ' disabled' : ''}>▶ Run</button><button type="button" class="btn small go" data-act="c-submit"${C.busy ? ' disabled' : ''}>Submit</button>`
    : `<button type="button" class="btn small${st === 'solved' ? '' : ' go'}" data-act="c-mark">${st === 'solved' ? 'Mark as not solved' : 'Mark as solved'}</button>`}</span>`;
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
    ${coChips(p.id)}
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
  const back = ui.cback && ui.cback.tab === 'profile' ? 'Back to profile' : ui.cback && ui.cback.view === 'company' ? 'Back to ' + CO_BY_ID[ui.cback.co].name : 'Coding problems';
  return `<div class="cpv-wrap"><div class="pvbar"><button type="button" class="btn ghost small" data-act="c-back">← ${back}</button>
    <div class="row"><span class="muted mono">${pos + 1} / ${C.list.length}</span>
    <button type="button" class="iconbtn" data-act="c-prev" aria-label="Previous problem"${pos <= 0 ? ' disabled' : ''}>‹</button>
    <button type="button" class="iconbtn" data-act="c-next" aria-label="Next problem"${pos >= C.list.length - 1 ? ' disabled' : ''}>›</button></div></div>
    <div class="cpv">${codeLeftHTML()}
    <section class="ceditor panel"><div class="ehead"><span class="elang">${esc(JUDGE_NAME[p.lang] && judged(p) ? JUDGE_NAME[p.lang] : LANGS[p.lang])}</span><span class="spacer"></span>
      <button type="button" class="btn small ghost" data-act="c-reset">Reset</button>${actionsHTML(p)}</div>
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
  const p = CODE_BY_ID[ui.cp.id], t = document.createElement('div');
  t.innerHTML = consoleWrapHTML(p); c.replaceWith(t.firstElementChild);
  const a = $('.eacts'); if (a) a.outerHTML = actionsHTML(p);
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
    logSubmit(id, verdict === 'Accepted');
    if (verdict === 'Accepted' && codeStatus(id) !== 'solved') { setCode(id, {solved:Date.now()}); toast('Accepted: ' + p.title); }
    save(); renderHeader();
    const left = $('.cstate'); if (left) left.outerHTML = codeLeftHTML();
  }
  showRun();
}

// ---------- Company tags ----------
// Company names are public (company-names.js). Which problems belong to each company, and the assessment formats,
// are Premium: they arrive from Firestore for Premium accounts (or are embedded in private builds) and are applied
// by applyPremium(). Until then every company has no tags, and the Premium pages show a lock.
const COMPANIES = COMPANY_NAMES.map(c => Object.assign({}, c));
const CO_BY_ID = Object.fromEntries(COMPANIES.map(c => [c.id, c]));
const CO_TAGS = {};   // problem id -> [{co, rank, rep}], best first
const PREMIUM_KEYS = ['chapters', 'areas', 'tags', 'ids', 'reported', 'note'];
let ASSESSMENTS = [], OA_BY_CO = {};
const premium = {loaded:false, status:'none'};   // status: none, checking, active, inactive, nocontent, error
function buildCompanyTags(){
  BANK.forEach(Q => { CO_TAGS[Q.id] = []; });
  CODING.forEach(p => { CO_TAGS[p.id] = []; });
  COMPANIES.forEach((c, ci) => {
    const add = (id, rank, rep) => {
      const l = CO_TAGS[id]; if (!l) return;
      const e = l.find(x => x.co === c.id);
      if (e) { e.rank = Math.min(e.rank, rank); e.rep = e.rep || rep; } else l.push({co:c.id, rank, rep, ci});
    };
    BANK.forEach(Q => {
      const k = (c.chapters || []).indexOf(Q.ch);
      if (k >= 0) add(Q.id, 10 + k, false);
      if (c.tags && [...c.tags].some(t => hasTag(Q, t))) add(Q.id, 0, true);
    });
    CODING.forEach(p => { const k = (c.areas || []).indexOf(p.area); if (k >= 0) add(p.id, 10 + k, false); });
    (c.ids || []).forEach(id => add(id, 1, (c.reported || []).includes(id)));
  });
  Object.values(CO_TAGS).forEach(l => l.sort((a, b) => (b.rep - a.rep) || (a.rank - b.rank) || (a.ci - b.ci)));
}
function applyPremium(data){
  if (!data || typeof data !== 'object' || !data.companies) return false;
  COMPANIES.forEach(c => { const m = data.companies[c.id] || {}; PREMIUM_KEYS.forEach(k => { if (m[k] !== undefined) c[k] = m[k]; }); });
  ASSESSMENTS = Array.isArray(data.assessments) ? data.assessments.filter(a => a && CO_BY_ID[a.co]) : [];
  OA_BY_CO = Object.fromEntries(ASSESSMENTS.map(a => [a.co, a]));
  buildCompanyTags(); premium.loaded = true;
  return true;
}
function clearPremium(){
  COMPANIES.forEach(c => PREMIUM_KEYS.forEach(k => { delete c[k]; }));
  ASSESSMENTS = []; OA_BY_CO = {}; buildCompanyTags(); premium.loaded = false;
}
const hasPremium = () => premium.loaded;
buildCompanyTags();
// Private builds (the Claude artifact, the tests) carry the data inline; the public site never does.
if (window.PREMIUM_INLINE && !(STANDALONE && window.FIREBASE_CONFIG)) applyPremium(window.PREMIUM_INLINE);
const coTheory = co => BANK.filter(Q => CO_TAGS[Q.id].some(t => t.co === co)).map(Q => Q.id);
const coCoding = co => CODING.filter(p => CO_TAGS[p.id].some(t => t.co === co)).map(p => p.id);
const coReported = co => BANK.filter(Q => CO_TAGS[Q.id].some(t => t.co === co && t.rep)).map(Q => Q.id);
const coReportedCode = co => CODING.filter(p => CO_TAGS[p.id].some(t => t.co === co && t.rep)).map(p => p.id);
const coHas = (id, co) => co === 'all' || CO_TAGS[id].some(t => t.co === co);
// A small logo standing in for a company's name (the name is kept for hover and screen readers).
const coBadge = (c, rep) => `<span class="cobadge${rep ? ' rep' : ''}" title="${esc(c.name + (rep ? ' (reported)' : ''))}" role="img" aria-label="${esc(c.name + (rep ? ', reported' : ''))}">${coAvatar(c, 'xs')}</span>`;
// A company's logo on a white tile (logos.js), or its short letters when there is no logo.
function coAvatar(c, size){
  const L = typeof LOGOS !== 'undefined' && LOGOS[c.id], cls = 'coav' + (size ? ' ' + size : '');
  if (L && L.kind === 'path') return `<span class="${cls} logo" aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="#${L.hex}" d="${L.d}"/></svg></span>`;
  if (L) return `<span class="${cls} logo${L.wide ? ' wide' : ''}" aria-hidden="true"><img src="${L.src}" alt=""></span>`;
  return `<span class="${cls}" aria-hidden="true">${esc(c.short || c.name.slice(0, 2).toUpperCase())}</span>`;
}
// Compact tags for list rows: the first two companies, then +n.
function coMini(id){
  const l = CO_TAGS[id] || [];
  if (!l.length) return '';
  return `<span class="comini" title="${esc(l.map(t => CO_BY_ID[t.co].name + (t.rep ? ' (reported)' : '')).join(', '))}">` +
    l.slice(0, 4).map(t => coBadge(CO_BY_ID[t.co], t.rep)).join('') + (l.length > 4 ? `<span class="comore">+${l.length - 4}</span>` : '') + '</span>';
}
// Full tags for a problem page; each opens that company's list.
function coChips(id){
  const l = CO_TAGS[id] || [];
  if (!l.length) return '';
  return `<div class="cochips"><span class="eyebrow">Companies</span>${l.map(t => `<button type="button" class="cologo${t.rep ? ' rep' : ''}" data-act="co-open" data-v="${t.co}" title="${esc(CO_BY_ID[t.co].name + (t.rep ? ' (reported)' : ''))}" aria-label="${esc(CO_BY_ID[t.co].name + (t.rep ? ', reported' : ''))}">${coAvatar(CO_BY_ID[t.co], 'sm')}</button>`).join('')}</div>`;
}
const coOpts = () => [['all', 'Company'], ...COMPANIES.map(c => [c.id, c.name])];

function viewCompanies(){
  if (!hasPremium()) return premiumLock('Companies');
  const term = (ui.coq || '').trim().toLowerCase();
  const list = COMPANIES.filter(c => !term || (c.name + ' ' + c.focus).toLowerCase().includes(term));
  return `<section class="pagehead"><p class="eyebrow">Companies</p><h1>Practice by <em>company</em></h1>
    <p class="muted">Every theory and coding problem is tagged with the companies whose hardware roles test it. Pick a company to work through its list.</p>
    <input type="search" id="co-q" class="bigsearch" placeholder="Search companies" value="${esc(ui.coq || '')}" aria-label="Search companies"></section>
    <div class="cogrid" id="cogrid">${coCardsHTML(list)}</div>
    <p class="muted small conote">Tags from a company's core topics come from public job postings and widely reported interview topics; they say "this is tested for these roles", not "this exact question was asked". Problems marked <span class="cotag rep">reported</span> were actually seen: your own OA, its variants, and candidate reports.</p>`;
}
function coCardsHTML(list){
  return list.length ? list.map(c => {
    const t = coTheory(c.id), k = coCoding(c.id), solved = solvedIn(t) + codeSolvedIn(k.map(id => CODE_BY_ID[id])), total = t.length + k.length, rep = coReported(c.id).length + coReportedCode(c.id).length;
    return `<button type="button" class="cocard" data-act="co-open" data-v="${c.id}">${coAvatar(c)}<span class="cobody"><b>${esc(c.name)}</b><small>${esc(c.focus)}</small>
      <span class="costats"><span>${t.length} theory</span><span>${k.length} coding</span>${rep ? `<span class="cotag rep">${rep} reported</span>` : ''}</span>
      <span class="cobar"><i style="width:${pct(solved, total)}%"></i></span><small class="mono">${solved}/${total} solved</small></span></button>`;
  }).join('') : '<p class="muted">No companies match.</p>';
}
function openCompany(id){ ui.co = {id, tab:CO_BY_ID[id].tags || (CO_BY_ID[id].reported || []).length ? 'rep' : 'theory', d:'all'}; ui.view = 'company'; setHash('company-' + id); render(); window.scrollTo(0, 0); }
function viewCompany(){
  if (!hasPremium()) return premiumLock('Companies');
  const C = ui.co, c = CO_BY_ID[C.id], t = coTheory(c.id), k = coCoding(c.id), rt = coReported(c.id), rk = coReportedCode(c.id);
  const solved = solvedIn(t) + codeSolvedIn(k.map(id => CODE_BY_ID[id])), total = t.length + k.length;
  const tabs = [...(rt.length || rk.length ? [['rep', `Reported (${rt.length + rk.length})`]] : []), ['theory', `Theory (${t.length})`], ['coding', `Coding (${k.length})`]];
  const dOk = id => C.d === 'all' || (BY_ID[id] || CODE_BY_ID[id]).d === C.d;
  let body = '';
  if (C.tab === 'coding') body = codeTableHTML(k.filter(dOk), 'company');
  else if (C.tab === 'theory') body = tableHTML(t.filter(dOk), 'full', 'corows', 'company');
  else {
    body = (rk.length ? `<h3 class="subh">Coding</h3>${codeTableHTML(rk.filter(dOk), 'company')}` : '') + (rt.length ? `<h3 class="subh">Theory</h3>${tableHTML(rt.filter(dOk), 'full', 'corows', 'company')}` : '');
    if (c.id === 'nvidia') body += nvidiaReportHTML();
  }
  return `<div class="pvbar"><button type="button" class="btn ghost small" data-act="co-back">← Companies</button></div>
    <section class="card cohead">${coAvatar(c, 'lg')}<div class="cohtext"><h1>${esc(c.name)}</h1><p class="muted">${esc(c.focus)}</p>${c.note ? `<p class="small">${esc(c.note)}</p>` : ''}</div>
      <div class="herostat">${ring(total ? solved / total : 0, 76, 7, `${solved} of ${total} solved`)}<div><b>${solved}<span class="muted">/${total}</span></b><span>solved</span></div></div></section>
    <div class="cotabs"><div class="seg" role="tablist">${tabs.map(([v, l]) => `<button type="button" role="tab" aria-selected="${C.tab === v}" data-act="co-tab" data-v="${v}">${l}</button>`).join('')}</div>
      <div class="chiprow">${[['all', 'All'], ['E', 'Easy'], ['M', 'Medium'], ['H', 'Hard']].map(([v, l]) => `<button type="button" class="tchip${C.d === v ? ' on' : ''}" data-act="co-d" data-v="${v}">${l}</button>`).join('')}</div></div>
    ${body}`;
}
function codeTableHTML(ids, from){
  return `<div class="tablewrap"><table class="ptable ctable"><thead><tr><th class="c-st">Status</th><th class="c-ti">Problem</th><th class="c-tp">Area</th><th class="c-ty">Language</th><th class="c-co">Companies</th><th class="c-df">Difficulty</th></tr></thead><tbody>${codeRowsHTML(ids.map(id => CODE_BY_ID[id]), from)}</tbody></table></div>`;
}
// Your OA and what other candidates reported, shown on NVIDIA's page.
function nvidiaReportHTML(){
  const listCell = key => { const ids = listIds(key); return `<button type="button" class="linkbtn" data-act="f-list-go" data-v="${key}">${ids.length} problems</button><span class="muted"> · ${solvedIn(ids)} solved</span>`; };
  const oaRows = OA_TOPICS.map(t => { const ids = listIds(t.key), exact = ids.filter(id => hasTag(BY_ID[id], 'o')).length; return `<tr><td>${esc(t.name)}</td><td>${t.book}</td><td class="mono">${exact}</td><td class="mono">${ids.length - exact}</td><td>${listCell(t.key)}</td></tr>`; }).join('');
  const repRows = REPORTED.map(r => `<tr><td>${esc(r.name)}</td><td>Ch ${r.ch}</td><td>${listCell(r.key)}</td></tr>`).join('');
  return `<section class="card"><h2>Your OA topics</h2><p class="muted">Every question from your Ignite OA is in the bank word for word, plus variants that test the same idea.</p>
    <div class="tablewrap"><table class="rtable"><thead><tr><th>OA topic</th><th>Book</th><th>Exact</th><th>Variants</th><th>Practice</th></tr></thead><tbody>${oaRows}</tbody></table></div></section>
    <section class="card"><h2>Topics other candidates reported</h2><p class="muted">From the book's "Seen on the assessment" boxes.</p>
    <div class="tablewrap"><table class="rtable"><thead><tr><th>Reported topic</th><th>Book</th><th>Practice</th></tr></thead><tbody>${repRows}</tbody></table></div></section>
    <section class="card"><h2>Internship teams</h2><p class="muted">The quests that matter most for each NVIDIA internship team.</p><div class="areas">` +
    AREAS.map(a => `<div class="area"><b>${esc(a.name)}</b><div class="row">${a.ch.map(ch => `<button type="button" class="topicchip" data-act="open-unit" data-u="${ch}">Quest ${ch} · ${esc(TOPICS[ch])}</button>`).join('')}</div></div>`).join('') + '</div></section>';
}

// ---------- Roles: what hardware postings ask for, and the hardware roles to aim for ----------
function viewRoles(){
  const listCell = key => { if (!key) return '<span class="muted">Not in this trainer</span>'; const ids = listIds(key); return `<button type="button" class="linkbtn" data-act="f-list-go" data-v="${key}">${ids.length} problems</button><span class="muted"> · ${solvedIn(ids)} solved</span>`; };
  const hiring = r => COMPANIES.filter(c => (r.code && (c.areas || []).includes(r.code)) || r.ch.filter(ch => (c.chapters || []).slice(0, 4).includes(ch)).length >= 2).slice(0, 6);
  let html = `<section class="pagehead"><p class="eyebrow">Roles</p><h1>Find your <em>hardware</em> role</h1>
    <p class="muted">What hardware engineering postings ask for, how well the book and this trainer cover it, and the roles to aim for, each with its quests, coding track and the companies that hire for it.</p></section>
    <section class="card"><h2>What hardware postings ask for</h2><p class="muted">The requirements that show up again and again in hardware internship and new-grad postings.</p><div class="reviews">`;
  SKILL_REVIEW.forEach(it => {
    const [label, cls] = VERDICT[it.v];
    html += `<article class="review"><div class="rhead"><b>${esc(it.req)}</b><span class="vpill ${cls}">${label}</span></div>
      <dl><div><dt>In the book</dt><dd>${esc(it.book)}</dd></div><div><dt>In this trainer</dt><dd>${listCell(it.list)}${it.code ? '<br>' + codeCell(it.code) : ''}</dd></div><div><dt>What to do</dt><dd>${esc(it.todo)}</dd></div></dl></article>`;
  });
  html += `</div></section><section class="card"><h2>Hardware roles</h2><p class="muted">Internship and new-grad roles across the industry, with what this kit covers for each and what to add.</p><div class="reviews">` +
    ROLES.map(r => `<article class="review"><div class="rhead"><b>${esc(r.name)}</b><span class="vpill ${r.fit === 'Strong' || r.fit === 'Good' ? 'ok' : r.fit === 'Medium' ? 'warn' : ''}">${r.fit} coverage</span></div>
      <p class="small">${esc(r.what)}</p>
      <dl><div><dt>Quests</dt><dd><div class="row">${r.ch.map(c => `<button type="button" class="topicchip" data-act="open-unit" data-u="${c}">Quest ${c} · ${esc(TOPICS[c])}</button>`).join('')}</div></dd></div>
      <div><dt>Coding track</dt><dd>${r.code ? codeCell([r.code]) : '<span class="muted">No coding track: this role is mostly analog or mechanical</span>'}</dd></div>
      <div><dt>Hiring</dt><dd><div class="row">${hiring(r).map(c => `<button type="button" class="cologo" data-act="co-open" data-v="${c.id}" title="${esc(c.name)}" aria-label="${esc(c.name)}">${coAvatar(c, 'sm')}</button>`).join('') || '<span class="muted">Most hardware companies</span>'}</div></dd></div>
      <div><dt>Also do</dt><dd>${esc(r.add)}</dd></div></dl></article>`).join('') + '</div></section>';
  return html;
}

// ---------- Home ----------
const HERO_WORDS = ['digital logic', 'CMOS circuits', 'Verilog RTL', 'static timing', 'GPU architecture', 'computer arithmetic'];
const HOME_TABS = [
  {name:'Learn circuits from zero', file:'quest_05.md', go:'quest', link:'Start the quest',
    code:'Quest 5 · The MOSFET\n\n  Vgs < Vth   off: no channel\n  Vgs > Vth   on:  channel forms\n\n  Id = k (Vgs − Vth)²   saturation\n\n✓ 4 lessons with widgets\n✓ 5-problem checkpoint', vis:'mosfet', cap:'drag Vgs past Vth'},
  {name:'Write and judge RTL', file:'counter4.v', go:'coding', link:'Browse RTL problems',
    code:'module counter4 (\n  input  wire       clk, rst, en,\n  output reg  [3:0] q\n);\n  always @(posedge clk)\n    if (rst)     q <= 0;\n    else if (en) q <= q + 1;\nendmodule', vis:'wave', cap:'Yosys + gate simulator · Accepted'},
  {name:'Code in C, C++ and Python', file:'reverse.c', go:'coding', link:'Browse coding problems',
    code:'struct node *reverse(struct node *h) {\n    struct node *prev = NULL;\n    while (h) {\n        struct node *next = h->next;\n        h->next = prev;\n        prev = h;\n        h = next;\n    }\n    return prev;\n}', vis:'list', cap:'Clang in your browser · 5/5 tests'},
  {name:'Prepare by company', file:'companies', go:'companies', link:'Browse companies',
    code:'NVIDIA     GPUs, AI systems\nAMD        CPUs, GPUs\nIntel      CPUs, foundry\nApple      custom SoCs\nQualcomm   mobile SoCs\nGoogle     TPUs\n…and 9 more', vis:'cos', cap:'tagged theory + coding lists'},
  {name:'Ace the assessment', file:'mock.oa', go:'theory', link:'Take a timed mock',
    code:'Timed mock · 15 problems · 50 min\n\n  #3  A 2:1 mux builds an OR gate…\n      ○ A  ○ B  ● C  ○ D\n\n  Your profile tracks streaks,\n  activity and every submission.', vis:'timer', cap:'50:00 on the clock'},
];
const HOME_TOPICS = [
  {name:'Digital logic', ch:9, art:'gates'}, {name:'Timing and clocks', ch:11, art:'clock'}, {name:'CMOS and transistors', ch:5, art:'mos'},
  {name:'Memory and architecture', ch:20, art:'pipe'}, {name:'GPUs and CUDA', ch:21, art:'gpu'}, {name:'Computer arithmetic', ch:22, art:'adder'},
];
const HOME_FAQ = [
  ['Is it free?', 'Yes. The book, every quest, all 682 theory problems and 64 coding problems, and the in-browser judge are free. There is nothing to buy.'],
  ['Who is it for?', 'Students preparing for hardware internships and new-grad roles: ASIC design, verification, physical design, architecture, power, and the online assessments that screen for them.'],
  ['I am new to hardware. Where do I start?', 'Start Quest 1. The quests follow the book from charge and current up to GPUs, each with short lessons, interactive widgets and a checkpoint.'],
  ['What topics does it cover?', 'Circuits, semiconductors and MOSFETs, CMOS gates, combinational and sequential logic, timing, power, PVT, wires and signal integrity, manufacturing and test, memory, Verilog and verification, computer architecture, GPUs, computer arithmetic, and programming with Linux and scripting.'],
  ['Which languages run in the browser?', 'Python (Pyodide), C and C++ (Clang compiled to WebAssembly) and Verilog (synthesized by Yosys and simulated gate by gate). Run tries the examples; Submit runs every hidden test.'],
  ['Do I need an account?', 'Yes, a free one (Google or email). This page is open to everyone; practicing needs an account, so your progress, streak and code follow you to every device.'],
];
function homeVis(kind){
  if (kind === 'wave') return `<svg viewBox="0 0 300 150" class="wavesvg" aria-hidden="true"><g class="wl"><text x="0" y="22">clk</text><text x="0" y="62">en</text><text x="0" y="102">q</text></g>
    <path class="wclk" d="M36 30 ${Array.from({length:8}, (_, i) => `h16 v-16 h16 v16`).join(' ')}"/><path class="wsig" d="M36 70 h24 v-16 h228"/>
    ${Array.from({length:8}, (_, i) => `<g class="wbus" style="--i:${i}"><path d="M${36 + i * 32} 110 l4 -8 h24 l4 8 l-4 8 h-24 z"/><text x="${52 + i * 32}" y="114">${i}</text></g>`).join('')}</svg>`;
  if (kind === 'mosfet') return `<svg viewBox="0 0 300 150" aria-hidden="true"><path class="axis" d="M30 130 H280 M30 130 V15"/><path class="curve" d="M30 130 C90 130 110 128 130 120 S200 40 270 25"/><line class="vth" x1="118" y1="15" x2="118" y2="130"/><text x="122" y="28" class="lab">Vth</text><text x="250" y="145" class="lab">Vgs</text><text x="36" y="22" class="lab">Id</text><circle class="dot" r="5"><animateMotion dur="4s" repeatCount="indefinite" path="M30 130 C90 130 110 128 130 120 S200 40 270 25"/></circle></svg>`;
  if (kind === 'list') return `<svg viewBox="0 0 300 150" aria-hidden="true">${[0, 1, 2, 3].map(i => `<g class="lnode" style="--i:${i}"><rect x="${14 + i * 72}" y="55" width="44" height="34" rx="8"/><text x="${36 + i * 72}" y="77">${i + 1}</text>${i < 3 ? `<path class="larr" d="M${60 + i * 72} 72 h22"/>` : ''}</g>`).join('')}<text x="150" y="125" class="lab mid">prev ← h → next</text></svg>`;
  if (kind === 'cos') return `<div class="viscos">${COMPANIES.slice(0, 12).map(c => coAvatar(c, 'sm')).join('')}</div>`;
  return `<svg viewBox="0 0 300 150" aria-hidden="true"><circle cx="150" cy="75" r="52" class="tring"/><circle cx="150" cy="75" r="52" class="tarc"/><text x="150" y="82" class="ttxt">50:00</text></svg>`;
}
function homeArt(kind){
  const A = {
    gates:'<path d="M40 40 h30 a30 30 0 0 1 0 60 h-30 z M40 55 h-20 M40 85 h-20 M100 70 h20 M130 40 q20 30 0 60 q30 0 50 -30 q-20 -30 -50 -30 z M120 70 h10 M180 70 h20"/><circle cx="203" cy="70" r="3"/>',
    clock:'<path d="M20 100 h20 v-50 h40 v50 h40 v-50 h40 v50 h40 v-50 h20"/><path class="soft" d="M20 120 h60 l8 -12 h112"/>',
    mos:'<path d="M40 110 h160 M70 110 v-30 h100 v30 M90 80 v-25 h60 v25 M120 55 v-25"/><text x="70" y="128">source</text><text x="150" y="128">drain</text>',
    pipe:'<path d="M20 50 h40 v40 h-40 z M75 50 h40 v40 h-40 z M130 50 h40 v40 h-40 z M185 50 h40 v40 h-40 z M60 70 h15 M115 70 h15 M170 70 h15"/><text x="28" y="74">IF</text><text x="83" y="74">ID</text><text x="138" y="74">EX</text><text x="190" y="74">WB</text>',
    gpu:Array.from({length:12}, (_, i) => `<rect x="${30 + (i % 4) * 46}" y="${32 + Math.floor(i / 4) * 30}" width="36" height="22" rx="4"/>`).join(''),
    adder:'<path d="M60 30 h60 l20 40 l-20 40 h-60 z M30 50 h30 M30 90 h30 M140 70 h40"/><text x="78" y="75">Σ</text><text x="20" y="45">a</text><text x="20" y="85">b</text><text x="185" y="74">s</text>',
  };
  return `<svg viewBox="0 0 230 140" class="art art-${kind}" aria-hidden="true">${A[kind]}</svg>`;
}
const TRY = [
  {name:'Dynamic power', eq:'P = α · C · V² · f'}, {name:'Gray code', eq:'g = b ⊕ (b >> 1)'},
  {name:'Setup slack', eq:'slack = T − (t_cq + t_logic + t_setup)'}, {name:"Two's complement", eq:'−x = ~x + 1'},
];
function tryHTML(i){
  const t = ui.home.tryv;
  if (i === 0) { const P = 0.2 * 1e-9 * t.v * t.v * t.f * 1e9; return `<div class="trywid"><label>Supply V <input type="range" min="0.5" max="1.2" step="0.05" value="${t.v}" data-try="v"><b>${t.v.toFixed(2)} V</b></label><label>Clock f <input type="range" min="0.5" max="3" step="0.1" value="${t.f}" data-try="f"><b>${t.f.toFixed(1)} GHz</b></label>
    <div class="tryout"><span>Power with α = 0.2, C = 1 nF</span><b>${P.toFixed(3)} W</b></div><p class="muted small">Double V and power goes up 4×; double f and it goes up 2×. This exact idea was on the NVIDIA OA.</p></div>`; }
  if (i === 1) { const b = t.b, g = b ^ (b >> 1), bits = (x) => x.toString(2).padStart(4, '0'); return `<div class="trywid"><div class="bits">${[3, 2, 1, 0].map(k => `<button type="button" class="bit${(b >> k) & 1 ? ' on' : ''}" data-act="try-bit" data-v="${k}">${(b >> k) & 1}</button>`).join('')}</div>
    <div class="tryout"><span>binary ${bits(b)} (${b})</span><b>gray ${bits(g)}</b></div><p class="muted small">Neighbouring Gray codes differ in one bit, so a pointer crossing clock domains can never be read half-updated.</p></div>`; }
  if (i === 2) { const s = t.T - (0.1 + t.l + 0.05); return `<div class="trywid"><label>Clock period <input type="range" min="0.5" max="2" step="0.05" value="${t.T}" data-try="T"><b>${t.T.toFixed(2)} ns</b></label><label>Logic delay <input type="range" min="0.1" max="1.8" step="0.05" value="${t.l}" data-try="l"><b>${t.l.toFixed(2)} ns</b></label>
    <div class="tryout ${s < 0 ? 'neg' : ''}"><span>t_cq 0.10 ns, t_setup 0.05 ns</span><b>slack ${s >= 0 ? '+' : ''}${s.toFixed(2)} ns ${s < 0 ? '(violated)' : '(met)'}</b></div></div>`; }
  const x = t.x, u = x & 255, sgn = u >= 128 ? u - 256 : u;
  return `<div class="trywid"><div class="bits">${[7, 6, 5, 4, 3, 2, 1, 0].map(k => `<button type="button" class="bit${(u >> k) & 1 ? ' on' : ''}" data-act="try-byte" data-v="${k}">${(u >> k) & 1}</button>`).join('')}</div>
    <div class="tryout"><span>unsigned ${u}</span><b>signed ${sgn}</b></div><p class="muted small">The top bit weighs −128. Flip every bit and add 1 to negate.</p></div>`;
}
function viewHome(){
  const H = ui.home, judged = CODING.filter(p => p.run).length, tab = HOME_TABS[H.tab];
  const lines = s => esc(s).replace(/\b(module|endmodule|input|output|wire|reg|always|posedge|if|else|struct|while|return|NULL)\b/g, '<i class="t-k">$1</i>').replace(/(✓[^\n]*)/g, '<i class="t-s">$1</i>');
  return `<section class="hhero wrap wide"><div class="hcopy"><h1>Learn<br><em id="hword">${HERO_WORDS[H.word]}</em><br>from the ground up</h1>
      <p class="hsub">Master <b>${BANK.length} theory problems</b> and <b>${CODING.length} coding problems</b>, from Ohm's law to GPU pipelines, with a free book, interactive lessons, and a judge that runs <b>Verilog and C</b> in your browser.</p>
      <div class="row"><button type="button" class="btn primary big" data-act="go" data-v="theory">Explore problems →</button><button type="button" class="btn big" data-act="go" data-v="quest">Open the roadmap</button></div>
      <div class="langs">${['Verilog', 'SystemVerilog', 'C / C++', 'Python', 'CUDA', 'Tcl'].map(l => `<span>${l}</span>`).join('<i>·</i>')}</div></div>
    <div class="hcard"><div class="hbar"><span class="dots"><i></i><i></i><i></i></span><span class="mono">counter4.v</span><span class="hrun" id="hrun">▶ Run</span></div>
      <div class="hbody"><div class="hvis"><p class="hlab">WAVEFORM · q(t)</p>${homeVis('wave')}<p class="mono hstat" id="hstat">cycle 0 | q = 0</p></div>
      <pre class="hcode">${lines(HOME_TABS[1].code)}</pre></div>
      <ul class="hchecks" id="hchecks"><li>resets to 0</li><li>counts on every rising edge</li><li>wraps from 15 to 0</li></ul></div></section>
    <section class="hstrip wrap wide"><p>Problems tagged for hardware roles at</p><div class="hcos">${COMPANIES.map(c => `<button type="button" data-act="co-open" data-v="${c.id}" title="${esc(c.name)}" aria-label="${esc(c.name)}">${coAvatar(c, 'md')}</button>`).join('')}</div></section>
    <section class="hsec wrap wide"><h2 class="hh2">The complete hardware engineering trainer</h2>
      <div class="hplat"><div class="hptabs" role="tablist">${HOME_TABS.map((t, i) => `<button type="button" role="tab" aria-selected="${H.tab === i}" data-act="home-tab" data-v="${i}"><span class="hpi">${['◎', '⌁', '{ }', '▦', '⏱'][i]}</span>${esc(t.name)}</button>`).join('')}</div>
        <div class="hcard hpcard"><div class="hbar"><span class="dots"><i></i><i></i><i></i></span><span class="mono">${esc(tab.file)}</span></div>
          <div class="hbody"><div class="hvis">${homeVis(tab.vis)}<p class="mono hstat">${esc(tab.cap)}</p></div><pre class="hcode">${lines(tab.code)}</pre></div></div></div>
      <p class="hmore"><button type="button" class="linkbtn" data-act="go" data-v="${tab.go}">${esc(tab.link)} →</button></p></section>
    <section class="hsec wrap wide"><div class="htopics">${HOME_TOPICS.map((t, i) => `<button type="button" class="htopic t${i}" data-act="topic-filter" data-ch="${t.ch}"><span class="hart">${homeArt(t.art)}</span><b>${esc(t.name)}</b><small>${CH_IDS[t.ch].length} theory problems · Quest ${t.ch}</small></button>`).join('')}</div></section>
    <section class="hsec wrap wide"><h2 class="hh2 left">Try the problems</h2><div class="card htry"><div class="htrytabs" role="tablist">${TRY.map((t, i) => `<button type="button" role="tab" aria-selected="${H.tryi === i}" data-act="try-tab" data-v="${i}"><span class="mono">0${i + 1}</span> ${esc(t.name)}</button>`).join('')}</div>
      <div class="htrybody"><div><h3>${esc(TRY[H.tryi].name)}</h3><p class="mono teq">${esc(TRY[H.tryi].eq)}</p></div><div id="trywid">${tryHTML(H.tryi)}</div></div></div></section>
    <section class="hsec wrap wide hstats">${[[BANK.length, 'theory problems'], [CODING.length, 'coding problems'], [judged, 'judged in your browser'], [UNITS.length, 'interactive quests']].map(([n, l]) => `<div><b>${n.toLocaleString()}</b><span>${l}</span></div>`).join('')}</section>
    <section class="hsec wrap wide hfaq"><h2 class="hh2 left">Questions, answered</h2><div class="faqgrid"><ol class="faqlist">${HOME_FAQ.map((f, i) => `<li><button type="button" aria-selected="${H.faq === i}" data-act="faq" data-v="${i}"><span class="mono">0${i + 1}</span>${esc(f[0])}</button></li>`).join('')}</ol>
      <div class="card faqans"><h3>${esc(HOME_FAQ[H.faq][0])}</h3><p>${esc(HOME_FAQ[H.faq][1])}</p></div></div></section>
    <section class="hsec wrap wide"><div class="hcta"><div><h2>Stop reading.<br><em>Start building.</em></h2><p>Don't just read hardware theory. Solve it, simulate it and judge it yourself, one problem at a time.</p>
      <div class="row">${acct.ready && !acct.user ? '<button type="button" class="btn primary big" data-act="signin">Create free account</button>' : '<button type="button" class="btn primary big" data-act="go" data-v="quest">Start learning</button>'}<button type="button" class="btn big ghost" data-act="go" data-v="theory">Browse problems</button></div>
      <div class="langs"><span>${BANK.length + CODING.length} problems</span><i>·</i><span>Verilog and C judge</span><i>·</i><span>233-page book</span></div></div>
      <div class="ctaart" aria-hidden="true">${Array.from({length:36}, (_, i) => `<i style="--d:${(i * 37) % 11}"></i>`).join('')}</div></div></section>
    <footer class="hfoot wrap wide"><div><a class="brand" href="#home" data-home>${$('.brand .logo') ? $('.brand .logo').outerHTML : ''}<span class="bname">HardCode</span></a><p class="muted small">A free hardware engineering trainer, built on the book <em>Hardware from the Ground Up</em>.</p></div>
      <div><b>Practice</b>${[['theory', 'Theory'], ['coding', 'Coding'], ['quest', 'Roadmap'], ['profile', 'Profile']].map(([t, l]) => `<button type="button" class="linkbtn plain" data-act="go" data-v="${t}">${l}</button>`).join('')}</div>
      <div><b>Careers</b>${[['companies', 'Companies'], ['roles', 'Roles'], ['privacy', 'Privacy']].map(([t, l]) => `<button type="button" class="linkbtn plain" data-act="go" data-v="${t}">${l}</button>`).join('')}</div>
      <p class="muted small hcopy2">Unofficial study material. Not affiliated with or endorsed by any company named here.</p></footer>`;
}
// The hero's rotating word and its counter animation, running only while Home is shown.
function homeStart(){
  homeStop();
  const H = ui.home;
  let cyc = 0;
  H.timers.push(setInterval(() => {
    H.word = (H.word + 1) % HERO_WORDS.length;
    const w = $('#hword'); if (w) { w.classList.remove('in'); void w.offsetWidth; w.textContent = HERO_WORDS[H.word]; w.classList.add('in'); }
  }, 2600));
  H.timers.push(setInterval(() => {
    cyc = (cyc + 1) % 10;
    const s = $('#hstat'); if (!s) return;
    s.textContent = `cycle ${cyc} | q = ${Math.min(cyc, 8) % 16}`;
    document.querySelectorAll('.hhero .wbus').forEach((g, i) => g.classList.toggle('on', i < cyc));
    document.querySelectorAll('#hchecks li').forEach((li, i) => li.classList.toggle('ok', cyc >= [2, 5, 8][i]));
    const r = $('#hrun'); if (r) r.classList.toggle('busy', cyc > 0 && cyc < 9);
  }, 700));
}
function homeStop(){ if (ui.home) { ui.home.timers.forEach(clearInterval); ui.home.timers = []; } }

// ---------- Sign-in screen (standalone site with accounts turned on) ----------
function openAuth(){ if (!acct.ready) return; ui.auth = {mode:'signin', err:'', busy:false, info:''}; renderAuth(); }
// keep = true when signing in succeeded, so the page they asked for is still opened once Firebase reports the user
function closeAuth(keep){ ui.auth = null; if (!keep && !acct.user) ui.after = null; const p = $('#authpage'); if (p) p.remove(); authStop(); document.body.classList.remove('authopen'); }
function renderAuth(){
  const A = ui.auth; if (!A) return;
  let p = $('#authpage');
  if (!p) { p = document.createElement('div'); p.id = 'authpage'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'true'); p.setAttribute('aria-label', 'Sign in'); document.body.appendChild(p); document.body.classList.add('authopen'); }
  const create = A.mode === 'create';
  p.innerHTML = `<div class="authl"><div class="authtop"><a class="brand" href="#home" data-act="auth-close">${$('.brand .logo').outerHTML}<span class="bname">HardCode</span></a><button type="button" class="iconbtn" data-act="auth-close" aria-label="Close">×</button></div>
    <div class="authform"><h1>${create ? 'Create your account' : 'Sign in to HardCode'}</h1>
      <p class="muted">${create ? 'Already have an account?' : "Don't have an account?"} <button type="button" class="linkbtn" data-act="auth-mode">${create ? 'Sign in' : 'Create account'}</button></p>
      <button type="button" class="btn authbtn" data-act="auth-google"${A.busy ? ' disabled' : ''}><svg viewBox="0 0 18 18" width="16" height="16" aria-hidden="true"><path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.7H9v3.3h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z"/><path fill="#34A853" d="M9 18c2.4 0 4.5-.8 5.9-2.2l-2.9-2.2c-.8.5-1.8.9-3 .9-2.3 0-4.3-1.6-5-3.7H1v2.3A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M4 10.8a5.4 5.4 0 0 1 0-3.6V4.9H1a9 9 0 0 0 0 8.2l3-2.3z"/><path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 1 4.9l3 2.3C4.7 5.2 6.7 3.6 9 3.6z"/></svg>Continue with Google</button>
      <div class="author"><span>or continue with email</span></div>
      <form id="authemail" novalidate><label>Email<input type="email" id="au-email" autocomplete="email" placeholder="me@example.com" required></label>
        <label><span class="row between">Password${create ? '' : '<button type="button" class="linkbtn small" data-act="auth-forgot">Forgot password?</button>'}</span><input type="password" id="au-pw" autocomplete="${create ? 'new-password' : 'current-password'}" placeholder="${create ? 'At least 6 characters' : 'Enter your password'}" required></label>
        ${A.err ? `<p class="autherr" role="alert">${esc(A.err)}</p>` : ''}${A.info ? `<p class="authinfo" role="status">${esc(A.info)}</p>` : ''}
        <button type="submit" class="btn primary authsubmit"${A.busy ? ' disabled' : ''}>${A.busy ? 'Please wait…' : create ? 'Create account' : 'Sign in'}</button></form>
      <p class="muted small authfine">Sign in to practice. Your progress, streak and code sync to your account on every device. <a href="#privacy" data-act="auth-privacy">Privacy</a></p></div></div>
    <div class="authr" aria-hidden="true"><canvas id="authcanvas"></canvas><div class="authquote"><b>${BANK.length + CODING.length} problems.</b><span>From one transistor to a GPU.</span></div></div>`;
  authAnim();
}
function authErr(e){
  const c = (e && e.code) || '';
  return ({'auth/operation-not-allowed':'Email sign-in is not turned on for this site yet. Use Continue with Google.', 'auth/invalid-credential':'Wrong email or password.', 'auth/wrong-password':'Wrong email or password.', 'auth/user-not-found':'No account with that email. Create one instead.',
    'auth/email-already-in-use':'That email already has an account. Sign in instead.', 'auth/weak-password':'Use at least 6 characters.', 'auth/invalid-email':'Enter a valid email address.', 'auth/missing-password':'Enter your password.',
    'auth/unauthorized-domain':'Sign-in is not allowed on this address yet. Add it under Authentication → Settings → Authorized domains in Firebase.', 'auth/too-many-requests':'Too many tries. Wait a minute and try again.'}[c]) || (e && e.message) || 'Sign-in failed.';
}
async function authRun(fn){
  const A = ui.auth; if (!A || A.busy) return;
  A.busy = true; A.err = ''; A.info = ''; renderAuth();
  try { await fn(); if (ui.auth && !ui.auth.info) closeAuth(true); }
  catch (e) { const c = (e && e.code) || ''; if (ui.auth) { ui.auth.err = c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request' ? '' : authErr(e); } }
  if (ui.auth) { ui.auth.busy = false; renderAuth(); }
}
// ---- Abuse protection for email accounts (Firebase also rate-limits on its side) ----
// Repeated failed sign-ins lock the form with growing waits; new accounts need a real, non-disposable address and
// a reasonable password, and must verify their email before anything is saved (the database rules check this too).
const DISPOSABLE = ['mailinator.com', 'guerrillamail.com', 'guerrillamail.info', 'sharklasers.com', 'grr.la', '10minutemail.com', 'tempmail.com', 'temp-mail.org', 'tempmail.dev',
  'yopmail.com', 'trashmail.com', 'getnada.com', 'dispostable.com', 'maildrop.cc', 'mintemail.com', 'throwawaymail.com', 'fakeinbox.com', 'mohmal.com', 'emailondeck.com', 'tempail.com', 'moakt.com', 'mail.tm', 'burnermail.io'];
const FAIL_KEY = 'hardcode-auth-fail';
function failState(){ try { return JSON.parse(localStorage.getItem(FAIL_KEY)) || {n:0, until:0}; } catch (e) { return {n:0, until:0}; } }
function setFail(x){ try { localStorage.setItem(FAIL_KEY, JSON.stringify(x)); } catch (e) { /* storage unavailable */ } }
function noteFailure(){ const f = failState(); f.n++; if (f.n >= 5) f.until = Date.now() + Math.min(15 * 60000, 30000 * 2 ** (f.n - 5)); setFail(f); }
function authEmail(){
  const email = $('#au-email').value.trim(), pw = $('#au-pw').value, create = ui.auth.mode === 'create', f = failState();
  const wait = f.until - Date.now();
  if (wait > 0) { ui.auth.err = `Too many attempts. Try again in ${Math.ceil(wait / 1000)} seconds.`; renderAuth(); return; }
  if (create) {
    const dom = email.split('@')[1] || '';
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) { ui.auth.err = 'Enter a valid email address.'; renderAuth(); return; }
    if (DISPOSABLE.some(d => dom.toLowerCase() === d || dom.toLowerCase().endsWith('.' + d))) { ui.auth.err = 'Please use a permanent email address, not a disposable one.'; renderAuth(); return; }
    if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) { ui.auth.err = 'Use at least 8 characters, with both letters and numbers.'; renderAuth(); return; }
  }
  authRun(async () => {
    try {
      const cred = create ? await firebase.auth().createUserWithEmailAndPassword(email, pw) : await firebase.auth().signInWithEmailAndPassword(email, pw);
      setFail({n:0, until:0});
      if (create && cred && cred.user && cred.user.sendEmailVerification) await cred.user.sendEmailVerification();
    } catch (e) { if (e && /invalid-credential|wrong-password|user-not-found|too-many-requests/.test(e.code || '')) noteFailure(); throw e; }
  });
}
// Email accounts that have not verified their address yet: signed in, but nothing is saved and only Home is open.
const needsVerify = () => !!(acct.user && !acct.user.emailVerified && (acct.user.providerData || []).some(p => p && p.providerId === 'password'));
function viewVerify(){
  const u = acct.user;
  return `<section class="pagehead"><p class="eyebrow">One more step</p><h1>Verify your <em>email</em></h1>
    <p class="muted">We sent a link to <b>${esc(u.email || '')}</b>. Open it, then come back and press the button below. Until then nothing is saved to your account, which keeps fake and throwaway accounts out.</p>
    ${ui.verifyMsg ? `<p class="authinfo">${esc(ui.verifyMsg)}</p>` : ''}
    <div class="row"><button type="button" class="btn primary" data-act="verify-check">I've verified my email</button><button type="button" class="btn" data-act="verify-resend">Send the link again</button><button type="button" class="btn ghost" data-act="signout">Use another account</button></div></section>`;
}
function authForgot(){
  const email = $('#au-email').value.trim();
  if (!email) { ui.auth.err = 'Enter your email first, then press Forgot password.'; renderAuth(); return; }
  authRun(async () => { await firebase.auth().sendPasswordResetEmail(email); ui.auth.info = 'Check your inbox for a link to reset your password.'; });
}
// The right-hand panel: a slowly turning wafer of dies, drawn as points.
let authRAF = 0;
function authStop(){ cancelAnimationFrame(authRAF); authRAF = 0; }
function authAnim(){
  authStop();
  const cv = $('#authcanvas'); if (!cv || !cv.getContext) return;
  const ctx = cv.getContext('2d'), pts = [];
  for (let i = 0; i < 1400; i++) {
    const r = Math.sqrt(Math.random()), a = Math.random() * Math.PI * 2, x = r * Math.cos(a), y = r * Math.sin(a);
    const onGrid = Math.abs(((x * 7 + 7) % 1) - 0.5) < 0.06 || Math.abs(((y * 7 + 7) % 1) - 0.5) < 0.06;
    pts.push({x, y, z:(Math.random() - 0.5) * 0.08, b:onGrid ? 1 : 0.35 + Math.random() * 0.3});
  }
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const draw = t => {
    const w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const ang = reduce ? 0.6 : t / 9000, tilt = 1.05, R = Math.min(w, h) * 0.3, cx = w / 2, cy = h / 2;
    for (const p of pts) {
      const x1 = p.x * Math.cos(ang) - p.y * Math.sin(ang), y1 = p.x * Math.sin(ang) + p.y * Math.cos(ang);
      const y2 = y1 * Math.cos(tilt) - p.z * Math.sin(tilt), z2 = y1 * Math.sin(tilt) + p.z * Math.cos(tilt);
      const s = 1 / (1.6 - z2 * 0.6);
      ctx.fillStyle = `rgba(${p.b > 0.9 ? '134, 226, 170' : '210, 220, 210'}, ${p.b * (0.5 + 0.5 * s)})`;
      ctx.fillRect(cx + x1 * R * s * 1.6, cy + y2 * R * s * 1.6, 1.4, 1.4);
    }
    if (!reduce) authRAF = requestAnimationFrame(draw);
  };
  authRAF = requestAnimationFrame(draw);
}

// ---------- Profile (like LeetCode's): solved counts, streaks, a year of activity, recent submissions ----------
const dayKey = t => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
function activity(log = state.log){
  const byDay = {};
  log.forEach(([t]) => { const k = dayKey(t); byDay[k] = (byDay[k] || 0) + 1; });
  const days = Object.keys(byDay).sort();
  // Longest run of consecutive active days, and the run that reaches today (or yesterday, so it survives until the day ends).
  let max = 0, run = 0, prev = null;
  days.forEach(k => {
    const d = new Date(k + 'T12:00:00');
    run = prev && Math.round((d - prev) / 864e5) === 1 ? run + 1 : 1;
    max = Math.max(max, run); prev = d;
  });
  let cur = 0;
  const day = new Date(); day.setHours(12, 0, 0, 0);
  if (!byDay[dayKey(day)]) day.setDate(day.getDate() - 1);
  while (byDay[dayKey(day)]) { cur++; day.setDate(day.getDate() - 1); }
  const yearAgo = Date.now() - 365 * 864e5;
  return {byDay, max, cur, active:days.length, year:log.filter(x => x[0] >= yearAgo).length, today:!!byDay[dayKey(Date.now())]};
}
// A year of activity, one square per day, weeks as columns (like LeetCode and GitHub).
function heatmapSVG(byDay){
  const cell = 11, gap = 3, today = new Date(); today.setHours(12, 0, 0, 0);
  const start = new Date(today); start.setDate(start.getDate() - 364 - start.getDay());
  const weeks = Math.ceil((today - start) / (7 * 864e5)) + 1;
  let rects = '', labels = '', lastMonth = -1;
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const day = new Date(start); day.setDate(start.getDate() + w * 7 + d);
      if (day > today) continue;
      const n = byDay[dayKey(day)] || 0, lvl = n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : n < 10 ? 3 : 4;
      rects += `<rect x="${w * (cell + gap)}" y="${d * (cell + gap)}" width="${cell}" height="${cell}" rx="2.5" class="hm${lvl}"><title>${n} submission${n === 1 ? '' : 's'} on ${day.toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'})}</title></rect>`;
      if (d === 0 && day.getDate() <= 7 && day.getMonth() !== lastMonth) { lastMonth = day.getMonth(); labels += `<text x="${w * (cell + gap)}" y="${7 * (cell + gap) + 12}">${day.toLocaleDateString(undefined, {month:'short'})}</text>`; }
    }
  }
  const W = weeks * (cell + gap), H = 7 * (cell + gap) + 16;
  return `<svg class="heatmap" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Submissions per day over the past year">${rects}${labels}</svg>`;
}
const ago = t => { const s = (Date.now() - t) / 1000; return s < 60 ? 'just now' : s < 3600 ? Math.floor(s / 60) + ' min ago' : s < 86400 ? Math.floor(s / 3600) + ' h ago' : s < 86400 * 30 ? Math.floor(s / 86400) + ' days ago' : new Date(t).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'}); };
function solvedCard(title, items, statusFn, total){
  const by = d => { const l = items.filter(x => x.d === d); return [l.filter(x => statusFn(x.id) === 'solved').length, l.length]; };
  const solved = items.filter(x => statusFn(x.id) === 'solved').length, att = items.filter(x => statusFn(x.id) === 'attempted').length;
  return `<section class="card pfsolved"><h2>${title}</h2><div class="pfsrow"><div class="progring">${ring(solved / total, 120, 8, `${solved} of ${total} solved`)}<div class="ringlabel"><b>${solved}</b><span>/${total}</span><small>Solved</small></div></div>
    <div class="pfdiff">${['E', 'M', 'H'].map(d => { const [s, t] = by(d); return `<div class="pfd d-${d}"><span>${DIFF[d]}</span><b class="mono">${s}/${t}</b></div>`; }).join('')}</div></div>
    <p class="muted small">${att} attempted, not solved yet</p></section>`;
}
function recentHTML(mode){
  const seen = new Set(), rows = [];
  for (let i = state.log.length - 1; i >= 0 && rows.length < 15; i--) {
    const [t, id, ok] = state.log[i];
    if (mode === 'ac' && (!ok || seen.has(id))) continue;
    seen.add(id);
    const Q = BY_ID[id], P = CODE_BY_ID[id];
    if (!Q && !P) continue;
    const title = Q ? `${Q.n}. ${Q.q}` : `${P.n}. ${P.title}`;
    rows.push(`<li><a href="${Q ? '#p' + Q.n : '#code' + P.n}" ${Q ? `data-open="${id}"` : `data-copen="${id}"`} data-from="profile"><span class="rtitle">${esc(title)}</span>
      <span class="rmeta">${mode === 'all' ? `<span class="${ok ? 'v-ok' : 'v-bad'}">${ok ? 'Accepted' : 'Wrong Answer'}</span>` : ''}<span class="cotag">${Q ? 'Theory' : esc(LANGS[P.lang])}</span><span class="muted">${ago(t)}</span></span></a></li>`);
  }
  return rows.length ? `<ul class="recent">${rows.join('')}</ul>` : `<p class="muted">${mode === 'ac' ? 'Problems you solve show up here.' : 'Every answer and submission shows up here.'}</p>`;
}
function viewProfile(){
  const A = activity(), u = acct.user, P = ui.prof || (ui.prof = {recent:'ac'});
  const name = u ? (u.displayName || (u.email || '').split('@')[0] || 'You') : 'Guest';
  const initial = (name[0] || 'G').toUpperCase();
  const langs = {};
  CODING.forEach(p => { if (codeStatus(p.id) === 'solved') langs[p.lang] = (langs[p.lang] || 0) + 1; });
  const groups = [['Advanced', [18, 19, 20, 21, 22]], ['Intermediate', [10, 11, 12, 13, 14, 15, 16, 17]], ['Fundamental', [1, 2, 3, 4, 5, 6, 7, 8, 9, 23]]];
  const skills = groups.map(([g, chs]) => {
    const tags = chs.map(ch => [ch, solvedIn(CH_IDS[ch])]).filter(x => x[1]).sort((a, b) => b[1] - a[1]);
    return `<div class="pfskill"><b>${g}</b><div class="row">${tags.length ? tags.map(([ch, n]) => `<button type="button" class="topicchip" data-act="topic-filter" data-ch="${ch}">${esc(TOPICS[ch])} <span class="muted">×${n}</span></button>`).join('') : '<span class="muted small">Nothing solved yet</span>'}</div></div>`;
  }).join('');
  const quests = UNITS.filter(U => unitPassed(U.id)).length;
  const mocks = state.hist.filter(h => h.mode === 'mock').slice(0, 4);
  return `<div class="pfgrid"><aside class="pfside">
    <section class="card pfme"><div class="pfwho">${u && u.photoURL ? `<img class="pfav" src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">` : `<span class="pfav">${esc(initial)}</span>`}
      <div><h1>${esc(name)}</h1><p class="muted small">${u ? esc(u.email || '') : esc(store.status)}</p></div></div>
      ${acct.ready ? (u ? '<button type="button" class="btn small" data-act="signout">Sign out</button>' : '<button type="button" class="btn small primary" data-act="signin">Sign in to sync your progress</button>') : `<p class="muted small">${esc(store.status)}.</p>`}
      <div class="pfquick"><div><b>${quests}<span class="muted">/${UNITS.length}</span></b><span>quests</span></div><div><b>${A.active}</b><span>active days</span></div><div><b>${state.log.length}</b><span>submissions</span></div></div></section>
    <section class="card"><h2>Languages</h2>${Object.keys(langs).length ? `<div class="pflangs">${Object.keys(langs).sort((a, b) => langs[b] - langs[a]).map(l => `<div><span class="cotag">${esc(LANGS[l])}</span><span class="muted small"><b class="mono">${langs[l]}</b> problems solved</span></div>`).join('')}</div>` : '<p class="muted small">Solve a coding problem to see your languages.</p>'}</section>
    <section class="card"><h2>Skills</h2>${skills}</section>
    <section class="card" id="progress-card"><h2>Your data</h2><p class="muted small">${acct.user ? 'Synced to your account on every device where you sign in.' : 'Saved in this browser.'}</p>
      ${STANDALONE ? '<div class="row"><button type="button" class="btn small" data-act="export">Export progress</button><button type="button" class="btn small" data-act="import">Import progress</button><input type="file" id="import-file" accept="application/json,.json" hidden></div>' : ''}
      ${acct.user ? (ui.confirmDelete ? '<div class="row"><span class="small">Delete your account and everything saved in it? This cannot be undone.</span><button type="button" class="btn small danger" data-act="delete-yes">Delete account</button><button type="button" class="btn small primary" data-act="delete-no">Keep it</button></div>' : '<button type="button" class="btn small ghost" data-act="delete">Delete my account and data</button>') : ''}
      <button type="button" class="linkbtn small" data-act="go" data-v="privacy">How your data is handled →</button>
      ${isAdmin() ? '<button type="button" class="btn small primary" data-act="adm-open">Admin dashboard →</button>' : ''}
      ${ui.confirmReset ? '<div class="row"><span class="small">Erase all progress?</span><button type="button" class="btn small" data-act="reset-yes">Erase everything</button><button type="button" class="btn small primary" data-act="reset-no">Keep it</button></div>' : '<button type="button" class="btn small ghost" data-act="reset">Reset progress</button>'}</section>
  </aside>
  <section class="pfmain">
    <div class="pfcards">${solvedCard('Theory', BANK, statusOf, BANK.length)}${solvedCard('Coding', CODING, codeStatus, CODING.length)}
      <section class="card pfstreak"><h2>Streak</h2><div class="pfflame${A.today ? ' on' : ''}" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2c1 4-3 6-3 10a3 3 0 006 0c0-2-1-3-1-5 3 2 5 5 5 8a7 7 0 01-14 0c0-6 7-8 7-13z"/></svg></div>
        <b class="pfbig">${A.cur} day${A.cur === 1 ? '' : 's'}</b><span class="muted small">${A.today ? 'Solved today. Keep it going.' : A.cur ? 'Solve one today to keep your streak.' : 'Solve one problem to start a streak.'}</span>
        <div class="pfquick"><div><b>${A.max}</b><span>max streak</span></div><div><b>${A.active}</b><span>active days</span></div></div></section></div>
    <section class="card"><div class="row between"><h2><b class="mono">${A.year}</b> submissions in the past one year</h2><span class="muted small">Total active days: <b>${A.active}</b> · Max streak: <b>${A.max}</b></span></div>
      <div class="hmwrap">${heatmapSVG(A.byDay)}</div>
      <div class="hmlegend"><span class="muted small">Less</span>${[0, 1, 2, 3, 4].map(l => `<i class="hm${l}"></i>`).join('')}<span class="muted small">More</span></div></section>
    <section class="card"><div class="row between"><div class="seg" role="tablist"><button type="button" role="tab" aria-selected="${P.recent === 'ac'}" data-act="pf-recent" data-v="ac">Recent AC</button><button type="button" role="tab" aria-selected="${P.recent === 'all'}" data-act="pf-recent" data-v="all">Submissions</button></div>
      <button type="button" class="linkbtn" data-act="go" data-v="theory">View all problems →</button></div>${recentHTML(P.recent)}</section>
    ${mocks.length ? `<section class="card"><h2>Timed mocks</h2><div class="hist">${mocks.map(h => `<div><span>${dayStr(h.at)}</span><span class="mono">${h.score}/${h.total}</span></div>`).join('')}</div></section>` : ''}
  </section></div>`;
}

// ---------- Roadmap map: every topic you need for a VLSI role, as a graph of prerequisites ----------
// Nodes: q = theory quest (u), c = hands-on coding track (area), r = role path (Roles page), x = interview prep.
// x is the column (0–4), y the row; edges run from prerequisite to topic.
const RM_NODES = [
  {id:'u1', u:1, x:0, y:0}, {id:'u7', u:7, x:1, y:0}, {id:'u23', u:23, x:4, y:0},
  {id:'u2', u:2, x:0, y:1}, {id:'u3', u:3, x:2, y:1}, {id:'c-cpp', area:'C and C++', label:'C and C++ coding', x:4, y:1},
  {id:'u4', u:4, x:0, y:2}, {id:'c-py', area:'Python and MATLAB', label:'Python and MATLAB', x:4, y:2},
  {id:'u5', u:5, x:0, y:3}, {id:'c-sh', area:'Linux and scripting', label:'Linux, shell and scripting', x:4, y:3},
  {id:'u6', u:6, x:0, y:4}, {id:'u8', u:8, x:1, y:4},
  {id:'u9', u:9, x:1, y:5},
  {id:'u10', u:10, x:1, y:6}, {id:'u22', u:22, x:3, y:6},
  {id:'u18', u:18, x:0, y:7}, {id:'u12', u:12, x:1, y:7}, {id:'u11', u:11, x:2, y:7},
  {id:'u19', u:19, x:1, y:8}, {id:'u13', u:13, x:2, y:8},
  {id:'u14', u:14, x:0, y:9}, {id:'c-rtl', area:'RTL design', label:'RTL design coding', x:1, y:9}, {id:'u16', u:16, x:2, y:9}, {id:'u20', u:20, x:3, y:9},
  {id:'u15', u:15, x:0, y:10}, {id:'c-ver', area:'Verification', label:'Verification coding', x:1, y:10}, {id:'u17', u:17, x:2, y:10}, {id:'u21', u:21, x:3, y:10},
  {id:'c-pd', area:'Physical design', label:'Physical design: Tcl and SDC', x:2, y:11}, {id:'c-gpu', area:'GPU and CUDA', label:'CUDA and GPU coding', x:3, y:11},
  {id:'r-circuit', role:'Custom Circuit Design (SRAM, analog, SerDes)', label:'Role: circuit design', x:0, y:12},
  {id:'r-asic', role:'ASIC Design (RTL)', label:'Role: ASIC design', x:1, y:12},
  {id:'r-dv', role:'Design Verification', label:'Role: verification', x:2, y:12},
  {id:'r-pd', role:'Physical Design and Timing', label:'Role: physical design', x:3, y:12},
  {id:'r-arch', role:'Architecture and Performance', label:'Role: architecture', x:4, y:12},
  {id:'x-prep', label:'Interview prep by company', x:2, y:13},
];
const RM_EDGES = [['u1', 'u2'], ['u1', 'u3'], ['u2', 'u4'], ['u4', 'u5'], ['u5', 'u6'], ['u5', 'u8'], ['u7', 'u8'], ['u8', 'u9'], ['u9', 'u10'], ['u9', 'u22'],
  ['u10', 'u18'], ['u10', 'u12'], ['u10', 'u11'], ['u12', 'u19'], ['u11', 'u19'], ['u11', 'u13'], ['u13', 'u14'], ['u13', 'u16'], ['u14', 'u15'], ['u16', 'u17'],
  ['u19', 'c-rtl'], ['c-rtl', 'c-ver'], ['u19', 'u20'], ['u22', 'u20'], ['u20', 'u21'], ['u17', 'c-pd'], ['u21', 'c-gpu'], ['u23', 'c-cpp'], ['c-cpp', 'c-py'], ['c-py', 'c-sh'],
  ['u15', 'r-circuit'], ['c-ver', 'r-asic'], ['c-ver', 'r-dv'], ['c-pd', 'r-pd'], ['c-sh', 'r-pd'], ['c-gpu', 'r-arch'],
  ['r-circuit', 'x-prep'], ['r-asic', 'x-prep'], ['r-dv', 'x-prep'], ['r-pd', 'x-prep'], ['r-arch', 'x-prep']];
const RM = {w:176, h:58, dx:204, dy:88, by:Object.fromEntries(RM_NODES.map(n => [n.id, n]))};
const RM_W = 4 * RM.dx + RM.w, RM_H = 13 * RM.dy + RM.h;
// Progress (0–1) and state of one node.
function rmInfo(n){
  if (n.u) {
    const U = UNITS[n.u - 1], passed = unitPassed(n.u), cd = cardsDone(U), nu = nextUnit();
    return {title:U.title, kind:`Quest ${n.u} · theory`, frac:passed ? 1 : cd / (U.cards.length + 1), state:passed ? 'done' : nu && nu.id === n.u ? 'current' : unitUnlocked(n.u) ? 'open' : 'locked'};
  }
  if (n.area) {
    const l = CODING.filter(p => p.area === n.area), s = codeSolvedIn(l);
    return {title:n.label, kind:'Hands-on coding', frac:l.length ? s / l.length : 0, state:s === l.length ? 'done' : s ? 'current' : 'open', count:`${s}/${l.length} solved`};
  }
  if (n.role) {
    const R = ROLES.find(r => r.name === n.role), done = R.ch.filter(unitPassed).length;
    return {title:n.label, kind:'Role path', frac:done / R.ch.length, state:done === R.ch.length ? 'done' : 'open', count:`${done}/${R.ch.length} quests`};
  }
  const s = solvedIn(BANK.map(Q => Q.id));
  return {title:n.label, kind:'Interview prep', frac:s / BANK.length, state:'open', count:`${s}/${BANK.length} theory solved`};
}
function rmNodesHTML(){
  const pos = n => [n.x * RM.dx, n.y * RM.dy];
  const lines = RM_EDGES.map(([a, b]) => {
    const A = RM.by[a], B = RM.by[b], [ax, ay] = pos(A), [bx, by] = pos(B);
    const x1 = ax + RM.w / 2, y1 = ay + RM.h, x2 = bx + RM.w / 2, y2 = by, mid = y2 - (RM.dy - RM.h) / 2;
    const done = rmInfo(A).state === 'done';
    return `<path class="${done ? 'lit' : ''}" d="M${x1} ${y1} V${mid} H${x2} V${y2}"/>`;
  }).join('');
  const sel = ui.rm.sel;
  const nodes = RM_NODES.map(n => {
    const I = rmInfo(n), [x, y] = pos(n);
    return `<button type="button" class="rmnode ${I.state} k-${n.u ? 'q' : n.area ? 'c' : n.role ? 'r' : 'x'}${sel === n.id ? ' sel' : ''}" style="left:${x}px;top:${y}px" data-act="rm-sel" data-v="${n.id}" aria-label="${esc(I.title)}">
      <span class="rmt">${esc(I.title)}</span><span class="rmbar"><i style="width:${Math.round(I.frac * 100)}%"></i></span></button>`;
  }).join('');
  return `<svg class="rmlines" width="${RM_W}" height="${RM_H}" aria-hidden="true">${lines}</svg>${nodes}`;
}
function rmPanelHTML(){
  const n = RM.by[ui.rm.sel] || RM_NODES[0], I = rmInfo(n);
  let body = '', btn = '';
  if (n.u) {
    const U = UNITS[n.u - 1], ids = CH_IDS[n.u];
    body = `<p class="muted small">${esc(U.goal || '')}</p><ol class="rmlessons">${U.cards.map((c, i) => `<li class="${state.learn.cards['u' + n.u + 'c' + i] ? 'ok' : ''}">${esc(c.t)}</li>`).join('')}<li class="${unitPassed(n.u) ? 'ok' : ''}">Checkpoint: ${UNIT_PASS} of ${UNIT_N} right</li></ol>
      <p class="muted small">${solvedIn(ids)}/${ids.length} theory problems solved in this topic.</p>`;
    btn = `<button type="button" class="btn primary" data-act="open-unit" data-u="${n.u}">${unitPassed(n.u) ? 'Review quest' : unitUnlocked(n.u) ? (cardsDone(U) ? 'Continue quest' : 'Start quest') : 'Open (test out)'} →</button><button type="button" class="btn" data-act="topic-filter" data-ch="${n.u}">Practice problems</button>`;
  } else if (n.area) {
    body = `<p class="muted small">Write real ${esc(n.area === 'RTL design' ? 'Verilog' : n.area)} code. ${CODING.filter(p => p.area === n.area && p.run).length} of these problems are judged right in your browser.</p><p class="small"><b>${esc(I.count)}</b></p>`;
    btn = `<button type="button" class="btn primary" data-act="c-area-go" data-v="${esc(n.area)}">Open coding problems →</button>`;
  } else if (n.role) {
    const R = ROLES.find(r => r.name === n.role);
    body = `<p class="muted small">${esc(R.what)}</p><div class="row">${R.ch.map(c => `<button type="button" class="topicchip${unitPassed(c) ? ' ok' : ''}" data-act="rm-sel" data-v="u${c}">${unitPassed(c) ? '✓ ' : ''}${esc(TOPICS[c])}</button>`).join('')}</div><p class="muted small">Also: ${esc(R.add)}</p>`;
    btn = '<button type="button" class="btn primary" data-act="go" data-v="roles">See all roles →</button>';
  } else {
    body = '<p class="muted small">Practice the theory and coding lists tagged for the company you are applying to, including the questions reported from real assessments.</p>';
    btn = '<button type="button" class="btn primary" data-act="go" data-v="companies">Browse companies →</button>';
  }
  return `<p class="eyebrow">${esc(I.kind)}</p><h3>${esc(I.title)}</h3><div class="rmprog"><span class="rmbar"><i style="width:${Math.round(I.frac * 100)}%"></i></span><span class="mono small">${Math.round(I.frac * 100)}%</span></div>${body}<div class="row">${btn}</div>`;
}
function roadmapHTML(){
  const done = UNITS.filter(U => unitPassed(U.id)).length, cs = codeSolvedIn(CODING), R = ui.rm;
  return `<div class="rmtop">
    <section class="card"><h3>Who is it for?</h3><ul class="rmwho"><li>Students aiming for VLSI and hardware internships or new-grad roles</li><li>Anyone new to hardware who wants one clear path</li><li>Engineers moving into ASIC design, verification or physical design</li><li>Candidates preparing for hardware OAs and interviews</li></ul></section>
    <section class="card rmprogcard"><h3>Progress</h3><div class="rmgauge">${ring(done / UNITS.length, 120, 10, `${done} of ${UNITS.length} quests passed`)}<div class="ringlabel"><b>${done}</b><span>/${UNITS.length} quests</span></div></div><p class="muted small center">${cs}/${CODING.length} coding problems solved</p></section>
    <section class="card rmdetail" id="rmdetail">${rmPanelHTML()}</section></div>
  <div class="rmboard"><div class="rmtools"><button type="button" class="iconbtn" data-act="rm-zoom" data-v="in" aria-label="Zoom in">+</button><button type="button" class="iconbtn" data-act="rm-zoom" data-v="out" aria-label="Zoom out">−</button><button type="button" class="iconbtn" data-act="rm-zoom" data-v="fit" aria-label="Fit to screen">⤢</button></div>
    <span class="rmhint">Drag to move · scroll or pinch to zoom · click a topic for details</span>
    <div class="rmscroll" id="rmscroll"><div class="rminner" style="width:${RM_W}px;height:${RM_H}px;transform:translate(${R.tx}px, ${R.ty}px) scale(${R.z})">${rmNodesHTML()}</div></div>
    <div class="rmlegend"><span><i class="lg q"></i>Theory quest</span><span><i class="lg c"></i>Coding track</span><span><i class="lg r"></i>Role path</span><span><i class="lg done"></i>Done</span><span class="rmzoom mono" id="rmzoom">${Math.round(R.z * 100)}%</span></div></div>`;
}
function rmRefreshSel(){
  document.querySelectorAll('.rmnode').forEach(b => b.classList.toggle('sel', b.dataset.v === ui.rm.sel));
  const d = $('#rmdetail'); if (d) d.innerHTML = rmPanelHTML();
}
// The map is a canvas: ui.rm holds its zoom (z) and offset (tx, ty) in pixels.
function rmApply(){
  const inn = $('.rminner'); if (!inn) return;
  inn.style.transform = `translate(${ui.rm.tx}px, ${ui.rm.ty}px) scale(${ui.rm.z})`;
  const z = $('#rmzoom'); if (z) z.textContent = Math.round(ui.rm.z * 100) + '%';
}
// Zooms by factor f around a point (px, py) inside the canvas, so that point stays put.
function rmZoomAt(f, px, py){
  const R = ui.rm, z = Math.max(0.3, Math.min(2.2, R.z * f)), k = z / R.z;
  R.tx = px - (px - R.tx) * k; R.ty = py - (py - R.ty) * k; R.z = z;
  rmApply();
}
function rmZoom(v){
  const sc = $('#rmscroll'); if (!sc) return;
  const w = sc.clientWidth, h = sc.clientHeight;
  if (v === 'fit') {
    const R = ui.rm;
    R.z = Math.max(0.3, Math.min(0.9, (w - 120) / RM_W));
    R.tx = Math.max(60, (w - RM_W * R.z) / 2); R.ty = 24;
    rmApply();
  } else rmZoomAt(v === 'in' ? 1.2 : 1 / 1.2, w / 2, h / 2);
}
// Drag to pan, wheel or trackpad pinch to zoom, two-finger pinch on touch screens.
const rmPtr = {pts:new Map(), moved:0, last:null, dist:0, dragged:false};
document.addEventListener('pointerdown', e => {
  const sc = e.target.closest('#rmscroll'); if (!sc || e.button > 0) return;
  rmPtr.pts.set(e.pointerId, {x:e.clientX, y:e.clientY}); rmPtr.moved = 0; rmPtr.dragged = false;
  if (rmPtr.pts.size === 2) { const [p, q] = [...rmPtr.pts.values()]; rmPtr.dist = Math.hypot(p.x - q.x, p.y - q.y); }
  sc.classList.add('grabbing');
});
document.addEventListener('pointermove', e => {
  if (!rmPtr.pts.has(e.pointerId)) return;
  const sc = $('#rmscroll'); if (!sc) { rmPtr.pts.clear(); return; }
  const prev = rmPtr.pts.get(e.pointerId), dx = e.clientX - prev.x, dy = e.clientY - prev.y;
  rmPtr.pts.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if (rmPtr.pts.size === 2) {
    const [p, q] = [...rmPtr.pts.values()], d = Math.hypot(p.x - q.x, p.y - q.y), r = sc.getBoundingClientRect();
    if (rmPtr.dist) rmZoomAt(d / rmPtr.dist, (p.x + q.x) / 2 - r.left, (p.y + q.y) / 2 - r.top);
    rmPtr.dist = d; rmPtr.dragged = true; return;
  }
  rmPtr.moved += Math.abs(dx) + Math.abs(dy);
  if (rmPtr.moved > 4) { rmPtr.dragged = true; ui.rm.tx += dx; ui.rm.ty += dy; rmApply(); }
});
const rmUp = e => { if (!rmPtr.pts.delete(e.pointerId)) return; rmPtr.dist = 0; if (!rmPtr.pts.size) { const sc = $('#rmscroll'); if (sc) sc.classList.remove('grabbing'); } };
document.addEventListener('pointerup', rmUp);
document.addEventListener('pointercancel', rmUp);
document.addEventListener('wheel', e => {
  const sc = e.target.closest && e.target.closest('#rmscroll'); if (!sc) return;
  e.preventDefault();
  const r = sc.getBoundingClientRect();
  if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) >= Math.abs(e.deltaX)) rmZoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX - r.left, e.clientY - r.top);
  else { ui.rm.tx -= e.deltaX; rmApply(); }
}, {passive:false});

// ---------- Admin dashboard: every signed-in user's progress, readable only by the accounts in FIREBASE_ADMINS ----------
const isAdmin = () => !!(acct.user && Array.isArray(window.FIREBASE_ADMINS) && window.FIREBASE_ADMINS.includes(acct.user.uid));
async function loadAdmin(){
  ui.adm = Object.assign(ui.adm || {sort:'last', dir:-1}, {loading:true, err:'', rows:null});
  render();
  try {
    const snap = await firebase.firestore().collection('users').get();
    ui.adm.rows = snap.docs.map(d => {
      const x = d.data() || {};
      let st;
      try { st = normalize(JSON.parse(x.state || '{}')); } catch (e) { st = emptyState(); }
      const A = activity(st.log), times = st.log.map(l => l[0]).concat(Object.values(st.q).map(q => q.at)).filter(Boolean);
      const solved = Object.keys(st.q).filter(id => st.q[id].c > 0).length;
      const tries = Object.values(st.q).reduce((n, q) => n + q.n, 0), right = Object.values(st.q).reduce((n, q) => n + q.c, 0);
      return {uid:d.id, name:String(x.name || '').slice(0, 100), email:String(x.email || '').slice(0, 200), st, solved,
        provider:{'google.com':'Google', 'password':'Email'}[x.provider] || (x.provider ? String(x.provider) : '–'), created:num(x.created), lastLogin:num(x.lastLogin),
        oaN:st.oaHist.length, oaBest:st.oaHist.reduce((m, h) => Math.max(m, h.pct), 0),
        code:Object.keys(st.code).filter(id => st.code[id].solved).length, quests:Object.keys(st.learn.units).filter(u => st.learn.units[u].passed).length,
        subs:st.log.length, acc:tries ? right / tries : 0, cur:A.cur, max:A.max, active:A.active, byDay:A.byDay,
        first:times.length ? Math.min(...times) : 0, last:Math.max(num(x.updatedAt), times.length ? Math.max(...times) : 0)};
    });
  } catch (e) { ui.adm.err = (e && e.code === 'permission-denied') ? 'Firebase refused: this account is not allowed to read other users. Check FIREBASE_ADMINS and the published rules.' : 'Could not load users: ' + ((e && e.message) || e); }
  if (ui.adm.rows) {
    try {
      const ps = await firebase.firestore().collection('premium').get(), P = {};
      ps.docs.forEach(d => { P[d.id] = d.data() || {}; });
      ui.adm.prem = P;
      ui.adm.rows.forEach(r => { const p = P[r.uid]; r.prem = p || null; r.premOn = p && p.active && (!p.until || p.until > Date.now()) ? 1 : 0; });
      const c = await firebase.firestore().collection('premium_content').doc('main').get();
      ui.adm.content = c.exists ? {at:num(c.data().updatedAt), size:String(c.data().data || '').length} : null;
    } catch (e) { ui.adm.premErr = 'Could not read subscriptions: ' + ((e && e.message) || e); }
  }
  ui.adm.loading = false;
  if (ui.tab === 'admin' && ui.view === 'tab') render();
}
// Grants, edits or revokes Premium for one account (admin only; the rules refuse anyone else).
async function adminSetPremium(uid, patch){
  const ref = firebase.firestore().collection('premium').doc(uid), cur = (ui.adm.prem || {})[uid] || {};
  const rec = Object.assign({active:false, plan:'monthly', since:0, until:null, note:'', by:acct.user.uid}, cur, patch, {by:acct.user.uid});
  if (rec.active && !rec.since) rec.since = Date.now();
  Object.keys(rec).forEach(k => { if (rec[k] === undefined) delete rec[k]; });   // Firestore refuses undefined values
  try { await ref.set(rec); toast(rec.active ? 'Premium saved' : 'Premium revoked'); }
  catch (e) { toast('Could not save: ' + ((e && e.message) || e)); }
  loadAdmin();
}
// Uploads the Premium company data (private/premium-content.json from the build) to Firestore.
async function adminUploadContent(file){
  try {
    const text = await file.text(), data = JSON.parse(text);
    if (!data || !data.companies || !Array.isArray(data.assessments)) throw new Error('This is not a Premium content file (it needs companies and assessments).');
    await firebase.firestore().collection('premium_content').doc('main').set({data:text, updatedAt:Date.now()});
    applyPremium(data); toast('Premium content uploaded'); loadAdmin();
  } catch (e) { toast('Upload failed: ' + ((e && e.message) || e)); }
}
function viewAdmin(){
  if (!isAdmin()) return `<section class="pagehead"><p class="eyebrow">Admin</p><h1>Owner only</h1><p class="muted">This page is only for the site owner's account.</p></section>`;
  const D = ui.adm;
  if (!D || D.loading) return '<section class="pagehead"><p class="eyebrow">Admin</p><h1>Loading users…</h1></section>';
  if (D.err) return `<section class="pagehead"><p class="eyebrow">Admin</p><h1>Admin dashboard</h1><p class="autherr">${esc(D.err)}</p></section>`;
  const rows = D.rows, now = Date.now(), within = d => rows.filter(r => r.last >= now - d * 864e5).length;
  // Daily active users over the last 30 days.
  const days = Array.from({length:30}, (_, i) => { const t = new Date(); t.setHours(12, 0, 0, 0); t.setDate(t.getDate() - 29 + i); return t; });
  const dau = days.map(t => rows.filter(r => r.byDay[dayKey(t)]).length), peak = Math.max(1, ...dau);
  // Where people get stuck: accuracy by topic, and the problems with the most failed attempts.
  const ch = {};
  rows.forEach(r => Object.keys(r.st.q).forEach(id => { const Q = BY_ID[id]; if (!Q) return; const c = ch[Q.ch] || (ch[Q.ch] = {n:0, c:0, users:new Set()}); c.n += r.st.q[id].n; c.c += Math.min(r.st.q[id].c, r.st.q[id].n); c.users.add(r.uid); }));
  const topics = Object.keys(ch).map(k => ({ch:+k, ...ch[k], acc:ch[k].n ? ch[k].c / ch[k].n : 0})).filter(t => t.n >= 3).sort((a, b) => a.acc - b.acc).slice(0, 8);
  const fails = {};
  rows.forEach(r => {
    Object.keys(r.st.q).forEach(id => { const q = r.st.q[id], f = fails[id] || (fails[id] = {miss:0, users:0, solved:0}); f.miss += Math.max(0, q.n - q.c); f.users++; if (q.c) f.solved++; });
    Object.keys(r.st.code).forEach(id => { const s = r.st.code[id].subs || [], f = fails[id] || (fails[id] = {miss:0, users:0, solved:0}); f.miss += s.filter(u => u.v !== 'Accepted').length; if (s.length) f.users++; if (r.st.code[id].solved) f.solved++; });
  });
  const hard = Object.keys(fails).filter(id => fails[id].miss > 0).sort((a, b) => fails[b].miss - fails[a].miss).slice(0, 10);
  const cols = [['name', 'User'], ['premOn', 'Premium'], ['provider', 'Sign-in'], ['created', 'Account created'], ['lastLogin', 'Last sign-in'], ['last', 'Last active'], ['solved', 'Theory'], ['code', 'Coding'], ['quests', 'Quests'], ['cur', 'Streak'], ['max', 'Best'], ['subs', 'Submissions'], ['oaN', 'OAs'], ['acc', 'Accuracy']];
  const key = D.sort, sorted = rows.slice().sort((a, b) => { const x = a[key], y = b[key]; return (typeof x === 'string' ? x.localeCompare(y) : x - y) * D.dir; });
  const date = t => t ? new Date(t).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'}) : '–';
  return `<section class="pagehead"><p class="eyebrow">Admin</p><h1>Admin <em>dashboard</em></h1><p class="muted">Every signed-in account and its saved progress. Visitors who never sign in are not counted. Only your account can open this page.</p>
      <div class="row"><button type="button" class="btn small" data-act="adm-reload">Refresh</button>${STANDALONE ? '<button type="button" class="btn small" data-act="adm-csv">Download CSV</button>' : ''}</div></section>
    <div class="admstats">${[[rows.length, 'accounts'], [rows.filter(r => r.premOn).length, 'Premium'], [within(1), 'active today'], [within(7), 'active in 7 days'], [within(30), 'active in 30 days'], [rows.reduce((n, r) => n + r.subs, 0), 'submissions'], [rows.reduce((n, r) => n + r.oaN, 0), 'assessments taken']].map(([n, l]) => `<div class="card"><b>${n.toLocaleString()}</b><span>${l}</span></div>`).join('')}</div>
    <section class="card"><h2>Daily active users, last 30 days</h2><div class="dau" role="img" aria-label="Daily active users over the last 30 days">${dau.map((n, i) => `<div title="${days[i].toLocaleDateString(undefined, {month:'short', day:'numeric'})}: ${n} user${n === 1 ? '' : 's'}"><i style="height:${Math.round(n / peak * 100)}%"></i></div>`).join('')}</div>
      <div class="row between muted small"><span>${days[0].toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span><span>peak ${Math.max(...dau)}</span><span>today</span></div></section>
    <section class="card"><h2>Users</h2><div class="tablewrap"><table class="ptable admtable"><thead><tr>${cols.map(([k, l]) => `<th><button type="button" class="thsort${key === k ? ' on' : ''}" data-act="adm-sort" data-v="${k}">${l}${key === k ? (D.dir > 0 ? ' ↑' : ' ↓') : ''}</button></th>`).join('')}</tr></thead>
      <tbody>${sorted.map(r => `<tr><td><b>${esc(r.name || '(no name)')}</b><br><span class="muted small">${esc(r.email || r.uid)}</span></td><td>${r.premOn ? `<span class="cotag rep">${esc(PLANS[r.prem.plan] || 'Active')}</span> <button type="button" class="linkbtn small" data-act="adm-prem" data-v="${esc(r.uid)}" data-on="0">Revoke</button>` : `<button type="button" class="btn small" data-act="adm-prem" data-v="${esc(r.uid)}" data-on="1">Grant</button>`}</td><td>${esc(r.provider)}</td><td>${date(r.created || r.first)}</td><td>${r.lastLogin ? ago(r.lastLogin) : '–'}</td><td>${r.last ? ago(r.last) : '–'}</td><td class="mono">${r.solved}</td><td class="mono">${r.code}</td><td class="mono">${r.quests}/${UNITS.length}</td><td class="mono">${r.cur}</td><td class="mono">${r.max}</td><td class="mono">${r.subs}</td><td class="mono">${r.oaN}${r.oaN ? ` · best ${Math.round(r.oaBest)}%` : ''}</td><td class="mono">${Math.round(r.acc * 100)}%</td></tr>`).join('') || '<tr><td colspan="14" class="empty">No accounts yet.</td></tr>'}</tbody></table></div></section>
    ${adminSubsHTML(rows, date)}
    <div class="grid2"><section class="card"><h2>Hardest topics</h2><p class="muted small">Lowest share of correct answers across all users (topics with at least 3 answers).</p>
      ${topics.length ? `<div class="admbars">${topics.map(t => `<div><span>${esc(TOPICS[t.ch])}</span><i class="bar"><b style="width:${Math.round(t.acc * 100)}%"></b></i><span class="mono">${Math.round(t.acc * 100)}% · ${t.users.size} user${t.users.size === 1 ? '' : 's'}</span></div>`).join('')}</div>` : '<p class="muted">Not enough answers yet.</p>'}</section>
    <section class="card"><h2>Most-missed problems</h2><p class="muted small">Wrong answers and failed submissions, summed over users.</p>
      ${hard.length ? `<ul class="recent">${hard.map(id => { const Q = BY_ID[id], P = CODE_BY_ID[id], f = fails[id]; return `<li><a href="${Q ? '#p' + Q.n : '#code' + P.n}" ${Q ? `data-open="${id}"` : `data-copen="${id}"`}><span class="rtitle">${esc(Q ? Q.n + '. ' + Q.q : P.n + '. ' + P.title)}</span><span class="rmeta"><span class="v-bad">${f.miss} missed</span><span class="muted">${f.solved}/${f.users} solved</span></span></a></li>`; }).join('')}</ul>` : '<p class="muted">No misses yet.</p>'}</section></div>`;
}
function adminSubsHTML(rows, date){
  const D = ui.adm, P = D.prem || {}, byUid = Object.fromEntries(rows.map(r => [r.uid, r])), now = Date.now();
  const recs = Object.keys(P).map(uid => ({uid, r:byUid[uid], p:P[uid]})).sort((a, b) => (b.p.since || 0) - (a.p.since || 0));
  const live = recs.filter(x => x.p.active && (!x.p.until || x.p.until > now));
  const count = plan => live.filter(x => (x.p.plan || 'monthly') === plan).length;
  const C = D.content;
  return `<section class="card"><h2>Subscriptions</h2>${D.premErr ? `<p class="autherr">${esc(D.premErr)}</p>` : ''}
      <div class="admstats subs4">${[[live.length, 'active'], [count('monthly'), 'monthly'], [count('yearly'), 'yearly'], [count('gift') + count('manual'), 'gift or manual'], [live.filter(x => x.p.since >= now - 30 * 864e5).length, 'new in 30 days'], [live.filter(x => x.p.until && x.p.until < now + 7 * 864e5).length, 'ending in 7 days']].map(([n, l]) => `<div class="card"><b>${n}</b><span>${l}</span></div>`).join('')}</div>
      <p class="muted small">Grant Premium from the Users table after someone pays; then set their plan and end date here. Leave the end date empty for no end.</p>
      ${recs.length ? `<div class="tablewrap"><table class="ptable admtable"><thead><tr><th>User</th><th>Status</th><th>Plan</th><th>Since</th><th>Ends</th><th>Note</th><th></th></tr></thead><tbody>${recs.map(x => { const on = x.p.active && (!x.p.until || x.p.until > now), id = esc(x.uid); return `<tr>
        <td><b>${esc(x.r ? x.r.name || '(no name)' : '(no record)')}</b><br><span class="muted small">${esc(x.r ? x.r.email || x.uid : x.uid)}</span></td>
        <td>${on ? '<span class="cotag rep">Active</span>' : x.p.active ? '<span class="cotag">Ended</span>' : '<span class="cotag">Revoked</span>'}</td>
        <td><select id="adm-plan-${id}">${Object.keys(PLANS).map(k => `<option value="${k}"${(x.p.plan || 'monthly') === k ? ' selected' : ''}>${PLANS[k]}</option>`).join('')}</select></td>
        <td>${date(x.p.since)}</td>
        <td><input type="date" id="adm-until-${id}" value="${x.p.until ? new Date(x.p.until).toISOString().slice(0, 10) : ''}"></td>
        <td><input type="text" id="adm-note-${id}" maxlength="200" value="${esc(x.p.note || '')}" placeholder="e.g. Stripe receipt"></td>
        <td><div class="row"><button type="button" class="btn small primary" data-act="adm-prem-save" data-v="${id}">Save</button>${on ? `<button type="button" class="btn small ghost" data-act="adm-prem" data-v="${id}" data-on="0">Revoke</button>` : `<button type="button" class="btn small" data-act="adm-prem" data-v="${id}" data-on="1">Reactivate</button>`}</div></td></tr>`; }).join('')}</tbody></table></div>` : '<p class="muted">No subscribers yet.</p>'}</section>
    <section class="card"><h2>Premium content</h2><p class="muted small">The company lists and assessment formats Premium accounts receive. Build the site, then upload <code>trainer/private/premium-content.json</code>. It never goes into the public page or the repository.</p>
      <p>${C ? `Uploaded ${ago(C.at)} · ${(C.size / 1024).toFixed(1)} KB` : '<b>Not uploaded yet.</b> Premium accounts see a "coming soon" note until you upload it.'}</p>
      <div class="row"><input type="file" id="adm-content-file" accept="application/json,.json"><button type="button" class="btn small primary" data-act="adm-content-up">Upload</button></div></section>`;
}
function adminCSV(){
  const head = ['uid', 'name', 'email', 'premium', 'plan', 'premium_since', 'premium_until', 'sign_in', 'account_created', 'last_sign_in', 'joined', 'last_active', 'theory_solved', 'coding_solved', 'quests_passed', 'streak', 'best_streak', 'submissions', 'accuracy'];
  const cell = v => /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
  const iso = t => t ? new Date(t).toISOString() : '';
  const lines = [head.join(',')].concat(ui.adm.rows.map(r => [r.uid, r.name, r.email, r.premOn ? 'yes' : 'no', r.prem ? r.prem.plan || '' : '', iso(r.prem && r.prem.since), iso(r.prem && r.prem.until), r.provider, iso(r.created), iso(r.lastLogin), iso(r.first), iso(r.last), r.solved, r.code, r.quests, r.cur, r.max, r.subs, r.acc.toFixed(3)].map(cell).join(',')));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([lines.join('\n')], {type:'text/csv'}));
  a.download = 'hardcode-users-' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(a); a.click(); a.remove();
}

// ---------- Online assessment: a random company's format, with the company revealed only at the end ----------
// The formats live in assessments.js. An attempt in progress is saved (state.oa), so its timer keeps running
// across reloads and devices, like a real proctored test.
const OA_CODE_PTS = 5;   // a coding problem is worth five multiple-choice questions, scaled by hidden tests passed
const oaReady = () => ASSESSMENTS.filter(a => a.ready && CO_BY_ID[a.co]);
const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function oaBuild(A){
  const c = CO_BY_ID[A.co], tags = c.tags || '', used = new Set(), items = [], perm = {};
  const take = (pool, n) => shuffle(pool.filter(id => !used.has(id))).slice(0, n).map(id => { used.add(id); return id; });
  A.sections.forEach((sec, si) => {
    if (sec.kind === 'mcq') {
      const oa = /[ov]/.test(tags) ? BANK.filter(Q => hasTag(Q, 'o') || hasTag(Q, 'v')).map(Q => Q.id) : [];
      const rep = tags.includes('r') ? BANK.filter(Q => hasTag(Q, 'r')).map(Q => Q.id) : [];
      const core = coTheory(A.co), P = sec.pick || {};
      let ids = take(oa, P.oa || 0).concat(take(rep, P.reported || 0));
      ids = ids.concat(take(core, sec.n - ids.length));
      shuffle(ids).forEach(id => { items.push({t:'q', id, s:si}); perm[id] = shuffle([0, 1, 2, 3]); });
    } else take(sec.ids.filter(id => CODE_BY_ID[id]), sec.n).forEach(id => items.push({t:'c', id, s:si}));
  });
  return items.length ? {co:A.co, start:Date.now(), end:Date.now() + A.minutes * 60000, neg:!!ui.oaNeg, items, perm, ans:{}, src:{}, flag:{}, i:0} : null;
}
function oaStart(){
  const pool = oaReady(); if (!pool.length) return;
  const A = pool[Math.floor(Math.random() * pool.length)], at = oaBuild(A);
  if (!at) { toast('That assessment has no questions yet.'); return; }
  state.oa = at; ui.oaRes = null; ui.oaConfirm = false; save(); render(); window.scrollTo(0, 0);
}
const oaActive = () => !!(state.oa && state.oa.items && state.oa.items.length && !ui.oaGrading);
function oaStop(){ if (ui.oaTick) { clearInterval(ui.oaTick); ui.oaTick = null; } }
function oaTickStart(){
  oaStop();
  ui.oaTick = setInterval(() => {
    const T = $('#oatimer'); if (!T || !state.oa) { oaStop(); return; }
    const left = state.oa.end - Date.now();
    T.textContent = mmss(left); T.classList.toggle('low', left < 5 * 60000);
    if (left <= 0) { oaStop(); oaSubmit(true); }
  }, 1000);
}
function oaIntro(){
  const pool = oaReady(), last = state.oaHist.slice(0, 8);
  const A = pool[0], nq = A ? A.sections.filter(s => s.kind === 'mcq').reduce((n, s) => n + s.n, 0) : 0, nc = A ? A.sections.filter(s => s.kind === 'code').reduce((n, s) => n + s.n, 0) : 0;
  return `<section class="pagehead"><p class="eyebrow">Online assessment</p><h1>A real OA, from a <em>random</em> company</h1>
      <p class="muted">You get one company's assessment format, picked at random, with a single timer like HackerRank. The company stays hidden until you submit, so you practice the way the real thing feels: cold.</p></section>
    <div class="oagrid"><section class="card oastart"><h2>Before you start</h2><ul class="privlist">
        <li><b>${nq} hardware questions</b> (multiple choice and true/false) and <b>${nc} coding problem${nc === 1 ? '' : 's'}</b>, graded by hidden tests.</li>
        <li><b>One timer</b> for the whole test${A ? ` (${A.minutes} minutes)` : ''}. It keeps running if you leave the page, and the test submits itself at zero.</li>
        <li>No feedback until you submit. Flag questions to come back to them.</li>
        <li>Your answers count toward your progress, streak and profile.</li></ul>
      <label class="oaneg"><input type="checkbox" id="oa-neg"${ui.oaNeg ? ' checked' : ''}> Negative marking: lose ${A ? A.negative : 0.25} of a point per wrong multiple-choice answer (some tracks use it)</label>
      <div class="row"><button type="button" class="btn primary big" data-act="oa-start"${pool.length ? '' : ' disabled'}>Start a random assessment →</button></div></section>
    <section class="card"><h2>Companies in the pool</h2><p class="muted small">Assessments are drawn from the ready ones. The rest are on the way.</p>
      <div class="oapool">${ASSESSMENTS.filter(a => CO_BY_ID[a.co]).map(a => `<div class="${a.ready ? 'ready' : ''}">${coAvatar(CO_BY_ID[a.co])}<span>${esc(CO_BY_ID[a.co].name)}</span><em>${a.ready ? 'Ready' : 'Coming soon'}</em></div>`).join('')}</div></section></div>
    <section class="card"><h2>Past attempts</h2>${last.length ? `<div class="tablewrap"><table class="ptable"><thead><tr><th>When</th><th>Company</th><th>Hardware</th><th>Coding</th><th>Score</th><th>Time used</th></tr></thead><tbody>${last.map(h => `<tr><td>${ago(h.at)}</td><td>${CO_BY_ID[h.co] ? coBadge(CO_BY_ID[h.co]) : '?'}</td><td class="mono">${h.right}/${h.n}</td><td class="mono">${h.codeDone}/${h.codeN}</td><td class="mono"><b>${Math.round(h.pct)}%</b></td><td class="mono">${mmss(h.used)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Your attempts show up here, with the company revealed.</p>'}</section>`;
}
function oaItemHTML(O, it, k){
  const n = O.items.length;
  const nav = `<div class="row between oanavrow"><button type="button" class="btn small" data-act="oa-go" data-v="${k - 1}"${k ? '' : ' disabled'}>← Previous</button>
    <button type="button" class="btn small ghost${O.flag[it.id] ? ' on' : ''}" data-act="oa-flag" data-v="${esc(it.id)}">${O.flag[it.id] ? '⚑ Flagged' : '⚐ Flag for review'}</button>
    <button type="button" class="btn small primary" data-act="oa-go" data-v="${k + 1}"${k < n - 1 ? '' : ' disabled'}>Next →</button></div>`;
  if (it.t === 'q') {
    const Q = BY_ID[it.id], items = Q.k === 'm' ? O.perm[it.id].map(p => ({v:p, text:Q.o[p]})) : [{v:true, text:'True'}, {v:false, text:'False'}];
    return `<p class="eyebrow">Question ${k + 1} of ${n} · ${Q.k === 'm' ? 'Multiple choice' : 'True / false'}</p><p class="qtext">${esc(Q.q)}</p>
      <div class="opts" role="radiogroup">${items.map((x, j) => `<button type="button" class="opt${O.ans[it.id] === x.v ? ' sel' : ''}" role="radio" aria-checked="${O.ans[it.id] === x.v}" data-act="oa-pick" data-v="${typeof x.v === 'boolean' ? (x.v ? 'T' : 'F') : x.v}"><span class="key">${'ABCD'[j]}</span><span>${esc(x.text)}</span></button>`).join('')}</div>
      ${it.id in O.ans ? '<button type="button" class="linkbtn small" data-act="oa-clear">Clear answer</button>' : ''}${nav}`;
  }
  const p = CODE_BY_ID[it.id], src = O.src[it.id] != null ? O.src[it.id] : p.starter;
  return `<p class="eyebrow">Question ${k + 1} of ${n} · Coding · ${esc(LANGS[p.lang])}</p><h2>${esc(p.title)}</h2>
    <div class="body">${p.p.map(t => `<p>${inlineCode(t)}</p>`).join('')}</div>${p.ex ? `<pre class="code">${esc(p.ex)}</pre>` : ''}
    <textarea id="oa-code" class="oaeditor" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Your code">${esc(src)}</textarea>
    <div class="row">${p.run ? '<button type="button" class="btn small" data-act="oa-run">▶ Run examples</button>' : ''}<span class="muted small" id="oa-runout">${p.run ? 'Hidden tests run when you submit the test.' : 'Graded by hand: compare with the solution after you submit.'}</span></div>${nav}`;
}
function oaExam(){
  const O = state.oa, k = Math.min(O.i, O.items.length - 1), it = O.items[k], A = OA_BY_CO[O.co];
  const answered = O.items.filter(x => x.t === 'q' ? x.id in O.ans : (O.src[x.id] != null && O.src[x.id].trim() !== CODE_BY_ID[x.id].starter.trim())).length;
  const secs = A.sections.map((s, si) => `<p class="eyebrow">${esc(s.title)}</p><div class="oanums">${O.items.map((x, j) => x.s !== si ? '' : `<button type="button" class="${j === k ? 'cur ' : ''}${(x.t === 'q' ? x.id in O.ans : O.src[x.id] != null && O.src[x.id].trim() !== CODE_BY_ID[x.id].starter.trim()) ? 'done ' : ''}${O.flag[x.id] ? 'flag' : ''}" data-act="oa-go" data-v="${j}" aria-label="Question ${j + 1}">${j + 1}</button>`).join('')}</div>`).join('');
  return `<div class="oabar"><div><b>Hardware Engineering Online Assessment</b><span class="muted small">Company revealed when you submit${O.neg ? ' · negative marking on' : ''}</span></div>
      <span class="oatime" aria-label="Time left"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg><span id="oatimer">${mmss(O.end - Date.now())}</span></span>
      ${ui.oaConfirm ? `<span class="oaconfirm">Submit now? ${O.items.length - answered} unanswered.<button type="button" class="btn small primary" data-act="oa-submit-yes">Submit</button><button type="button" class="btn small" data-act="oa-submit-no">Keep going</button></span>`
        : '<button type="button" class="btn small primary" data-act="oa-submit">Submit test</button>'}</div>
    <div class="oaexam"><aside class="card oaside"><div class="row between"><b>Questions</b><span class="muted small">${answered}/${O.items.length} answered</span></div>${secs}
      <div class="oalegend small muted"><span><i class="lg done"></i>Answered</span><span><i class="lg flag"></i>Flagged</span></div></aside>
      <section class="card oaq" id="oaq">${oaItemHTML(O, it, k)}</section></div>`;
}
async function oaSubmit(timeUp){
  const O = state.oa; if (!O || ui.oaGrading) return;
  ui.oaGrading = true; ui.oaConfirm = false; oaStop();
  const m = $('#main'); if (ui.tab === 'oa' && m) m.innerHTML = `<section class="pagehead"><p class="eyebrow">Online assessment</p><h1>${timeUp ? "Time's up." : 'Submitted.'} Grading…</h1><p class="muted" id="oa-grading">Checking your answers.</p></section>`;
  const used = Math.min(Date.now(), O.end) - O.start, A = OA_BY_CO[O.co];
  const qs = O.items.filter(x => x.t === 'q'), cs = O.items.filter(x => x.t === 'c');
  const review = [];
  let right = 0, wrong = 0;
  qs.forEach(x => {
    const Q = BY_ID[x.id], has = x.id in O.ans, ok = has && isCorrect(Q, O.ans[x.id]);
    if (has) { record(Q, O.ans[x.id]); ok ? right++ : wrong++; }
    review.push({t:'q', id:x.id, has, ok, pick:has ? choiceText(Q, O.ans[x.id]) : null});
  });
  let codeScore = 0, codeDone = 0;
  for (let j = 0; j < cs.length; j++) {
    const p = CODE_BY_ID[cs[j].id], src = O.src[p.id];
    const touched = src != null && src.trim() !== p.starter.trim();
    let r = {t:'c', id:p.id, touched, passed:0, total:p.run ? p.run.tests.length || 1 : 1, verdict:touched ? 'Not graded' : 'Not attempted'};
    if (touched) setCode(p.id, {src:src.slice(0, CODE_MAX)});
    if (touched && p.run) {
      const g = $('#oa-grading'); if (g) g.textContent = `Running hidden tests on coding problem ${j + 1} of ${cs.length} (the first run downloads the compiler)…`;
      try {
        const res = await (p.run.kind === 'c' ? judgeC : p.run.kind === 'v' ? judgeV : judgePython)(p, src, true);
        const results = res.results || [];
        r.passed = results.filter(x => x.ok).length; r.total = results.length || r.total;
        r.verdict = res.verdict || (r.passed === r.total ? 'Accepted' : 'Wrong Answer');
      } catch (e) { r.verdict = 'Error'; }
      logSubmit(p.id, r.verdict === 'Accepted');
      if (r.verdict === 'Accepted' && codeStatus(p.id) !== 'solved') setCode(p.id, {solved:Date.now()});
    }
    codeScore += r.total ? r.passed / r.total : 0;
    if (r.verdict === 'Accepted') codeDone++;
    review.push(r);
  }
  const mcqPts = Math.max(0, right - (O.neg ? A.negative * wrong : 0)), total = qs.length + OA_CODE_PTS * cs.length;
  const score = mcqPts + OA_CODE_PTS * codeScore;
  const H = {at:Date.now(), co:O.co, right, wrong, n:qs.length, codeDone, codeN:cs.length, score:Math.round(score * 100) / 100, total, pct:total ? score / total * 100 : 0, used, neg:O.neg};
  state.oaHist.unshift(H); state.oaHist = state.oaHist.slice(0, 30);
  state.oa = null; ui.oaGrading = false;
  ui.oaRes = Object.assign({review, timeUp}, H);
  save(); renderHeader();
  if (ui.tab === 'oa' && ui.view === 'tab') { render(); window.scrollTo(0, 0); }
}
function oaResults(){
  const R = ui.oaRes, c = CO_BY_ID[R.co], A = OA_BY_CO[R.co];
  return `<section class="card oareveal">${coAvatar(c, 'lg')}<div><p class="eyebrow">${R.timeUp ? "Time's up · " : ''}The company was</p><h1>${esc(c.name)}</h1><p class="muted">This assessment followed <b>${esc(c.name)} ${esc(A.title)}</b> (${esc(A.platform)}, ${A.minutes} minutes).</p></div>
      <div class="oascore"><b>${Math.round(R.pct)}%</b><span>${R.score} / ${R.total} points</span></div></section>
    <div class="admstats oastats">${[[`${R.right}/${R.n}`, 'hardware correct'], [R.wrong, 'wrong' + (R.neg ? ' (−' + A.negative + ' each)' : '')], [R.n - R.right - R.wrong, 'skipped'], [`${R.codeDone}/${R.codeN}`, 'coding accepted'], [mmss(R.used), 'time used'], [mmss(A.minutes * 60000), 'time allowed']].map(([n, l]) => `<div class="card"><b>${n}</b><span>${l}</span></div>`).join('')}</div>
    <div class="row"><button type="button" class="btn primary" data-act="oa-again">Take another random assessment</button><button type="button" class="btn" data-act="co-open" data-v="${R.co}">Practice ${esc(c.name)}'s list →</button><button type="button" class="btn ghost" data-act="oa-home">Back to Online Assessment</button></div>
    <section class="card"><h2>Review</h2><ol class="oareview">${R.review.map(r => {
      if (r.t === 'c') { const p = CODE_BY_ID[r.id]; return `<li class="${r.verdict === 'Accepted' ? 'ok' : 'bad'}"><div class="row between"><b>${esc(p.title)}</b><span class="${r.verdict === 'Accepted' ? 'v-ok' : 'v-bad'}">${esc(r.verdict)}${r.touched && p.run ? ` · ${r.passed}/${r.total} tests` : ''}</span></div><button type="button" class="linkbtn small" data-copen="${r.id}">Open the problem and its solution →</button></li>`; }
      const Q = BY_ID[r.id];
      return `<li class="${r.ok ? 'ok' : r.has ? 'bad' : 'skip'}"><p>${esc(Q.q)}</p><p class="small">${r.has ? `Your answer: <b>${esc(r.pick)}</b> · ` : '<b>Skipped</b> · '}Correct: <b>${esc(correctText(Q))}</b></p><details><summary class="small">Why</summary><p class="small muted">${esc(Q.e)}</p></details></li>`;
    }).join('')}</ol></section>`;
}
function viewOA(){
  if (!hasPremium()) return premiumLock('The Online Assessment');
  if (ui.oaGrading) return '<section class="pagehead"><p class="eyebrow">Online assessment</p><h1>Grading…</h1></section>';
  if (state.oa && Date.now() >= state.oa.end) { setTimeout(() => oaSubmit(true), 0); return '<section class="pagehead"><p class="eyebrow">Online assessment</p><h1>Time\'s up. Grading…</h1></section>'; }
  if (oaActive()) return oaExam();
  if (ui.oaRes) return oaResults();
  return oaIntro();
}
// Saves code typed during the test (debounced like the main editor).
function oaSaveCode(){ const ed = $('#oa-code'); if (!ed || !state.oa) return; const it = state.oa.items[state.oa.i]; if (it && it.t === 'c') { state.oa.src[it.id] = ed.value.slice(0, CODE_MAX); save(); } }

// ---------- Premium: who has it, loading its data, and the Premium page ----------
// premium/{uid} = {active, plan, since, until, note, by} is written only by the admin (see firestore.rules);
// premium_content/main = {data: JSON text, updatedAt} is readable only by accounts whose premium record is active.
const PREMIUM_CFG = () => Object.assign({link:null, price:null, period:'month', yearly:null}, window.PREMIUM || {});
const PLANS = {monthly:'Monthly', yearly:'Yearly', gift:'Gift', manual:'Manual'};
async function loadPremium(){
  if (!acct.user || !window.firebase) return;
  premium.status = 'checking';
  try {
    const db = firebase.firestore();
    let active = isAdmin();
    if (!active) {
      const d = await db.collection('premium').doc(acct.user.uid).get(), p = d.exists ? d.data() : null;
      active = !!(p && p.active === true && (!p.until || p.until > Date.now()));
      premium.mine = p;
    }
    premium.status = active ? 'active' : 'inactive';
    if (active) {
      const c = await db.collection('premium_content').doc('main').get();
      if (c.exists && c.data().data) { applyPremium(JSON.parse(c.data().data)); premium.content = c.data().updatedAt || 0; }
      else premium.status = 'nocontent';
    }
  } catch (e) { premium.status = 'error'; }
  render();
}
// The lock shown on Premium pages for accounts without Premium.
function premiumLock(what){
  return `<section class="pagehead"><p class="eyebrow">Premium</p><h1>${esc(what)} is <em>Premium</em></h1>
      <p class="muted">${premium.status === 'checking' ? 'Checking your subscription…' : premium.status === 'nocontent' ? 'Your Premium is active, but the company data has not been uploaded yet. Check back soon.' : 'Company problem lists, company tags and filters, and the random-company Online Assessment come with HardCode Premium.'}</p>
      <div class="row"><button type="button" class="btn primary big" data-act="go" data-v="premium">See Premium →</button></div></section>
    <div class="cogrid locked">${COMPANIES.map(c => `<div class="cocard">${coAvatar(c)}<span class="cobody"><b>${esc(c.name)}</b><small>${esc(c.focus)}</small><span class="lockline small">${ICON.lock} Premium</span></span></div>`).join('')}</div>`;
}
function viewPremium(){
  const P = PREMIUM_CFG(), u = acct.user, active = hasPremium() || premium.status === 'active';
  const mine = premium.mine || {};
  const link = P.link && u ? P.link + (P.link.includes('?') ? '&' : '?') + 'client_reference_id=' + encodeURIComponent(u.uid) + (u.email ? '&prefilled_email=' + encodeURIComponent(u.email) : '') : P.link;
  const cta = active ? `<p class="prem-ok">${ICON.solved} You have Premium${mine.until ? ` until ${new Date(mine.until).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'})}` : ''}.</p><div class="row"><button type="button" class="btn primary big" data-act="go" data-v="companies">Open Companies →</button></div>`
    : !u && acct.ready ? '<div class="row"><button type="button" class="btn primary big" data-act="signin">Sign in to subscribe</button></div>'
    : link ? `<div class="row"><a class="btn primary big" href="${esc(link)}" target="_blank" rel="noopener">Subscribe${P.price ? ' · ' + esc(P.price) : ''} →</a></div><p class="muted small">After you pay, Premium is switched on for <b>${esc(u ? u.email || u.uid : 'your account')}</b>, usually within a day. Pay with the same email you use here.</p>`
    : '<div class="row"><button type="button" class="btn primary big" disabled>Subscriptions open soon</button></div>';
  return `<section class="pagehead prem-hero"><p class="eyebrow">HardCode Premium</p><h1>Practice for the <em>company</em> you want</h1>
      <p class="muted">Every theory and coding problem tagged by the companies that test it, the problems candidates actually reported, and timed online assessments in each company's format.</p>${cta}</section>
    <div class="prem-grid">
      ${[['Company problem lists', `${COMPANIES.length} companies, each with its theory, coding and reported problems, filtered by difficulty.`],
        ['Company tags and filters', 'See which companies test every problem, and filter Theory and Coding by company.'],
        ['Online Assessment', "A timed mock OA in a random company's real format, graded by hidden tests, with the company revealed at the end."],
        ['Reported questions', 'The questions and topics candidates reported from real assessments, kept together for each company.']].map(([t, d]) => `<section class="card"><h3>${ICON.solved} ${esc(t)}</h3><p class="muted small">${esc(d)}</p></section>`).join('')}
    </div>
    <section class="card"><h2>Companies included</h2><div class="prem-logos">${COMPANIES.map(c => `<span>${coAvatar(c)}<b>${esc(c.name)}</b></span>`).join('')}</div></section>
    <section class="card"><h2>How it works</h2><ol class="privlist"><li>Sign in, then press <b>Subscribe</b> and pay with the same email as your account.</li><li>The site owner switches Premium on for your account, usually within a day.</li><li>Sign in on any device: Companies, company tags and the Online Assessment unlock.</li></ol>
      <p class="muted small">Free forever: Theory, Coding, the judge, the Roadmap, Roles and your profile.</p></section>`;
}

// ---------- Privacy: what is stored, where, and who can see it ----------
function viewPrivacy(){
  const claude = !STANDALONE;
  return `<section class="pagehead"><p class="eyebrow">Privacy</p><h1>Your data, <em>plainly</em></h1>
    <p class="muted">What this site keeps, where it keeps it, and how to remove it. No analytics, no ads, no tracking cookies, and nothing is sold or shared.</p></section>
    <div class="privgrid">
    <section class="card"><h2>In your browser</h2><p>A copy of your progress is kept ${claude ? 'in the storage of the Claude page you are using' : 'in this browser (local storage)'}: your answers, the code you write, your submissions and streak history, and your light or dark theme choice. Clearing this site's data in your browser, or <b>Reset progress</b> on your profile, removes that copy.</p></section>
    <section class="card"><h2>With an account</h2><ul class="privlist">
      <li><b>Login</b> (Firebase Authentication, run by Google): your email address, and if you use Google sign-in, your name and profile photo link. Email sign-in stores your password only as a salted hash; nobody can read it.</li>
      <li><b>Progress</b> (Cloud Firestore, run by Google): one record holding the same progress listed above, plus your name and email, so it can follow you across devices.</li>
      <li><b>Who can see it:</b> the database rules let each account read and write only its own record; other visitors cannot see yours. The site owner can see every account and its progress (in the Firebase console and in an owner-only dashboard) to understand how the site is used, such as which topics people find hardest. It is never shared or sold.</li>
      <li><b>Remove it:</b> press <b>Delete my account and data</b> on your profile. It deletes your progress record and your login.</li></ul></section>
    <section class="card"><h2>Services your browser contacts</h2><ul class="privlist">
      <li><b>Google Fonts</b> for the Inter and JetBrains Mono typefaces.</li>
      <li><b>jsDelivr</b> (a public code CDN) the first time you run code: Python (Pyodide), the C/C++ compiler (Clang) and the Verilog tool (Yosys). Your code is compiled and run inside your browser; it is never uploaded.</li>
      <li><b>Google and Firebase</b> for sign-in and saving, only when accounts are used.</li>
      <li>Like any website request, these services see your IP address and browser type. None of them get your answers or code.</li></ul></section>
    <section class="card"><h2>Hosting</h2><p>The site itself is a static page served over HTTPS. The hosting provider keeps standard request logs (IP address and time) and this site adds nothing to them.</p>
      <p class="muted small">Questions or a removal request: open an issue on the project's GitHub repository.</p></section>
    </div>`;
}

// ---------- events ----------
document.addEventListener('click', e => {
  if (e.target.closest('[data-home]')) { e.preventDefault(); if (ui.auth) closeAuth(); goTab('home'); return; }
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
  if (a && a.dataset.act === 'rm-sel' && a.closest('#rmscroll') && rmPtr.dragged) { rmPtr.dragged = false; return; }   // that was a drag, not a click
  if (a && !a.disabled) { e.preventDefault(); act(a); return; }
  const co = e.target.closest('[data-copen]');
  if (co) {
    e.preventDefault();
    const cfrom = (co.closest('[data-from]') || {dataset:{}}).dataset.from;
    if (cfrom === 'profile') openCode(co.dataset.copen, CODING.map(p => p.id), {view:'tab', tab:'profile'});
    else if (cfrom === 'company') openCode(co.dataset.copen, coCoding(ui.co.id), {view:'company', co:ui.co.id});
    else openCode(co.dataset.copen, codeFiltered().map(p => p.id), {view:'tab', tab:'coding'});
    return;
  }
  const op = e.target.closest('[data-open]');
  if (op) {
    e.preventDefault();
    const id = op.dataset.open, fromEl = op.closest('[data-from]'), from = fromEl && fromEl.dataset.from;
    if (from === 'profile') openProblem(id, null, {view:'tab', tab:'profile'});
    else if (ui.view === 'unit') openProblem(id, CH_IDS[ui.unit.id], {view:'unit'});
    else if (from === 'company') openProblem(id, ui.co.tab === 'rep' ? coReported(ui.co.id) : coTheory(ui.co.id), {view:'company', co:ui.co.id});
    else openProblem(id, filtered().map(Q => Q.id), {view:'tab', tab:'theory'});
  }
});
function act(a){
  const S = ui.session, P = ui.pv;
  switch (a.dataset.act) {
    case 'open-unit': openUnit(+a.dataset.u); break;
    case 'go': goTab(a.dataset.v); break;
    case 'rm-sel': ui.rm.sel = a.dataset.v; rmRefreshSel(); break;
    case 'rm-zoom': rmZoom(a.dataset.v); break;
    case 'theme': setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); break;
    case 'co-open': openCompany(a.dataset.v); break;
    case 'co-back': goTab('companies'); break;
    case 'co-tab': ui.co.tab = a.dataset.v; render(); break;
    case 'co-d': ui.co.d = a.dataset.v; render(); break;
    case 'home-tab': ui.home.tab = +a.dataset.v; render(); break;
    case 'try-tab': ui.home.tryi = +a.dataset.v; render(); break;
    case 'faq': ui.home.faq = +a.dataset.v; render(); break;
    case 'try-bit': ui.home.tryv.b ^= 1 << +a.dataset.v; $('#trywid').innerHTML = tryHTML(1); break;
    case 'try-byte': ui.home.tryv.x ^= 1 << +a.dataset.v; $('#trywid').innerHTML = tryHTML(3); break;
    case 'auth-close': closeAuth(); break;
    case 'auth-privacy': closeAuth(); goTab('privacy'); break;
    case 'auth-mode': ui.auth.mode = ui.auth.mode === 'create' ? 'signin' : 'create'; ui.auth.err = ''; ui.auth.info = ''; renderAuth(); break;
    case 'auth-google': authRun(() => firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider())); break;
    case 'auth-forgot': authForgot(); break;
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
    case 'delete': ui.confirmDelete = true; render(); break;
    case 'delete-no': ui.confirmDelete = false; render(); break;
    case 'delete-yes': ui.confirmDelete = false; deleteAccount(); break;
    case 'oa-start': ui.oaNeg = !!($('#oa-neg') && $('#oa-neg').checked); oaStart(); break;
    case 'oa-go': { oaSaveCode(); const k = +a.dataset.v; if (state.oa && k >= 0 && k < state.oa.items.length) { state.oa.i = k; save(); render(); } break; }
    case 'oa-pick': { const O = state.oa, it = O && O.items[O.i]; if (!it) break; const v = a.dataset.v; O.ans[it.id] = v === 'T' ? true : v === 'F' ? false : +v; save(); render(); break; }
    case 'oa-clear': { const O = state.oa, it = O && O.items[O.i]; if (it) { delete O.ans[it.id]; save(); render(); } break; }
    case 'oa-flag': if (state.oa) { const id = a.dataset.v; if (state.oa.flag[id]) delete state.oa.flag[id]; else state.oa.flag[id] = 1; save(); render(); } break;
    case 'oa-run': {
      oaSaveCode();
      const O = state.oa, it = O && O.items[O.i], p = it && CODE_BY_ID[it.id], out = $('#oa-runout'); if (!p || !p.run) break;
      a.disabled = true; out.textContent = 'Running the examples…';
      (p.run.kind === 'c' ? judgeC : p.run.kind === 'v' ? judgeV : judgePython)(p, O.src[p.id] != null ? O.src[p.id] : p.starter, false).then(res => {
        const o = $('#oa-runout'); if (!o) return;
        const r = res.results || [], ok = r.filter(x => x.ok).length;
        o.textContent = res.error && !r.length ? (res.verdict || 'Error') + ': ' + res.error.split('\n')[0] : `${ok}/${r.length} example${r.length === 1 ? '' : 's'} passed` + (ok < r.length ? ` · first failure: ${r.find(x => !x.ok).label}` : '');
        const b = $('[data-act="oa-run"]'); if (b) b.disabled = false;
      });
      break;
    }
    case 'oa-submit': oaSaveCode(); ui.oaConfirm = true; render(); break;
    case 'oa-submit-no': ui.oaConfirm = false; render(); break;
    case 'oa-submit-yes': oaSaveCode(); oaSubmit(false); break;
    case 'oa-again': ui.oaRes = null; render(); window.scrollTo(0, 0); break;
    case 'oa-home': ui.oaRes = null; render(); break;
    case 'adm-open': goTab('admin'); loadAdmin(); break;
    case 'adm-reload': loadAdmin(); break;
    case 'adm-sort': ui.adm.dir = ui.adm.sort === a.dataset.v ? -ui.adm.dir : (a.dataset.v === 'name' ? 1 : -1); ui.adm.sort = a.dataset.v; render(); break;
    case 'adm-csv': adminCSV(); break;
    case 'adm-prem': adminSetPremium(a.dataset.v, a.dataset.on === '1' ? {active:true, since:((ui.adm.prem || {})[a.dataset.v] || {}).active ? undefined : Date.now()} : {active:false}); break;
    case 'adm-prem-save': { const id = a.dataset.v, u = $('#adm-until-' + CSS.escape(id)).value; adminSetPremium(id, {plan:$('#adm-plan-' + CSS.escape(id)).value, until:u ? Date.parse(u + 'T23:59:59') : null, note:$('#adm-note-' + CSS.escape(id)).value.slice(0, 200)}); break; }
    case 'adm-content-up': { const fi = $('#adm-content-file'); if (fi && fi.files[0]) adminUploadContent(fi.files[0]); else toast('Choose premium-content.json first.'); break; }
    case 'pf-recent': ui.prof.recent = a.dataset.v; render(); break;
    case 'mock': startSession('mock', shuffle(BANK.map(q => q.id)).slice(0, MOCK_N), {title:'Timed mock assessment', from:{view:'tab', tab:'theory'}}); break;
    case 'review-attempted': startSession('practice', shuffle(BANK.filter(Q => statusOf(Q.id) === 'attempted').map(Q => Q.id)).slice(0, 25), {title:'Attempted, not solved', from:{view:'tab', tab:'theory'}}); break;
    case 'review-oa': startSession('practice', shuffle(listIds('oav')).slice(0, 20), {title:'Your OA + variants', from:{view:'tab', tab:'theory'}}); break;
    case 'f-ch': ui.f.ch = a.dataset.v; $('#main').innerHTML = viewProblems(); break;
    case 'f-list': ui.f = Object.assign(blankFilters(), {list:a.dataset.v}); $('#main').innerHTML = viewProblems(); break;
    case 'f-list-go': ui.f = Object.assign(blankFilters(), {list:a.dataset.v}); goTab('theory'); break;
    case 'topic-filter': ui.f = Object.assign(blankFilters(), {ch:a.dataset.ch}); goTab('theory'); break;
    case 'f-reset': ui.f = blankFilters(); $('#main').innerHTML = viewProblems(); break;
    case 'cf-area': ui.cf.area = a.dataset.v; $('#main').innerHTML = viewCoding(); break;
    case 'cf-reset': ui.cf = blankCodeFilters(); $('#main').innerHTML = viewCoding(); break;
    case 'c-area-go': ui.cf = Object.assign(blankCodeFilters(), {area:a.dataset.v}); goTab('coding'); break;
    case 'cpick': {
      const list = codeFiltered(), todo = list.filter(p => codeStatus(p.id) !== 'solved'), pool = todo.length ? todo : list;
      if (pool.length) openCode(pool[Math.floor(Math.random() * pool.length)].id, list.map(p => p.id), {view:'tab', tab:'coding'});
      break;
    }
    case 'c-back': saveEditorNow(); if (ui.cback && ui.cback.view === 'company') { ui.view = 'company'; setHash('company-' + ui.co.id); render(); } else goTab(ui.cback && ui.cback.tab ? ui.cback.tab : 'coding'); break;
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
      if (pool.length) openProblem(pool[Math.floor(Math.random() * pool.length)].id, list.map(Q => Q.id), {view:'tab', tab:'theory'});
      break;
    }
    case 'pv-back': returnFrom(ui.back || {view:'tab', tab:'theory'}); break;
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
    case 'signin': openAuth(); break;
    case 'verify-resend': {
      const now = Date.now();
      if (ui.verifySent && now - ui.verifySent < 60000) { ui.verifyMsg = 'Please wait a minute before sending another link.'; render(); break; }
      ui.verifySent = now;
      acct.user.sendEmailVerification().then(() => { ui.verifyMsg = 'Sent. Check your inbox and spam folder.'; render(); }, e => { ui.verifyMsg = authErr(e); render(); });
      break;
    }
    case 'verify-check':
      acct.user.reload().then(() => acct.user.getIdToken(true)).then(() => {
        const u = firebase.auth().currentUser;
        if (u && u.emailVerified) { ui.verifyMsg = ''; onAuth(u); } else { ui.verifyMsg = 'Not verified yet. Open the link in the email first.'; render(); }
      }, e => { ui.verifyMsg = authErr(e); render(); });
      break;
    case 'signout': firebase.auth().signOut(); break;
    case 'to-progress': goTab('profile'); break;
    case 'export': exportProgress(); break;
    case 'import': $('#import-file').click(); break;
  }
}
function returnFrom(from){
  if (from && from.view === 'company') { ui.view = 'company'; setHash('company-' + from.co); render(); return; }
  if (from && from.view === 'unit' && ui.unit) { ui.view = 'unit'; render(); return; }
  goTab(from && from.tab ? from.tab : 'quest');
}
document.addEventListener('input', e => {
  if (e.target.id === 'co-q') { ui.coq = e.target.value; $('#cogrid').innerHTML = coCardsHTML(COMPANIES.filter(c => !ui.coq.trim() || (c.name + ' ' + c.focus).toLowerCase().includes(ui.coq.trim().toLowerCase()))); return; }
  if (e.target.dataset.try) {   // update the numbers without replacing the slider being dragged
    ui.home.tryv[e.target.dataset.try] = parseFloat(e.target.value);
    const t = document.createElement('div'); t.innerHTML = tryHTML(ui.home.tryi);
    const w = $('#trywid'); w.querySelector('.tryout').outerHTML = t.querySelector('.tryout').outerHTML;
    w.querySelectorAll('label b').forEach((b, i) => { b.textContent = t.querySelectorAll('label b')[i].textContent; });
    return;
  }
  if (e.target.id === 'oa-code') { clearTimeout(ui.oaSaveT); ui.oaSaveT = setTimeout(oaSaveCode, 500); return; }
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
document.addEventListener('submit', e => { if (e.target.id === 'authemail') { e.preventDefault(); authEmail(); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && ui.auth) closeAuth(); });
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

// ---------- theme: white by default, dark on request (remembered in this browser) ----------
const THEME_ICON = {dark:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
  light:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>'};
function setTheme(t){
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('ground-up-theme', t); } catch (e) { /* storage unavailable */ }
  const b = $('#theme'); if (b) { b.innerHTML = THEME_ICON[t === 'dark' ? 'light' : 'dark']; b.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'); b.title = b.getAttribute('aria-label'); }
}
let savedTheme = 'light';
try { savedTheme = localStorage.getItem('ground-up-theme') === 'dark' ? 'dark' : 'light'; } catch (e) { /* storage unavailable */ }
setTheme(savedTheme);

// ---------- boot ----------
const local = lsLoad();
if (local) state = normalize(local);
(function readHash(){
  const h = location.hash.replace('#', ''), m = /^p(\d+)$/.exec(h);
  const cm = /^code(\d+)$/.exec(h);
  if (TABS.includes(h)) ui.tab = h;
  if (cm && CODING[+cm[1] - 1]) { ui.tab = 'coding'; ui.cback = {view:'tab', tab:'coding'}; ui.cp = blankCodePage(CODING[+cm[1] - 1].id, CODING.map(p => p.id)); ui.view = 'code'; }
  else if (h === 'learn') ui.tab = 'quest';
  else if (h === 'practice' || h === 'weekly') ui.tab = 'profile';
  else if (h === 'bank' || h === 'problems') ui.tab = 'theory';
  else if (h === 'jobs') ui.tab = 'roles';
  else if (/^company-/.test(h) && CO_BY_ID[h.slice(8)]) { ui.tab = 'companies'; ui.co = {id:h.slice(8), tab:'theory', d:'all'}; ui.view = 'company'; }
  if (m && BANK[+m[1] - 1]) { ui.tab = 'theory'; ui.back = {view:'tab', tab:'theory'}; ui.pv = {id:BANK[+m[1] - 1].id, list:BANK.map(Q => Q.id), pick:undefined, result:null, reveal:false, perm:shuffle([0, 1, 2, 3])}; ui.view = 'problem'; }
})();
render();
setSync(store.status);
initStore();
initAccounts();
})();
