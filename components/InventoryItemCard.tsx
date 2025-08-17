import React from 'react';
import type { InventoryItem } from '../types';
import { useUser } from '../contexts/UserContext';
import { useSound } from '../hooks/useSound';

interface InventoryItemCardProps {
    item: InventoryItem;
}

const InventoryItemCard: React.FC<InventoryItemCardProps> = ({ item }) => {
    const { sellFromInventory } = useUser();
    const { playSound } = useSound();
    
    const handleSell = () => {
        playSound('cashout');
        sellFromInventory(item.id);
    };

    return (
        <div className="mystery-item-card inventory-item-card">
            {item.quantity > 1 && (
                <div className="item-quantity">x{item.quantity}</div>
            )}
            <p className="mystery-item-name">{item.name}</p>
            <div className="mystery-item-image-wrapper">
                <img src={item.imageUrl} alt={item.name} className="mystery-item-image"/>
            </div>
            <div className="item-actions">
                 <div className="mystery-item-price-button">${item.price.toFixed(2)}</div>
                 <button onClick={handleSell} className="item-sell-button">Sell Item</button>
            </div>
        </div>
    );
};

export default InventoryItemCard;