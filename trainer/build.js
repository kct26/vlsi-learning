// Builds the trainer into one self-contained HTML file, after checking the question bank and lessons.
//   node build.js                    -> ../docs/index.html (standalone page, for GitHub Pages or opening locally)
//   node build.js --fragment out.html -> page body only (for hosts that add their own <html>/<head>, such as Claude artifacts)
//   --with-premium (with --fragment)  -> also embed the Premium company data, for private builds only (the Claude artifact, tests)
// Premium data lives in private/premium-data.js (not in git). When present, it is checked and written to
// private/premium-content.json, the file the admin dashboard uploads to Firestore.
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = path.join(__dirname, 'src'), read = f => fs.readFileSync(path.join(src, f), 'utf8');
const SCRIPTS = ['questions.js', 'lessons.js', 'widgets.js', 'coding.js', 'hidden-tests.js', 'judge.js', 'company-names.js', 'logos.js', 'app.js'];

// Load the data files and widget table into one sandbox to check them.
const ctx = {};
vm.createContext(ctx);
const PRIV = path.join(__dirname, 'private', 'premium-data.js'), hasPremium = fs.existsSync(PRIV);
vm.runInContext(SCRIPTS.slice(0, 7).map(read).join('\n') + (hasPremium ? '\n' + fs.readFileSync(PRIV, 'utf8') : '\nconst PREMIUM_DATA = {companies:{}, assessments:[]};') + '\n;this.PREMIUM_DATA = PREMIUM_DATA; this.COMPANY_NAMES = COMPANY_NAMES; this.POS_ROLES = POS_ROLES; this.POS_LEVELS = POS_LEVELS; this.HIDDEN = HIDDEN; this.V_CHECKS = V_CHECKS; this.RAW = RAW; this.PARTS = PARTS; this.UNITS = UNITS; this.WIDGETS = WIDGETS; this.CODING = CODING; this.LANGS = LANGS; this.CODE_AREAS = CODE_AREAS;', ctx);
const {RAW, PARTS, UNITS, WIDGETS, CODING, LANGS, CODE_AREAS, HIDDEN, V_CHECKS, COMPANY_NAMES, POS_ROLES, POS_LEVELS, PREMIUM_DATA} = ctx;
const COMPANIES = COMPANY_NAMES.map(c => Object.assign({}, c, PREMIUM_DATA.companies[c.id] || {})), ASSESSMENTS = PREMIUM_DATA.assessments;
const errs = [], ids = new Set(), perCh = {}, texts = new Set();
RAW.forEach((r, i) => {
  const [id, d, q, ans, expl, tags] = r, where = `RAW[${i}] ${id}`;
  if (!/^\d\d-\d\d$/.test(id)) errs.push(where + ': bad id');
  if (ids.has(id)) errs.push(where + ': duplicate id');
  ids.add(id);
  if (i > 0 && RAW[i - 1][0] >= id) errs.push(where + ': ids out of order');
  const ch = parseInt(id, 10);
  if (ch < 1 || ch > UNITS.length) errs.push(where + ': chapter has no matching quest');
  perCh[ch] = (perCh[ch] || 0) + 1;
  if (!['E', 'M', 'H'].includes(d)) errs.push(where + ': difficulty must be E, M or H');
  if (tags !== undefined && !/^[ovrba]+$/.test(tags)) errs.push(where + ': unknown tag ' + tags);
  if (r.length > 6) errs.push(where + ': too many fields');
  if (!q || !expl) errs.push(where + ': missing question or explanation');
  if (texts.has(q)) errs.push(where + ': duplicate question text');
  texts.add(q);
  if (Array.isArray(ans)) {
    if (ans.length !== 4) errs.push(where + ': MCQ needs 4 options');
    if (new Set(ans).size !== ans.length) errs.push(where + ': duplicate options');
    if (ans.some(o => typeof o !== 'string' || !o.trim())) errs.push(where + ': empty option');
  } else if (typeof ans !== 'boolean') errs.push(where + ': T/F answer must be boolean');
});
UNITS.forEach((U, i) => {
  if (U.id !== i + 1) errs.push(`UNITS[${i}]: id ${U.id} out of order`);
  if ((perCh[U.id] || 0) < 5) errs.push(`chapter ${U.id}: fewer than 5 questions for the checkpoint`);
  U.cards.forEach((c, j) => {
    const where = `quest ${U.id} lesson ${j + 1}`;
    if (!c.t || !Array.isArray(c.b) || !c.b.length) errs.push(where + ': missing title or body');
    if (c.q && !ids.has(c.q)) errs.push(where + ': check question ' + c.q + ' not in bank');
    if (c.w && !WIDGETS[c.w.split(':')[0]]) errs.push(where + ': unknown widget ' + c.w);
  });
});
const codeIds = new Set();
CODING.forEach((p, i) => {
  const where = `CODING[${i}] ${p.id}`;
  if (!p.id || codeIds.has(p.id)) errs.push(where + ': missing or duplicate id');
  codeIds.add(p.id);
  if (!['E', 'M', 'H'].includes(p.d)) errs.push(where + ': difficulty must be E, M or H');
  if (!LANGS[p.lang]) errs.push(where + ': unknown language ' + p.lang);
  if (!CODE_AREAS.includes(p.area)) errs.push(where + ': unknown area ' + p.area);
  if (!p.title || !Array.isArray(p.p) || !p.p.length || !p.starter || !p.sol || !Array.isArray(p.hints) || !Array.isArray(p.why)) errs.push(where + ': missing title, statement, starter, hints, solution or explanation');
  const R = p.run;
  if (R && !R.kind && (p.lang !== 'python' || !R.fn || !Array.isArray(R.tests) || !R.tests.length || R.tests.some(t => !Array.isArray(t) || t.length !== 2 || !Array.isArray(t[0])))) errs.push(where + ': bad Python tests');
  if (R && R.kind === 'c' && (!['c', 'cpp'].includes(p.lang) || !Array.isArray(R.tests) || R.tests.length < 3 || R.tests.some(t => !Array.isArray(t) || !(t.length === 2 || (t.length === 4 && (t[2] === 'out' || t[2] === null) && t[3]))))) errs.push(where + ': bad C/C++ tests');
  if (R && R.kind === 'v' && (p.lang !== 'verilog' || (R.check ? !V_CHECKS[R.check] || !R.top : !Array.isArray(R.benches) || !R.benches.length || R.benches.some(b => !b.name || !b.top || !Array.isArray(b.in) || !(b.rows || b.rand)))))  errs.push(where + ': bad Verilog tests');
  if (R && R.kind && !['c', 'v'].includes(R.kind)) errs.push(where + ': unknown test kind ' + R.kind);
});
// Position roles must use real chapters and areas; every position needs a known company, role and level.
Object.entries(POS_ROLES).forEach(([k, R]) => {
  (R.ch || []).forEach(ch => { if (!UNITS.some(U => U.id === ch)) errs.push('position role ' + k + ': unknown chapter ' + ch); });
  (R.areas || []).forEach(a => { if (!CODE_AREAS.includes(a)) errs.push('position role ' + k + ': unknown coding area ' + a); });
});
Object.entries(PREMIUM_DATA.positions || {}).forEach(([co, list]) => {
  if (!COMPANY_NAMES.some(c => c.id === co)) errs.push('positions for unknown company ' + co);
  (Array.isArray(list) ? list : []).forEach((e, i) => { if (!Array.isArray(e) || typeof e[0] !== 'string' || !e[0] || !POS_ROLES[e[1]] || !POS_LEVELS.includes(e[2])) errs.push(`positions ${co}[${i}]: needs [title, role, level] with a known role and level`); });
});
// Company tags: every id must exist, chapters must be quests, areas must be Coding areas.
const coIds = new Set();
Object.keys(PREMIUM_DATA.companies).forEach(id => { if (!COMPANY_NAMES.some(c => c.id === id)) errs.push('premium data for unknown company ' + id); });
COMPANIES.forEach(c => {
  const where = 'company ' + c.id;
  if (!c.id || coIds.has(c.id) || !c.name || !c.focus) errs.push(where + ': missing or duplicate id, or missing name or focus');
  coIds.add(c.id);
  (c.chapters || []).forEach(ch => { if (!UNITS.some(U => U.id === ch)) errs.push(where + ': unknown chapter ' + ch); });
  (c.areas || []).forEach(a => { if (!CODE_AREAS.includes(a)) errs.push(where + ': unknown coding area ' + a); });
  if (c.tags && !/^[ovrba]+$/.test(c.tags)) errs.push(where + ': unknown source tag in ' + c.tags);
  (c.ids || []).concat(c.reported || []).forEach(id => { if (!ids.has(id) && !codeIds.has(id)) errs.push(where + ': unknown problem id ' + id); });
  (c.reported || []).forEach(id => { if (!(c.ids || []).includes(id)) errs.push(where + ': reported id ' + id + ' must also be in ids'); });
});
// Online assessments: one per company; ready ones need a timer and sections whose coding ids exist.
ASSESSMENTS.forEach(a => {
  const where = 'assessment ' + a.co;
  if (!coIds.has(a.co)) errs.push(where + ': unknown company');
  if (!a.ready) return;
  if (!a.title || !(a.minutes > 0) || !Array.isArray(a.sections) || !a.sections.length) errs.push(where + ': needs title, minutes and sections');
  (a.sections || []).forEach(sec => {
    if (!['mcq', 'code'].includes(sec.kind) || !(sec.n > 0)) errs.push(where + ': each section needs kind mcq or code and n > 0');
    if (sec.kind === 'code') (sec.ids || []).forEach(id => { if (!codeIds.has(id)) errs.push(where + ': unknown coding problem ' + id); });
    if (sec.kind === 'code' && (sec.ids || []).length < sec.n) errs.push(where + ': fewer coding ids than n');
  });
});
Object.keys(HIDDEN).forEach(id => { if (!codeIds.has(id)) errs.push('hidden tests for unknown problem ' + id); });
const partUnits = PARTS.flatMap(p => p.units).sort((a, b) => a - b).join(',');
if (partUnits !== UNITS.map(U => U.id).join(',')) errs.push('PARTS do not cover every quest exactly once');
const scripts = SCRIPTS.map(read).join('\n');
if (/<\/script/i.test(scripts)) errs.push('a script contains </script, which would end the inline script early');
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }

