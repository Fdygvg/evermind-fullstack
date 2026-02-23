import React, { useEffect, useRef } from "react";
import SoundContext from "./SoundContextInstance";
import { createTone } from "../utils/soundUtils";

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

    const events = ["click", "touchstart", "keydown"];
    const initOnInteraction = () => {
      initAudio();
      events.forEach((e) => document.removeEventListener(e, initOnInteraction));
    };

    events.forEach((e) => document.addEventListener(e, initOnInteraction));

    return () => {
      events.forEach((e) => document.removeEventListener(e, initOnInteraction));
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playSound = (type) => {
    if (isMutedRef.current || !audioContextRef.current) return;

    const context = audioContextRef.current;

    switch (type) {
      case "correct":
        // Victory fanfare (upward arpeggio)
        createTone(context, 523.25, 0.3, "sine"); // C5
        setTimeout(() => createTone(context, 659.25, 0.3, "sine"), 100); // E5
        setTimeout(() => createTone(context, 783.99, 0.3, "sine"), 200); // G5
        setTimeout(() => createTone(context, 1046.5, 0.4, "sine"), 300); // C6
        break;

      case "wrong":
        // Sad descending tone
        createTone(context, 493.88, 0.4, "sawtooth"); // B4
        setTimeout(() => createTone(context, 392.0, 0.5, "sawtooth"), 100); // G4
        setTimeout(() => createTone(context, 329.63, 0.6, "sawtooth"), 200); // E4
        break;

      case "flip":
        // Quick card flip sound
        createTone(context, 523.25, 0.1, "triangle");
        setTimeout(() => createTone(context, 659.25, 0.1, "triangle"), 50);
        break;

      case "bong":
        // Low, resonant bong sound (e.g. for rating "Hard")
        createTone(context, 164.81, 0.8, "sine"); // E3
        setTimeout(() => createTone(context, 164.81, 0.6, "triangle"), 50);
        break;

      case "bell":
        // Clear notification bell
        createTone(context, 784.0, 0.5, "sine"); // G5
        setTimeout(() => createTone(context, 1046.5, 0.3, "sine"), 100); // C6
        break;

      case "chime":
        // Pleasant wind chime
        createTone(context, 659.25, 0.4, "sine"); // E5
        setTimeout(() => createTone(context, 830.61, 0.3, "sine"), 80); // G#5
        setTimeout(() => createTone(context, 987.77, 0.2, "sine"), 160); // B5
        break;

      case "ding":
        // Simple single ding
        createTone(context, 1046.5, 0.2, "triangle"); // C6
        break;

      case "whoosh": {
        // Swipe/transition sound
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.connect(gain);
        gain.connect(context.destination);

        osc.frequency.setValueAtTime(800, context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(
          200,
          context.currentTime + 0.5
        );

        gain.gain.setValueAtTime(0.1, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);

        osc.start(context.currentTime);
        osc.stop(context.currentTime + 0.5);
        break;
      }

      case "bubble":
        // Fun pop/bubble sound
        createTone(context, 329.63, 0.1, "sine"); // E4
        setTimeout(() => createTone(context, 392.0, 0.08, "sine"), 50); // G4
        break;

      case "tada":
        // Celebration fanfare
        createTone(context, 523.25, 0.4, "sine"); // C5
        setTimeout(() => createTone(context, 659.25, 0.3, "sine"), 100); // E5
        setTimeout(() => createTone(context, 783.99, 0.2, "sine"), 200); // G5
        setTimeout(() => createTone(context, 1046.5, 0.5, "sine"), 300); // C6
        setTimeout(() => createTone(context, 1318.51, 0.4, "sine"), 400); // E6
        break;

      case "error":
        // Harsher error sound
        createTone(context, 220, 0.3, "square"); // A3
        setTimeout(() => createTone(context, 196, 0.4, "square"), 100); // G3
        setTimeout(() => createTone(context, 174.61, 0.5, "square"), 200); // F3
        break;

      case "click": {
        // Subtle UI click
        const clickOsc = context.createOscillator();
        const clickGain = context.createGain();
        clickOsc.connect(clickGain);
        clickGain.connect(context.destination);

        clickOsc.frequency.setValueAtTime(1200, context.currentTime);
        clickOsc.type = "square";

        clickGain.gain.setValueAtTime(0.1, context.currentTime);
        clickGain.gain.exponentialRampToValueAtTime(
          0.01,
          context.currentTime + 0.05
        );

        clickOsc.start(context.currentTime);
        clickOsc.stop(context.currentTime + 0.05);
        break;
      }

      case "levelup":
        // RPG-style level up
        createTone(context, 523.25, 0.3, "sine"); // C5
        setTimeout(() => createTone(context, 659.25, 0.2, "sine"), 100); // E5
        setTimeout(() => createTone(context, 783.99, 0.2, "sine"), 200); // G5
        setTimeout(() => createTone(context, 1046.5, 0.4, "sine"), 300); // C6
        setTimeout(() => createTone(context, 1318.5, 0.5, "sine"), 400); // E6
        break;

      case "type":
        // Keyboard typing sound
        createTone(context, 440, 0.05, "sine"); // A4
        break;

      default:
        // Default fallback
        createTone(context, 440, 0.2, "sine");
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
