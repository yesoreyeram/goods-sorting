'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Home,
  Heart,
  Coins,
  CheckCircle2,
  Clock,
  Move,
  Snowflake,
  ShieldOff,
  Lock,
  Key
} from 'lucide-react';

// --- TYPES ---

interface ItemType {
  id: string;
  component: React.FC<{ className?: string }>;
}

interface Item extends ItemType {
  uid: string;
  fragileMoves: number | null;
}

interface Shelf {
  id: number;
  capacity: number;
  items: (Item | null)[];
}

interface LevelConfig {
  id: number;
  shelfSize: number | 'mixed';
  moveLimit: number | null;
  timeLimit: number | null;
  shelves: number;
  mixed: boolean;
  numBombs: number;
  bombTimeLimit: number | null;
  numIceCreams: number;
  iceCreamConstraint: boolean;
  fragileShelfActive: boolean;
  fragileShelfId: number | null;
  keyConstraintActive: boolean;
  lockedShelfId: number | null;
}

interface GameState {
  shelves: Shelf[];
  movesLeft: number | null;
  timeLeft: number | null;
  bombsLeft: number;
  bombTimer: number | null;
  frozenShelves: number[];
  lockedShelf: boolean;
  fragileShelfId: number | null;
  status: 'playing' | 'won' | 'lost';
}

interface DragState {
  item: Item;
  fromShelfId: number;
  fromSlotIndex: number;
  initialX: number;
  initialY: number;
  currentX: number;
  currentY: number;
}

interface ClearedMessage {
  x: number;
  y: number;
  id: number;
  itemType: string;
}

// --- ASSETS (Custom SVG Products) ---

const ProductSoda: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ shapeRendering: 'geometricPrecision' }}>
    <defs>
      <linearGradient id="sodaGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="50%" stopColor="#f87171" />
        <stop offset="100%" stopColor="#b91c1c" />
      </linearGradient>
    </defs>
    <path d="M25,10 L75,10 C80,10 80,15 75,15 L25,15 C20,15 20,10 25,10 Z" fill="#d1d5db" />
    <rect x="20" y="15" width="60" height="75" rx="5" fill="url(#sodaGrad)" />
    <path d="M25,90 L75,90 C80,90 80,85 75,85 L25,85 C20,85 20,90 25,90 Z" fill="#d1d5db" />
    <text x="50" y="60" fontSize="12" fontWeight="bold" fill="white" textAnchor="middle" transform="rotate(-90, 50, 60)">COLA</text>
    <path d="M30,25 C40,25 40,40 30,40" stroke="white" strokeWidth="2" fill="none" opacity="0.5"/>
  </svg>
);

const ProductMilk: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ shapeRendering: 'geometricPrecision' }}>
    <defs>
      <linearGradient id="milkGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    <path d="M25,30 L75,30 L80,90 L20,90 Z" fill="#f3f4f6" />
    <path d="M25,30 L50,5 L75,30" fill="#e5e7eb" />
    <rect x="30" y="45" width="40" height="30" fill="url(#milkGrad)" rx="2" />
    <text x="50" y="65" fontSize="10" fontWeight="bold" fill="white" textAnchor="middle">MILK</text>
  </svg>
);

const ProductChips: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ shapeRendering: 'geometricPrecision' }}>
    <path d="M25,15 Q20,50 30,85 L70,85 Q80,50 75,15 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="1"/>
    <ellipse cx="50" cy="15" rx="25" ry="5" fill="#fde047" />
    <circle cx="50" cy="50" r="12" fill="#ef4444" />
    <text x="50" y="54" fontSize="8" fontWeight="bold" fill="white" textAnchor="middle">CHIPS</text>
  </svg>
);

const ProductJam: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ shapeRendering: 'geometricPrecision' }}>
    <rect x="25" y="30" width="50" height="55" rx="5" fill="#7f1d1d" />
    <rect x="25" y="40" width="50" height="30" fill="#ef4444" opacity="0.8"/>
    <rect x="30" y="20" width="40" height="10" fill="#facc15" />
    <circle cx="50" cy="55" r="10" fill="white" opacity="0.9"/>
    <text x="50" y="58" fontSize="8" fontWeight="bold" fill="#7f1d1d" textAnchor="middle">JAM</text>
  </svg>
);

const ProductJuice: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ shapeRendering: 'geometricPrecision' }}>
    <rect x="30" y="25" width="40" height="60" rx="4" fill="#fb923c" />
    <rect x="35" y="15" width="30" height="10" fill="#fff" />
    <circle cx="50" cy="55" r="12" fill="#fff" opacity="0.8" />
    <path d="M50,45 L55,55 L50,65 L45,55 Z" fill="#fb923c" />
  </svg>
);

const ProductWater: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ shapeRendering: 'geometricPrecision' }}>
    <path d="M35,30 L35,85 Q35,90 40,90 L60,90 Q65,90 65,85 L65,30 Q65,25 60,25 L40,25 Q35,25 35,30 Z" fill="#bae6fd" stroke="#0ea5e9" strokeWidth="1"/>
    <rect x="38" y="15" width="24" height="10" fill="#0369a1" rx="1"/>
    <rect x="35" y="45" width="30" height="25" fill="#e0f2fe" opacity="0.6" />
    <text x="50" y="62" fontSize="8" fontWeight="bold" fill="#0369a1" textAnchor="middle">H2O</text>
  </svg>
);

