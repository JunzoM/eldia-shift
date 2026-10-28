// ELDIA アバター 3D 描画エンジン（three.js r149 / vendor/three.min.js）
// 状態オブジェクト（avatar.html の DEFAULT と同じキー）から 3D のアバターを組み立てる。
(function () {
  "use strict";
  var T = window.THREE;
  if (!T) return;
  T.ColorManagement.legacyMode = false;   // 色コードを sRGB として扱う

  // ---------- 小物 ----------
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ss(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function hexToRgb(h) { h = h.replace("#", ""); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function shade(hex, amt) {
    var c = hexToRgb(hex), t = amt > 0 ? 255 : 0, p = Math.abs(amt);
    return "#" + c.map(function (v) { return Math.round(v + (t - v) * p).toString(16).padStart(2, "0"); }).join("");
  }
  function V(x, y, z) { return new T.Vector3(x, y, z); }

  // 法線をなめらかにするため、同じ位置の頂点をまとめる
  function smooth(geo) {
    var pos = geo.attributes.position, map = {}, verts = [], index = [], i;
    for (i = 0; i < pos.count; i++) {
      var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      var k = Math.round(x * 1e4) + "," + Math.round(y * 1e4) + "," + Math.round(z * 1e4);
      if (map[k] === undefined) { map[k] = verts.length / 3; verts.push(x, y, z); }
      index.push(map[k]);
    }
    if (geo.index) index = Array.prototype.map.call(geo.index.array, function (j) { return index[j]; });
    var g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(verts, 3));
    g.setIndex(index);
    g.computeVertexNormals();
    geo.dispose();
    return g;
  }

  function canvasTex(w, h, draw) {
    var cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    draw(cv.getContext("2d"), w, h);
    var t = new T.CanvasTexture(cv);
    t.encoding = T.sRGBEncoding;
    t.anisotropy = 4;
    return t;
  }

  // ---------- 頭の形 ----------
  var FACES = {
    round:  { wx: 1.00, jaw: 0.16, chin: 1.00, cheek: 0.07 },
    oval:   { wx: 0.94, jaw: 0.22, chin: 1.10, cheek: 0.03 },
    square: { wx: 1.00, jaw: 0.02, chin: 0.97, cheek: 0.05, square: true },
    heart:  { wx: 0.98, jaw: 0.38, chin: 1.08, cheek: 0.02 },
    wide:   { wx: 1.08, jaw: 0.10, chin: 0.95, cheek: 0.11 }
  };
  var RY = 1.12;

  // 単位球上の向き n → 頭の表面の点
  function headPos(n, f, out) {
    out = out || new T.Vector3();
    var low = ss(0.1, -1, n.y);
    var x = n.x * f.wx * (1 - f.jaw * low);
    var y = n.y * RY * (n.y < 0 ? f.chin : 1);
    var z = n.z * (n.z > 0 ? 0.97 : 1.06) * (1 - 0.08 * low);
    x += Math.sign(n.x) * f.cheek * Math.exp(-Math.pow((n.y + 0.35) / 0.3, 2)) * Math.abs(n.x) * (n.z > 0 ? 1 : 0.4);
    if (f.square) y *= 1 - 0.08 * low * low;
    return out.set(x, y, z);
  }

  function sphereGeo(ws, hs) { var g = new T.SphereGeometry(1, ws, hs); g.rotateY(-Math.PI / 2); return g; }  // つなぎ目を後ろへ

  function headGeo(f, ws, hs) {
    var g = sphereGeo(ws, hs), p = g.attributes.position, n = new T.Vector3(), o = new T.Vector3();
    for (var i = 0; i < p.count; i++) { n.fromBufferAttribute(p, i); headPos(n, f, o); p.setXYZ(i, o.x, o.y, o.z); }
    g.computeVertexNormals();
    return g;
  }

  // 頭にかぶさる「殻」（髪・ひげ）。mask(n) > 0 の部分だけ残し、境目は肌に沿って薄くなる
  function shellGeo(f, mask, thick, opt) {
    opt = opt || {};
    var g = sphereGeo(160, 120), p = g.attributes.position, n = new T.Vector3(), o = new T.Vector3();
    var m = new Float32Array(p.count), soft = opt.soft || 0.12;
    for (var i = 0; i < p.count; i++) {
      n.fromBufferAttribute(p, i);
      var mv = mask(n); m[i] = mv;
      var t;
      if (mv >= 0) {
        var k = ss(0, soft, mv);
        t = 0.006 + thick * k;
        if (opt.ridge) t += opt.ridge * k * Math.pow(0.5 + 0.5 * Math.sin(Math.atan2(n.x, n.z) * (opt.ridgeN || 15) + n.y * 3), 2);
        if (opt.bump) t += opt.bump(n) * k;
      } else t = Math.max(-0.06, 0.006 + mv * 1.2);
      headPos(n, f, o).multiplyScalar(1 + t);
      p.setXYZ(i, o.x, o.y, o.z);
    }
    g.computeVertexNormals();
    var idx = g.index.array, keep = [];
    for (i = 0; i < idx.length; i += 3) {
      if (Math.max(m[idx[i]], m[idx[i + 1]], m[idx[i + 2]]) > -0.05) keep.push(idx[i], idx[i + 1], idx[i + 2]);
    }
    g.setIndex(keep);
    return g;
  }

  // 生えぎわの高さ（前・横・後ろ）をなめらかにつなぐ
  function line3(front, side, back) {
    return function (n) {
      var a = Math.abs(Math.atan2(n.x, n.z)) / Math.PI;
      return a < 0.5 ? lerp(front, side, ss(0, 0.5, a)) : lerp(side, back, ss(0.5, 1, a));
    };
  }
  function hairMask(front, side, back) { var L = line3(front, side, back); return function (n) { return n.y - L(n); }; }

  // 肩まで落ちる髪（厚みと丸みのある筒）
  function curtainGeo(f, yTop, yBot, r, gap, flare) {
    var sh = new T.Shape(), a0 = gap, a1 = Math.PI * 2 - gap, th = 0.13, seg = 64, i;
    for (i = 0; i <= seg; i++) { var a = lerp(a0, a1, i / seg); var x = r * Math.sin(a), y = r * Math.cos(a); if (i) sh.lineTo(x, y); else sh.moveTo(x, y); }
    for (i = seg; i >= 0; i--) { var b = lerp(a0, a1, i / seg); sh.lineTo((r - th) * Math.sin(b), (r - th) * Math.cos(b)); }
    var h = yTop - yBot;
    var g = new T.ExtrudeGeometry(sh, { depth: h, steps: 24, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4, curveSegments: 12 });
    g.rotateX(Math.PI / 2);
    g.translate(0, yTop, 0);
    var p = g.attributes.position;
    for (i = 0; i < p.count; i++) {
      var X = p.getX(i), Y = p.getY(i), Z = p.getZ(i), az = Math.atan2(X, Z), t = clamp((yTop - Y) / h, 0, 1.1);
      var s = (1 + flare * ss(0, 1, t)) * (1 + 0.018 * Math.sin(az * 18));
      if (t > 0.85) s *= 1 - 0.08 * ss(0.85, 1.05, t);
      Y += 0.05 * Math.sin(az * 9) * ss(0.88, 1.05, t);
      p.setXYZ(i, X * s * f.wx, Y, Z * s);
    }
    return smooth(g);
  }

  // フィボナッチ球（毛束やカールを均等に並べる）
  function fib(count) {
    var out = [], g = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < count; i++) {
      var y = 1 - (i / (count - 1)) * 2, r = Math.sqrt(1 - y * y), th = g * i;
      out.push(V(Math.cos(th) * r, y, Math.sin(th) * r));
    }
    return out;
  }

  // ---------- 2D 部品のテクスチャ ----------
  function irisTex(color, kind) {
    return canvasTex(1024, 512, function (c, w, h) {
      var sg = c.createLinearGradient(0, 0, w, 0);
      sg.addColorStop(0, "#E9DCDA"); sg.addColorStop(0.25, "#FFFFFF"); sg.addColorStop(0.5, "#EAD9D6"); sg.addColorStop(1, "#E9DCDA");
      c.fillStyle = sg; c.fillRect(0, 0, w, h);
      var cx = w * 0.25, cy = h / 2, R = kind === "big" ? 128 : kind === "surprise" ? 80 : 118;
      var g = c.createRadialGradient(cx, cy + R * 0.35, R * 0.1, cx, cy, R);
      g.addColorStop(0, shade(color, 0.55)); g.addColorStop(0.55, color); g.addColorStop(0.9, shade(color, -0.35)); g.addColorStop(1, shade(color, -0.6));
      c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();
      c.strokeStyle = shade(color, 0.3); c.globalAlpha = 0.35; c.lineWidth = 3;
      for (var i = 0; i < 40; i++) { var a = i / 40 * Math.PI * 2; c.beginPath(); c.moveTo(cx + Math.cos(a) * R * 0.45, cy + Math.sin(a) * R * 0.45); c.lineTo(cx + Math.cos(a) * R * 0.88, cy + Math.sin(a) * R * 0.88); c.stroke(); }
      c.globalAlpha = 1;
      c.fillStyle = "#0B0705"; c.beginPath(); c.arc(cx, cy, R * (kind === "surprise" ? 0.38 : 0.44), 0, Math.PI * 2); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.ellipse(cx - R * 0.32, cy - R * 0.34, R * 0.2, R * 0.22, 0, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 0.85; c.beginPath(); c.arc(cx + R * 0.38, cy + R * 0.4, R * 0.09, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    });
  }

  function mouthTex(kind, lip) {
    return canvasTex(512, 256, function (c) {
      c.translate(256, 92); c.scale(3.6, 3.6); c.lineCap = "round"; c.lineJoin = "round";
      var dark = "#5E1A22", tongue = "#EE8B95";
      function fillClip(path, inner) { c.save(); c.fillStyle = dark; c.fill(path); c.clip(path); inner(); c.restore(); c.strokeStyle = lip; c.lineWidth = 3; c.stroke(path); }
      var p;
      switch (kind) {
        case "closed":
          c.strokeStyle = shade(lip, -0.25); c.lineWidth = 6; c.beginPath(); c.moveTo(-26, -2); c.quadraticCurveTo(0, 20, 26, -2); c.stroke();
          break;
        case "grin":
          p = new Path2D("M-34 -8 Q0 40 34 -8 Q0 4 -34 -8Z");
          fillClip(p, function () { c.fillStyle = "#fff"; c.fillRect(-40, -12, 80, 18); c.fillStyle = tongue; c.beginPath(); c.ellipse(0, 26, 16, 9, 0, 0, 7); c.fill(); });
          break;
        case "laugh":
          p = new Path2D("M-36 -10 Q0 56 36 -10 Q0 -4 -36 -10Z");
          fillClip(p, function () { c.fillStyle = "#fff"; c.fillRect(-40, -14, 80, 14); c.fillStyle = tongue; c.beginPath(); c.ellipse(0, 34, 20, 13, 0, 0, 7); c.fill(); });
          break;
        case "neutral":
          c.strokeStyle = shade(lip, -0.2); c.lineWidth = 6; c.beginPath(); c.moveTo(-18, 2); c.quadraticCurveTo(0, 6, 18, 2); c.stroke();
          break;
        case "o":
          p = new Path2D("M0 -14 C12 -14 14 -2 14 4 C14 14 8 20 0 20 C-8 20 -14 14 -14 4 C-14 -2 -12 -14 0 -14Z");
          fillClip(p, function () { c.fillStyle = tongue; c.beginPath(); c.ellipse(0, 18, 10, 6, 0, 0, 7); c.fill(); });
          break;
        case "tongue":
          c.fillStyle = tongue; c.beginPath(); c.moveTo(-11, 2); c.quadraticCurveTo(-12, 28, 0, 28); c.quadraticCurveTo(12, 28, 11, 2); c.fill();
          c.strokeStyle = shade(tongue, -0.2); c.lineWidth = 2; c.beginPath(); c.moveTo(0, 8); c.lineTo(0, 18); c.stroke();
          c.strokeStyle = shade(lip, -0.2); c.lineWidth = 6; c.beginPath(); c.moveTo(-26, -2); c.quadraticCurveTo(0, 12, 26, -2); c.stroke();
          break;
        case "smirk":
          c.strokeStyle = shade(lip, -0.2); c.lineWidth = 6; c.beginPath(); c.moveTo(-18, 4); c.quadraticCurveTo(6, 10, 24, -8); c.stroke();
          break;
        case "cat":
          c.strokeStyle = shade(lip, -0.2); c.lineWidth = 5; c.beginPath(); c.moveTo(-22, -4); c.quadraticCurveTo(-14, 10, 0, 0); c.quadraticCurveTo(14, 10, 22, -4); c.stroke();
          break;
        default: // smile
          p = new Path2D("M-30 -6 Q0 44 30 -6 Q0 2 -30 -6Z");
          fillClip(p, function () { c.fillStyle = "#fff"; c.beginPath(); c.moveTo(-34, -10); c.quadraticCurveTo(0, 12, 34, -10); c.fill(); c.fillStyle = tongue; c.beginPath(); c.ellipse(0, 28, 17, 10, 0, 0, 7); c.fill(); });
      }
    });
  }

  function blushTex() {
    return canvasTex(256, 128, function (c) {
      [64, 192].forEach(function (x) {
        var g = c.createRadialGradient(x, 64, 0, x, 64, 60);
        g.addColorStop(0, "rgba(255,105,125,.55)"); g.addColorStop(1, "rgba(255,105,125,0)");
        c.fillStyle = g; c.fillRect(0, 0, 256, 128);
      });
    });
  }
  function frecklesTex(skin) {
    return canvasTex(256, 128, function (c) {
      c.fillStyle = shade(skin, -0.45); c.globalAlpha = 0.6;
      [[40, 60], [60, 52], [52, 74], [76, 66], [30, 78], [70, 84]].forEach(function (p) {
        [p[0], 256 - p[0]].forEach(function (x) { c.beginPath(); c.arc(x, p[1], 3.2, 0, 7); c.fill(); });
      });
    });
  }
  function suitTex(color) {
    return canvasTex(256, 256, function (c) {
      c.fillStyle = "#F7F7F7"; c.beginPath(); c.moveTo(78, 0); c.lineTo(128, 140); c.lineTo(178, 0); c.fill();
      c.fillStyle = "#C23B2A"; c.beginPath(); c.moveTo(118, 18); c.lineTo(138, 18); c.lineTo(146, 150); c.lineTo(128, 172); c.lineTo(110, 150); c.fill();
      c.fillStyle = "#9C2A1C"; c.fillRect(116, 4, 24, 16);
      c.strokeStyle = shade(color, -0.45); c.lineWidth = 5; c.beginPath(); c.moveTo(78, 0); c.lineTo(128, 140); c.lineTo(178, 0); c.stroke();
    });
  }
  function vneckTex(skin, color) {
    return canvasTex(256, 256, function (c) {
      c.fillStyle = skin; c.beginPath(); c.moveTo(70, 0); c.lineTo(128, 120); c.lineTo(186, 0); c.fill();
      c.strokeStyle = shade(color, -0.25); c.lineWidth = 10; c.lineJoin = "round"; c.beginPath(); c.moveTo(70, 0); c.lineTo(128, 120); c.lineTo(186, 0); c.stroke();
    });
  }

  // ---------- 環境（映り込み） ----------
  function makeEnv(renderer) {
    var sc = new T.Scene();
    var geo = new T.SphereGeometry(10, 32, 16), cols = [], p = geo.attributes.position;
    for (var i = 0; i < p.count; i++) { var y = p.getY(i) / 10, c = new T.Color().setRGB(lerp(0.35, 1, ss(-1, 1, y)), lerp(0.32, 0.98, ss(-1, 1, y)), lerp(0.3, 0.95, ss(-1, 1, y))); cols.push(c.r, c.g, c.b); }
    geo.setAttribute("color", new T.Float32BufferAttribute(cols, 3));
    sc.add(new T.Mesh(geo, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
    [[4, 5, 6, 4], [-6, 2, 4, 2], [0, 4, -7, 2.5]].forEach(function (a) {
      var m = new T.Mesh(new T.PlaneGeometry(4, 3), new T.MeshBasicMaterial({ color: new T.Color(a[3], a[3], a[3]), side: T.DoubleSide }));
      m.position.set(a[0], a[1], a[2]); m.lookAt(0, 0, 0); sc.add(m);
    });
    var pm = new T.PMREMGenerator(renderer);
    var tex = pm.fromScene(sc, 0.04).texture;
    pm.dispose();
    return tex;
  }

  function makeRenderer(canvas, size) {
    var r = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setPixelRatio(1);
    r.setSize(size, size, false);
    r.outputEncoding = T.sRGBEncoding;
    r.toneMapping = T.ACESFilmicToneMapping;
    r.toneMappingExposure = 0.95;
    r.shadowMap.enabled = true;
    r.shadowMap.type = T.PCFSoftShadowMap;
    return r;
  }

  function makeScene(renderer) {
    var sc = new T.Scene();
    sc.environment = makeEnv(renderer);
    sc.add(new T.HemisphereLight(0xfff6ee, 0x6a5a52, 0.35));
    var key = new T.DirectionalLight(0xfff4ea, 1.5);
    key.position.set(2.2, 3.2, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    var sc2 = key.shadow.camera; sc2.left = -2.6; sc2.right = 2.6; sc2.top = 2.6; sc2.bottom = -2.6; sc2.near = 0.5; sc2.far = 15;
    key.shadow.bias = -0.0004; key.shadow.normalBias = 0.025;
    sc.add(key);
    var fill = new T.DirectionalLight(0xffe8dc, 0.45); fill.position.set(-4, 0.5, 3); sc.add(fill);
    var rim = new T.DirectionalLight(0xd6e6ff, 0.9); rim.position.set(0, 2.5, -5); sc.add(rim);
    return sc;
  }

  // ---------- アバター組み立て ----------
  var ray = new T.Raycaster(), DOWN = V(0, 0, -1);

  function build(s) {
    var f = FACES[s.face] || FACES.round;
    var root = new T.Group(), pivot = new T.Group(), head = new T.Group(), body = new T.Group();
    pivot.position.y = -0.9; head.position.y = 0.9;
    pivot.add(head); root.add(body); root.add(pivot);

    var mats = [];
    function M(o) { var m = new T.MeshPhysicalMaterial(o); mats.push(m); return m; }
    function std(color, rough, extra) { return M(Object.assign({ color: color, roughness: rough == null ? 0.5 : rough, envMapIntensity: 0.35 }, extra || {})); }
    function mesh(g, m, parent) { var x = new T.Mesh(g, m); x.castShadow = true; x.receiveShadow = true; (parent || head).add(x); return x; }

    var skinM = std(s.skin, 0.55, { sheen: 0.35, sheenRoughness: 0.5, sheenColor: new T.Color("#ff8c78") });
    var hairM = std(s.hairColor, 0.45, { sheen: 0.25, sheenRoughness: 0.35, sheenColor: new T.Color(shade(s.hairColor, 0.35)), clearcoat: 0.3, clearcoatRoughness: 0.35 });
    var hairDarkM = std(shade(s.hairColor, -0.1), 0.6);
    var clothM = std(s.clothesColor, 0.8, { sheen: 0.4, sheenRoughness: 0.8, sheenColor: new T.Color(shade(s.clothesColor, 0.3)) });
    var hatM = std(s.hatColor, 0.65, { sheen: 0.6, sheenColor: new T.Color(shade(s.hatColor, 0.4)) });

    // 頭
    var hg = headGeo(f, 128, 96);
    mesh(hg, skinM);
    // 表面さがし用の粗い頭（描画しない）
    var probe = new T.Mesh(headGeo(f, 64, 48), new T.MeshBasicMaterial());
    probe.updateMatrixWorld(true);
    function surf(x, y) {
      ray.set(V(x, y, 5), DOWN);
      var h = ray.intersectObject(probe)[0];
      if (!h) return { p: V(x, y, 0), n: V(0, 0, 1) };
      return { p: h.point.clone(), n: h.face.normal.clone() };
    }
    function conformPlane(target, cx, cy, w, hgt, off, sx, sy) {
      var g = new T.PlaneGeometry(w, hgt, sx || 24, sy || 16), p = g.attributes.position;
      for (var i = 0; i < p.count; i++) {
        ray.set(V(cx + p.getX(i), cy + p.getY(i), 6), DOWN);
        var h = ray.intersectObject(target)[0];
        if (h) { var q = h.point.addScaledVector(h.face.normal, off); p.setXYZ(i, q.x, q.y, q.z); }
        else p.setXYZ(i, cx + p.getX(i), cy + p.getY(i), 0);
      }
      g.computeVertexNormals();
      return g;
    }
    function decal(tex, geo, parent, rough) {
      var m = M({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, roughness: rough || 0.55, envMapIntensity: 0.4 });
      var x = new T.Mesh(geo, m); x.receiveShadow = true; (parent || head).add(x); return x;
    }

    // ほお・口・そばかす
    if (s.blush) decal(blushTex(), conformPlane(probe, 0, -0.36, 1.5, 0.5, 0.008, 40, 14));
    if (s.freckles) decal(frecklesTex(s.skin), conformPlane(probe, 0, -0.26, 1.3, 0.45, 0.009, 40, 14));
    decal(mouthTex(s.mouth, s.lip), conformPlane(probe, 0, -0.6, 0.8, 0.4, 0.006, 28, 14), head, 0.35);

    // 耳
    var hairDef = HAIR[s.hair] || HAIR.none;
    if (!hairDef.coverEars) [-1, 1].forEach(function (d) {
      var c = headPos(V(d, -0.08, -0.06).normalize(), f);
      var ear = mesh(new T.SphereGeometry(1, 32, 24), skinM); ear.scale.set(0.09, 0.2, 0.14); ear.position.set(c.x + d * 0.02, c.y, c.z); ear.rotation.y = d * 0.35;
      var inner = mesh(new T.SphereGeometry(1, 24, 16), std(shade(s.skin, -0.12), 0.6)); inner.scale.set(0.04, 0.13, 0.08); inner.position.set(c.x + d * 0.08, c.y, c.z + 0.02); inner.rotation.y = d * 0.35;
      head.userData["ear" + d] = V(c.x + d * 0.06, c.y - 0.17, c.z + 0.03);
    });
    else [-1, 1].forEach(function (d) { var c = headPos(V(d, -0.08, -0.06).normalize(), f); head.userData["ear" + d] = V(c.x + d * 0.05, c.y - 0.17, c.z + 0.03); });

    // 鼻
    var ns = { small: [0.1, 0.075, 0.09], round: [0.13, 0.1, 0.11], tall: [0.085, 0.13, 0.12], wide: [0.15, 0.075, 0.085], dot: [0.06, 0.05, 0.05] }[s.nose] || [0.1, 0.075, 0.09];
    var np = surf(0, -0.33);
    var nose = mesh(new T.SphereGeometry(1, 32, 24), skinM); nose.scale.set(ns[0], ns[1], ns[2]); nose.position.copy(np.p).add(V(0, s.nose === "tall" ? 0.03 : 0, -ns[2] * 0.25));

    // 目
    var eyeR = s.eyes === "big" ? 0.25 : 0.23, EX = 0.39, EYY = -0.06;
    var irisT = irisTex(s.eyeColor, s.eyes);
    var eyeM = M({ map: irisT, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.2 });
    var lashM = std("#1E1410", 0.5);
    var lidOpen = { normal: -0.8, big: -0.85, lashes: -0.8, sleepy: -0.25, smile: 0.62, wink: -0.8, surprise: -1.05, line: 0.42 }[s.eyes];
    if (lidOpen == null) lidOpen = -0.8;
    var eyes = [];
    [-1, 1].forEach(function (d) {
      var sp = surf(d * EX, EYY), c = V(d * EX, EYY, sp.p.z - eyeR * 0.45);
      var g = new T.Group(); g.position.copy(c); head.add(g);
      var ball = mesh(new T.SphereGeometry(eyeR, 48, 32), eyeM, g);
      ball.rotation.y = d * 0.12;
      // 上まぶた（肌の殻）とまつげ
      var lidG = new T.Group(); g.add(lidG);
      var TL = 1.95;
      mesh(new T.SphereGeometry(eyeR * 1.07, 48, 24, 0, Math.PI * 2, 0, TL), skinM, lidG);
      var lashR = eyeR * 1.07 * Math.sin(TL), lashY = eyeR * 1.07 * Math.cos(TL);
      var lash = mesh(new T.TorusGeometry(lashR, 0.022, 10, 48, Math.PI), lashM, lidG);
      lash.rotation.x = Math.PI / 2; lash.position.y = lashY;
      var wing = mesh(new T.CapsuleGeometry(0.014, 0.05, 4, 8), lashM, lidG);
      wing.position.set(d * lashR * 0.98, lashY + 0.02, 0.03); wing.rotation.z = -d * 0.9;
      if (s.eyes === "lashes") [0.75, 0.55, 0.32].forEach(function (a, i) {
        var l = mesh(new T.CapsuleGeometry(0.01, 0.06, 4, 8), lashM, lidG);
        var ang = d > 0 ? a : Math.PI - a;
        l.position.set(Math.cos(ang) * lashR, lashY + 0.04, Math.sin(ang) * lashR); l.rotation.z = -d * (0.6 + i * 0.2); l.rotation.x = 0.3;
      });
      // 下まぶた
      var low = new T.Group(); g.add(low);
      mesh(new T.SphereGeometry(eyeR * 1.03, 48, 16, 0, Math.PI * 2, 0, 0.75), skinM, low);
      low.rotation.x = Math.PI + (s.eyes === "smile" ? -0.55 : 0.35);
      var open = (s.eyes === "wink" && d > 0) ? 0.62 : lidOpen;
      lidG.rotation.x = open;
      eyes.push({ group: g, ball: ball, lid: lidG, open: open });
    });

    // 眉
    var BR = { natural: [[-17, 4], [-2, -5], [17, -1]], thick: [[-18, 4], [-2, -6], [18, 0]], thin: [[-16, 3], [-2, -5], [16, -1]],
      straight: [[-17, 1], [0, 0], [17, 0]], angry: [[-17, -5], [0, 0], [17, 6]], worried: [[-17, 4], [0, 2], [16, -7]] }[s.brows] || [[-17, 4], [-2, -5], [17, -1]];
    var bw = { thick: 0.042, thin: 0.018, natural: 0.03, straight: 0.032, angry: 0.034, worried: 0.03 }[s.brows] || 0.03;
    var browY = (s.eyes === "surprise" || s.eyes === "big") ? 0.32 : 0.28;
    var browM = std(s.hair === "none" ? shade(s.skin, -0.45) : shade(s.hairColor, s.hairColor.toUpperCase() === "#F2F2F2" ? -0.25 : -0.1), 0.6);
    [-1, 1].forEach(function (d) {
      // 左眉は定義どおり、右眉は左右反転
      var pts = BR.map(function (q) { var sp = surf(d * EX + (d < 0 ? q[0] : -q[0]) * 0.0085, browY - q[1] * 0.0085); return sp.p.addScaledVector(sp.n, 0.012); });
      var curve = new T.CatmullRomCurve3(pts);
      var tg = new T.TubeGeometry(curve, 32, bw, 10, false), tp = tg.attributes.position;
      // 端を細く
      var segs = 33, rad = 11;
      for (var i = 0; i < tp.count; i++) {
        var u = Math.floor(i / rad) / (segs - 1), c = curve.getPointAt(Math.min(u, 1)), k = 0.35 + 0.65 * Math.sin(Math.PI * clamp(u * 0.9 + 0.1, 0, 1));
        tp.setXYZ(i, c.x + (tp.getX(i) - c.x) * k, c.y + (tp.getY(i) - c.y) * k * 0.7, c.z + (tp.getZ(i) - c.z) * k * 0.5);
      }
      tg.computeVertexNormals();
      mesh(tg, browM);
    });

    // 髪
    var hatOn = s.hat === "cap" || s.hat === "beanie" || s.hat === "hat";
    hairDef.make(f, { head: head, mesh: mesh, hairM: hairM, hairDarkM: hairDarkM, std: std, hatOn: hatOn, s: s });

    // ひげ
    var BEARD = {
      full: function (n) { var L = -0.4 + 0.16 * Math.min(1, Math.abs(n.x) / 0.6); var mouth = Math.pow(n.x / 0.24, 2) + Math.pow((n.y + 0.53) / 0.1, 2) - 1; return Math.min(L - n.y, n.z + 0.3, mouth * 0.08); },
      mustache: function (n) { return Math.min(0.26 - Math.abs(n.x) * (1 + 0.6 * (n.y + 0.4)), n.y + 0.47 - 0.15 * Math.abs(n.x), -0.37 - n.y - 0.1 * Math.abs(n.x), n.z - 0.4); },
      chin: function (n) { return Math.min(0.17 - Math.abs(n.x), -0.66 - n.y, n.z - 0.2); }
    };
    if (s.beard === "full") mesh(shellGeo(f, BEARD.full, 0.06, { soft: 0.1, ridge: 0.01, ridgeN: 40 }), hairM);
    if (s.beard === "stubble") mesh(shellGeo(f, BEARD.full, 0.003, { soft: 0.1 }), std(shade(s.hairColor, -0.2), 1, { transparent: true, opacity: 0.2 }));
    if (s.beard === "mustache" || s.beard === "goatee") mesh(shellGeo(f, BEARD.mustache, 0.05, { soft: 0.04 }), hairM);
    if (s.beard === "goatee") mesh(shellGeo(f, BEARD.chin, 0.07, { soft: 0.06 }), hairM);

    // メガネ
    if (s.glasses !== "none") {
      var gm = std(s.glassesColor, 0.25, { clearcoat: 0.6, metalness: s.glassesColor === "#C9A227" || s.glassesColor === "#BBBBBB" ? 0.8 : 0 });
      var gz = eyes[0].group.position.z + eyeR + 0.07;
      var lens = [];
      [-1, 1].forEach(function (d) {
        var cx = d * EX, pts = [], i;
        if (s.glasses === "round") for (i = 0; i < 40; i++) { var a = i / 40 * Math.PI * 2; pts.push(V(cx + Math.cos(a) * 0.28, EYY + Math.sin(a) * 0.28, gz)); }
        else if (s.glasses === "sun") for (i = 0; i < 40; i++) { var b = i / 40 * Math.PI * 2; pts.push(V(cx + Math.cos(b) * 0.27, EYY + 0.02 + Math.sin(b) * (Math.sin(b) > 0 ? 0.19 : 0.25), gz)); }
        else { var w = 0.27, h = 0.2, rr = 0.07; [[w, h], [-w, h], [-w, -h], [w, -h]].forEach(function (q, j) { for (i = 0; i < 6; i++) { var a2 = (j * 90 + i * 18) * Math.PI / 180; pts.push(V(cx + Math.sign(q[0]) * (w - rr) + Math.cos(a2) * rr, EYY + Math.sign(q[1]) * (h - rr) + Math.sin(a2) * rr, gz)); } }); }
        pts.forEach(function (p) { p.z -= 0.08 * p.x * p.x; });   // 顔の丸みに沿わせる
        var curve = new T.CatmullRomCurve3(pts, true);
        if (s.glasses === "half") { var top = pts.filter(function (p) { return p.y > EYY + 0.02; }); mesh(new T.TubeGeometry(new T.CatmullRomCurve3(top.sort(function (a, b) { return a.x - b.x; })), 32, 0.03, 10, false), gm); mesh(new T.TubeGeometry(curve, 80, 0.008, 6, true), gm); }
        else mesh(new T.TubeGeometry(curve, 80, 0.022, 10, true), gm);
        lens.push(pts);
        // つる
        var ear = head.userData["ear" + d];
        var outer = V(cx + d * 0.28, EYY + 0.06, gz - 0.06);
        mesh(new T.TubeGeometry(new T.CatmullRomCurve3([outer, V(d * (Math.abs(ear.x) - 0.04), EYY + 0.07, gz - 0.4), V(ear.x - d * 0.02, ear.y + 0.19, ear.z - 0.12)]), 24, 0.016, 8, false), gm);
      });
      mesh(new T.TubeGeometry(new T.CatmullRomCurve3([V(-EX + 0.27, EYY + 0.05, gz - 0.005), V(0, EYY + 0.1, gz + 0.02), V(EX - 0.27, EYY + 0.05, gz - 0.005)]), 16, 0.02, 8, false), gm);
      lens.forEach(function (pts) {
        var sh = new T.Shape(pts.map(function (p) { return new T.Vector2(p.x, p.y); }));
        var lg = new T.ShapeGeometry(sh, 24); lg.translate(0, 0, gz - 0.01);
        var lm = s.glasses === "sun" ? M({ color: "#15181D", roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.88, envMapIntensity: 1.4 })
                                     : M({ color: "#ffffff", roughness: 0.05, transparent: true, opacity: 0.08, envMapIntensity: 1.2, depthWrite: false });
        var lx = new T.Mesh(lg, lm); head.add(lx);
      });
    }

    // 帽子
    var top = headPos(V(0, 1, 0), f).y;
    switch (s.hat) {
      case "cap": {
        var cg = new T.SphereGeometry(1, 64, 32, 0, Math.PI * 2, 0, 1.5); var cap = mesh(cg, hatM); cap.scale.set(1.12 * f.wx, 1.08, 1.12); cap.position.y = 0.2;
        var bs = new T.Shape(); bs.moveTo(-0.8, 0); bs.quadraticCurveTo(-0.75, 0.75, 0, 0.8); bs.quadraticCurveTo(0.75, 0.75, 0.8, 0); bs.quadraticCurveTo(0, 0.2, -0.8, 0);
        var brim = mesh(new T.ExtrudeGeometry(bs, { depth: 0.03, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3, curveSegments: 24 }), std(shade(s.hatColor, -0.15), 0.6));
        brim.rotation.x = Math.PI / 2 + 0.18; brim.position.set(0, 0.36, 0.72);
        var btn = mesh(new T.SphereGeometry(0.07, 16, 12), hatM); btn.position.y = 0.2 + 1.08;
        break;
      }
      case "beanie": {
        var bg = mesh(new T.SphereGeometry(1, 64, 32, 0, Math.PI * 2, 0, 1.55), hatM); bg.scale.set(1.13 * f.wx, 1.05, 1.13); bg.position.y = 0.32;
        var band = new T.CylinderGeometry(1.17, 1.19, 0.34, 96, 1, true), bp = band.attributes.position;
        for (var i = 0; i < bp.count; i++) { var az = Math.atan2(bp.getX(i), bp.getZ(i)), k = 1 + 0.015 * Math.cos(az * 60); bp.setXYZ(i, bp.getX(i) * k * f.wx, bp.getY(i), bp.getZ(i) * k); }
        band.computeVertexNormals();
        var bm = mesh(band, std(shade(s.hatColor, -0.12), 0.85, { side: T.DoubleSide })); bm.position.y = 0.42;
        var pom = mesh(new T.IcosahedronGeometry(0.24, 3), std(shade(s.hatColor, 0.25), 1)); pom.position.y = 0.32 + 1.05 + 0.12;
        break;
      }
      case "hat": {
        var crown = mesh(new T.CylinderGeometry(0.78, 0.88, 0.6, 64), hatM); crown.position.y = 1.0;
        var brim2 = mesh(new T.CylinderGeometry(1.65, 1.65, 0.04, 64), std(shade(s.hatColor, -0.1), 0.65)); brim2.position.y = 0.72; brim2.scale.z = 0.92;
        var rib = mesh(new T.CylinderGeometry(0.885, 0.885, 0.14, 64, 1, true), std("#2A2A2A", 0.5)); rib.position.y = 0.8;
        break;
      }
      case "ribbon": {
        var rm = std(s.hatColor, 0.35, { sheen: 1, sheenColor: new T.Color(shade(s.hatColor, 0.5)) }), rg = new T.Group();
        rg.position.copy(headPos(V(0.45, 0.82, 0.35).normalize(), f).multiplyScalar(1.08)); rg.rotation.set(0.2, 0.3, -0.5); head.add(rg);
        [-1, 1].forEach(function (d) { var l = mesh(new T.SphereGeometry(1, 32, 16), rm, rg); l.scale.set(0.24, 0.15, 0.08); l.position.x = d * 0.2; l.rotation.z = d * 0.25; });
        mesh(new T.SphereGeometry(0.08, 16, 12), rm, rg);
        break;
      }
      case "crown": {
        var gold = std("#F2C230", 0.25, { metalness: 0.9, clearcoat: 0.5 });
        var cr = mesh(new T.CylinderGeometry(0.5, 0.45, 0.24, 48, 1, true), Object.assign(gold, { side: T.DoubleSide })); cr.position.y = top + 0.02;
        for (var j = 0; j < 8; j++) {
          var a3 = j / 8 * Math.PI * 2, sp2 = mesh(new T.ConeGeometry(0.07, 0.22, 12), gold); sp2.position.set(Math.sin(a3) * 0.48, top + 0.24, Math.cos(a3) * 0.48);
          var ball2 = mesh(new T.SphereGeometry(0.035, 12, 8), gold); ball2.position.set(Math.sin(a3) * 0.48, top + 0.36, Math.cos(a3) * 0.48);
        }
        [["#C23B2A", 0], ["#1F5E8A", 0.7], ["#2D7A52", -0.7]].forEach(function (q) { var gem = mesh(new T.SphereGeometry(0.05, 16, 12), std(q[0], 0.1, { clearcoat: 1 })); gem.position.set(Math.sin(q[1]) * 0.5, top + 0.02, Math.cos(q[1]) * 0.5); });
        break;
      }
      case "phones": {
        var pm = std(shade(s.hatColor, -0.2), 0.4);
        var arc = mesh(new T.TorusGeometry(1.2 * f.wx, 0.06, 12, 64, Math.PI), pm); arc.scale.y = 1.05 / f.wx; arc.position.y = 0.05;
        [-1, 1].forEach(function (d) { var cup = mesh(new T.CylinderGeometry(0.26, 0.26, 0.18, 32), hatM); cup.rotation.z = Math.PI / 2; cup.position.set(d * (1.12 * f.wx), -0.05, 0); });
        break;
      }
    }

    // ピアス
    if (s.earrings !== "none") [-1, 1].forEach(function (d) {
      var e = head.userData["ear" + d];
      if (s.earrings === "stud") { var st = mesh(new T.SphereGeometry(0.035, 16, 12), std("#EEF2F7", 0.1, { metalness: 0.9 })); st.position.copy(e); }
      if (s.earrings === "hoop") { var hp = mesh(new T.TorusGeometry(0.09, 0.014, 10, 32), std("#D9A920", 0.2, { metalness: 1 })); hp.position.copy(e).add(V(0, -0.08, 0)); hp.rotation.y = Math.PI / 2; }
      if (s.earrings === "pearl") { var pr = mesh(new T.SphereGeometry(0.055, 20, 16), std("#F5F0E6", 0.15, { clearcoat: 1, sheen: 1 })); pr.position.copy(e).add(V(0, -0.08, 0)); }
    });

    // 首と体
    var neck = mesh(new T.CylinderGeometry(0.34, 0.38, 0.9, 32), skinM, body); neck.position.set(0, -1.3, -0.12);
    var torsoG = new T.SphereGeometry(1, 64, 40); var torso = mesh(torsoG, clothM, body); torso.scale.set(1.45, 0.85, 0.75); torso.position.set(0, -2.12, -0.12);
    torso.updateMatrixWorld(true); body.updateMatrixWorld(true);
    switch (s.clothes) {
      case "tee": { var col = mesh(new T.TorusGeometry(0.4, 0.045, 12, 48), std(shade(s.clothesColor, -0.15), 0.8), body); col.rotation.x = Math.PI / 2 + 0.2; col.position.set(0, -1.32, -0.08); break; }
      case "vneck": decal(vneckTex(s.skin, s.clothesColor), conformPlane(torso, 0, -1.5, 0.62, 0.62, 0.01, 16, 16), body, 0.7); break;
      case "hoodie": {
        var hood = mesh(new T.TorusGeometry(0.52, 0.17, 16, 48), std(shade(s.clothesColor, -0.08), 0.8), body); hood.rotation.x = Math.PI / 2 + 0.45; hood.position.set(0, -1.3, -0.2);
        [-1, 1].forEach(function (d) { var str = mesh(new T.CylinderGeometry(0.018, 0.018, 0.42, 8), std("#F2F2F2", 0.7), body); str.position.set(d * 0.16, -1.65, 0.5); str.rotation.x = -0.35; });
        break;
      }
      case "shirt": {
        var cm = std(shade(s.clothesColor, 0.12), 0.7, { side: T.DoubleSide });
        [-1, 1].forEach(function (d) {
          var tri = new T.Shape(); tri.moveTo(0, 0); tri.lineTo(d * 0.3, 0.05); tri.lineTo(d * 0.08, -0.28); tri.lineTo(0, 0);
          var flap = mesh(new T.ExtrudeGeometry(tri, { depth: 0.02, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 }), cm, body);
          flap.position.set(d * 0.02, -1.3, 0.3); flap.rotation.x = -0.5;
        });
        var cr2 = mesh(new T.TorusGeometry(0.39, 0.035, 12, 48), cm, body); cr2.rotation.x = Math.PI / 2 + 0.2; cr2.position.set(0, -1.3, -0.08);
        break;
      }
      case "turtle": {
        var tn = new T.CylinderGeometry(0.43, 0.45, 0.42, 48, 6, true), tp2 = tn.attributes.position;
        for (var q = 0; q < tp2.count; q++) { var k2 = 1 + 0.03 * Math.cos(tp2.getY(q) * 40); tp2.setXYZ(q, tp2.getX(q) * k2, tp2.getY(q), tp2.getZ(q) * k2); }
        tn.computeVertexNormals();
        var tm = mesh(tn, std(shade(s.clothesColor, 0.05), 0.8, { side: T.DoubleSide }), body); tm.position.set(0, -1.16, -0.1);
        var tt = mesh(new T.TorusGeometry(0.44, 0.06, 12, 48), clothM, body); tt.rotation.x = Math.PI / 2; tt.position.set(0, -0.95, -0.1);
        break;
      }
      case "suit": decal(suitTex(s.clothesColor), conformPlane(torso, 0, -1.62, 0.7, 0.7, 0.01, 16, 16), body, 0.6); break;
    }

    probe.geometry.dispose(); probe.material.dispose();
    root.userData = { pivot: pivot, head: head, eyes: eyes, mats: mats };
    return root;
  }

  // ---------- 髪型 ----------
  function cones(ctx, f, pts, mask, thick, size) {
    pts.forEach(function (n) {
      var mv = mask(n); if (mv < 0.05) return;
      var base = headPos(n, f).multiplyScalar(1 + thick * 0.8), dir = base.clone().normalize();
      var c = ctx.mesh(new T.ConeGeometry(size[0], size[1], 12), ctx.hairM);
      c.position.copy(base).addScaledVector(dir, size[1] * 0.4);
      c.quaternion.setFromUnitVectors(V(0, 1, 0), dir.add(V(0, 0.6, 0)).normalize());
    });
  }
  function tie(ctx, p, r) { var t = ctx.mesh(new T.TorusGeometry(r, 0.035, 10, 24), ctx.std("#E8669F", 0.4)); t.position.copy(p); return t; }

  var HAIR = {
    none: { make: function () {} },
    buzz: { make: function (f, c) { c.mesh(shellGeo(f, hairMask(0.48, 0.05, -0.5), 0.012, { soft: 0.06 }), c.std(c.s.hairColor, 0.9, { transparent: true, opacity: 0.82 })); } },
    short: { make: function (f, c) { c.mesh(shellGeo(f, hairMask(0.48, 0.0, -0.55), c.hatOn ? 0.03 : 0.07, { ridge: 0.014, ridgeN: 20, bump: function (n) { return c.hatOn ? 0 : 0.06 * ss(0.2, 1, n.y); } }), c.hairM); } },
    side: { make: function (f, c) {
      var L = line3(0.4, -0.02, -0.55);
      c.mesh(shellGeo(f, function (n) { return n.y - L(n) - (n.z > 0 ? 0.16 * n.x * n.z : 0); }, c.hatOn ? 0.03 : 0.08, { ridge: 0.014, ridgeN: 18,
        bump: function (n) { return 0.05 * ss(0.3, 0.9, n.y) * ss(-0.2, 0.6, n.z); } }), c.hairM);
    } },
    spiky: { make: function (f, c) {
      var mk = hairMask(0.45, 0.0, -0.55);
      c.mesh(shellGeo(f, mk, 0.05, { ridge: 0.02 }), c.hairM);
      if (!c.hatOn) cones(c, f, fib(56).filter(function (n) { return n.y > 0.25; }), mk, 0.05, [0.16, 0.34]);
    } },
    bangs: { coverEars: true, make: function (f, c) {
      c.mesh(shellGeo(f, hairMask(0.24, -0.45, -0.6), c.hatOn ? 0.04 : 0.08, { soft: 0.025, ridge: 0.02, ridgeN: 22 }), c.hairM);
      c.mesh(curtainGeo(f, 0.25, -0.98, 1.08, 1.05, 0.1), c.hairM);
    } },
    long: { coverEars: true, make: function (f, c) {
      var L = line3(0.5, -0.3, -0.6);
      c.mesh(shellGeo(f, function (n) { return n.y - L(n); }, c.hatOn ? 0.04 : 0.08, { ridge: 0.02, ridgeN: 16 }), c.hairM);
      c.mesh(curtainGeo(f, 0.35, -2.05, 1.04, 0.95, 0.14), c.hairM);
    } },
    bun: { make: function (f, c) {
      c.mesh(shellGeo(f, hairMask(0.5, 0.02, -0.5), 0.035, { ridge: 0.015 }), c.hairM);
      if (!c.hatOn) { var b = c.mesh(new T.SphereGeometry(0.36, 48, 32), c.hairM); b.position.set(0, 1.22, -0.25); b.scale.set(1, 0.9, 1); tie(c, V(0, 0.95, -0.2), 0.22).rotation.x = Math.PI / 2 - 0.2; }
    } },
    twin: { make: function (f, c) {
      c.mesh(shellGeo(f, hairMask(0.26, -0.1, -0.55), c.hatOn ? 0.03 : 0.07, { soft: 0.03, ridge: 0.02, ridgeN: 22 }), c.hairM);
      [-1, 1].forEach(function (d) {
        var t = c.mesh(new T.CapsuleGeometry(0.19, 0.8, 12, 24), c.hairM); t.position.set(d * 1.12 * f.wx, -0.25, -0.25); t.rotation.z = d * 0.25;
        var tp = t.geometry.attributes.position; for (var i = 0; i < tp.count; i++) { var y = tp.getY(i), k = 1 - 0.25 * ss(-0.6, 0.6, -y) + 0.15 * ss(0.2, 0.6, y); tp.setXYZ(i, tp.getX(i) * k, y, tp.getZ(i) * k); } t.geometry.computeVertexNormals();
        var tt = tie(c, V(d * 1.0 * f.wx, 0.3, -0.2), 0.12); tt.rotation.set(Math.PI / 2, 0, d * 0.25);
      });
    } },
    pony: { make: function (f, c) {
      c.mesh(shellGeo(f, hairMask(0.5, 0.02, -0.5), 0.04, { ridge: 0.02 }), c.hairM);
      var p = c.mesh(new T.CapsuleGeometry(0.2, 0.9, 12, 24), c.hairM); p.position.set(0, 0.0, -1.18); p.rotation.x = -0.35;
      var tp = p.geometry.attributes.position; for (var i = 0; i < tp.count; i++) { var y = tp.getY(i), k = 1 - 0.4 * ss(-0.2, -0.65, y); tp.setXYZ(i, tp.getX(i) * k, y, tp.getZ(i) * k); } p.geometry.computeVertexNormals();
      var t = tie(c, V(0, 0.5, -1.02), 0.13); t.rotation.x = Math.PI / 2 - 0.4;
    } },
    curly: { make: function (f, c) {
      var mk = hairMask(0.42, -0.05, -0.55), th = c.hatOn ? 0.03 : 0.07;
      c.mesh(shellGeo(f, mk, th, {}), c.hairDarkM);
      var pts = fib(c.hatOn ? 0 : 420).filter(function (n) { return mk(n) > 0.02; });
      var im = new T.InstancedMesh(new T.IcosahedronGeometry(1, 2), c.hairM, pts.length), m4 = new T.Matrix4(), q = new T.Quaternion();
      pts.forEach(function (n, i) {
        var r = 0.11 + 0.05 * ((i * 7919) % 11) / 11, p = headPos(n, f).multiplyScalar(1 + th + 0.02);
        m4.compose(p, q, V(r, r, r)); im.setMatrixAt(i, m4);
      });
      im.castShadow = true; im.receiveShadow = true; c.head.add(im);
    } },
    mohawk: { make: function (f, c) {
      c.mesh(shellGeo(f, hairMask(0.48, 0.05, -0.5), 0.012, { soft: 0.06 }), c.std(c.s.hairColor, 0.9, { transparent: true, opacity: 0.6 }));
      var mk = function (n) { return Math.min(0.2 - Math.abs(n.x), n.y - line3(0.45, 0.2, -0.3)(n)); };
      c.mesh(shellGeo(f, mk, 0.08, { soft: 0.06 }), c.hairM);
      if (!c.hatOn) { var pts = []; for (var i = 0; i < 9; i++) { var a = lerp(0.35, 2.4, i / 8); pts.push(V(0, Math.sin(a), Math.cos(a))); } cones(c, f, pts, mk, 0.08, [0.13, 0.5]); }
    } }
  };

  // ---------- 表示・撮影 ----------
  var VIEWS = {
    main: { t: [0, -0.22, 0], d: 7.8 },
    face: { t: [0, -0.15, 0], d: 6.0 }, hair: { t: [0, 0.0, 0], d: 6.6 },
    brows: { t: [0, 0.1, 0], d: 3.6 }, eyes: { t: [0, -0.04, 0], d: 3.6 }, nose: { t: [0, -0.3, 0], d: 2.8 },
    mouth: { t: [0, -0.55, 0], d: 2.8 }, beard: { t: [0, -0.45, 0], d: 4.6 }, glasses: { t: [0, 0.0, 0], d: 4.2 },
    hat: { t: [0, 0.45, 0], d: 7.0 }, earrings: { t: [0, -0.3, 0], d: 4.6, yaw: 0.6 }, clothes: { t: [0, -1.5, 0], d: 6.4 },
    bg: { t: [0, -0.22, 0], d: 7.8 }
  };

  function dispose(obj) {
    if (!obj) return;
    obj.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
    (obj.userData.mats || []).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); });
  }

  function setView(cam, v) {
    var yaw = v.yaw || 0;
    cam.position.set(v.t[0] + Math.sin(yaw) * v.d, v.t[1], v.t[2] + Math.cos(yaw) * v.d);
    cam.lookAt(v.t[0], v.t[1], v.t[2]);
  }

  function supported() {
    try { var c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
  }

  // オフスクリーン撮影（候補サムネイル・保存一覧・PNG書き出し）
  var shot = null;
  function getShot() {
    if (shot) return shot;
    var cv = document.createElement("canvas"), r = makeRenderer(cv, 192);
    shot = { canvas: cv, renderer: r, scene: makeScene(r), cam: new T.PerspectiveCamera(28, 1, 0.1, 50) };
    return shot;
  }
  function snapshot(state, view, size, bg) {
    var S = getShot(), av = build(state);
    S.renderer.setSize(size, size, false);
    S.scene.add(av);
    setView(S.cam, VIEWS[view] || VIEWS.main);
    var b = bg === undefined ? state.bg : bg;
    if (!b || b === "transparent") S.renderer.setClearColor(0x000000, 0); else S.renderer.setClearColor(new T.Color(b), 1);
    S.renderer.render(S.scene, S.cam);
    var url = S.canvas.toDataURL("image/png");
    S.scene.remove(av); dispose(av);
    return url;
  }

  // 生きているプレビュー
  function mount(el) {
    var cv = document.createElement("canvas");
    cv.style.width = "100%"; cv.style.height = "100%"; cv.style.display = "block"; cv.style.touchAction = "none";
    el.appendChild(cv);
    var r = makeRenderer(cv, 512), sc = makeScene(r), cam = new T.PerspectiveCamera(28, 1, 0.1, 50);
    setView(cam, VIEWS.main);
    var av = null, state = null;
    var look = { x: 0, y: 0 }, cur = { x: 0, y: 0 }, yaw = 0, yawV = 0, drag = null, blinkT = 2 + Math.random() * 2, blinkK = 0, t0 = performance.now();

    function resize() {
      var w = Math.max(64, Math.round(el.clientWidth * Math.min(2, window.devicePixelRatio || 1)));
      r.setSize(w, w, false);
    }
    resize();
    window.addEventListener("resize", resize);

    window.addEventListener("pointermove", function (e) {
      var b = el.getBoundingClientRect();
      look.x = clamp((e.clientX - (b.left + b.width / 2)) / b.width, -1, 1);
      look.y = clamp((e.clientY - (b.top + b.height * 0.42)) / b.height, -1, 1);
      if (drag) { var dx = e.clientX - drag.x; drag.x = e.clientX; yawV = dx * 0.012; yaw += yawV; }
    });
    cv.addEventListener("pointerdown", function (e) { drag = { x: e.clientX }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener("pointerup", function () { drag = null; });
    cv.addEventListener("dblclick", function () { yaw = 0; yawV = 0; });

    function frame(now) {
      var dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
      if (av) {
        if (!drag) { yaw += yawV; yawV *= 0.92; if (Math.abs(yawV) < 0.0005) yaw *= 0.97; }
        av.rotation.y = yaw;
        cur.x += (look.x - cur.x) * 0.08; cur.y += (look.y - cur.y) * 0.08;
        var u = av.userData, tm = now / 1000;
        u.pivot.rotation.y = cur.x * 0.38; u.pivot.rotation.x = cur.y * 0.2; u.pivot.rotation.z = -cur.x * 0.06 + Math.sin(tm * 0.7) * 0.015;
        u.pivot.position.y = -0.9 + Math.sin(tm * 1.6) * 0.01;
        blinkT -= dt;
        if (blinkT < 0) { blinkK += dt / 0.16; if (blinkK >= 2) { blinkK = 0; blinkT = 2.5 + Math.random() * 3; } }
        var bk = blinkK < 1 ? blinkK : 2 - blinkK;
        u.eyes.forEach(function (e) {
          e.ball.rotation.y = cur.x * 0.5; e.ball.rotation.x = cur.y * 0.35;
          e.lid.rotation.x = lerp(e.open, Math.max(e.open, 0.62), bk);
        });
      }
      r.render(sc, cam);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    return {
      set: function (s) {
        state = s;
        if (av) { sc.remove(av); dispose(av); }
        av = build(s);
        av.rotation.y = yaw;
        sc.add(av);
        if (!s.bg || s.bg === "transparent") r.setClearColor(0x000000, 0); else r.setClearColor(new T.Color(s.bg), 1);
      },
      resetView: function () { yaw = 0; yawV = 0; }
    };
  }

  window.Avatar3D = { supported: supported, mount: mount, snapshot: snapshot };
})();
