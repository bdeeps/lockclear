// Chapter 3: how many different keys? Each chamber can take any of D depths, so on paper there are
// D^pins keys. Some are not usable: two neighbouring cuts cannot differ by too much, or the slope
// between them would eat into the next cut's flat (the "maximum adjacent cut specification", MACS).
// Real figures for comparison: a common 5-pin, 6-depth house key has MACS 4 with 0.584 mm steps;
// a 10-depth keyway uses 0.381 mm steps (data in js/lock.js).
// Master keying: an extra thin pin (a master wafer) in a chamber gives that chamber two places
// where the stack can break, so two different cuts both work there.
import { THREE, clamp, approach } from '../kit.js';
import { makeCylinder, MM, PLUG_R, stepFor, macsFor, countKeys, randomCode, fmtInt, fitNarrow, board, panel } from '../lock.js';

const model = (s) => {
  const pins = clamp(Math.round(s.pins), 4, 7), D = clamp(Math.round(s.depths), 4, 10);
  const step = stepFor(D), macs = Math.min(D - 1, macsFor(step));
  const code = randomCode(pins, D, macs, 1000 + s.seed * 97 + pins * 31 + D * 7);
  // The master key differs from the flat's own key in two chambers.
  const at = [1, pins - 2], mcode = [...code];
  if (s.master) at.forEach((i) => { for (const d of [2, -2, 1, -1]) { const v = code[i] + d; if (v >= 1 && v <= D && Math.abs(v - code[i - 1]) <= macs && Math.abs(v - code[i + 1]) <= macs) { mcode[i] = v; break; } } });
  const bottom = code.map((d, i) => Math.min(d, mcode[i]));
  const masters = code.map((d, i) => Math.abs(d - mcode[i]) * step);
  let other = code, k = 0;
  do { other = randomCode(pins, D, macs, 5000 + s.seed * 13 + pins + D + k++); } while (other.every((d, i) => d === code[i] || d === mcode[i]));
  const wafers = masters.filter((t) => t > 0).length;
  return { pins, D, step, macs, code, mcode, bottom, masters, other, wafers, ...countKeys(pins, D, macs) };
};