const ProductBomb: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ shapeRendering: 'geometricPrecision' }}>
    {/* Base Black Circle, gently pulsing */}
    <circle cx="50" cy="50" r="40" fill="#1f2937" className="animate-pulse duration-1000" />
    {/* Inner Red Core, aggressively pinging */}
    <circle cx="50" cy="50" r="30" fill="#dc2626" className="animate-ping opacity-75 duration-[1500ms]" />
    {/* Solid Red Core */}
    <circle cx="50" cy="50" r="30" fill="#ef4444" />
    {/* Fuse Wick */}
    <path d="M50,10 L55,20 L45,20 Z" fill="#9ca3af" />
    {/* Label/Display */}
    <text x="50" y="60" fontSize="18" fontWeight="bold" fill="white" textAnchor="middle">BOMB</text>
  </svg>
);

const ProductIceCream: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ shapeRendering: 'geometricPrecision' }}>
    <defs>
      <linearGradient id="iceCreamGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f472b6" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    {/* Cone */}
    <path d="M40,85 L60,85 L50,65 Z" fill="#ca8a04" />
    {/* Ice Cream Scoop */}
    <path d="M50,65 Q20,55 30,30 Q50,15 70,30 Q80,55 50,65 Z" fill="url(#iceCreamGrad)" />
    {/* Topping */}
    <circle cx="50" cy="30" r="8" fill="#fef08a" />
    {/* Sprinkle animation */}
    <rect x="40" y="40" width="2" height="5" fill="#e0f2fe" className="animate-[pulse_1s_infinite]"/>
    <rect x="60" y="45" width="2" height="5" fill="#e0f2fe" className="animate-[pulse_1s_infinite_0.5s]"/>
  </svg>
);

const ProductKey: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ shapeRendering: 'geometricPrecision' }}>
    {/* Key Shaft */}
    <rect x="30" y="40" width="50" height="10" fill="#facc15" rx="2" />
    {/* Key Ring */}
    <circle cx="30" cy="45" r="15" fill="#ca8a04" stroke="#fef9c3" strokeWidth="2" />
    {/* Key Teeth */}
    <rect x="70" y="50" width="10" height="5" fill="#facc15" />
    <rect x="70" y="60" width="5" height="5" fill="#facc15" />
    <path d="M 50 45 L 80 45" stroke="#facc15" strokeWidth="4" />
  </svg>
);


// --- CONFIGURATION ---

const ITEM_TYPES: ItemType[] = [
  { id: 'soda', component: ProductSoda },
  { id: 'milk', component: ProductMilk },
  { id: 'chips', component: ProductChips },
  { id: 'jam', component: ProductJam },
  { id: 'juice', component: ProductJuice },
  { id: 'water', component: ProductWater },
  { id: 'bomb', component: ProductBomb }, // Level 4 constraint item
  { id: 'ice-cream', component: ProductIceCream }, // Level 5 constraint item
  { id: 'key', component: ProductKey }, // Level 7 constraint item (now unused)
];

const MAX_LIVES = 10;
const MIN_EMPTY_SLOTS = 6;

// Levels Config
const generateLevels = (): LevelConfig[] => {
  const levels: LevelConfig[] = [];
  for (let i = 1; i <= 50; i++) {
    let config: LevelConfig = {
      id: i,
      shelfSize: 3,
      moveLimit: 20 + i * 2,
      timeLimit: null,     
      shelves: 12,
      mixed: false,
      // L4
      numBombs: 0,
      bombTimeLimit: null,
      // L5
      numIceCreams: 0,
      iceCreamConstraint: false,
      // L6
      fragileShelfActive: false,
      fragileShelfId: null,     
      // L7
      keyConstraintActive: false, // <-- REMOVED special constraint
      lockedShelfId: null,        // <-- REMOVED special constraint
    };

    if (i === 1) { config.moveLimit = 25; config.timeLimit = 120; }
    if (i === 2) { config.moveLimit = null; config.timeLimit = 90; }
    if (i === 3) { config.moveLimit = 35; config.timeLimit = 120; config.shelves = 10; }
   
    // Level 4: Bomb Constraint
    if (i === 4) {
        config.moveLimit = 30;
        config.timeLimit = 100;
        config.numBombs = 3;
        config.bombTimeLimit = 15;
        config.shelves = 12;
    }
   
    // Level 5: Ice Cream Constraint
    if (i === 5) {
        config.moveLimit = 40;
        config.timeLimit = 120;
        config.numIceCreams = 6;
        config.iceCreamConstraint = true;
        config.shelves = 12;
    }
   
    // Level 6: Fragile Shelf Constraint
    if (i === 6) {
        config.moveLimit = 35;
        config.timeLimit = 120;
        config.fragileShelfActive = true;
        config.shelves = 12;
        // Assign a specific fragile shelf ID (e.g., shelf 0)
        config.fragileShelfId = 0;
    }

    // Level 7: Now a standard level challenge
    if (i === 7) {
        config.moveLimit = 45; // High moves
        config.timeLimit = 180; // High time
        config.shelves = 12;
        // Key/Lock constraints REMOVED
    }

    // General progression adjustment
    if (i > 7) {
        config.mixed = true;
        config.shelfSize = 'mixed';
        config.moveLimit = 40 + i;
        config.timeLimit = 120;
    }

    levels.push(config);
  }
  return levels;
};

