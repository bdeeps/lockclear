// Chapter 5: three other ways to check a key, each drawn as a working cut-away (millimetres).
//  • Lever lock: flat levers pivot at one end. The key's steps lift each lever by a different
//    amount. The bolt carries a stump that can pass only when every lever's gate is level with it.
//    Geometry here: key axis 8 mm below each lever's belly; key steps lift 0.8 to 3.2 mm; the gate is 1.79 times further from the
//    pivot than the belly (53.7 mm against 30 mm), so it rises 1.79 mm per mm of key lift.
//    The belly is an arc centred on the key, so the lift stays constant while the key sweeps past.
//  • Warded lock: fixed ridges (wards) block any key whose bit has no matching notches.
//    It only checks that the key misses the obstacles, which is why it protects so little.
//  • Wafer lock: one-piece spring-loaded wafers ride on the key and must all sit flush with the
//    plug (0.6 mm depth steps in this model; a typical small cabinet-lock size).
import { THREE, M, box, rod, clamp, smooth, approach } from '../kit.js';
import { makeKey, keyProfile, plate, rodZ, extrudeX, circlePts, fitNarrow, COL, PLUG_R } from '../lock.js';

const DEG = Math.PI / 180;
const ghost = (m) => { m.castShadow = false; return m; };

// ---- lever lock numbers
const NEED = [0.8, 1.6, 2.4, 3.2];               // key lift at the belly for heights 1…4, mm
const RATIO = 53.7 / 30, T_LEVER = 2 * 14.5 * Math.cos(58 * DEG);
const LEVER_CODE = [3, 1, 4], LEVER_WRONG = [3, 2, 4];
const SY = 6, SX0 = 16, SX1 = SX0 + T_LEVER;
// ---- wafer lock numbers
const WAFER_Y = [2.9, 2.3, 1.7, 1.1];        // cut root height above the plug axis for depths 1…4, mm
const WAFER_CODE = [2, 4, 3, 1, 2], WAFER_WRONG = [2, 3, 3, 1, 2];

const arcBand = (r0, r1, a0, a1, n = 48) => [...circlePts(0, 0, r1, n, a0, a1), ...circlePts(0, 0, r0, n, a1, a0)];

