// Builds the trainer into one self-contained HTML file, after checking the question bank and lessons.
//   node build.js                    -> ../docs/index.html (standalone page, for GitHub Pages or opening locally)
//   node build.js --fragment out.html -> page body only (for hosts that add their own <html>/<head>, such as Claude artifacts)
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = path.join(__dirname, 'src'), read = f => fs.readFileSync(path.join(src, f), 'utf8');
const SCRIPTS = ['questions.js', 'lessons.js', 'widgets.js', 'app.js'];

// Load the data files and widget table into one sandbox to check them.
const ctx = {};
vm.createContext(ctx);
vm.runInContext(SCRIPTS.slice(0, 3).map(read).join('\n') + '\n;this.RAW = RAW; this.PARTS = PARTS; this.UNITS = UNITS; this.WIDGETS = WIDGETS;', ctx);
const {RAW, PARTS, UNITS, WIDGETS} = ctx;
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
const partUnits = PARTS.flatMap(p => p.units).sort((a, b) => a - b).join(',');
if (partUnits !== UNITS.map(U => U.id).join(',')) errs.push('PARTS do not cover every quest exactly once');
const scripts = SCRIPTS.map(read).join('\n');
if (/<\/script/i.test(scripts)) errs.push('a script contains </script, which would end the inline script early');
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }

const count = f => RAW.filter(f).length, tag = t => count(r => (r[5] || '').includes(t));
const cards = UNITS.reduce((n, U) => n + U.cards.length, 0);
console.log(`ok: ${RAW.length} problems (E ${count(r => r[1] === 'E')}, M ${count(r => r[1] === 'M')}, H ${count(r => r[1] === 'H')}); ` +
  `OA ${tag('o')}, variants ${tag('v')}, reported ${tag('r')}, beyond the book ${tag('b')}, arithmetic ${tag('a')}; ${UNITS.length} quests, ${cards} lessons`);

const body = read('shell.html')
  .replace('/*STYLE*/', () => read('style.css'))
  .replace('/*SCRIPTS*/', () => scripts);
const args = process.argv.slice(2), fragment = args[0] === '--fragment';
let out, html;
if (fragment) {
  out = path.resolve(args[1] || 'trainer-fragment.html');
  html = body;
} else {
  out = path.resolve(args[0] || path.join(__dirname, '..', 'docs', 'index.html'));
  const split = body.indexOf('<header');
  html = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
    '<meta name="description" content="A hardware OA trainer: a 22-quest learning path and a multiple-choice problem list built on Hardware from the Ground Up.">\n' +
    body.slice(0, split) + '</head>\n<body>\n' + body.slice(split) + '\n</body>\n</html>\n';
}
fs.mkdirSync(path.dirname(out), {recursive: true});
fs.writeFileSync(out, html);
console.log('wrote ' + path.relative(process.cwd(), out) + ' (' + Math.round(html.length / 1024) + ' KB)');
