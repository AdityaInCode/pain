import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

// RAW WebGL Void FBM Shader for Lavender/Purple smoke cursor
function initGhostCursor(canvas) {
  if (!canvas) return null;
  const TRAIL = 28;
  const rgb = hexToRgb('#9b5de5');

  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: 'high-performance'
  });
  if (!gl) return null;

  const VERT = `
    attribute vec2 aPos;
    void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
  `;

  const FRAG = `
    precision highp float;
    #define MAX_TRAIL_LENGTH ${TRAIL}

    uniform float iTime;
    uniform vec3  iResolution;
    uniform vec2  iMouse;
    uniform vec2  iPrevMouse[MAX_TRAIL_LENGTH];
    uniform float iOpacity;
    uniform float iScale;
    uniform vec3  iBaseColor;
    uniform float iBrightness;
    uniform float iEdgeIntensity;

    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7))) * 43758.5453123); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      f *= f * (3. - 2. * f);
      return mix(mix(hash(i + vec2(0.,0.)), hash(i + vec2(1.,0.)), f.x),
                 mix(hash(i + vec2(0.,1.)), hash(i + vec2(1.,1.)), f.x), f.y);
    }
    float fbm(vec2 p){
      float v = 0.0;
      float a = 0.5;
      mat2 m = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for(int i=0;i<5;i++){
        v += a * noise(p);
        p = m * p * 2.0;
        a *= 0.5;
      }
      return v;
    }
    vec3 tint1(vec3 base){ return mix(base, vec3(1.0, 0.85, 1.0), 0.22); }
    vec3 tint2(vec3 base){ return mix(base, vec3(0.5, 0.9, 1.0), 0.35); }

    vec4 blob(vec2 p, vec2 mousePos, float intensity, float activity) {
      vec2 q = vec2(fbm(p * iScale + iTime * 0.1), fbm(p * iScale + vec2(5.2,1.3) + iTime * 0.1));
      vec2 r = vec2(fbm(p * iScale + q * 1.5 + iTime * 0.15), fbm(p * iScale + q * 1.5 + vec2(8.3,2.8) + iTime * 0.15));

      float smoke = fbm(p * iScale + r * 0.8);
      float radius = 0.5 + 0.3 * (1.0 / iScale);
      float distFactor = 1.0 - smoothstep(0.0, radius * activity, length(p - mousePos));
      float alpha = pow(smoke, 2.5) * distFactor;

      vec3 c1 = tint1(iBaseColor);
      vec3 c2 = tint2(iBaseColor);
      vec3 color = mix(c1, c2, sin(iTime * 0.5) * 0.5 + 0.5);

      return vec4(color * alpha * intensity, alpha * intensity);
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy / iResolution.xy * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
      vec2 mouse = (iMouse * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);

      vec3 colorAcc = vec3(0.0);
      float alphaAcc = 0.0;

      vec4 b = blob(uv, mouse, 1.0, iOpacity);
      colorAcc += b.rgb;
      alphaAcc += b.a;

      for (int i = 0; i < MAX_TRAIL_LENGTH; i++) {
        vec2 pm = (iPrevMouse[i] * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
        float t = 1.0 - float(i) / float(MAX_TRAIL_LENGTH);
        t = pow(t, 2.0);
        if (t > 0.01) {
          vec4 bt = blob(uv, pm, t * 0.8, iOpacity);
          colorAcc += bt.rgb;
          alphaAcc += bt.a;
        }
      }

      colorAcc *= iBrightness;

      vec2 uv01 = gl_FragCoord.xy / iResolution.xy;
      float edgeDist = min(min(uv01.x, 1.0 - uv01.x), min(uv01.y, 1.0 - uv01.y));
      float distFromEdge = clamp(edgeDist * 2.0, 0.0, 1.0);
      float k = clamp(iEdgeIntensity, 0.0, 1.0);
      float edgeMask = mix(1.0 - k, 1.0, distFromEdge);

      float outAlpha = clamp(alphaAcc * iOpacity * edgeMask, 0.0, 1.0);
      gl_FragColor = vec4(colorAcc, outAlpha);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const U = (n) => gl.getUniformLocation(prog, n);
  const uTime = U('iTime'),
        uRes = U('iResolution'),
        uMouse = U('iMouse'),
        uPrev = U('iPrevMouse[0]'),
        uOpacity = U('iOpacity'),
        uScale = U('iScale'),
        uColor = U('iBaseColor'),
        uBright = U('iBrightness'),
        uEdge = U('iEdgeIntensity');

  gl.uniform3f(uColor, rgb[0], rgb[1], rgb[2]);
  gl.uniform1f(uBright, 0.48);
  gl.uniform1f(uEdge, 0.45);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  const trail = new Float32Array(TRAIL * 2).fill(0.5);
  const flat = new Float32Array(TRAIL * 2).fill(0.5);
  let head = 0;

  const target = { x: 0.5, y: 0.5 };
  const cur = { x: 0.5, y: 0.5 };
  let pointerActive = false;
  let lastMove = performance.now();
  let fade = 0;
  const t0 = performance.now();

  function resize() {
    const cssW = canvas.offsetWidth;
    const cssH = canvas.offsetHeight;
    if (cssW <= 0 || cssH <= 0) return;
    const pr = Math.min(window.devicePixelRatio || 1, 0.55);
    const w = Math.max(1, Math.floor(cssW * pr));
    const h = Math.max(1, Math.floor(cssH * pr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.useProgram(prog);
    gl.uniform3f(uRes, w, h, 1);
    const base = Math.min(Math.max(1, cssW), Math.max(1, cssH));
    gl.uniform1f(uScale, Math.max(0.5, Math.min(2.0, base / 600)));
  }

  function move(x, y, active = true) {
    target.x = clamp(x);
    target.y = clamp(1 - y);
    pointerActive = active;
    if (active) {
      lastMove = performance.now();
      fade = 1;
    }
  }

  function leave() {
    pointerActive = false;
    lastMove = performance.now();
  }

  function render() {
    const now = performance.now();
    if (pointerActive) {
      cur.x = target.x;
      cur.y = target.y;
      fade = 1;
    } else {
      const dt = now - lastMove;
      if (dt > 900) fade = Math.max(0, 1 - Math.min(1, (dt - 900) / 1400));
    }
    if (fade <= 0.001 && !pointerActive) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      return false;
    }

    head = (head + 1) % TRAIL;
    trail[head * 2] = cur.x;
    trail[head * 2 + 1] = cur.y;
    for (let i = 0; i < TRAIL; i++) {
      const src = ((head - i) % TRAIL + TRAIL) % TRAIL;
      flat[i * 2] = trail[src * 2];
      flat[i * 2 + 1] = trail[src * 2 + 1];
    }

    gl.useProgram(prog);
    gl.uniform1f(uTime, (now - t0) / 1000);
    gl.uniform2f(uMouse, cur.x, cur.y);
    gl.uniform2fv(uPrev, flat);
    gl.uniform1f(uOpacity, fade);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return true;
  }

  return { resize, move, leave, render };
}

const SIX_PATHS = [
  {
    num: '01 · DEVA PATH',
    jp: '天道',
    ro: 'TENDŌ · GRAVITATIONAL REIGN',
    txt: "Yahiko's body. Commands the primal forces of attraction and repulsion: 神羅天征 (Shinra Tensei) and 万象天引 (Banshō Ten'in).",
    footJp: '引力 · 斥力',
    footEn: 'GRAVITY & REPULSION'
  },
  {
    num: '02 · ASURA PATH',
    jp: '修羅道',
    ro: 'SHURADŌ · MECHANICAL ARSENAL',
    txt: 'Augments the physical flesh into devastating biomechanical weaponry: chakra laser cannons, multi-faceted blades, and ballistic missiles.',
    footJp: '兵器 · 機巧',
    footEn: 'CYBERNETIC ARSENAL'
  },
  {
    num: '03 · HUMAN PATH',
    jp: '人間道',
    ro: 'NINGENDŌ · SOUL EXTRACTION',
    txt: 'Capable of instant telepathic interrogation and forcibly extracting the spiritual soul from any opponent through direct physical contact.',
    footJp: '魂魄 · 読心',
    footEn: 'SOUL ABSORPTION'
  },
  {
    num: '04 · ANIMAL PATH',
    jp: '畜生道',
    ro: 'CHIKUSHŌDŌ · APOCALYPTIC SUMMONS',
    txt: 'Instant summoning of colossal multi-headed beasts: the immortal splitting Cerberus, giant drill-beaked bird, and the chameleon.',
    footJp: '口寄 · 巨獣',
    footEn: 'INFINITE SUMMONS'
  },
  {
    num: '05 · PRETA PATH',
    jp: '餓鬼道',
    ro: 'GAKIDŌ · CHAKRA ABSORPTION',
    txt: 'Forms an impenetrable spherical null-barrier that absorbs and neutralizes ninjutsu of any chakra nature or magnitude without limit.',
    footJp: '封印吸印',
    footEn: 'NINJUTSU NULLIFIER'
  },
  {
    num: '06 · NARAKA PATH',
    jp: '地獄道',
    ro: 'JIGOKUDŌ · KING OF HELL',
    txt: 'Summons the King of Hell (冥府の王) for judgment and interrogation, and can completely repair and resurrect any fallen Path in moments.',
    footJp: '閻魔 · 蘇生',
    footEn: 'DIVINE RESTORATION'
  }
];

export function Act3SixPaths() {
  const stageRef = useRef(null);
  const ghostCanvasRef = useRef(null);
  const [lit, setLit] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = ghostCanvasRef.current;
    if (!stage || !canvas) return;

    const ghost = initGhostCursor(canvas);
    if (!ghost) return;

    ghost.resize();
    window.addEventListener('resize', ghost.resize);

    let animId;
    let revealX = 0.5, revealY = 0.5;
    let targetX = 0.5, targetY = 0.5;
    let revealR = 0;
    let isLit = false;

    function handlePointer(e) {
      const t = e.touches ? e.touches[0] : e;
      if (!t) return;
      const rect = stage.getBoundingClientRect();
      targetX = clamp((t.clientX - rect.left) / Math.max(1, rect.width));
      targetY = clamp((t.clientY - rect.top) / Math.max(1, rect.height));
      ghost.move(targetX, targetY, true);
      isLit = true;
      setLit(true);
    }

    stage.addEventListener('pointermove', handlePointer, { passive: true });
    stage.addEventListener('touchstart', handlePointer, { passive: true });
    stage.addEventListener('touchmove', handlePointer, { passive: true });

    stage.addEventListener('pointerleave', () => {
      isLit = false;
      setLit(false);
      ghost.leave();
    });

    stage.addEventListener('touchend', () => {
      setTimeout(() => {
        isLit = false;
        setLit(false);
        ghost.leave();
      }, 800);
    });

    function tick() {
      const r = stage.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        revealX += (targetX - revealX) * 0.13;
        revealY += (targetY - revealY) * 0.13;
        revealR += ((isLit ? 440 : 0) - revealR) * 0.09;

        stage.style.setProperty('--rx', `${(revealX * 100).toFixed(2)}%`);
        stage.style.setProperty('--ry', `${(revealY * 100).toFixed(2)}%`);
        stage.style.setProperty('--r', `${revealR.toFixed(0)}px`);

        if (isLit || revealR > 1) {
          ghost.render();
        }
      }
      animId = requestAnimationFrame(tick);
    }

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', ghost.resize);
    };
  }, []);

  return (
    <section className="paths" id="paths">
      {/* 1. Dedicated Unobstructed Reveal Stage for Set C */}
      <div ref={stageRef} className={`paths__stage ${lit ? 'lit' : ''}`} id="pathsStage">
        <div
          className="paths__reveal"
          style={{ backgroundImage: `url('/frames/storm.jpg')` }}
          aria-hidden="true"
        ></div>
        <div className="paths__overlay" aria-hidden="true"></div>
        <canvas ref={ghostCanvasRef} className="ghost" aria-hidden="true"></canvas>

        <div className="paths__stage-head">
          <span className="eyebrow">神の権能 · SIX PATHS OF PAIN</span>
          <h2>六道ペイン<br />神の領域</h2>
          <p>
            Yahiko's Deva Path reaches through the dark Amegakure deluge. Move your cursor to unveil Pain's visage and outstretched hand.
          </p>
          <p className="paths__hint">
            カーソルを動かして暗闇を切り裂け · Move cursor to reveal Amegakure & Pain's Reach
          </p>
        </div>

        <div className="paths__stage-cue">
          <span className="cue-pill">↓ 六道輪廻の陣 · SCROLL DOWN TO INSPECT THE SIX PATHS</span>
        </div>

        <div className="paths__watermark" aria-hidden="true">
          <span className="watermark__jp">神羅天征</span>
          <span className="watermark__ro">SHINRA TENSEI · ALMIGHTY PUSH</span>
        </div>
      </div>

      {/* 2. Six Paths Roster (Cards placed cleanly BELOW the reveal stage) */}
      <div className="paths__roster" id="pathsRoster">
        <div className="paths__roster-head">
          <span className="eyebrow">六道輪廻 · THE SIX CORPOREAL VESSELS</span>
          <h3>六道輪廻の陣</h3>
          <p>
            Six corpses commanded simultaneously through black chakra receiver piercings. Each body commands an absolute fundamental principle of combat, tied together by shared Rinnegan sight.
          </p>
          <div className="paths__meta">
            <span><i>六道輪廻</i>SIX REALMS</span>
            <span><i>雨虎自在</i>SENSORY RAIN</span>
            <span><i>黒き受信器</i>CHAKRA RODS</span>
          </div>
        </div>

        {/* 6 Cards Grid with Framer Motion hover */}
        <div className="paths__grid">
          {SIX_PATHS.map((card, i) => (
            <motion.article
              key={card.num}
              className="card interactive-hover"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              <span className="card__num">{card.num}</span>
              <h3 className="card__jp">{card.jp}</h3>
              <p className="card__ro">{card.ro}</p>
              <p className="card__txt">{card.txt}</p>
              <div className="card__foot">
                <i>{card.footJp}</i> {card.footEn}
              </div>
            </motion.article>
          ))}
        </div>

        <div className="paths__foot">
          <span>「六つの視界が、一つに繋がる。」</span>
          <span>SIX BODIES UNITED UNDER A SINGLE WILL — PEACE BORN FROM SUFFERING</span>
        </div>
      </div>
    </section>
  );
}
