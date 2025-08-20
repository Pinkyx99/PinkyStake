import React, { useState } from 'react';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import useAnimatedBalance from '../hooks/useAnimatedBalance';
import { useUser } from '../contexts/UserContext';
import InventoryItemCard from './InventoryItemCard';
import PromoCodeSection from './PromoCodeModal';

interface ProfilePageProps {
  onBack: () => void;
}

type ActiveTab = 'inventory' | 'promocodes';

const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const { profile, setBalance } = useUser();
  const animatedBalance = useAnimatedBalance(profile?.balance ?? 0);
  const [activeTab, setActiveTab] = useState<ActiveTab>('inventory');
  const [adminBalanceInput, setAdminBalanceInput] = useState('');

  const inventoryValue = profile.inventory.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  const handleSetBalance = () => {
    const newBalance = parseFloat(adminBalanceInput);
    if (!isNaN(newBalance) && newBalance >= 0) {
        setBalance(newBalance);
        setAdminBalanceInput('');
    } else {
        alert("Please enter a valid, non-negative number for the balance.");
    }
  };


  return (
    <div className="bg-[#0f1124] min-h-screen flex flex-col font-poppins text-white">
      <header className="shrink-0 w-full bg-[#1a1b2f] p-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} aria-label="Back" className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-purple-400 text-xl font-bold uppercase">Profile</h1>
        </div>
        <div className="flex items-center bg-black/30 rounded-md px-4 py-1">
          <span className="text-base font-bold text-white">{animatedBalance.toFixed(2)}</span>
          <span className="text-sm text-gray-400 ml-2">EUR</span>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center text-4xl font-bold text-purple-300">
                {profile.username.charAt(0).toUpperCase()}
            </div>
            <div>
                <h2 className="text-3xl font-bold">{profile.username}</h2>
                <p className="text-slate-400">Inventory Value: <span className="text-yellow-400 font-semibold">${inventoryValue.toFixed(2)}</span></p>
            </div>
        </div>

        <div className="border-b border-slate-700 mb-6">
            <nav className="flex items-center gap-6 -mb-px">
                 <button 
                    onClick={() => setActiveTab('inventory')}
                    className={`py-3 px-1 text-lg font-semibold transition-colors border-b-2 ${activeTab === 'inventory' ? 'border-purple-400 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    Inventory
                </button>
                <button 
                    onClick={() => setActiveTab('promocodes')}
                    className={`py-3 px-1 text-lg font-semibold transition-colors border-b-2 ${activeTab === 'promocodes' ? 'border-purple-400 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    Promocodes
                </button>
            </nav>
        </div>

        <div>
            {activeTab === 'inventory' && (
                <div>
                    {profile.inventory.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {profile.inventory.map((item) => (
                                <InventoryItemCard key={item.id} item={item} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-slate-800/30 rounded-lg">
                            <h3 className="text-2xl font-bold text-slate-300">Your Inventory is Empty</h3>
                            <p className="text-slate-500 mt-2">Win items from Mystery Boxes and keep them to see them here!</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'promocodes' && (
                <PromoCodeSection />
            )}
        </div>
        
        <div className="mt-12 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <h3 className="text-lg font-bold text-red-400">Admin Controls</h3>
            <p className="text-sm text-red-400/70 mb-4">For development purposes only.</p>
            <div className="flex items-center gap-2 max-w-sm">
                <input
                    type="number"
                    value={adminBalanceInput}
                    onChange={(e) => setAdminBalanceInput(e.target.value)}
                    placeholder="Set new balance"
                    className="flex-grow bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                    onClick={handleSetBalance}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md font-bold text-white transition-colors"
                >
                    Set Balance
                </button>
            </div>
        </div>


      </main>
    </div>
  );
};

export default ProfilePage;