// Checks the hidden tests themselves, outside the browser:
//  - every C/C++ reference solution passes its tests (compiled with your local clang);
//  - every Verilog reference solution passes (netlist from Yosys, simulated by judge.js);
//  - judge.js's simulator agrees with Icarus Verilog on the reference designs, cycle by cycle;
//  - deliberately broken designs and programs fail.
// Needs clang, iverilog and the Yosys WebAssembly package: npm install @yowasp/yosys@0.68.1207 (set YOWASP_DIR to where it is).
// usage: node tests/judge-check.js
const fs = require('fs'), path = require('path'), vm = require('vm'), os = require('os');
const {execFileSync} = require('child_process');
const src = path.join(__dirname, '..', 'src');
const ctx = {console};
vm.createContext(ctx);
vm.runInContext(['coding.js', 'hidden-tests.js', 'judge.js'].map(f => fs.readFileSync(path.join(src, f), 'utf8')).join('\n') +
  '\n;this.CODING = CODING; this.HIDDEN = HIDDEN; this.cHarness = cHarness; this.cResults = cResults; this.VSim = VSim; this.vJudge = vJudge; this.vTops = vTops; this.YOSYS_SCRIPT = YOSYS_SCRIPT;', ctx);
const {CODING, HIDDEN} = ctx;
CODING.forEach(p => { if (HIDDEN[p.id]) p.run = HIDDEN[p.id]; });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'judge-'));
let fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log('FAIL ' + msg); } };

function runC(p, code){
  const cpp = p.lang === 'cpp', f = path.join(tmp, 'h' + (cpp ? '.cpp' : '.c')), exe = path.join(tmp, 'a.out');
  fs.writeFileSync(f, ctx.cHarness(p, code, cpp));
  try { execFileSync(cpp ? 'clang++' : 'clang', [cpp ? '-std=c++17' : '-std=gnu17', '-O1', '-w', f, '-o', exe], {stdio:['ignore', 'pipe', 'pipe']}); }
  catch (e) { return {compile:String(e.stderr)}; }
  let out = '';
  try { out = execFileSync(exe, {timeout:5000}).toString(); } catch (e) { out = String(e.stdout || ''); }
  return ctx.cResults(p, out);
}
// Broken versions that must not be accepted.
const C_BROKEN = {
  'c-01':'int popcount(unsigned int x){ int c = 0; while (x > 1) { x &= x - 1; c++; } return c; }',
  'c-02':'int is_pow2(unsigned int x){ return (x & (x - 1)) == 0; }',
  'c-03':'#include <stddef.h>\nstruct node { int val; struct node *next; };\nstruct node *reverse(struct node *h){ return h; }',
  'c-04':'#include <stdint.h>\nint same_page(uint32_t a, uint32_t b){ return (a >> 10) == (b >> 10); }',
  'c-05':'#include <stdio.h>\nvoid mask_hex(int lo, int hi, char *out){ sprintf(out, "0x%08x", (unsigned)(((1u << (hi - lo + 1)) - 1) << lo)); }',
  'c-07':'#include <stddef.h>\nstruct node { int val; struct node *next; };\nstruct node *merge(struct node *a, struct node *b){ if (!a) return b; struct node *t = a; while (t->next) t = t->next; t->next = b; return a; }',
  'c-08':'#include <stdint.h>\nuint32_t reverse_bits(uint32_t x){ return ~x; }',
  'c-09':'#include <stdint.h>\nuint32_t bswap32(uint32_t x){ return (x >> 16) | (x << 16); }\nint is_little_endian(void){ return 0; }',
  'c-11':'#include <stdint.h>\nvoid enable_with_mode(uint32_t mode){ *(volatile uint32_t *)0x40000000u = (mode << 4) | 1u; }',
  'c-12':'#include <stdbool.h>\n#include <stdint.h>\n#define RB_SIZE 16\ntypedef struct { uint8_t data[RB_SIZE]; uint32_t head, tail; } ringbuf;\nvoid rb_init(ringbuf *rb){ rb->head = rb->tail = 0; }\nbool rb_push(ringbuf *rb, uint8_t v){ if ((rb->head + 1) % RB_SIZE == rb->tail % RB_SIZE) return false; rb->data[rb->head++ % RB_SIZE] = v; return true; }\nbool rb_pop(ringbuf *rb, uint8_t *v){ if (rb->head == rb->tail) return false; *v = rb->data[rb->tail++ % RB_SIZE]; return true; }',
  'cpp-01':'#include <vector>\n#include <algorithm>\nint kth_largest(const std::vector<int>& v, int k){ std::vector<int> s(v); std::sort(s.begin(), s.end()); return s[k - 1]; }',
  'cpp-03':'#include <iostream>\n#include <map>\n#include <string>\nclass Scheduler { std::map<long, std::string> q; public: long now = 0; void schedule(long d, const std::string& w){ q[now + d] = w; } void run(){ for (auto& e : q) { now = e.first; std::cout << now << ": " << e.second << "\\n"; } q.clear(); } };',
};
for (const p of CODING.filter(p => p.run && p.run.kind === 'c')) {
  const r = runC(p, p.sol);
  if (r.compile) { ok(false, `${p.id} reference does not compile:\n${r.compile}`); continue; }
  r.results.forEach((t, i) => ok(t.ok, `${p.id} reference fails test ${i + 1}: ${t.label} expected ${t.exp} got ${t.got}`));
  if (C_BROKEN[p.id]) { const b = runC(p, C_BROKEN[p.id]); ok(b.compile || b.results.some(t => !t.ok), `${p.id} broken version was accepted`); }
}
console.log(`C/C++: ${CODING.filter(p => p.run && p.run.kind === 'c').length} problems checked`);

