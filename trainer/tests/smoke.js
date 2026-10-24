// Drives the trainer UI in a headless browser and writes PASS/FAIL lines into <pre id="testlog">.
(function(){
const PHASE = window.__PHASE;
const log = [], errors = [];
window.addEventListener('error', e => errors.push('ERR ' + e.message + ' line ' + e.lineno));
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const ok = (c, m) => log.push((c ? 'PASS ' : 'FAIL ') + m);
const st = () => JSON.parse(localStorage.getItem('ground-up-trainer-v1') || 'null');
const click = sel => { const el = typeof sel === 'string' ? $(sel) : sel; if (!el) { log.push('FAIL missing ' + sel); return false; } el.click(); return true; };
const tab = t => click(`.navlinks button[data-tab="${t}"]`);
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
  ok(!/\bXP\b|\bLV\b|Level \d|[Bb]adge|Achievement|streak/.test(visible()), 'no XP, levels, badges, streaks or achievements on the quest map');
  ok($$('.path > .node').length === 22, '22 quest nodes on the map');
  ok($$('.path > .node.locked').length === 21, 'only quest 1 is open at the start');
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
  ok($$('.path > .node.locked').length === 20, 'quest 2 unlocked');
  const sh = solvedHeader();
  ok(sh >= 5, 'header solved count went up to ' + sh);

  // Problem list
  tab('problems');
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
  click('[data-act="f-list"][data-v="oa"]');
  ok($$('#prows tr').length === 10, 'study list "Your OA" shows 10');
  click('[data-act="f-list"][data-v="oa-mux"]');
  ok($$('#prows tr').length >= 15, 'OA topic list (mux) shows ' + $$('#prows tr').length);
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

  // Weekly set with save and resume
  tab('weekly');
  click('[data-act="week"]');
  ok(/Problem 1 of 25/.test(h1()), 'weekly set has 25');
  for (let i = 0; i < 12; i++) { answer('quiz', i % 3 !== 0); click('[data-act="next"]'); }
  click('[data-act="quit"]');
  ok(/12 of 25 answered/.test($('#main').textContent), 'weekly page shows saved progress');
  ok(!$('#main tr[data-open]'), 'weekly rows locked until finished');
  click('[data-act="week"]');
  ok(/Problem 13 of 25/.test(h1()), 'resume at 13');
  document.body.dispatchEvent(new KeyboardEvent('keydown', {key:'2', bubbles:true}));
  ok($('.verdict'), 'pressing 2 answers');
  document.body.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true}));
  ok(/Problem 14 of 25/.test(h1()), 'Enter goes to the next problem');
  for (let i = 13; i < 25; i++) { answer('quiz', true); click('[data-act="next"]'); }
  const wk = Object.keys(st().weeks)[0];
  ok(st().weeks[wk].done, 'weekly set done, score ' + st().weeks[wk].score);
  click('[data-act="retry-missed"]');
  let guard = 0;
  while ($('.opts[data-scope="quiz"]') && guard++ < 30) { answer('quiz', true); click('[data-act="next"]'); }
  ok($('.big'), 'retry set finishes');
  click('[data-act="done-results"]');
  ok(/Review answers/.test($('#main').textContent) && $$('#main tr[data-open]').length === 25, 'finished week: 25 reviewable rows');
  click($('#main tr[data-open] a'));
  ok($('.pv') && /Back to weekly/.test($('[data-act="pv-back"]').textContent), 'weekly row opens problem with back-to-weekly');
  click('[data-act="pv-back"]');

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
  click('[data-act="review-oa"]');
  guard = 0;
  while ($('.opts[data-scope="quiz"]') && guard++ < 25) { answer('quiz', true); click('[data-act="next"]'); }
  ok($('.big') && $('.big').textContent.replace(/\s/g, '') === '20/20', 'OA review set of 20 finished');
  click('[data-act="done-results"]');

  ok(!/\bXP\b|\bLV\b|Level \d|[Bb]adge|Achievement|streak/.test(visible()), 'no XP, levels, badges or streaks on the weekly page');
  // Job match review
  tab('jobs');
  ok($$('.review').length === 14, '14 job-posting requirements reviewed');
  ok($$('.rtable')[0].tBodies[0].rows.length === 6, 'OA topic table: 6 topics');
  ok($$('.rtable')[1].tBodies[0].rows.length === 21, 'reported-topics table: 21 topics');
  ok($$('.rtable')[1].textContent.match(/\d+ problems/g).every(t => parseInt(t, 10) >= 4), 'every reported topic has at least 4 problems');
  const arithRev = $$('.review').find(r => /Understanding of computer arithmetic/.test(r.querySelector('.rhead b').textContent));
  ok(arithRev && arithRev.querySelector('.vpill').textContent === 'Strong match', 'computer arithmetic now a strong match');
  ok($$('.vpill.bad').length === 1 && /CAD/.test($('.vpill.bad').closest('.review').textContent), 'mechanical CAD flagged as not covered');
  click('[data-act="f-list-go"][data-v="sk-arith"]');
  ok($$('#prows tr').length === RAW.filter(r => (r[5] || '').includes('a')).length, 'skill link opens the arithmetic list (' + $$('#prows tr').length + ')');

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
  tab('weekly');
  click('[data-act="reset"]');
  ok($('[data-act="reset-yes"]'), 'reset asks in the page');
  click('[data-act="reset-yes"]');
  ok(!Object.keys(st().q).length && solvedHeader() === 0, 'reset clears progress');
}

