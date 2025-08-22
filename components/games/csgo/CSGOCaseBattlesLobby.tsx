import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Page } from '../../../App.tsx';
import { useUser } from '../../../contexts/UserContext.tsx';
import { allCSGOCases } from './data.ts';
import type { CSGOCase, CSGOBattle, CSGOBattlePlayer, CSGOItem, CSGOItemRarity } from '../../../types.ts';
import PlusIcon from '../../icons/PlusIcon.tsx';
import UsersIcon from '../../icons/UsersIcon.tsx';
import CoinIcon from '../../icons/CoinIcon.tsx';
import { useSound } from '../../../hooks/useSound.ts';
import CloseIcon from '../../icons/CloseIcon.tsx';
import PlusSquareIcon from '../../icons/PlusSquareIcon.tsx';
import SearchIcon from '../../icons/SearchIcon.tsx';

// FAKE DATA & HELPERS
const FAKE_BOT_NAMES = ['Bot_Alpha', 'Bot_Bravo', 'Bot_Charlie', 'Bot_Delta'];
const FAKE_AVATARS = ['https://i.imgur.com/s6p4eF8.png', 'https://i.imgur.com/5J7m1jR.png', 'https://i.imgur.com/9n9s8Z2.png'];
const RARITY_COLORS: Record<CSGOItemRarity, string> = { 'Mil-Spec': '#3b82f6', 'Restricted': '#8b5cf6', 'Classified': '#ec4899', 'Covert': '#ef4444', 'Contraband': '#f97316', 'Extraordinary': '#f59e0b', 'Consumer': '#d1d5db', 'Industrial': '#60a5fa' };
const pickWinningItem = (csgoCase: CSGOCase): CSGOItem => { let r = Math.random() * 100; for (const i of csgoCase.items) { if (r < i.odds) return i; r -= i.odds; } return csgoCase.items[csgoCase.items.length - 1]; };

interface CSGOCaseBattlesLobbyProps { setPage: (page: Page) => void; battles: CSGOBattle[]; setBattles: React.Dispatch<React.SetStateAction<CSGOBattle[]>>; battleId?: string; }
type SpinResult = { key: number; reelItems: CSGOItem[]; style: React.CSSProperties; winner: CSGOItem; };

