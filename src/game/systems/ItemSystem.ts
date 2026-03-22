import { Player } from '@/types/game';
import { ItemType, PlayerItem, ITEM_CATALOG } from '@/types/items';

export class ItemSystem {
  /**
   * Initialize player with starting coins (no items)
   */
  static initializePlayerInventory(): { coins: number; inventory: PlayerItem[] } {
    return {
      coins: 0,
      inventory: [],
    };
  }

  /**
   * Check if player can afford an item
   */
  static canAffordItem(player: Player, itemType: ItemType): boolean {
    const itemDef = ITEM_CATALOG[itemType];
    return player.coins >= itemDef.price;
  }

  /**
   * Purchase an item
   */
  static purchaseItem(player: Player, itemType: ItemType): Player {
    const itemDef = ITEM_CATALOG[itemType];

    if (!this.canAffordItem(player, itemType)) {
      return player;
    }

    // Check if item is already in inventory (for non-stackable items)
    const existingItem = player.inventory.find((i) => i.itemType === itemType);

    if (existingItem && !itemDef.stackable) {
      return player; // Can't buy duplicate non-stackable items
    }

    const newInventory = existingItem
      ? player.inventory.map((item) =>
          item.itemType === itemType
            ? { ...item, usesRemaining: item.usesRemaining + itemDef.maxUses }
            : item
        )
      : [...player.inventory, { itemType, usesRemaining: itemDef.maxUses }];

    return {
      ...player,
      coins: player.coins - itemDef.price,
      inventory: newInventory,
    };
  }

  /**
   * Use an item (consume one use)
   */
  static useItem(player: Player, itemType: ItemType): Player {
    const item = player.inventory.find((i) => i.itemType === itemType);
    if (!item || item.usesRemaining <= 0) {
      return player;
    }

    const newUsesRemaining = item.usesRemaining - 1;
    const newInventory =
      newUsesRemaining > 0
        ? player.inventory.map((i) =>
            i.itemType === itemType ? { ...i, usesRemaining: newUsesRemaining } : i
          )
        : player.inventory.filter((i) => i.itemType !== itemType);

    return {
      ...player,
      inventory: newInventory,
    };
  }

  /**
   * Award coins to player
   */
  static awardCoins(player: Player, amount: number): Player {
    return {
      ...player,
      coins: player.coins + amount,
    };
  }

  /**
   * Check if player has a specific item with uses remaining
   */
  static hasItem(player: Player, itemType: ItemType): boolean {
    const item = player.inventory.find((i) => i.itemType === itemType);
    return item ? item.usesRemaining > 0 : false;
  }

}
