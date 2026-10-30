// Turns the book's LaTeX chapters (book/chapters/01-23) into lesson pages for the Learn tab.
// It understands the subset of LaTeX the book uses: sections, lists, tables, code listings, the coloured boxes,
// and math (left as TeX for KaTeX to render in the browser). TikZ drawings become the PNGs cut from the PDF by
// tools/book-figures.py. Used by build.js; run `node book-convert.js` to see a summary.
const fs = require('fs'), path = require('path');

const BOOK = path.join(__dirname, '..', 'book', 'chapters');
const FIGS = path.join(__dirname, '..', 'docs', 'book', 'figures.json');
// Parts of the book after the topic chapters that are useful before an assessment, plus HardCode's own extra chapter.
// n is the page id; label and badge are what the Learn pages show.
const EXTRA = [
  {dir:path.join(__dirname, 'lessons'), file:'oa-c-cpp.tex', n:27, label:'Extra chapter', badge:'C++'},
  {dir:BOOK, file:'25-practice-exam.tex', n:25, label:'Chapter 25', badge:'25'},
  {dir:BOOK, file:'A-formulas.tex', n:26, label:'Appendix A', badge:'A'},
];

const BOXES = {bigidea:'Big idea', everyday:'In everyday life', trap:'Common trap', onoa:'Seen on the assessment', remember:'Remember', worked:'Worked example', defn:'Definition'};
const DROP_ENVS = ['tikzpicture', 'circuitikz', 'tikztimingtable', 'pgfonlayer'];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Reads a {...} group starting at s[i] === '{'; returns [content, index after the closing brace].
function group(s, i){
  let d = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === '\\') { j++; continue; }
    if (s[j] === '{') d++;
    else if (s[j] === '}' && --d === 0) return [s.slice(i + 1, j), j + 1];
  }
  return [s.slice(i + 1), s.length];
}
const skipOpt = (s, i) => { while (s[i] === ' ') i++; if (s[i] !== '[') return i; let d = 0; for (let j = i; j < s.length; j++) { if (s[j] === '[') d++; else if (s[j] === ']' && --d === 0) return j + 1; } return i; };

function chapterFiles(){
  return fs.readdirSync(BOOK).filter(f => /^(0[1-9]|1\d|2[0-3])-.*\.tex$/.test(f)).sort();
}

// Pass 1: every \label, so \ref can say "Chapter 11", "Figure 11.2" or "Section 11.4".
function collectLabels(files){
  const labels = {};
  files.forEach(f => {
    const n = parseInt(f, 10), tex = strip(fs.readFileSync(path.join(BOOK, f), 'utf8'));
    let sec = 0, fig = 0, tab = 0;
    const re = /\\(chapter|section|subsection)\*?\{|\\begin\{(figure|table)\*?\}|\\label\{([^}]*)\}/g;
    let m, last = 'chapter';
    while ((m = re.exec(tex))) {
      if (m[1] === 'section') { sec++; last = 'section'; }
      else if (m[1] === 'chapter') last = 'chapter';
      else if (m[1] === 'subsection') last = 'subsection';
      else if (m[2] === 'figure') { fig++; last = 'figure'; }
      else if (m[2] === 'table') { tab++; last = 'table'; }
      else if (m[3]) {
        const l = m[3];
        labels[l] = /^fig:/.test(l) || last === 'figure' ? {text:`Figure ${n}.${fig}`, ch:n, sec}
          : last === 'table' ? {text:`Table ${n}.${tab}`, ch:n, sec}
          : last === 'chapter' ? {text:`Chapter ${n}`, ch:n, sec:0}
          : {text:`Section ${n}.${sec}`, ch:n, sec};
      }
    }
  });
  return labels;
}
const strip = tex => tex.replace(/(^|[^\\])%.*$/gm, '$1');

