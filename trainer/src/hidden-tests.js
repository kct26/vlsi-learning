// Hidden tests for the C, C++ and Verilog coding problems, judged in the browser by judge.js.
// C/C++: {kind:'c', head (before your code), pre (helpers after it), subst (rewrites in your code), tests}.
//   [expression, expected] compares values (a "string" compares text); [statements, text, 'out', label] compares printed output.
// Verilog: {kind:'v', benches (compared cycle by cycle with the reference solution), check (a property checker in judge.js)}.
const C_LISTS = `static struct node __pool[256]; static int __np;
static struct node *mk(int n, const int *a){ struct node *h = NULL; for (int i = n - 1; i >= 0; i--) { struct node *x = &__pool[__np++ & 255]; x->val = a[i]; x->next = h; h = x; } return h; }
static struct node *mkcyc(int n, const int *a, int k){ struct node *h = mk(n, a), *t = h, *j = NULL; for (int i = 0; t; i++) { if (i == k) j = t; if (!t->next) { t->next = j; break; } t = t->next; } return h; }
static char __sb[8][512]; static int __si;
static const char *show(struct node *h){ char *b = __sb[__si++ & 7]; int n = 0, k = 0; b[0] = 0; while (h && n < 60) { k += sprintf(b + k, n ? " %d" : "%d", h->val); h = h->next; n++; } if (h) strcat(b, " ... (the list loops)"); return b; }`;
const HIDDEN = {
'c-01':{kind:'c', tests:[['popcount(0u)', '0'], ['popcount(1u)', '1'], ['popcount(7u)', '3'], ['popcount(0x80000000u)', '1'], ['popcount(0xA5A5A5A5u)', '16'], ['popcount(0x12345678u)', '13'], ['popcount(0xFFFFFFFFu)', '32']]},
'c-02':{kind:'c', tests:[['is_pow2(0u)', '0'], ['is_pow2(1u)', '1'], ['is_pow2(2u)', '1'], ['is_pow2(3u)', '0'], ['is_pow2(64u)', '1'], ['is_pow2(96u)', '0'], ['is_pow2(0x80000000u)', '1'], ['is_pow2(0xFFFFFFFFu)', '0']]},
'c-03':{kind:'c', pre:C_LISTS, tests:[['show(reverse(mk(3, (int[]){1, 2, 3})))', '"3 2 1"', null, 'reverse([1, 2, 3])'], ['show(reverse(mk(1, (int[]){7})))', '"7"', null, 'reverse([7])'], ['show(reverse(NULL))', '""', null, 'reverse([])'],
  ['show(reverse(mk(2, (int[]){4, 9})))', '"9 4"', null, 'reverse([4, 9])'], ['show(reverse(mk(6, (int[]){1, 2, 3, 4, 5, 6})))', '"6 5 4 3 2 1"', null, 'reverse([1, 2, 3, 4, 5, 6])']]},
'c-04':{kind:'c', tests:[['same_page(0x1000u, 0x1FFFu)', '1'], ['same_page(0x1FFFu, 0x2000u)', '0'], ['same_page(0u, 0xFFFu)', '1'], ['same_page(0x12345678u, 0x12345000u)', '1'],
  ['same_page(0x12345678u, 0x12346678u)', '0'], ['same_page(0xFFFFF000u, 0xFFFFFFFFu)', '1'], ['same_page(0x00001000u, 0x80001000u)', '0']]},
'c-05':{kind:'c', pre:'static const char *mh(int lo, int hi){ static char b[8][32]; static int i; char *o = b[i++ & 7]; memset(o, 0, 32); mask_hex(lo, hi, o); return o; }',
  tests:[['mh(4, 7)', '"0x000000F0"', null, 'mask_hex(lo = 4, hi = 7)'], ['mh(0, 0)', '"0x00000001"', null, 'mask_hex(lo = 0, hi = 0)'], ['mh(31, 31)', '"0x80000000"', null, 'mask_hex(lo = 31, hi = 31)'], ['mh(8, 15)', '"0x0000FF00"', null, 'mask_hex(lo = 8, hi = 15)'], ['mh(3, 20)', '"0x001FFFF8"', null, 'mask_hex(lo = 3, hi = 20)'], ['mh(0, 31)', '"0xFFFFFFFF"', null, 'mask_hex(lo = 0, hi = 31)']]},
'c-06':{kind:'c', pre:C_LISTS, tests:[['has_cycle(NULL)', '0', null, 'has_cycle([])'], ['has_cycle(mkcyc(1, (int[]){1}, -1))', '0', null, 'has_cycle([1], no cycle)'], ['has_cycle(mkcyc(1, (int[]){1}, 0))', '1', null, 'has_cycle([1], tail links back to index 0)'], ['has_cycle(mkcyc(5, (int[]){1, 2, 3, 4, 5}, -1))', '0', null, 'has_cycle([1, 2, 3, 4, 5], no cycle)'],
  ['has_cycle(mkcyc(5, (int[]){1, 2, 3, 4, 5}, 2))', '1', null, 'has_cycle([1, 2, 3, 4, 5], tail links back to index 2)'], ['has_cycle(mkcyc(2, (int[]){1, 2}, 0))', '1', null, 'has_cycle([1, 2], tail links back to index 0)'], ['has_cycle(mkcyc(6, (int[]){1, 2, 3, 4, 5, 6}, 5))', '1', null, 'has_cycle([1, 2, 3, 4, 5, 6], tail links back to index 5)']]},
'c-07':{kind:'c', pre:C_LISTS, tests:[['show(merge(mk(3, (int[]){1, 3, 5}), mk(3, (int[]){2, 4, 6})))', '"1 2 3 4 5 6"', null, 'merge([1, 3, 5], [2, 4, 6])'], ['show(merge(NULL, mk(2, (int[]){1, 2})))', '"1 2"', null, 'merge([], [1, 2])'],
  ['show(merge(mk(2, (int[]){1, 2}), NULL))', '"1 2"', null, 'merge([1, 2], [])'], ['show(merge(NULL, NULL))', '""', null, 'merge([], [])'], ['show(merge(mk(3, (int[]){1, 1, 2}), mk(2, (int[]){1, 3})))', '"1 1 1 2 3"', null, 'merge([1, 1, 2], [1, 3])'],
  ['show(merge(mk(1, (int[]){9}), mk(3, (int[]){1, 2, 3})))', '"1 2 3 9"', null, 'merge([9], [1, 2, 3])']]},
'c-08':{kind:'c', tests:[['reverse_bits(0u)', '0'], ['reverse_bits(1u)', '0x80000000u'], ['reverse_bits(0x80000000u)', '1'], ['reverse_bits(0xFu)', '0xF0000000u'],
  ['reverse_bits(0x12345678u)', '0x1E6A2C48u'], ['reverse_bits(0xFFFFFFFFu)', '0xFFFFFFFFu']]},
'c-09':{kind:'c', tests:[['bswap32(0x12345678u)', '0x78563412u'], ['bswap32(0u)', '0'], ['bswap32(0xFF000000u)', '0xFFu'], ['bswap32(0xABu)', '0xAB000000u'], ['bswap32(0xDEADBEEFu)', '0xEFBEADDEu'],
  ['is_little_endian()', '1']]},
// The register at 0x40000000 is redirected to a variable, so the test can preset it and read it back.
'c-11':{kind:'c', head:'static volatile uint32_t __reg;', subst:[['0x40000000[uUlL]*', '((uintptr_t)&__reg)']],
  pre:'static long long rmw(uint32_t init, uint32_t mode){ __reg = init; enable_with_mode(mode); return __reg; }',
  tests:[['rmw(0u, 5u)', '0x51', null, 'register = 0; enable_with_mode(5); register == ?'], ['rmw(0xFFFFFFFFu, 0u)', '0xFFFFFF8Fu', null, 'register = 0xFFFFFFFF; enable_with_mode(0); register == ?'], ['rmw(0x12345670u, 3u)', '0x12345631u', null, 'register = 0x12345670; enable_with_mode(3); register == ?'], ['rmw(0x80000000u, 7u)', '0x80000071u', null, 'register = 0x80000000; enable_with_mode(7); register == ?'], ['rmw(0x0000000Eu, 2u)', '0x2Fu', null, 'register = 0x0000000E; enable_with_mode(2); register == ?']]},
'c-12':{kind:'c', pre:`static char __rb[512];
static const char *rbtest(int which){
  ringbuf r; uint8_t v = 0; int k = 0; rb_init(&r); __rb[0] = 0;
  if (which == 0) k += sprintf(__rb + k, "%d", (int)rb_pop(&r, &v));
  if (which == 1) for (int i = 0; i < 17; i++) k += sprintf(__rb + k, "%d", (int)rb_push(&r, (uint8_t)i));
  if (which == 2) { for (int i = 1; i <= 3; i++) rb_push(&r, (uint8_t)(i * 10)); for (int i = 0; i < 4; i++) { int ok = rb_pop(&r, &v); k += sprintf(__rb + k, ok ? "%d " : "x", v); } }
  if (which == 3) { int n = 0; for (int i = 0; i < 50; i++) { rb_push(&r, (uint8_t)i); rb_push(&r, (uint8_t)(i + 100)); if (rb_pop(&r, &v)) { if (n < 6) k += sprintf(__rb + k, "%d ", v); n++; } } k += sprintf(__rb + k, "n=%d", n); }
  if (which == 4) { r.head = r.tail = 0xFFFFFFF8u; for (int i = 0; i < 17; i++) k += sprintf(__rb + k, "%d", (int)rb_push(&r, (uint8_t)(i + 1))); for (int i = 0; i < 16; i++) { rb_pop(&r, &v); k += sprintf(__rb + k, " %d", v); } }
  return __rb;
}`, tests:[['rbtest(0)', '"0"', null, 'pop from an empty buffer'], ['rbtest(1)', '"11111111111111110"', null, 'push 0..16 (the 17th push must fail)'], ['rbtest(2)', '"10 20 30 x"', null, 'push 10, 20, 30; pop 4 times'], ['rbtest(3)', '"0 100 1 101 2 102 n=50"', null, '50 rounds of push, push, pop (first 6 pops shown)'],
  ['rbtest(4)', '"11111111111111110 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16"', null, 'counters start at 0xFFFFFFF8: push 17, pop 16 (wraps past 2^32)']]},
'cpp-01':{kind:'c', tests:[['kth_largest(std::vector<int>{3, 2, 1, 5, 6, 4}, 2)', '5'], ['kth_largest(std::vector<int>{3, 2, 3, 1, 2, 4, 5, 5, 6}, 4)', '4'], ['kth_largest(std::vector<int>{1}, 1)', '1'],
  ['kth_largest(std::vector<int>{-1, -5, -3}, 3)', '-5'], ['kth_largest(std::vector<int>{7, 7, 7}, 2)', '7'], ['kth_largest(std::vector<int>{9, 1, 8, 2, 7, 3}, 1)', '9']]},
'cpp-02':{kind:'c', pre:'static void P(int x){ std::printf("%d ", x); }', tests:[
  ['LRUCache c(2); c.put(1, 1); c.put(2, 2); P(c.get(1)); c.put(3, 3); P(c.get(2)); c.put(4, 4); P(c.get(1)); P(c.get(3)); P(c.get(4));', '1 -1 -1 3 4', 'out', 'capacity 2: put 1, put 2, get 1, put 3, get 2, put 4, get 1, get 3, get 4'],
  ['LRUCache c(1); c.put(2, 1); P(c.get(2)); c.put(3, 2); P(c.get(2)); P(c.get(3));', '1 -1 2', 'out', 'capacity 1: put 2, get 2, put 3, get 2, get 3'],
  ['LRUCache c(2); c.put(1, 1); c.put(2, 2); c.put(1, 10); c.put(3, 3); P(c.get(1)); P(c.get(2)); P(c.get(3));', '10 -1 3', 'out', 'capacity 2: updating key 1 makes it most recent'],
  ['LRUCache c(3); P(c.get(5)); c.put(1, 1); c.put(2, 2); c.put(3, 3); P(c.get(1)); c.put(4, 4); P(c.get(2)); P(c.get(3)); P(c.get(1));', '-1 1 -1 3 1', 'out', 'capacity 3: a get also refreshes the key']]},
'cpp-03':{kind:'c', tests:[
  ['Scheduler s; s.schedule(5, "b"); s.schedule(1, "a"); s.schedule(5, "c"); s.run();', '1: a\n5: b\n5: c', 'out', 'schedule b at 5, a at 1, c at 5, then run'],
  ['Scheduler s; s.schedule(2, "x"); s.run(); s.schedule(3, "y"); s.run();', '2: x\n5: y', 'out', 'delays count from the current time'],
  ['Scheduler s; for (int i = 0; i < 5; i++) s.schedule(10 - 2 * i, std::string(1, (char)(\'p\' + i))); s.schedule(0, "go"); s.run();', '0: go\n2: t\n4: s\n6: r\n8: q\n10: p', 'out', 'six events out of order'],
  ['Scheduler s; s.run(); s.schedule(0, "now"); s.schedule(0, "again"); s.run();', '0: now\n0: again', 'out', 'same time keeps the scheduling order']]},

// ---------- Verilog ----------
'rtl-01':{kind:'v', benches:[{name:'Both selects, 200 random words', top:'mux2', in:['a', 'b', 's'], rows:['0 255 0', '0 255 1', '170 85 0', '170 85 1'], rand:{n:200}}]},
'rtl-02':{kind:'v', benches:[{name:'Reset, enable, hold and wrap past 15', top:'counter4', clk:'clk', in:['rst', 'en'], rows:['1 0', '0 1', '0 1', '0 0', '0 0', '0 1', ...Array(18).fill('0 1'), '1 1', '0 1', '0 1']},
  {name:'300 random cycles', top:'counter4', clk:'clk', in:['rst', 'en'], rows:['1 0'], rand:{n:300, p:{rst:0.05, en:0.7}}}]},
'rtl-03':{kind:'v', benches:[{name:'Single rises, long highs and back-to-back changes', top:'rise_detect', clk:'clk', in:['rst_n', 'd'], rows:['0 0', '1 0', '1 1', '1 1', '1 1', '1 0', '1 1', '1 0', '1 1', '1 0', '1 0', '1 1']},
  {name:'300 random cycles', top:'rise_detect', clk:'clk', in:['rst_n', 'd'], rows:['0 0'], rand:{n:300, fix:{rst_n:1}}}]},
'rtl-04':{kind:'v', benches:[{name:'All 256 inputs', top:'parity8', in:['d'], rows:Array.from({length:256}, (_, i) => String(i))}]},
'rtl-05':{kind:'v', benches:[{name:'All 16 input combinations', top:'dec3to8', in:['a', 'en'], rows:Array.from({length:16}, (_, i) => `${i & 7} ${i >> 3}`)}]},
'rtl-06':{kind:'v', top:'lfsr8', check:'lfsr'},
'rtl-07':{kind:'v', top:'div3', check:'div3'},
'rtl-08':{kind:'v', benches:[{name:'1011011 (two overlapping matches)', top:'det1011', clk:'clk', in:['rst_n', 'x'], rows:['0 0', '1 1', '1 0', '1 1', '1 1', '1 0', '1 1', '1 1', '1 0', '1 0']},
  {name:'Near misses: 10101011, 1001011, 111011', top:'det1011', clk:'clk', in:['rst_n', 'x'], rows:['0 0', ...'10101011'.split('').map(c => '1 ' + c), '0 0', ...'1001011'.split('').map(c => '1 ' + c), '0 0', ...'111011'.split('').map(c => '1 ' + c)]},
  {name:'400 random bits', top:'det1011', clk:'clk', in:['rst_n', 'x'], rows:['0 0'], rand:{n:400, fix:{rst_n:1}}}]},
'rtl-09':{kind:'v', benches:[{name:'Fill to full, then drain to empty', top:'sync_fifo', clk:'clk', in:['rst_n', 'wr_en', 'rd_en', 'din'],
    rows:['0 0 0 0', ...Array.from({length:10}, (_, i) => `1 1 0 ${17 * (i + 1)}`), ...Array(10).fill('1 0 1 0')]},
  {name:'Reads and writes in the same cycle', top:'sync_fifo', clk:'clk', in:['rst_n', 'wr_en', 'rd_en', 'din'], rows:['0 0 0 0', '1 1 1 5', '1 1 0 6', '1 1 1 7', '1 1 1 8', '1 0 1 0', '1 0 1 0', '1 1 1 9', '1 0 0 0']},
  {name:'500 random cycles', top:'sync_fifo', clk:'clk', in:['rst_n', 'wr_en', 'rd_en', 'din'], rows:['0 0 0 0'], rand:{n:500, fix:{rst_n:1}, p:{wr_en:0.6, rd_en:0.5}}}]},
'rtl-10':{kind:'v', benches:[{name:'Everyone requesting: grants rotate 0, 1, 2, 3', top:'rr_arb4', clk:'clk', in:['rst_n', 'req'], rows:['0 0', ...Array(8).fill('1 15')]},
  {name:'Mixed requests', top:'rr_arb4', clk:'clk', in:['rst_n', 'req'], rows:['0 0', '1 5', '1 5', '1 5', '1 8', '1 0', '1 9', '1 9', '1 6', '1 6', '1 1']},
  {name:'300 random cycles', top:'rr_arb4', clk:'clk', in:['rst_n', 'req'], rows:['0 0'], rand:{n:300, fix:{rst_n:1}}}]},
'rtl-11':{kind:'v', top:'pulse_sync', check:'pulse'},
'rtl-12':{kind:'v', benches:[{name:'bin2gray, all 16 values', top:'bin2gray', in:['b'], rows:Array.from({length:16}, (_, i) => String(i))},
  {name:'gray2bin, all 16 values', top:'gray2bin', in:['g'], rows:Array.from({length:16}, (_, i) => String(i))}]},
'rtl-13':{kind:'v', benches:[{name:'Flag corner cases', top:'alu8', in:['a', 'b', 'op'],
    rows:['127 1 0', '255 1 0', '128 128 0', '0 0 0', '0 1 1', '128 1 1', '127 255 1', '5 5 1', '240 15 2', '240 15 3', '255 255 4', '129 0 5', '129 0 6', '255 1 7', '1 255 7', '128 127 7', '5 5 7']},
  {name:'400 random operations', top:'alu8', in:['a', 'b', 'op'], rand:{n:400}}]},
'rtl-14':{kind:'v', benches:[{name:'Zero and every power of two', top:'lzc16', in:['x'], rows:['0', ...Array.from({length:16}, (_, i) => String(2 ** i)), '65535', '1023']},
  {name:'300 random inputs', top:'lzc16', in:['x'], rand:{n:300}}]},
'rtl-15':{kind:'v', top:'async_fifo', check:'afifo'},
'rtl-16':{kind:'v', top:'skid_buffer', check:'skid'},
};
CODING.forEach(p => { if (HIDDEN[p.id]) p.run = HIDDEN[p.id]; });