(async () => {
  const dir = process.env.YOWASP_DIR || path.join(__dirname, '..', 'node_modules');
  const {runYosys} = await import(path.join(dir, '@yowasp', 'yosys', 'gen', 'bundle.js'));
  const synth = async (code, top) => {
    let log = '';
    try {
      const o = await runYosys(['-q', '-p', ctx.YOSYS_SCRIPT(top)], {'design.v':code}, {stdout:b => { if (b) log += Buffer.from(b); }, stderr:b => { if (b) log += Buffer.from(b); }});
      const j = o['net.json']; return JSON.parse(typeof j === 'string' ? j : Buffer.from(j).toString());
    } catch (e) { throw new Error('yosys: ' + log.split('\n').filter(l => /ERROR/.test(l)).join(' ')); }
  };
  // Each top is synthesized on its own; the netlists are merged so vJudge can find every module.
  const netOf = async (code, p) => ({modules:Object.assign({}, ...(await Promise.all(ctx.vTops(p).map(t => synth(code, t)))).map(n => n.modules))});
  const judge = async (p, code) => ctx.vJudge(p, await netOf(code, p), p.run.benches ? await netOf(p.sol, p) : null);
  const V_BROKEN = {
    'rtl-02':s => s.replace("q + 4'd1", "q + 4'd2"),
    'rtl-03':s => s.replace('d & ~d_q', 'd'),
    'rtl-04':s => s.replace('^d', '~^d'),
    'rtl-06':s => s.replace("q[7] ^ q[5] ^ q[4] ^ q[3]", "q[7] ^ q[3]"),
    'rtl-07':s => s.replace('assign clk_out = a | b;', 'assign clk_out = a;'),
    'rtl-08':s => s.replace('S3: ns = x ? S1 : S2;', 'S3: ns = x ? S0 : S0;'),
    'rtl-09':s => s.replace('wire do_wr = wr_en && !full;', 'wire do_wr = wr_en;'),
    'rtl-10':s => s.replace("4'b0001: ptr <= 2'd1;", "4'b0001: ptr <= 2'd0;"),
    'rtl-11':s => s.replace('assign pulse_b = sync_b[2] ^ sync_b[1];', 'assign pulse_b = sync_b[1];'),
    'rtl-13':s => s.replace("v = (a[7] == b[7]) && (y[7] != a[7]);", "v = 1'b0;"),
    'rtl-14':s => s.replace('count = 15 - i;', 'count = 16 - i;'),
    'rtl-15':s => s.replace("assign full  = (wgray == {~rgray_w2[AW:AW-1], rgray_w2[AW-2:0]});", "assign full = 1'b0;"),
    'rtl-16':s => s.replace('assign s_ready = !full;', 'assign s_ready = !full && m_ready;'),
  };
  for (const p of CODING.filter(p => p.run && p.run.kind === 'v')) {
    try {
      const res = await judge(p, p.sol);
      res.forEach(t => ok(t.ok, `${p.id} reference fails "${t.label}": expected ${t.exp}, got ${t.got} ${t.at || ''}`));
      if (V_BROKEN[p.id]) {
        const bad = V_BROKEN[p.id](p.sol);
        ok(bad !== p.sol, `${p.id} mutation did not apply`);
        const br = await judge(p, bad);
        ok(br.some(t => !t.ok), `${p.id} broken design was accepted`);
      }
      // Cross-check the simulator against Icarus Verilog on each golden bench.
      for (const b of p.run.benches || []) await crossCheck(p, b, await synth(p.sol, b.top));
    } catch (e) { ok(false, `${p.id}: ${e.message}`); }
  }
  console.log(`Verilog: ${CODING.filter(p => p.run && p.run.kind === 'v').length} problems checked`);
  console.log(`${checks} checks, ${fails} failed`);
  fs.rmSync(tmp, {recursive:true, force:true});
  process.exit(fails ? 1 : 0);
})();

