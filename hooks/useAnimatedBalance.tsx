import { useState, useEffect, useRef } from 'react';

const useAnimatedBalance = (targetBalance: number, duration: number = 500) => {
  const [displayValue, setDisplayValue] = useState(targetBalance);
  const requestRef = useRef<number | null>(null);
  const isMounted = useRef(true);

  // This effect ensures the isMounted ref is correctly handled on mount and unmount.
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Guard against environments where requestAnimationFrame is not available.
    if (typeof window === 'undefined' || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
      setDisplayValue(targetBalance);
      return;
    }
    
    const startValue = displayValue;
    let startTime: number | null = null;
    
    const animationStep = (timestamp: number) => {
        // Guard against updating state on an unmounted component.
        if (!isMounted.current) {
            return;
        }

        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentAnimatedValue = startValue + (targetBalance - startValue) * progress;

        setDisplayValue(currentAnimatedValue);
        
        if (progress < 1) {
            requestRef.current = window.requestAnimationFrame(animationStep);
        } else {
            // The isMounted check at the top of the function ensures this is also safe.
            setDisplayValue(targetBalance); // Ensure it lands perfectly
        }
    };
    
    // Cancel any existing animation frame before starting a new one.
    if (requestRef.current) {
        window.cancelAnimationFrame(requestRef.current);
    }
    requestRef.current = window.requestAnimationFrame(animationStep);

    return () => {
      if(requestRef.current) {
        window.cancelAnimationFrame(requestRef.current);
      }
    };

  }, [targetBalance, duration]);

  return displayValue;
};

export default useAnimatedBalance;