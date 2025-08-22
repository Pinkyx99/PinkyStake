import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import type { Profile } from '../types.ts';

interface AdminConsoleProps {
    isVisible: boolean;
    onAnnounce: (message: string) => void;
}

type OutputLine = {
    type: 'cmd' | 'success' | 'error' | 'info';
    text: string;
};

const HELP_MESSAGE: OutputLine[] = [
    { text: 'Available Commands:', type: 'info' },
    { text: '  /set_balance [@username] <amount>   - Sets balance for a user or self.', type: 'info' },
    { text: '  /remove_balance [@username] <amount> - Removes balance from a user or self.', type: 'info' },
    { text: '  /ban <user> <duration> <reason...>  - Bans a user (e.g., 10m, 1h, 2d).', type: 'info' },
    { text: '  /unban <user>                     - Unbans a user.', type: 'info' },
    { text: '  /jail <user> <duration> <reason..>  - Jails a user (alias for /ban).', type: 'info' },
    { text: '  /mute <user> <duration>             - Mutes a user from Global Chat.', type: 'info' },
    { text: '  /unmute <user>                    - Unmutes a user from Global Chat.', type: 'info' },
    { text: '  /warn <user> <reason...>          - Warns a user.', type: 'info' },
    { text: '  /profile <user>                   - Shows detailed user stats.', type: 'info' },
    { text: '  /godmode <user> [duration]        - Makes a user immune to bans.', type: 'info' },
    { text: '  /give_admin <user>                - Grants a user admin permissions.', type: 'info' },
    { text: '  /announce <message...>            - Shows a banner to all users.', type: 'info' },
    { text: '  /list_online                      - (Simulated) See all online users.', type: 'info' },
    { text: '  /rain_money <amount>              - Starts a money rain event for all users.', type: 'info' },
    { text: '  /restart                          - Soft restart the application.', type: 'info' },
    { text: '  /shutdown                         - (Simulated) Emergency shutdown.', type: 'info' },
    { text: '  /clear                            - Clears the console output.', type: 'info' },
    { text: '  /help                             - Shows this help message.', type: 'info' },
];

const parseDuration = (durationStr: string): Date | null => {
    if (!durationStr) return null;
    const now = new Date();
    const value = parseInt(durationStr.slice(0, -1));
    const unit = durationStr.slice(-1).toLowerCase();

    if (isNaN(value)) return null;

    switch (unit) {
        case 'm': now.setMinutes(now.getMinutes() + value); return now;
        case 'h': now.setHours(now.getHours() + value); return now;
        case 'd': now.setDate(now.getDate() + value); return now;
        default: return null;
    }
};


