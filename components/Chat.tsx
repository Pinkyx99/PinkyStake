import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import type { Message, Profile } from '../types.ts';
import SendIcon from './icons/SendIcon.tsx';

interface ChatProps {
    isVisible: boolean;
    onProfileClick: (profile: Profile) => void;
}

const Chat: React.FC<ChatProps> = ({ isVisible, onProfileClick }) => {
    const { profile } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [profilesCache, setProfilesCache] = useState<Record<string, Profile>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isMuted = profile?.muted_until && new Date(profile.muted_until) > new Date();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const fetchInitialMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select(`*, profile:profiles(is_admin)`)
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (error) {
                console.error('Error fetching messages:', error);
            } else if (data) {
                setMessages(data.reverse() as unknown as Message[]);
            }
        };
        fetchInitialMessages();
    }, []);

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        const channel = supabase.channel('public:messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
            async (payload) => {
                const msg = payload.new as Message;
                // Fetch profile info for the new message if not cached
                if (!profilesCache[msg.user_id]) {
                    const { data } = await supabase.from('profiles').select('*').eq('id', msg.user_id).single();
                    if(data) setProfilesCache(p => ({ ...p, [msg.user_id]: data as Profile }));
                }
                setMessages(prev => [...prev, msg]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profilesCache]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !profile || isMuted) return;

        const content = newMessage.trim();
        setNewMessage('');

        const { error } = await supabase.from('messages').insert({
            content,
            username: profile.username,
        });

        if (error) {
            console.error('Error sending message:', error);
            setNewMessage(content); // Re-add message to input if sending failed
        }
    };
    
    const handleUsernameClick = async (userId: string) => {
        if (profilesCache[userId]) {
            onProfileClick(profilesCache[userId]);
            return;
        }
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (error) {
            console.error("Error fetching user profile:", error);
            return;
        }
        if (data) {
            const fetchedProfile = data as Profile;
            setProfilesCache(p => ({...p, [userId]: fetchedProfile }));
            onProfileClick(fetchedProfile);
        }
    };

    return (
        <div className={`chat-container ${isVisible ? 'visible' : ''}`}>
            <h2 className="chat-header text-white">Global Chat</h2>
            <div className="chat-messages">
                <div className="chat-messages-inner">
                    {messages.map(msg => {
                         const messageProfile = msg.profile || (profilesCache[msg.user_id] ? { is_admin: profilesCache[msg.user_id].is_admin } : null);
                         const isAdmin = messageProfile?.is_admin || msg.username === 'Admin';
                        return (
                          <div key={msg.id} className="chat-message">
                            <span 
                                className={`username ${isAdmin ? 'admin' : ''}`}
                                onClick={() => handleUsernameClick(msg.user_id)}
                                role="button"
                                tabIndex={0}
                            >
                                {msg.username}:
                            </span>
                            <span className="content ml-1.5">{msg.content}</span>
                          </div>
                        )
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="chat-input-area">
                <form onSubmit={handleSendMessage} className="chat-input-wrapper">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={isMuted ? "You are muted." : "Type a message..."}
                        disabled={isMuted}
                        className="chat-input"
                        maxLength={280}
                    />
                    <button type="submit" disabled={!newMessage.trim() || isMuted} className="p-2 bg-purple-600 hover:bg-purple-700 rounded-md disabled:bg-slate-600 disabled:cursor-not-allowed">
                        <SendIcon className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;