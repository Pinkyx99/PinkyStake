import { useRef, useCallback } from 'react';

type SoundType = 'click' | 'pump' | 'pop' | 'win' | 'reveal' | 'tick' | 'deal' | 'cashout' | 'lose' | 'bet' | 'spin_tick' | 'blackjack_win' | 'roulette_win' | 'doors_win' | 'flip_spin' | 'flip_win';

export const useSound = () => {
    const audioContextRef = useRef<AudioContext | null>(null);

    const initAudioContext = useCallback(() => {
        if (typeof window !== 'undefined' && !audioContextRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) {
                console.error("Web Audio API is not supported in this browser.");
                return;
            }
            try {
                const context = new AudioContext();
                if (context.state === 'suspended') {
                    const resume = async () => {
                        await context.resume();
                        document.body.removeEventListener('click', resume);
                    }
                    document.body.addEventListener('click', resume);
                }
                audioContextRef.current = context;
            } catch (e) {
                console.error("Could not initialize AudioContext.", e);
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
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, now);
                osc.connect(gain);
                osc.start(now);
                osc.stop(now + 0.08);
                break;
            }
            case 'bet': {
                const oscTone = ctx.createOscillator();
                oscTone.type = 'sine';
                oscTone.frequency.setValueAtTime(440, now);
                oscTone.frequency.linearRampToValueAtTime(220, now + 0.1);
                
                const oscThump = ctx.createOscillator();
                oscThump.type = 'sine';
                oscThump.frequency.setValueAtTime(100, now);

                const toneGain = ctx.createGain();
                toneGain.gain.setValueAtTime(0.4, now);
                toneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                
                const thumpGain = ctx.createGain();
                thumpGain.gain.setValueAtTime(0.5, now);
                thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

                oscTone.connect(toneGain).connect(ctx.destination);
                oscThump.connect(thumpGain).connect(ctx.destination);
                
                oscTone.start(now);
                oscThump.start(now);
                oscTone.stop(now + 0.15);
                oscThump.stop(now + 0.1);
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
                filter.Q.value = 5;
                filter.frequency.setValueAtTime(800, now);
                filter.frequency.exponentialRampToValueAtTime(200, now + 0.2);
                noise.connect(filter);
                filter.connect(gain);
                noise.start(now);
                noise.stop(now + 0.2);
                break;
            }
            case 'pop': {
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(1, now + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
                
                const noise = ctx.createBufferSource();
                const bufferSize = ctx.sampleRate * 0.2;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for(let i=0; i<bufferSize; i++) data[i] = Math.random() * 2 - 1;
                noise.buffer = buffer;

                const bandpass = ctx.createBiquadFilter();
                bandpass.type = 'bandpass';
                bandpass.frequency.value = 800;
                bandpass.Q.value = 0.5;

                const thump = ctx.createOscillator();
                thump.type = 'sine';
                thump.frequency.setValueAtTime(100, now);
                thump.frequency.exponentialRampToValueAtTime(40, now + 0.1);

                noise.connect(bandpass).connect(gain);
                thump.connect(gain);

                noise.start(now);
                thump.start(now);
                noise.stop(now + 0.2);
                thump.stop(now + 0.1);
                break;
            }
             case 'lose': {
                const osc1 = ctx.createOscillator();
                const osc2 = ctx.createOscillator();
                osc1.type = osc2.type = 'sawtooth';
                
                osc1.frequency.setValueAtTime(150, now);
                osc2.frequency.setValueAtTime(155, now);
                osc1.frequency.exponentialRampToValueAtTime(50, now + 0.4);
                osc2.frequency.exponentialRampToValueAtTime(50, now + 0.4);
                
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

                osc1.connect(gain);
                osc2.connect(gain);
                
                osc1.start(now);
                osc2.start(now);
                osc1.stop(now + 0.4);
                osc2.stop(now + 0.4);
                break;
            }
            case 'win': {
                const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
                notes.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    osc.type = 'triangle';
                    osc.frequency.value = freq;
                    const noteGain = ctx.createGain();
                    noteGain.gain.setValueAtTime(0.4, now + i * 0.1);
                    noteGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.2);
                    osc.connect(noteGain).connect(ctx.destination);
                    osc.start(now + i * 0.1);
                    osc.stop(now + i * 0.1 + 0.2);
                });
                break;
            }
            case 'reveal': {
                const osc = ctx.createOscillator();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(500, now);
                osc.frequency.exponentialRampToValueAtTime(1000, now + 0.15);

                const vibrato = ctx.createOscillator();
                vibrato.frequency.value = 15;
                const vibratoGain = ctx.createGain();
                vibratoGain.gain.value = 10;
                vibrato.connect(vibratoGain).connect(osc.frequency);

                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.connect(gain);
                vibrato.start(now);
                osc.start(now);
                vibrato.stop(now + 0.2);
                osc.stop(now + 0.2);
                break;
            }
            case 'tick': {
                const osc = ctx.createOscillator();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(1000, now);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.connect(gain);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            }
            case 'deal': { // Soft swoosh
                const noise = ctx.createBufferSource();
                const bufferSize = ctx.sampleRate * 0.15;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
                noise.buffer = buffer;
                
                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.Q.value = 3;
                filter.frequency.setValueAtTime(2000, now);
                filter.frequency.exponentialRampToValueAtTime(500, now + 0.15);
                
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                
                noise.connect(filter).connect(gain);
                noise.start(now);
                noise.stop(now + 0.15);
                break;
            }
            case 'cashout': { // cha-ching with sparkle
                const osc1 = ctx.createOscillator();
                const osc2 = ctx.createOscillator();
                const sparkle = ctx.createOscillator();
                osc1.type = osc2.type = 'triangle';
                sparkle.type = 'sine';

                osc1.frequency.setValueAtTime(1046.50, now); // C6
                osc2.frequency.setValueAtTime(1318.51, now); // E6
                sparkle.frequency.setValueAtTime(2093.00, now); // C7

                const mainGain = ctx.createGain();
                mainGain.gain.setValueAtTime(0.5, now);
                mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                
                const sparkleGain = ctx.createGain();
                sparkleGain.gain.setValueAtTime(0.3, now);
                sparkleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

                osc1.connect(mainGain).connect(ctx.destination);
                osc2.connect(mainGain).connect(ctx.destination);
                sparkle.connect(sparkleGain).connect(ctx.destination);
                
                osc1.start(now);
                osc2.start(now + 0.05);
                sparkle.start(now);
                
                osc1.stop(now + 0.4);
                osc2.stop(now + 0.4);
                sparkle.stop(now + 0.2);
                break;
            }
            case 'spin_tick': {
                const osc = ctx.createOscillator();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(1300, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
                osc.connect(gain);
                osc.start(now);
                osc.stop(now + 0.03);
                break;
            }
            case 'blackjack_win': { // Richer chip shuffle
                for (let i = 0; i < 5; i++) {
                    const timeOffset = now + i * 0.06 + Math.random() * 0.02;
                    const noise = ctx.createBufferSource();
                    const bufferSize = ctx.sampleRate * 0.06;
                    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                    const data = buffer.getChannelData(0);
                    for (let j = 0; j < bufferSize; j++) data[j] = Math.random() * 2 - 1;
                    noise.buffer = buffer;

                    const filter = ctx.createBiquadFilter();
                    filter.type = 'bandpass';
                    filter.frequency.value = 1500 + Math.random() * 1500;
                    filter.Q.value = 5 + Math.random() * 5;
                    
                    const noteGain = ctx.createGain();
                    noteGain.gain.setValueAtTime(0.3, timeOffset);
                    noteGain.gain.exponentialRampToValueAtTime(0.001, timeOffset + 0.1);

                    noise.connect(filter).connect(noteGain).connect(ctx.destination);
                    noise.start(timeOffset);
                    noise.stop(timeOffset + 0.1);
                }
                break;
            }
            case 'roulette_win': {
                const baseNote = ctx.createOscillator();
                baseNote.type = 'sine';
                baseNote.frequency.value = 261.63; // C4
                const baseGain = ctx.createGain();
                baseGain.gain.setValueAtTime(0.4, now);
                baseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
                baseNote.connect(baseGain).connect(ctx.destination);
                baseNote.start(now);
                baseNote.stop(now + 0.6);

                const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
                notes.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    osc.type = 'triangle';
                    osc.frequency.value = freq;
                    const noteGain = ctx.createGain();
                    noteGain.gain.setValueAtTime(0.3, now + i * 0.1);
                    noteGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
                    osc.connect(noteGain).connect(ctx.destination);
                    osc.start(now + i * 0.1);
                    osc.stop(now + i * 0.1 + 0.3);
                });
                break;
            }
            case 'doors_win': {
                const createShimmer = (freq: number, delay: number) => {
                    const osc = ctx.createOscillator();
                    osc.type = 'sine';
                    const vibrato = ctx.createOscillator();
                    vibrato.frequency.value = 10;
                    const vibratoGain = ctx.createGain();
                    vibratoGain.gain.value = 15;
                    vibrato.connect(vibratoGain).connect(osc.frequency);
                    
                    osc.frequency.setValueAtTime(freq, now + delay);
                    osc.frequency.exponentialRampToValueAtTime(freq * 2, now + delay + 0.5);
                    gain.gain.setValueAtTime(0.4, now + delay);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.6);
                    
                    osc.connect(gain);
                    vibrato.start(now + delay);
                    osc.start(now + delay);
                    vibrato.stop(now + delay + 0.6);
                    osc.stop(now + delay + 0.6);
                }
                createShimmer(880, 0); // A5
                createShimmer(880 * 1.05, 0.05); // slightly detuned A5
                break;
            }
            case 'flip_spin': {
                const noise = ctx.createBufferSource();
                const bufferSize = ctx.sampleRate * 0.5;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
                noise.buffer = buffer;
                
                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.Q.value = 8;
                filter.frequency.setValueAtTime(400, now);
                filter.frequency.exponentialRampToValueAtTime(4000, now + 0.5);
                
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                
                noise.connect(filter).connect(gain);
                noise.start(now);
                noise.stop(now + 0.5);
                break;
            }
            case 'flip_win': {
                const osc1 = ctx.createOscillator();
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(1046.50, now); // C6

                const osc2 = ctx.createOscillator();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(1567.98, now); // G6
                
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                
                osc1.connect(gain);
                osc2.connect(gain);
                osc1.start(now);
                osc2.start(now);
                osc1.stop(now + 0.3);
                osc2.stop(now + 0.3);
                break;
            }
        }
    }, [initAudioContext]);

    return { playSound };
};