const AdminConsole: React.FC<AdminConsoleProps> = ({ isVisible, onAnnounce }) => {
    const { profile: adminProfile, adjustBalance } = useAuth();
    const [input, setInput] = useState('');
    const [output, setOutput] = useState<OutputLine[]>([{ text: 'Admin Console Initialized. Type /help for commands.', type: 'info' }]);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const outputRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isVisible && inputRef.current) inputRef.current.focus();
    }, [isVisible]);
    
    useEffect(() => {
        if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }, [output]);

    const addOutput = (line: OutputLine | OutputLine[]) => {
        setOutput(prev => Array.isArray(line) ? [...prev, ...line] : [...prev, line]);
    };

    const executeCommand = useCallback(async (command: string) => {
        addOutput({ type: 'cmd', text: command });
        setHistory(prev => [command, ...prev].slice(0, 50));
        setHistoryIndex(-1);
        
        const [cmd, ...args] = command.split(' ');
        const targetUserArg = args[0]?.startsWith('@') ? args[0].substring(1) : null;

        const findUser = async (username: string) => {
            const { data, error } = await supabase.from('profiles').select('*').ilike('username', username).single();
            if (error || !data) {
                addOutput({ type: 'error', text: `User "${username}" not found.` });
                return null;
            }
            return data as Profile;
        };

        const checkGodMode = (user: Profile) => {
            if (user.godmode_until && new Date(user.godmode_until) > new Date()) {
                addOutput({ type: 'error', text: `User "${user.username}" is in godmode and cannot be moderated.` });
                return true;
            }
            return false;
        };

        switch (cmd) {
            case '/set_balance':
            case '/remove_balance': {
                const amountArg = targetUserArg ? args[1] : args[0];
                let amount = parseFloat(amountArg);

                if (isNaN(amount) || amount < 0) {
                    addOutput({ type: 'error', text: 'Invalid amount specified.' }); return;
                }

                const username = targetUserArg || adminProfile?.username;
                if (!username) { addOutput({ type: 'error', text: 'Target user not found.'}); return; }
                
                if (username === adminProfile?.username) {
                    const currentBalance = adminProfile?.balance ?? 0;
                    const change = cmd === '/set_balance' ? amount - currentBalance : -amount;
                    await adjustBalance(change);
                    addOutput({ type: 'success', text: `Your balance is now ${(currentBalance + change).toFixed(2)}.` });
                } else {
                    const user = await findUser(username);
                    if (user) {
                        const newBalance = cmd === '/set_balance' ? amount : Math.max(0, user.balance - amount);
                        const { error } = await supabase.from('profiles').update({ balance: newBalance }).eq('id', user.id);
                        if (error) addOutput({ type: 'error', text: `Failed to update balance for ${user.username}.` });
                        else addOutput({ type: 'success', text: `Set balance for ${user.username} to ${newBalance.toFixed(2)}.` });
                    }
                }
                break;
            }
            case '/ban':
            case '/jail': {
                const username = args[0];
                const durationStr = args[1];
                const reason = args.slice(2).join(' ');
                if (!username || !durationStr || !reason) {
                    addOutput({ type: 'error', text: `Usage: ${cmd} <user> <duration> <reason...>` }); return;
                }
                const user = await findUser(username);
                if (user) {
                    if (checkGodMode(user)) return;
                    const expires = parseDuration(durationStr);
                    if (!expires) {
                        addOutput({ type: 'error', text: 'Invalid duration format. Use 10m, 1h, 2d.' }); return;
                    }
                    const { error } = await supabase.from('profiles').update({ banned_until: expires.toISOString(), ban_reason: reason }).eq('id', user.id);
                    if (error) addOutput({ type: 'error', text: `Failed to ban ${username}.` });
                    else addOutput({ type: 'success', text: `${username} banned until ${expires.toLocaleString()}.` });
                }
                break;
            }
            case '/unban': {
                const username = args[0];
                if (!username) {
                    addOutput({ type: 'error', text: 'Usage: /unban <user>' }); return;
                }
                const user = await findUser(username);
                if (user) {
                    const { error } = await supabase.from('profiles').update({ banned_until: null, ban_reason: null }).eq('id', user.id);
                    if (error) addOutput({ type: 'error', text: `Failed to unban ${username}.` });
                    else addOutput({ type: 'success', text: `${username} has been unbanned.` });
                }
                break;
            }
            case '/mute': {
                const username = args[0];
                const durationStr = args[1];
                 if (!username || !durationStr) {
                    addOutput({ type: 'error', text: `Usage: /mute <user> <duration>` }); return;
                }
                const user = await findUser(username);
                if (user) {
                    if (checkGodMode(user)) return;
                    const expires = parseDuration(durationStr);
                    if (!expires) {
                        addOutput({ type: 'error', text: 'Invalid duration format. Use 10m, 1h, 2d.' }); return;
                    }
                    const { error } = await supabase.from('profiles').update({ muted_until: expires.toISOString() }).eq('id', user.id);
                    if (error) addOutput({ type: 'error', text: `Failed to mute ${username}.` });
                    else addOutput({ type: 'success', text: `${username} muted until ${expires.toLocaleString()}.` });
                }
                break;
            }
            case '/unmute': {
                 const username = args[0];
                if (!username) {
                    addOutput({ type: 'error', text: 'Usage: /unmute <user>' }); return;
                }
                const user = await findUser(username);
                if (user) {
                    const { error } = await supabase.from('profiles').update({ muted_until: null }).eq('id', user.id);
                    if (error) addOutput({ type: 'error', text: `Failed to unmute ${username}.` });
                    else addOutput({ type: 'success', text: `${username} has been unmuted.` });
                }
                break;
            }
            case '/warn': {
                 const username = args[0];
                 const reason = args.slice(1).join(' ');
                 if (!username || !reason) {
                    addOutput({ type: 'error', text: `Usage: /warn <user> <reason...>` }); return;
                }
                 const user = await findUser(username);
                 if (user) {
                     if (checkGodMode(user)) return;
                     const newWarnings = [...(user.warnings || []), reason];
                     const { error } = await supabase.from('profiles').update({ warnings: newWarnings }).eq('id', user.id);
                     if (error) addOutput({ type: 'error', text: `Failed to warn ${username}.` });
                     else addOutput({ type: 'success', text: `${username} has been warned. They now have ${newWarnings.length} warning(s).` });
                 }
                break;
            }
            case '/profile': {
                const username = args[0];
                if (!username) { addOutput({ type: 'error', text: 'Usage: /profile <user>' }); return; }
                const user = await findUser(username);
                if(user) {
                    addOutput([
                        { text: `--- Profile: ${user.username} ---`, type: 'info' },
                        { text: `  ID: ${user.id}`, type: 'info' },
                        { text: `  Balance: ${user.balance.toFixed(2)} EUR`, type: 'info' },
                        { text: `  Level: ${user.level} (XP: ${user.xp})`, type: 'info' },
                        { text: `  Rank: ${user.rank}`, type: 'info' },
                        { text: `  Admin: ${user.is_admin ? 'Yes' : 'No'}`, type: 'info' },
                        { text: `  Godmode Until: ${user.godmode_until ? new Date(user.godmode_until).toLocaleString() : 'N/A'}`, type: 'info' },
                        { text: `  Banned Until: ${user.banned_until ? new Date(user.banned_until).toLocaleString() : 'N/A'}`, type: 'info' },
                        { text: `  Muted Until: ${user.muted_until ? new Date(user.muted_until).toLocaleString() : 'N/A'}`, type: 'info' },
                        { text: `  Warnings: ${user.warnings?.length || 0}`, type: 'info' },
                    ]);
                }
                break;
            }
            case '/godmode': {
                const username = args[0];
                const durationStr = args[1] || '1d'; // Default to 1 day
                if (!username) { addOutput({ type: 'error', text: 'Usage: /godmode <user> [duration]' }); return; }
                const user = await findUser(username);
                if (user) {
                     const expires = parseDuration(durationStr);
                     if (!expires) {
                         addOutput({ type: 'error', text: 'Invalid duration format.' }); return;
                     }
                    const { error } = await supabase.from('profiles').update({ godmode_until: expires.toISOString() }).eq('id', user.id);
                    if (error) addOutput({ type: 'error', text: `Failed to enable godmode for ${username}.` });
                    else addOutput({ type: 'success', text: `Godmode enabled for ${username} until ${expires.toLocaleString()}.` });
                }
                break;
            }
            case '/give_admin': {
                 const username = args[0];
                 if (!username) { addOutput({ type: 'error', text: 'Usage: /give_admin <user>' }); return; }
                 const user = await findUser(username);
                 if (user) {
                     const { error } = await supabase.from('profiles').update({ is_admin: true }).eq('id', user.id);
                     if (error) addOutput({ type: 'error', text: `Failed to grant admin to ${username}.` });
                     else addOutput({ type: 'success', text: `${username} is now an admin.` });
                 }
                break;
            }
            case '/announce': {
                const message = args.join(' ');
                if (!message) { addOutput({ type: 'error', text: 'Usage: /announce <message...>' }); return; }
                onAnnounce(message);
                addOutput({ type: 'success', text: 'Announcement sent.' });
                break;
            }
             case '/list_online': {
                 addOutput({ type: 'info', text: 'Simulating online users: User1, User2, Bot1, Admin' });
                 break;
             }
             case '/rain_money': {
                 const amount = parseFloat(args[0]);
                 if (isNaN(amount) || amount <= 0) {
                     addOutput({ type: 'error', text: 'Invalid amount for money rain.' }); return;
                 }
                 const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes from now
                 const { error } = await supabase.from('money_rains').insert({ amount, expires_at });
                 if (error) {
                     addOutput({ type: 'error', text: `Failed to start money rain: ${error.message}` });
                 } else {
                     addOutput({ type: 'success', text: `Money rain of ${amount.toFixed(2)} EUR started!` });
                 }
                 break;
             }
            case '/restart': {
                addOutput({ type: 'success', text: 'Application is restarting...' });
                setTimeout(() => window.location.reload(), 1000);
                break;
            }
            case '/shutdown': {
                addOutput({ type: 'error', text: 'EMERGENCY SHUTDOWN (SIMULATED). Connection to server lost.' });
                break;
            }
            case '/clear': {
                setOutput([]);
                break;
            }
            case '/help': {
                addOutput(HELP_MESSAGE);
                break;
            }
            default:
                addOutput({ type: 'error', text: `Command not found: ${cmd}` });
        }
    }, [adminProfile, adjustBalance, onAnnounce]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            executeCommand(input.trim());
            setInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (history.length > 0) {
                const newIndex = Math.min(history.length - 1, historyIndex + 1);
                setHistoryIndex(newIndex);
                setInput(history[newIndex] || '');
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (history.length > 0) {
                const newIndex = Math.max(-1, historyIndex - 1);
                setHistoryIndex(newIndex);
                setInput(history[newIndex] || '');
            }
        }
    };

    return (
        <div className={`fixed bottom-4 right-4 w-full max-w-2xl h-96 bg-black/80 backdrop-blur-md rounded-lg shadow-2xl text-white font-mono text-sm flex flex-col transition-all duration-300 z-[100] ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'}`}>
            <div ref={outputRef} className="flex-grow p-4 overflow-y-auto">
                {output.map((line, index) => (
                    <div key={index} className="flex">
                        {line.type === 'cmd' && <span className="text-gray-500 mr-2">&gt;</span>}
                        <p className={`whitespace-pre-wrap ${
                            line.type === 'success' ? 'text-green-400' : 
                            line.type === 'error' ? 'text-red-400' : 
                            line.type === 'info' ? 'text-blue-400' : 
                            'text-gray-200'
                        }`}>{line.text}</p>
                    </div>
                ))}
            </div>
            <form onSubmit={handleFormSubmit}>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-slate-900/80 p-3 rounded-b-lg border-t border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Type a command..."
                />
            </form>
        </div>
    );
};

export default AdminConsole;
