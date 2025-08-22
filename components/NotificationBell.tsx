import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import type { Notification } from '../types.ts';
import BellIcon from './icons/BellIcon.tsx';

const NotificationBell: React.FC = () => {
    const { profile } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    useEffect(() => {
        if (!profile) return;

        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', profile.id)
                .order('created_at', { ascending: false })
                .limit(10);
            if (!error && data) setNotifications(data as Notification[]);
        };
        fetchNotifications();

        const channel = supabase.channel(`notifications:${profile.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${profile.id}`
            }, (payload) => {
                setNotifications(prev => [payload.new as Notification, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggle = async () => {
        setIsOpen(prev => !prev);
        if (!isOpen && unreadCount > 0) {
            // Mark all as read when opening
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', profile!.id)
                .eq('is_read', false);
            if (!error) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            }
        }
    };
    
    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={handleToggle} className="relative p-2 text-slate-400 hover:text-white">
                <BellIcon className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50">
                    <div className="p-3 font-bold border-b border-slate-700">Notifications</div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="p-4 text-sm text-slate-400">No notifications yet.</p>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} className="p-3 border-b border-slate-700/50 text-sm">
                                    {n.type === 'payment_received' && `💸 You received ${n.content?.amount} EUR from ${n.content?.sender}.`}
                                    {n.type === 'money_rain' && `🎉 You claimed ${n.content?.amount} EUR from a money rain!`}
                                    <p className="text-xs text-slate-500 mt-1">{formatTimeAgo(n.created_at)}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;