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
    const startValue = displayValue;
    let startTime: number | null = null;
    
    const animationStep = (timestamp: number) => {
        // Guard against updating state on an unmounted component. This is the fix.
        if (!isMounted.current) {
            return;
        }

        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentAnimatedValue = startValue + (targetBalance - startValue) * progress;

        setDisplayValue(currentAnimatedValue);
        
        if (progress < 1) {
            requestRef.current = requestAnimationFrame(animationStep);
        } else {
            // The isMounted check at the top of the function ensures this is also safe.
            setDisplayValue(targetBalance); // Ensure it lands perfectly
        }
    };
    
    requestRef.current = requestAnimationFrame(animationStep);

    return () => {
      if(requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };

  }, [targetBalance, duration]);

  return displayValue;
};

export default useAnimatedBalance;