// #region Create Battle Modal (Self-contained)
const CreateBattleModal: React.FC<{ isOpen: boolean; onClose: () => void; onCreate: (c: CSGOCase[], p: 2 | 3 | 4, r: boolean) => void; }> = ({ isOpen, onClose, onCreate }) => {
    const [selectedCases, setSelectedCases] = useState<Map<string, { caseInfo: CSGOCase; quantity: number }>>(new Map());
    const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2);
    const [isReverseMode, setIsReverseMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCasePicker, setShowCasePicker] = useState(false);
    const filteredCases = useMemo(() => allCSGOCases.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())), [searchTerm]);
    const totalCaseCount = useMemo(() => Array.from(selectedCases.values()).reduce((s, { quantity: q }) => s + q, 0), [selectedCases]);
    const totalCost = useMemo(() => Array.from(selectedCases.values()).reduce((s, { caseInfo: c, quantity: q }) => s + (c.price * q), 0), [selectedCases]);
    const handleAddCase = (c: CSGOCase) => { if (totalCaseCount < 10) { setSelectedCases(p => { const n = new Map(p); const e = n.get(c.id); n.set(c.id, e ? { ...e, quantity: e.quantity + 1 } : { caseInfo: c, quantity: 1 }); return n; }); setShowCasePicker(false); } };
    const handleQuantityChange = (id: string, d: number) => { setSelectedCases(p => { const n = new Map(p); const e = n.get(id); if (!e) return p; const t = Array.from(n.values()).reduce((s, { quantity: q }) => s + q, 0); if (d > 0 && t >= 10) return p; const nq = e.quantity + d; if (nq <= 0) n.delete(id); else n.set(id, { ...e, quantity: nq }); return n; }); };
    const handleCreateClick = () => { if (totalCaseCount > 0) { const a: CSGOCase[] = []; selectedCases.forEach(({ caseInfo: c, quantity: q }) => { for (let i = 0; i < q; i++) a.push(c); }); onCreate(a, playerCount, isReverseMode); onClose(); } };
    useEffect(() => { if (!isOpen) { setSelectedCases(new Map()); setPlayerCount(2); setIsReverseMode(false); setShowCasePicker(false); setSearchTerm(''); } }, [isOpen]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 z-[120] flex items-center justify-center p-4 font-poppins" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-lg shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-slate-700 flex justify-between items-center"><h2 className="text-xl font-bold text-white">Create Battle</h2><button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6"/></button></header>
                <main className="p-6 space-y-6">
                    <div className="bg-slate-800/50 p-2 rounded-md min-h-[80px] flex flex-col gap-2 max-h-48 overflow-y-auto">
                        {Array.from(selectedCases.values()).map(({ caseInfo, quantity }) => ( <div key={caseInfo.id} className="flex items-center justify-between bg-slate-700 p-2 rounded shrink-0"><div className="flex items-center gap-2 overflow-hidden"><img src={caseInfo.imageUrl} alt={caseInfo.name} className="w-12 h-12 object-contain"/><span className="text-sm font-semibold truncate">{caseInfo.name}</span></div><div className="flex items-center gap-2"><button onClick={() => handleQuantityChange(caseInfo.id, -1)} className="w-7 h-7 bg-slate-600 rounded">-</button><span className="w-8 text-center">{quantity}</span><button onClick={() => handleQuantityChange(caseInfo.id, 1)} disabled={totalCaseCount>=10} className="w-7 h-7 bg-slate-600 rounded disabled:opacity-50">+</button></div></div>))}
                        {totalCaseCount<10 && <button onClick={()=>setShowCasePicker(true)} className="w-full h-12 bg-slate-700/50 hover:bg-slate-700 rounded-md flex items-center justify-center border-2 border-dashed border-slate-600"><PlusSquareIcon className="w-6 h-6"/></button>}
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div><h3 className="text-sm font-semibold mb-2">Players</h3><div className="flex gap-2">{([2,3,4] as const).map(n=><button key={n} onClick={()=>setPlayerCount(n)} className={`px-4 py-2 rounded-md font-bold ${playerCount===n ? 'bg-purple-600':'bg-slate-700'}`}>{n}</button>)}</div></div>
                        <div><h3 className="text-sm font-semibold mb-2">Mode</h3><label className="flex items-center gap-2"><input type="checkbox" checked={isReverseMode} onChange={()=>setIsReverseMode(p=>!p)} className="form-checkbox h-5 w-5 rounded bg-slate-700 border-slate-600 text-purple-600 focus:ring-purple-500"/><span>Reverse</span></label></div>
                    </div>
                </main>
                <footer className="p-4 border-t border-slate-700"><button onClick={handleCreateClick} disabled={totalCaseCount===0} className="w-full py-3 bg-green-600 rounded font-bold text-white disabled:bg-slate-600">Create Battle ({totalCost.toFixed(2)} EUR)</button></footer>
                {showCasePicker && <div className="fixed inset-0 bg-black/80 z-[130] flex items-center justify-center p-4" onClick={()=>setShowCasePicker(false)}><div className="bg-slate-800 border border-slate-700 w-full max-w-4xl h-[80vh] rounded-lg shadow-2xl flex flex-col" onClick={e=>e.stopPropagation()}><header className="p-4 border-b border-slate-700 sticky top-0 bg-slate-800"><div className="relative"><SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="text" placeholder="Search..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full bg-slate-900 rounded-md pl-10 pr-4 py-2"/></div></header><main className="p-4 overflow-y-auto"><div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">{filteredCases.map(c=><div key={c.id} onClick={()=>handleAddCase(c)} className="cursor-pointer p-2 bg-slate-700/50 hover:bg-slate-700 rounded text-center"><img src={c.imageUrl} alt={c.name} className="w-24 h-24 mx-auto object-contain"/><p className="text-xs font-semibold mt-2 truncate">{c.name}</p><p className="text-xs font-bold text-yellow-400">${c.price.toFixed(2)}</p></div>)}</div></main></div></div>}
            </div>
        </div>
    );
};
// #endregion

