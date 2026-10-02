// Chapter 4: what the turning plug does. Three jobs drawn in millimetres:
//  • Deadbolt: the tailpiece turns a crank 90°. A crank pin 18 mm from the centre, swinging from
//    135° to 45°, slides the bolt 18 × (cos 45° − cos 135°) = 25.5 mm: the 1 inch (25 mm) throw
//    that ANSI/BHMA grade 1 deadbolts list (for example ANSI/BHMA A156.36 product sheets).
//  • Spring latch: a bevelled bolt held out about 13 mm (1/2 in) by a spring. An arm 14 mm long
//    turning 85° pulls it back 14 × (1 − cos 85°) = 12.8 mm. A push on the slope does the same.
//  • Padlock: two steel balls sit half in notches in the shackle legs, held out by a cam on the
//    cylinder. Turn the cam's flats to face the balls and they can move in, freeing the shackle.
// Door: 44 mm thick, 60 mm backset (cylinder centre to door edge).
import { THREE, M, box, rod, spring, arrow, clamp, approach, smooth } from '../kit.js';
import { makeKey, keyProfile, plate, rodZ, post, coilY, circlePts, fitNarrow, COL, FIRST, SPACING, rootH, PLUG_R } from '../lock.js';
import { CODE } from './anatomy.js';

const S = 0.085, DEG = Math.PI / 180;
const ghost = (m) => { m.castShadow = false; return m; };
const KINDS = { dead: 'Deadbolt', latch: 'Spring latch', pad: 'Padlock' };

function cutKey() {
  const xs = CODE.map((_, i) => FIRST + i * SPACING), tipX = xs[4] + 4.4;
  const k = makeKey({ tipX }); k.setProfile(keyProfile(CODE.map((d) => rootH(d)), xs, tipX));
  return k;
}

// A slice of door and frame with a cylinder, key, tailpiece and thumb-turn. Returns the parts
// that move. `baseAngle` is where the crank arm points before the key is turned.
function doorSet(armLen, baseAngle) {
  const g = new THREE.Group();
  const door = ghost(box(105, 96, 44, M.clear(0xd9a866, 0.1))); door.position.set(-52.5, 0, 0); g.add(door);
  const jamb = ghost(box(40, 96, 62, M.clear(0x9fb0c8, 0.2))); jamb.position.set(24, 0, 0); g.add(jamb);
  const face = box(2, 58, 26, M.metal(0xc9ced8)); face.position.set(-1, 0, 0); g.add(face);
  const strike = box(1.6, 64, 30, M.metal(0xc9ced8)); strike.position.set(3.2, 0, 0); g.add(strike);
  const pocket = ghost(box(27, 26, 20, M.clear(0x10131a, 0.55))); pocket.position.set(17.5, 0, 0); g.add(pocket);
  const collar = rodZ(12.5, 6, M.metal(0xb9bec8, { roughness: 0.35 })); collar.position.set(-60, 0, 25); g.add(collar);
  const body = ghost(rodZ(9.5, 16, M.clear(0x9fb0c8, 0.28))); body.position.set(-60, 0, 14); g.add(body);
  const rose = rodZ(15, 4, M.metal(0xb9bec8, { roughness: 0.35 })); rose.position.set(-60, 0, -24); g.add(rose);
  const turnG = new THREE.Group(); turnG.position.set(-60, 0, 0); g.add(turnG);
  const plugFace = rodZ(6.35, 1.2, M.metal(COL.plug)); plugFace.position.z = 28.4; turnG.add(plugFace);
  const key = cutKey(); key.rotation.y = Math.PI / 2; key.position.z = 29; turnG.add(key);
  const tail = box(6.4, 1.6, 40, M.metal(0xc9ced8)); tail.position.z = -8; turnG.add(tail);
  const thumb = box(7, 30, 6, M.metal(0xd8dde6, { roughness: 0.3 })); thumb.position.z = -30; turnG.add(thumb);
  const hub = rodZ(7.5, 5, M.metal(0xffb547, { roughness: 0.4 })); turnG.add(hub);
  const armG = new THREE.Group(); armG.rotation.z = baseAngle; turnG.add(armG);
  const arm = box(armLen, 5, 3, M.metal(0xffb547, { roughness: 0.4 })); arm.position.x = armLen / 2; armG.add(arm);
  const pin = rodZ(2, 9, M.metal(0xe3e6ec)); pin.position.set(armLen, 0, 2.5); armG.add(pin);
  return { g, turnG, door, jamb };
}