function convertChapter(file, labels, figMeta, extra){
  const n = extra ? extra.n : parseInt(file, 10);
  let tex = strip(fs.readFileSync(path.join(extra ? extra.dir : BOOK, file), 'utf8'));
  tex = tex.replace(/^\\newcommand\{[^}]*\}(\[\d\])?\{.*\}\s*$/gm, '');
  const keep = [];   // protected HTML: index -> {html, block}
  const K = (html, block) => { keep.push({html, block}); return `\u0000${keep.length - 1}\u0000`; };

  // Code listings and \verb first: nothing inside them is LaTeX.
  tex = tex.replace(/\\begin\{lstlisting\}(\[[^\]]*\])?\n?([\s\S]*?)\\end\{lstlisting\}/g, (_, o, code) => K(`<pre class="code">${esc(dedent(code))}</pre>`, true));
  tex = tex.replace(/\\verb(.)(.*?)\1/g, (_, d, c) => K(`<code>${esc(c)}</code>`));
  // Math next: it is full of &, \\ and braces. KaTeX renders data-tex in the browser; the text is the fallback.
  const mathBlock = t => K(`<div class="mathd" data-tex="${esc(t.trim())}">${esc(t.trim())}</div>`, true);
  tex = tex.replace(/\\begin\{(align\*?|equation\*?|gather\*?)\}([\s\S]*?)\\end\{\1\}/g, (_, env, t) => mathBlock(/align/.test(env) ? `\\begin{aligned}${t}\\end{aligned}` : t));
  tex = tex.replace(/\\\[([\s\S]*?)\\\]/g, (_, t) => mathBlock(t));
  tex = tex.replace(/\$\$([\s\S]*?)\$\$/g, (_, t) => mathBlock(t));
  tex = tex.replace(/(^|[^\\])\$((?:\\.|[^$\\])+)\$/g, (_, pre, t) => pre + K(`<span class="math" data-tex="${esc(t.trim())}">${esc(t.trim())}</span>`));
  tex = tex.replace(/\\\(([\s\S]*?)\\\)/g, (_, t) => K(`<span class="math" data-tex="${esc(t.trim())}">${esc(t.trim())}</span>`));

  // Figures: the drawing from the PDF, a table, or just the caption.
  let fig = 0;
  tex = tex.replace(/\\begin\{figure\*?\}(\[[^\]]*\])?([\s\S]*?)\\end\{figure\*?\}/g, (_, o, body) => {
    fig++;
    const num = `${n}.${fig}`, ci = body.indexOf('\\caption{'), cap = ci >= 0 ? group(body, ci + 8)[0] : '';
    const capHtml = `<figcaption><b>Figure ${num}.</b> ${inline(cap, keep, labels)}</figcaption>`;
    const meta = figMeta[num];
    if (meta && /\\begin\{(tikzpicture|circuitikz|tikztimingtable)\}/.test(body)) {
      const w = Math.round(meta.w * 0.6), h = Math.round(meta.h * 0.6);
      return K(`<figure class="bfig"><img src="book/fig-${n}-${fig}.png" width="${w}" height="${h}" loading="lazy" alt="${esc(plain(cap))}">${capHtml}</figure>`, true);
    }
    const tb = /\\begin\{tabularx?\}/.test(body) ? tables(body.replace(/\\caption\{[\s\S]*$/, ''), keep, labels) : '';
    return K(`<figure class="bfig">${tb || '<p class="muted small">(This drawing is in the PDF book.)</p>'}${capHtml}</figure>`, true);
  });
  // Tables outside figures.
  tex = tex.replace(/\\begin\{table\*?\}(\[[^\]]*\])?([\s\S]*?)\\end\{table\*?\}/g, (_, o, body) => {
    const ci = body.indexOf('\\caption{'), cap = ci >= 0 ? group(body, ci + 8)[0] : '';
    return K(`<figure class="btab">${tables(body, keep, labels)}${cap ? `<figcaption>${inline(cap, keep, labels)}</figcaption>` : ''}</figure>`, true);
  });
  tex = tex.replace(/\\begin\{(tabularx?)\}[\s\S]*?\\end\{\1\}/g, m => K(tables(m, keep, labels), true));
  // Drawings that are not in a figure: the PDF has them; the page says so.
  DROP_ENVS.forEach(env => { tex = tex.replace(new RegExp(`\\\\begin\\{${env}\\}[\\s\\S]*?\\\\end\\{${env}\\}`, 'g'), () => K('<p class="muted small bdraw">(A drawing here is in the PDF book.)</p>', true)); });

  // Split into the chapter title, its introduction, and sections.
  const cm = /\\chapter\*?\{/.exec(tex);
  const title = cm ? group(tex, cm.index + cm[0].length - 1)[0] : file;
  const afterTitle = cm ? group(tex, cm.index + cm[0].length - 1)[1] : 0;
  const rest = tex.slice(afterTitle);
  const parts = [];
  const sre = /\\section\*?\{/g;
  let m, prev = 0, prevTitle = null;
  while ((m = sre.exec(rest))) {
    const [t, end] = group(rest, m.index + m[0].length - 1);
    parts.push({title:prevTitle, body:rest.slice(prev, m.index)});
    prevTitle = t; prev = end; sre.lastIndex = end;
  }
  parts.push({title:prevTitle, body:rest.slice(prev)});
  const sections = [];
  parts.forEach((p, i) => {
    const html = blocks(p.body, keep, labels).trim();
    if (i === 0) { if (html.replace(/<[^>]+>/g, '').trim()) sections.push({id:`${n}-0`, title:'Introduction', html}); return; }
    sections.push({id:`${n}-${i}`, title:plain(p.title), html});
  });
  return Object.assign({n, title:plain(title), sections}, extra ? {label:extra.label, badge:extra.badge} : {});
}

function dedent(code){
  const lines = code.replace(/\s+$/, '').split('\n');
  const ind = Math.min(...lines.filter(l => l.trim()).map(l => /^ */.exec(l)[0].length));
  return lines.map(l => l.slice(ind)).join('\n');
}

// Environments: lists and boxes are parsed with nesting; everything else falls through to paragraphs.
function blocks(s, keep, labels){
  const K = (html, block) => { keep.push({html, block}); return `\u0000${keep.length - 1}\u0000`; };
  // Innermost environments first, so nested lists and boxes come out right.
  const envRe = /\\begin\{(itemize|enumerate|description|center|flushleft|bigidea|everyday|trap|onoa|remember|worked|defn|quote|minipage)\}((?:(?!\\begin\{(?:itemize|enumerate|description|center|flushleft|bigidea|everyday|trap|onoa|remember|worked|defn|quote|minipage)\})[\s\S])*?)\\end\{\1\}/;
  let m;
  while ((m = envRe.exec(s))) {
    const env = m[1];
    let body = m[2], html;
    if (env === 'itemize' || env === 'enumerate' || env === 'description') {
      body = body.replace(/^\s*\[[^\]]*\]/, '');
      const items = body.split(/\\item\b/).slice(1);
      const tag = env === 'enumerate' ? 'ol' : 'ul';
      let n = 0, renumber = false;
      html = `<${tag}${env === 'description' ? ' class="desc"' : ''}>` + items.map(it => {
        let head = '', labeled = false;
        const t = it.replace(/^\s*\[([^\]]*)\]/, (_, h) => { labeled = true; if (h.trim()) head = `<b>${inline(h, keep, labels)}</b> `; return ''; });
        // In a numbered list, a labeled item (such as \item[Challenge.]) is a heading row: it takes no number.
        if (labeled && tag === 'ol') { renumber = true; return `<li class="olabel">${head}${paras(t, keep, labels, true)}</li>`; }
        const v = renumber ? ` value="${n + 1}"` : '';
        n++; renumber = false;
        return `<li${v}>${head}${paras(t, keep, labels, true)}</li>`;
      }).join('') + `</${tag}>`;
    } else if (BOXES[env]) {
      let label = BOXES[env];
      if (env === 'worked' || env === 'defn') { const g = /^\s*\{/.test(body) ? group(body, body.indexOf('{')) : null; if (g) { label += ': ' + inline(g[0], keep, labels); body = body.slice(g[1]); } }
      html = `<aside class="bbox b-${env}"><p class="bbox-h">${label}</p>${paras(body, keep, labels)}</aside>`;
    } else if (env === 'minipage') {
      html = paras(body.replace(/^\s*(\[[^\]]*\])?\{[^}]*\}/, ''), keep, labels);
    } else html = `<div class="bcenter">${paras(body, keep, labels)}</div>`;
    s = s.slice(0, m.index) + K(html, true) + s.slice(m.index + m[0].length);
  }
  return paras(s, keep, labels);
}

