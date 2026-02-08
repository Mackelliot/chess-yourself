'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

const ALL_FRAMES = [
  'Napoleon.jpg',
  'Napoleon-blink.jpg',
  'Napoleon-glance.jpg',
  'Napoleon-tongue.jpg',
  'Napoleon-antlers01.jpg',
  'Napoleon-antlers02.jpg',
  'Napoleon-brow.jpg',
  'Napoleon-wink.jpg',
  'Napoleon-kiss01.jpg',
  'Napoleon-kiss02.jpg',
  'Napoleon-disgust.jpg',
  'Napoleon-laugh01.jpg',
  'Napoleon-laugh02.jpg',
  'Napoleon-frown.jpg',
];

const MOOD_SEQUENCES = {
  mocking: {
    duration: 4000,
    play(setFrame, timerRef) {
      // tongue 500ms → antlers01/02 loop
      setFrame('Napoleon-tongue.jpg');
      const timers = [];
      timers.push(setTimeout(() => {
        let toggle = true;
        setFrame('Napoleon-antlers01.jpg');
        const iv = setInterval(() => {
          setFrame(toggle ? 'Napoleon-antlers02.jpg' : 'Napoleon-antlers01.jpg');
          toggle = !toggle;
        }, 400);
        timers.push(iv);
        timerRef._interval = iv;
      }, 500));
      timerRef._timers = timers;
    },
    cleanup(timerRef) {
      if (timerRef._timers) timerRef._timers.forEach(t => clearTimeout(t));
      if (timerRef._interval) clearInterval(timerRef._interval);
    },
  },
  surprise: {
    duration: 3000,
    play(setFrame, timerRef) {
      let toggle = true;
      setFrame('Napoleon.jpg');
      const iv = setInterval(() => {
        setFrame(toggle ? 'Napoleon-brow.jpg' : 'Napoleon.jpg');
        toggle = !toggle;
      }, 400);
      timerRef._interval = iv;
    },
    cleanup(timerRef) {
      if (timerRef._interval) clearInterval(timerRef._interval);
    },
  },
  acknowledge: {
    duration: 3000,
    play(setFrame, timerRef) {
      let toggle = true;
      setFrame('Napoleon.jpg');
      const iv = setInterval(() => {
        setFrame(toggle ? 'Napoleon-wink.jpg' : 'Napoleon.jpg');
        toggle = !toggle;
      }, 500);
      timerRef._interval = iv;
    },
    cleanup(timerRef) {
      if (timerRef._interval) clearInterval(timerRef._interval);
    },
  },
  flirty: {
    duration: 4000,
    play(setFrame, timerRef) {
      let toggle = true;
      setFrame('Napoleon-kiss01.jpg');
      const iv = setInterval(() => {
        setFrame(toggle ? 'Napoleon-kiss02.jpg' : 'Napoleon-kiss01.jpg');
        toggle = !toggle;
      }, 500);
      timerRef._interval = iv;
    },
    cleanup(timerRef) {
      if (timerRef._interval) clearInterval(timerRef._interval);
    },
  },
  disappointed: {
    duration: 4000,
    play(setFrame) {
      setFrame('Napoleon-disgust.jpg');
    },
    cleanup() {},
  },
  angry: {
    duration: 4000,
    play(setFrame) {
      setFrame('Napoleon-disgust.jpg');
    },
    cleanup() {},
  },
  laugh: {
    duration: 4000,
    play(setFrame, timerRef) {
      setFrame('Napoleon-laugh01.jpg');
      const schedule = () => {
        const delay = 300 + Math.random() * 200;
        return setTimeout(() => {
          setFrame('Napoleon-laugh02.jpg');
          const revert = setTimeout(() => {
            setFrame('Napoleon-laugh01.jpg');
            timerRef._next = schedule();
          }, 150);
          timerRef._revert = revert;
        }, delay);
      };
      timerRef._next = schedule();
    },
    cleanup(timerRef) {
      if (timerRef._next) clearTimeout(timerRef._next);
      if (timerRef._revert) clearTimeout(timerRef._revert);
    },
  },
};

function startIdleLoop(setFrame, timerRef) {
  setFrame('Napoleon.jpg');

  const scheduleBlink = () => {
    const delay = 3000 + Math.random() * 3000;
    timerRef._blink = setTimeout(() => {
      setFrame('Napoleon-blink.jpg');
      timerRef._blinkRevert = setTimeout(() => {
        setFrame('Napoleon.jpg');
        scheduleBlink();
      }, 150);
    }, delay);
  };

  const scheduleGlance = () => {
    const delay = 8000 + Math.random() * 4000;
    timerRef._glance = setTimeout(() => {
      setFrame('Napoleon-glance.jpg');
      timerRef._glanceRevert = setTimeout(() => {
        setFrame('Napoleon.jpg');
        scheduleGlance();
      }, 400);
    }, delay);
  };

  scheduleBlink();
  scheduleGlance();
}

function stopIdleLoop(timerRef) {
  clearTimeout(timerRef._blink);
  clearTimeout(timerRef._blinkRevert);
  clearTimeout(timerRef._glance);
  clearTimeout(timerRef._glanceRevert);
}

const NapoleonAvatar = ({ mood, size = 16 }) => {
  const [currentFrame, setCurrentFrame] = useState('Napoleon.jpg');
  const activeMoodRef = useRef('standard');
  const moodTimerRef = useRef({});
  const idleTimerRef = useRef({});
  const decayTimerRef = useRef(null);

  // Preload all images on mount
  useEffect(() => {
    ALL_FRAMES.forEach((src) => {
      const img = new Image();
      img.src = `/napoleon/${src}`;
    });
  }, []);

  const startIdle = useCallback(() => {
    activeMoodRef.current = 'standard';
    startIdleLoop(setCurrentFrame, idleTimerRef.current);
  }, []);

  const stopAll = useCallback(() => {
    // Stop active mood sequence
    const seq = MOOD_SEQUENCES[activeMoodRef.current];
    if (seq) seq.cleanup(moodTimerRef.current);
    moodTimerRef.current = {};
    // Stop idle
    stopIdleLoop(idleTimerRef.current);
    // Stop decay timer
    if (decayTimerRef.current) {
      clearTimeout(decayTimerRef.current);
      decayTimerRef.current = null;
    }
  }, []);

  // Start idle on mount
  useEffect(() => {
    startIdle();
    return () => stopAll();
  }, [startIdle, stopAll]);

  // React to mood changes
  useEffect(() => {
    const moodKey = mood || 'standard';

    // If same mood or standard, let idle run
    if (moodKey === 'standard') return;

    const seq = MOOD_SEQUENCES[moodKey];
    if (!seq) return;

    // Clear everything
    stopAll();

    // Start new mood
    activeMoodRef.current = moodKey;
    moodTimerRef.current = {};
    seq.play(setCurrentFrame, moodTimerRef.current);

    // Schedule decay back to idle
    decayTimerRef.current = setTimeout(() => {
      seq.cleanup(moodTimerRef.current);
      moodTimerRef.current = {};
      startIdle();
    }, seq.duration);

    return () => stopAll();
  }, [mood, stopAll, startIdle]);

  return (
    <div
      className="relative shrink-0 crt-container rounded overflow-hidden"
      style={{ width: size * 4, height: size * 4 }}
    >
      <img
        src={`/napoleon/${currentFrame}`}
        alt="Napoleon"
        className="w-full h-full object-cover crt-avatar"
      />
      <div className="absolute inset-0 bg-blue-600/50 mix-blend-color" />
      <div className="crt-scanlines" />
    </div>
  );
};

export default NapoleonAvatar;