export default {
  id: 'bolt',
  short: 'Throwing the bolt',
  title: 'From a turning plug to a locked door',
  subtitle: 'The cylinder only decides who may turn it. A bolt, a latch or a shackle does the holding.',
  view: { pos: [4.0, 10.1, 10.6], target: [0.6, 4.2, 0] },
  learn: `<p>The cylinder is only the judge. It decides whether the plug may turn. The part that actually holds the door is the <b>bolt</b>, and the plug's <b>tailpiece</b> (or <b>cam</b>) is what moves it.</p>
    <p>In a <b>deadbolt</b>, the tailpiece turns a small crank. A quarter turn slides a solid bar about <b>25 mm</b> out of the door edge into a steel-lined pocket in the frame. It is called <i>dead</i> because nothing springs it: the end is square, so pushing on it does nothing. It moves only when the cylinder turns.</p>
    <p>A <b>spring latch</b> is the sloped bolt that clicks when you swing a door shut. A spring holds it out, and the slope lets the frame push it back in as the door closes. That is handy, but a bolt that gives way to a push is weaker. So entry doors add a <b>dead latch</b> plunger that blocks the latch once the door is shut, or a separate deadbolt. <a href="https://glassbox.how/knobclear/" target="_blank" rel="noopener">KnobClear</a> looks at the latch in detail.</p>
    <p>In a <b>padlock</b>, the cam holds two steel balls out into notches in the <b>shackle</b>. Turn the key and the cam's flat sides face the balls. They slip inwards, and a spring pops the shackle up.</p>
    <p class="tip"><b>Try it:</b> lock each one, then push on it with the second slider. Which one gives way?</p>`,
  terms: [
    { t: 'Deadbolt', d: 'A solid bolt with a square end and no spring. Only turning the cylinder or thumb-turn moves it.' },
    { t: 'Spring latch', d: 'A sloped bolt held out by a spring. It retracts when the door closes against the frame.' },
    { t: 'Throw', d: 'How far a bolt sticks out of the door edge when locked. A good deadbolt throws about 25 mm.' },
    { t: 'Strike', d: 'The metal plate and pocket in the door frame that the bolt slides into.' },
    { t: 'Shackle', d: 'The U-shaped bar of a padlock. One leg stays in the body and the other lifts free.' },
  ],
  defaults: { kind: 'dead', turn: 1, push: 0 },
  controls: [
    { key: 'kind', type: 'seg', label: 'Which lock', options: Object.entries(KINDS).map(([v, label]) => ({ v, label })) },
    { key: 'turn', type: 'range', label: 'Turn the key', min: 0, max: 1, step: 0.01, ends: ['0°', '90°'], fmt: (v) => Math.round(v * 90) + '°' },
    { key: 'push', type: 'range', label: 'Push on the bolt, or pull the shackle', min: 0, max: 1, step: 0.01, ends: ['no force', 'hard'], fmt: (v) => Math.round(v * 100) + '%' },
  ],
  quiz: [
    { q: 'Why is a deadbolt called "dead"?', options: ['It is broken', 'It has no spring, so it only moves when the cylinder turns', 'It is very heavy', 'It makes no sound'], answer: 1, why: 'A spring latch gives way to a push on its slope. A deadbolt has a square end and no spring.' },
    { q: 'What lets a door latch by itself when you swing it shut?', options: ['A magnet in the frame', 'The key turning on its own', 'The sloped face of the spring latch, which the frame pushes back', 'Air pressure'], answer: 2, why: 'The slope turns the door\'s sideways motion into a push on the bolt. The spring then snaps it out into the strike.' },
    { q: 'In a ball-locking padlock, what holds the shackle shut?', options: ['Glue', 'The spring under the shackle', 'The key itself', 'Two steel balls held out into notches in the shackle by a cam'], answer: 3, why: 'Until the cam turns its flats towards them, the balls cannot move inwards, so the shackle cannot lift.' },
  ],
  reel: [
    { ms: 5600, caption: 'A quarter turn of the plug swings a crank and throws a solid deadbolt 25 mm into the frame.', set: { kind: 'dead', push: 0 }, anim: { turn: [0, 1] }, view: { pos: [3.6, 9.0, 9.4], target: [0.8, 4.2, 0] }, spin: 0 },
    { ms: 5400, caption: 'In a padlock, the cam lets two steel balls slip out of the shackle\'s notches, and it springs open.', set: { kind: 'pad', push: 0 }, anim: { turn: [0, 1] }, view: { pos: [2.2, 5.6, 10.4], target: [0, 4.9, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const steel = () => M.metal(0xd8dde6, { roughness: 0.3 });

    // ---------------------------------------------------------------- deadbolt
    const D = doorSet(18, 135 * DEG);
    const gDead = D.g; gDead.scale.setScalar(S); gDead.position.set(3.2, 4.4, 0); root.add(gDead);
    const dBolt = new THREE.Group(); gDead.add(dBolt);
    const dHead = box(40, 22, 16, steel()); dHead.position.set(-22, 0, 0); dBolt.add(dHead);
    const dTail = box(34, 6, 2.5, M.metal(0xb9bec8)); dTail.position.set(-57, 14, 6); dBolt.add(dTail);
    const dYoke = plate([[-3.5, 3], [3.5, 3], [3.5, 30], [-3.5, 30]], 2.5, M.metal(0xb9bec8), [[[-2.2, 6], [-2.2, 26], [2.2, 26], [2.2, 6]]]);
    dYoke.position.set(-60 + 18 * Math.cos(135 * DEG), 0, 4.8); dBolt.add(dYoke);
    const dLabels = [
      stage.label('Deadbolt', [-18, 16, 8], dBolt, 'hot'),
      stage.label('Crank on the tailpiece', [-60, -16, 4], gDead),
      stage.label('Cylinder and key (outside)', [-60, 26, 34], gDead),
      stage.label('Strike in the frame', [26, -22, 0], gDead),
      stage.label('Thumb-turn (inside)', [-60, -24, -32], gDead),
      stage.label('Door', [-92, -40, 22], gDead),
    ];

    // ---------------------------------------------------------------- spring latch
    const Lt = doorSet(14, 0);
    const gLatch = Lt.g; gLatch.scale.setScalar(S); gLatch.position.copy(gDead.position); root.add(gLatch);
    const lBolt = new THREE.Group(); gLatch.add(lBolt);
    const lHead = plate([[-22, 7], [0, 7], [13, -3], [13, -7], [-22, -7]], 22, steel());   // drawn in (x, −z)
    lHead.geometry.rotateX(-Math.PI / 2); lHead.position.y = -11; lBolt.add(lHead);
    const lBar = rod(-46, -22, 1.6, 1.6, M.metal(0xb9bec8)); lBolt.add(lBar);
    const lPlate = box(2.5, 34, 10, M.metal(0xb9bec8)); lPlate.position.set(-47.3, 0, 2.5); lBolt.add(lPlate);
    const bracket = box(2, 20, 14, M.metal(0x6f7682)); bracket.position.set(-41, 0, 0); gLatch.add(bracket);
    const lSpring = spring(0, 18, 5, 0.7, 6, M.metal(COL.spring)); lSpring.position.x = -40; gLatch.add(lSpring);
    const lLabels = [
      stage.label('Spring latch: sloped face', [2, 17, 0], lBolt, 'hot'),
      stage.label('Spring', [-31, -13, 0], gLatch),
      stage.label('Arm pulls the latch back', [-60, 24, 4], gLatch),
      stage.label('Strike in the frame', [26, -22, 0], gLatch),
      stage.label('Door', [-92, -40, 22], gLatch),
    ];

    // ---------------------------------------------------------------- padlock (1 unit = 11 mm)
    const gPad = new THREE.Group(); gPad.scale.setScalar(0.125); gPad.position.set(0, 3.9, 0); root.add(gPad);
    const pBody = ghost(box(52, 36, 24, M.clear(0xe0b75c, 0.2))); gPad.add(pBody);
    const pEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(52, 36, 24)), new THREE.LineBasicMaterial({ color: 0xe0b75c, transparent: true, opacity: 0.7 })); gPad.add(pEdge);
    const pBack = box(52, 36, 2, M.metal(0xb38a3c, { roughness: 0.5 })); pBack.position.z = -11; gPad.add(pBack);
    const shackle = new THREE.Group(); gPad.add(shackle);
    const sPts = [[-16, -12, 0], [-16, 28, 0]];
    for (let a = 180; a >= 0; a -= 15) sPts.push([16 * Math.cos(a * DEG), 28 + 16 * Math.sin(a * DEG), 0]);
    sPts.push([16, 4, 0]);
    const sMat = M.metal(0xdfe4ec, { roughness: 0.22 });
    const sCurve = new THREE.CatmullRomCurve3(sPts.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.05);
    const sMesh = new THREE.Mesh(new THREE.TubeGeometry(sCurve, 120, 4, 16), sMat); sMesh.castShadow = true; shackle.add(sMesh);
    // Notches in the legs, shown as dark scoops.
    [-1, 1].forEach((k) => { const n = new THREE.Mesh(new THREE.SphereGeometry(3.15, 16, 12), M.matte(0x1a1d24)); n.position.set(k * 10.9, 8, 0); n.scale.set(0.7, 1, 1); shackle.add(n); });
    const pSpring = coilY(10, 3, 0.5, 5, M.metal(COL.spring)); pSpring.position.set(-16, -17.5, 0); gPad.add(pSpring);
    const balls = [-1, 1].map((k) => { const b = new THREE.Mesh(new THREE.SphereGeometry(3, 20, 14), M.metal(0xffffff, { roughness: 0.15 })); b.castShadow = true; gPad.add(b); return b; });
    const pTurn = new THREE.Group(); gPad.add(pTurn);
    // The cam: a round bar with two flats. Its half-width towards a ball is min(7.5, 5 / |sin a|).
    const camPts = Array.from({ length: 73 }, (_, i) => { const a = (i / 72) * Math.PI * 2, r = Math.min(7.5, 5 / Math.max(1e-6, Math.abs(Math.sin(a)))); return [r * Math.cos(a), r * Math.sin(a)]; });
    const cam = plate(camPts, 7, M.metal(0xffb547, { roughness: 0.4 })); cam.geometry.rotateX(-Math.PI / 2); cam.position.y = 4.5; pTurn.add(cam);
    const stem = post(3, 3, M.metal(0xffb547)); stem.position.y = 1.6; pTurn.add(stem);
    const pPlug = post(6.35, 18, M.metal(COL.plug)); pPlug.position.y = -17; pTurn.add(pPlug);
    const pShell = ghost(post(9.5, 17.5, M.clear(0x9fb0c8, 0.3))); pShell.position.y = -17.5; gPad.add(pShell);
    const pKey = cutKey(); pKey.rotation.z = Math.PI / 2; pKey.position.set(-PLUG_R + 4.25, -19, 0); pTurn.add(pKey);
    const pLabels = [
      stage.label('Shackle', [0, 49, 0], shackle, 'hot'),
      stage.label('Steel balls in the notches', [34, 9, 6], gPad),
      stage.label('Cam on the cylinder', [-34, 3, 6], gPad),
      stage.label('Cylinder (pin stacks inside)', [34, -10, 6], gPad),
      stage.label('Shackle spring', [-36, -13, 6], gPad),
    ];

    const push = arrow(0xff7a59, 1, 0.34, 0.06); root.add(push);
    const st = { e: 0, ret: 0, lift: 0, ball: 10.5, ext: 7.5 };
    let lift = 0;
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        const k = s.kind;
        gDead.visible = k === 'dead'; gLatch.visible = k === 'latch'; gPad.visible = k === 'pad';
        const narrow = fitNarrow(stage, []);
        dLabels.forEach((l, i) => { l.visible = k === 'dead' && (!narrow || i < 2); });
        lLabels.forEach((l, i) => { l.visible = k === 'latch' && (!narrow || i < 2); });
        pLabels.forEach((l, i) => { l.visible = k === 'pad' && (!narrow || i < 3); });
        if (k === 'dead') {
          const th = (135 - 90 * s.turn) * DEG;
          D.turnG.rotation.z = -90 * s.turn * DEG;
          st.e = 18 * (Math.cos(th) - Math.cos(135 * DEG));
          dBolt.position.x = st.e;
          const len = 0.6 + 1.0 * s.push;
          push.rotation.set(0, 0, Math.PI / 2); push.set(len);
          push.position.set(gDead.position.x + (st.e - 2) * S + len + 0.06, gDead.position.y, 0);
        } else if (k === 'latch') {
          const th = 85 * s.turn * DEG;
          const byKey = 14 * (1 - Math.cos(th)), byPush = 13 * smooth(s.push);
          st.ret = Math.max(byKey, byPush);
          Lt.turnG.rotation.z = th;
          lBolt.position.x = -st.ret;
          lSpring.scale.x = (18 - st.ret) / 18;
          const len = 0.5 + 0.9 * s.push;
          push.rotation.set(Math.PI / 2, 0, 0); push.set(len);
          push.position.set(gLatch.position.x + (7 - st.ret) * S, gLatch.position.y, (-9 + st.ret * 0.4) * S - len - 0.08);
        } else {
          const a = 90 * s.turn * DEG;
          pTurn.rotation.y = a;
          st.ext = Math.min(7.5, 5 / Math.max(1e-6, Math.abs(Math.sin(a))));
          const free = st.ext + 3 <= 8.3;                    // the flats now face the balls
          lift = approach(lift, free ? 14 : 0, 9, dt);
          st.lift = lift;
          st.ball = lift > 0.05 ? Math.max(st.ext + 3, 10.5 - 2.5 * smooth(lift / 3)) : 10.5;
          balls.forEach((b, i) => b.position.set((i ? 1 : -1) * st.ball, 8, 0));
          shackle.position.y = lift;
          pSpring.scale.y = (5.5 + lift) / 10;
          const len = 0.5 + 0.9 * s.push;
          push.rotation.set(0, 0, 0); push.set(len);
          push.position.set(0, gPad.position.y + (49 + lift) * 0.125, 0);
        }
        push.visible = s.push > 0.02;
      },
      readout: (s) => {
        if (s.kind === 'dead') {
          const out = st.e;
          return `<div class="big ${out > 24 ? 'ok' : ''}">${out > 24 ? 'Deadbolt thrown' : out < 1 ? 'Bolt drawn back' : 'Bolt moving'}</div>
            <div class="row"><span>Key turned</span><b>${Math.round(s.turn * 90)}°</b></div>
            <div class="row"><span>Bolt out of the door</span><b>${out.toFixed(1)} mm</b></div>
            <div class="row"><span>Held by</span><b>the crank, no spring</b></div>
            <small>${s.push > 0.02 ? 'Pushing on the square end does nothing. Only the cylinder or the thumb-turn moves a deadbolt.' : 'A crank pin 18 mm from the centre, swung through 90°, slides the bolt 25 mm.'}</small>`;
        }
        if (s.kind === 'latch') {
          const out = 13 - Math.min(13, st.ret);
          return `<div class="big ${out < 1 ? 'no' : ''}">${out < 1 ? 'Latch pushed in' : 'Latch out'}</div>
            <div class="row"><span>Handle or key turned</span><b>${Math.round(s.turn * 85)}°</b></div>
            <div class="row"><span>Latch out of the door</span><b>${out.toFixed(1)} mm</b></div>
            <div class="row"><span>Held by</span><b>a spring</b></div>
            <small>${s.push > 0.02 ? 'A push on the slope slides the latch back against its spring. That is how a door clicks shut, and why a latch alone is weak.' : 'The spring pushes the latch out again as soon as you let go.'}</small>`;
        }
        const open = st.lift > 10;
        return `<div class="big ${open ? 'ok' : ''}">${open ? 'Shackle open' : 'Shackle locked'}</div>
          <div class="row"><span>Key turned</span><b>${Math.round(s.turn * 90)}°</b></div>
          <div class="row"><span>Cam half-width at the balls</span><b>${st.ext.toFixed(1)} mm</b></div>
          <div class="row"><span>Shackle lifted</span><b>${st.lift.toFixed(0)} mm</b></div>
          <small>${open ? 'The flats face the balls, so they slip inwards and the spring lifts the shackle.' : s.push > 0.02 ? 'Pulling just wedges the balls between the notches and the cam. Nothing moves.' : 'The round part of the cam holds each ball 1.5 mm into its notch.'}</small>`;
      },
    };
  },
};
