// Drives the trainer UI in a headless browser and writes PASS/FAIL lines into <pre id="testlog">.
(function(){
const PHASE = window.__PHASE;
const log = [], errors = [];
window.addEventListener('error', e => errors.push('ERR ' + e.message + ' line ' + e.lineno));
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
const st = () => JSON.parse(localStorage.getItem('ground-up-trainer-v1') || 'null');
const click = sel => { const el = typeof sel === 'string' ? $(sel) : sel; if (!el) { log.push('FAIL missing ' + sel); return false; } el.click(); return true; };
const tab = t => t === 'profile' ? click('#acct .avatar') : click(`.navlinks button[data-tab="${t}"]`);
const h1 = () => ($('#main h1') || {}).textContent || '';
function rawIn(container){
  const lab = $$('.qmeta .mono', container).map(s => s.textContent).find(t => /^#\d+$/.test(t));
  return lab ? RAW[+lab.slice(1) - 1] : null;
}
function code(r, right){ return Array.isArray(r[3]) ? (right ? '0' : '1') : ((right ? r[3] : !r[3]) ? 'T' : 'F'); }
function answer(scope, right){
  const opts = $(`.opts[data-scope="${scope}"]`); if (!opts) { log.push('FAIL no options in ' + scope); return; }
  const r = rawIn(opts.closest('.qcard')); if (!r) { log.push('FAIL no problem number in ' + scope); return; }
  click(`.opts[data-scope="${scope}"] [data-pick="${code(r, right)}"]`);
}
function pvRaw(){ const m = /^(\d+)\./.exec(h1()); return m ? RAW[+m[1] - 1] : null; }
function walkCards(poking){
  let guard = 0, cards = 0, widgets = 0;
  while ($('#card-next') && guard++ < 20) {
    const host = $('#widget-host');
    if (host) { widgets++; ok(host.innerHTML.length > 40, 'widget renders: ' + h1() + ' lesson ' + (cards + 1)); if (poking) poke(host); }
    if ($('#card-check .opts')) {
      if (PHASE === 1) ok($('#card-next').disabled, 'next is locked until the quick check is answered');
      answer('card', true);
      ok($('#card-check .verdict.ok'), 'quick check shows Accepted');
      ok(!$('#card-next').disabled, 'next unlocks after answering');
    }
    cards++;
    click('#card-next');
  }
  return {cards, widgets};
}
function poke(host){
  const before = errors.length;
  $$('input[type="range"]', host).forEach(inp => { [inp.min, inp.max, (parseFloat(inp.min) + parseFloat(inp.max)) / 2].forEach(v => { inp.value = v; inp.dispatchEvent(new Event('input', {bubbles:true})); }); });
  $$('select', host).forEach(sel => { Array.from(sel.options).forEach(o => { sel.value = o.value; sel.dispatchEvent(new Event('change', {bubbles:true})); }); });
  $$('input[type="checkbox"]', host).forEach(c => { c.checked = !c.checked; c.dispatchEvent(new Event('change', {bubbles:true})); });
  $$('input[type="text"]', host).forEach(t => { ['1010', '-3.75', 'abc', '0'].forEach(v => { t.value = v; t.dispatchEvent(new Event('input', {bubbles:true})); }); });
  for (let k = 0; k < 3; k++) { const b = $('.dbtn', host); if (b) b.click(); }
  ok(!/NaN|undefined|Infinity/.test(host.textContent), 'widget output clean after poking');
  ok(errors.length === before, 'no script errors while poking widget');
}
function setMux(t, s, i0, i1){
  const set = (id, v) => { const el = $('#w-mux-' + id); el.value = v; el.dispatchEvent(new Event('change', {bubbles:true})); };
  set('t', t); set('s', s); set('i0', i0); set('i1', i1);
  return !!$('#widget-host .wwin');
}
const solvedHeader = () => +(($('#solved b') || {}).textContent || 0);

function phase1(){
  const visible = () => $('.topbar').innerText + ' ' + $('#main').innerText;
  // Home page
  ok($('.hhero h1') && /from the ground up/.test($('.hhero h1').textContent), 'home page opens first');
  ok($$('.hptabs button').length === 5 && $$('.htopic').length === 6 && $$('.faqlist button').length >= 5, 'home: platform tabs, topic cards and FAQ');
  click('[data-act="home-tab"][data-v="2"]');
  ok(/reverse\.c/.test($('.hpcard .hbar').textContent), 'home platform tab switches its preview');
  click('[data-act="try-tab"][data-v="2"]');
  const rng = $('#trywid input[data-try="l"]'); rng.value = '1.8'; rng.dispatchEvent(new Event('input', {bubbles:true}));
  ok(/violated/.test($('#trywid .tryout').textContent) && $('#trywid input[data-try="l"]') === rng, 'try-it widget updates without replacing the slider');
  click('[data-act="faq"][data-v="4"]');
  ok(/WebAssembly/.test($('.faqans').textContent), 'FAQ answer switches');
  ok(!/NaN|undefined/.test($('#main').textContent), 'home has no NaN or undefined');
  tab('quest');
  ok($$('.rmnode').length === 36 && $$('.rmlines path').length >= 40, 'roadmap map: 36 topics with prerequisite lines');
  click('[data-act="rm-sel"][data-v="u19"]');
  ok(/RTL, CDC/.test($('#rmdetail h3').textContent) && $('#rmdetail [data-act="open-unit"][data-u="19"]'), 'selecting a topic shows its lessons and a quest button');
  click('[data-act="rm-sel"][data-v="r-dv"]');
  ok(/Role: verification/.test($('#rmdetail h3').textContent) && $('#rmdetail [data-v="roles"]'), 'role nodes link to Roles');
  const z0 = $('.rminner').style.transform; click('[data-act="rm-zoom"][data-v="in"]');
  ok($('.rminner').style.transform !== z0, 'roadmap zooms');
  ok($('.rmtop #rmdetail') && $('.rmtop').compareDocumentPosition($('.rmboard')) & Node.DOCUMENT_POSITION_FOLLOWING, 'details sit above the map');
  const sc = $('#rmscroll'), rr = sc.getBoundingClientRect(), z1 = $('.rminner').style.transform;
  sc.dispatchEvent(new WheelEvent('wheel', {deltaY:-200, clientX:rr.left + 200, clientY:rr.top + 150, bubbles:true, cancelable:true}));
  ok($('.rminner').style.transform !== z1 && /\d+%/.test($('#rmzoom').textContent), 'wheel zooms the map (' + $('#rmzoom').textContent + ')');
  const p0 = {bubbles:true, pointerId:7, clientX:rr.left + 300, clientY:rr.top + 300}, z2 = $('.rminner').style.transform;
  sc.dispatchEvent(new PointerEvent('pointerdown', p0));
  document.dispatchEvent(new PointerEvent('pointermove', Object.assign({}, p0, {clientX:rr.left + 240, clientY:rr.top + 250})));
  document.dispatchEvent(new PointerEvent('pointerup', p0));
  ok($('.rminner').style.transform !== z2 && /scale/.test($('.rminner').style.transform), 'dragging pans the map');
  click('[data-act="rm-zoom"][data-v="fit"]');
  click('#theme');
  ok(document.documentElement.dataset.theme === 'dark' && localStorage.getItem('ground-up-theme') === 'dark', 'theme toggle switches to dark and remembers it');
  click('#theme');
  ok(document.documentElement.dataset.theme === 'light', 'and back to light (the default)');
  ok(!/\bXP\b|\bLV\b|Level \d|[Bb]adge|Achievement|streak/.test(visible()), 'no XP, levels, badges, streaks or achievements on the quest map');
  ok($$('.path > .node').length === UNITS.length, UNITS.length + ' quest nodes on the map');
  ok($$('.path > .node.locked').length === UNITS.length - 1, 'only quest 1 is open at the start');
  ok(new RegExp('0/' + RAW.length).test($('#solved').textContent), 'header shows solved/total: ' + $('#solved').textContent.trim());
  click('[data-act="open-unit"][data-u="1"]');
  ok(/Charge, current and voltage/.test(h1()), 'quest 1 page opens');
  ok($$('.steps .step').length >= 4, 'step pills for lessons + checkpoint');
  const w = walkCards(false);
  ok(w.cards >= 3, 'quest 1 has ' + w.cards + ' lessons');
  ok($('[data-act="unit-quiz"]'), 'checkpoint panel after the lessons');
  ok($$('.ptable.compact tbody tr').length > 10, 'quest page lists its chapter problems');
  click('[data-act="unit-quiz"]');
  for (let i = 0; i < 5; i++) { answer('quiz', true); ok($('.verdict.ok'), 'checkpoint q' + (i + 1) + ' Accepted'); click('[data-act="next"]'); }
  ok($('.big') && $('.big').textContent.replace(/\s/g, '') === '5/5', 'checkpoint result 5/5');
  ok(st().learn.units['1'].passed, 'quest 1 saved as passed');
  click('[data-act="done-results"]');
  ok(/Charge, current/.test(h1()), 'done returns to the quest page');
  click('[data-act="to-quest"]');
  ok($$('.path > .node.locked').length === UNITS.length - 2, 'quest 2 unlocked');
  const sh = solvedHeader();
  ok(sh >= 5, 'header solved count went up to ' + sh);

  // Problem list
  tab('theory');
  ok($$('#prows tr').length === RAW.length, 'problem list shows all ' + RAW.length);
  ok($('.progcard .ringlabel b').textContent === String(sh), 'progress ring matches header');
  const q = $('#f-q'); q.value = 'antenna'; q.dispatchEvent(new Event('input', {bubbles:true}));
  const n = $$('#prows tr').length;
  ok(n > 5 && n < 60, 'search "antenna" narrows to ' + n);
  ok($('#f-q') === q, 'search box keeps focus (not re-rendered)');
  q.value = ''; q.dispatchEvent(new Event('input', {bubbles:true}));
  const d = $('#f-d'); d.value = 'H'; d.dispatchEvent(new Event('input', {bubbles:true}));
  ok($$('#prows .c-df').every(c => c.textContent === 'Hard'), 'difficulty filter: ' + $$('#prows tr').length + ' hard');
  d.value = 'all'; d.dispatchEvent(new Event('input', {bubbles:true}));
  const s = $('#f-status'); s.value = 'solved'; s.dispatchEvent(new Event('input', {bubbles:true}));
  ok($$('#prows .st.solved').length === $$('#prows tr').length, 'status filter: solved only');
  ok($$('#prows tr').length === sh, 'status filter count matches solved (' + sh + ')');
  click('[data-act="f-reset"]');
  click('[data-act="f-ch"][data-v="17"]');
  ok($$('#prows tr').length === RAW.filter(r => r[0].startsWith('17-')).length, 'topic chip filters to chapter 17');
  ok($$('.studycard .slist').length === 13 && !/Your OA|By skill/i.test($('.studycard').textContent), 'sidebar lists the 13 VLSI areas (no OA or skill lists)');
  click('[data-act="f-list"][data-v="va-sta"]');
  ok($$('#prows tr').length === RAW.filter(r => /^(11|13)-/.test(r[0])).length, 'VLSI area "Static timing analysis" shows chapters 11 and 13');
  ok($('#f-list').value === 'va-sta', 'area dropdown follows the sidebar');
  click('[data-act="f-reset"]');

  // Problem page: wrong, retry, accepted
  click($$('#prows a[data-open]')[40]);
  ok($('.pv') && /^41\./.test(h1()), 'problem page opens: ' + h1());
  let r = pvRaw();
  click(`[data-pv="${code(r, false)}"]`);
  click('[data-act="pv-submit"]');
  ok($('.verdict.bad'), 'wrong pick shows Wrong Answer');
  ok(!$('.sol'), 'solution hidden after a wrong answer');
  ok(st().q[r[0]] && st().q[r[0]].c === 0, 'problem recorded as attempted');
  click(`[data-pv="${code(r, true)}"]`);
  ok(!$('.verdict'), 'picking again clears the verdict');
  click('[data-act="pv-submit"]');
  ok($('.verdict.ok') && $('.sol'), 'right pick shows Accepted and the solution');
  ok(solvedHeader() === sh + 1, 'header solved count +1');
  click('.pvactions [data-act="pv-next"]');
  ok(/^42\./.test(h1()), 'next problem moves through the list');
  click('[data-act="pv-reveal"]');
  ok($('.sol') && $$('.opt:disabled').length >= 2, 'view solution reveals and locks');
  click('[data-act="pv-next"]');
  r = pvRaw();
  document.body.dispatchEvent(new KeyboardEvent('keydown', {key:Array.isArray(r[3]) ? String($$('[data-pv]').findIndex(b => b.dataset.pv === '0') + 1) : (r[3] ? 't' : 'f'), bubbles:true}));
  document.body.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true}));
  ok($('.verdict.ok'), 'keyboard pick + Enter submits');
  click('[data-act="pv-back"]');
  ok($('#prows') && $$('#prows .st.solved').length >= 2, 'back to list shows solved icons');

  // Profile: streak, heatmap, recent submissions
  ok($('#acct .avatar.guest'), 'profile button in the top bar');
  click('#acct .avatar');
  ok($('.pfgrid') && $('.heatmap') && $$('.heatmap rect').length > 360, 'profile opens with a year heatmap');
  ok(/1 day/.test($('.pfstreak .pfbig').textContent) && $('.pfflame.on'), 'streak counts today: ' + $('.pfstreak .pfbig').textContent);
  ok($$('.heatmap rect.hm0').length < $$('.heatmap rect').length, 'today is shaded on the heatmap');
  ok(+$('.pfsolved .ringlabel b').textContent === solvedHeader(), 'profile theory ring matches the header');
  ok($$('.recent li').length > 3, 'recent accepted list');
  click('[data-act="pf-recent"][data-v="all"]');
  ok(/Wrong Answer/.test($('.recent').textContent) && /Accepted/.test($('.recent').textContent), 'submissions list shows both verdicts');
  click($('.recent li a'));
  ok($('.pv') && /Back to profile/.test($('[data-act="pv-back"]').textContent), 'a recent submission opens with back-to-profile');
  click('[data-act="pv-back"]');
  ok($('.pfgrid'), 'back returns to the profile');
  ok(st().log.length >= 10 && st().log.every(x => x.length === 3), 'submission log saved (' + st().log.length + ')');

  tab('theory');
  // Mock
  click('[data-act="mock"]');
  ok(/^\d+:\d\d$/.test($('#timer').textContent), 'mock timer ' + $('#timer').textContent);
  ok(!$('.verdict'), 'mock has no feedback while answering');
  for (let i = 0; i < 3; i++) { answer('quiz', true); click('[data-act="next"]'); }
  click('[data-act="jump"][data-k="10"]');
  ok(/Problem 11 of 15/.test(h1()), 'mock jump');
  click('[data-act="submit"]');
  ok($$('.result').length === 15 && $$('.result .st.todo').length === 12, 'mock results: 3 answered, 12 blank');
  click('[data-act="done-results"]');
  ok($('#prows'), 'mock returns to Theory');

  // Privacy page
  tab('profile'); click('[data-act="go"][data-v="privacy"]');
  ok(/Your data/.test(h1()) && /Firestore/.test($('#main').textContent) && /never uploaded/.test($('#main').textContent), 'privacy page explains storage and the judge');
  // Roles: what postings ask for, and hardware roles
  tab('roles');
  ok($$('.review').length === 14 + 12, '14 posting requirements and 12 hardware roles reviewed');
  const arithRev = $$('.review').find(r => /Computer arithmetic/.test(r.querySelector('.rhead b').textContent));
  ok(arithRev && arithRev.querySelector('.vpill').textContent === 'Strong match', 'computer arithmetic is a strong match');
  ok($$('.vpill.bad').length === 1 && /CAD/.test($('.vpill.bad').closest('.review').textContent), 'mechanical CAD flagged as not covered');
  ok(!/NVIDIA asks|JR2027047/.test($('#main').textContent), 'roles page is general, not one job posting');
  ok($$('.review .cochip').length > 20, 'each role lists companies that hire for it');
  click('[data-act="f-list-go"][data-v="sk-arith"]');
  ok($$('#prows tr').length === RAW.filter(r => (r[5] || '').includes('a')).length, 'skill link opens the arithmetic list (' + $$('#prows tr').length + ')');

  // Companies
  tab('companies');
  ok($$('.cocard').length === COMPANIES.length, COMPANIES.length + ' company cards');
  const cq = $('#co-q'); cq.value = 'memory'; cq.dispatchEvent(new Event('input', {bubbles:true}));
  ok($$('.cocard').length === 1 && /Micron/.test($('.cocard').textContent), 'company search finds Micron');
  cq.value = ''; cq.dispatchEvent(new Event('input', {bubbles:true}));
  click('[data-act="co-open"][data-v="nvidia"]');
  ok(/NVIDIA/.test(h1()) && $('.seg [aria-selected="true"]') && /Reported/.test($('.seg [aria-selected="true"]').textContent), 'NVIDIA opens on its Reported tab');
  ok($$('.rtable')[0].tBodies[0].rows.length === 6, 'NVIDIA page: your 6 OA topics');
  ok($$('.rtable')[1].tBodies[0].rows.length === 21, 'NVIDIA page: 21 reported topics');
  ok($$('.rtable')[1].textContent.match(/\d+ problems/g).every(t => parseInt(t, 10) >= 4), 'every reported topic has at least 4 problems');
  ok($$('.ctable tbody tr[data-copen]').length === 5, '5 reported NVIDIA coding problems');
  click('[data-act="co-tab"][data-v="theory"]');
  const nvN = $$('#corows tr').length;
  click('[data-act="co-d"][data-v="H"]');
  ok($$('#corows .c-df').every(c => c.textContent === 'Hard') && $$('#corows tr').length < nvN, 'company list filters by difficulty');
  click($$('#corows a[data-open]')[0]);
  ok(/Back to NVIDIA/.test($('[data-act="pv-back"]').textContent) && $('.cochips .cochip'), 'problem from a company list shows its company tags');
  click('[data-act="pv-back"]');
  ok(/NVIDIA/.test(h1()), 'back returns to the company page');
  tab('theory'); click('[data-act="f-reset"]');
  const fco = $('#f-co'); fco.value = 'micron'; fco.dispatchEvent(new Event('input', {bubbles:true}));
  const mN = $$('#prows tr').length;
  ok(mN > 20 && mN < RAW.length && $$('#prows .c-co').every(c => /Micron/.test(c.querySelector('.comini').title)), 'theory list filters by company (' + mN + ' Micron)');
  click('[data-act="f-reset"]');

  // Test out of a locked quest
  tab('quest');
  click('.path [data-act="open-unit"][data-u="5"]');
  ok(/locked/.test($('#main').textContent), 'locked quest page explains the lock');
  click('[data-act="unit-quiz"]');
  for (let i = 0; i < 5; i++) { answer('quiz', true); click('[data-act="next"]'); }
  ok(st().learn.units['5'].passed, 'test-out passes quest 5');
  click('[data-act="done-results"]');
  ok($('.steps'), 'quest 5 now shows its lessons');

  // Reset with an in-page confirm
  tab('profile');
  click('[data-act="reset"]');
  ok($('[data-act="reset-yes"]'), 'reset asks in the page');
  click('[data-act="reset-yes"]');
  ok(!Object.keys(st().q).length && solvedHeader() === 0, 'reset clears progress');
}

