// Chapter 6: locks with no metal key. A secret is checked by wheels or by a chip instead of pins.
//
// Combination dial (the wheel pack of a safe lock): the dial turns a drive cam. A pin on the cam
// picks up wheel 3, which picks up wheel 2, which picks up wheel 1, each after nearly a full turn
// of free play (340° here). Dialling left, right, left parks the three gates under the fence in
// turn; the last turn brings the cam's own gate round, the lever drops and the cam drags the
// bolt back. Three wheels and 100 marks give 100³ = 1,000,000 settings on paper.
//
// Electronic locks: the credential is checked by a microcontroller, which then runs a small
// geared motor (drawn as a worm drive) to move an ordinary bolt.
//   keypad: 10^n codes for n digits · contactless card: 13.56 MHz (MIFARE Classic, 1994),
//   a 4-byte card number has 2^32 values · fingerprint: Apple quotes a 1 in 50,000 chance that a
//   random finger matches Touch ID (support.apple.com/en-us/105095) · phone: Bluetooth LE at
//   2.4 GHz with AES-128 keys (2^128 ≈ 3.4 × 10^38).
import { THREE, M, box, rod, torus, swarm, clamp, smooth, canvasTexture } from '../kit.js';
import { plate, rodZ, post, circlePts, fitNarrow, COL } from '../lock.js';

const DEG = Math.PI / 180, PLAY = 170;
const TH = (n) => n * 3.6;
const COMBO = [32, 78, 15], WRONG = [32, 71, 15];
const GATE = [TH(COMBO[0]) - 3 * PLAY, TH(COMBO[1]) + 2 * PLAY, TH(COMBO[2]) - PLAY];   // wheel angle that puts each gate on top
const A_CAM = TH(COMBO[2]) - PLAY;
const mod = (a, m = 360) => ((a % m) + m) % m;
const adiff = (a, b) => { const d = mod(a - b); return Math.min(d, 360 - d); };
const upTo = (min, cong) => min + mod(cong - min);          // smallest value ≥ min that is ≡ cong
const downTo = (max, cong) => max - mod(max - cong);        // largest value ≤ max that is ≡ cong

function dialPath(nums) {
  const a1 = upTo(1440, TH(nums[0]));                       // four turns left to the first number
  const a2 = downTo(a1 - 4 * PLAY, TH(nums[1]));            // right, passing it twice, to the second
  const a3 = upTo(a2 + 2 * PLAY, TH(nums[2]));              // left to the third
  const a4 = downTo(a3 - 20, A_CAM);                        // right until the cam's gate is on top
  return [0, a1, a2, a3, a4, a4 - 40];
}
function dialSim(nums, prog) {
  const path = dialPath(nums), seg = path.slice(1).map((a, i) => Math.abs(a - path[i]));
  const total = seg.reduce((x, y) => x + y, 0);
  let left = clamp(prog, 0, 1) * total, a = 0, stage = 0;
  const w = [0, 0, 0];
  for (let i = 0; i < seg.length; i++) {
    const dir = Math.sign(path[i + 1] - path[i]), go = Math.min(left, seg[i]);
    for (let d = 0; d < go;) {
      const st = Math.min(3, go - d); d += st; a += dir * st;
      if (i < 4) {                                           // the last stage drags the bolt, wheels stay put
        w[2] = clamp(w[2], a - PLAY, a + PLAY); w[1] = clamp(w[1], w[2] - PLAY, w[2] + PLAY); w[0] = clamp(w[0], w[1] - PLAY, w[1] + PLAY);
      }
    }
    left -= go; stage = i;
    if (left <= 1e-9) break;
  }
  const aligned = w.map((x, i) => adiff(x, GATE[i]) < 4);
  const all = aligned.every(Boolean);
  const drop = all && stage >= 3 ? clamp(1 - (a - path[4]) / 8, 0, 1) : 0;
  const drag = all && stage === 4 ? path[4] - a : 0;
  return { a, w, aligned, all, drop, drag, stage, number: mod(Math.round(a / 3.6), 100) };
}

