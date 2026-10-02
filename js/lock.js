// Shared models and maths for LockClear.
//
// The pin-tumbler cylinder is drawn in millimetres and scaled by the chapter (S = 0.2 units/mm).
// Dimensions follow a common American 5-pin house-door keyway (the Kwikset KW1 depth-and-space
// data in locksmith charts, see lockwiki.com/index.php/Kwikset_Classic):
//   cut spacing 0.150 in = 3.81 mm, shoulder to first cut 0.247 in = 6.27 mm,
//   depth 1 root 0.329 in = 8.36 mm above the blade's bottom edge, each depth 0.023 in = 0.584 mm
//   deeper, six key-pin sizes, and a maximum adjacent cut specification (MACS) of 4.
//   Pin diameter 0.115 in = 2.92 mm and plug diameter 0.500 in = 12.7 mm are the usual sizes
//   for this class of cylinder.
// A 10-depth cylinder uses 0.015 in = 0.381 mm steps (the Schlage Classic figure).
//
// Axes: the plug's axis is X (the key goes in towards +X), the pin stacks stand along +Y, and
// the cylinder is cut in half on the Z = 0 plane: the back half (Z < 0) is solid, the front half
// is a ghost. This file explains how a lock holds shut. It carries no method for defeating one.
import { THREE, M, clamp, approach } from './kit.js';

export const MM = 0.2;                       // scene units per millimetre for the cylinder chapters
export const PLUG_R = 6.35, SHELL_R = 9.0, PIN_R = 1.46;
export const SPACING = 3.81, FIRST = 6.27, ROOT1 = 8.36, STEP = 0.584, BLADE_H = 8.5;
export const FLAT = 1.4;                     // flat width at the bottom of each cut, mm
export const DRIVER_L = 4.6, CHAMBER_TOP = 19.6, BIBLE_TOP = 21, BIBLE_W = 3.4;
export const KEYWAY_TOP = 2.4, REST_Y = -2.2;   // key pins rest on a ledge in the keyway when no key is in
export const EPS = 0.06;                     // mm: how closely a pin stack must meet the shear line

export const COL = {
  shell: 0x6c7584, plug: 0xd2a94e, keyPin: 0xffb547, driver: 0x7aa2ff, spring: 0xdfe4ec,
  wafer: 0x5ce1a9, key: 0xe3e6ec, bad: 0xff4d4d, good: 0x5ce1a9, shear: 0x8ef0ff, steel: 0xb9bec8, dark: 0x2a2e37,
};

// Root height of a cut above the blade's bottom edge, and the key pin that matches it.
export const rootH = (d, step = STEP) => ROOT1 - step * (d - 1);
export const keyPinLen = (d, step = STEP) => 2 * PLUG_R - rootH(d, step);
// Depth step used when a keyway offers D depths: 0.584 mm up to 6 or 7 depths, shrinking to
// 0.381 mm at 10, because all the cuts must fit in about 3.4 mm of blade.
export const stepFor = (D) => Math.min(STEP, 3.43 / (D - 1));
// Biggest jump between neighbouring cuts that still leaves each cut its flat (45° slopes).
export const macsFor = (step) => Math.floor((SPACING - FLAT) / step + 1e-6);

// How many different keys: every position can take any depth (theoretical), or only those whose
// neighbours differ by at most `macs` steps (usable).
export function countKeys(pins, D, macs) {
  let row = new Array(D).fill(1);
  for (let p = 1; p < pins; p++) {
    const next = new Array(D).fill(0);
    for (let a = 0; a < D; a++) for (let b = 0; b < D; b++) if (Math.abs(a - b) <= macs) next[b] += row[a];
    row = next;
  }
  return { theory: Math.pow(D, pins), usable: row.reduce((x, y) => x + y, 0) };
}

// A small seeded random number generator, so the recorded video is the same every time.
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function randomCode(pins, D, macs, seed) {
  const r = rng(seed), c = [1 + Math.floor(r() * D)];
  while (c.length < pins) { const d = 1 + Math.floor(r() * D); if (Math.abs(d - c[c.length - 1]) <= macs && !(c.length === pins - 1 && c.every((x) => x === d))) c.push(d); }
  return c;
}

export const fmtInt = (n) => (n >= 1e15 ? n.toExponential(2).replace('e+', ' × 10^') : Math.round(n).toLocaleString('en'));