export default {
  id: 'combos',
  short: 'How many keys?',
  title: 'How many different keys?',
  subtitle: 'More pins and more depths multiply the count. Tiny steps need careful machining.',
  view: { pos: [1.2, 6.2, 16.0], target: [0.8, 5.6, 0] },
  learn: `<p>Why can't your neighbour's key open your door? Because there are a lot of possible keys. If each of 5 cuts can be any of 6 depths, there are 6 × 6 × 6 × 6 × 6 = <b>7,776</b> different bittings. Add a sixth pin and it jumps to 46,656. Use 10 depths and 6 pins and you have a <b>million</b>.</p>
    <p>Not every one is usable. Two neighbouring cuts cannot differ too much, or the slope between them would slice into the next cut. Makers also drop keys that are too simple. So the real number is a bit lower than the sum says.</p>
    <p>More depths means <b>smaller steps</b>, and that is the hard part. No lock is made perfectly. Every hole and pin is off by a few hundredths of a millimetre. Those small errors, called <b>tolerances</b>, are what lock picking takes advantage of. So better locks are machined more tightly, use more pins, and add specially shaped <b>security pins</b> that catch at the shear line if the plug is turned without the right key.</p>
    <p>A <b>master-keyed</b> lock, as in a hostel or an office, adds a thin extra pin to some stacks. Those stacks now have two breaks, so two different cuts both line up: the room's own key and the warden's master key. It is handy, but every extra pin also means more keys that fit.</p>
    <p class="tip"><b>Try it:</b> go from 5 pins to 6 and watch the bars. Then switch on master keying and try all three keys.</p>`,
  terms: [
    { t: 'Combination (differ)', d: 'One possible key code. Locksmiths call the number of different codes the number of differs.' },
    { t: 'Tolerance', d: 'How far a made part is allowed to be from its drawn size. Tighter tolerances make a lock harder to fool.' },
    { t: 'Security pin', d: 'A driver pin with a shaped waist or grooves that catches at the shear line unless the right key is used.' },
    { t: 'Master key', d: 'One key that opens many locks, each of which also has its own key.' },
    { t: 'Master wafer', d: 'A thin extra pin in a stack. It gives the stack a second break, so a second cut depth works.' },
  ],
  defaults: { pins: 5, depths: 6, seed: 1, master: false, who: 'own', turn: 0 },
  onChange(s, key) { if (!s.master && s.who === 'master') s.who = 'own'; if (key && key !== 'turn') s.turn = key === 'action' ? 0 : s.turn; },
  controls: [
    { key: 'pins', type: 'seg', label: 'Pins', options: [4, 5, 6, 7].map((v) => ({ v, label: String(v) })) },
    { key: 'depths', type: 'range', label: 'Depths for each cut', min: 4, max: 10, step: 1, fmt: (v) => `${v} depths, ${stepFor(v).toFixed(2)} mm apart` },
    { key: 'repin', type: 'buttons', label: 'This lock', items: [{ label: 'Re-pin it with a new code', act: (s) => { s.seed += 1; } }] },
    { key: 'master', type: 'toggle', label: 'Master keyed', hint: 'Adds a thin green pin to two of the stacks.' },
    { key: 'who', type: 'seg', label: 'Which key', options: [{ v: 'own', label: 'Its own' }, { v: 'master', label: 'Master' }, { v: 'other', label: 'A stranger\'s' }] },
    { key: 'turn', type: 'range', label: 'Turn the key', min: 0, max: 1, step: 0.01, ends: ['0°', '90°'], fmt: (v) => Math.round(v * 90) + '°' },
  ],
  quiz: [
    { q: 'A lock has 5 pins and each cut can be one of 6 depths. How many bittings are there on paper?', options: ['30', '56', '7,776', '46,656'], answer: 2, why: '6 choices, five times over: 6 × 6 × 6 × 6 × 6 = 7,776.' },
    { q: 'Why do tolerances matter in a lock?', options: ['Loose parts make the lock easier to fool, so good locks are machined tightly', 'They change the colour of the key', 'They make the key heavier', 'They do not matter at all'], answer: 0, why: 'Small errors in the holes and pins are what picking takes advantage of. Tighter machining leaves less to exploit.' },
    { q: 'What does a master wafer do to a pin stack?', options: ['Makes it rust-proof', 'Gives it a second break, so a second cut depth also works', 'Stops every key', 'Replaces the spring'], answer: 1, why: 'With two breaks in the stack, both the room key and the master key can bring one of them to the shear line.' },
  ],
  reel: [
    { ms: 5800, caption: 'Six depths on five pins is 7,776 keys. Six pins and ten depths make a million.', set: { pins: 6, master: false, who: 'own', seed: 1, turn: 0 }, anim: { depths: [4, 10] }, spin: 0 },
    { ms: 5400, caption: 'A master-keyed lock has an extra thin pin in some stacks, so two different keys line up.', set: { pins: 5, depths: 6, master: true, who: 'master', seed: 1 }, anim: { turn: [0, 1] }, view: { pos: [-0.9, 4.9, 9.0], target: [-1.2, 4.2, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const holder = new THREE.Group(); holder.scale.setScalar(0.82); holder.position.set(-1.6, 0.7, 0); stage.root.add(holder);
    let c = null, m = null, sig = '', ins = 0, keySig = '';
    const minor = [];
    const chart = board(5.6, 4.2, 640, 480, (g, w, h, mm) => {
      panel(g, w, h);
      g.fillStyle = '#fff'; g.font = '600 34px sans-serif'; g.fillText(`Different keys, ${mm.D} depths`, 28, 50);
      g.font = '24px sans-serif'; g.fillStyle = 'rgba(255,255,255,.7)'; g.fillText('pale: on paper · bright: usable', 28, 84);
      const x0 = 140, y0 = h - 62, ch = h - 190, cw = w - 164, lo = 2, hi = 7;
      g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 2; g.font = '24px sans-serif';
      for (let e = lo; e <= hi; e++) { const y = y0 - (ch * (e - lo)) / (hi - lo); g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + cw, y); g.stroke(); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText(['', '', '100', '1,000', '10,000', '100,000', '1 million', '10 million'][e], 6, y + 6); }
      [4, 5, 6, 7].forEach((p, i) => {
        const k = countKeys(p, mm.D, mm.macs), bw = cw / 4, x = x0 + bw * i + 14;
        const yv = (v) => y0 - ch * clamp((Math.log10(v) - lo) / (hi - lo), 0, 1);
        g.fillStyle = p === mm.pins ? 'rgba(255,181,71,.35)' : 'rgba(142,240,255,.22)'; g.fillRect(x, yv(k.theory), bw - 28, y0 - yv(k.theory));
        g.fillStyle = p === mm.pins ? '#ffb547' : '#8ef0ff'; g.fillRect(x + 12, yv(k.usable), bw - 52, y0 - yv(k.usable));
        g.fillStyle = p === mm.pins ? '#ffb547' : 'rgba(255,255,255,.8)'; g.font = '600 26px sans-serif'; g.fillText(`${p} pins`, x + 8, y0 + 36);
      });
    });
    stage.root.add(chart);
    const lShear = stage.label('Shear line', [0, 0, 0], holder, 'hot');
    const lWafer = stage.label('Master wafer', [0, 0, 0], holder);
    const rebuild = (s) => {
      if (c) { holder.remove(c.group); c.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material?.dispose) o.material.dispose(); }); }
      m = model(s);
      c = makeCylinder({ pins: m.pins, code: m.bottom, step: m.step, masters: s.master ? m.masters : null });
      c.group.scale.setScalar(MM); c.group.position.set(0.6 - c.L * MM / 2, 4.1, 0); c.camG.visible = false;
      holder.add(c.group);
      lShear.position.set(0.6 + c.L * MM / 2 + 1.1, 4.1 + PLUG_R * MM, 0.4);
      const wi = m.masters.findIndex((t) => t > 0);
      lWafer.position.set(c.group.position.x + (wi >= 0 ? c.xs[wi] : 0) * MM, 4.1 - 10.5 * MM, 0.5);
      keySig = '';
    };
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        const k = [Math.round(s.pins), Math.round(s.depths), s.seed, s.master].join('|');
        if (k !== sig) { sig = k; rebuild(s); ins = 0; }
        const cuts = s.who === 'master' ? m.mcode : s.who === 'other' ? m.other : m.code;
        const ks = s.who + k;
        if (ks !== keySig) { keySig = ks; c.setKey(cuts); ins = Math.min(ins, 0.25); }
        ins = approach(ins, 1, 3, dt); if (ins > 0.997) ins = 1;
        c.update(dt, { ins, turn: s.turn, cut: true });
        chart.redraw(`${m.pins}|${m.D}`, m);
        const narrow = fitNarrow(stage, minor);
        const tall = document.body.classList.contains('gb-reel') && stage.camera.aspect < 1;
        // In the tall video frame the chart sits above the lock; otherwise beside it.
        if (tall) { chart.position.set(-2.6, 11.2, 0); chart.rotation.y = 0; chart.scale.setScalar(1.45); } else if (narrow) { chart.position.set(4.7, 3.4, 0.6); chart.rotation.y = 0; chart.scale.setScalar(0.92); } else { chart.position.set(5.5, 4.6, 0); chart.rotation.y = -0.2; chart.scale.setScalar(1); }
        lWafer.visible = !!s.master && !narrow;
      },
      readout: (s) => {
        const mm = model(s);
        const cuts = s.who === 'master' ? mm.mcode : s.who === 'other' ? mm.other : mm.code;
        const opens = s.who !== 'other';
        return `<div class="big">${fmtInt(mm.usable)} usable keys</div>
          <div class="row"><span>On paper: ${mm.D}<sup>${mm.pins}</sup></span><b>${fmtInt(mm.theory)}</b></div>
          <div class="row"><span>Step between depths</span><b>${mm.step.toFixed(2)} mm</b></div>
          <div class="row"><span>Biggest jump between neighbours</span><b>${mm.macs} steps</b></div>
          <div class="row"><span>This key: ${cuts.join('-')}</span><b class="${opens ? 'ok' : 'no'}">${opens ? 'opens' : 'blocked'}</b></div>
          ${s.master ? `<div class="row"><span>Keys that open this lock</span><b>${2 ** mm.wafers} (2 × 2)</b></div>` : ''}
          <small>${s.master ? 'Each master wafer doubles the number of keys that fit this one lock.' : 'Usable keys leave out bittings whose neighbouring cuts differ by more than the slope allows.'}</small>`;
      },
    };
  },
};
