// The in-browser judge for C, C++ and Verilog. Nothing here touches the page, so the Node tests load it too.
// C and C++: Clang (YoWASP, compiled to WebAssembly) builds your code plus a hidden test main into a WASI
// program, which runs in a throwaway Web Worker so an infinite loop can be stopped.
// Verilog: Yosys (YoWASP) turns your module into a netlist of simple gates and flip-flops; VSim below
// simulates that netlist cycle by cycle against hidden stimulus. Most problems compare every cycle with the
// reference solution; problems where several designs are correct use property checkers (V_CHECKS).
const YOWASP = {
  clang:'https://cdn.jsdelivr.net/npm/@yowasp/clang@22.0.0-git20542-10/gen/bundle.js',
  yosys:'https://cdn.jsdelivr.net/npm/@yowasp/yosys@0.68.1207/gen/bundle.js',
};
const YOSYS_SCRIPT = top => `read_verilog -sv design.v; hierarchy -check -top ${top}; proc; flatten; opt_clean; memory; ` +
  'opt -nodffe -nosdff; techmap; opt -nodffe -nosdff; dffunmap; opt_clean; write_json net.json';

// ---------- C and C++ ----------
// run: {kind:'c', head?, pre?, subst?, tests:[[code, expected, 'out'?]]}
//   value test: [C expression, expected C expression]; a string literal compares as text.
//   'out' test: [statements, expected printed text, 'out', label]. An optional 4th element labels any test.
function cHarness(p, src, cpp){
  const R = p.run;
  (R.subst || []).forEach(([re, to]) => { src = src.replace(new RegExp(re, 'g'), to); });
  const inc = cpp ? ['cstdio', 'cstring', 'cstdint', 'cstdlib', 'string', 'vector', 'iostream'] : ['stdio.h', 'string.h', 'stdint.h', 'stdlib.h', 'stdbool.h'];
  const L = inc.map(h => `#include <${h}>`);
  if (R.head) L.push(R.head);
  L.push('#define main __your_main', '#line 1 "solution' + (cpp ? '.cpp' : '.c') + '"', src, '', '#undef main', '#line 1 "tests"');
  L.push('static void __ck_i(int i, long long g, long long e){ if (g == e) printf("\\n@@T %d 1\\n", i); else printf("\\n@@T %d 0 %lld\\n", i, g); }');
  L.push('static void __ck_s(int i, const char *g, const char *e){ if (g && strcmp(g, e) == 0) printf("\\n@@T %d 1\\n", i); else printf("\\n@@T %d 0 \\"%s\\"\\n", i, g ? g : "(null)"); }');
  L.push(cpp ? 'static void __fl(){ fflush(stdout); std::cout.flush(); }' : 'static void __fl(void){ fflush(stdout); }');
  if (R.pre) L.push(R.pre);
  L.push('int main(void){', 'setvbuf(stdout, NULL, _IONBF, 0);');
  R.tests.forEach((t, i) => {
    if (t[2] === 'out') L.push(`printf("\\n@@B ${i}\\n"); __fl(); { ${t[0]} } __fl(); printf("\\n@@E ${i}\\n");`);
    else if (/^"/.test(t[1])) L.push(`__ck_s(${i}, (${t[0]}), ${t[1]});`);
    else L.push(`__ck_i(${i}, (long long)(${t[0]}), (long long)(${t[1]}));`);
  });
  L.push('return 0; }');
  return L.join('\n');
}
// Turns the program's output into per-test results. Anything printed outside a test is "your output".
function cResults(p, out, exitInfo){
  const R = p.run, res = R.tests.map(t => ({ok:false, label:t[3] || t[0], exp:t[1], got:'(did not run)'}));
  const mine = [];
  const lines = out.split('\n');
  let block = null;
  for (const ln of lines) {
    let m;
    if ((m = /^@@T (\d+) ([01])(?: (.*))?$/.exec(ln))) { const r = res[+m[1]]; if (r) { r.ok = m[2] === '1'; r.got = r.ok ? r.exp : m[3]; } }
    else if ((m = /^@@B (\d+)$/.exec(ln))) block = {i:+m[1], text:[]};
    else if ((m = /^@@E (\d+)$/.exec(ln)) && block) {
      const r = res[block.i], norm = s => s.split('\n').map(x => x.replace(/\s+$/, '')).join('\n').replace(/^\n+|\n+$/g, '');
      const got = norm(block.text.join('\n'));
      if (r) { r.got = got; r.ok = got === norm(r.exp); }
      block = null;
    } else if (block) block.text.push(ln);
    else if (ln.trim()) mine.push(ln);
  }
  if (block && res[block.i]) res[block.i].got = block.text.join('\n') + '\n(stopped here)';
  if (exitInfo) { const r = res.find(x => x.got === '(did not run)'); if (r) r.got = exitInfo; }
  return {results:res, stdout:mine.join('\n')};
}

// Runs a compiled WASI program and collects what it prints. Used inside a throwaway worker (see wasiRun below).
function wasiExec(wasm){
  let mem, out = '', err = '';
  const dec = new TextDecoder();
  class Exit { constructor(c){ this.code = c; } }
  const V = () => new DataView(mem.buffer);
  const w = {
    fd_write(fd, iovs, n, nw){ const v = V(); let t = 0; for (let i = 0; i < n; i++) { const p = v.getUint32(iovs + 8 * i, true), l = v.getUint32(iovs + 8 * i + 4, true); const s = dec.decode(new Uint8Array(mem.buffer, p, l)); if (fd === 1) out += s; else err += s; t += l; } v.setUint32(nw, t, true); if (out.length > 200000) throw new Exit(-2); return 0; },
    fd_read(fd, iovs, n, nr){ V().setUint32(nr, 0, true); return 0; },
    proc_exit(c){ throw new Exit(c); },
    args_sizes_get(a, b){ const v = V(); v.setUint32(a, 0, true); v.setUint32(b, 0, true); return 0; }, args_get(){ return 0; },
    environ_sizes_get(a, b){ const v = V(); v.setUint32(a, 0, true); v.setUint32(b, 0, true); return 0; }, environ_get(){ return 0; },
    clock_time_get(id, prec, t){ V().setBigUint64(t, BigInt(Math.round(performance.now() * 1e6)), true); return 0; },
    random_get(p, l){ crypto.getRandomValues(new Uint8Array(mem.buffer, p, l)); return 0; },
    fd_prestat_get(){ return 8; }, fd_close(){ return 0; }, fd_seek(){ return 70; },
    fd_fdstat_get(fd, p){ const v = V(); v.setUint8(p, 2); v.setUint16(p + 2, 0, true); v.setBigUint64(p + 8, 0n, true); v.setBigUint64(p + 16, 0n, true); return 0; },
  };
  let code = 0, trap = '';
  const t0 = performance.now();
  try {
    const inst = new WebAssembly.Instance(new WebAssembly.Module(wasm), {wasi_snapshot_preview1:new Proxy(w, {get:(t, k) => t[k] || (() => 52)})});
    mem = inst.exports.memory;
    inst.exports._start();
  } catch (x) { if (x instanceof Exit) code = x.code; else trap = String(x && x.message || x); }
  return {code, out, err, trap, ms:Math.round(performance.now() - t0)};
}
// The program gets its own worker so an infinite loop can be stopped; without workers it runs on the page.
function wasiRun(wasm, limitMs){
  return new Promise(resolve => {
    let w;
    try { w = new Worker(URL.createObjectURL(new Blob([`${wasiExec}\nself.onmessage = e => self.postMessage(wasiExec(e.data));`], {type:'text/javascript'}))); }
    catch (e) { resolve(wasiExec(wasm)); return; }
    const t = setTimeout(() => { w.terminate(); resolve({tle:true}); }, limitMs);
    w.onmessage = e => { clearTimeout(t); w.terminate(); resolve(e.data); };
    w.onerror = e => { if (e.preventDefault) e.preventDefault(); clearTimeout(t); w.terminate(); resolve(wasiExec(wasm)); };
    w.postMessage(wasm);
  });
}

// Clang and Yosys load once, from the CDN, inside a module worker (or on the page if workers are unavailable).
async function toolHandle(d, post){
  const T = self.__tools || (self.__tools = {});
  const log = [], dec = new TextDecoder();
  const sink = b => { if (b) log.push(typeof b === 'string' ? b : dec.decode(b)); };
  try {
    if (!T[d.tool]) {
      post({id:d.id, type:'loading'});
      T[d.tool] = await import(d.url);
    }
    const run = d.tool === 'clang' ? T.clang.runClang : T.yosys.runYosys;
    let files;
    try {
      files = await run(d.args, d.files, {stdout:sink, stderr:sink, fetchProgress:({doneLength, totalLength}) => post({id:d.id, type:'progress', done:doneLength, total:totalLength})});
    } catch (e) {
      if (e && typeof e.code === 'number') { post({id:d.id, type:'done', ok:false, log:log.join('')}); return; }
      throw e;
    }
    const outFile = files && files[d.out];
    post({id:d.id, type:'done', ok:!!outFile, out:outFile, log:log.join('')});
  } catch (e) {
    post({id:d.id, type:'fail', error:String(e && e.message || e)});
  }
}
const TOOL_WORKER = `self.__tools = {};\n${toolHandle}\nself.onmessage = e => toolHandle(e.data, m => self.postMessage(m));`;
const tools = {worker:null, broken:false, seq:0, waiting:{}};
// Runs one tool command. onEvent sees {type:'loading'} and {type:'progress', done, total} while it downloads.
function toolRun(tool, args, files, out, onEvent){
  return new Promise(resolve => {
    const id = ++tools.seq, d = {id, tool, url:YOWASP[tool], args, files, out};
    const handle = m => {
      if (m.type === 'loading' || m.type === 'progress') { if (onEvent) onEvent(m); return; }
      delete tools.waiting[id];
      resolve(m);
    };
    if (!tools.worker && !tools.broken) {
      try {
        tools.worker = new Worker(URL.createObjectURL(new Blob([TOOL_WORKER], {type:'text/javascript'})), {type:'module'});
        tools.worker.onmessage = e => { const h = tools.waiting[e.data.id]; if (h) h(e.data); };
        tools.worker.onerror = e => {
          if (e.preventDefault) e.preventDefault();
          tools.worker.terminate(); tools.worker = null; tools.broken = true;
          const pending = tools.waiting; tools.waiting = {};
          Object.values(pending).forEach(h => h({type:'retry'}));
        };
      } catch (e) { tools.broken = true; }
    }
    if (tools.broken) { toolHandle(d, handle); return; }
    tools.waiting[id] = m => { if (m.type === 'retry') { toolHandle(d, handle); return; } handle(m); };
    tools.worker.postMessage(d);
  });
}
// Keeps the compiler's messages about your file and drops the driver's noise.
function cleanToolLog(log){
  return log.split('\n').filter(l => !/^(clang|wasm-ld|yowasp)[^:]*: (note|warning): |^\s*$/.test(l)).join('\n').trim().slice(0, 6000);
}
function yosysErrors(log){
  const lines = log.split('\n'), err = lines.filter(l => /ERROR|error|syntax/i.test(l));
  return (err.length ? err : lines.slice(-12)).join('\n').replace(/design\.v:/g, 'line ').trim().slice(0, 4000);
}

// ---------- Verilog: a two-state, cycle-based simulator for Yosys gate netlists ----------
const V_GATES = {
  $_BUF_:[['A'], a => a], $_NOT_:[['A'], a => a ^ 1],
  $_AND_:[['A', 'B'], (a, b) => a & b], $_NAND_:[['A', 'B'], (a, b) => (a & b) ^ 1],
  $_OR_:[['A', 'B'], (a, b) => a | b], $_NOR_:[['A', 'B'], (a, b) => (a | b) ^ 1],
  $_XOR_:[['A', 'B'], (a, b) => a ^ b], $_XNOR_:[['A', 'B'], (a, b) => a ^ b ^ 1],
  $_ANDNOT_:[['A', 'B'], (a, b) => a & (b ^ 1)], $_ORNOT_:[['A', 'B'], (a, b) => a | (b ^ 1)],
  $_MUX_:[['A', 'B', 'S'], (a, b, s) => s ? b : a], $_NMUX_:[['A', 'B', 'S'], (a, b, s) => (s ? b : a) ^ 1],
  $_AOI3_:[['A', 'B', 'C'], (a, b, c) => ((a & b) | c) ^ 1], $_OAI3_:[['A', 'B', 'C'], (a, b, c) => ((a | b) & c) ^ 1],
  $_AOI4_:[['A', 'B', 'C', 'D'], (a, b, c, d) => ((a & b) | (c & d)) ^ 1], $_OAI4_:[['A', 'B', 'C', 'D'], (a, b, c, d) => ((a | b) & (c | d)) ^ 1],
};
// Flip-flop and latch cell names encode their pins' polarities, e.g. $_DFF_PN0_ = rising clock, active-low reset to 0.
function vParseFF(t){
  const P = s => s === 'P' ? 1 : 0;
  let m;
  if ((m = /^\$_DFF_([NP])_$/.exec(t))) return {c:P(m[1])};
  if ((m = /^\$_DFF_([NP])([NP])([01])_$/.exec(t))) return {c:P(m[1]), ar:P(m[2]), av:+m[3]};
  if ((m = /^\$_DFFE_([NP])([NP])_$/.exec(t))) return {c:P(m[1]), e:P(m[2])};
  if ((m = /^\$_DFFE_([NP])([NP])([01])([NP])_$/.exec(t))) return {c:P(m[1]), ar:P(m[2]), av:+m[3], e:P(m[4])};
  if ((m = /^\$_SDFF_([NP])([NP])([01])_$/.exec(t))) return {c:P(m[1]), sr:P(m[2]), sv:+m[3]};
  if ((m = /^\$_SDFFE_([NP])([NP])([01])([NP])_$/.exec(t))) return {c:P(m[1]), sr:P(m[2]), sv:+m[3], e:P(m[4])};
  if ((m = /^\$_SDFFCE_([NP])([NP])([01])([NP])_$/.exec(t))) return {c:P(m[1]), sr:P(m[2]), sv:+m[3], e:P(m[4]), ce:1};
  if ((m = /^\$_DFFSR_([NP])([NP])([NP])_$/.exec(t))) return {c:P(m[1]), s:P(m[2]), r:P(m[3])};
  if ((m = /^\$_DFFSRE_([NP])([NP])([NP])([NP])_$/.exec(t))) return {c:P(m[1]), s:P(m[2]), r:P(m[3]), e:P(m[4])};
  if ((m = /^\$_DLATCH_([NP])_$/.exec(t))) return {latch:1, e:P(m[1])};
  if ((m = /^\$_DLATCH_([NP])([NP])([01])_$/.exec(t))) return {latch:1, e:P(m[1]), ar:P(m[2]), av:+m[3]};
  if ((m = /^\$_DLATCHSR_([NP])([NP])([NP])_$/.exec(t))) return {latch:1, e:P(m[1]), s:P(m[2]), r:P(m[3])};
  return null;
}
class VSim {
  constructor(json, top){
    const m = json.modules && json.modules[top];
    if (!m) throw new Error(`There is no module named ${top}.`);
    const net = b => b === '1' ? 1 : typeof b === 'number' ? b : 0;   // nets 0 and 1 hold the constants 0 and 1
    let max = 1;
    const see = bits => bits.forEach(b => { if (typeof b === 'number' && b > max) max = b; });
    Object.values(m.ports).forEach(p => see(p.bits));
    Object.values(m.cells).forEach(c => Object.values(c.connections).forEach(see));
    Object.values(m.netnames || {}).forEach(n => see(n.bits));
    this.v = new Uint8Array(max + 1); this.v[1] = 1;
    this.ports = {};
    for (const [name, p] of Object.entries(m.ports)) this.ports[name] = {dir:p.direction, bits:p.bits.map(net)};
    const comb = [], ffs = [], driver = new Map();
    for (const [cname, c] of Object.entries(m.cells)) {
      const C = k => (c.connections[k] || []).map(net)[0] || 0;
      if (V_GATES[c.type]) {
        const [pins, f] = V_GATES[c.type];
        const g = {f, a:pins.map(C), y:C('Y')};
        driver.set(g.y, comb.length); comb.push(g);
        continue;
      }
      const ff = vParseFF(c.type);
      if (!ff) throw new Error(`The netlist uses ${c.type.replace(/^\$_?|_$/g, '')} (cell ${cname.replace(/^\$/, '')}), which this simulator does not support. Try writing it more simply.`);
      Object.assign(ff, {cn:C('C'), d:C('D'), q:C('Q'), en:C('E'), rn:C('R'), sn:C('S')});
      ffs.push(ff);
    }
    // Initial values from `initial` blocks (Yosys keeps them as init attributes).
    for (const n of Object.values(m.netnames || {})) {
      const init = n.attributes && n.attributes.init;
      if (typeof init === 'string' && /^[01xz]+$/.test(init)) {
        const bits = init.split('').reverse();
        n.bits.forEach((b, i) => { if (typeof b === 'number' && bits[i] === '1') this.v[b] = 1; });
      }
    }
    // Order the gates so each one is evaluated after the gates that drive it.
    const order = [], state = new Uint8Array(comb.length);
    let loop = false;
    const visit = i => {
      if (state[i] === 2) return;
      if (state[i] === 1) { loop = true; return; }
      state[i] = 1;
      for (const a of comb[i].a) { const d = driver.get(a); if (d !== undefined) visit(d); }
      state[i] = 2; order.push(comb[i]);
    };
    for (let i = 0; i < comb.length; i++) visit(i);
    this.comb = order; this.loop = loop; this.ffs = ffs;
    this.seq = ffs.filter(f => !f.latch); this.lat = ffs.filter(f => f.latch || f.ar !== undefined || f.s !== undefined);
    this.settle();
    this.seq.forEach(f => { f.last = this.v[f.cn]; });
  }
  has(name){ return !!this.ports[name]; }
  width(name){ return this.ports[name] ? this.ports[name].bits.length : 0; }
  set(name, val){
    const p = this.ports[name];
    if (!p) throw new Error(`Your module has no port named ${name}.`);
    p.bits.forEach((b, i) => { if (b > 1) this.v[b] = Math.floor(val / 2 ** i) % 2; });
  }
  get(name){
    const p = this.ports[name];
    if (!p) throw new Error(`Your module has no port named ${name}.`);
    return p.bits.reduce((s, b, i) => s + this.v[b] * 2 ** i, 0);
  }
  // Latches and asynchronous set/reset act without a clock edge.
  async(){
    const v = this.v;
    let ch = false;
    for (const f of this.lat) {
      let q = v[f.q];
      if (f.latch && v[f.en] === f.e) q = v[f.d];
      if (f.ar !== undefined && v[f.rn] === f.ar) q = f.av;
      if (f.s !== undefined) { if (v[f.rn] === f.r) q = 0; else if (v[f.sn] === f.s) q = 1; }
      if (q !== v[f.q]) { v[f.q] = q; ch = true; }
    }
    return ch;
  }
  settle(){
    const v = this.v, g = this.comb;
    for (let it = 0; it < 200; it++) {
      for (let pass = 0; ; pass++) {
        let ch = false;
        for (let i = 0; i < g.length; i++) {
          const c = g[i], a = c.a, y = c.f(v[a[0]], v[a[1]], v[a[2]], v[a[3]]);
          if (v[c.y] !== y) { v[c.y] = y; ch = true; }
        }
        if (!ch || !this.loop) break;
        if (pass > 50) throw new Error('Your design never settles: it has a combinational loop.');
      }
      if (!this.async()) return;
    }
    throw new Error('Your design never settles: a latch or asynchronous reset keeps changing.');
  }
  // Settles the logic, then fires every flip-flop whose clock just had its active edge, until nothing moves.
  eval(){
    const v = this.v;
    this.settle();
    for (let k = 0; k < 64; k++) {
      const fire = [];
      for (const f of this.seq) {
        const c = v[f.cn];
        if (c !== f.last) { f.last = c; if (c === f.c) fire.push(f); }
      }
      if (!fire.length) return;
      const nq = fire.map(f => {
        const q = v[f.q], d = v[f.d], en = f.e === undefined || v[f.en] === f.e;
        if (f.sr !== undefined && !f.ce && v[f.rn] === f.sr) return f.sv;
        if (!en) return q;
        if (f.sr !== undefined && v[f.rn] === f.sr) return f.sv;
        return d;
      });
      fire.forEach((f, i) => { v[f.q] = nq[i]; });
      this.settle();
    }
    throw new Error('Your clocks keep toggling each other without settling.');
  }
}

// Small deterministic random numbers, so a failing case is the same on every run.
function vRng(seed){
  let s = 0;
  for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const vFmt = (v, w) => w <= 4 ? String(v) : '0x' + v.toString(16).toUpperCase();
const vSig = (sim, names) => names.map(n => `${n}=${vFmt(sim.get(n), sim.width(n))}`).join(' ');
function vNeed(sim, names){
  for (const n of names) if (!sim.has(n)) throw new Error(`Your module needs a port named ${n} (keep the port list from the starter code).`);
}

// A golden bench: the same stimulus goes to your design and the reference; every output must match every cycle.
// bench: {name, top, clk?, in:[...], out?:[...], rows?:['1 0', ...], rand?:{n, p:{name:prob of 1}, fix:{name:value}}}
// With clk, outputs are compared just before each rising edge (what the next stage would capture).
function vGolden(b, user, ref){
  const su = new VSim(user, b.top), sr = new VSim(ref, b.top);
  const outs = b.out || Object.keys(sr.ports).filter(n => sr.ports[n].dir === 'output');
  vNeed(su, b.in.concat(outs, b.clk ? [b.clk] : []));
  for (const n of b.in.concat(outs)) if (su.width(n) !== sr.width(n)) throw new Error(`Port ${n} should be ${sr.width(n)} bits wide, but yours is ${su.width(n)}.`);
  const rows = (b.rows || []).map(r => r.trim().split(/\s+/).map(Number));
  if (b.rand) {
    const rnd = vRng(b.top + b.name);
    for (let i = 0; i < b.rand.n; i++) rows.push(b.in.map(n => {
      if (b.rand.fix && n in b.rand.fix) return b.rand.fix[n];
      const w = sr.width(n);
      if (w === 1) return rnd() < ((b.rand.p && b.rand.p[n]) ?? 0.5) ? 1 : 0;
      return Math.floor(rnd() * 2 ** w);
    }));
  }
  for (let i = 0; i < rows.length; i++) {
    for (const s of [su, sr]) { b.in.forEach((n, k) => s.set(n, rows[i][k])); s.eval(); }
    const bad = outs.find(n => su.get(n) !== sr.get(n));
    if (bad !== undefined) {
      const when = b.clk ? `cycle ${i + 1}` : `case ${i + 1}`;
      return {ok:false, label:b.name, at:`${when}: ${vSig(sr, b.in)}`, exp:vSig(sr, outs), got:vSig(su, outs)};
    }
    if (b.clk) for (const s of [su, sr]) { s.set(b.clk, 1); s.eval(); s.set(b.clk, 0); s.eval(); }
  }
  return {ok:true, label:b.name, exp:'', got:''};
}

// Property checkers, for problems where different correct designs differ cycle by cycle.
const vCycle = (s, clk) => { s.set(clk, 1); s.eval(); s.set(clk, 0); s.eval(); };
const vOK = label => ({ok:true, label, exp:'', got:''});
const vBad = (label, exp, got, at) => ({ok:false, label, exp, got, at});
const V_CHECKS = {
  // rtl-06: reset value, hold when disabled, and a maximal-length (255-state) sequence.
  lfsr(net){
    const s = new VSim(net, 'lfsr8'), out = [];
    vNeed(s, ['clk', 'rst_n', 'en', 'q']);
    s.set('rst_n', 0); s.set('en', 0); s.eval(); vCycle(s, 'clk');
    out.push(s.get('q') === 1 ? vOK('Reset loads 8\'h01') : vBad('Reset loads 8\'h01', 'q=0x1', 'q=0x' + s.get('q').toString(16).toUpperCase()));
    s.set('rst_n', 1); s.eval();
    s.set('en', 1); vCycle(s, 'clk'); vCycle(s, 'clk'); s.set('en', 0); s.eval();
    const held = s.get('q'); let moved = false;
    for (let i = 0; i < 5; i++) { vCycle(s, 'clk'); if (s.get('q') !== held) moved = true; }
    out.push(moved ? vBad('Holds its value while en is 0', 'q stays 0x' + held.toString(16).toUpperCase(), 'q changed') : vOK('Holds its value while en is 0'));
    s.set('en', 1); s.eval();
    const seen = new Set([s.get('q')]); let first = s.get('q'), period = 0;
    for (let i = 1; i <= 300; i++) { vCycle(s, 'clk'); const q = s.get('q'); if (q === first) { period = i; break; } if (q === 0) { period = -1; break; } seen.add(q); }
    out.push(period === 255 && seen.size === 255 ? vOK('Visits all 255 nonzero states')
      : vBad('Visits all 255 nonzero states', 'period 255', period === -1 ? 'reached 0 and locked up' : period ? `repeats after ${period} steps` : 'never returns to its start'));
    return out;
  },
  // rtl-07: after reset, clk_out repeats every 3 input cycles and is high for exactly half of each period.
  div3(net){
    const s = new VSim(net, 'div3');
    vNeed(s, ['clk', 'rst_n', 'clk_out']);
    s.set('rst_n', 0); s.eval(); vCycle(s, 'clk'); vCycle(s, 'clk'); s.set('rst_n', 1); s.eval();
    const w = [];
    for (let i = 0; i < 72; i++) { s.set('clk', (i + 1) % 2); s.eval(); w.push(s.get('clk_out')); }
    const t = w.slice(24), str = t.join('');
    const periodic = t.every((x, i) => i < 6 || x === t[i - 6]);
    const highs = t.slice(0, 6).filter(x => x).length, edges = t.slice(0, 6).filter((x, i) => x !== t[(i + 5) % 6]).length;
    return [periodic && edges === 2 ? vOK('Period is 3 input cycles') : vBad('Period is 3 input cycles', 'a waveform that repeats every 6 half-cycles', 'half-cycles: ' + str.slice(0, 24)),
      periodic && highs === 3 && edges === 2 ? vOK('High for exactly 1.5 cycles (50% duty)') : vBad('High for exactly 1.5 cycles (50% duty)', '3 of every 6 half-cycles high', 'half-cycles: ' + str.slice(0, 24))];
  },
  // rtl-11: every pulse in clk_a gives exactly one one-cycle pulse in clk_b, with the clocks in either speed order.
  pulse(net){
    const res = [];
    for (const [label, ha, hb] of [['clk_b slower than clk_a', 5, 7], ['clk_b faster than clk_a', 9, 4]]) {
      const s = new VSim(net, 'pulse_sync');
      vNeed(s, ['clk_a', 'rst_a_n', 'pulse_a', 'clk_b', 'rst_b_n', 'pulse_b']);
      let sent = 0, got = 0, longp = false, gap = 0, prevB = 0;
      const pulses = [];
      for (let t = 0; t < 2600; t++) {
        const ca = Math.floor(t / ha) % 2, cb = Math.floor(t / hb) % 2;
        const rstA = t > 4 * ha ? 1 : 0, rstB = t > 4 * hb ? 1 : 0;
        const riseB = cb === 1 && Math.floor((t - 1) / hb) % 2 === 0, riseA = ca === 1 && Math.floor((t - 1) / ha) % 2 === 0;
        if (riseB && t > 0) {   // sample pulse_b just before clk_b's edge
          const pb = s.get('pulse_b');
          if (pb && prevB) longp = true;
          if (pb && !prevB) got++;
          prevB = pb;
        }
        s.set('clk_a', ca); s.set('clk_b', cb); s.set('rst_a_n', rstA); s.set('rst_b_n', rstB);
        s.eval();
        if (riseA && t > 0) {    // drive pulse_a for exactly one clk_a cycle, then wait at least 8 clk_b cycles
          if (s.get('pulse_a')) s.set('pulse_a', 0);
          else if (rstA && rstB && t > 12 * Math.max(ha, hb) && gap <= 0 && t < 2200) { s.set('pulse_a', 1); sent++; pulses.push(t); gap = 16 * Math.max(ha, hb); }
          s.eval();
        }
        gap--;
      }
      res.push(got === sent && !longp ? vOK(`${sent} pulses, ${label}`) : vBad(`${sent} pulses, ${label}`, `${sent} one-cycle pulses on pulse_b`, longp ? 'a pulse_b that lasted more than one clk_b cycle' : `${got} pulses on pulse_b`));
    }
    return res;
  },
  // rtl-15: order and integrity of every word, no overflow or underflow, all 2^AW words usable, and nothing stuck.
  afifo(net){
    const res = [];
    for (const [label, hw, hr, pw, pr] of [['writer faster than reader', 5, 7, 0.8, 0.6], ['reader faster than writer', 8, 3, 0.6, 0.5]]) {
      const s = new VSim(net, 'async_fifo');
      vNeed(s, ['wclk', 'wrst_n', 'wr_en', 'din', 'full', 'rclk', 'rrst_n', 'rd_en', 'dout', 'empty']);
      const depth = 16, rnd = vRng('afifo' + label), q = [];
      let err = null, wrote = 0, read = 0, maxCount = 0;
      const T = 6000;
      for (let t = 1; t < T && !err; t++) {
        const cw = Math.floor(t / hw) % 2, cr = Math.floor(t / hr) % 2;
        const riseW = cw === 1 && Math.floor((t - 1) / hw) % 2 === 0, riseR = cr === 1 && Math.floor((t - 1) / hr) % 2 === 0;
        const live = t > 6 * Math.max(hw, hr);
        let accW = false, accR = false;
        if (riseW && live && s.get('wr_en') && !s.get('full')) accW = true;
        if (riseR && live && s.get('rd_en') && !s.get('empty')) {
          accR = true;
          if (!q.length) err = vBad(label, 'empty stays 1 while the FIFO is empty', 'a read was allowed from an empty FIFO');
          else if (s.get('dout') !== q[0]) err = vBad(label, `dout=0x${q[0].toString(16).toUpperCase()} (word ${read + 1})`, `dout=0x${s.get('dout').toString(16).toUpperCase()}`, 'dout must show the oldest word whenever empty is 0');
        }
        if (accW) { q.push(s.get('din')); wrote++; }
        if (accR && !err) { q.shift(); read++; }
        maxCount = Math.max(maxCount, q.length);
        if (q.length > depth && !err) err = vBad(label, `at most ${depth} words stored`, 'a write was accepted while the FIFO was full (overflow)');
        s.set('wclk', cw); s.set('rclk', cr); s.set('wrst_n', live ? 1 : 0); s.set('rrst_n', live ? 1 : 0);
        s.eval();
        if (riseW) {
          // Phases: random traffic, then a burst with no reads (fills the FIFO), then the reader drains it.
          const phase = t < T * 0.45 ? 0 : t < T * 0.65 ? 1 : 2;
          const wr = phase === 0 ? rnd() < pw : phase === 1 ? 1 : 0;
          s.set('wr_en', wr ? 1 : 0); s.set('din', Math.floor(rnd() * 256)); s.eval();
        }
        if (riseR) { const phase = t < T * 0.45 ? 0 : t < T * 0.65 ? 1 : 2; s.set('rd_en', phase === 0 ? (rnd() < pr ? 1 : 0) : phase === 1 ? 0 : 1); s.eval(); }
      }
      if (!err && maxCount < depth) err = vBad(label, `full only after ${depth} words`, `full came on after ${maxCount} words`);
      if (!err && q.length) err = vBad(label, `all ${wrote} words read back`, `${q.length} words never came out (is empty stuck at 1?)`);
      res.push(err || vOK(`${wrote} words in order, ${label}`));
    }
    return res;
  },
  // rtl-16: no word lost, duplicated or reordered; s_ready never depends combinationally on m_ready; full throughput.
  skid(net){
    const s = new VSim(net, 'skid_buffer');
    vNeed(s, ['clk', 'rst_n', 's_valid', 's_ready', 's_data', 'm_valid', 'm_ready', 'm_data']);
    const rnd = vRng('skid'), q = [], res = [];
    let err = null, comb = false, next = 1, sv = 0, sd = 0, sentN = 0, outN = 0, tput = 0;
    s.set('rst_n', 0); s.eval(); vCycle(s, 'clk'); s.set('rst_n', 1); s.eval();
    for (let i = 0; i < 400 && !err; i++) {
      const phase = i < 250 ? 0 : i < 320 ? 1 : 2;
      if (!sv) { sv = phase === 2 ? 0 : phase === 1 ? 1 : (rnd() < 0.7 ? 1 : 0); if (sv) sd = (next++) & 255; }
      const mr = phase === 0 ? (rnd() < 0.6 ? 1 : 0) : 1;
      s.set('s_valid', sv); s.set('s_data', sd); s.set('m_ready', mr); s.eval();
      const sr = s.get('s_ready');
      s.set('m_ready', mr ^ 1); s.eval(); if (s.get('s_ready') !== sr) comb = true;
      s.set('m_ready', mr); s.eval();
      if (s.get('m_valid') && mr) {
        if (!q.length) err = vBad('No word lost, duplicated or reordered', 'm_valid only when a word is waiting', 'm_valid was 1 with no word inside');
        else if (s.get('m_data') !== q[0]) err = vBad('No word lost, duplicated or reordered', `m_data=0x${q[0].toString(16).toUpperCase()}`, `m_data=0x${s.get('m_data').toString(16).toUpperCase()}`, `transfer ${outN + 1}`);
        else { q.shift(); outN++; if (i >= 290 && i < 320) tput++; }
      }
      if (sv && sr) { q.push(sd); sentN++; sv = 0; }
      vCycle(s, 'clk');
    }
    if (!err && q.length) err = vBad('No word lost, duplicated or reordered', `all ${sentN} words delivered`, `${q.length} words never came out`);
    res.push(err || vOK(`No word lost, duplicated or reordered (${sentN} words)`));
    res.push(comb ? vBad('s_ready comes from a flip-flop', 's_ready unchanged when only m_ready changes', 's_ready follows m_ready combinationally') : vOK('s_ready comes from a flip-flop'));
    res.push(tput >= 30 ? vOK('Full throughput: one word per cycle') : vBad('Full throughput: one word per cycle', '30 words in 30 cycles', `${tput} words in 30 cycles`));
    return res;
  },
};
// Runs a Verilog problem's hidden tests. nets: {user, ref} netlists (ref only needed for golden benches).
function vJudge(p, user, ref){
  const R = p.run, out = [];
  for (const b of R.benches || []) {
    try { out.push(vGolden(b, user, ref)); }
    catch (e) { out.push({ok:false, label:b.name, exp:'', got:String(e.message || e)}); }
  }
  if (R.check) {
    try { out.push(...V_CHECKS[R.check](user)); }
    catch (e) { out.push({ok:false, label:'Simulation', exp:'', got:String(e.message || e)}); }
  }
  return out;
}
const vTops = p => [...new Set((p.run.benches || []).map(b => b.top).concat(p.run.top ? [p.run.top] : []))];
