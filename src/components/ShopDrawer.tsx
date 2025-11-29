'use client';

import { useState } from 'react';
import { Player } from '@/types/game';
import { ItemType, ITEM_CATALOG } from '@/types/items';
import { ItemSystem } from '@/game/systems/ItemSystem';

interface ShopDrawerProps {
  isOpen: boolean;
  player: Player;
  onPurchase: (itemType: ItemType) => void;
  onClose: () => void;
}

export default function ShopDrawer({ isOpen, player, onPurchase, onClose }: ShopDrawerProps) {
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);

  if (!isOpen) return null;

  const itemTypes = Object.values(ItemType);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[900] bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-[1000] animate-slide-up rounded-t-3xl bg-gradient-to-br from-purple-50 to-white p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-purple-700">🏪 Item Shop</h2>
            <p className="text-lg text-purple-600">
              Your Coins: <span className="font-bold text-yellow-600">💰 {player.coins}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-gradient-to-br from-red-500 to-red-600 px-6 py-2 text-lg font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            ✕ Close
          </button>
        </div>

        {/* Item Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {itemTypes.map((itemType) => {
            const itemDef = ITEM_CATALOG[itemType];
            const canAfford = ItemSystem.canAffordItem(player, itemType);
            const alreadyOwned = player.inventory.find(i => i.itemType === itemType);
            const cannotBuy = (alreadyOwned && !itemDef.stackable);

            return (
              <div
                key={itemType}
                className={`rounded-xl border-3 p-4 transition-all cursor-pointer ${
                  selectedItem === itemType
                    ? 'scale-105 border-purple-500 bg-purple-100 shadow-lg'
                    : 'border-purple-300 bg-white hover:scale-102 hover:border-purple-400'
                }`}
                onClick={() => setSelectedItem(itemType)}
              >
                {/* Item Icon */}
                <div className="mb-3 text-center text-5xl">{itemDef.emoji}</div>

                {/* Item Name */}
                <h3 className="mb-2 text-center text-xl font-bold text-purple-700">
                  {itemDef.name}
                </h3>

                {/* Item Description */}
                <p className="mb-3 text-center text-sm text-gray-700">
                  {itemDef.description}
                </p>

                {/* Uses */}
                <div className="mb-3 text-center text-xs font-semibold text-purple-600">
                  {itemDef.maxUses === 1 ? 'Single Use' : `${itemDef.maxUses} Uses`}
                  {alreadyOwned && (
                    <span className="ml-2 text-green-600">
                      (Owned: {alreadyOwned.usesRemaining})
                    </span>
                  )}
                </div>

                {/* Price & Buy Button */}
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-yellow-600">
                    💰 {itemDef.price}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canAfford && !cannotBuy) {
                        onPurchase(itemType);
                      }
                    }}
                    disabled={!canAfford || cannotBuy}
                    className={`rounded-full px-4 py-2 text-sm font-bold text-white transition-all ${
                      !canAfford || cannotBuy
                        ? 'cursor-not-allowed bg-gray-400'
                        : 'bg-gradient-to-br from-purple-500 to-purple-700 hover:-translate-y-0.5 hover:shadow-lg'
                    }`}
                  >
                    {cannotBuy ? 'Owned' : !canAfford ? 'Too Expensive' : 'Buy'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Your Inventory */}
        {player.inventory.length > 0 && (
          <div className="mt-6 rounded-xl border-2 border-purple-300 bg-purple-50 p-4">
            <h3 className="mb-3 text-xl font-bold text-purple-700">Your Inventory</h3>
            <div className="flex flex-wrap gap-3">
              {player.inventory.map((item, idx) => {
                const itemDef = ITEM_CATALOG[item.itemType];
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm"
                  >
                    <span className="text-2xl">{itemDef.emoji}</span>
                    <span className="font-semibold text-purple-700">{itemDef.name}</span>
                    <span className="text-sm text-purple-600">×{item.usesRemaining}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
