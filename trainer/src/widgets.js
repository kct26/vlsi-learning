// Interactive widgets used inside lesson cards.
function esc(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function fx(n, d){ return Number(n).toFixed(d); }
function statsHTML(rows){ return '<div class="wstats">' + rows.map(r => `<div class="wstat${r[2] ? ' ' + r[2] : ''}"><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('') + '</div>'; }
function noteHTML(t){ return `<p class="wnote">${t}</p>`; }
function barHTML(frac, cls, label){ const p = Math.max(0, Math.min(1, frac)) * 100; return `<div class="wbar${cls ? ' ' + cls : ''}" role="img" aria-label="${esc(label || '')}"><i style="width:${p.toFixed(1)}%"></i></div>`; }

function ctlHTML(key, d){
  const id = 'w-' + key + '-' + d.k;
  if (d.type === 'select') return `<label class="wrow" for="${id}"><span class="wl">${esc(d.label)}</span><select id="${id}">${d.options.map(o => `<option value="${esc(o[0])}"${String(o[0]) === String(d.v) ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select></label>`;
  if (d.type === 'text') return `<label class="wrow" for="${id}"><span class="wl">${esc(d.label)}</span><input id="${id}" type="text" value="${esc(d.v)}" spellcheck="false" autocomplete="off"></label>`;
  if (d.type === 'check') return `<label class="wrow wcheck" for="${id}"><input id="${id}" type="checkbox"${d.v ? ' checked' : ''}><span>${esc(d.label)}</span></label>`;
  return `<label class="wrow" for="${id}"><span class="wl">${esc(d.label)}</span><input id="${id}" type="range" min="${d.min}" max="${d.max}" step="${d.step}" value="${d.v}"><output id="wv-${key}-${d.k}" class="wv">${esc(d.fmt ? d.fmt(d.v) : d.v)}</output></label>`;
}

// Builds a control panel and re-runs compute(values) on every change.
function mountControls(el, key, defs, compute){
  el.innerHTML = `<div class="wctl">${defs.map(d => ctlHTML(key, d)).join('')}</div><div class="wout" aria-live="polite"></div>`;
  const out = el.querySelector('.wout');
  const update = () => {
    const v = {};
    defs.forEach(d => {
      const inp = el.querySelector('#w-' + key + '-' + d.k);
      if (d.type === 'check') v[d.k] = inp.checked;
      else if (d.type === 'select' || d.type === 'text') v[d.k] = inp.value;
      else v[d.k] = parseFloat(inp.value);
      const lab = el.querySelector('#wv-' + key + '-' + d.k);
      if (lab) lab.textContent = d.fmt ? d.fmt(v[d.k]) : v[d.k];
    });
    out.innerHTML = compute(v);
  };
  el.addEventListener('input', update);
  el.addEventListener('change', update);
  update();
}

function fmtAmp(i){ if (i < 1e-3) return fx(i * 1e6, 0) + ' µA'; if (i < 1) return fx(i * 1e3, 2) + ' mA'; return fx(i, 2) + ' A'; }
function fmtWatt(p){ if (p < 1) return fx(p * 1e3, 1) + ' mW'; return fx(p, 2) + ' W'; }

const WIDGETS = {
  ohm(el){
    mountControls(el, 'ohm', [
      {k:'V', label:'Voltage', min:0.5, max:12, step:0.1, v:5, fmt:v => fx(v,1) + ' V'},
      {k:'R', label:'Resistance', min:100, max:5000, step:100, v:1000, fmt:v => v + ' Ω'}
    ], v => {
      const I = v.V / v.R;
      return statsHTML([['Current', fmtAmp(I)], ['Power', fmtWatt(v.V * I)]]) +
        noteHTML(`I = V / R = ${fx(v.V,1)} V ÷ ${v.R} Ω. Double the resistance and the current halves; double the voltage and the power quadruples.`);
    });
  },
  divider(el){
    mountControls(el, 'div', [
      {k:'Vin', label:'Vin', min:1, max:12, step:0.1, v:3.3, fmt:v => fx(v,1) + ' V'},
      {k:'R1', label:'R1 (top)', min:1, max:100, step:1, v:10, fmt:v => v + ' kΩ'},
      {k:'R2', label:'R2 (bottom)', min:1, max:100, step:1, v:20, fmt:v => v + ' kΩ'}
    ], v => {
      const out = v.Vin * v.R2 / (v.R1 + v.R2);
      return statsHTML([['Vout', fx(out,2) + ' V', 'accent'], ['Current', fx(v.Vin / (v.R1 + v.R2), 3) + ' mA']]) +
        barHTML(out / v.Vin, '', 'Vout as a fraction of Vin') +
        noteHTML(`Vout = ${fx(v.Vin,1)} × ${v.R2} / (${v.R1} + ${v.R2}). The stronger pull (smaller resistor) wins the tug-of-war.`);
    });
  },
  rc(el){
    mountControls(el, 'rc', [
      {k:'R', label:'R', min:0.5, max:10, step:0.5, v:2, fmt:v => fx(v,1) + ' kΩ'},
      {k:'C', label:'C', min:5, max:100, step:5, v:50, fmt:v => v + ' fF'}
    ], v => {
      const tau = v.R * v.C; // kΩ × fF = ps
      const X = t => 34 + 276 * (t / 600), Y = f => 112 - 96 * f;
      let d = '';
      for (let t = 0; t <= 600; t += 6) d += (t ? ' L' : 'M') + fx(X(t),1) + ' ' + fx(Y(1 - Math.exp(-t / tau)),1);
      const marks = [];
      if (0.69 * tau <= 600) marks.push(`<line class="mark" x1="${fx(X(0.69*tau),1)}" y1="16" x2="${fx(X(0.69*tau),1)}" y2="112"/><text class="mlab" x="${fx(X(0.69*tau)+3,1)}" y="26">50%</text>`);
      if (tau <= 600) marks.push(`<line class="mark2" x1="${fx(X(tau),1)}" y1="16" x2="${fx(X(tau),1)}" y2="112"/><text class="mlab" x="${fx(X(tau)+3,1)}" y="40">63%</text>`);
      const ticks = [0,200,400,600].map(t => `<text class="tick" x="${fx(X(t),1)}" y="128" text-anchor="middle">${t} ps</text>`).join('');
      const svg = `<svg class="wsvg" viewBox="0 0 320 136" role="img" aria-label="RC charging curve"><line class="ax" x1="34" y1="112" x2="310" y2="112"/><line class="ax" x1="34" y1="16" x2="34" y2="112"/><text class="tick" x="30" y="20" text-anchor="end">VDD</text><text class="tick" x="30" y="115" text-anchor="end">0</text><path class="curve" d="${d}"/>${marks.join('')}${ticks}</svg>`;
      return statsHTML([['Time constant τ = RC', fx(tau,1) + ' ps'], ['50% point (0.69RC)', fx(0.69*tau,1) + ' ps', 'accent'], ['Essentially done (5RC)', fx(5*tau,0) + ' ps']]) + svg;
    });
  },
  thermal(el){
    mountControls(el, 'th', [
      {k:'P', label:'Chip power', min:50, max:700, step:10, v:300, fmt:v => v + ' W'},
      {k:'Ta', label:'Air temperature', min:20, max:45, step:1, v:35, fmt:v => v + ' °C'},
      {k:'jc', label:'θ junction→case', min:0.02, max:0.2, step:0.01, v:0.05, fmt:v => fx(v,2) + ' °C/W'},
      {k:'cs', label:'θ case→sink (paste)', min:0.01, max:0.1, step:0.01, v:0.03, fmt:v => fx(v,2) + ' °C/W'},
      {k:'sa', label:'θ sink→air (heat sink)', min:0.04, max:0.4, step:0.01, v:0.1, fmt:v => fx(v,2) + ' °C/W'}
    ], v => {
      const th = v.jc + v.cs + v.sa, tj = v.Ta + v.P * th;
      const cls = tj <= 95 ? 'ok' : (tj <= 105 ? 'warn' : 'bad');
      const verdict = tj <= 95 ? 'Within a typical limit.' : (tj <= 105 ? 'Near the limit: little margin left.' : 'Too hot: the chip would throttle.');
      return statsHTML([['Total θ', fx(th,2) + ' °C/W'], ['Temperature rise', fx(v.P*th,1) + ' °C'], ['Junction temperature', fx(tj,1) + ' °C', cls]]) +
        barHTML(tj / 150, cls, 'Junction temperature on a 0 to 150 °C scale') + noteHTML(`Tj = ${v.Ta} + ${v.P} × ${fx(th,2)}. ${verdict}`);
    });
  },
  pass(el){
    mountControls(el, 'pass', [
      {k:'type', label:'Transistor', type:'select', v:'n', options:[['n','NMOS'],['p','PMOS']]},
      {k:'VDD', label:'VDD', min:0.8, max:1.2, step:0.05, v:1.0, fmt:v => fx(v,2) + ' V'},
      {k:'Vt', label:'|Vt|', min:0.2, max:0.5, step:0.05, v:0.3, fmt:v => fx(v,2) + ' V'},
      {k:'VG', label:'Gate voltage', min:0, max:1.2, step:0.05, v:1.0, fmt:v => fx(v,2) + ' V'},
      {k:'Vin', label:'Input voltage', min:0, max:1.2, step:0.05, v:1.0, fmt:v => fx(v,2) + ' V'}
    ], v => {
      const vin = Math.min(v.Vin, v.VDD);
      if (v.type === 'n') {
        const lim = v.VG - v.Vt;
        if (lim <= 0.001) return statsHTML([['Output', 'floating', 'bad']]) + noteHTML(`The gate is not above the threshold (${fx(v.VG,2)} − ${fx(v.Vt,2)} ≤ 0), so the NMOS never turns on.`);
        const out = Math.min(vin, lim), strong = vin <= lim + 1e-9;
        return statsHTML([['Output', fx(out,2) + ' V', strong ? 'ok' : 'warn'], ['Level', strong ? 'strong' : 'weak']]) + barHTML(out / v.VDD, strong ? 'ok' : 'warn', 'Output as a fraction of VDD') +
          noteHTML(strong ? `The NMOS passes ${fx(vin,2)} V fully: its source stays at the input, so it stays on.` : `The output becomes the source. It stops at VG − Vt = ${fx(lim,2)} V, one threshold short: a weak level.`);
      }
      const lim = v.VG + v.Vt;
      if (lim >= v.VDD - 0.001) return statsHTML([['Output', 'floating', 'bad']]) + noteHTML(`The gate is too high (${fx(v.VG,2)} + ${fx(v.Vt,2)} ≥ VDD), so the PMOS never turns on. Pull the gate down toward 0 V.`);
      const out = Math.max(vin, lim), strong = vin >= lim - 1e-9;
      return statsHTML([['Output', fx(out,2) + ' V', strong ? 'ok' : 'warn'], ['Level', strong ? 'strong' : 'weak']]) + barHTML(out / v.VDD, strong ? 'ok' : 'warn', 'Output as a fraction of VDD') +
        noteHTML(strong ? `The PMOS passes ${fx(vin,2)} V fully.` : `Pulling down, the output becomes the PMOS source. It stops at VG + |Vt| = ${fx(lim,2)} V: a weak 0.`);
    });
  },
  bits(el){
    mountControls(el, 'bits', [
      {k:'n', label:'Number (decimal, 0x hex or 0b binary)', type:'text', v:'-20'},
      {k:'w', label:'Width', type:'select', v:'8', options:[['4','4 bits'],['8','8 bits'],['16','16 bits']]}
    ], v => {
      const s = v.n.trim(), W = parseInt(v.w, 10), mod = Math.pow(2, W);
      let n = NaN;
      if (/^-?0x[0-9a-f]+$/i.test(s)) n = (s[0] === '-' ? -1 : 1) * parseInt(s.replace(/^-?0x/i, ''), 16);
      else if (/^0b[01]+$/i.test(s)) n = parseInt(s.slice(2), 2);
      else if (/^-?\d+$/.test(s)) n = parseInt(s, 10);
      if (!isFinite(n)) return noteHTML('Type a whole number such as 45, -20, 0xB7 or 0b1011.');
      const u = ((n % mod) + mod) % mod, signed = u >= mod / 2 ? u - mod : u;
      const bin = u.toString(2).padStart(W, '0').replace(/(.{4})(?=.)/g, '$1 ');
      const wrapped = n < -mod / 2 || n >= mod;
      return statsHTML([['Binary', bin, 'mono'], ['Hex', '0x' + u.toString(16).toUpperCase().padStart(W / 4, '0'), 'mono'], ['As unsigned', String(u)], ['As signed (two\'s complement)', String(signed)]]) +
        noteHTML((wrapped ? `${s} doesn't fit in ${W} bits, so it wraps. ` : '') + `The leftmost bit has weight −${mod / 2} when signed. To negate, invert every bit and add 1.`);
    });
  },
  inverter(el, variant){
    mountControls(el, 'inv', [
      {k:'mode', label:'Circuit', type:'select', v:variant === 'swapped' ? 'swapped' : 'normal', options:[['normal','Normal: PMOS up, NMOS down'],['swapped','Swapped: NMOS up, PMOS down']]},
      {k:'in', label:'Input', type:'select', v:'1', options:[['1','1 (VDD)'],['0','0 (ground)']]},
      {k:'VDD', label:'VDD', min:0.8, max:1.2, step:0.05, v:1.0, fmt:v => fx(v,2) + ' V'},
      {k:'Vtn', label:'Vtn', min:0.2, max:0.5, step:0.05, v:0.3, fmt:v => fx(v,2) + ' V'},
      {k:'Vtp', label:'|Vtp|', min:0.2, max:0.5, step:0.05, v:0.3, fmt:v => fx(v,2) + ' V'}
    ], v => {
      const one = v.in === '1', sw = v.mode === 'swapped';
      const top = sw ? 'NMOS' : 'PMOS', bot = sw ? 'PMOS' : 'NMOS';
      const topOn = sw ? one : !one, botOn = !topOn;
      const out = sw ? (one ? v.VDD - v.Vtn : v.Vtp) : (one ? 0 : v.VDD);
      const weak = sw;
      const box = (name, on) => `<div class="dev ${on ? 'on' : 'off'}"><b>${name}</b><span>${on ? 'ON' : 'OFF'}</span></div>`;
      const diagram = `<div class="invdiag"><div class="rail">VDD = ${fx(v.VDD,2)} V</div>${box(top, topOn)}<div class="node">Out = <b>${fx(out,2)} V</b></div>${box(bot, botOn)}<div class="rail">Ground</div></div>`;
      const verdict = !sw ? `Inverts with full swing: input ${one ? 1 : 0} gives ${fx(out,2)} V.` :
        `Does not invert: input ${one ? 1 : 0} gives ${fx(out,2)} V. ${one ? 'The NMOS passes a weak 1 (VDD − Vtn).' : 'The PMOS passes a weak 0 (|Vtp|).'} It acts as a weak, non-inverting buffer.`;
      return `<div class="invwrap">${diagram}<div>${statsHTML([['Output level', weak ? 'weak' : 'strong', weak ? 'warn' : 'ok']])}${barHTML(out / v.VDD, weak ? 'warn' : 'ok', 'Output as a fraction of VDD')}${noteHTML(verdict)}</div></div>`;
    });
  },
  mux(el, variant, ctx){
    const NAMES = {OR:'OR (A + B)', AND:'AND (A·B)', NOTA:'NOT A', NAND:'NAND', NOR:'NOR', XOR:'XOR (A ⊕ B)'};
    const F = {OR:(a,b)=>a|b, AND:(a,b)=>a&b, NOTA:(a)=>1-a, NAND:(a,b)=>1-(a&b), NOR:(a,b)=>1-(a|b), XOR:(a,b)=>a^b};
    const SRC = [['0','0'],['1','1'],['A','A'],['B','B'],['nA','A′ (NOT A)'],['nB','B′ (NOT B)']];
    const val = (s, a, b) => ({'0':0, '1':1, A:a, B:b, nA:1-a, nB:1-b})[s];
    mountControls(el, 'mux', [
      {k:'t', label:'Target gate', type:'select', v:'OR', options:Object.keys(NAMES).map(k => [k, NAMES[k]])},
      {k:'s', label:'Select S', type:'select', v:'A', options:[['A','A'],['B','B']]},
      {k:'i0', label:'I0 (chosen when S = 0)', type:'select', v:'0', options:SRC},
      {k:'i1', label:'I1 (chosen when S = 1)', type:'select', v:'0', options:SRC}
    ], v => {
      let all = true;
      const rows = [[0,0],[0,1],[1,0],[1,1]].map(([a,b]) => {
        const sel = v.s === 'A' ? a : b, y = sel ? val(v.i1, a, b) : val(v.i0, a, b), want = F[v.t](a, b), ok = y === want;
        if (!ok) all = false;
        return `<tr><td>${a}</td><td>${b}</td><td>${want}</td><td>${y}</td><td class="${ok ? 'tok' : 'tbad'}">${ok ? 'match' : 'wrong'}</td></tr>`;
      }).join('');
      const extra = (v.i0[0] === 'n' || v.i1[0] === 'n') ? 1 : 0;
      if (all && ctx && ctx.onSolve) ctx.onSolve(v.t);
      const solved = ctx && ctx.solved ? ctx.solved() : {};
      const chips = Object.keys(NAMES).map(k => `<span class="chip${solved[k] ? ' done' : ''}">${solved[k] ? '✓ ' : ''}${esc(NAMES[k])}</span>`).join('');
      return `<div class="tblwrap"><table class="tt"><thead><tr><th>A</th><th>B</th><th>Target</th><th>Mux Y</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` +
        (all ? `<p class="wwin">Solved ${esc(NAMES[v.t])} with ${1 + extra} mux${extra ? 'es (one extra mux makes the inverted input)' : ''}.</p>` : noteHTML('Hint: put a variable on S. What must Y be when that variable is 0? That goes on I0. When it is 1? That goes on I1.')) +
        `<div class="chips">${chips}</div>`;
    });
  },
  latchff(el){
    const N = 16;
    const D = [0,0,0,1,0,0,0,0,1,1,1,1,0,0,0,0];
    const CLK = Array.from({length:N}, (_, t) => (t % 4) >= 2 ? 1 : 0);
    const draw = () => {
      const L = [], Fq = [];
      for (let t = 0; t < N; t++) {
        L[t] = CLK[t] ? D[t] : (t ? L[t-1] : 0);
        const rise = t > 0 && CLK[t] && !CLK[t-1];
        Fq[t] = rise ? D[t-1] : (t ? Fq[t-1] : 0);
      }
      const cells = (arr, cls) => arr.map(x => `<td class="${x ? 'hi' : 'lo'} ${cls}"></td>`).join('');
      const edges = CLK.map((c, t) => `<td class="edge">${t > 0 && c && !CLK[t-1] ? '▲' : ''}</td>`).join('');
      const dbtn = D.map((x, t) => `<td class="dcell"><button type="button" class="dbtn ${x ? 'hi' : 'lo'}" data-t="${t}" aria-label="D at step ${t + 1} is ${x}, click to flip">${x}</button></td>`).join('');
      el.innerHTML = `<div class="tblwrap"><table class="wave"><tbody>
        <tr><th></th>${edges}</tr>
        <tr><th>CLK</th>${cells(CLK, 'clk')}</tr>
        <tr><th>D <small>(click)</small></th>${dbtn}</tr>
        <tr><th>Latch Q</th>${cells(L, 'q1')}</tr>
        <tr><th>Flip-flop Q</th>${cells(Fq, 'q2')}</tr>
      </tbody></table></div>` +
      noteHTML('The latch copies D whenever CLK is high, so a short pulse during that time gets through. The flip-flop only samples D at each rising edge (▲) and ignores everything in between.');
    };
    el.addEventListener('click', e => { const b = e.target.closest('.dbtn'); if (!b) return; const t = +b.dataset.t; D[t] = 1 - D[t]; draw(); const nb = el.querySelector(`.dbtn[data-t="${t}"]`); if (nb) nb.focus(); });
    draw();
  },
  timing(el){
    mountControls(el, 'tim', [
      {k:'f', label:'Clock frequency', min:0.5, max:4, step:0.05, v:2.0, fmt:v => fx(v,2) + ' GHz'},
      {k:'tcq', label:'Clock-to-Q (tcq)', min:20, max:150, step:5, v:50, fmt:v => v + ' ps'},
      {k:'tpd', label:'Slowest logic (tpd)', min:50, max:1000, step:10, v:400, fmt:v => v + ' ps'},
      {k:'tsu', label:'Setup time (tsu)', min:10, max:100, step:5, v:30, fmt:v => v + ' ps'},
      {k:'tcd', label:'Fastest logic (tcd)', min:0, max:100, step:5, v:10, fmt:v => v + ' ps'},
      {k:'th', label:'Hold time (th)', min:0, max:100, step:5, v:20, fmt:v => v + ' ps'},
      {k:'sk', label:'Skew (capture late = +)', min:-100, max:100, step:10, v:0, fmt:v => v + ' ps'}
    ], v => {
      const T = 1000 / v.f, need = v.tcq + v.tpd + v.tsu - v.sk;
      const setup = T - need, hold = v.tcq + v.tcd - v.th - v.sk;
      return statsHTML([
        ['Clock period', fx(T,0) + ' ps'],
        ['Maximum frequency', need > 0 ? fx(1000 / need, 2) + ' GHz' : '—'],
        ['Setup slack', fx(setup,0) + ' ps ' + (setup >= 0 ? 'PASS' : 'FAIL'), setup >= 0 ? 'ok' : 'bad'],
        ['Hold slack', fx(hold,0) + ' ps ' + (hold >= 0 ? 'PASS' : 'FAIL'), hold >= 0 ? 'ok' : 'bad']
      ]) + noteHTML('Setup: tcq + tpd + tsu ≤ T + skew. Hold: tcq + tcd ≥ th + skew. Move the clock frequency: setup slack changes, hold slack never does.');
    });
  },
  power(el){
    mountControls(el, 'pow', [
      {k:'V', label:'Voltage factor', min:0.5, max:2, step:0.05, v:2, fmt:v => '×' + fx(v,2)},
      {k:'f', label:'Frequency factor', min:0.25, max:4, step:0.05, v:2, fmt:v => '×' + fx(v,2)},
      {k:'C', label:'Capacitance factor', min:0.5, max:2, step:0.1, v:1, fmt:v => '×' + fx(v,1)}
    ], v => {
      const p = v.C * v.V * v.V * v.f, e = v.C * v.V * v.V;
      return statsHTML([['Dynamic power', '×' + fx(p,3), 'accent'], ['Energy per operation', '×' + fx(e,3)]]) +
        noteHTML(`P ∝ C × V² × f = ${fx(v.C,1)} × ${fx(v.V,2)}² × ${fx(v.f,2)} = ${fx(p,3)}. Try V ×1.10 with f ×1.20 (≈ 1.45), or f ×4 with V ×1.5 (= 9). Energy per operation has no f in it.`);
    });
  },
  temp(el){
    mountControls(el, 'temp', [
      {k:'T', label:'Temperature', min:-40, max:125, step:5, v:25, fmt:v => v + ' °C'},
      {k:'V', label:'Supply voltage', min:0.5, max:1.2, step:0.05, v:1.0, fmt:v => fx(v,2) + ' V'}
    ], v => {
      const mob = Math.pow((v.T + 273.15) / 298.15, -1.5);
      const vt = 0.35 - 0.001 * (v.T - 25);
      const ov = Math.max(v.V - vt, 0.02), ov0 = Math.max(v.V - 0.35, 0.02);
      const drive = mob * Math.pow(ov / ov0, 1.3);
      const wire = 1 + 0.0039 * (v.T - 25);
      const verdict = Math.abs(drive - 1) < 0.005 ? 'Transistors run at about the same speed as at 25 °C.' :
        (drive > 1 ? (v.T > 25 ? 'At this low supply voltage, transistors are faster when hot: temperature inversion.' : 'Transistors are faster here than at 25 °C.') :
          (v.T > 25 ? 'Transistors are slower when hot: the mobility loss wins.' : 'At this low supply voltage, transistors are slower when cold: temperature inversion.'));
      return statsHTML([
        ['Carrier mobility', '×' + fx(mob,2), mob < 1 ? 'warn' : 'ok'],
        ['Threshold voltage', fx(vt,3) + ' V'],
        ['Wire resistance', '×' + fx(wire,2), wire > 1 ? 'warn' : 'ok'],
        ['Transistor drive current', '×' + fx(drive,2), drive >= 1 ? 'ok' : 'warn']
      ]) + noteHTML(verdict + ' Wires are always slower when hot. All values are relative to 25 °C, from a simplified illustrative model.');
    });
  },
  antenna(el){
    const LIMIT = 1000;
    mountControls(el, 'ant', [
      {k:'m', label:'Metal area on the wire', min:500, max:50000, step:500, v:10000, fmt:v => v + ' µm²'},
      {k:'g', label:'Gate area it connects to', min:0.1, max:5, step:0.1, v:0.5, fmt:v => fx(v,1) + ' µm²'},
      {k:'d', label:'Add an antenna diode next to the gate', type:'check', v:false}
    ], v => {
      const r = v.m / v.g, ok = v.d || r <= LIMIT;
      const msg = v.d ? 'The diode gives the plasma charge a path to the substrate, so the oxide is protected whatever the ratio.' :
        (ok ? 'The ratio is under the limit: the charge is spread over enough oxide.' : 'Too much charge per unit of gate oxide: the oxide could be damaged. A smaller gate makes this worse, not better.');
      return statsHTML([['Antenna ratio', fx(r,0), ok ? 'ok' : 'bad'], ['Illustrative limit', String(LIMIT)], ['Result', ok ? 'PASS' : 'VIOLATION', ok ? 'ok' : 'bad']]) +
        barHTML(Math.min(r / (2 * LIMIT), 1), ok ? 'ok' : 'bad', 'Antenna ratio against twice the limit') + noteHTML(msg + ` With a gate 4× larger the ratio would be ${fx(r / 4,0)}.`);
    });
  },
  cache(el){
    const sizes = [1,2,4,8,16,32,64,128,256,512,1024,2048,4096].map(k => [String(k), k >= 1024 ? (k / 1024) + ' MB' : k + ' KB']);
    mountControls(el, 'cache', [
      {k:'s', label:'Cache size', type:'select', v:'32', options:sizes},
      {k:'l', label:'Line size', type:'select', v:'64', options:[['16','16 B'],['32','32 B'],['64','64 B'],['128','128 B'],['256','256 B']]},
      {k:'w', label:'Associativity', type:'select', v:'1', options:[['1','Direct-mapped'],['2','2-way'],['4','4-way'],['8','8-way'],['16','16-way'],['full','Fully associative']]},
      {k:'a', label:'Address bits', type:'select', v:'32', options:[['32','32'],['48','48'],['64','64']]}
    ], v => {
      const lines = parseInt(v.s, 10) * 1024 / parseInt(v.l, 10), A = parseInt(v.a, 10);
      const ways = v.w === 'full' ? lines : parseInt(v.w, 10);
      if (ways > lines) return noteHTML('That associativity is larger than the number of lines.');
      const sets = lines / ways, off = Math.log2(parseInt(v.l, 10)), idx = Math.log2(sets), tag = A - idx - off;
      const seg = (n, cls, lab) => n > 0 ? `<div class="aseg ${cls}" style="flex:${n}"><b>${lab}</b><span>${n} bits</span></div>` : '';
      return `<div class="abar">${seg(tag, 's1', 'tag')}${seg(idx, 's2', 'index')}${seg(off, 's3', 'offset')}</div>` +
        statsHTML([['Lines', String(lines)], ['Sets', String(sets)], ['Tag array (tag + valid + dirty)', ((lines * (tag + 2)) / 8 / 1024).toFixed(1) + ' KB']]) +
        noteHTML(`Offset = log₂(line size) = ${off}. Index = log₂(sets) = ${idx}. Tag = ${A} − ${idx} − ${off} = ${tag}.`);
    });
  },
  flags(el){
    mountControls(el, 'flags', [
      {k:'a', label:'A (decimal, 8 bits)', type:'text', v:'100'},
      {k:'b', label:'B (decimal, 8 bits)', type:'text', v:'50'}
    ], v => {
      const pa = parseInt(v.a, 10), pb = parseInt(v.b, 10);
      if (!isFinite(pa) || !isFinite(pb) || pa < -128 || pa > 255 || pb < -128 || pb > 255) return noteHTML('Type whole numbers from −128 to 255.');
      const a = (pa + 256) % 256, b = (pb + 256) % 256, raw = a + b, r = raw & 255;
      const cin7 = (((a & 127) + (b & 127)) >> 7) & 1, cout = raw >> 8, V = cin7 ^ cout;
      const sg = x => x >= 128 ? x - 256 : x, su = sg(a) + sg(b);
      const bin = x => x.toString(2).padStart(8, '0').replace(/(.{4})/, '$1 ');
      const satU = Math.min(255, a + b), satS = Math.max(-128, Math.min(127, su));
      return statsHTML([['A + B (8-bit result)', bin(r), 'mono'], ['Carry C (unsigned overflow)', String(cout), cout ? 'warn' : 'ok'], ['Overflow V (signed overflow)', String(V), V ? 'warn' : 'ok'],
        ['As unsigned', `${a} + ${b} → ${r}${cout ? ' (wrapped)' : ''}`], ['As signed', `${sg(a)} + ${sg(b)} → ${sg(r)}${V ? ' (wrong sign)' : ''}`],
        ['Saturating (unsigned / signed)', `${satU} / ${satS}`, 'accent']]) +
        noteHTML(`V = carry into bit 7 (${cin7}) XOR carry out of bit 7 (${cout}). The same adder serves both readings; only the flag you check differs.`);
    });
  },
  booth(el){
    mountControls(el, 'booth', [
      {k:'m', label:'Multiplier (−128 to 127)', type:'text', v:'7'},
      {k:'x', label:'Multiplicand M', type:'text', v:'13'}
    ], v => {
      const m = parseInt(v.m, 10), x = parseInt(v.x, 10);
      if (!isFinite(m) || !isFinite(x) || m < -128 || m > 127 || Math.abs(x) > 100000) return noteHTML('Type a multiplier from −128 to 127 and a multiplicand.');
      const u = (m + 256) % 256, bit = i => i < 0 ? 0 : (u >> i) & 1;
      const digits = [0, 1, 2, 3].map(i => -2 * bit(2 * i + 1) + bit(2 * i) + bit(2 * i - 1));
      const pp = digits.map((d, i) => d * x * Math.pow(4, i));
      const ones = u.toString(2).split('').filter(c => c === '1').length;
      const nz = digits.filter(d => d !== 0).length;
      const rows = digits.map((d, i) => `<tr><td>${i}</td><td>${bit(2 * i + 1)}${bit(2 * i)}${bit(2 * i - 1)}</td><td>${d > 0 ? '+' : ''}${d}</td><td>${d ? (d > 0 ? '+' : '−') + Math.abs(d) + 'M × 4^' + i : '0'}</td><td>${pp[i]}</td></tr>`).join('');
      return `<div class="tblwrap"><table class="tt"><thead><tr><th>Group</th><th>Bits</th><th>Digit</th><th>Partial product</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table></div>` +
        statsHTML([['Multiplier bits', u.toString(2).padStart(8, '0').replace(/(.{4})/, '$1 '), 'mono'], ['Sum of partial products', String(pp.reduce((s, p) => s + p, 0)), 'accent'], ['Check: multiplier × M', String(m * x)],
          ['Nonzero partial products', `Booth ${nz} vs shift-and-add ${m < 0 ? '(signed: needs extra steps)' : ones}`]]) +
        noteHTML('Each group of three bits (overlapping by one) becomes a digit −2…+2, so 8 multiplier bits need only 4 partial products, each 0, ±M or ±2M.');
    });
  },
  fixq(el){
    mountControls(el, 'fixq', [
      {k:'r', label:'Real value', type:'text', v:'0.3'},
      {k:'f', label:'Format', type:'select', v:'s1.7', options:[['s1.7','Signed Q1.7 (8 bits)'],['u4.4','Unsigned Q4.4 (8 bits)'],['s4.12','Signed Q4.12 (16 bits)'],['s1.15','Signed Q1.15 (16 bits)']]},
      {k:'o', label:'If it does not fit', type:'select', v:'sat', options:[['sat','Saturate'],['wrap','Wrap around']]}
    ], v => {
      const r = parseFloat(v.r);
      if (!isFinite(r)) return noteHTML('Type a number such as 0.3, −0.75 or 2.718.');
      const signed = v.f[0] === 's', [mi, fr] = v.f.slice(1).split('.').map(Number), W = mi + fr;
      const lo = signed ? -Math.pow(2, W - 1) : 0, hi = signed ? Math.pow(2, W - 1) - 1 : Math.pow(2, W) - 1;
      let q = Math.round(r * Math.pow(2, fr)); const raw = q;
      let note = '';
      if (q > hi || q < lo) {
        if (v.o === 'sat') { q = q > hi ? hi : lo; note = 'Out of range: saturated to the nearest end. '; }
        else { const mod = Math.pow(2, W); q = ((q % mod) + mod) % mod; if (signed && q > hi) q -= mod; note = 'Out of range: wrapped around, giving a badly wrong value. '; }
      }
      const val = q / Math.pow(2, fr), bits = ((q + Math.pow(2, W)) % Math.pow(2, W)).toString(2).padStart(W, '0');
      return statsHTML([['Stored integer', String(q) + (raw !== q ? ` (wanted ${raw})` : '')], ['Bits', bits.slice(0, mi) + '.' + bits.slice(mi), 'mono'], ['Represented value', String(val), 'accent'],
        ['Error', fx(Math.abs(val - r), 6), Math.abs(val - r) > Math.pow(2, -fr) ? 'bad' : 'ok'], ['Resolution', '2^−' + fr + ' = ' + Math.pow(2, -fr)], ['Range', `${lo / Math.pow(2, fr)} to ${hi / Math.pow(2, fr)}`]]) +
        noteHTML(note + 'Value = stored integer ÷ 2^(fraction bits). Rounding to the nearest step keeps the error within half a step.');
    });
  },
  fp32(el){
    mountControls(el, 'fp', [
      {k:'h', label:'FP32 bits (8 hex digits)', type:'text', v:'40400000'}
    ], v => {
      const h = v.h.trim().replace(/^0x/i, '').replace(/[\s_]/g, '');
      if (!/^[0-9a-f]{1,8}$/i.test(h)) return noteHTML('Type up to 8 hex digits, for example 3F800000, C0000000 or 7F800000.');
      const u = parseInt(h.padStart(8, '0'), 16) >>> 0;
      const dv = new DataView(new ArrayBuffer(4)); dv.setUint32(0, u); const f = dv.getFloat32(0);
      dv.setUint32(0, (u & 0xFFFF0000) >>> 0); const bf = dv.getFloat32(0);
      const s = u >>> 31, e = (u >>> 23) & 0xFF, m = u & 0x7FFFFF;
      const bits = u.toString(2).padStart(32, '0');
      const what = e === 255 ? (m ? 'NaN (not a number)' : (s ? '−infinity' : '+infinity')) :
        (e === 0 ? (m ? `subnormal: 0.${m.toString(2).padStart(23,'0').replace(/0+$/,'')}₂ × 2^−126` : (s ? '−0' : '+0')) :
          `${s ? '−' : '+'}${fx(1 + m / 8388608, 6).replace(/0+$/,'').replace(/\.$/,'')} × 2^${e - 127}`);
      return `<div class="fpbits"><span class="fs">${bits[0]}</span><span class="fe">${bits.slice(1,9)}</span><span class="fm">${bits.slice(9)}</span></div>` +
        statsHTML([['Sign', s ? '1 (negative)' : '0 (positive)'], ['Exponent', `${e} − 127 = ${e - 127}`], ['Meaning', what], ['Value', String(f), 'accent'], ['As BF16 (top 16 bits)', String(bf)]]) +
        noteHTML('Sign (1 bit) · exponent (8 bits, bias 127) · fraction (23 bits). BF16 keeps the sign and the full 8-bit exponent, so it has the same range with less precision.');
    });
  }
};

function mountWidget(el, spec, ctx){
  const [name, variant] = String(spec).split(':');
  const fn = WIDGETS[name];
  if (fn) fn(el, variant, ctx);
}