export default {
  id: 'others',
  short: 'Other locks',
  title: 'Levers, wards and wafers',
  subtitle: 'Three older and simpler ways to tell the right key from the wrong one.',
  view: { pos: [1.6, 6.4, 13.0], target: [0.8, 5.0, 0] },
  learn: `<p>Pins are not the only way to check a key.</p>
    <p>A <b>lever lock</b> uses flat metal <b>levers</b> stacked side by side. Each step on the key lifts one lever. The bolt carries a peg called the <b>stump</b>, and each lever has a slot, the <b>gate</b>. Only when every lever is lifted by exactly the right amount do all the gates line up with the stump, and the bolt can slide. Lift a lever too little or too much and the stump hits solid metal. This is the lock inside most steel <b>almirahs</b>, old safes and many padlocks, and it is what the lockmakers of <b>Aligarh</b> and <b>Dindigul</b> build by hand, with six, eight or more levers.</p>
    <p>A <b>warded lock</b> is far older. Fixed ridges called <b>wards</b> sit in the key's path, and the key has notches to miss them. But the lock only checks what the key is <i>missing</i>. A key with most of its bit cut away, a <b>skeleton key</b>, misses every ward. That is why wards alone protect very little, and why inventors moved on to levers and pins.</p>
    <p>A <b>wafer lock</b> is the cousin of the pin tumbler in desk drawers, cabinets and many cars. Each flat <b>wafer</b> is one piece. The key must pull every wafer exactly flush with the plug. In a <b>disc-detainer</b> lock the key instead turns a row of discs until their notches line up.</p>
    <p class="tip"><b>Try it:</b> pick a lock, work the right key, then the wrong one. In the lever lock, look at one lever at a time and find its gate.</p>`,
  terms: [
    { t: 'Lever', d: 'A flat pivoting plate in a lever lock. The key must lift it to exactly the right height.' },
    { t: 'Gate', d: 'The slot in a lever that the bolt\'s stump passes through when the lever is at the right height.' },
    { t: 'Stump', d: 'A peg fixed to the bolt. It is blocked by the levers unless all their gates line up.' },
    { t: 'Ward', d: 'A fixed ridge inside a lock that blocks keys without a matching notch.' },
    { t: 'Wafer', d: 'A flat one-piece tumbler with a window for the key. It must sit flush with the plug.' },
  ],
  defaults: { kind: 'lever', keyok: 'right', work: 0, focus: 0 },
  controls: [
    { key: 'kind', type: 'seg', label: 'Which lock', options: [{ v: 'lever', label: 'Lever' }, { v: 'ward', label: 'Warded' }, { v: 'wafer', label: 'Wafer' }] },
    { key: 'keyok', type: 'seg', label: 'Which key', options: [{ v: 'right', label: 'The right key' }, { v: 'wrong', label: 'A wrong key' }] },
    { key: 'work', type: 'range', label: 'Work the key', min: 0, max: 1, step: 0.005, ends: ['start', 'unlocked'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'focus', type: 'seg', label: 'Look at lever', options: [{ v: 0, label: 'All' }, { v: 1, label: '1' }, { v: 2, label: '2' }, { v: 3, label: '3' }], hint: 'For the lever lock: fade the other levers.' },
  ],
  quiz: [
    { q: 'In a lever lock, when can the bolt slide?', options: ['When any one lever is lifted', 'When every lever is lifted so its gate lines up with the stump', 'When the levers are pushed flat', 'Whenever the key is turned hard'], answer: 1, why: 'The stump on the bolt must pass through the gate of every lever at once.' },
    { q: 'Why does a warded lock give little protection?', options: ['It is made of wood', 'Its springs are weak', 'It only checks that the key misses the wards, so a key with most of its bit removed passes too', 'It has too many pins'], answer: 2, why: 'Wards block; they do not measure. Levers and pins measure each part of the key.' },
    { q: 'Where are you most likely to find a wafer lock?', options: ['A bank vault', 'A temple door', 'A bicycle chain', 'A desk drawer, a cabinet or a car door'], answer: 3, why: 'Wafer locks are small and cheap to make, which suits furniture and vehicles.' },
  ],
  reel: [
    { ms: 6000, caption: 'In a lever lock, like an almirah\'s, the key lifts each lever until every gate lines up for the bolt.', set: { kind: 'lever', keyok: 'right', focus: 0 }, anim: { work: [0, 1] }, view: { pos: [1.4, 6.0, 11.6], target: [0.8, 5.0, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const brass = (c) => M.metal(c, { roughness: 0.45, metalness: 0.7, transparent: true });

    // ================================================================ lever lock
    const gL = new THREE.Group(); gL.scale.setScalar(0.085); gL.position.set(-0.2, 5.4, 0); root.add(gL);
    const back = box(104, 78, 2, M.metal(0x4a505c, { roughness: 0.7 })); back.position.set(7.5, 1, -8.6); gL.add(back);
    const frontG = ghost(box(104, 78, 1.2, M.clear(0x9fb0c8, 0.08))); frontG.position.set(7.5, 1, 12.5); gL.add(frontG);
    const pivot = rodZ(2.2, 20, M.metal(0xd8dde6)); pivot.position.set(-30, 10, 2); gL.add(pivot);
    const LCOL = [0xe0b75c, 0xd9824a, 0xf2e09a];
    const levers = LEVER_CODE.map((code, i) => {
      // The window is drawn level as it sits when the lever is lifted exactly right, then turned
      // back about the pivot to the lever's resting angle. So the gate meets the stump squarely.
      const phi = NEED[code - 1] / 30, cs = Math.cos(-phi), sn = Math.sin(-phi);
      const back = ([x, y]) => [-30 + (x + 30) * cs - (y - 10) * sn, 10 + (x + 30) * sn + (y - 10) * cs];
      const outline = [[-36, 4], [-13, 4], [-7.5, -6.6]];
      for (let a = 130; a >= 50; a -= 8) outline.push([8 * Math.cos(a * DEG), -14 + 8 * Math.sin(a * DEG)]);
      outline.push([9, -12.5], [38, -12.5], [38, 17], [-36, 17]);
      const A0 = SX0 - 3, A1 = SX0 + 3, B0 = SX1 - 3, B1 = SX1 + 3, yb = SY - 7, yt = SY + 8.6, g = SY;
      const win = [[A0, yb], [A0, yt], [A1, yt], [A1, g + 2.4], [B0, g + 2.4], [B0, yt], [B1, yt], [B1, yb], [B0, yb], [B0, g - 2.4], [A1, g - 2.4], [A1, yb]].map(back);
      const hole = circlePts(-30, 10, 2.4, 16).reverse();
      const mat = brass(LCOL[i]);
      const mesh = plate(outline, 3, mat, [win, hole]);
      const piv = new THREE.Group(); piv.position.set(-30, 10, i * 3.4); gL.add(piv);
      mesh.position.set(30, -10, 0); piv.add(mesh);
      return { piv, mat, code };
    });
    const lBolt = new THREE.Group(); gL.add(lBolt);
    const boltMat = M.metal(0xc9ced8, { roughness: 0.35 });
    const boltPlate = plate([[-12, -2], [5.3, -2], [5.3, 1.8], [10.1, 1.8], [10.1, -2], [50, -2], [50, 14], [-12, 14]], 3.5, boltMat); boltPlate.position.z = -6; lBolt.add(boltPlate);
    const boltHead = box(16, 16, 12, boltMat); boltHead.position.set(58, 6, -0.5); lBolt.add(boltHead);
    const stumpMat = M.metal(COL.shear, { roughness: 0.4, emissive: new THREE.Color(0x0a3a44) });
    const stump = box(4, 4, 14, stumpMat); stump.position.set(SX1, SY, 4.2); lBolt.add(stump);
    const lKeyG = new THREE.Group(); lKeyG.position.set(0, -14, 0); gL.add(lKeyG);
    const keyMat = M.metal(COL.key, { roughness: 0.34 });
    const shank = rodZ(3, 46, keyMat); shank.position.z = 13; lKeyG.add(shank);
    const bowL = plate(circlePts(0, 0, 11, 32), 3, keyMat, [circlePts(0, 0, 6, 24).reverse()]); bowL.geometry.rotateX(Math.PI / 2); bowL.position.set(0, 1.5, 44); lKeyG.add(bowL);
    const boltStep = box(14.5, 2.4, 3.5, keyMat); boltStep.position.set(7.25, 0, -4.25); lKeyG.add(boltStep);
    const steps = [0, 1, 2].map((i) => { const m = box(1, 2.4, 3.3, keyMat); m.position.z = i * 3.4 + 1.5; lKeyG.add(m); return m; });
    const setLeverKey = (code) => steps.forEach((m, i) => { const r = 8 + NEED[code[i] - 1]; m.scale.x = r; m.position.x = r / 2; });
    const lLab = [
      stage.label('Levers, pivoted here', [-30, 22, 8], gL),
      stage.label('Stump on the bolt', [0, 0, 9], stump, 'hot'),
      stage.label('Bolt', [58, 19, 0], lBolt),
      stage.label('Key bit: one step for each lever', [0, -30, 8], gL),
      stage.label('Gate', [(SX0 + SX1) / 2, -11, 10], gL),
    ];

    // ================================================================ warded lock
    const gW = new THREE.Group(); gW.scale.setScalar(0.1); gW.position.set(-0.6, 4.2, 0); root.add(gW);
    const wBack = box(96, 72, 2, M.metal(0x4a505c, { roughness: 0.7 })); wBack.position.set(14, 6, -8.6); gW.add(wBack);
    const wFront = ghost(box(96, 72, 1.2, M.clear(0x9fb0c8, 0.08))); wFront.position.set(14, 6, 8.6); gW.add(wFront);
    const wardMat = M.metal(0xffb547, { roughness: 0.45 });
    const a0 = (-90 + 28) * DEG, a1 = (270 - 28) * DEG;
    const wardA = plate(arcBand(6.3, 7.7, a0, a1), 5, wardMat); wardA.position.z = -7.6; gW.add(wardA);
    const wardB = plate(arcBand(10.8, 12.2, a0, a1), 5.6, wardMat); wardB.position.z = 2.4; gW.add(wardB);
    const wBolt = new THREE.Group(); gW.add(wBolt);
    const wPlate = plate([[-14, 13], [7.4, 13], [7.4, 16.8], [11.4, 16.8], [11.4, 13], [66, 13], [66, 27], [-14, 27]], 4, boltMat); wPlate.position.z = -2; wBolt.add(wPlate);
    const wKeyG = new THREE.Group(); gW.add(wKeyG);
    const wShank = rodZ(3, 46, keyMat); wShank.position.z = 15; wKeyG.add(wShank);
    const bowW = plate(circlePts(0, 0, 11, 32), 3, keyMat, [circlePts(0, 0, 6, 24).reverse()]); bowW.geometry.rotateX(Math.PI / 2); bowW.position.set(0, 1.5, 46); wKeyG.add(bowW);
    const bitOf = (aLo, aHi) => {
      const m = plate([[2, -7], [aLo, -7], [aLo, -2], [aHi, -2], [aHi, -7], [16, -7], [16, 7], [12.6, 7], [12.6, 1.6], [10.4, 1.6], [10.4, 7], [2, 7]], 2.4, keyMat);
      m.geometry.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(-1, 0, 0)));
      m.geometry.translate(1.2, 0, 0);
      wKeyG.add(m); return m;
    };
    const bitRight = bitOf(5.9, 8.1), bitWrong = bitOf(8.6, 10.6);
    const wLab = [
      stage.label('Wards: fixed ridges', [-15, 10, 6], gW, 'hot'),
      stage.label('Bolt', [58, 31, 0], wBolt),
      stage.label('Notches in the key bit', [14, -22, 6], gW),
    ];

    // ================================================================ wafer lock
    const gF = new THREE.Group(); gF.scale.setScalar(0.3); gF.position.set(-1.2, 4.2, 0); root.add(gF);
    const fx = WAFER_CODE.map((_, i) => 5 + 2.6 * i), FL = fx[4] + 4, fTip = fx[4] + 3.4, FTRAVEL = fTip + 3;
    const sIn = Math.sqrt(PLUG_R ** 2 - 4.2 ** 2);
    const aG = Math.atan2(sIn, 4.2);
    const half = (r, aa, bb, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const a = aa + ((bb - aa) * i) / n; return [r * Math.cos(a), r * Math.sin(a)]; });
    const fShellPts = [...half(11, -Math.PI / 2, Math.PI / 2), [0, 9.2], [4.2, 9.2], ...half(PLUG_R, aG, -aG), [4.2, -9.2], [0, -9.2]];
    gF.add(extrudeX(fShellPts, 0, FL, M.metal(COL.shell, { roughness: 0.5, metalness: 0.7 })));
    const fFront = ghost(extrudeX(fShellPts, 0, FL, M.clear(0xb8c4d8, 0.12))); fFront.scale.z = -1; gF.add(fFront);
    const fPlugG = new THREE.Group(); gF.add(fPlugG);
    fPlugG.add(ghost(rod(0, FL + 1.5, PLUG_R, PLUG_R, M.clear(0xffd98a, 0.22))));
    const wafers = WAFER_CODE.map((code, i) => {
      const w = WAFER_Y[code - 1];
      const mat = M.metal(COL.keyPin, { roughness: 0.4, emissive: new THREE.Color(0) });
      const m = plate([[-4, -PLUG_R], [4, -PLUG_R], [4, PLUG_R], [-4, PLUG_R]], 1.2, mat, [[[-1.1, w - 6.6], [-1.1, w], [1.1, w], [1.1, w - 6.6]]]);
      m.geometry.rotateY(Math.PI / 2); m.position.x = fx[i] - 0.6; fPlugG.add(m);
      return { m, mat, w, x: fx[i], c: -2.6 };
    });
    const fKey = makeKey({ tipX: fTip, y0: -3.2, H: 6.4, thick: 1.6, bowR: 8 }); fPlugG.add(fKey);
    let fProfile = null, fSig = '';
    const setWaferKey = (code) => { fProfile = keyProfile(code.map((d) => WAFER_Y[d - 1] + 3.2), fx, fTip, 6.4, 1.0); fKey.setProfile(fProfile); };
    const fLab = [
      stage.label('Wafers, sprung downwards', [-3, -9.5, 0], gF, 'hot'),
      stage.label('Grooves in the shell', [FL + 3, -8.5, 0], gF),
      stage.label('Plug', [FL + 3.5, 0, 0], gF),
    ];

    const st = { blocked: -1, off: 0, flush: 0, theta: 0, move: 0 };
    let sig = '';
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        const k = s.kind, ok = s.keyok === 'right';
        gL.visible = k === 'lever'; gW.visible = k === 'ward'; gF.visible = k === 'wafer';
        const narrow = fitNarrow(stage, []);
        lLab.forEach((l, i) => { l.visible = k === 'lever' && (!narrow || i === 1 || i === 2); });
        wLab.forEach((l, i) => { l.visible = k === 'ward' && (!narrow || i === 0); });
        fLab.forEach((l, i) => { l.visible = k === 'wafer' && (!narrow || i === 0); });
        const ks = k + s.keyok;
        if (ks !== sig) { sig = ks; setLeverKey(ok ? LEVER_CODE : LEVER_WRONG); bitRight.visible = ok; bitWrong.visible = !ok; setWaferKey(ok ? WAFER_CODE : WAFER_WRONG); }
        if (k === 'lever') {
          const code = ok ? LEVER_CODE : LEVER_WRONG;
          const offs = code.map((c, i) => RATIO * (NEED[c - 1] - NEED[LEVER_CODE[i] - 1]));
          st.blocked = offs.findIndex((o) => Math.abs(o) > 0.4); st.off = st.blocked >= 0 ? offs[st.blocked] : 0;
          let th = s.work * 180;
          // The stump can move 1 mm before it meets the fence of a lever that is at the wrong height.
          if (st.blocked >= 0) th = Math.min(th, Math.acos(Math.cos(58 * DEG) - (2 * Math.cos(58 * DEG)) / T_LEVER) / DEG);
          st.theta = th;
          const ramp = smooth((th - 30) / 22) * (1 - smooth((th - 128) / 22));
          levers.forEach((L, i) => {
            L.piv.rotation.z = (NEED[code[i] - 1] * ramp) / 30;
            const show = !s.focus || s.focus === i + 1;
            L.mat.opacity = show ? 1 : 0.1; L.mat.depthWrite = show;
          });
          st.move = T_LEVER * clamp((Math.cos(58 * DEG) - Math.cos(th * DEG)) / (2 * Math.cos(58 * DEG)), 0, 1);
          lBolt.position.x = -st.move;
          lKeyG.rotation.z = th * DEG;
          stumpMat.color.setHex(st.blocked >= 0 && s.work > 0.33 ? COL.bad : COL.shear);
          stumpMat.emissive.setHex(st.blocked >= 0 && s.work > 0.33 ? 0x5a0000 : 0x0a3a44);
        } else if (k === 'ward') {
          let th = s.work * 240;
          st.blocked = ok ? -1 : 0;
          if (!ok) th = Math.min(th, 24);
          st.theta = th;
          wKeyG.rotation.z = th * DEG;
          st.move = th < 144.3 ? 0 : th > 215.7 ? 18.67 : 9.33 - 16 * Math.sin(th * DEG);
          wBolt.position.x = -st.move;
          wardMat.emissive.setHex(!ok && s.work > 0.1 ? 0x802000 : 0);
        } else {
          const ins = clamp(s.work * 2, 0, 1), turn = clamp(s.work * 2 - 1, 0, 1);
          const off = (1 - ins) * FTRAVEL;
          fKey.position.x = -off;
          let flush = 0;
          wafers.forEach((w) => {
            const top = fProfile(w.x + off);
            w.c = top < -50 ? -2.6 : Math.max(-2.6, Math.min(2.6, -3.2 + top - w.w));
            w.m.position.y = w.c;
            const good = Math.abs(w.c) < 0.05; if (good) flush++;
            w.mat.color.setHex(ins > 0.995 ? (good ? COL.good : COL.bad) : COL.keyPin);
          });
          st.flush = flush; st.blocked = ins > 0.995 && flush < 5 ? wafers.findIndex((w) => Math.abs(w.c) >= 0.05) : -1;
          const want = ins > 0.995 && flush === 5 ? turn * 90 * DEG : ins > 0.995 ? Math.min(turn, 0.03) * 90 * DEG : 0;
          fPlugG.rotation.x = want;
          st.theta = want / DEG;
        }
      },
      readout: (s) => {
        const ok = s.keyok === 'right';
        if (s.kind === 'lever') {
          const stuck = st.blocked >= 0 && s.work > 0.33;
          return `<div class="big ${stuck ? 'no' : st.move > 15 ? 'ok' : ''}">${stuck ? `Blocked by lever ${st.blocked + 1}` : st.move > 15 ? 'Bolt drawn back' : st.move > 0.1 ? 'Stump passing the gates' : 'Bolt locked out'}</div>
            <div class="row"><span>Key turned</span><b>${Math.round(st.theta)}°</b></div>
            <div class="row"><span>Bolt moved</span><b>${st.move.toFixed(1)} of ${T_LEVER.toFixed(1)} mm</b></div>
            <div class="row"><span>Lever lifts needed</span><b>${LEVER_CODE.map((c) => NEED[c - 1].toFixed(1)).join(', ')} mm</b></div>
            <small>${stuck ? `Lever ${st.blocked + 1} is lifted ${Math.abs(st.off / RATIO).toFixed(1)} mm too ${st.off > 0 ? 'high' : 'low'}, so its gate misses the stump by ${Math.abs(st.off).toFixed(1)} mm.` : 'Three levers with four heights each allow 4 × 4 × 4 = 64 keys. Real locks use five to ten levers.'}</small>`;
        }
        if (s.kind === 'ward') {
          const stuck = !ok && s.work > 0.1;
          return `<div class="big ${stuck ? 'no' : st.move > 18 ? 'ok' : ''}">${stuck ? 'The key hits a ward' : st.move > 18 ? 'Bolt drawn back' : st.move > 0.1 ? 'Bit pushing the bolt' : 'Key turning past the wards'}</div>
            <div class="row"><span>Key turned</span><b>${Math.round(st.theta)}°</b></div>
            <div class="row"><span>Bolt moved</span><b>${st.move.toFixed(1)} of 18.7 mm</b></div>
            <div class="row"><span>What the lock checks</span><b>only the notches</b></div>
            <small>${stuck ? 'This key\'s notch is in the wrong place, so the bit runs into the inner ward.' : 'Nothing measures the key. The wards only block bits that have metal where a ward is.'}</small>`;
        }
        const inFull = s.work >= 0.4975;
        return `<div class="big ${st.blocked >= 0 ? 'no' : st.theta > 60 ? 'ok' : ''}">${!inFull ? 'Key going in' : st.blocked >= 0 ? `Blocked by wafer ${st.blocked + 1}` : st.theta > 1 ? 'The plug turns' : 'Every wafer is flush'}</div>
          <div class="row"><span>Wafers flush with the plug</span><b>${inFull ? st.flush : '…'} of 5</b></div>
          <div class="row"><span>Depth step</span><b>0.6 mm</b></div>
          <div class="row"><span>This key</span><b>${(ok ? WAFER_CODE : WAFER_WRONG).join('-')}</b></div>
          <small>${st.blocked >= 0 ? `Wafer ${st.blocked + 1} sticks ${Math.abs(wafers[st.blocked].c).toFixed(1)} mm ${wafers[st.blocked].c > 0 ? 'up' : 'down'} into the shell's groove.` : 'With no key, springs push every wafer down into the lower groove.'}</small>`;
      },
    };
  },
};
