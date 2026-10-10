import React, { useEffect, useRef, useState } from 'react';

export function AmbientCanvas({ playThunder, blastForceTrigger }) {
  const rainCanvasRef = useRef(null);
  const debrisCanvasRef = useRef(null);
  const cursorRef = useRef(null);
  const boltPathRef = useRef(null);
  const boltGlowRef = useRef(null);
  const stormFlashRef = useRef(null);
  const stormBoltRef = useRef(null);

  const [cursorHot, setCursorHot] = useState(false);
  const blastForceRef = useRef(0);

  // Trigger debris blast force when Shinra Tensei is fired
  useEffect(() => {
    if (blastForceTrigger) {
      blastForceRef.current = 1.0;
    }
  }, [blastForceTrigger]);

  // Rain Canvas & Debris Canvas Loop
  useEffect(() => {
    const rainCanvas = rainCanvasRef.current;
    const debrisCanvas = debrisCanvasRef.current;
    if (!rainCanvas || !debrisCanvas) return;

    let animId;
    const rainCtx = rainCanvas.getContext('2d');
    const debrisCtx = debrisCanvas.getContext('2d');

    const rainDrops = [];
    const debrisList = [];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(window.innerWidth * dpr);
      const h = Math.round(window.innerHeight * dpr);

      rainCanvas.width = w;
      rainCanvas.height = h;
      debrisCanvas.width = w;
      debrisCanvas.height = h;

      // Seed Rain
      rainDrops.length = 0;
      const rainCount = window.innerWidth < 820 ? 90 : 180;
      for (let i = 0; i < rainCount; i++) {
        rainDrops.push({
          x: Math.random(),
          y: Math.random(),
          len: 18 + Math.random() * 26,
          spd: 0.012 + Math.random() * 0.022,
          a: 0.15 + Math.random() * 0.35,
          w: 0.8 + Math.random() * 0.8,
        });
      }

      // Seed Debris
      debrisList.length = 0;
      const debrisCount = window.innerWidth < 820 ? 22 : 45;
      for (let i = 0; i < debrisCount; i++) {
        debrisList.push({
          x: Math.random(),
          y: Math.random(),
          size: 2 + Math.random() * 6,
          vy: -(0.0004 + Math.random() * 0.0012),
          vx: (Math.random() - 0.5) * 0.0008,
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 0.02,
          rod: Math.random() < 0.25,
          alpha: 0.2 + Math.random() * 0.5,
        });
      }
    }

    resize();
    window.addEventListener('resize', resize);

    function tick() {
      const rw = rainCanvas.width;
      const rh = rainCanvas.height;
      const dw = debrisCanvas.width;
      const dh = debrisCanvas.height;

      // 1. Paint Rain
      rainCtx.clearRect(0, 0, rw, rh);
      rainCtx.strokeStyle = 'rgba(216, 180, 254, 0.4)';
      rainCtx.lineCap = 'round';

      for (const d of rainDrops) {
        d.y += d.spd;
        d.x += 0.0015;
        if (d.y > 1.05) { d.y = -0.05; d.x = Math.random(); }
        if (d.x > 1.05) d.x = -0.05;

        const px = d.x * rw;
        const py = d.y * rh;
        rainCtx.lineWidth = d.w;
        rainCtx.globalAlpha = d.a;
        rainCtx.beginPath();
        rainCtx.moveTo(px, py);
        rainCtx.lineTo(px + 4, py + d.len);
        rainCtx.stroke();
      }
      rainCtx.globalAlpha = 1;

      // 2. Paint Debris
      debrisCtx.clearRect(0, 0, dw, dh);
      blastForceRef.current *= 0.93;
      const bf = blastForceRef.current;

      for (const it of debrisList) {
        it.y += it.vy - bf * 0.035;
        it.x += it.vx + (Math.random() - 0.5) * bf * 0.05;
        it.rot += it.vrot + bf * 0.12;

        if (it.y < -0.1) { it.y = 1.1; it.x = Math.random(); }
        if (it.y > 1.1) it.y = -0.1;

        const px = it.x * dw;
        const py = it.y * dh;

        debrisCtx.save();
        debrisCtx.translate(px, py);
        debrisCtx.rotate(it.rot);
        debrisCtx.globalAlpha = it.alpha + bf * 0.5;

        if (it.rod) {
          debrisCtx.fillStyle = '#0a0a10';
          debrisCtx.strokeStyle = 'rgba(199, 125, 255, 0.6)';
          debrisCtx.lineWidth = 1;
          debrisCtx.fillRect(-2, -it.size * 2.5, 4, it.size * 5);
          debrisCtx.strokeRect(-2, -it.size * 2.5, 4, it.size * 5);
        } else {
          debrisCtx.fillStyle = '#1c1b26';
          debrisCtx.strokeStyle = 'rgba(155, 93, 229, 0.4)';
          debrisCtx.lineWidth = 0.8;
          debrisCtx.beginPath();
          debrisCtx.moveTo(0, -it.size);
          debrisCtx.lineTo(it.size * 0.9, -it.size * 0.2);
          debrisCtx.lineTo(it.size * 0.6, it.size * 0.9);
          debrisCtx.lineTo(-it.size * 0.7, it.size * 0.7);
          debrisCtx.closePath();
          debrisCtx.fill();
          debrisCtx.stroke();
        }
        debrisCtx.restore();
      }

      animId = requestAnimationFrame(tick);
    }

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Custom Cursor
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let curX = targetX;
    let curY = targetY;
    let rId;

    function onPointerMove(e) {
      targetX = e.clientX;
      targetY = e.clientY;
    }

    function onPointerOver(e) {
      const target = e.target;
      if (target.closest('a, button, .card, .climax__btn, .interactive-hover')) {
        setCursorHot(true);
      } else {
        setCursorHot(false);
      }
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('mouseover', onPointerOver, { passive: true });

    function renderCursor() {
      curX += (targetX - curX) * 0.22;
      curY += (targetY - curY) * 0.22;
      cursor.style.transform = `translate(${curX}px, ${curY}px)`;
      rId = requestAnimationFrame(renderCursor);
    }
    rId = requestAnimationFrame(renderCursor);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('mouseover', onPointerOver);
      cancelAnimationFrame(rId);
    };
  }, []);

  // Procedural Storm & Lightning Bolts
  useEffect(() => {
    let strikeTimer;

    function makeBolt() {
      const x0 = 80 + Math.random() * 840;
      let x = x0, y = 0;
      let dPath = `M ${x.toFixed(0)} 0`;
      const steps = 14 + Math.floor(Math.random() * 8);
      const forks = [];
      const drift = (Math.random() - 0.5) * 40;

      for (let i = 1; i <= steps; i++) {
        y = (i / steps) * (620 + Math.random() * 300);
        x += drift + (Math.random() - 0.5) * 130;
        x = Math.max(20, Math.min(980, x));
        dPath += ` L ${x.toFixed(0)} ${y.toFixed(0)}`;
        if (Math.random() < 0.30 && i > 3) {
          let fx = x, fy = y, f = `M ${x.toFixed(0)} ${y.toFixed(0)}`;
          const fs = 2 + Math.floor(Math.random() * 4);
          for (let k = 0; k < fs; k++) {
            fx += (Math.random() - 0.5) * 150;
            fy += 40 + Math.random() * 80;
            f += ` L ${fx.toFixed(0)} ${fy.toFixed(0)}`;
          }
          forks.push(f);
        }
      }
      return { d: dPath + ' ' + forks.join(' '), x: x0 / 1000 };
    }

    function flicker(el, peak, ms) {
      if (!el) return;
      el.style.transition = 'none';
      el.style.opacity = String(peak);
      requestAnimationFrame(() => {
        el.style.transition = `opacity ${ms}ms cubic-bezier(.22,1,.36,1)`;
        el.style.opacity = '0';
      });
    }

    function strike() {
      const heavy = Math.random() < 0.6;
      const power = heavy ? 1 : 0.55 + Math.random() * 0.25;

      if (heavy && boltPathRef.current && stormBoltRef.current) {
        const b = makeBolt();
        boltPathRef.current.setAttribute('d', b.d);
        if (boltGlowRef.current) boltGlowRef.current.setAttribute('d', b.d);
        if (stormFlashRef.current) {
          stormFlashRef.current.style.setProperty('--bx', (b.x * 100).toFixed(0) + '%');
        }
        flicker(stormBoltRef.current, 1, 200);
      } else if (stormFlashRef.current) {
        stormFlashRef.current.style.setProperty('--bx', (15 + Math.random() * 70).toFixed(0) + '%');
      }

      flicker(stormFlashRef.current, heavy ? 0.95 : 0.45, heavy ? 400 : 320);

      setTimeout(() => {
        if (playThunder) playThunder(power);
      }, heavy ? 250 : 600);

      strikeTimer = setTimeout(strike, 4500 + Math.random() * 6000);
    }

    strikeTimer = setTimeout(strike, 2400);

    return () => {
      clearTimeout(strikeTimer);
    };
  }, [playThunder]);

  return (
    <>
      <div className="grain" aria-hidden="true"></div>
      <div className="vignette" aria-hidden="true"></div>

      {/* Sensory Rain Canvas */}
      <canvas ref={rainCanvasRef} className="rain-canvas" aria-hidden="true"></canvas>

      {/* Levitating Debris Canvas */}
      <canvas ref={debrisCanvasRef} className="debris-canvas" aria-hidden="true"></canvas>

      {/* Storm & Lightning Flash */}
      <div className="storm" aria-hidden="true">
        <div ref={stormFlashRef} className="storm__flash"></div>
        <svg ref={stormBoltRef} className="storm__bolt" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <path ref={boltPathRef} d="" fill="none" stroke="#f3e8ff" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          <path ref={boltGlowRef} d="" fill="none" stroke="#c084fc" strokeWidth="12" strokeLinejoin="round" strokeLinecap="round" opacity=".55" />
        </svg>
      </div>

      {/* Custom Concentric Rinnegan Cursor */}
      <div ref={cursorRef} className={`cursor ${cursorHot ? 'hot' : ''}`} aria-hidden="true">
        <div className="cursor__ring"></div>
        <div className="cursor__dot"></div>
      </div>
    </>
  );
}