// Paragraphs: split on blank lines; block placeholders stand on their own.
function paras(s, keep, labels, tight){
  s = s.replace(/\\(sub)?subsection\*?\{/g, (m0, sub, off, all) => `\n\n\u0001${sub ? 'h4' : 'h3'}\u0001{`);
  s = s.replace(/\u0001(h[34])\u0001\{/g, (m0, h) => `\u0001${h}\u0001{`);
  const out = [];
  s.split(/\n\s*\n/).forEach(chunk => {
    // headings
    chunk = chunk.replace(/\u0001(h[34])\u0001(\{[\s\S]*)/, (m0, h, rest) => { const [t, e] = group(rest, 0); out.push(`<${h}>${inline(t, keep, labels)}</${h}>`); return rest.slice(e); });
    let buf = '';
    const flush = () => { const t = inline(buf, keep, labels).trim(); if (t) out.push(tight && !out.length ? t : `<p>${t}</p>`); buf = ''; };
    chunk.split(/(\u0000\d+\u0000)/).forEach(part => {
      const pm = /^\u0000(\d+)\u0000$/.exec(part);
      if (pm && keep[+pm[1]].block) { flush(); out.push(keep[+pm[1]].html); }
      else buf += part;
    });
    flush();
  });
  return out.join('\n');
}

function tables(s, keep, labels){
  const out = [];
  const re = /\\begin\{(tabularx?)\}/g;
  let m;
  while ((m = re.exec(s))) {
    let i = m.index + m[0].length;
    if (m[1] === 'tabularx') i = group(s, s.indexOf('{', i))[1];
    i = skipOpt(s, i);
    const spec = group(s, s.indexOf('{', i));
    const end = s.indexOf(`\\end{${m[1]}}`, spec[1]);
    const body = s.slice(spec[1], end);
    re.lastIndex = end;
    const cellsOf = r => r.replace(/\\(toprule|midrule|bottomrule|hline)|\\cline\{[^}]*\}|\\cmidrule(\([^)]*\))?\{[^}]*\}/g, '').trim();
    const toRows = part => part.split(/\\\\(?:\[[^\]]*\])?/).map(cellsOf).filter(Boolean).map(clean => clean.split(/(?<!\\)&/).map(c => {
      const mc = /^\s*\\multicolumn\{(\d+)\}\{[^}]*\}\{([\s\S]*)\}\s*$/.exec(c);
      return mc ? {span:+mc[1], html:inline(mc[2], keep, labels)} : {span:1, html:inline(c, keep, labels).trim()};
    }));
    const mi = body.search(/\\midrule|\\hline/), hasHead = mi > 0 && /\\\\/.test(body.slice(0, mi));
    const headRows = hasHead ? toRows(body.slice(0, mi)) : [], rows = toRows(hasHead ? body.slice(mi) : body);
    const head = headRows.length ? headRows[headRows.length - 1] : null;
    const tr = (cells, tag) => '<tr>' + cells.map(c => `<${tag}${c.span > 1 ? ` colspan="${c.span}"` : ''}>${c.html}</${tag}>`).join('') + '</tr>';
    out.push(`<div class="tablewrap btable"><table>${head ? `<thead>${tr(head, 'th')}</thead>` : ''}<tbody>${rows.map(r => tr(r, 'td')).join('')}</tbody></table></div>`);
  }
  return out.join('');
}