// #region Battle View (Self-contained)
const CaseBattleView: React.FC<{ battle: CSGOBattle; setBattles: React.Dispatch<React.SetStateAction<CSGOBattle[]>>; setPage: (page: Page) => void; }> = ({ battle: initialBattle, setBattles, setPage }) => {
    const { user } = useUser();
    const { playSound } = useSound();
    const [battle, setBattle] = useState(initialBattle);
    const [round, setRound] = useState(0);
    const [phase, setPhase] = useState<'joining'|'starting'|'spinning'|'round_end'|'finished'>('joining');
    const [spinResults, setSpinResults] = useState<Record<string, SpinResult | null>>({});
    const isMountedRef = useRef(true);
    const soundTimeoutRef = useRef<ReturnType<typeof setTimeout>|null>(null);
    useEffect(() => { isMountedRef.current = true; return () => { isMountedRef.current = false; if(soundTimeoutRef.current) clearTimeout(soundTimeoutRef.current); }; }, []);
    const endBattle = () => { setPage({ name: 'csgo-battles-lobby' }); };
    
    useEffect(()=>{
        if(phase!=='joining'||!battle.players.includes(null)) return;
        const t=setTimeout(()=>{
            if(!isMountedRef.current||!user) return;
            const p=[...battle.players];
            let userJoined=p.some(pl=>pl?.id===user.id);
            for(let i=0;i<p.length;i++){
                if(p[i]===null){
                    if(!userJoined){
                        p[i]={id:user.id,name:user.username,avatarUrl:'https://i.imgur.com/sIqj4t2.png',isBot:false,items:[],totalValue:0};
                        userJoined=true;
                    }else{
                        p[i]={id:`bot-${i}`,name:FAKE_BOT_NAMES[i-1],avatarUrl:FAKE_AVATARS[i-1],isBot:true,items:[],totalValue:0};
                    }
                }
            }
            const updatedBattle = {...battle,players:p as (CSGOBattlePlayer | null)[],status:'live' as const};
            setBattle(updatedBattle);
            setBattles(pr=>pr.map(b=>b.id===updatedBattle.id?updatedBattle:b));
            setPhase('starting');
        },1500);
        return()=>clearTimeout(t);
    },[phase, battle, user, setBattles]);
    
    useEffect(()=>{ if(phase!=='starting')return;const t=setTimeout(()=>setPhase('spinning'),1000);return()=>clearTimeout(t);},[phase]);
    
    const totalRounds = battle.cases.length;
    useEffect(()=>{
        if(phase!=='spinning'||round>=totalRounds)return;
        const currentCase=battle.cases[round];
        if(!currentCase){setPhase('finished');return;}
        const winners:Record<string,CSGOItem>={};
        const initialResults:Record<string,SpinResult|null>={};
        battle.players.forEach(p=>{
            if(p){
                const winner=pickWinningItem(currentCase);
                winners[p.id]=winner;
                initialResults[p.id]={key:Date.now()+Math.random(),reelItems:Array.from({length:100},(_,j)=>j===90?winner:pickWinningItem(currentCase)),style:{},winner};
            }
        });
        setSpinResults(initialResults);
        const spinDuration=7000;
        const animTimeout=setTimeout(()=>{
            if(!isMountedRef.current)return;
            const itemWidth=108, containerWidth=350;
            const finalResults:Record<string,SpinResult|null>={};
            Object.keys(initialResults).forEach(pId=>{
                const sr=initialResults[pId];
                if(sr){
                    const winnerIndex=90,randomOffset=(Math.random()-.5)*(itemWidth*.8),finalPos=(winnerIndex*itemWidth)-(containerWidth/2)+(itemWidth/2)+randomOffset;
                    finalResults[pId]={...sr,style:{transition:`transform ${spinDuration}ms cubic-bezier(0.2,0.85,0.25,1)`,transform:`translateX(-${finalPos}px)`}};
                }
            });
            setSpinResults(finalResults);
        },100);
        if(soundTimeoutRef.current)clearTimeout(soundTimeoutRef.current);
        const startTime=performance.now();
        const playTick=()=>{
            const elapsed=performance.now()-startTime;
            if(!isMountedRef.current||elapsed>=spinDuration){if(soundTimeoutRef.current)clearTimeout(soundTimeoutRef.current);return;}
            playSound('csgo_tick');
            const p=elapsed/spinDuration;const nextInterval=80+(420*p);
            soundTimeoutRef.current=setTimeout(playTick,nextInterval);
        };
        playTick();
        const roundTimeout=setTimeout(()=>{
            if(!isMountedRef.current)return;
            playSound('win');
            setBattle(p=>({...p,players:p.players.map(pl=>pl?{...pl,items:[...pl.items,winners[pl.id]],totalValue:pl.totalValue+winners[pl.id].price}:null)}));
            setPhase('round_end');
        },spinDuration);
        return()=>{clearTimeout(animTimeout);clearTimeout(roundTimeout);if(soundTimeoutRef.current)clearTimeout(soundTimeoutRef.current);};
    },[phase,round,battle,playSound,totalRounds]);

    useEffect(()=>{ if(phase!=='round_end')return;const nextTimeout=setTimeout(()=>{if(!isMountedRef.current)return;const nextRound=round+1;if(nextRound>=totalRounds)setPhase('finished');else{setRound(nextRound);setPhase('spinning');}},2000);return()=>clearTimeout(nextTimeout);},[phase,round,totalRounds]);
    
    useEffect(()=>{ if(phase==='finished'){const winner=battle.players.reduce((p,c)=>(p&&p.totalValue>(c?.totalValue||-1))?p:c,null);const finalState={...battle,status:'finished' as const,winnerId:winner?.id};setBattle(finalState);setBattles(p=>p.map(b=>b.id===finalState.id?finalState:b));}},[phase,battle,setBattles]);
    
    const winnerId = battle.status === 'finished' ? battle.winnerId : null;
    return (
        <div className="csgo-page battle-view">
            <main className="flex-grow container mx-auto p-4 arena-grid" style={{gridTemplateColumns:`repeat(${battle.playerCount},1fr)`}}>
                {Array.from({length:battle.playerCount}).map((_,idx)=>{
                    const p=battle.players[idx];
                    if(!p) return <div key={idx} className="player-area flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2"></div></div>;
                    const isWinner=winnerId===p.id;
                    return (
                        <div key={p.id} className={`player-area ${isWinner?'winner-glow':''}`}>
                            {phase==='finished'&&<div className={`battle-result-overlay ${isWinner?'win':'loss'}`}>{isWinner?'Winner!':'Defeat'}</div>}
                            <div className="player-header">
                                <img src={p.avatarUrl} alt={p.name} className="player-avatar"/>
                                <div className="flex-grow"><p className="font-bold truncate">{p.name}</p></div>
                                <p className="font-bold text-lg text-green-400">${p.totalValue.toFixed(2)}</p>
                            </div>
                            <div className="shrink-0 h-[120px]">
                                {phase==='spinning'&&spinResults[p.id]&&<div className="csgo-multi-spinner-container battle-spinner-compact"><div className="csgo-multi-spinner-marker"></div><div className="csgo-reel-wrapper"><div className="csgo-reel" style={spinResults[p.id]?.style}>{spinResults[p.id]?.reelItems.map((item,i)=><div key={i} className="csgo-reel-item"><div className="csgo-reel-item-inner" style={{'--rarity-color':RARITY_COLORS[item.rarity]} as React.CSSProperties}><img src={item.imageUrl} alt={item.skin} className="csgo-reel-item-image"/></div></div>)}</div></div></div>}
                            </div>
                            <div className="player-item-grid">{p.items.map((item,i)=><div key={i} className={`battle-item-card ${i===p.items.length-1&&phase==='round_end'?'animate-multi-win-fade-in':''}`} style={{'--rarity-color':RARITY_COLORS[item.rarity]} as React.CSSProperties}><img src={item.imageUrl} alt={item.skin} className={`battle-item-card-image rarity-glow-${item.rarity}`}/><p className="battle-item-card-price">${item.price.toFixed(2)}</p></div>)}</div>
                        </div>
                    );
                })}
            </main>
            {phase==='finished'&&<div className="text-center py-4"><button onClick={endBattle} className="px-6 py-2 bg-purple-600 rounded">Back to Lobby</button></div>}
        </div>
    );
};
// #endregion