const count = f => RAW.filter(f).length, tag = t => count(r => (r[5] || '').includes(t));
const cards = UNITS.reduce((n, U) => n + U.cards.length, 0);
console.log(`ok: ${RAW.length} problems (E ${count(r => r[1] === 'E')}, M ${count(r => r[1] === 'M')}, H ${count(r => r[1] === 'H')}); ` +
  `OA ${tag('o')}, variants ${tag('v')}, reported ${tag('r')}, beyond the book ${tag('b')}, arithmetic ${tag('a')}; ${UNITS.length} quests, ${cards} lessons; ` +
  `${COMPANIES.length} companies; ${CODING.length} coding problems (E ${CODING.filter(p => p.d === 'E').length}, M ${CODING.filter(p => p.d === 'M').length}, H ${CODING.filter(p => p.d === 'H').length}; ${CODING.filter(p => p.run).length} run in the browser)`);

const body = read('shell.html')
  .replace('/*STYLE*/', () => read('style.css'))
  .replace('/*SCRIPTS*/', () => scripts);
// What the standalone page may load or contact (a hosting provider that sends headers can repeat this, and add frame-ancestors).
// The judge needs jsDelivr and WebAssembly; accounts need Google's sign-in and Firebase endpoints.
const CSP = ["default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob: https://cdn.jsdelivr.net https://www.gstatic.com https://apis.google.com",
  "worker-src 'self' blob:",
  "connect-src 'self' https://cdn.jsdelivr.net https://*.googleapis.com https://www.gstatic.com https://*.firebaseapp.com https://*.firebaseio.com wss://*.firebaseio.com",
  "img-src 'self' data: https://*.googleusercontent.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "frame-src https://*.firebaseapp.com https://accounts.google.com https://apis.google.com",
  "object-src 'none'", "base-uri 'none'", "form-action 'self'", "upgrade-insecure-requests"].join('; ');