// Runs one bench's directed rows in iverilog and in VSim and compares every output (iverilog x/z bits are skipped).
async function crossCheck(p, b, net){
  const s = new ctx.VSim(net, b.top);
  const outs = b.out || Object.keys(s.ports).filter(n => s.ports[n].dir === 'output');
  const rows = (b.rows || []).map(r => r.trim().split(/\s+/).map(Number));
  if (!rows.length) return;
  const w = n => s.width(n), decl = n => `reg [${w(n) - 1}:0] ${n};`;
  const tb = [`module tb;`, ...(b.clk ? [`reg ${b.clk} = 0;`] : []), ...b.in.map(decl), ...outs.map(n => `wire [${w(n) - 1}:0] ${n};`),
    `${b.top} dut(${[...(b.clk ? [b.clk] : []), ...b.in, ...outs].map(n => `.${n}(${n})`).join(', ')});`, 'initial begin'];
  for (const r of rows) {
    tb.push(b.in.map((n, k) => `${n} = ${r[k]};`).join(' ') + ' #1;');
    tb.push(`$display("${outs.map(() => '%b').join(' ')}", ${outs.join(', ')});`);
    if (b.clk) tb.push(`${b.clk} = 1; #1; ${b.clk} = 0; #1;`);
  }
  tb.push('$finish; end', 'endmodule');
  const f = path.join(tmp, 'x.v'); fs.writeFileSync(f, p.sol + '\n' + tb.join('\n'));
  execFileSync('iverilog', ['-g2012', '-o', path.join(tmp, 'x.vvp'), f]);
  const lines = execFileSync('vvp', ['-n', path.join(tmp, 'x.vvp')]).toString().trim().split('\n').filter(l => /^[01xz ]+$/.test(l));
  ok(lines.length === rows.length, `${p.id} ${b.name}: iverilog printed ${lines.length} rows, expected ${rows.length}`);
  for (let i = 0; i < rows.length; i++) {
    b.in.forEach((n, k) => s.set(n, rows[i][k])); s.eval();
    const iv = (lines[i] || '').split(' ');
    outs.forEach((n, k) => {
      const bits = iv[k] || '', mine = s.get(n).toString(2).padStart(w(n), '0');
      const same = bits.length === mine.length && [...bits].every((c, j) => c === 'x' || c === 'z' || c === mine[j]);
      ok(same, `${p.id} ${b.name} row ${i + 1}: ${n} iverilog ${bits}, simulator ${mine}`);
    });
    if (b.clk) { s.set(b.clk, 1); s.eval(); s.set(b.clk, 0); s.eval(); }
  }
}
