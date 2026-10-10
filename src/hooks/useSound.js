import { useEffect, useRef, useState, useCallback } from 'react';

export function useSound() {
  const [soundOn, setSoundOn] = useState(false);
  const audioCtxRef = useRef(null);
  const audioElRef = useRef(null);

  useEffect(() => {
    const audio = new Audio('pain_audio.mp3');
    audio.preload = 'auto';
    audio.loop = true;
    audioElRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const getAudioContext = useCallback(() => {
    if (audioCtxRef.current) return audioCtxRef.current;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtxRef.current = new AC();
    return audioCtxRef.current;
  }, []);

  // Procedural thunder synthesis (Brown noise + 52Hz sub-bass rumble)
  const playThunder = useCallback((power = 1) => {
    if (!soundOn) return;
    const ctx = getAudioContext();
    if (!ctx || ctx.state === 'suspended') return;

    try {
      const now = ctx.currentTime;
      const dur = 2.4 + Math.random() * 2.2 * power;
      const frames = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, frames, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < frames; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        d[i] = last * 3.4;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(1200 * power, now);
      lp.frequency.exponentialRampToValueAtTime(80, now + dur);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.52 * power, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.14 * power, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      const sub = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(52, now);
      sub.frequency.exponentialRampToValueAtTime(22, now + dur * 0.85);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.0001, now);
      subGain.gain.exponentialRampToValueAtTime(0.35 * power, now + 0.1);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + dur * 0.85);

      src.connect(lp);
      lp.connect(gain);
      gain.connect(ctx.destination);

      sub.connect(subGain);
      subGain.connect(ctx.destination);

      src.start(now);
      src.stop(now + dur);
      sub.start(now);
      sub.stop(now + dur);
    } catch (err) {
      console.warn('Thunder audio failed:', err);
    }
  }, [soundOn, getAudioContext]);

  // Procedural Shinra Tensei sub-bass shockwave blast
  const playShinraTenseiSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      const dur = 3.6;

      // 1. Suction Whoosh
      const oscWhoosh = ctx.createOscillator();
      oscWhoosh.type = 'triangle';
      oscWhoosh.frequency.setValueAtTime(40, now);
      oscWhoosh.frequency.exponentialRampToValueAtTime(280, now + 0.35);

      const whooshGain = ctx.createGain();
      whooshGain.gain.setValueAtTime(0.001, now);
      whooshGain.gain.exponentialRampToValueAtTime(0.4, now + 0.35);
      whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      // 2. Colossal Gravitational Bass Detonation
      const oscSub = ctx.createOscillator();
      oscSub.type = 'sine';
      oscSub.frequency.setValueAtTime(140, now + 0.38);
      oscSub.frequency.exponentialRampToValueAtTime(24, now + dur);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.0001, now);
      subGain.gain.setValueAtTime(0.0001, now + 0.38);
      subGain.gain.exponentialRampToValueAtTime(0.95, now + 0.44);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      // 3. Shockwave noise crack
      const frames = Math.floor(ctx.sampleRate * 1.5);
      const buf = ctx.createBuffer(1, frames, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < frames; i++) d[i] = (Math.random() * 2 - 1) * 0.8;
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = buf;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(450, now + 0.38);
      noiseFilter.frequency.exponentialRampToValueAtTime(60, now + 1.5);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.setValueAtTime(0.0001, now + 0.38);
      noiseGain.gain.exponentialRampToValueAtTime(0.7, now + 0.42);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

      oscWhoosh.connect(whooshGain);
      whooshGain.connect(ctx.destination);
      oscSub.connect(subGain);
      subGain.connect(ctx.destination);
      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      oscWhoosh.start(now);
      oscWhoosh.stop(now + 0.4);
      oscSub.start(now + 0.38);
      oscSub.stop(now + dur);
      noiseSrc.start(now + 0.38);
      noiseSrc.stop(now + 1.8);
    } catch (err) {
      console.warn('Shinra Tensei audio synthesis failed:', err);
    }

    if (audioElRef.current) {
      audioElRef.current.currentTime = 6.8;
      audioElRef.current.volume = 0.95;
      audioElRef.current.play().catch(() => {});
    }
  }, [getAudioContext]);

  const toggleSound = useCallback(async () => {
    const nextState = !soundOn;
    setSoundOn(nextState);

    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume();
    }

    if (nextState) {
      playThunder(0.85);
      if (audioElRef.current) {
        audioElRef.current.volume = 0.65;
        audioElRef.current.play().catch(() => {});
      }
    } else {
      if (audioElRef.current) {
        audioElRef.current.pause();
      }
    }
  }, [soundOn, getAudioContext, playThunder]);

  return {
    soundOn,
    toggleSound,
    playThunder,
    playShinraTenseiSound
  };
}