function phase2(){
  let total = 0, widgets = 0;
  for (let u = 1; u <= 22; u++) {
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
  over('quest map');
  ['problems', 'weekly', 'jobs'].forEach(t => { tab(t); over(t); });
  tab('problems'); click($$('#prows a[data-open]')[3]); over('problem page');
  tab('quest'); click('[data-act="open-unit"][data-u="1"]'); over('quest page');
  click('#card-next'); over('quest page with widget');
}

const wait = ms => new Promise(r => setTimeout(r, ms));
async function phase3b(){
  phase3();
  // Import a backup file: it must merge with (not replace) the progress already here.
  const before = solvedHeader();
  click('[data-act="pv-back"]'); tab('weekly');
  ok($('[data-act="export"]') && $('[data-act="import"]'), 'export and import buttons on the progress card');
  const file = new File([JSON.stringify({v:2, updatedAt:9, q:{'03-01':{n:1, c:1, ok:true, at:9}, '03-02':{n:2, c:1, ok:true, at:9}}, weeks:{}, hist:[], learn:{cards:{}, units:{}, mux:{}}})], 'backup.json', {type:'application/json'});
  const dt = new DataTransfer(); dt.items.add(file);
  const inp = $('#import-file'); inp.files = dt.files; inp.dispatchEvent(new Event('change', {bubbles:true}));
  await wait(300);
  ok(solvedHeader() === before + 2, 'import merged 2 solved problems (' + before + ' -> ' + solvedHeader() + ')');
  ok(st().q['03-01'] && st().q['03-01'].c === 1, 'imported progress saved locally');
}
async function phase5(){
  // Sign-in and sync, against a simulated Firebase (defined before the app loads).
  await wait(300);
  ok($('#acct .acctbtn'), 'Sign in button in the top bar');
  ok(solvedHeader() === 1, 'starts with 1 problem solved in this browser');
  click('#acct .acctbtn');
  await wait(400);
  ok($('#acct .avatar'), 'avatar shown after signing in');
  ok(solvedHeader() === 3, 'account progress merged with this browser (' + solvedHeader() + ' solved)');
  const saved = JSON.parse(window.__fb.users.u1.state);
  ok(saved.q['01-01'] && saved.q['01-05'] && saved.q['02-03'], 'merged progress written back to the account');
  ok(/Saved to your account/.test($('#sync').textContent), 'sync label: ' + $('#sync').textContent);
  tab('problems'); click($$('#prows a[data-open]')[9]);
  const r = pvRaw(); click(`[data-pv="${code(r, true)}"]`); click('[data-act="pv-submit"]');
  await wait(1300);
  ok(JSON.parse(window.__fb.users.u1.state).q[r[0]], 'a new answer syncs to the account');
  click('[data-act="pv-back"]'); tab('weekly');
  ok(/Signed in as/.test($('#progress-card').textContent), 'progress card shows the signed-in account');
  click('[data-act="signout"]');
  await wait(200);
  ok($('#acct .acctbtn') && /Saved in this browser/.test($('#sync').textContent), 'signing out returns to browser-only saving');
}
setTimeout(async () => {
  try { await [null, phase1, phase2, phase3b, phase4, phase5][PHASE](); } catch (e) { errors.push('THROW ' + e.message + ' ' + (e.stack || '').split('\n')[1]); }
  const fails = log.filter(l => l.startsWith('FAIL')).length;
  const pre = document.createElement('pre'); pre.id = 'testlog';
  pre.textContent = `PHASE ${PHASE}: ${log.length - fails} passed, ${fails} failed, ${errors.length} errors\n` + errors.join('\n') + '\n' + log.filter(l => l.startsWith('FAIL')).join('\n') + '\n===\n' + log.join('\n');
  document.body.appendChild(pre);
  if (window.parent !== window) window.parent.postMessage(pre.textContent, '*');
}, 50);
})();