// Hide small labels and shift the picture down a little on phones.
export function fitNarrow(stage, minor = [], y = -0.12) {
  const narrow = stage.host.clientWidth < 560;
  minor.forEach((l) => { l.visible = !narrow; });
  const want = narrow ? y : 0;
  if (!stage.shift || stage.shift[1] !== want) stage.setShift(0, want);
  return narrow;
}

const shadow = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };

// Points on a circle in the (sx, y) half-plane used for cross-sections, sx = −z.
const arc = (r, a0, a1, n = 28) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [r * Math.cos(a), r * Math.sin(a)]; });

// Extrude a cross-section drawn in (−z, y) along X from x0 to x1.
export function extrudeX(pts, x0, x1, mat) {
  const sh = new THREE.Shape();
  pts.forEach(([a, b], i) => (i ? sh.lineTo(a, b) : sh.moveTo(a, b)));
  const g = new THREE.ExtrudeGeometry(sh, { depth: x1 - x0, bevelEnabled: false, curveSegments: 4 });
  g.rotateY(Math.PI / 2);                    // shape x → −z, extrusion → +x
  g.translate(x0, 0, 0);
  return shadow(new THREE.Mesh(g, mat));
}

// Extrude an outline drawn in the XY plane (with optional holes) to a thickness along Z.
export function plate(pts, depth, mat, holes = []) {
  const sh = new THREE.Shape();
  pts.forEach(([a, b], i) => (i ? sh.lineTo(a, b) : sh.moveTo(a, b)));
  holes.forEach((h) => { const p = new THREE.Path(); h.forEach(([a, b], i) => (i ? p.lineTo(a, b) : p.moveTo(a, b))); sh.holes.push(p); });
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 8 });
  return shadow(new THREE.Mesh(g, mat));
}
export const circlePts = (cx, cy, r, n = 24, a0 = 0, a1 = Math.PI * 2) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });

// A cylinder standing along Y, its foot at y = 0.
export function post(r, len, mat, seg = 24) {
  const g = new THREE.CylinderGeometry(r, r, len, seg); g.translate(0, len / 2, 0);
  return shadow(new THREE.Mesh(g, mat));
}
// A cylinder along Z, centred.
export function rodZ(r, len, mat, seg = 28) {
  const g = new THREE.CylinderGeometry(r, r, len, seg); g.rotateX(Math.PI / 2);
  return shadow(new THREE.Mesh(g, mat));
}

// A coil spring standing along +Y from y = 0 to y = len. Scale .y to compress it.
export function coilY(len, R, r, turns, mat) {
  const pts = [], N = turns * 16;
  for (let i = 0; i <= N; i++) { const t = i / N, a = t * turns * Math.PI * 2; pts.push(new THREE.Vector3(R * Math.cos(a), len * t, R * Math.sin(a))); }
  return shadow(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N * 2, r, 6), mat));
}

// A key pin: a short cylinder with a blunt cone at the bottom. The tip is at y = 0.
function keyPinMesh(len, mat) {
  const p = [[0, 0], [0.35, 0], [PIN_R, 1.1], [PIN_R, len - 0.18], [PIN_R - 0.18, len], [0, len]];
  const g = new THREE.LatheGeometry(p.map(([r, y]) => new THREE.Vector2(r, y)), 24);
  g.computeVertexNormals();
  return shadow(new THREE.Mesh(g, mat));
}
function flatPin(len, mat) {
  const c = Math.min(0.18, len / 3);
  const p = [[0, 0], [PIN_R - c, 0], [PIN_R, c], [PIN_R, len - c], [PIN_R - c, len], [0, len]];
  const g = new THREE.LatheGeometry(p.map(([r, y]) => new THREE.Vector2(r, y)), 24);
  g.computeVertexNormals();
  return shadow(new THREE.Mesh(g, mat));
}

// The top edge of a key blade, as a height above the blade's bottom edge at distance x from the
// shoulder. Each cut is a flat with 45° slopes; the tip is a ramp that lifts the pins as it enters.
export function keyProfile(roots, xs, tipX, H = BLADE_H, flat = FLAT) {
  return (x) => {
    if (x > tipX) return -99;
    let y = Math.min(H, H / 2 + 1.2 * (tipX - x));
    for (let i = 0; i < xs.length; i++) y = Math.min(y, roots[i] + Math.max(0, Math.abs(x - xs[i]) - flat / 2));
    return y;
  };
}