const args = process.argv.slice(2), fragment = args[0] === '--fragment', withPremium = fragment && args.includes('--with-premium');
let out, html;
if (fragment) {
  out = path.resolve(args[1] || 'trainer-fragment.html');
  html = withPremium && hasPremium ? body.replace('<script>', () => '<script>window.PREMIUM_INLINE = ' + JSON.stringify(PREMIUM_DATA) + ';</script>\n<script>') : body;
} else {
  out = path.resolve(args[0] || path.join(__dirname, '..', 'docs', 'index.html'));
  const split = body.indexOf('<header');
  html = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
    '<meta name="description" content="A hardware OA trainer: a 22-quest learning path and a multiple-choice problem list built on Hardware from the Ground Up.">\n' +
    `<meta http-equiv="Content-Security-Policy" content="${CSP}">\n` +
    '<meta name="referrer" content="strict-origin-when-cross-origin">\n' +
    '<script src="firebase-config.js"></script>\n' +
    body.slice(0, split) + '</head>\n<body>\n' + body.slice(split) + '\n</body>\n</html>\n';
}
fs.mkdirSync(path.dirname(out), {recursive: true});
fs.writeFileSync(out, html);
// The standalone page reads optional Google sign-in settings from firebase-config.js next to it; create a blank one once.
const cfg = path.join(path.dirname(out), 'firebase-config.js');
if (!fragment && !fs.existsSync(cfg)) fs.writeFileSync(cfg, `// Google sign-in settings for the trainer (see FIREBASE_SETUP.md).
// Leave as null to keep progress in the browser only. To turn accounts on, replace null with the
// firebaseConfig object from your Firebase project (it is safe to publish; access is controlled by firestore.rules).
window.FIREBASE_CONFIG = null;
`);
// The upload file for the admin dashboard (private, never served).
if (hasPremium) fs.writeFileSync(path.join(__dirname, 'private', 'premium-content.json'), JSON.stringify(PREMIUM_DATA));
if (!hasPremium) console.log('note: private/premium-data.js not found; building without Premium data checks');
console.log('wrote ' + path.relative(process.cwd(), out) + ' (' + Math.round(html.length / 1024) + ' KB)');
