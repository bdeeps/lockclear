// Chapter 1: take a pin-tumbler cylinder apart. Sizes are in js/lock.js (a common 5-pin keyway).
import { exploder, approach } from '../kit.js';
import { makeCylinder, MM, PLUG_R, PIN_R, SPACING, fitNarrow } from '../lock.js';

export const CODE = [3, 5, 2, 6, 4];         // the depths this lock is pinned for

export default {
  id: 'anatomy',
  short: 'Inside a cylinder',
  title: 'Inside a lock cylinder',
  subtitle: 'A plug that wants to turn, and five little stacks of pins that will not let it.',
  view: { pos: [3.6, 6.6, 15.5], target: [0.5, 5.3, 0] },
  learn: `<p>The lock on most front doors is a <b>pin-tumbler cylinder</b>. Here it is sliced down the middle so you can see in.</p>
    <p>The round part your key slides into is the <b>plug</b>. It sits inside a fixed <b>shell</b>. If the plug can turn, its <b>tailpiece</b> at the back turns too and moves the bolt. So the whole job of the lock is to stop the plug turning for everyone except you.</p>
    <p>It does that with <b>pin stacks</b>. Each stack is a hole drilled down through the shell and into the plug. In it sit a <b>key pin</b> (orange), a <b>driver pin</b> (blue) and a small <b>spring</b> pushing them down. With no key, every driver pin sits half in the shell and half in the plug, like a nail through two boards. The plug is pinned in place.</p>
    <p>The gap between plug and shell is called the <b>shear line</b>. Remember it: the next chapter is all about it.</p>
    <p class="tip"><b>Try it:</b> take the cylinder apart, then put it back and slide the key in. Watch what the tops of the orange pins do.</p>`,
  terms: [
    { t: 'Plug', d: 'The round core that the key goes into. It is the only part that turns.' },
    { t: 'Shell', d: 'The fixed housing around the plug. It is held in the door or the padlock body.' },
    { t: 'Key pin', d: 'The lower pin in each stack. It rests on the key, and each one is a different length.' },
    { t: 'Driver pin', d: 'The upper pin in each stack. A spring pushes it down across the gap to block the plug.' },
    { t: 'Shear line', d: 'The gap between plug and shell. The plug can turn only when no pin crosses it.' },
    { t: 'Tailpiece (or cam)', d: 'The bar on the back of the plug that passes the turn on to the bolt.' },
  ],
  defaults: { explode: 0, key: 0, cut: true },
  controls: [
    { key: 'explode', type: 'range', label: 'Take it apart', min: 0, max: 1, step: 0.01, ends: ['together', 'exploded'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'key', type: 'seg', label: 'Key', options: [{ v: 0, label: 'Out' }, { v: 1, label: 'In' }] },
    { key: 'cut', type: 'toggle', label: 'Cut-away front' },
  ],
  quiz: [
    { q: 'Which part of the cylinder turns?', options: ['The shell', 'The plug', 'The springs', 'The driver pins'], answer: 1, why: 'The plug turns inside the fixed shell, and its tailpiece moves the bolt.' },
    { q: 'With no key in the lock, what stops the plug turning?', options: ['Friction', 'A magnet', 'Driver pins sitting across the gap between plug and shell', 'The key pins are glued in'], answer: 2, why: 'Springs push each driver pin down so it sits half in the shell and half in the plug.' },
    { q: 'What is the shear line?', options: ['The edge of the key', 'A line drawn on the door', 'The longest pin', 'The gap between the plug and the shell'], answer: 3, why: 'The plug can only turn when every pin stack has a break exactly at that gap.' },
  ],
  reel: [
    { ms: 5600, caption: 'A door lock is a plug that wants to turn and five stacks of pins that stop it.', set: { key: 0, cut: true }, anim: { explode: [0, 1] }, view: { pos: [3.2, 6.4, 15.5], target: [0.5, 5.3, 0] }, spin: 0.25 },
  ],

  build({ stage }) {
    const c = makeCylinder({ pins: 5, code: CODE });
    c.group.scale.setScalar(MM); c.group.position.set(-0.6, 5.1, 0);
    stage.root.add(c.group);
    c.setKey(CODE);
    const setExplode = exploder([
      { obj: c.plugG, off: [0, -13.5, 0] },
      { obj: c.keyPins, off: [0, 7.5, 0] },
      { obj: c.drivers, off: [0, 0, 10] },
      { obj: c.springs, off: [0, 2, 10] },
      { obj: c.cap, off: [0, 5.5, 0] },
      { obj: c.camG, off: [7, -13.5, 0] },
      { obj: c.clip, off: [3.5, -13.5, 0] },
    ]);
    const L = (t, obj, pos, cls) => stage.label(t, pos, obj, cls);
    const main = [
      L('Shell', c.shell, [c.L - 1, 14.5, -3.5]),
      L('Plug: the part that turns', c.plugG, [15, -9.2, 0], 'hot'),
      L('Key pins', c.keyPins, [c.xs[0] - 6.5, 3.6, 2]),
      L('Driver pins', c.drivers, [c.L + 5.5, 9.5, 0]),
      L('Springs', c.springs, [c.L + 4.5, 16.5, 0]),
    ];
    const minor = [
      L('Tailpiece: turns the bolt', c.camG, [c.L + 7, 5.5, 0]),
      L('Spring cover', c.cap, [0, 3.2, 0]),
      L('Key', c.key, [-14, 9.5, 0]),
      L('Clip', c.clip, [0, -9, 0]),
    ];
    const lShear = L('Shear line', c.group, [-5.5, PLUG_R, 2], 'hot');
    let ins = 0;
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        setExplode(s.explode);
        const loose = s.explode > 0.03;
        ins = approach(ins, s.key && !loose ? 1 : 0, 2.6, dt);
        if (!loose && s.key && ins > 0.997) ins = 1;
        c.update(dt, { ins, turn: 0, loose, keyExtra: 8 * s.explode, cut: s.cut || loose, marks: !loose });
        c.stacks.forEach((k) => { k.dot.visible = false; });
        fitNarrow(stage, minor, -0.17);
        minor[3].visible = minor[3].visible && s.explode > 0.4;
        lShear.visible = !loose;
      },
      readout: (s) => `<div class="big">5 pin stacks, 20 parts</div>
        <div class="row"><span>Plug diameter</span><b>${(PLUG_R * 2).toFixed(1)} mm</b></div>
        <div class="row"><span>Pin diameter</span><b>${(PIN_R * 2).toFixed(1)} mm</b></div>
        <div class="row"><span>Pins are spaced</span><b>${SPACING.toFixed(2)} mm apart</b></div>
        <small>${s.explode > 0.03 ? '5 key pins, 5 driver pins, 5 springs, a plug, a shell, a cover, a tailpiece and a clip.' : s.key ? 'Key in: the top of every orange pin now meets the shear line.' : 'No key: every blue driver pin sits across the shear line.'}</small>`,
    };
  },
};
