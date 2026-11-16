/* =========================================================
   VAYUPORT — 3D eVTOL showcase section (below the hero)
   ---------------------------------------------------------
   - Renders assets/3d/vayuport-evtol.glb in the #evtol-3d section.
   - Works on the live site AND when index.html is opened straight
     from disk (file://) — no local server needed. On file:// the
     model is read from assets/3d/vayuport-evtol.glb.js instead.
   - The eVTOL hovers and turns on its own (baked animation); the
     camera is fixed and the scene does not react to input.
   - Performance: nothing 3D is downloaded until the section is
     close to the screen; rendering stops when it is off-screen or
     the tab is hidden; resolution drops automatically on slow GPUs.
   - The poster image stays as the fallback (no WebGL, Data Saver,
     load error). Reduced-motion visitors get one still frame.
   ========================================================= */
(function () {
  'use strict';

  var mount = document.querySelector('[data-evtol-3d]');
  if (!mount) return;

  /* ---------- easy settings ---------- */
  var ZOOM = 1.35;          // >1 = camera closer to the eVTOL (1 = whole aircraft with margin)
  var MAX_DPR_DESKTOP = 1.5; // render resolution cap (higher = sharper but heavier)
  var MAX_DPR_MOBILE = 1.25;

  var MODEL_URL = mount.getAttribute('data-model') || 'assets/3d/vayuport-evtol.glb';
  var EMBED_URL = MODEL_URL + '.js';
  var LIBS = [
    'assets/js/vendor/three.min.js?v=147',
    'assets/js/vendor/GLTFLoader.js?v=147',
    'assets/js/vendor/meshopt_decoder.js?v=021'
  ];
  var isFile = location.protocol === 'file:';

  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = navigator.connection && navigator.connection.saveData;

  function warn(msg, err) { if (window.console) console.warn('[vayuport] ' + msg, err || ''); }

  function hasWebGL() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { return false; }
  }
  if (saveData || !hasWebGL()) return; // keep the poster image

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src; s.async = false;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Failed to load ' + src)); };
      document.head.appendChild(s);
    });
  }

  var started = false;
  function start() {
    if (started) return; started = true;
    LIBS.reduce(function (p, src) { return p.then(function () { return loadScript(src); }); }, Promise.resolve())
      .then(init)
      .catch(function (err) { warn('3D disabled:', err); });
  }

  // Only fetch three.js + the model when the section is about to scroll into view,
  // so the hero and the rest of the page load without competing for bandwidth/CPU.
  if ('IntersectionObserver' in window) {
    var pre = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { pre.disconnect(); start(); }
    }, { rootMargin: '900px 0px' });
    pre.observe(mount);
  } else {
    window.addEventListener('load', function () { setTimeout(start, 600); }, { once: true });
  }

  /* ---------- model loading (http(s) → .glb, file:// → embedded copy) ---------- */
  function base64ToBuffer(b64) {
    var bin = atob(b64), len = bin.length, bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }
  function loadModel(loader, onLoad, onError) {
    function fromEmbed() {
      var go = function () {
        if (!window.VAYUPORT_EVTOL_GLB) { onError(new Error('embedded model missing')); return; }
        var buf = base64ToBuffer(window.VAYUPORT_EVTOL_GLB);
        window.VAYUPORT_EVTOL_GLB = null; // free the string
        loader.parse(buf, '', onLoad, onError);
      };
      if (window.VAYUPORT_EVTOL_GLB) go();
      else loadScript(EMBED_URL).then(go, onError);
    }
    if (isFile) { fromEmbed(); return; }
    loader.load(MODEL_URL, onLoad, undefined, function (err) {
      warn('model .glb failed, trying embedded copy', err);
      fromEmbed();
    });
  }

  function init() {
    var THREE = window.THREE;
    var isMobile = function () { return window.matchMedia('(max-width: 767.98px)').matches; };

    /* ---------- renderer ---------- */
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'default', stencil: false });
    } catch (e) { warn('WebGL init failed', e); return; }
    var maxDpr = isMobile() ? MAX_DPR_MOBILE : MAX_DPR_DESKTOP;
    var dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    renderer.setPixelRatio(dpr);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    var canvas = renderer.domElement;
    canvas.className = 'evtol-3d';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.setAttribute('tabindex', '-1');
    mount.appendChild(canvas);

    /* ---------- scene ---------- */
    var scene = new THREE.Scene();
    var sky = document.createElement('canvas'); sky.width = 2; sky.height = 512;
    var sg = sky.getContext('2d'); var grd = sg.createLinearGradient(0, 0, 0, 512);
    grd.addColorStop(0, '#141c2c'); grd.addColorStop(.45, '#3b3247'); grd.addColorStop(.7, '#b4734a');
    grd.addColorStop(.78, '#e9a35a'); grd.addColorStop(1, '#1d1a1c');
    sg.fillStyle = grd; sg.fillRect(0, 0, 2, 512);
    var skyTex = new THREE.CanvasTexture(sky); skyTex.encoding = THREE.sRGBEncoding;
    scene.background = skyTex;
    scene.fog = new THREE.Fog(0x2a2530, 60, 170);

    /* ---------- fixed camera (no controls) ---------- */
    var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 500);
    var VIEW_DIR = new THREE.Vector3(20, 10.5 - 4.8, 22).normalize();
    var FOCUS = new THREE.Vector3(0, 8.3, 0);   // centre of the aircraft (gear 6.2 m → fin 11.3 m)
    var SUBJECT_R = 7.4;                        // eVTOL incl. rotor span, metres

    /* ---------- lights ---------- */
    scene.add(new THREE.HemisphereLight(0xffd9b0, 0x1a1f2a, 0.6));
    var sun = new THREE.DirectionalLight(0xffc18a, 1.6);
    sun.position.set(-30, 22, 18); sun.castShadow = true;
    var sm = isMobile() ? 512 : 1024;
    sun.shadow.mapSize.set(sm, sm);
    // Only the aircraft casts shadows, so the shadow box hugs the pad (sharper at low res).
    Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 90 });
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03;
    scene.add(sun);
    var rim = new THREE.DirectionalLight(0x8fb4ff, 0.6); rim.position.set(25, 14, -20); scene.add(rim);
    var deckGlow = new THREE.PointLight(0xffffff, 0.6, 14, 2); deckGlow.position.set(0, 3.2, 0);
    scene.add(deckGlow);

    /* ---------- framing ---------- */
    var width = 0, height = 0;
    function frame(force) {
      var w = mount.clientWidth || window.innerWidth;
      var h = mount.clientHeight || window.innerHeight;
      if (!force && w === width && h === height) return;
      width = w; height = h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;

      var overlayCaption = window.innerWidth > 860; // caption sits over the bottom-left
      var tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      var tanH = tanV * camera.aspect;
      var fillV = 0.92;
      var fillH = overlayCaption ? 0.68 : 0.80;
      var dist = Math.max(SUBJECT_R / (tanV * fillV), SUBJECT_R / (tanH * fillH));
      dist = Math.min(Math.max(dist / ZOOM, 10), 80);

      camera.position.copy(FOCUS).addScaledVector(VIEW_DIR, dist);
      camera.lookAt(FOCUS);
      var ox = overlayCaption ? -w * 0.14 : 0;
      var oy = overlayCaption ? -h * 0.04 : -h * 0.02;
      camera.setViewOffset(w, h, ox, oy, w, h);
      camera.updateProjectionMatrix();
    }

    /* ---------- model ---------- */
    var mixer = null, evtol = null, tmp = new THREE.Vector3();
    var clock = new THREE.Clock();
    var shown = false;

    var loader = new THREE.GLTFLoader();
    if (window.MeshoptDecoder) loader.setMeshoptDecoder(window.MeshoptDecoder);

    loadModel(loader, function (gltf) {
      var root = gltf.scene;
      evtol = root.getObjectByName('eVTOL');
      root.traverse(function (o) {
        if (!o.isMesh) return;
        o.receiveShadow = true;
        o.castShadow = false;
        if (o.material && o.material.emissive && o.material.emissive.getHex() !== 0) o.material.emissiveIntensity = 2.2;
      });
      if (evtol) evtol.traverse(function (o) {
        if (o.isMesh) o.castShadow = !(o.material && o.material.transparent);
      });
      // static scenery never moves: skip its per-frame matrix work
      root.traverse(function (o) {
        var inEvtol = false, p = o;
        while (p) { if (p === evtol) { inEvtol = true; break; } p = p.parent; }
        if (!inEvtol && o !== root) { o.updateMatrix(); o.matrixAutoUpdate = false; }
      });
      scene.add(root);
      if (gltf.animations && gltf.animations.length) {
        mixer = new THREE.AnimationMixer(root);
        mixer.clipAction(gltf.animations[0]).play();
        mixer.update(reduceMotion ? 2.5 : 0); // reduced motion: a nice still pose
      }
      frame(true);
      renderer.compile(scene, camera); // compile shaders up front (avoids a hitch on first frame)
      renderOnce();
      reveal();
      setRunning(true);
    }, function (err) {
      warn('3D model failed to load — showing the still image.', err);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      renderer.dispose();
    });

    function reveal() {
      if (shown) return; shown = true;
      requestAnimationFrame(function () {
        mount.classList.add('is-3d-ready');
        var media = mount.closest('.model-media');
        if (media) media.classList.add('has-3d');
      });
    }

    function renderOnce() {
      if (evtol) { evtol.getWorldPosition(tmp); deckGlow.position.set(tmp.x, tmp.y - 2.6, tmp.z); }
      renderer.render(scene, camera);
    }

    /* ---------- adaptive quality ---------- */
    // If frames are slow, lower the render resolution step by step; as a last resort cap at 30 fps.
    var slowFrames = 0, sampled = 0, fpsCap = 0, lastDraw = 0;
    function adapt(dtMs) {
      sampled++;
      if (dtMs > 24) slowFrames++;
      if (sampled < 90) return;            // judge every ~1.5 s
      var slow = slowFrames / sampled > 0.35;
      sampled = 0; slowFrames = 0;
      if (!slow) return;
      if (dpr > 0.8) {
        dpr = Math.max(0.75, +(dpr - 0.25).toFixed(2));
        renderer.setPixelRatio(dpr); frame(true);
      } else if (!fpsCap) {
        fpsCap = 30;
      }
    }

    /* ---------- loop (only while visible) ---------- */
    var running = false, inView = true;
    function tick(now) {
      if (fpsCap && now - lastDraw < 1000 / fpsCap - 2) return;
      var gap = lastDraw ? now - lastDraw : 16;
      lastDraw = now;
      var dt = Math.min(clock.getDelta(), 0.1);
      if (mixer) mixer.update(dt);
      renderOnce();
      if (gap < 250) adapt(gap);
    }
    function setRunning(on) {
      on = on && !reduceMotion && inView && !document.hidden && !!mixer;
      if (on === running) return;
      running = on;
      if (on) { clock.getDelta(); lastDraw = 0; renderer.setAnimationLoop(tick); }
      else renderer.setAnimationLoop(null);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        setRunning(true);
      }, { threshold: 0 }).observe(mount);
    }
    document.addEventListener('visibilitychange', function () { setRunning(true); });

    var resizeQueued = false;
    function onResize() {
      if (resizeQueued) return; resizeQueued = true;
      requestAnimationFrame(function () {
        resizeQueued = false;
        frame(false);
        if (!running && mixer) renderOnce();
      });
    }
    if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(mount);
    else window.addEventListener('resize', onResize);
    frame(true);
  }
})();
