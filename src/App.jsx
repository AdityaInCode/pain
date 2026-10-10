import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLenis } from './hooks/useLenis';
import { useSound } from './hooks/useSound';
import { Loader } from './components/Loader';
import { AmbientCanvas } from './components/AmbientCanvas';
import { HeaderNav } from './components/HeaderNav';
import { Act1Scrub } from './components/Act1Scrub';
import { Act2Rinnegan } from './components/Act2Rinnegan';
import { Act3SixPaths } from './components/Act3SixPaths';
import { Act4Climax } from './components/Act4Climax';
import { Act5Philosophy } from './components/Act5Philosophy';
import { Footer } from './components/Footer';

const MAIN_COUNT = 75;
const EYE_COUNT = 51;
const pad = (n) => String(n).padStart(3, '0');

export default function App() {
  // 1. Lenis Smooth Inertia Scroll
  useLenis();

  // 2. Sound & Procedural Audio Synthesis
  const { soundOn, toggleSound, playThunder, playShinraTenseiSound } = useSound();

  // 3. Preloader & Image Buffers
  const [loadProgress, setLoadProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [mainFrames, setMainFrames] = useState([]);
  const [eyeFrames, setEyeFrames] = useState([]);

  // 4. Shinra Tensei Climax State & Shockwave
  const [isPushing, setIsPushing] = useState(false);
  const shockwaveRef = useRef(null);
  const mainRef = useRef(null);

  useEffect(() => {
    const mFrames = [];
    const eFrames = [];
    const total = MAIN_COUNT + EYE_COUNT;
    let loadedCount = 0;

    function loadImage(src, bucket, index) {
      return new Promise((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = img.onerror = () => {
          bucket[index] = img;
          loadedCount++;
          const pct = loadedCount / total;
          setLoadProgress(pct);
          resolve();
        };
        img.src = src;
      });
    }

    const promises = [];
    for (let i = 1; i <= MAIN_COUNT; i++) {
      promises.push(loadImage(`frames/main/${pad(i)}.jpg`, mFrames, i - 1));
    }
    for (let i = 1; i <= EYE_COUNT; i++) {
      promises.push(loadImage(`frames/eyes/${pad(i)}.jpg`, eFrames, i - 1));
    }

    Promise.all(promises).then(() => {
      setMainFrames(mFrames);
      setEyeFrames(eFrames);
      setTimeout(() => {
        setIsReady(true);
      }, 700);
    });
  }, []);

  // Shinra Tensei Almighty Push Trigger
  const triggerPush = useCallback(() => {
    if (isPushing) return;
    setIsPushing(true);

    // Audio & Sub-bass rumble
    playShinraTenseiSound();

    // Screen Shake on #main
    const mainEl = mainRef.current;
    if (mainEl) {
      let shakeFrames = 20;
      const shakeInterval = setInterval(() => {
        if (shakeFrames-- <= 0) {
          clearInterval(shakeInterval);
          mainEl.style.transform = 'none';
        } else {
          const rx = (Math.random() - 0.5) * shakeFrames * 2.0;
          const ry = (Math.random() - 0.5) * shakeFrames * 2.0;
          mainEl.style.transform = `translate(${rx}px, ${ry}px)`;
        }
      }, 25);
    }

    // Shockwave Overlay Animation
    const sw = shockwaveRef.current;
    if (sw) {
      sw.style.transition = 'none';
      sw.style.opacity = '1';
      sw.style.transform = 'scale(0.2)';

      requestAnimationFrame(() => {
        sw.style.transition = 'opacity 1.4s cubic-bezier(0.22, 1, 0.36, 1), transform 1.2s cubic-bezier(0.08, 0.82, 0.17, 1)';
        sw.style.opacity = '0';
        sw.style.transform = 'scale(3.8)';
      });
    }

    setTimeout(() => {
      setIsPushing(false);
    }, 2400);
  }, [isPushing, playShinraTenseiSound]);

  return (
    <div className="pain-app">
      {/* 1. Preloader */}
      <Loader progress={loadProgress} isReady={isReady} />

      {/* 2. Ambient Particles & Lightning */}
      <AmbientCanvas playThunder={playThunder} blastForceTrigger={isPushing} />

      {/* 3. Navigation Header */}
      <HeaderNav soundOn={soundOn} toggleSound={toggleSound} onQuickPush={triggerPush} />

      {/* 4. Main Storytelling Acts */}
      <main ref={mainRef} id="main">
        <Act1Scrub mainFrames={mainFrames} />
        <Act2Rinnegan eyeFrames={eyeFrames} />
        <Act3SixPaths />
        <Act4Climax onPush={triggerPush} isPushing={isPushing} />
        <Act5Philosophy />
        <Footer />
      </main>

      {/* 5. Shockwave Ripple Overlay */}
      <div ref={shockwaveRef} className="shockwave-overlay" aria-hidden="true"></div>
    </div>
  );
}
