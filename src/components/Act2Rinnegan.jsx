import React, { useEffect, useRef } from 'react';

const EYE_COUNT = 51;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

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

export function Act2Rinnegan({ eyeFrames }) {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const flareRef = useRef(null);
  const readoutRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    const ctx = canvas.getContext('2d');
    let lastDrawn = -1;
    let targetX = 0.5, targetY = 0.5;
    let currentX = 0.5, currentY = 0.5;
    let gazePos = (EYE_COUNT - 1) / 2;
    let animId;

    function syncSize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(canvas.offsetWidth * dpr);
      const h = Math.round(canvas.offsetHeight * dpr);
      if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
        lastDrawn = -1;
        return true;
      }
      return false;
    }

    syncSize();
    window.addEventListener('resize', syncSize);

    function onPointerMove(e) {
      targetX = clamp(e.clientX / window.innerWidth);
      targetY = clamp(e.clientY / window.innerHeight);
    }

    function onTouchMove(e) {
      const t = e.touches[0];
      if (!t) return;
      targetX = clamp(t.clientX / window.innerWidth);
      targetY = clamp(t.clientY / window.innerHeight);
    }

    function onDeviceOrientation(e) {
      if (e.gamma !== null) {
        const tiltX = clamp((e.gamma + 30) / 60);
        targetX = tiltX;
      }
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchstart', onTouchMove, { passive: true });
    window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });

    function tick() {
      syncSize();

      const rect = section.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

      if (isVisible) {
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;

        gazePos += (currentX * (EYE_COUNT - 1) - gazePos) * 0.16;
        const idx = Math.round(clamp(gazePos, 0, EYE_COUNT - 1));

        if (eyeFrames && eyeFrames.length > 0 && eyeFrames[idx]) {
          if (idx !== lastDrawn) {
            const w = canvas.width;
            const h = canvas.height;
            ctx.clearRect(0, 0, w, h);
            ctx.globalAlpha = 1;
            if (drawCover(ctx, eyeFrames[idx], w, h, 2.0)) {
              lastDrawn = idx;
            }
          }
        }

        if (flareRef.current) {
          flareRef.current.style.setProperty('--mx', (currentX * 100).toFixed(1) + '%');
          flareRef.current.style.setProperty('--my', (currentY * 100).toFixed(1) + '%');
        }

        if (readoutRef.current) {
          const axis = (currentX - 0.5) * 200;
          const dir = axis < -8 ? '左' : axis > 8 ? '右' : '中央';
          readoutRef.current.textContent = `視線 ${dir} ${Math.abs(axis).toFixed(1).padStart(4, '0')} / FRAME ${String(idx + 1).padStart(2, '0')}`;
        }
      }

      animId = requestAnimationFrame(tick);
    }

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', syncSize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchstart', onTouchMove);
      window.removeEventListener('deviceorientation', onDeviceOrientation);
    };
  }, [eyeFrames]);

  return (
    <section ref={sectionRef} className="eyes" id="eyes">
      <div className="eyes__sticky">
        <canvas ref={canvasRef} id="eyeCanvas"></canvas>
        <div ref={flareRef} className="eyes__flare" id="eyeFlare"></div>

        <div className="eyes__hud">
          <div className="eyes__label eyes__label--tl">三大瞳術 · 輪廻眼</div>
          <div className="eyes__label eyes__label--tr">RIKUDŌ · SAGE GAZE</div>
          <div ref={readoutRef} className="eyes__label eyes__label--bl" id="eyeReadout">
            視線 中央 00.0 / SENSOR 00
          </div>
          <div className="eyes__label eyes__label--br">カーソルを動かせ · TRACKING CURSOR</div>
        </div>

        <div className="eyes__copy">
          <h2>神の<span>眼差し</span></h2>
          <p>「神の前に、何者も逃れることはできぬ。」 — Wherever you tread, divine judgment follows.</p>
          <p className="eyes__note">CONCENTRIC GAZE TRACKER · 51 precision frames mapped to your cursor coordinate</p>
        </div>
      </div>
    </section>
  );
}