const KINDS = [['dial', 'Dial'], ['keypad', 'Keypad'], ['card', 'Card'], ['finger', 'Fingerprint'], ['phone', 'Phone']];
const ghost = (m) => { m.castShadow = false; return m; };

export default {
  id: 'nokey',
  short: 'No key at all',
  title: 'Locks without a key',
  subtitle: 'A dial, a code, a card, a fingertip or a phone: a secret is checked, then a bolt moves.',
  view: { pos: [-5.0, 7.8, 13.2], target: [0.4, 5.1, 0] },
  learn: `<p>A key is just a secret cut in metal. Other locks check a different kind of secret.</p>
    <p>A <b>combination lock</b>, like the dial on a safe, holds three <b>wheels</b>, each with one notch called a <b>gate</b>. The dial does not grip the wheels directly. It turns a <b>drive cam</b> whose pin picks up the first wheel, which picks up the next, and so on. Turning left, then right, then left parks the wheels one at a time. When all three gates sit under the <b>fence</b>, the bar drops in and the bolt can be pulled back. No key, and a million possible settings.</p>
    <p>An <b>electronic lock</b> swaps the wheels for a tiny computer. You type a <b>code</b>, tap a <b>card</b>, touch a <b>fingerprint</b> sensor or bring your <b>phone</b> close. The chip compares what it got with what it has stored. If they match, it switches on a small <b>motor</b> or a <b>solenoid</b>, which moves an ordinary bolt. Smart locks talk to the phone by Bluetooth (see <a href="https://glassbox.how/bluetoothclear/" target="_blank" rel="noopener">BluetoothClear</a>).</p>
    <p>Notice what stays the same. Behind every one of them is a plain steel bolt, and most still carry a mechanical cylinder for the day the batteries run out.</p>
    <p class="tip"><b>Try it:</b> dial the right combination step by step and watch each gate arrive. Then dial a wrong one. Then try the keypad.</p>`,
  terms: [
    { t: 'Wheel pack', d: 'The stack of notched wheels in a combination lock. Each wheel stores one number.' },
    { t: 'Gate', d: 'The notch in a wheel. All the gates must line up under the fence.' },
    { t: 'Fence', d: 'The bar that drops into the lined-up gates and lets the bolt move.' },
    { t: 'Credential', d: 'The thing you present to prove who you are: a code, a card, a fingerprint or a phone.' },
    { t: 'RFID', d: 'Radio-frequency identification. A card with a chip and coil that a reader powers and reads by radio.' },
    { t: 'Solenoid', d: 'A coil that pulls an iron plunger when current flows. Many electric locks use one to free the bolt.' },
  ],
  defaults: { kind: 'dial', cred: 'right', prog: 0, digits: 4 },
  controls: [
    { key: 'kind', type: 'seg', label: 'Which lock', options: KINDS.map(([v, label]) => ({ v, label })) },
    { key: 'cred', type: 'seg', label: 'What you give it', options: [{ v: 'right', label: 'The right secret' }, { v: 'wrong', label: 'A wrong one' }] },
    { key: 'prog', type: 'range', label: 'Unlock it, step by step', min: 0, max: 1, step: 0.002, ends: ['start', 'done'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'digits', type: 'range', label: 'Keypad code length', min: 4, max: 8, step: 1, fmt: (v) => v + ' digits' },
  ],
  quiz: [
    { q: 'In a combination lock, what must happen before the bolt can move?', options: ['The dial must spin fast', 'The gates of all the wheels must line up under the fence', 'One wheel must fall out', 'The spring must break'], answer: 1, why: 'The fence can only drop when every wheel has its gate on top. Each wheel was parked there by one number.' },
    { q: 'What does the chip in an electronic lock do?', options: ['It pushes the bolt by itself', 'It makes the door heavier', 'It compares what you presented with what it has stored, then switches on a motor or solenoid', 'It cuts a new key'], answer: 2, why: 'The checking is electronic, but a small motor or solenoid still has to move a real bolt.' },
    { q: 'How many codes can a 6-digit keypad have?', options: ['60', '6,000', '600,000', '1,000,000'], answer: 3, why: 'Ten choices for each of six digits: 10 × 10 × 10 × 10 × 10 × 10 = 1,000,000.' },
  ],
  reel: [
    { ms: 6400, caption: 'A combination dial parks three wheels one by one. When their gates line up, a bar drops in.', set: { kind: 'dial', cred: 'right' }, anim: { prog: [0, 1] }, view: { pos: [-4.4, 6.6, 11.4], target: [0.5, 4.6, 0] }, spin: 0 },
    { ms: 5800, caption: 'A keypad, card or phone lock checks a secret with a chip. Then a motor moves the same steel bolt.', set: { kind: 'keypad', cred: 'right', digits: 4 }, anim: { prog: [0, 1] }, view: { pos: [5.4, 7.2, 10.4], target: [0.6, 4.6, 0] }, spin: 0 },
  ],
  onChange(s, key) { if (key === 'kind' || key === 'cred') s.prog = 0; },

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);

    // ================================================================ combination dial (mm × 0.075)
    const gD = new THREE.Group(); gD.scale.setScalar(0.075); gD.position.set(0.2, 4.4, 0); root.add(gD);
    const face = canvasTexture(512, 512, (g, w, h) => {
      g.fillStyle = '#15181f'; g.beginPath(); g.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#e8ecf4'; g.fillStyle = '#e8ecf4'; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (let n = 0; n < 100; n++) {
        const a = TH(n) * DEG; g.save(); g.translate(w / 2, h / 2); g.rotate(a);
        g.lineWidth = n % 10 === 0 ? 5 : 2; g.beginPath(); g.moveTo(0, -250); g.lineTo(0, n % 10 === 0 ? -214 : n % 5 === 0 ? -226 : -234); g.stroke();
        if (n % 10 === 0) { g.font = '600 40px sans-serif'; g.fillText(String(n), 0, -184); }
        g.restore();
      }
      g.fillStyle = '#2a2e37'; g.beginPath(); g.arc(w / 2, h / 2, 96, 0, Math.PI * 2); g.fill();
    });
    const spin = new THREE.Group(); gD.add(spin);            // everything fixed to the dial and spindle
    const dialBody = rod(-44, -38, 34, 34, M.metal(0x2a2e37, { roughness: 0.5 })); spin.add(dialBody);
    const dialFace = new THREE.Mesh(new THREE.CircleGeometry(33.5, 64), new THREE.MeshBasicMaterial({ map: face.tex })); dialFace.geometry.rotateY(-Math.PI / 2); dialFace.position.x = -44.1; spin.add(dialFace);
    const knob = rod(-56, -44, 12, 13, M.metal(0xc9ced8, { roughness: 0.3 })); spin.add(knob);
    spin.add(rod(-44, 40, 2.4, 2.4, M.metal(0xc9ced8)));
    const index = box(1.5, 7, 3, M.glow(0xff7a59)); index.position.set(-45, 38, 0); gD.add(index);
    const doorPlate = ghost(box(5, 96, 96, M.clear(0x9fb0c8, 0.14))); doorPlate.position.x = -30; gD.add(doorPlate);
    const notched = (color, mark) => {
      const half = 8 * DEG, pts = [];
      for (let a = 90 + 8; a <= 450 - 8; a += 4) pts.push([22 * Math.cos(a * DEG), 22 * Math.sin(a * DEG)]);
      pts.push([15.5 * Math.cos(Math.PI / 2 - half * 1.3), 15.5], [15.5 * Math.cos(Math.PI / 2 + half * 1.3), 15.5]);
      const m = plate(pts, 5, M.metal(color, { roughness: 0.45 }), [circlePts(0, 0, 4, 16).reverse()]);
      m.geometry.rotateY(Math.PI / 2);
      const dot = box(5.4, 2, 5, M.glow(mark)); dot.position.set(2.5, 14.3, 0); m.add(dot);
      return m;
    };
    const pinAt = (x0, x1, up, mat) => { const p = rod(x0, x1, 1.7, 1.7, mat); p.position.y = up ? 14 : -14; return p; };
    const pinMat = M.metal(0xe3e6ec);
    const WX = [0, 12, 24], WCOL = [0xd9824a, 0xe0b75c, 0x7aa2ff];
    const wheels = WX.map((x, i) => {
      const disc = notched(WCOL[i], 0x8ef0ff); disc.position.x = x; gD.add(disc);
      const pins = new THREE.Group(); gD.add(pins);
      pins.add(pinAt(x + 5, x + 8.4, false, pinMat));                    // fly, facing the driver behind it
      if (i > 0) pins.add(pinAt(x - 3.6, x, true, pinMat));             // pin that drives the next wheel forward
      return { disc, pins };
    });
    const cam = notched(0xc9ced8, 0xffb547); cam.position.x = 36; gD.add(cam);
    const camPin = pinAt(32.4, 36, true, pinMat); const camPins = new THREE.Group(); camPins.add(camPin); gD.add(camPins);
    const dBolt = new THREE.Group(); gD.add(dBolt);
    const boltBar = box(12, 10, 72, M.metal(0xd8dde6, { roughness: 0.3 })); boltBar.position.set(36, 38, -10); dBolt.add(boltBar);
    const leverG = new THREE.Group(); leverG.position.set(36, 31, 26); dBolt.add(leverG);
    const levMat = M.metal(0x5ce1a9, { roughness: 0.45 });
    const beamL = box(4, 4, 28, levMat); beamL.position.set(0, -2, -13); leverG.add(beamL);
    const nose = box(5, 7, 5, levMat); nose.position.set(0, -5.5, -26); leverG.add(nose);
    const fence = box(42, 3.2, 3.2, levMat); fence.position.set(-18.5, -7, -26); leverG.add(fence);
    const frame = ghost(box(40, 44, 30, M.clear(0x9fb0c8, 0.2))); frame.position.set(36, 38, -52); gD.add(frame);
    const dLab = [
      stage.label('Dial', [-50, -44, 0], gD),
      stage.label('Three wheels, one gate each', [12, -30, 0], gD, 'hot'),
      stage.label('Drive cam', [48, -16, 6], gD),
      stage.label('Fence', [-4, -4, -26], leverG, 'hot'),
      stage.label('Bolt', [36, 50, -30], dBolt),
    ];

    // ================================================================ electronic lock (mm × 0.06)
    const S = 0.046;
    const gE = new THREE.Group(); gE.scale.setScalar(S); gE.position.set(3.2, 4.3, 0); root.add(gE);
    const door = ghost(box(125, 184, 44, M.clear(0xd9a866, 0.09))); door.position.set(-62.5, 0, 0); gE.add(door);
    const jamb = ghost(box(40, 184, 62, M.clear(0x9fb0c8, 0.2))); jamb.position.set(24, 0, 0); gE.add(jamb);
    const outPlate = ghost(box(66, 176, 8, M.clear(0xb8c4d8, 0.16))); outPlate.position.set(-62, 0, 26); gE.add(outPlate);
    const inBox = ghost(box(72, 176, 30, M.clear(0xb8c4d8, 0.12))); inBox.position.set(-62, 0, -37); gE.add(inBox);
    // keypad
    const padState = { lit: 0, bad: false };
    const pad = canvasTexture(300, 400, (g, w, h) => {
      g.fillStyle = '#10131a'; g.fillRect(0, 0, w, h);
      const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'], order = ['2', '5', '8', '0', '1', '4', '7', '3'];
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '600 44px sans-serif';
      keys.forEach((k, i) => {
        const x = 20 + (i % 3) * 92, y = 16 + Math.floor(i / 3) * 96;
        const on = order.slice(0, padState.lit).includes(k);
        g.fillStyle = on ? (padState.bad ? '#ff4d4d' : '#8ef0ff') : '#2a2e37'; g.beginPath(); g.roundRect(x, y, 76, 80, 14); g.fill();
        g.fillStyle = on ? '#07080c' : '#e8ecf4'; g.fillText(k, x + 38, y + 42);
      });
    });
    const padMesh = new THREE.Mesh(new THREE.PlaneGeometry(48, 64), new THREE.MeshBasicMaterial({ map: pad.tex, toneMapped: false })); padMesh.position.set(-62, 46, 30.3); gE.add(padMesh);
    const sensorMat = M.glow(0x2a2e37);
    const sensor = new THREE.Mesh(new THREE.CircleGeometry(10, 32), sensorMat); sensor.position.set(-62, -6, 30.3); gE.add(sensor);
    const sensorRing = torus(10.5, 1, M.metal(0xc9ced8)); sensorRing.position.set(-62, -6, 30.3); gE.add(sensorRing);
    const coilMat = M.metal(0xd98a4a, { emissive: new THREE.Color(0) });
    const coil = torus(17, 1.3, coilMat); coil.position.set(-62, -52, 27); gE.add(coil);
    const coil2 = torus(13.5, 1.3, coilMat); coil2.position.copy(coil.position); gE.add(coil2);
    // inside: board, chip, batteries, motor and worm gear
    const pcb = box(52, 52, 2, M.plastic(0x1f7a4d)); pcb.position.set(-62, 54, -32); gE.add(pcb);
    const chipMat = M.plastic(0x14161c, { emissive: new THREE.Color(0) });
    const chip = box(16, 16, 3.5, chipMat); chip.position.set(-62, 54, -29.5); gE.add(chip);
    const ant = box(26, 3, 1, M.metal(0xffb547)); ant.position.set(-62, 74, -30.5); gE.add(ant);
    [-83, -69, -55, -41].forEach((x, i) => { const c = post(7.2, 50, M.plastic(i % 2 ? 0x3a3f4b : 0x2f5bff)); c.position.set(x, -82, -37); gE.add(c); const cap = post(2.4, 2, M.metal(0xd8dde6)); cap.position.set(x, -32, -37); gE.add(cap); });
    const motor = rod(-96, -76, 8, 8, M.metal(0x8f98a8, { roughness: 0.4 })); motor.position.set(0, 15.5, -32); gE.add(motor);
    const worm = new THREE.Group(); worm.position.set(-62, 15.5, -32); gE.add(worm);
    worm.add(rod(-14, 16, 2.2, 2.2, M.metal(0xe3e6ec)));
    const thread = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 97 }, (_, i) => new THREE.Vector3(-12 + (i / 96) * 26, 3.3 * Math.cos(i * 0.5236), 3.3 * Math.sin(i * 0.5236)))), 200, 0.9, 6), M.metal(0xffb547)); worm.add(thread);
    const turnG = new THREE.Group(); turnG.position.set(-62, 0, 0); gE.add(turnG);
    const gearPts = Array.from({ length: 97 }, (_, i) => { const a = (i / 96) * Math.PI * 2, r = 11 + (Math.floor(i / 2) % 2 ? 1.6 : 0); return [r * Math.cos(a), r * Math.sin(a)]; });
    const gear = plate(gearPts, 5, M.metal(0xffb547, { roughness: 0.45 })); gear.position.z = -34.5; turnG.add(gear);
    const tail = box(6.4, 1.6, 46, M.metal(0xc9ced8)); tail.position.z = -10; turnG.add(tail);
    const hub = rodZ(7.5, 5, M.metal(0xffb547, { roughness: 0.4 })); turnG.add(hub);
    const armG = new THREE.Group(); armG.rotation.z = 135 * DEG; turnG.add(armG);
    const arm = box(18, 5, 3, M.metal(0xffb547, { roughness: 0.4 })); arm.position.x = 9; armG.add(arm);
    const cpin = rodZ(2, 9, M.metal(0xe3e6ec)); cpin.position.set(18, 0, 2.5); armG.add(cpin);
    const overridePlug = rodZ(6.35, 2, M.metal(COL.plug)); overridePlug.position.set(-62, 0, 30); gE.add(overridePlug);
    const eBolt = new THREE.Group(); gE.add(eBolt);
    const eHead = box(40, 22, 16, M.metal(0xd8dde6, { roughness: 0.3 })); eHead.position.set(-22, 0, 0); eBolt.add(eHead);
    const eTail = box(36, 6, 2.5, M.metal(0xb9bec8)); eTail.position.set(-59, 14, 6); eBolt.add(eTail);
    const eYoke = plate([[-3.5, 3], [3.5, 3], [3.5, 30], [-3.5, 30]], 2.5, M.metal(0xb9bec8), [[[-2.2, 6], [-2.2, 26], [2.2, 26], [2.2, 6]]]); eYoke.position.set(-62 + 18 * Math.cos(135 * DEG), 0, 4.8); eBolt.add(eYoke);
    // things you present
    const card = box(86, 54, 1.2, M.plastic(0x2f5bff)); gE.add(card);
    const finger = new THREE.Mesh(new THREE.CapsuleGeometry(8, 34, 6, 14), M.plastic(0xe0a98a)); finger.rotation.x = Math.PI / 2; gE.add(finger);
    const phone = box(70, 140, 8, M.plastic(0x14161c)); phone.position.set(-20, -62, 96); phone.rotation.set(-0.5, 0, 0); phone.scale.setScalar(0.8); gE.add(phone);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(62, 128), M.glow(0x1d3b5c)); screen.position.z = 4.2; phone.add(screen);
    const waves = [0, 1, 2].map(() => { const t = new THREE.Mesh(new THREE.TorusGeometry(1, 0.045, 8, 48), M.glow(0x8ef0ff, { transparent: true })); t.rotation.x = -0.5; gE.add(t); return t; });
    // signal and power dots
    const mk = (pts) => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.1);
    const CHIP = [-62, 54, -29];
    const sigPath = {
      keypad: mk([[-62, 46, 30], [-62, 60, 10], [-62, 58, -20], CHIP]),
      card: mk([[-62, -52, 27], [-44, -20, 0], [-44, 40, -24], CHIP]),
      finger: mk([[-62, -6, 30], [-46, 10, 0], [-46, 44, -24], CHIP]),
      phone: mk([[-20, -62, 96], [-40, 30, 40], [-62, 78, -10], [-62, 74, -30], CHIP]),
    };
    const powPath = mk([[-62, -32, -37], [-34, -10, -34], [-34, 46, -31], CHIP, [-84, 40, -31], [-86, 22, -32]]);
    const sig = swarm(10, new THREE.SphereGeometry(1.5, 10, 8), M.glow(0x8ef0ff)); gE.add(sig);
    const pow = swarm(12, new THREE.SphereGeometry(1.5, 10, 8), M.glow(0xffb547)); gE.add(pow);
    const eLab = [
      stage.label('Chip checks the secret', [-62, 70, -24], gE, 'hot'),
      stage.label('Motor and worm gear', [-98, 30, -30], gE),
      stage.label('Bolt', [-10, 18, 8], eBolt),
      stage.label('Batteries', [-98, -60, -30], gE),
      stage.label('Keypad', [-98, 60, 32], gE),
      stage.label('Fingerprint sensor', [-108, -6, 32], gE),
      stage.label('Card reader coil', [-106, -52, 30], gE),
      stage.label('Key override', [-36, -6, 34], gE),
    ];

    const P = new THREE.Vector3();
    const st = { sim: dialSim(COMBO, 0), e: 25.5, phase: 'wait' };
    let padSig = '';
    return {
      update(dt, s, time) {
        dt = Math.max(0, dt);
        const k = s.kind, ok = s.cred === 'right', p = clamp(s.prog, 0, 1);
        gD.visible = k === 'dial'; gE.visible = k !== 'dial';
        const narrow = fitNarrow(stage, []);
        dLab.forEach((l, i) => { l.visible = k === 'dial' && (!narrow || i === 1 || i === 3); });
        eLab.forEach((l, i) => { l.visible = k !== 'dial' && (!narrow ? i < 4 || (i === 4 && k === 'keypad') || (i === 5 && k === 'finger') || (i === 6 && k === 'card') || i === 7 : i === 0); });
        if (k === 'dial') {
          const m = (st.sim = dialSim(ok ? COMBO : WRONG, p));
          spin.rotation.x = -m.a * DEG;
          wheels.forEach((w, i) => { w.pins.rotation.x = -m.w[i] * DEG; w.disc.rotation.x = -(m.w[i] - GATE[i]) * DEG; });
          cam.rotation.x = -(m.a - A_CAM) * DEG; camPins.rotation.x = -m.a * DEG;
          leverG.rotation.x = -0.235 * smooth(m.drop);
          dBolt.position.z = 22 * Math.sin(m.drag * DEG);
          levMat.color.setHex(p > 0.985 && !m.all ? COL.bad : 0x5ce1a9);
          return;
        }
        // ---- electronic: present (0–0.3), signal to the chip (0.3–0.5), decide, then motor (0.58–1)
        const present = smooth(p / 0.3), sent = clamp((p - 0.3) / 0.2, 0, 1), decided = p > 0.5;
        const run = decided && ok ? smooth((p - 0.58) / 0.42) : 0;
        st.phase = p < 0.3 ? 'present' : !decided ? 'check' : ok ? (run >= 1 ? 'open' : 'motor') : 'refused';
        const lit = k === 'keypad' ? Math.min(s.digits, Math.floor(present * s.digits + 0.001)) : 0;
        const ps = `${lit}|${decided && !ok}`;
        if (ps !== padSig) { padSig = ps; padState.lit = lit; padState.bad = decided && !ok; pad.redraw(); }
        card.visible = k === 'card'; finger.visible = k === 'finger'; phone.visible = k === 'phone';
        card.position.set(-62, -52, 110 - 76 * present); card.rotation.z = 0.2;
        finger.position.set(-62, -8, 100 - 58 * present);
        sensorMat.color.setHex(k === 'finger' && present > 0.9 ? (decided ? (ok ? 0x5ce1a9 : 0xff4d4d) : 0x8ef0ff) : 0x2a2e37);
        coilMat.emissive.setHex(k === 'card' && present > 0.9 ? 0x804010 : 0);
        waves.forEach((w, i) => {
          const f = (time * 0.6 + i / 3) % 1;
          w.visible = k === 'phone' && p < 0.5;
          w.position.set(-20 - 42 * f, -62 + 136 * f, 96 - 126 * f); w.scale.setScalar(10 + 26 * f); w.material.opacity = 0.8 * (1 - f) * present;
        });
        sig.visible = sent > 0 && sent < 1;
        for (let i = 0; i < 10; i++) { sigPath[k].getPointAt(clamp(sent * 1.3 - i * 0.03, 0, 1), P); sig.place(i, [P.x, P.y, P.z]); }
        sig.done();
        chipMat.emissive.setHex(!decided ? (sent > 0.9 ? 0x806010 : 0) : ok ? 0x1a8050 : 0x901818);
        pow.visible = run > 0 && run < 1;
        for (let i = 0; i < 12; i++) { powPath.getPointAt((time * 0.5 + i / 12) % 1, P); pow.place(i, [P.x, P.y, P.z]); }
        pow.done();
        const turn = 1 - run;                                 // the bolt starts thrown
        const th = (135 - 90 * turn) * DEG;
        turnG.rotation.z = -90 * turn * DEG;
        worm.rotation.x = -run * 90 * DEG * 30;               // one-start worm on a 30-tooth wheel: 30 turns per turn
        st.e = 18 * (Math.cos(th) - Math.cos(135 * DEG));
        eBolt.position.x = st.e;
      },
      readout: (s) => {
        const ok = s.cred === 'right';
        if (s.kind === 'dial') {
          const m = st.sim, nums = ok ? COMBO : WRONG, n = m.aligned.filter(Boolean).length;
          const done = s.prog > 0.985;
          const says = ['Left, four turns, to ' + nums[0], 'Right, past it twice, to ' + nums[1], 'Left, past it once, to ' + nums[2], 'Right, until the fence drops', 'The cam drags the bolt back'][m.stage];
          return `<div class="big ${done ? (m.all ? 'ok' : 'no') : ''}">${done ? (m.all ? 'Fence in: bolt drawn back' : 'The fence cannot drop') : 'Dial at ' + m.number}</div>
            <div class="row"><span>Dialling</span><b>${nums.join(' · ')}</b></div>
            <div class="row"><span>Now</span><b>${says}</b></div>
            <div class="row"><span>Gates under the fence</span><b>${n} of 3</b></div>
            <div class="row"><span>Settings on paper</span><b>100³ = 1,000,000</b></div>
            <small>${done && !m.all ? 'The second number was 7 marks out, so wheel 2 has solid rim under the fence.' : 'Each wheel is picked up by the one behind it, after 340° of free play.'}</small>`;
        }
        const head = { present: 'Presenting the secret', check: 'The chip is comparing', motor: 'Match: the motor runs', open: 'Bolt drawn back', refused: 'No match: nothing moves' }[st.phase];
        const cls = st.phase === 'refused' ? 'no' : st.phase === 'open' || st.phase === 'motor' ? 'ok' : '';
        const rows = {
          keypad: `<div class="row"><span>Possible codes</span><b>10<sup>${s.digits}</sup> = ${(10 ** s.digits).toLocaleString('en')}</b></div><div class="row"><span>Checked by</span><b>the chip, not by pins</b></div>`,
          card: '<div class="row"><span>Radio link</span><b>13.56 MHz, a few cm</b></div><div class="row"><span>4-byte card numbers</span><b>2<sup>32</sup> ≈ 4.3 billion</b></div>',
          finger: '<div class="row"><span>Chance a random finger matches</span><b>about 1 in 50,000</b></div><div class="row"><span>Compares</span><b>ridge patterns, not a picture</b></div>',
          phone: '<div class="row"><span>Radio link</span><b>Bluetooth, 2.4 GHz</b></div><div class="row"><span>128-bit keys</span><b>2<sup>128</sup> ≈ 3.4 × 10<sup>38</sup></b></div>',
        }[s.kind];
        const note = { keypad: 'A longer code multiplies the count by ten for every digit.', card: 'The reader\'s coil powers the card by radio. Good cards also prove they hold a secret key.', finger: 'The 1 in 50,000 figure is the one a phone maker quotes for its sensor. Door locks vary.', phone: 'The phone and lock prove a shared secret key to each other. The key itself is never sent.' }[s.kind];
        return `<div class="big ${cls}">${head}</div>${rows}
          <div class="row"><span>Bolt out of the door</span><b>${st.e.toFixed(1)} mm</b></div>
          <small>${note}</small>`;
      },
    };
  },
};
