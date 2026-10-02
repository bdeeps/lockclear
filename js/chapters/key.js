// Chapter 2: the right key. Each cut in the key sets the height of one pin stack; the plug turns
// only if every stack has its break exactly at the shear line.
// Depths 1…6 are 0.584 mm (0.023 in) apart and each key pin is sized so that
// cut height + key pin length = plug diameter (see js/lock.js for the data).
import { clamp } from '../kit.js';
import { makeCylinder, MM, PLUG_R, STEP, fitNarrow, rng } from '../lock.js';
import { CODE } from './anatomy.js';

const KEYS = ['c1', 'c2', 'c3', 'c4', 'c5'];
const cutsOf = (s) => KEYS.map((k) => clamp(Math.round(s[k]), 1, 6));
const setCuts = (s, c) => KEYS.forEach((k, i) => { s[k] = c[i]; });
let seed = 7;

export default {
  id: 'key',
  short: 'The right key',
  title: 'What the right key does',
  subtitle: 'Every cut lifts one pin stack. Get all five exactly right and the plug is free.',
  view: { pos: [1.2, 5.4, 13.2], target: [0.2, 4.3, 0] },
  learn: `<p>A key is a row of <b>cuts</b>, each one a certain depth. Slide it in and every key pin rides up and down over the cuts, then settles in its own cut.</p>
    <p>A deep cut lets its pin sit low. A shallow cut holds it high. Each <b>key pin</b> is made just long enough that, on the right cut, its top lands exactly at the <b>shear line</b>. Then the break between key pin and driver pin lines up with the gap between plug and shell, in all five stacks at once. Nothing crosses the gap, so the plug turns and takes the key pins round with it.</p>
    <p>Change one cut by a single step, about <b>0.6 mm</b>, and that stack is off. If the cut is too deep, the blue driver pin drops into the plug. If it is too shallow, the orange key pin pokes up into the shell. Either way one pin sits across the gap and the plug is stuck.</p>
    <p>The list of depths, such as 3-5-2-6-4, is the key's <b>bitting</b>. It is a code, written in metal.</p>
    <p class="tip"><b>Try it:</b> cut the right key and turn it. Then change one cut by one step and try again. Look for the red pin.</p>`,
  terms: [
    { t: 'Cut', d: 'A notch in the key blade. Its depth sets how high one pin stack sits.' },
    { t: 'Bitting', d: 'The list of cut depths along a key, such as 3-5-2-6-4. It is the key\'s code.' },
    { t: 'Depth', d: 'How far a cut goes into the blade. Here depth 1 is the shallowest and 6 the deepest.' },
    { t: 'Shear line', d: 'The gap between plug and shell. Every pin stack must break there for the plug to turn.' },
  ],
  defaults: { c1: 3, c2: 5, c3: 2, c4: 6, c5: 4, ins: 1, turn: 0, go: 1 },
  onChange(s, key) {
    if (key === 'go') { s.ins = clamp(s.go, 0, 1); s.turn = clamp(s.go - 1, 0, 1); }
    if (key === 'ins' && s.ins < 0.995) s.turn = 0;
    if (key === 'turn' && s.turn > 0) s.ins = 1;
  },
  controls: [
    ...KEYS.map((k, i) => ({ key: k, type: 'range', label: `Cut ${i + 1}`, min: 1, max: 6, step: 1, fmt: (v) => 'depth ' + v })),
    { key: 'cutbtn', type: 'buttons', label: 'Cut a key', items: [
      { label: 'The right key', act: (s) => { setCuts(s, CODE); s.turn = 0; } },
      { label: 'One cut wrong', act: (s) => { const c = [...CODE]; c[2] = 4; setCuts(s, c); s.turn = 0; } },
      { label: 'A random key', act: (s) => { const r = rng(seed++); setCuts(s, KEYS.map(() => 1 + Math.floor(r() * 6))); s.turn = 0; } },
    ] },
    { key: 'ins', type: 'range', label: 'Slide the key in', min: 0, max: 1, step: 0.005, ends: ['out', 'all the way in'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'turn', type: 'range', label: 'Turn the key', min: 0, max: 1, step: 0.01, ends: ['0°', '90°'], fmt: (v) => Math.round(v * 90) + '°' },
  ],
  quiz: [
    { q: 'What does the right key do to the pin stacks?', options: ['Pushes all the pins out of the lock', 'Lifts each stack so the break between its two pins sits exactly at the shear line', 'Squashes the springs flat', 'Magnetises the pins'], answer: 1, why: 'With every break at the gap between plug and shell, nothing crosses the gap and the plug can turn.' },
    { q: 'One cut on a key is one step too deep. What happens in that stack?', options: ['Nothing, it still works', 'The key pin pokes up into the shell', 'The driver pin drops into the plug and blocks it', 'The spring falls out'], answer: 2, why: 'A deeper cut lets the stack sit lower, so the driver pin on top crosses the shear line.' },
    { q: 'What is a key\'s bitting?', options: ['The maker\'s name', 'How hard the key is', 'The shape of the handle', 'The list of its cut depths, which is its code'], answer: 3, why: 'A bitting such as 3-5-2-6-4 says how deep each cut is, from the shoulder to the tip.' },
  ],
  reel: [
    { ms: 6200, caption: 'The right key lifts every pin stack to the shear line, and the plug is free to turn.', set: { c1: 3, c2: 5, c3: 2, c4: 6, c5: 4 }, anim: { go: [0, 2] }, view: { pos: [0.6, 5.2, 12.2], target: [0.2, 4.4, 0] }, spin: 0 },
    { ms: 5600, caption: 'Get one cut wrong by half a millimetre and a pin stays across the gap. The plug is stuck.', set: { c1: 3, c2: 5, c3: 4, c4: 6, c5: 4 }, anim: { go: [0, 2] }, view: { pos: [2.6, 5.4, 9.6], target: [2.3, 4.6, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const c = makeCylinder({ pins: 5, code: CODE });
    c.group.scale.setScalar(MM); c.group.position.set(0.2, 3.9, 0);
    stage.root.add(c.group);
    const L = (t, pos, cls, parent = c.group) => stage.label(t, pos, parent, cls);
    L('Shear line', [c.L + 6, PLUG_R, 2], 'hot');
    const minor = [
      L('Key pins', [c.L + 5, 2.2, 2]),
      L('Driver pins', [c.L + 5.5, 10.2, 2]),
      L('Shell', [c.L + 4, 17.5, 0]),
      L('Plug', [c.L / 2, -9.5, 0]),
      ...c.xs.map((x, i) => L(String(i + 1), [x, 22.6, 0])),
    ];
    let info = c.info;
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        c.setKey(cutsOf(s));
        info = c.update(dt, { ins: s.ins, turn: s.turn, cut: true });
        fitNarrow(stage, minor);
      },
      readout: (s) => {
        const cuts = cutsOf(s), right = cuts.every((d, i) => d === CODE[i]);
        const bad = cuts.map((d, i) => d - CODE[i]);
        const first = bad.findIndex((b) => b !== 0);
        let big, cls, note;
        if (s.ins < 0.995) { big = 'Key going in'; cls = ''; note = 'The pins ride up and down over the cuts as the key slides in.'; }
        else if (right) { big = s.turn > 0.02 ? 'The plug turns' : 'Every stack is at the shear line'; cls = 'ok'; note = s.turn > 0.02 ? 'The key pins turn with the plug. The driver pins stay in the shell.' : 'Now turn the key.'; }
        else {
          big = `Blocked at pin ${first + 1}`; cls = 'no';
          const mm = (Math.abs(bad[first]) * STEP).toFixed(2);
          note = bad[first] > 0 ? `Cut ${first + 1} is ${mm} mm too deep: the driver pin sits ${mm} mm down in the plug.` : `Cut ${first + 1} is ${mm} mm too shallow: the key pin pokes ${mm} mm up into the shell.`;
        }
        return `<div class="big ${cls}">${big}</div>
          <div class="row"><span>This key</span><b>${cuts.join('-')}</b></div>
          <div class="row"><span>The lock is pinned for</span><b>${CODE.join('-')}</b></div>
          <div class="row"><span>Stacks at the shear line</span><b>${s.ins < 0.995 ? '…' : bad.filter((b) => b === 0).length + ' of 5'}</b></div>
          <small>${note}</small>`;
      },
    };
  },
};
