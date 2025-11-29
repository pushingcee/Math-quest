export enum ItemType {
  Shield = 'shield',
  ExtraDiceRoll = 'extraDiceRoll',
  PointMultiplier = 'pointMultiplier',
  Teleport = 'teleport',
}

export enum ItemTrigger {
  Manual = 'manual',
  OnTrap = 'onTrap',
  OnSlip = 'onSlip',
  OnObstacle = 'onObstacle',
  BeforeDice = 'beforeDice',
  OnMathProblem = 'onMathProblem',
}

export interface ItemDefinition {
  id: ItemType;
  name: string;
  description: string;
  emoji: string;
  price: number;
  maxUses: number;
  trigger: ItemTrigger;
  stackable: boolean;
}

export interface PlayerItem {
  itemType: ItemType;
  usesRemaining: number;
  isActive?: boolean;
}

export const ITEM_CATALOG: Record<ItemType, ItemDefinition> = {
  [ItemType.Shield]: {
    id: ItemType.Shield,
    name: 'Shield',
    description: 'Protects from the next trap or slip',
    emoji: '🛡️',
    price: 45,
    maxUses: 1,
    trigger: ItemTrigger.OnObstacle,
    stackable: true,
  },
  [ItemType.ExtraDiceRoll]: {
    id: ItemType.ExtraDiceRoll,
    name: 'Lucky Dice',
    description: 'Roll twice and choose the better result',
    emoji: '🎲',
    price: 60,
    maxUses: 3,
    trigger: ItemTrigger.BeforeDice,
    stackable: false,
  },
  [ItemType.PointMultiplier]: {
    id: ItemType.PointMultiplier,
    name: 'Point Booster',
    description: '1.5x points on next 2 correct answers',
    emoji: '⭐',
    price: 75,
    maxUses: 2,
    trigger: ItemTrigger.OnMathProblem,
    stackable: false,
  },
  [ItemType.Teleport]: {
    id: ItemType.Teleport,
    name: 'Teleporter',
    description: 'Move to any tile (no obstacles)',
    emoji: '🌀',
    price: 90,
    maxUses: 1,
    trigger: ItemTrigger.Manual,
    stackable: true,
  },
};