// A flat key: bow, shoulder and a blade whose top edge follows `profile`. Blade bottom at y = y0.
export function makeKey({ tipX, y0 = -PLUG_R, H = BLADE_H, thick = 2, color = COL.key, bowR = 10 }) {
  const g = new THREE.Group();
  const mat = M.metal(color, { roughness: 0.34 });
  let blade = null;
  g.setProfile = (profile) => {
    if (blade) { g.remove(blade); blade.geometry.dispose(); }
    const pts = [[-1, 0], [tipX - 3.5, 0], [tipX, H / 2]];
    for (let x = tipX; x >= 0; x -= 0.1) pts.push([x, profile(x)]);
    pts.push([0, H], [-1, H]);
    blade = plate(pts, thick, mat); blade.position.set(0, y0, -thick / 2);
    g.add(blade);
  };
  const cy = y0 + H / 2;
  const bow = plate([...circlePts(-bowR - 3, cy, bowR, 40), ], thick, mat, [circlePts(-bowR - 7, cy, 2.4, 20).reverse()]);
  bow.position.z = -thick / 2; g.add(bow);
  const neck = plate([[-5.5, y0 - 1], [0, y0 - 1], [0, y0 + H + 1.2], [-5.5, y0 + H + 1.2]], thick, mat); neck.position.z = -thick / 2; g.add(neck);
  return g;
}

