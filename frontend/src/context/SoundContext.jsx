import React, { useEffect, useRef } from 'react';
import SoundContext from './SoundContextInstance';
import { createTone } from '../utils/soundUtils';

export const SoundProvider = ({ children }) => {
  const audioContextRef = useRef(null);
  const isMutedRef = useRef(false);

  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
      }
    };

    const events = ['click', 'touchstart', 'keydown'];
    const initOnInteraction = () => {
      initAudio();
      events.forEach(e => document.removeEventListener(e, initOnInteraction));
    };

    events.forEach(e => document.addEventListener(e, initOnInteraction));

    return () => {
      events.forEach(e => document.removeEventListener(e, initOnInteraction));
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playSound = type => {
    if (isMutedRef.current || !audioContextRef.current) return;

    const context = audioContextRef.current;

    switch (type) {
      case 'correct':
        createTone(context, 523.25, 0.3, 'sine');
        setTimeout(() => createTone(context, 659.25, 0.3, 'sine'), 100);
        break;

      case 'wrong':
        createTone(context, 392.0, 0.5, 'sawtooth');
        setTimeout(() => createTone(context, 329.63, 0.5, 'sawtooth'), 150);
        break;

      case 'flip':
        createTone(context, 440, 0.1, 'square');
        break;

      default:
        break;
    }
  };

  const toggleMute = () => {
    isMutedRef.current = !isMutedRef.current;
  };

  return (
    <SoundContext.Provider value={{ playSound, toggleMute }}>
      {children}
    </SoundContext.Provider>
  );
};