function phase2(){
  let total = 0, widgets = 0;
  for (let u = 1; u <= UNITS.length; u++) {
    tab('quest');
    click(`.path [data-act="open-unit"][data-u="${u}"]`);
    if (u === 9) {
      let g = 0;
      while ($('#card-next') && !$('#w-mux-t') && g++ < 10) { if ($('#card-check .opts')) answer('card', true); click('#card-next'); }
      ok($('#w-mux-t'), 'mux builder in quest 9');
      const sols = {OR:['A','B','1'], AND:['A','0','B'], NOTA:['A','1','0'], NAND:['A','1','nB'], NOR:['A','nB','0'], XOR:['A','B','nB']};
      Object.keys(sols).forEach(t => ok(setMux(t, ...sols[t]), 'mux solves ' + t));
      ok(!setMux('OR', 'A', '0', '0'), 'mux rejects a wrong wiring');
      ok($$('#widget-host .chip.done').length === 6, 'six mux chips marked');
      click('[data-act="step"][data-i="0"]');
    }
    const w = walkCards(true);
    total += w.cards; widgets += w.widgets;
    ok($('[data-act="unit-quiz"]'), 'quest ' + u + ' ends at its checkpoint');
  }
  ok(total === UNITS.reduce((n, U) => n + U.cards.length, 0), 'walked all ' + total + ' lessons');
  ok(widgets === UNITS.reduce((n, U) => n + U.cards.filter(c => c.w).length, 0), 'mounted all ' + widgets + ' widgets');
}

