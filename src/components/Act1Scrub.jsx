import React, { useEffect, useRef } from 'react';

const MAIN_COUNT = 75;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const window4 = (p, a, b, c, d) =>
  p < a || p > d ? 0 : p < b ? (p - a) / (b - a) : p > c ? 1 - (p - c) / (d - c) : 1;

const PHASE_WINDOWS = [
  [0.08, 0.12, 0.20, 0.24],   // 静寂の雨 (0-2s)
  [0.26, 0.31, 0.42, 0.47],   // 神の結印 (3-5s)
  [0.50, 0.55, 0.68, 0.73],   // 輪廻覚醒 (6-7s)
  [0.76, 0.81, 0.98, 1.01],   // 神羅天征 (8-10s)
];

function drawCover(ctx, img, cw, ch, maxUp = 2.0) {
  if (!img || !img.naturalWidth || cw <= 0 || ch <= 0) return false;
  const ir = img.naturalWidth / img.naturalHeight;
  let w = cw, h = cw / ir;
  if (h < ch) {
    const s = Math.min(ch / h, maxUp);
    w *= s;
    h *= s;
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  return true;
}

export function Act1Scrub({ mainFrames }) {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const glowRef = useRef(null);
  const vortexRef = useRef(null);
  const titleblockRef = useRef(null);
  const phasesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    const ctx = canvas.getContext('2d');
    let lastDrawn = -1;
    let targetFrame = 0;
    let currentFrame = 0;
    let scrubProgress = 0;
    let animId;

    function syncSize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(canvas.offsetWidth * dpr);
      const h = Math.round(canvas.offsetHeight * dpr);
      if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
        lastDrawn = -1; // force redraw
        return true;
      }
      return false;
    }

    function readScrub() {
      const rect = section.getBoundingClientRect();
      const dist = section.offsetHeight - window.innerHeight;
      scrubProgress = clamp(-rect.top / (dist || 1));
      targetFrame = scrubProgress * (MAIN_COUNT - 1);
    }

    function paintOverlays(p) {
      phasesRef.current.forEach((el, i) => {
        if (!el) return;
        const o = window4(p, ...PHASE_WINDOWS[i]);
        el.style.opacity = o.toFixed(3);
        el.style.setProperty('--y', `${((1 - o) * 34).toFixed(1)}px`);
        el.style.filter = `blur(${((1 - o) * 7).toFixed(2)}px)`;
      });

      if (titleblockRef.current) {
        const t = window4(p, -0.10, -0.05, 0.06, 0.12);
        titleblockRef.current.style.opacity = t.toFixed(3);
        titleblockRef.current.style.transform = `translateX(-50%) translateY(${((1 - t) * 40).toFixed(1)}px) scale(${(0.97 + t * 0.03).toFixed(3)})`;
        titleblockRef.current.style.letterSpacing = `${((1 - t) * 0.12).toFixed(3)}em`;
      }

      if (glowRef.current) {
        glowRef.current.style.opacity = (clamp((p - 0.40) / 0.25) * 0.88).toFixed(3);
      }
      if (vortexRef.current) {
        vortexRef.current.style.opacity = (clamp((p - 0.70) / 0.15) * 0.7).toFixed(3);
      }
    }

    syncSize();
    readScrub();
    paintOverlays(scrubProgress);

    window.addEventListener('resize', syncSize);
    window.addEventListener('scroll', readScrub, { passive: true });

    function tick() {
      syncSize();
      readScrub();

      currentFrame = lerp(currentFrame, targetFrame, 0.16);
      const idx = Math.round(clamp(currentFrame, 0, MAIN_COUNT - 1));

      if (mainFrames && mainFrames.length > 0 && mainFrames[idx]) {
        if (idx !== lastDrawn) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);
          if (drawCover(ctx, mainFrames[idx], w, h)) {
            lastDrawn = idx;
          }
        }
      }

      paintOverlays(scrubProgress);
      animId = requestAnimationFrame(tick);
    }

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', syncSize);
      window.removeEventListener('scroll', readScrub);
    };
  }, [mainFrames]);

  return (
    <section ref={sectionRef} className="scrub" id="scrub">
      <div className="scrub__sticky">
        <canvas ref={canvasRef} id="mainCanvas"></canvas>
        <div ref={glowRef} className="scrub__glow"></div>
        <div ref={vortexRef} className="scrub__vortex"></div>

        {/* Phase Captions */}
        <div ref={(el) => (phasesRef.current[0] = el)} className="phase" data-phase="0">
          <h1 className="phase__jp">静寂の雨</h1>
          <p className="phase__en">THE WEEPING RAIN</p>
          <p className="phase__sub">「雨の止まぬ里で、我らは生まれた。」 — In the village where the rain never ceases, pain was born.</p>
        </div>

        <div ref={(el) => (phasesRef.current[1] = el)} className="phase" data-phase="1">
          <h2 className="phase__jp">神の結印</h2>
          <p className="phase__en">DIVINE FOCUS</p>
          <p className="phase__sub">「雨虎自在の術。この雨の一滴一滴が、我が感覚。」</p>
        </div>

        <div ref={(el) => (phasesRef.current[2] = el)} className="phase" data-phase="2">
          <h2 className="phase__jp">輪廻覚醒</h2>
          <p className="phase__en">RINNEGAN AWAKENING</p>
          <p className="phase__sub">The eyes of the Rikudō Sennin. Six ripple rings of omnipotence.</p>
        </div>

        <div ref={(el) => (phasesRef.current[3] = el)} className="phase" data-phase="3">
          <h2 className="phase__jp">神羅天征</h2>
          <p className="phase__en">ALMIGHTY PUSH</p>
          <p className="phase__sub">「世界に痛みを — これより、世界に痛みを教える。」</p>
        </div>

        {/* Title lockup */}
        <div ref={titleblockRef} className="titleblock" id="titleblock">
          <p className="titleblock__kicker">雨隠れの里 · 暁 · 輪廻眼</p>
          <h1 className="titleblock__jp">ペイン<span>天道</span></h1>
          <p className="titleblock__en">P A I N &nbsp; · &nbsp; D E V A &nbsp; P A T H</p>
        </div>
      </div>
    </section>
  );
}