// #region Lobby View (Self-contained)
const LobbyView: React.FC<Omit<CSGOCaseBattlesLobbyProps, 'battleId'>> = ({ battles, setBattles, setPage }) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const handleCreateBattle = (cases: CSGOCase[], playerCount: 2|3|4, isReverseMode: boolean) => { const cost = cases.reduce((s, c) => s + c.price, 0); const newBattle: CSGOBattle = { id: `b-${Date.now()}`, cases, playerCount, isReverseMode, status: 'waiting', players: Array(playerCount).fill(null), cost: cost, winnerId: undefined }; setBattles(p => [newBattle, ...p]); setPage({ name: 'csgo-battles', id: newBattle.id }); };
    return (
        <div className="csgo-page min-h-screen">
            <CreateBattleModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateBattle} />
            <div className="csgo-sub-nav sticky top-0 z-20">
                <div className="container mx-auto flex items-center">
                    <button className="csgo-sub-nav-item" onClick={() => setPage({ name: 'csgo-lobby' })}>Cases</button>
                    <button className="csgo-sub-nav-item" onClick={() => setPage({ name: 'csgo-upgrader' })}>Upgrader</button>
                    <button className="csgo-sub-nav-item active">Case Battles</button>
                </div>
            </div>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Active Battles</h2>
                    <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-md font-bold text-white">
                        <PlusIcon className="w-5 h-5"/>Create Battle
                    </button>
                </div>
                {battles.length === 0 ? <div className="text-center py-20 bg-slate-800/20 rounded-lg"><h3 className="text-2xl font-bold text-slate-300">No Active Battles</h3></div>
                : <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">{battles.map(b => ( <div key={b.id} className="battle-lobby-card rounded-lg p-4 flex flex-col"><div className="battle-cases-preview mb-4">{b.cases.slice(0,5).map((c,i)=><img key={i} src={c.imageUrl} alt={c.name}/>)}{b.cases.length>5&&<div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold z-10">+{b.cases.length-5}</div>}</div><div className="flex justify-between items-center text-sm mb-4"><div className="flex items-center gap-1 text-yellow-400 font-bold"><CoinIcon className="w-4 h-4"/>{b.cost.toFixed(2)}</div><div className="flex items-center gap-1 text-slate-400"><UsersIcon className="w-4 h-4"/>{b.players.filter(Boolean).length}/{b.playerCount}</div></div><div className="battle-player-slots mb-4">{Array.from({length:b.playerCount}).map((_,i)=>{const p=b.players[i];return(<div key={i} className={`battle-player-slot ${p?'filled':''}`}>{p?<img src={p.avatarUrl} alt={p.name}/>:<UsersIcon className="w-5 h-5 text-slate-500"/>}</div>)})}</div><button disabled={b.status!=='waiting'||b.players.filter(Boolean).length>=b.playerCount} onClick={()=>setPage({name: 'csgo-battles', id: b.id})} className="mt-auto w-full py-2 bg-purple-600 hover:bg-purple-700 rounded font-bold text-white disabled:bg-slate-600">{b.status==='waiting'?'Join':'View'}</button></div>))}</div>}
            </main>
        </div>
    );
};
// #endregion

// Main Router Component
const CSGOCaseBattlesLobby: React.FC<CSGOCaseBattlesLobbyProps> = ({ battles, setBattles, setPage, battleId }) => {
    const battle = useMemo(() => battles.find(b => b.id === battleId), [battles, battleId]);
    
    useEffect(() => {
        if (battleId && !battle) {
            setPage({ name: 'csgo-battles-lobby' });
        }
    }, [battleId, battle, setPage]);
    
    if (battleId && battle) {
        return <CaseBattleView battle={battle} setBattles={setBattles} setPage={setPage} />;
    }

    return <LobbyView battles={battles} setBattles={setBattles} setPage={setPage} />;
};

export default CSGOCaseBattlesLobby;