function phase3(){
  ok($('.pv') && /^100\./.test(h1()), 'deep link #p100 opens problem 100: ' + h1());
}

function phase4(){
  const over = name => { const w = document.documentElement.scrollWidth, v = window.innerWidth; ok(w <= v + 1, `no horizontal scroll on ${name} at ${v}px (scrollWidth ${w})`); };
  over('home page');
  ['quest', 'theory', 'roles', 'profile', 'companies'].forEach(t => { tab(t); over(t); });
  click('[data-act="co-open"][data-v="nvidia"]'); over('company page');
  tab('theory'); click($$('#prows a[data-open]')[3]); over('problem page');
  tab('quest'); click('[data-act="open-unit"][data-u="1"]'); over('quest page');
  click('#card-next'); over('quest page with widget');
}

const wait = ms => new Promise(r => setTimeout(r, ms));
async function phase3b(){
  phase3();
  // Import a backup file: it must merge with (not replace) the progress already here.
  const before = solvedHeader();
  click('[data-act="pv-back"]'); tab('profile');
  ok($('[data-act="export"]') && $('[data-act="import"]'), 'export and import buttons on the progress card');
  const file = new File([JSON.stringify({v:2, updatedAt:9, q:{'03-01':{n:1, c:1, ok:true, at:9}, '03-02':{n:2, c:1, ok:true, at:9}}, weeks:{}, hist:[], learn:{cards:{}, units:{}, mux:{}}})], 'backup.json', {type:'application/json'});
  const dt = new DataTransfer(); dt.items.add(file);
  const inp = $('#import-file'); inp.files = dt.files; inp.dispatchEvent(new Event('change', {bubbles:true}));
  for (let k = 0; k < 40 && solvedHeader() === before; k++) await wait(250);   // reading the file is real I/O
  ok(solvedHeader() === before + 2, 'import merged 2 solved problems (' + before + ' -> ' + solvedHeader() + ')');
  ok(st().q['03-01'] && st().q['03-01'].c === 1, 'imported progress saved locally');
  // A booby-trapped backup: markup in fields the profile shows must never reach the page.
  const bad = '<img src=x onerror="window.__pwned=1">';
  const evil = new File([JSON.stringify({v:2, q:{'03-03':{n:1, c:1, ok:true, at:Date.now()}}, hist:[{at:Date.now(), mode:'mock', label:bad, score:bad, total:bad}],
    code:{'c-01':{src:bad, solved:0, at:1, subs:[{at:1, v:bad, p:bad, t:bad}, {at:2, v:'Accepted', p:bad, t:7}]}}, log:[[Date.now(), bad, 1], [Date.now(), '03-03', 1]], learn:{cards:{}, units:{}, mux:{}}})], 'evil.json', {type:'application/json'});
  const dt2 = new DataTransfer(); dt2.items.add(evil); const inp2 = $('#import-file'); inp2.files = dt2.files; inp2.dispatchEvent(new Event('change', {bubbles:true}));
  for (let k = 0; k < 40 && !(st().q['03-03']); k++) await wait(250);
  tab('profile'); await wait(200);
  ok(st().q['03-03'] && !window.__pwned && !$('#main img[src="x"]') && st().hist.every(h => typeof h.score === 'number') && st().log.every(x => x[1] !== bad), 'imported markup is neutralized (numbers stay numbers, unknown ids dropped)');
}
async function phase6(){
  // The Coding tab: list, filters, a hand-checked problem, the weekly card, and real judging of Python, C, C++ and Verilog.
  const sol = id => CODING.find(p => p.id === id).sol, CODE = {cpp02:sol("cpp-02"), counter:sol("rtl-02"), skid:sol("rtl-16")};
  const until = async (f, secs) => { for (let k = 0; k < secs * 4 && !f(); k++) await wait(250); return f(); };
  const verdict = () => { const h = $('#run-out .vhead h3'); return h && !$('#run-out .spin') ? h.textContent : ''; };
  const setCode = t => { const e = $('#code-editor'); e.value = t; e.dispatchEvent(new Event('input', {bubbles:true})); };
  const judge = async (act, secs) => { click(`[data-act="${act}"]`); await until(() => !$('#run-out .spin') && verdict(), secs || 240); return verdict(); };
  tab('coding');
  ok($$('#crows tr').length === CODING.length, 'coding list shows all ' + CODING.length);
  click('[data-act="cf-area"][data-v="RTL design"]');
  ok($$('#crows tr').length === CODING.filter(p => p.area === 'RTL design').length, 'area chip filters to RTL design');
  const d = $('#cf-d'); d.value = 'H'; d.dispatchEvent(new Event('input', {bubbles:true}));
  ok($$('#crows .c-df').every(c => c.textContent === 'Hard'), 'difficulty filter on coding');
  click('[data-act="cf-reset"]');
  ok($$('#crows .t-run').length === CODING.filter(p => p.run).length, CODING.filter(p => p.run).length + ' problems are marked as judged');
  click('#crows a[data-copen="sh-01"]');
  ok($('#code-editor') && /your command/.test($('#code-editor').value), 'editor opens with the starter code');
  ok($('.editor .gutter') && $('.editor .gutter').textContent.trim() === '1', 'editor shows line numbers');
  ok(!$('[data-act="c-run"]') && $('[data-act="c-mark"]'), 'a hand-checked problem has Mark as solved instead of Run');
  click('[data-act="c-hint"]'); click('[data-act="c-hint"]');
  ok($$('.hintbox p').length === 2, 'two hints revealed one at a time');
  click('[data-act="c-ltab"][data-v="sol"]');
  ok($('.sol pre.code') && /wc -l/.test($('.sol pre.code').textContent), 'Solution tab shows the solution');
  setCode('# my attempt\nfind . -name "*.sv" | xargs wc -l\n');
  ok($('.editor .gutter').textContent.trim().split('\n').length === 3, 'line numbers follow the text');
  await wait(800);
  ok(st().code['sh-01'] && /my attempt/.test(st().code['sh-01'].src), 'editor text is saved as you type');
  click('[data-act="c-mark"]');
  ok(st().code['sh-01'].solved > 0 && /Solved/.test($('.cstate .pvhead').textContent), 'mark as solved');
  ok(/my attempt/.test($('#code-editor').value), 'your code survives re-rendering');
  click('[data-act="c-back"]');
  ok($('#crows tr[data-copen="sh-01"] .st.solved'), 'list shows the solved status');
  ok(/1<\/b><span class="muted">\/\d+<\/span> code/.test($('#solved').innerHTML), 'top bar counts solved coding problems');

  // Python: Run tries the example cases, Submit runs every test and records a submission.
  tab('coding');
  click('#crows a[data-copen="py-04"]');
  ok($$('.casechip').length === 3 && /gray_codes/.test($('#run-out').textContent), 'Testcase tab shows 3 example cases');
  setCode('def gray_codes(n):\n    print("checking", n)\n    return list(range(1 << n))\n');
  ok(await judge('c-run', 300) === 'Wrong Answer', 'Run: a wrong Python answer gets Wrong Answer (' + verdict() + ')');
  ok($$('#run-out .casechip').length === 3 && $('#run-out .casechip.fail'), 'Run shows a result per example case');
  ok(/checking/.test($('#run-out').textContent), 'printed output is shown');
  ok(!(st().code['py-04'].subs || []).length, 'Run does not record a submission');
  setCode('def gray_codes(n):\n    return [i ^ (i >> 1) for i in range(1 << n)]\n');
  ok(await judge('c-submit', 120) === 'Accepted', 'Submit: a correct Python answer is Accepted');
  ok(st().code['py-04'].solved > 0 && st().code['py-04'].subs.length === 1, 'accepted submission marks it solved and is recorded');
  click('[data-act="c-ltab"][data-v="subs"]');
  ok($('.subs td.v-ok') && /Accepted/.test($('.subs').textContent), 'Submissions tab lists the accepted submission');
  setCode('def gray_codes(n):\n    return [i for i in range(1 << n) if 1/0]\n');
  await judge('c-submit', 120);
  ok(/ZeroDivisionError/.test($('#run-out').textContent) && verdict() === 'Wrong Answer', 'a runtime error is reported in the failing testcase');

  // C, compiled in the browser by Clang.
  tab('coding');
  click('#crows a[data-copen="c-01"]');
  setCode('int popcount(unsigned int x) {\n    return 0;\n}\n');
  ok(await judge('c-submit', 300) === 'Wrong Answer', 'C: a wrong answer gets Wrong Answer (' + verdict() + ' ' + $('#run-out').textContent.slice(0, 120) + ')');
  ok(/First failing testcase/.test($('#run-out').textContent) && /popcount\(1u\)/.test($('#run-out').textContent), 'Submit shows the first failing hidden test');
  setCode('int popcount(unsigned int x) {\n    return y;\n}\n');
  ok(await judge('c-run', 60) === 'Compile Error' && /undeclared identifier/.test($('#run-out').textContent), 'C: a compile error shows the compiler message');
  setCode('int popcount(unsigned int x) {\n    int c = 0;\n    while (x) { x &= x - 1; c++; }\n    return c;\n}\n');
  ok(await judge('c-submit', 60) === 'Accepted' && st().code['c-01'].solved > 0, 'C: a correct answer is Accepted');
  setCode('int popcount(unsigned int x) {\n    while (x) { }\n    return 0;\n}\n');
  ok(await judge('c-run', 60) === 'Time Limit Exceeded', 'C: an infinite loop is stopped (' + verdict() + ')');
  tab('coding');
  click('#crows a[data-copen="cpp-02"]');
  setCode(CODE.cpp02);
  ok(await judge('c-submit', 120) === 'Accepted', 'C++: the LRU cache is Accepted (' + verdict() + ' ' + $('#run-out').textContent.slice(0, 200) + ')');

  // Verilog, synthesized by Yosys and simulated cycle by cycle.
  tab('coding');
  click('#crows a[data-copen="rtl-02"]');
  setCode(CODE.counter.replace("q + 4'd1", "q + 4'd2"));
  ok(await judge('c-submit', 300) === 'Wrong Answer' && /cycle \d+/.test($('#run-out').textContent), 'Verilog: a wrong counter fails at a named cycle (' + verdict() + ')');
  setCode(CODE.counter.replace('endmodule', 'oops endmodule'));
  ok(await judge('c-run', 60) === 'Compile Error', 'Verilog: a syntax error is a Compile Error');
  setCode(CODE.counter);
  ok(await judge('c-submit', 60) === 'Accepted' && st().code['rtl-02'].solved > 0, 'Verilog: a correct counter is Accepted');
  tab('coding');
  click('#crows a[data-copen="rtl-16"]');
  setCode(CODE.skid);
  ok(await judge('c-submit', 60) === 'Accepted', 'Verilog: the skid buffer passes the property checks (' + verdict() + ')');
}
async function phase5(){
  // Sign-in and sync, against a simulated Firebase (defined before the app loads).
  await wait(300);
  ok($('#acct .acctbtn'), 'Sign in button in the top bar');
  ok(solvedHeader() === 1, 'starts with 1 problem solved in this browser');
  click('#acct .acctbtn');
  ok($('#authpage') && /Sign in to Ground Up/.test($('#authpage').textContent) && $('#au-email') && $('#au-pw'), 'sign-in screen with Google and email');
  click('[data-act="auth-mode"]');
  ok(/Create your account/.test($('#authpage h1').textContent), 'switches to create account');
  click('[data-act="auth-mode"]');
  click('[data-act="auth-google"]');
  await wait(400);
  ok(!$('#authpage'), 'sign-in screen closes after signing in');
  ok($('#acct .avatar'), 'avatar shown after signing in');
  ok(solvedHeader() === 3, 'account progress merged with this browser (' + solvedHeader() + ' solved)');
  const saved = JSON.parse(window.__fb.users.u1.state);
  ok(saved.q['01-01'] && saved.q['01-05'] && saved.q['02-03'], 'merged progress written back to the account');
  ok(/Saved to your account/.test($('#sync').textContent), 'sync label: ' + $('#sync').textContent);
  tab('theory'); click($$('#prows a[data-open]')[9]);
  const r = pvRaw(); click(`[data-pv="${code(r, true)}"]`); click('[data-act="pv-submit"]');
  await wait(1300);
  ok(JSON.parse(window.__fb.users.u1.state).q[r[0]], 'a new answer syncs to the account');
  click('[data-act="pv-back"]'); click('#acct .avatar');
  ok(/me@test\.dev/.test($('.pfme').textContent) && /Synced to your account/.test($('#progress-card').textContent), 'profile shows the signed-in account');
  ok(window.__fb.users.u1.email === 'me@test.dev' && window.__fb.users.u1.name === 'Me', 'saved record carries name and email for the dashboard');
  // Admin dashboard (u1 is the admin here)
  click('[data-act="adm-open"]'); await wait(400);
  ok(/Admin dashboard/.test(h1()) && $$('.admtable tbody tr').length === 2, 'admin dashboard lists both accounts');
  ok(/Ada/.test($('.admtable').textContent) && /ada@test\.dev/.test($('.admtable').textContent), 'shows names and emails');
  ok($$('.dau > div').length === 30 && $('.admstats b').textContent === '2', 'stats and a 30-day activity chart');
  ok(/Timing/.test($('.admbars').textContent) && /missed/.test($('.recent').textContent), 'hardest topics and most-missed problems');
  click('[data-act="adm-sort"][data-v="subs"]');
  ok(/Submissions ./.test($('.thsort.on').textContent), 'columns sort');
  click('#acct .avatar');
  click('[data-act="signout"]');
  await wait(200);
  ok($('#acct .acctbtn') && /Saved in this browser/.test($('#sync').textContent), 'signing out returns to browser-only saving');
  // Delete the account: the progress record and the login both go.
  click('#acct .acctbtn'); click('[data-act="auth-google"]'); await wait(400);
  ok(window.__fb.users.u1, 'signed back in, record exists');
  click('#acct .avatar'); click('[data-act="delete"]');
  ok($('[data-act="delete-yes"]') && /cannot be undone/.test($('#progress-card').textContent), 'delete asks for confirmation in the page');
  click('[data-act="delete-yes"]'); await wait(500);
  ok(!window.__fb.users.u1 && !$('#acct .avatar:not(.guest)'), 'account record deleted and signed out');
  ok(solvedHeader() === 0, 'local copy cleared after deleting the account');
}
setTimeout(async () => {
  try { await [null, phase1, phase2, phase3b, phase4, phase5, phase6][PHASE](); } catch (e) { errors.push('THROW ' + e.message + ' ' + (e.stack || '').split('\n')[1]); }
  const fails = log.filter(l => l.startsWith('FAIL')).length;
  const pre = document.createElement('pre'); pre.id = 'testlog';
  pre.textContent = `PHASE ${PHASE}: ${log.length - fails} passed, ${fails} failed, ${errors.length} errors\n` + errors.join('\n') + '\n' + log.filter(l => l.startsWith('FAIL')).join('\n') + '\n===\n' + log.join('\n');
  document.body.appendChild(pre);
  if (window.parent !== window) window.parent.postMessage(pre.textContent, '*');
}, 50);
})();
