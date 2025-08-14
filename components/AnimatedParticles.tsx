
import React from 'react';

const PARTICLE_COUNT = 40; // Increased count

const getRandomValue = (min: number, max: number) => Math.random() * (max - min) + min;

const particles = Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
  id: i,
  left: `${getRandomValue(0, 100)}%`,
  size: `${getRandomValue(0.3, 1.2)}rem`, // 5px to 19px
  animationDuration: `${getRandomValue(15, 40)}s`,
  animationDelay: `${getRandomValue(0, 35)}s`,
  color: ['bg-purple-500', 'bg-green-400/90', 'bg-yellow-300/90', 'bg-red-500/90', 'bg-pink-500/90'][Math.floor(Math.random() * 5)],
  shape: ['rounded-sm', 'rounded-full'][Math.floor(Math.random() * 2)],
  drift: `${getRandomValue(-20, 20)}vw`,
  blur: `blur(${getRandomValue(0, 1.5)}px)`
}));

const AnimatedParticles: React.FC = () => {
  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {particles.map(p => (
        <div
          key={p.id}
          className={`absolute animate-particle-roam ${p.color} ${p.shape}`}
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDuration: p.animationDuration,
            animationDelay: p.animationDelay,
            top: '-10%',
            filter: p.blur,
            '--drift': p.drift,
            '--duration': p.animationDuration,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default AnimatedParticles;