// ---------------------------------------------------------------------------------------------
// The pin-tumbler cylinder.
//   code:    the depth number (1…D) each chamber's key pin is sized for
//   masters: optional array of master-wafer thicknesses in mm (0 for none), one per chamber
export function makeCylinder({ pins = 5, code, step = STEP, masters = null } = {}) {
  const group = new THREE.Group();
  const xs = Array.from({ length: pins }, (_, i) => FIRST + i * SPACING);
  const L = xs[pins - 1] + 5.4, tipX = xs[pins - 1] + 4.4, TRAVEL = tipX + 3;
  const ch = PIN_R + 0.05;                   // half-width of the pin channel on the cut face

  const shellMat = M.metal(COL.shell, { roughness: 0.5, metalness: 0.7 });
  const plugMat = M.metal(COL.plug, { roughness: 0.42, metalness: 0.75 });
  const shellGhost = M.clear(0xb8c4d8, 0.13), plugGhost = M.clear(0xffd98a, 0.16);

  // ---- shell (housing): round body with the "bible" on top that holds the springs and drivers
  const aTop = Math.acos(BIBLE_W / SHELL_R), aIn = Math.acos(ch / PLUG_R);
  const shellPts = [...arc(SHELL_R, -Math.PI / 2, aTop), [BIBLE_W, BIBLE_TOP], [0, BIBLE_TOP], [0, CHAMBER_TOP], [ch, CHAMBER_TOP], ...arc(PLUG_R, aIn, -Math.PI / 2)];
  const shell = new THREE.Group(); group.add(shell);
  shell.add(extrudeX(shellPts, 0, L, shellMat));
  const front = extrudeX(shellPts, 0, L, shellGhost); front.scale.z = -1; front.castShadow = false; shell.add(front);
  // Solid metal between the chambers, on the cut face.
  const gaps = (fn) => { let a = 0; xs.forEach((x) => { fn(a, x - ch); a = x + ch; }); fn(a, L); };
  gaps((a, b) => { const m = shadow(new THREE.Mesh(new THREE.BoxGeometry(b - a, CHAMBER_TOP - PLUG_R, ch), shellMat)); m.position.set((a + b) / 2, (CHAMBER_TOP + PLUG_R) / 2, -ch / 2); shell.add(m); });
  const cap = shadow(new THREE.Mesh(new THREE.BoxGeometry(L - 1.5, 0.8, BIBLE_W * 2), M.metal(0xc9ced8, { roughness: 0.3 }))); cap.position.set(L / 2, BIBLE_TOP + 0.4, 0); group.add(cap);

  // ---- plug: the part that turns. Keyway open at the bottom, pin holes drilled from the top.
  const plugG = new THREE.Group(); group.add(plugG);
  const aKw = -Math.acos(1.0 / PLUG_R);
  const plugPts = [...arc(PLUG_R, aIn, aKw), [1.0, KEYWAY_TOP], [ch, KEYWAY_TOP]];
  plugG.add(extrudeX(plugPts, 0, L + 1.8, plugMat));
  const pFront = extrudeX(plugPts, 0, L + 1.8, plugGhost); pFront.scale.z = -1; pFront.castShadow = false; plugG.add(pFront);
  let a0 = 0; xs.forEach((x) => { addPlugBlock(a0, x - ch); a0 = x + ch; }); addPlugBlock(a0, L + 1.8);
  function addPlugBlock(a, b) { const m = shadow(new THREE.Mesh(new THREE.BoxGeometry(b - a, PLUG_R - KEYWAY_TOP, ch), plugMat)); m.position.set((a + b) / 2, (PLUG_R + KEYWAY_TOP) / 2, -ch / 2); plugG.add(m); }

  // ---- tailpiece and its retaining clip, at the back of the plug
  const camG = new THREE.Group(); group.add(camG);
  const tailMat = M.metal(0xc9ced8, { roughness: 0.35 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.6, 1.4, 32), tailMat); disc.rotation.z = Math.PI / 2; disc.position.x = L + 2.5; camG.add(shadow(disc));
  const tail = shadow(new THREE.Mesh(new THREE.BoxGeometry(13, 1.6, 6.4), tailMat)); tail.position.x = L + 9.6; camG.add(tail);
  const clip = shadow(new THREE.Mesh(new THREE.TorusGeometry(6.6, 0.5, 8, 40, Math.PI * 1.7), M.metal(0x6f7682))); clip.rotation.y = Math.PI / 2; clip.position.x = L + 0.9; group.add(clip);

  // ---- pin stacks
  const keyPins = new THREE.Group(); plugG.add(keyPins);
  const drivers = new THREE.Group(), springs = new THREE.Group(); group.add(drivers, springs);
  const stacks = xs.map((x, i) => {
    const len = keyPinLen(code[i], step), t = masters ? masters[i] || 0 : 0;
    const kMat = M.metal(COL.keyPin, { roughness: 0.4, emissive: new THREE.Color(0) });
    const dMat = M.metal(COL.driver, { roughness: 0.4, emissive: new THREE.Color(0) });
    const kp = keyPinMesh(len, kMat); kp.position.x = x; keyPins.add(kp);
    const dr = flatPin(DRIVER_L, dMat); dr.position.x = x; drivers.add(dr);
    const sp = coilY(8, 1.02, 0.2, 7, M.metal(COL.spring, { roughness: 0.3 })); sp.position.x = x; springs.add(sp);
    let wShell = null, wPlug = null;
    if (t) {
      const wMat = M.metal(COL.wafer, { roughness: 0.4 });
      wShell = flatPin(t, wMat); wShell.position.x = x; drivers.add(wShell);
      wPlug = flatPin(t, wMat); wPlug.position.x = x; wPlug.visible = false; keyPins.add(wPlug);
    }
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8), M.glow(COL.good)); dot.position.set(x, PLUG_R, PIN_R + 0.75); dot.visible = false; group.add(dot);
    return { x, len, t, kp, dr, sp, kMat, dMat, wShell, wPlug, dot };
  });

  // ---- the shear line, drawn as a thin glowing line along the top of the plug
  const shear = new THREE.Mesh(new THREE.BoxGeometry(L + 3, 0.16, 0.16), M.glow(COL.shear, { transparent: true, opacity: 0.9 }));
  shear.position.set(L / 2, PLUG_R, PIN_R + 0.3); group.add(shear);

  // ---- the key
  const key = makeKey({ tipX }); plugG.add(key);
  let profile = null, cutsKey = '';
  const setKey = (cuts) => {
    const k = cuts ? cuts.join(',') : '';
    if (k === cutsKey) return; cutsKey = k;
    key.visible = !!cuts;
    if (cuts) { profile = keyProfile(cuts.map((d) => rootH(d, step)), xs, tipX); key.setProfile(profile); } else profile = null;
  };

  let angle = 0;
  const info = { open: false, gaps: xs.map(() => 0), block: -1, angle: 0, inFull: false };
  // ins: 0 (key outside) … 1 (shoulder against the plug). turn: 0…1 asks for a quarter turn.
  // loose: the parts are apart (exploded view), so nothing rests on anything.
  function update(dt, { ins = 0, turn = 0, loose = false, keyExtra = 0, cut = 1, marks = true } = {}) {
    dt = Math.max(0, dt);
    const off = (1 - ins) * TRAVEL, inFull = ins > 0.995 && !!profile && !loose;
    let open = inFull, block = -1;
    stacks.forEach((s, i) => {
      let yb = REST_Y;
      if (profile && !loose) {
        const xk = s.x + off;
        let c = -99;
        for (let u = -1.4; u <= 1.401; u += 0.1) c = Math.max(c, profile(xk + u) - Math.max(0, Math.abs(u) - 0.35));
        yb = Math.max(REST_Y, -PLUG_R + c);
      }
      const top = yb + s.len;
      const gA = top - PLUG_R, gB = top + s.t - PLUG_R;      // shear at the key pin's top, or at the wafer's top
      const okA = Math.abs(gA) < EPS, okB = s.t > 0 && Math.abs(gB) < EPS;
      s.ok = okA || okB; s.gap = s.t && Math.abs(gB) < Math.abs(gA) ? gB : gA; s.top = top; s.okB = okB;
      info.gaps[i] = s.gap;
      if (!s.ok) { open = false; if (block < 0) block = i; }
    });
    const want = open ? turn * Math.PI / 2 : Math.min(turn, 0.03) * Math.PI / 2;
    angle = approach(angle, want, 14, dt);
    if (Math.abs(angle - want) < 1e-4) angle = want;
    const turned = angle > 0.02;
    plugG.rotation.x = angle; camG.rotation.x = angle;
    key.position.x = -off - keyExtra;
    stacks.forEach((s) => {
      s.kp.position.y = s.top - s.len;
      let db = loose ? PLUG_R : s.top + s.t;
      if (s.t) {
        const inPlug = turned && s.okB;
        s.wPlug.visible = inPlug; s.wShell.visible = !inPlug;
        s.wPlug.position.y = s.top;
        s.wShell.position.y = loose ? PLUG_R : turned ? PLUG_R : s.top;
        if (turned) db = inPlug ? PLUG_R : PLUG_R + s.t;
        else if (loose) db = PLUG_R + s.t;
      } else if (turned) db = PLUG_R;
      s.dr.position.y = db;
      const st = db + DRIVER_L;
      s.sp.position.y = st; s.sp.scale.y = loose ? 0.95 : Math.max(0.15, (CHAMBER_TOP - st) / 8);
      const trying = inFull && turn > 0.02 && !s.ok;
      const kBad = trying && s.gap > 0, dBad = trying && s.gap < 0;
      s.kMat.color.setHex(kBad ? COL.bad : COL.keyPin); s.kMat.emissive.setHex(kBad ? 0x700000 : 0);
      s.dMat.color.setHex(dBad ? COL.bad : COL.driver); s.dMat.emissive.setHex(dBad ? 0x700000 : 0);
      s.dot.visible = marks && inFull && !turned;
      s.dot.material.color.setHex(s.ok ? COL.good : COL.bad);
    });
    shear.visible = marks && !loose;
    const o = cut ? 0.13 : 1;
    shellGhost.opacity = o; shellGhost.depthWrite = !cut; plugGhost.opacity = cut ? 0.16 : 1; plugGhost.depthWrite = !cut;
    Object.assign(info, { open, block, angle, inFull });
    return info;
  }
  setKey(null);
  return { group, shell, cap, plugG, camG, clip, keyPins, drivers, springs, key, stacks, xs, L, tipX, TRAVEL, setKey, update, info, shear };
}

// A flat board with a live canvas on it.
export function board(w, h, pxW, pxH, draw) {
  const c = document.createElement('canvas'); c.width = pxW; c.height = pxH;
  const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, toneMapped: false }));
  let last = null;
  mesh.redraw = (key, ...a) => { if (key === last) return; last = key; draw(g, pxW, pxH, ...a); tex.needsUpdate = true; };
  return mesh;
}
export const panel = (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(7,8,12,.84)'; g.beginPath(); g.roundRect(0, 0, w, h, 22); g.fill(); g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 2; g.stroke(); };

export { clamp };