// Inline LaTeX to HTML.
const ONE_ARG = {term:'b', textbf:'b', emph:'em', textit:'em', code:'code', texttt:'code', underline:'u', textsuperscript:'sup', textsubscript:'sub'};
const DROP_ARG = ['label', 'index', 'cite', 'vspace', 'hspace', 'phantom', 'addcontentsline'];
const PLAIN_ARG = ['mbox', 'textrm', 'textsc', 'textnormal', 'text', 'textsf', 'makebox', 'fbox', 'small', 'textcolor', 'color'];
function inline(s, keep, labels){
  if (!s) return '';
  let out = '';
  s = s.replace(/[<>&]/g, c => c === '&' ? '\u0002' : c === '<' ? '&lt;' : '&gt;');   // bare & is a table separator, handled before this
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '\\') {
      const m = /^\\([a-zA-Z]+)\*?|^\\(.)/.exec(s.slice(i));
      if (!m) { i++; continue; }
      const name = m[1], sym = m[2];
      i += m[0].length;
      if (sym !== undefined) {
        const map = {'%':'%', '$':'$', '\u0002':'&amp;', '_':'_', '#':'#', '{':'{', '}':'}', ',':' ', ' ':' ', '\\':'<br>', ';':' ', '!':'', '-':'', '/':'', '@':''};
        out += map[sym] !== undefined ? map[sym] : sym;
        continue;
      }
      while (s[i] === ' ' && !['term', 'textbf', 'emph', 'code', 'texttt', 'ref', 'url', 'href', 'textit', 'footnote', 'paragraph'].includes(name) && !(s[i + 1] === '{')) break;
      const arg = () => { let j = i; while (s[j] === ' ') j++; j = skipOpt(s, j); if (s[j] !== '{') return null; const [a, e] = group(s, j); i = e; return a; };
      if (ONE_ARG[name]) { const a = arg(); out += a == null ? '' : `<${ONE_ARG[name]}>${name === 'code' || name === 'texttt' ? codeText(a) : inline(a, keep, labels)}</${ONE_ARG[name]}>`; continue; }
      if (name === 'opts') { const o = [arg(), arg(), arg(), arg()]; out += `<span class="opts">${o.map((x, k) => `<span>(${'abcd'[k]}) ${inline(x || '', keep, labels)}</span>`).join('')}</span>`; continue; }
      if (name === 'underline') { const a = arg(); out += a && plain(a).trim() ? `<u>${inline(a, keep, labels)}</u>` : '<span class="blank">______</span>'; continue; }
      if (name === 'paragraph') { const a = arg(); out += `<strong class="runin">${inline(a, keep, labels)}</strong> `; continue; }
      if (name === 'ref' || name === 'eqref' || name === 'autoref' || name === 'pageref') { const a = arg(); const L = labels[a]; out += L ? L.text.replace(/^(Chapter|Figure|Section|Table) /, '') : '?'; continue; }
      if (name === 'url') { const a = arg(); out += `<a href="${esc(a)}" target="_blank" rel="noopener">${esc(a)}</a>`; continue; }
      if (name === 'href') { const u = arg(), t = arg(); out += `<a href="${esc(u)}" target="_blank" rel="noopener">${inline(t, keep, labels)}</a>`; continue; }
      if (name === 'footnote') { const a = arg(); out += ` <span class="fn">(${inline(a, keep, labels)})</span>`; continue; }
      if (name === 'textcolor' || name === 'color') { arg(); continue; }
      if (DROP_ARG.includes(name)) { arg(); continue; }
      if (PLAIN_ARG.includes(name)) { const a = arg(); if (a != null) out += inline(a, keep, labels); continue; }
      const SYM = {textdegree:'°', times:'×', ldots:'…', dots:'…', cdots:'⋯', LaTeX:'LaTeX', TeX:'TeX', approx:'≈', le:'≤', ge:'≥', leq:'≤', geq:'≥', to:'→', rightarrow:'→', Rightarrow:'⇒', leftarrow:'←', pm:'±', mu:'µ', Omega:'Ω', ohm:'Ω', degree:'°', textendash:'–', textemdash:'—', quad:' ', qquad:'  ', newline:'<br>', linebreak:'<br>', textbackslash:'\\', S:'§', checkmark:'✓', textbar:'|', textless:'&lt;', textgreater:'&gt;', copyright:'©', alpha:'α', beta:'β', Delta:'Δ', delta:'δ', tau:'τ', theta:'θ', lambda:'λ', infty:'∞', neq:'≠', oplus:'⊕', cdot:'·'};
      if (SYM[name] !== undefined) { out += SYM[name]; if (s[i] === '{' && s[i + 1] === '}') i += 2; continue; }
      continue;   // layout commands (\centering, \small, \noindent, ...) and anything unknown
    }
    if (c === '{' || c === '}') { i++; continue; }
    if (c === '~') { out += '&nbsp;'; i++; continue; }
    if (s.startsWith('---', i)) { out += '—'; i += 3; continue; }
    if (s.startsWith('--', i)) { out += '–'; i += 2; continue; }
    if (s.startsWith('``', i)) { out += '“'; i += 2; continue; }
    if (s.startsWith("''", i)) { out += '”'; i += 2; continue; }
    if (c === '\u0000') { const e = s.indexOf('\u0000', i + 1); out += keep[+s.slice(i + 1, e)].html; i = e + 1; continue; }
    if (c === '\u0002') { out += '&amp;'; i++; continue; }
    out += c; i++;
  }
  return out.replace(/[ \t]*\n[ \t]*/g, ' ').replace(/ {2,}/g, ' ');
}
const codeText = a => a.replace(/\\ /g, ' ').replace(/\\\u0002/g, '\u0002').replace(/\\\^(?!\{)/g, '^').replace(/\\([_#%&${}])/g, '$1').replace(/\\textbackslash(\{\})?/g, '\\').replace(/\\textasciitilde(\{\})?|\\~\{\}/g, '~').replace(/\\textasciicircum(\{\})?|\\\^\{\}/g, '^').replace(/\u0002/g, '&amp;');
const plain = s => String(s || '').replace(/\u0000\d+\u0000/g, '').replace(/\\[a-zA-Z]+\*?/g, '').replace(/[{}$~]/g, ' ').replace(/\\(.)/g, '$1').replace(/\s+/g, ' ').trim();

function convertBook(){
  const files = chapterFiles();
  const labels = collectLabels(files);
  const figMeta = fs.existsSync(FIGS) ? JSON.parse(fs.readFileSync(FIGS, 'utf8')) : {};
  return files.map(f => convertChapter(f, labels, figMeta)).concat(EXTRA.filter(e => fs.existsSync(path.join(e.dir, e.file))).map(e => convertChapter(e.file, labels, figMeta, e)));
}

module.exports = {convertBook};
if (require.main === module) {
  const b = convertBook();
  b.forEach(c => console.log(c.n, c.title, '·', c.sections.length, 'sections ·', Math.round(c.sections.reduce((n, s) => n + s.html.length, 0) / 1024), 'KB'));
  console.log('total', Math.round(JSON.stringify(b).length / 1024), 'KB');
}
