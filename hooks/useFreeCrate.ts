import { useState, useEffect, useCallback } from 'react';

const CRATE_COOLDOWN = 60 * 1000; // 1 minute in milliseconds
const STORAGE_KEY = 'freeCrateNextClaimTime';

export const useFreeCrate = () => {
  const [nextClaimTime, setNextClaimTime] = useState<number>(() => {
    try {
      const storedTime = localStorage.getItem(STORAGE_KEY);
      // Ensure storedTime is valid, otherwise default to now
      if (storedTime && !isNaN(parseInt(storedTime, 10))) {
          return parseInt(storedTime, 10);
      }
    } catch (error) {
      console.warn("Could not access localStorage. Free crate timer will not persist.", error);
    }
    return Date.now();
  });

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const canClaim = timeLeft <= 0;

  useEffect(() => {
    const updateTimer = () => {
      const remaining = Math.max(0, nextClaimTime - Date.now());
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [nextClaimTime]);

  const resetTimer = useCallback(() => {
    const newNextClaimTime = Date.now() + CRATE_COOLDOWN;
    try {
      localStorage.setItem(STORAGE_KEY, newNextClaimTime.toString());
    } catch (error) {
      console.warn("Could not set localStorage. Free crate timer will not persist.", error);
    }
    setNextClaimTime(newNextClaimTime);
  }, []);

  return { timeLeft, canClaim, resetTimer };
};
