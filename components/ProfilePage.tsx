
import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import SpinnerIcon from './icons/SpinnerIcon';

interface ProfilePageProps {
  onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const { profile, session, loading, updateUsername } = useUser();
  const [username, setUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
    }
  }, [profile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || username === profile.username || username.trim() === '') return;
    
    setIsSaving(true);
    setMessage(null);
    try {
        await updateUsername(username.trim());
        setMessage({ type: 'success', text: 'Username updated successfully!' });
        setIsEditing(false);
    } catch (err) {
        setMessage({ type: 'error', text: 'Failed to update username.' });
    } finally {
        setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><SpinnerIcon className="w-12 h-12 text-purple-400" /></div>;
  }

  if (!profile || !session) {
    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col">
            <div className="p-4"><button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white"><ArrowLeftIcon className="w-6 h-6" /> Back</button></div>
            <div className="flex-grow flex items-center justify-center">
                 <p>You must be signed in to view this page.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white font-poppins">
      <div className="container mx-auto p-4 sm:p-8">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8">
          <ArrowLeftIcon className="w-6 h-6" /> Back to Games
        </button>
        
        <div className="bg-slate-800/50 rounded-lg p-8 max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-center text-white">My Profile</h1>
          
          {message && (
             <p className={`p-3 rounded-md mb-4 text-sm ${message.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                {message.text}
             </p>
          )}

          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-gray-400">Username</label>
              {isEditing ? (
                 <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full mt-1 p-3 bg-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
              ) : (
                <p className="text-xl font-semibold mt-1 p-3">{profile.username}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-400">Email</label>
              <p className="text-xl text-gray-300 mt-1 p-3">{session.user.email}</p>
            </div>
            
            <div>
              <label className="text-sm font-semibold text-gray-400">Balance</label>
              <p className="text-xl text-yellow-400 font-bold mt-1 p-3">{profile.balance.toFixed(2)} EUR</p>
            </div>

            <div className="flex justify-end items-center gap-4 pt-4">
              {isEditing ? (
                 <>
                    <button type="button" onClick={() => { setIsEditing(false); setUsername(profile.username); }} className="px-6 py-2 bg-slate-600 hover:bg-slate-500 rounded-md font-semibold">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-green-500 hover:bg-green-600 rounded-md font-bold text-black flex items-center disabled:bg-gray-500">
                        {isSaving && <SpinnerIcon className="w-5 h-5 mr-2"/>}
                        Save
                    </button>
                 </>
              ) : (
                <button type="button" onClick={() => setIsEditing(true)} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold">
                    Edit Username
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