const LEVELS = generateLevels();

// --- UTILITIES ---

const getPointerPos = (e: React.PointerEvent | PointerEvent | TouchEvent): { x: number; y: number } => {
  if ('touches' in e && e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  if ('changedTouches' in e && e.changedTouches && e.changedTouches.length > 0) {
    return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  }
  return { x: (e as PointerEvent).clientX, y: (e as PointerEvent).clientY };
};

// --- SOLVABILITY CHECK ---
const checkInitialSolvability = (shelves: Shelf[], lockedShelfId: number | null): boolean => {
    const itemCounts: Record<string, number> = {};
   
    shelves.forEach(shelf => {
        // Since L7 is now standard, lockedShelfId should be null here, but we guard anyway
        if (shelf.id === lockedShelfId) return;
        shelf.items.forEach(item => {
            // Check only standard items
            if (item && item.id !== 'key' && item.id !== 'bomb' && item.id !== 'ice-cream') {
                itemCounts[item.id] = (itemCounts[item.id] || 0) + 1;
            }
        });
    });

    for (const typeId in itemCounts) {
        if (itemCounts[typeId] % 3 !== 0) {
            console.error(`Solvability Error: Item type '${typeId}' has count ${itemCounts[typeId]} (not multiple of 3)`);
            return false;
        }
    }
    return true;
};

export default function Game() {
  // Global State
  const [view, setView] = useState<'dashboard' | 'game'>('dashboard');
  const [coins, setCoins] = useState<number>(1000);
  const [lives, setLives] = useState<number>(MAX_LIVES);
  const [lastRegenTime, setLastRegenTime] = useState<number>(Date.now());

  // Game Session State
  const [currentLevel, setCurrentLevel] = useState<LevelConfig | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [clearedMessage, setClearedMessage] = useState<ClearedMessage | null>(null);
  const [failReason, setFailReason] = useState<string | null>(null);
 
  // Drag State
  const [dragging, setDragging] = useState<DragState | null>(null);

  // --- PERSISTENCE ---
  useEffect(() => {
    const saved = localStorage.getItem('goodsSortSave_v8');
    if (saved) {
      const p = JSON.parse(saved);
      setCoins(p.coins || 1000);
      setLives(p.lives || MAX_LIVES);
      setLastRegenTime(p.lastRegenTime || Date.now());
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('goodsSortSave_v8', JSON.stringify({ coins, lives, lastRegenTime }));
  }, [coins, lives, lastRegenTime]);


  // --- GAME LOGIC ---

  const handleStartGame = (level: LevelConfig) => {
    if (lives <= 0) { console.error("No lives left to start game."); return; }
   
    setLives(l => l - 1);
    setCurrentLevel(level);
    setFailReason(null);
   
    // --- 1. Configure Shelves ---
    const numShelves = level.shelves;
    let shelvesConfig: Shelf[] = [];
   
    const lockedShelfId = level.lockedShelfId;
    const fragileShelfId = level.fragileShelfId;
   
    for (let i = 0; i < numShelves; i++) {
      let cap = level.shelfSize === 'mixed' ? (Math.random() > 0.5 ? 3 : 2) : level.shelfSize;
     
      // Since L7 is now standard, lockedShelfId should be null, but we handle the case just in case
      if (i === lockedShelfId) cap = 3;
     
      shelvesConfig.push({
        id: i,
        capacity: cap,
        items: Array(cap).fill(null)
      });
    }

    // --- 2. Determine Item Pool & Place Locked Items ---
    let itemPool: Item[] = [];
    let lockedItems: Item[] = [];
   
    const specialItemTypes = ITEM_TYPES.filter(t => t.id === 'bomb' || t.id === 'ice-cream' || t.id === 'key');
    const standardItemTypes = ITEM_TYPES.filter(t => !specialItemTypes.includes(t));
   
    // A) Add Keys and Locked Items (L7) - NO LONGER ACTIVE FOR L7
    if (level.keyConstraintActive) {
        const keyType = ITEM_TYPES.find(t => t.id === 'key');
        if (keyType) {
            // Add 3 keys to the pool for the player to sort
            for(let j=0; j < 3; j++) {
                itemPool.push({ uid: Math.random().toString(36), ...keyType, fragileMoves: null });
            }
        }
       
        // Add 3 standard items to the locked shelf
        const availableStandardTypes = standardItemTypes.filter(t => t.id !== 'soda' && t.id !== 'milk');
        if (availableStandardTypes.length === 0) {
            console.error("L7 Setup Error: Insufficient standard item types available.");
            setFailReason("Setup Error (Missing Items)");
            setView('dashboard');
            return;
        }

        for(let j=0; j < 3; j++) {
            const type = availableStandardTypes[j % availableStandardTypes.length];
            lockedItems.push({ uid: Math.random().toString(36), ...type, fragileMoves: null });
        }
       
        // Place locked items immediately
        const lockedShelf = shelvesConfig.find(s => s.id === lockedShelfId);
        if (lockedShelf) {
            lockedShelf.items = lockedItems;
        } else {
             console.error(`L7 Setup Error: Locked shelf with ID ${lockedShelfId} not found.`);
             setFailReason("Setup Error (Shelf ID Invalid)");
             setView('dashboard');
             return;
        }
    }

    // B) Add Bombs & Ice Creams (L4, L5)
    const bombType = ITEM_TYPES.find(t => t.id === 'bomb');
    if (bombType) {
        for(let j=0; j < level.numBombs; j++) {
          itemPool.push({ uid: Math.random().toString(36), ...bombType, fragileMoves: null });
        }
    }
    const iceCreamType = ITEM_TYPES.find(t => t.id === 'ice-cream');
    if (iceCreamType) {
        for(let j=0; j < level.numIceCreams; j++) {
          itemPool.push({ uid: Math.random().toString(36), ...iceCreamType, fragileMoves: null });
        }
    }
   
    // C) Determine Standard Item Count (Refined for Solvability)
    const totalSlots = shelvesConfig.reduce((sum, s) => sum + s.capacity, 0);
    const slotsUsedByLockedItems = lockedItems.length;
    const specialItemsToPlaceCount = itemPool.length;

    // Calculate slots available for random placement (Total - Locked items)
    const slotsAvailableForPlacement = totalSlots - slotsUsedByLockedItems;

    // Calculate the target number of items to place (Total available - required empty slots)
    const fixedEmptySlots = level.fragileShelfActive ? Math.floor(totalSlots * 0.2) : MIN_EMPTY_SLOTS;
    let totalItemsToPlace = slotsAvailableForPlacement - fixedEmptySlots;

    // Calculate how many standard items are required
    const standardItemsToPlaceCount = Math.max(0, totalItemsToPlace - specialItemsToPlaceCount);
   
    // GUARANTEE SOLVABILITY: Ensure standard item count is a multiple of 3
    const requiredStandardItems = standardItemsToPlaceCount - (standardItemsToPlaceCount % 3);
   
    // Item Pool Generation (Finish adding standard items)
    let typeIdx = 0;
    while (itemPool.length < specialItemsToPlaceCount + requiredStandardItems) {
      const type = standardItemTypes[typeIdx % standardItemTypes.length];
      // Add 3 at a time, but respect the final required count
      for(let k=0; k<3 && itemPool.length < specialItemsToPlaceCount + requiredStandardItems; k++) {
        itemPool.push({ uid: Math.random().toString(36), ...type, fragileMoves: null });
      }
      typeIdx++;
    }
   
    // --- 3. Place Items (Randomly, avoiding special shelves if empty) ---
    let attempts = 0;
    let solvable = false;
    let finalShelvesConfig: Shelf[] = [];

    // Loop until a solvable configuration is generated
    while (!solvable && attempts < 100) {
        finalShelvesConfig = JSON.parse(JSON.stringify(shelvesConfig));
        const currentItemPool = [...itemPool].sort(() => Math.random() - 0.5);

        let allAvailableSlots: { shelfId: number; slotIndex: number }[] = [];
        finalShelvesConfig.forEach(shelf => {
            for(let i=0; i<shelf.capacity; i++) {
                // Only use empty slots (this correctly filters slots pre-filled by locked items)
                if (shelf.items[i] === null) {
                    allAvailableSlots.push({ shelfId: shelf.id, slotIndex: i });
                }
            }
        });
       
        // Sanity Check: Ensure we have enough slots for the item pool
        if (allAvailableSlots.length < currentItemPool.length) {
             console.error(`Critical Error: Needed ${currentItemPool.length} slots, found only ${allAvailableSlots.length}. Rerun logic check.`);
             // Set up will fail gracefully below.
             break;
        }

        allAvailableSlots.sort(() => Math.random() - 0.5);
       
        // Place items from the pool into available slots
        currentItemPool.forEach((item, idx) => {
            const slot = allAvailableSlots[idx];
            if (slot) {
                const shelf = finalShelvesConfig.find(s => s.id === slot.shelfId);
                if (shelf) {
                    shelf.items[slot.slotIndex] = item;
                }
            }
        });
       
        // --- Solvability Check ---
        solvable = checkInitialSolvability(finalShelvesConfig, lockedShelfId);
        if (!solvable) {
            attempts++;
        }
    }
   
    if (!solvable) {
        console.error("Failed to generate a solvable grid after 100 attempts. Check configuration or item counts.");
        setFailReason("Internal Error: Grid generation failed.");
        setLives(l => l + 1); // Refund the life
        setView('dashboard');
        return;
    }

    // --- 4. Final state setup ---
    setGameState({
      shelves: finalShelvesConfig,
      movesLeft: level.moveLimit,
      timeLeft: level.timeLimit,
      bombsLeft: level.numBombs,
      bombTimer: level.bombTimeLimit,
      frozenShelves: [],
      lockedShelf: level.keyConstraintActive, // False for L7 now
      fragileShelfId: fragileShelfId,
      status: 'playing'
    });
    setView('game');
  };

  // --- PLAYABILITY CHECKS ---

  const checkStatus = (shelves: Shelf[], moves: number | null, timeLeft: number | null, locked: boolean): 'playing' | 'won' | 'lost' => {
    // 1. Win Check: Check only non-locked, non-frozen shelves
    // Win condition: All items are cleared AND the locked shelf is open (or not active)
    const allEmpty = shelves.every(s =>
        (s.id === currentLevel?.lockedShelfId && !locked) || // Locked shelf is open, or...
        (s.id !== currentLevel?.lockedShelfId && s.items.every(i => i === null)) // ... non-locked shelves are empty
    );
   
    if (allEmpty && !locked) {
      setGameState(p => p ? ({ ...p, status: 'won' }) : null);
      return 'won';
    }

    // 2. Loss by Limits
    if (moves !== null && moves <= 0) {
      setFailReason('Out of moves!');
      setGameState(p => p ? ({ ...p, status: 'lost' }) : null);
      return 'lost';
    }
    if (timeLeft !== null && timeLeft <= 0) {
      setFailReason('Time up!');
      setGameState(p => p ? ({ ...p, status: 'lost' }) : null);
      return 'lost';
    }
   
    return 'playing';
  };

  // --- DRAG HANDLERS ---

  const handleDragStart = (e: React.PointerEvent, item: Item, shelfId: number, slotIndex: number) => {
    if (gameState?.status !== 'playing') return;
   
    // Prevent dragging out of a locked shelf
    if (shelfId === currentLevel?.lockedShelfId && gameState.lockedShelf) {
        return;
    }

    // Prevent dragging out of a frozen shelf
    if (gameState.frozenShelves.includes(shelfId)) return;
   
    const pos = getPointerPos(e);
    setDragging({
      item,
      fromShelfId: shelfId,
      fromSlotIndex: slotIndex,
      initialX: pos.x,
      initialY: pos.y,
      currentX: pos.x,
      currentY: pos.y,
    });
  };

  const handleDragMove = useCallback((e: PointerEvent | TouchEvent) => {
    if (!dragging) return;
    if ('cancelable' in e && e.cancelable) e.preventDefault();
    const pos = getPointerPos(e);
    setDragging(prev => prev ? ({ ...prev, currentX: pos.x, currentY: pos.y }) : null);
  }, [dragging]);

  const handleDragEnd = useCallback((e: PointerEvent | TouchEvent) => {
    if (!dragging || !gameState || !currentLevel) {
      setDragging(null);
      return;
    }
   
    // Temporarily hide the dragged item to find the element under the pointer
    const overlay = document.getElementById('drag-overlay');
    if (overlay) overlay.style.display = 'none';
   
    const pos = getPointerPos(e);
    const element = document.elementFromPoint(pos.x, pos.y);
   
    if (overlay) overlay.style.display = 'flex';

    let targetShelfDiv = element?.closest('[data-shelf-id]');
   
    let targetShelfId = targetShelfDiv ? parseInt(targetShelfDiv.getAttribute('data-shelf-id') || '') : null;

    if (targetShelfId !== null && !isNaN(targetShelfId)) {
      const shelves = [...gameState.shelves];
      const fromShelf = shelves.find(s => s.id === dragging.fromShelfId);
      const toShelf = shelves.find(s => s.id === targetShelfId);

      const isSourceFragile = dragging.fromShelfId === gameState.fragileShelfId;
      const isTargetFragile = targetShelfId === gameState.fragileShelfId;
     
      // BLOCK MOVE if target shelf is frozen
      if (gameState.frozenShelves.includes(targetShelfId)) {
        setDragging(null);
        return;
      }
     
      // BLOCK MOVE if target shelf is locked
      if (targetShelfId === currentLevel.lockedShelfId && gameState.lockedShelf) {
        setDragging(null);
        return;
      }
     
      // BLOCK MOVE if moving from shelf to itself
      if (dragging.fromShelfId === targetShelfId) {
          setDragging(null);
          return;
      }
     
      if (fromShelf && toShelf) {
        // Always try to find the first empty spot
        const finalSlotIndex = toShelf.items.findIndex(i => i === null);

        if (finalSlotIndex !== -1) {
         
          // 1. Prepare Item for State Update (Fragile Check)
          let itemToMove = {...dragging.item};
          let status: 'playing' | 'won' | 'lost' = gameState.status;
         
          // --- L6: Fragile Constraint Logic ---
          if (currentLevel.fragileShelfActive) {
            if (itemToMove.fragileMoves !== null) {
                // If it was already fragile, decrement
                itemToMove.fragileMoves -= 1;
            } else if (isSourceFragile || isTargetFragile) {
                // If it's the first move to/from the fragile shelf, initialize
                itemToMove.fragileMoves = 2;
            }
           
            // Check for loss condition
            if (itemToMove.fragileMoves === 0) {
                setFailReason(`Fragile item (${itemToMove.id}) broke!`);
                status = 'lost';
            }
          }
         
          // 2. Execute the move
          fromShelf.items[dragging.fromSlotIndex] = null;
          toShelf.items[finalSlotIndex] = itemToMove;
         
          let newFrozenShelves = [...gameState.frozenShelves];
          let locked = gameState.lockedShelf;
          let moves = gameState.movesLeft;

          const isFull = toShelf.items.every(i => i !== null);
          if (isFull) {
             const firstId = toShelf.items[0]!.id;
             const isMatch = toShelf.items.every(i => i?.id === firstId);
            
             if (isMatch) {
              
               // === SPECIAL CONSTRAINT CLEARING ACTIONS ===
              
               // A) L5: Freeze the shelf
               if (firstId === 'ice-cream' && currentLevel.iceCreamConstraint) {
                   newFrozenShelves.push(toShelf.id);
               }

               // B) L4: Decrement bomb count
               if (firstId === 'bomb') {
                   setGameState(prev => prev ? ({ ...prev, bombsLeft: prev.bombsLeft - toShelf.capacity }) : null);
               }
              
               // C) L7: Unlock the shelf (Only runs if keyConstraintActive is TRUE)
               if (firstId === 'key' && currentLevel.keyConstraintActive) {
                   locked = false;
               }
              
               // Clear the shelf
               toShelf.items = Array(toShelf.capacity).fill(null);
               setClearedMessage({ x: pos.x, y: pos.y, id: Date.now(), itemType: firstId });
               setTimeout(() => setClearedMessage(null), 1000);
             }
          }

          // 3. Decrement moves if active
          if (moves !== null && status === 'playing') moves--;
         
          // 4. Update state
          setGameState(prev => prev ? ({
              ...prev,
              shelves,
              movesLeft: moves,
              frozenShelves: newFrozenShelves,
              lockedShelf: locked,
              status: status
          }) : null);
         
          // 5. Perform all checks (using the new values)
          checkStatus(shelves, moves, gameState.timeLeft, locked);
        }
      }
    }

    setDragging(null);
  }, [dragging, gameState, currentLevel]);

  useEffect(() => {
    if (dragging) {
      const handleMove = (e: Event) => handleDragMove(e as PointerEvent | TouchEvent);
      const handleEnd = (e: Event) => handleDragEnd(e as PointerEvent | TouchEvent);
      
      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
      
      return () => {
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }
  }, [dragging, handleDragMove, handleDragEnd]);

  // Timer Effect
  useEffect(() => {
    if (view === 'game' && gameState?.status === 'playing') {
      const t = setInterval(() => {
        setGameState(p => {
          if (!p || p.status !== 'playing') return p;
         
          let newTimeLeft = p.timeLeft;
          let newBombTimer = p.bombTimer;
          let status: 'playing' | 'won' | 'lost' = 'playing';

          // 1. Decrement Main Timer
          if (p.timeLeft !== null) {
            newTimeLeft = p.timeLeft - 1;
            if (newTimeLeft <= 0) {
              setFailReason('Time up!');
              status = 'lost';
            }
          }
         
          // 2. Decrement Bomb Timer
          if (currentLevel?.numBombs && currentLevel.numBombs > 0 && p.bombsLeft > 0 && p.bombTimer !== null) {
              newBombTimer = p.bombTimer - 1;
              if (newBombTimer <= 0) {
                  setFailReason('Bomb timer ran out! BOOM!');
                  status = 'lost';
              }
          }
         
          // 3. Check if all bombs are cleared
          if (p.bombsLeft === 0 && p.bombTimer !== null && newBombTimer !== 0) {
              newBombTimer = 0;
          }

          if (status === 'lost') {
            return { ...p, timeLeft: newTimeLeft, bombTimer: newBombTimer, status: 'lost' };
          }

          // Important: check status after timer updates to catch time loss
          checkStatus(p.shelves, p.movesLeft, newTimeLeft, p.lockedShelf);

          return { ...p, timeLeft: newTimeLeft, bombTimer: newBombTimer };
        });
      }, 1000);
      return () => clearInterval(t);
    }
  }, [view, gameState?.status, currentLevel]);

  // --- RENDERERS ---

  const renderDashboard = () => (
    <div className="flex flex-col h-full bg-slate-100 max-w-md mx-auto border-x border-slate-200 shadow-2xl">
      <div className="p-6 pb-4 bg-white border-b border-slate-200">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">MAP</h1>
        <p className="text-slate-400 font-medium text-sm">Select a level to start</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-4 gap-3 content-start">
          {LEVELS.map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => handleStartGame(lvl)}
              disabled={lives <= 0}
              className={`
                aspect-square rounded-2xl font-black text-xl shadow-sm border-b-4 active:border-b-0 active:translate-y-1 transition-all
                flex flex-col items-center justify-center relative
                bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-500
              `}
            >
              {lvl.id}
              {/* Constraint Icons */}
              <div className="absolute bottom-1 right-1 flex gap-0.5">
                  {lvl.timeLimit !== null && <Clock size={10} className="text-orange-400"/>}
                  {lvl.moveLimit !== null && <Move size={10} className="text-blue-400"/>}
                  {lvl.numBombs > 0 && <span className="text-xs text-red-500 font-bold leading-none">B</span>}
                  {lvl.iceCreamConstraint && <Snowflake size={10} className="text-cyan-400"/>}
                  {lvl.fragileShelfActive && <ShieldOff size={10} className="text-yellow-600"/>}
                  {lvl.keyConstraintActive && <Lock size={10} className="text-indigo-500"/>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGame = () => {
    if (!gameState || !currentLevel) return null; // Safety guard for state transition/loss

    const bombConstraintActive = gameState.bombsLeft > 0 && gameState.bombTimer !== null;

    return (
      <div className="flex flex-col h-full bg-slate-200 overflow-hidden relative select-none max-w-md mx-auto shadow-2xl border-x border-slate-300">
        {/* Top Bar */}
        <div className="bg-white px-4 py-3 flex justify-between items-center shadow-sm z-10 shrink-0">
          <div className="flex gap-3 items-center">
            <button onClick={() => setView('dashboard')} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors active:scale-95">
              <Home size={20} className="text-slate-600"/>
            </button>
            <div className="flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Level</span>
              <span className="font-black text-xl text-slate-800 leading-none">{currentLevel.id}</span>
            </div>
          </div>
         
          <div className="flex gap-2 font-mono font-bold text-lg">
             {/* Bomb Constraint Timer/Status */}
             {gameState.bombTimer !== null && (
                <div
                   className={`px-2 py-1 rounded-lg flex items-center gap-1 text-sm ${bombConstraintActive ? (gameState.bombTimer < 6 ? 'bg-red-500 text-white animate-pulse' : 'bg-red-200 text-red-700') : 'bg-green-100 text-green-600'}`}
                >
                   <span className="text-xs font-black uppercase tracking-wider">B:</span>
                   {bombConstraintActive ? `${gameState.bombTimer}s` : '✓'}
                </div>
             )}
            
             {/* Ice Cream Constraint Status */}
             {currentLevel.iceCreamConstraint && (
                <div
                   className={`px-2 py-1 rounded-lg flex items-center gap-1 text-sm ${gameState.frozenShelves.length > 0 ? 'bg-cyan-100 text-cyan-600' : 'bg-slate-100 text-slate-500'}`}
                >
                   <Snowflake size={14}/> {gameState.frozenShelves.length}
                </div>
             )}
            
             {/* Key Constraint Status (Will only show if keyConstraintActive is TRUE) */}
             {currentLevel.keyConstraintActive && (
                <div
                   className={`px-2 py-1 rounded-lg flex items-center gap-1 text-sm ${gameState.lockedShelf ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'}`}
                >
                   <Lock size={14}/> {gameState.lockedShelf ? 'LOCKED' : 'OPEN'}
                </div>
             )}

             {/* Move Limit */}
             {gameState.movesLeft !== null && (
               <div className={`px-2 py-1 rounded-lg flex items-center gap-1 text-sm ${gameState.movesLeft < 5 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                 <Move size={14}/> {gameState.movesLeft}
               </div>
             )}
            
             {/* Main Time Limit */}
             {gameState.timeLeft !== null && (
               <div className={`px-2 py-1 rounded-lg flex items-center gap-1 text-sm ${gameState.timeLeft < 30 ? 'bg-orange-100 text-orange-600' : 'bg-orange-100 text-orange-600'}`}>
                 <Clock size={14}/> {gameState.timeLeft}s
               </div>
             )}
          </div>
        </div>

        {/* Game Board */}
        <div
          className="flex-1 p-3 w-full h-full relative overflow-hidden"
          style={{ touchAction: 'none' }}
        >
           <div className={`
              w-full h-full grid gap-3
              grid-cols-3 grid-rows-5
           `}>
             {gameState.shelves.map(shelf => {
               const isFrozen = gameState.frozenShelves.includes(shelf.id);
               const isFragile = shelf.id === gameState.fragileShelfId;
               const isLockedShelf = shelf.id === currentLevel.lockedShelfId && gameState.lockedShelf;

               let shelfColor = 'bg-slate-700 border-slate-900';
               if (isFrozen) shelfColor = 'bg-cyan-800 border-cyan-900 border-opacity-70 opacity-80';
               else if (isLockedShelf) shelfColor = 'bg-indigo-900 border-indigo-950';
               else if (isFragile) shelfColor = 'bg-yellow-800 border-yellow-900';


               return (
               <div
                 key={shelf.id}
                 data-shelf-id={shelf.id}
                 className={`
                   rounded-lg border-b-[6px] shadow-lg flex flex-col relative overflow-hidden transition-colors duration-300
                   ${shelfColor}
                   ${shelf.capacity === 2 ? 'w-[66%] mx-auto' : 'w-full'}
                   ${isFrozen || isLockedShelf ? 'cursor-not-allowed' : 'cursor-default'}
                   ${isLockedShelf ? 'opacity-50' : ''}
                 `}
               >
                 {/* Shelf Status Overlay */}
                 {(isFrozen || isLockedShelf) && (
                    <div className="absolute inset-0 flex items-center justify-center text-white/50 z-20 pointer-events-none">
                        {isFrozen && <Snowflake size={48} className="animate-pulse" />}
                        {isLockedShelf && <Lock size={48} className="animate-pulse" />}
                    </div>
                 )}
                 {isFragile && (
                    <div className="absolute top-1 left-1 px-1 text-xs font-bold text-yellow-300 flex items-center gap-1 z-20">
                        <ShieldOff size={12} /> FRAGILE
                    </div>
                 )}
                
                 <div className="absolute top-0 inset-x-0 h-1.5 bg-slate-600/50 z-0"></div>

                 {/* Items Grid */}
                 <div className={`
                   flex-1 z-10 h-full px-2 pb-2
                   grid ${shelf.capacity === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-1 items-end
                 `}>
                   {shelf.items.map((item, slotIdx) => {
                     const isBeingDragged = dragging && item && dragging.item.uid === item.uid;
                    
                     // Get Fragile Tag (L6)
                     let fragileTag = null;
                     if (item && item.fragileMoves !== null) {
                         fragileTag = <span className="absolute top-0 right-0 text-[10px] font-mono text-yellow-300 bg-red-800/80 rounded-bl px-1 leading-none">{item.fragileMoves}</span>;
                     }
                    
                     return (
                       <div
                         key={slotIdx}
                         data-slot-index={slotIdx}
                         className="w-full aspect-square relative flex items-end justify-center bg-black/20 rounded-md border-b-2 border-white/5 shadow-inner"
                       >
                          {item && (
                            <div
                              className={`
                                w-full h-full flex items-end justify-center
                                ${isBeingDragged ? 'opacity-0' : 'opacity-100'}
                                cursor-grab active:cursor-grabbing
                                ${isFrozen || isLockedShelf ? 'pointer-events-none opacity-50' : ''}
                              `}
                              onPointerDown={(e) => {
                                 // Only allow drag start if the shelf is NOT locked and NOT frozen
                                 if (!isLockedShelf && !isFrozen) {
                                     handleDragStart(e, item, shelf.id, slotIdx);
                                 }
                              }}
                            >
                              {/* Item Sizing: Scaled up to look bigger in the slot */}
                              <item.component className="w-[135%] h-[135%] drop-shadow-md filter -mb-[18%] object-contain" />
                              {fragileTag}
                            </div>
                          )}
                       </div>
                     );
                   })}
                 </div>
               </div>
             )})}
           </div>
        </div>

        {/* Floating Feedback */}
        {clearedMessage && (
           <div
             className="fixed z-50 pointer-events-none text-green-500 animate-bounce font-black text-2xl drop-shadow-lg flex items-center gap-2"
             style={{ left: clearedMessage.x, top: clearedMessage.y, transform: 'translate(-50%, -100%)' }}
           >
             <CheckCircle2 size={32} fill="white" />
             {clearedMessage.itemType === 'key' ? 'UNLOCKED!' : 'PERFECT!'}
           </div>
        )}

        {/* Drag Overlay */}
        {dragging && (
          <div
            id="drag-overlay"
            className="fixed pointer-events-none z-50 flex items-center justify-center w-24 h-24"
            style={{
              left: dragging.currentX,
              top: dragging.currentY,
              transform: 'translate(-50%, -50%)',
              touchAction: 'none'
            }}
          >
             <dragging.item.component className="w-full h-full drop-shadow-2xl scale-125" />
          </div>
        )}

        {/* Modals */}
        {(gameState.status === 'won' || gameState.status === 'lost') && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl border-b-8 border-slate-200 animate-in fade-in zoom-in duration-200">
              {gameState.status === 'won' && (
                <>
                  <h2 className="text-4xl font-black text-green-500 mb-2">CLEARED!</h2>
                  <p className="text-slate-400 font-medium mb-8">Stockroom organized perfectly.</p>
                  <div className="flex justify-center items-center gap-2 text-yellow-500 font-black text-3xl mb-8 bg-yellow-50 py-4 rounded-2xl border border-yellow-100">
                    <Coins size={32} fill="currentColor" /> +100
                  </div>
                  <button onClick={() => { setView('dashboard'); setCoins(c => c + 100); }} className="w-full py-4 bg-blue-500 text-white font-bold text-lg rounded-2xl border-b-4 border-blue-700 active:border-b-0 active:translate-y-1 shadow-lg shadow-blue-200">CONTINUE</button>
                </>
              )}
              {gameState.status === 'lost' && (
                <>
                   <h2 className="text-4xl font-black text-slate-800 mb-2">FAILED</h2>
                   <p className="text-slate-400 font-medium mb-8">{failReason || 'Game Over'}</p>
                   <div className="flex gap-3">
                     <button onClick={() => setView('dashboard')} className="flex-1 py-4 bg-slate-200 text-slate-500 font-bold text-lg rounded-2xl border-b-4 border-slate-300 active:border-b-0 active:translate-y-1">EXIT</button>
                     {/* Ensure currentLevel exists before trying to retry */}
                     <button onClick={() => currentLevel && handleStartGame(currentLevel)} className="flex-1 py-4 bg-blue-500 text-white font-bold text-lg rounded-2xl border-b-4 border-blue-700 active:border-b-0 active:translate-y-1 shadow-lg shadow-blue-200">RETRY</button>
                   </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen w-full bg-slate-100 text-slate-800 font-sans overflow-hidden flex flex-col">
      {/* Global Header */}
      <div className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center shadow-lg shrink-0 z-20 max-w-md mx-auto w-full">
         <span className="font-black text-lg tracking-widest text-slate-400">GOODSSORT</span>
         <div className="flex gap-4">
           <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
             <Heart size={18} className="text-red-500 fill-red-500" />
             <span className="font-mono font-bold">{lives}</span>
           </div>
           <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
             <Coins size={18} className="text-yellow-400 fill-yellow-400" />
             <span className="font-mono font-bold">{coins}</span>
           </div>
         </div>
      </div>

      {/* Viewport Container */}
      <main className="flex-1 relative overflow-hidden w-full bg-slate-300/50">
        {view === 'dashboard' ? renderDashboard() : renderGame()}
      </main>
    </div>
  );
}
