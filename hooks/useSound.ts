
import { useRef, useCallback } from 'react';

type SoundType = 'click' | 'pump' | 'pop' | 'win' | 'reveal' | 'tick' | 'deal' | 'cashout' | 'lose' | 'bet' | 'spin_tick';
type ContinuousSound = 'spin';

export const useSound = () => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const soundIntervalsRef = useRef<Record<string, NodeJS.Timeout | null>>({});

    const initAudioContext = useCallback(() => {
        if (typeof window !== 'undefined' && !audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (e) {
                console.error("Web Audio API is not supported in this browser.");
            }
        }
    }, []);

    const playSound = useCallback((type: SoundType) => {
        initAudioContext();
        const ctx = audioContextRef.current;
        if (!ctx) return;

        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const now = ctx.currentTime;
        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        
        switch (type) {
            case 'click': {
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                const osc = ctx.createOscillator();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(660, now);
                osc.frequency.exponentialRampToValueAtTime(330, now + 0.1);
                osc.connect(gain);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            }
            case 'bet': {
                gain.gain.setValueAtTime(0.6, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(330, now); // E4
                osc.frequency.exponentialRampToValueAtTime(165, now + 0.15);
                osc.connect(gain);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            }
            case 'pump': {
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                const noise = ctx.createBufferSource();
                const bufferSize = ctx.sampleRate * 0.2;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                noise.buffer = buffer;
                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(600, now);
                filter.frequency.linearRampToValueAtTime(100, now + 0.2);
                noise.connect(filter);
                filter.connect(gain);
                noise.start(now);
                noise.stop(now + 0.2);
                break;
            }
            case 'pop': {
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(1, now + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
                const osc = ctx.createOscillator();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
                osc.connect(gain);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            }
             case 'lose': {
                const osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.connect(gain);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
                break;
            }
            case 'win': {
                const osc1 = ctx.createOscillator();
                const osc2 = ctx.createOscillator();
                const osc3 = ctx.createOscillator();
                osc1.type = osc2.type = osc3.type = 'triangle';
                osc1.connect(gain);
                osc2.connect(gain);
                osc3.connect(gain);

                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

                osc1.frequency.setValueAtTime(523.25, now); 
                osc2.frequency.setValueAtTime(659.25, now); 
                osc3.frequency.setValueAtTime(783.99, now); 
                osc1.frequency.setValueAtTime(659.25, now + 0.1);
                osc2.frequency.setValueAtTime(783.99, now + 0.1);
                osc3.frequency.setValueAtTime(987.77, now + 0.1);
                osc1.frequency.setValueAtTime(783.99, now + 0.2);
                osc2.frequency.setValueAtTime(987.77, now + 0.2);
                osc3.frequency.setValueAtTime(1046.50, now + 0.2);

                osc1.start(now);
                osc1.stop(now + 0.6);
                osc2.start(now);
                osc2.stop(now + 0.6);
                osc3.start(now);
                osc3.stop(now + 0.6);
                break;
            }
            case 'cashout': {
                const osc1 = ctx.createOscillator();
                const osc2 = ctx.createOscillator();
                osc1.type = osc2.type = 'square';
                const bandpass = ctx.createBiquadFilter();
                bandpass.type = 'bandpass';
                bandpass.frequency.value = 6000;
                bandpass.Q.value = 0.5;
                osc1.connect(bandpass);
                osc2.connect(bandpass);
                bandpass.connect(gain);
                osc1.frequency.value = 2200;
                osc2.frequency.value = 4500;
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.4, now + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc1.start(now);
                osc1.stop(now + 0.4);
                osc2.start(now);
                osc2.stop(now + 0.4);
                setTimeout(() => {
                    gain.gain.setValueAtTime(0, now + 0.1);
                    gain.gain.linearRampToValueAtTime(0.3, now + 0.11);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                    osc1.frequency.value = 3200;
                    osc2.frequency.value = 5000;
                }, 100);
                break;
            }
            case 'reveal': {
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
                osc.connect(gain);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            }
            case 'tick': {
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                const osc = ctx.createOscillator();
                osc.type = 'square';
                osc.frequency.setValueAtTime(1000, now);
                osc.connect(gain);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            }
            case 'spin_tick': {
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
                const osc = ctx.createOscillator();
                osc.type = 'square';
                osc.frequency.setValueAtTime(2000, now);
                osc.connect(gain);
                osc.start(now);
                osc.stop(now + 0.04);
                break;
            }
             case 'deal': {
                const noiseSource = ctx.createBufferSource();
                const bufferSize = ctx.sampleRate * 0.1;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                let data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                noiseSource.buffer = buffer;
                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(2000, now);
                filter.frequency.exponentialRampToValueAtTime(5000, now + 0.1);
                filter.Q.setValueAtTime(1, now);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                noiseSource.connect(filter);
                filter.connect(gain);
                noiseSource.start(now);
                noiseSource.stop(now + 0.1);
                break;
            }
        }
    }, [initAudioContext]);

    const startSound = useCallback((type: ContinuousSound) => {
        if (soundIntervalsRef.current[type]) {
            return; 
        }
        if (type === 'spin') {
            soundIntervalsRef.current.spin = setInterval(() => {
                playSound('spin_tick');
            }, 120);
        }
    }, [playSound]);

    const stopSound = useCallback((type: ContinuousSound) => {
        if (soundIntervalsRef.current[type]) {
            clearInterval(soundIntervalsRef.current[type]!);
            soundIntervalsRef.current[type] = null;
        }
    }, []);


    return { playSound, startSound, stopSound };
};
