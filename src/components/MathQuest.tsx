'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Player, GameScreen } from '@/types/game';
import { ImportedProblemsData } from '@/types/imported-problems';
import { TileLandingResult } from '@/game/constants/enums';
import { GameEngine } from '@/game/engine/GameEngine';
import { GameState } from '@/game/engine/GameState';
import { ItemType, ITEM_CATALOG } from '@/types/items';
import { assetPath } from '@/utils/assetPath';
import { ItemSystem } from '@/game/systems/ItemSystem';
import { DevTools } from '@/game/debug/devtools';
import { useLanguage } from '@/context/LanguageContext';
import { t } from '@/i18n/translations';
import GameSetup from './GameSetup';
import AvatarSelection from './AvatarSelection';
import PlayerCard from './PlayerCard';
import Dice from './Dice';
import MathModal from './MathModal';
import MessageModal from './MessageModal';
import GameOver from './GameOver';
import ShopDrawer from './ShopDrawer';
import ItemPrompt from './ItemPrompt';
import DiceChoicePrompt from './DiceChoicePrompt';
import TeleporterPrompt from './TeleporterPrompt';

// PixiJS is client-only — dynamic import to avoid SSR crashes
const PixiBoard = dynamic(() => import('./pixi/PixiBoard'), { ssr: false });

export default function MathQuest() {
  // Language support
  const { language } = useLanguage();

  // Create game engine instance (persists across renders)
  const engine = useMemo(() => new GameEngine(), []);

  // Subscribe to engine state
  const [gameState, setGameState] = useState<GameState>(engine.getState());

  // UI-specific state (not part of game logic)
  const [diceLabel, setDiceLabel] = useState(t(language, 'clickToRoll'));
  const [suppressDiceSound, setSuppressDiceSound] = useState(false);

  // Refs for audio and DOM
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const diceAudioRef = useRef<HTMLAudioElement[]>([]);
  const yayAudioRef = useRef<HTMLAudioElement[]>([]);
  const chimeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Subscribe to engine state changes
  useEffect(() => {
    const unsubscribe = engine.subscribe((newState) => {
      setGameState(newState);
    });
    return unsubscribe;
  }, [engine]);

  // Update dice label when current player changes
  useEffect(() => {
    if (gameState.screen === GameScreen.Playing && gameState.players.length > 0) {
      const player = gameState.players[gameState.currentPlayer];
      if (player) {
        if (gameState.diceValue === 0) {
          setDiceLabel(t(language, 'turnClickToRoll', { name: player.name }));
        } else {
          setDiceLabel(t(language, 'rolled', { name: player.name, value: gameState.diceValue }));
        }
      }
    }
  }, [gameState.currentPlayer, gameState.diceValue, gameState.players, gameState.screen, language]);

  // Timer management
  useEffect(() => {
    if (gameState.mathProblem && gameState.config.timerEnabled) {
      // Clear any existing timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      let time = gameState.config.timerDuration;
      engine.setTimeLeft(time);

      timerIntervalRef.current = setInterval(() => {
        const state = engine.getState();
        if (!state.isPaused) {
          time--;
          engine.setTimeLeft(time);
          if (time <= 0) {
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
            engine.submitAnswerTimeout(language);
          }
        }
      }, 1000);

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      };
    }
  }, [gameState.mathProblem, gameState.config.timerEnabled, engine]);

  // Auto-dismiss banner message
  useEffect(() => {
    if (gameState.bannerMessage) {
      const timer = setTimeout(() => {
        engine.clearBannerMessage();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState.bannerMessage, engine]);

  // Activate teleporter mode if current player has a teleporter and it's their turn
  useEffect(() => {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    if (
      currentPlayer &&
      !gameState.teleporterActive &&
      !gameState.pendingItemUse &&
      !gameState.isRolling &&
      gameState.movingPlayer === null &&
      ItemSystem.hasItem(currentPlayer, ItemType.Teleport)
    ) {
      engine.activateTeleporter();
    }
  }, [gameState.currentPlayer, gameState.players, gameState.teleporterActive, gameState.pendingItemUse, gameState.isRolling, gameState.movingPlayer, engine]);

  // Helper to get audio path
  const getAudioPath = useCallback((filename: string) => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/Math-quest')) {
      return `/Math-quest/${filename}`;
    }
    return `/${filename}`;
  }, []);

  // Preload audio
  useEffect(() => {
    const diceSounds = ['dr2.mp3', 'dr3.mp3', 'dr4.mp3', 'dr5.mp3'];
    diceAudioRef.current = diceSounds.map(sound => {
      const audio = new Audio(getAudioPath(sound));
      audio.preload = 'auto';
      audio.load();
      return audio;
    });

    const yaySounds = ['yay1.mp3', 'yay2.mp3', 'yay3.mp3', 'yay4.mp3', 'yay5.mp3'];
    yayAudioRef.current = yaySounds.map(sound => {
      const audio = new Audio(getAudioPath(sound));
      audio.preload = 'auto';
      audio.load();
      return audio;
    });

    const chimeAudio = new Audio(getAudioPath('chime.mp3'));
    chimeAudio.preload = 'auto';
    chimeAudio.load();
    chimeAudioRef.current = chimeAudio;
  }, [getAudioPath]);

  // ===== EVENT HANDLERS =====

  const handleStartGame = useCallback((
    playerCount: number,
    problems?: ImportedProblemsData,
    negativePoints?: boolean,
    enableTimer?: boolean,
    timerValue?: number,
    autoClose?: boolean,
    displayProblemsInTiles?: boolean
  ) => {
    engine.startAvatarSelection(playerCount, problems, {
      negativePointsEnabled: negativePoints !== undefined ? negativePoints : true,
      timerEnabled: enableTimer !== undefined ? enableTimer : false,
      timerDuration: timerValue !== undefined ? timerValue : 30,
      autoCloseModal: autoClose !== undefined ? autoClose : true,
      displayProblemsInTiles: displayProblemsInTiles !== undefined ? displayProblemsInTiles : true,
    });
  }, [engine]);

  const handleSelectAvatar = useCallback((avatarIndex: number, color: string) => {
    engine.selectAvatar(avatarIndex, color);
  }, [engine]);

  const handleMovePlayer = useCallback(async (steps: number) => {
    // Get fresh state from engine
    const state = engine.getState();
    const playerId = state.currentPlayer;
    const player = state.players[playerId];

    if (!player) {
      console.error('Player not found:', playerId);
      return;
    }

    const oldPosition = player.position;

    engine.startMovingPlayer(playerId);
    engine.setRolling(false);

    // Animate movement step by step — PixiBoard reacts to position changes
    for (let step = 1; step <= steps; step++) {
      await new Promise((resolve) => setTimeout(resolve, 400));

      const currentState = engine.getState();
      const currentPosition = currentState.players[playerId]?.position ?? oldPosition;
      const newPosition = (currentPosition + 1) % currentState.config.boardSize;
      engine.movePlayerStep(playerId, newPosition);
    }

    // Wait for the last step's walk animation to finish before clearing isMoving
    await new Promise((resolve) => setTimeout(resolve, 350));

    engine.completePlayerMovement();

    const finalState = engine.getState();
    const actualPosition = finalState.players[playerId]?.position ?? 0;
    const calculatedPosition = (oldPosition + steps) % finalState.config.boardSize;

    // Check if passed START
    if (calculatedPosition < oldPosition) {
      engine.applyPassStartBonus(playerId);
    }

    // Handle tile landing — corner tiles + tile 39 (under START) are skipped
    setTimeout(() => {
      const cornerTiles = [0, 10, 20, 30];
      if (!cornerTiles.includes(actualPosition)) {
        const result = engine.handleTileLanding(actualPosition, playerId);
        if (result === TileLandingResult.Next) {
          const state = engine.getState();
          if (state.message !== null) {
            setTimeout(() => {
              engine.nextTurn();
            }, 2600);
          } else {
            engine.nextTurn();
          }
        }
      } else {
        engine.nextTurn();
      }
    }, 500);
  }, [engine]);

  const handleRollDice = useCallback(() => {
    console.log('🎲 handleRollDice called', { suppressDiceSound, lastRollWasLuckyDice: gameState.lastRollWasLuckyDice });

    // Check if player has Lucky Dice item to use
    const hasLuckyDice = engine.checkForDiceItem();
    if (hasLuckyDice) {
      console.log('Lucky Dice item found, returning early');
      return; // Wait for item prompt response
    }

    const value = engine.rollDice();
    if (value === 0) return; // Invalid roll

    // Play dice sound only if not suppressed and not a Lucky Dice result
    if (!suppressDiceSound && !gameState.lastRollWasLuckyDice && diceAudioRef.current.length > 0) {
      console.log('🔊 Playing dice sound');
      const randomIndex = Math.floor(Math.random() * diceAudioRef.current.length);
      const audio = diceAudioRef.current[randomIndex];
      audio.currentTime = 0;
      audio.play().catch(e => console.log('Audio play failed:', e));
    } else {
      console.log('🔇 Sound suppressed', { suppressDiceSound, lastRollWasLuckyDice: gameState.lastRollWasLuckyDice });
    }

    // Complete dice roll after animation
    setTimeout(() => {
      engine.completeDiceRoll(value);

      // Wait to show result, then move player
      setTimeout(() => {
        handleMovePlayer(value);
      }, 500);
    }, 500);
  }, [engine, handleMovePlayer, gameState.lastRollWasLuckyDice, suppressDiceSound]);

  const handleSubmitAnswer = useCallback((userAnswer: number) => {
    const correct = engine.submitAnswer(userAnswer, language);

    // Play audio feedback
    if (correct) {
      if (chimeAudioRef.current) {
        const chime = chimeAudioRef.current.cloneNode() as HTMLAudioElement;
        chime.playbackRate = 0.95 + Math.random() * 0.1;
        chime.play().catch(e => console.log('Audio play failed:', e));
      }

      // Play celebration sound on streak
      const state = engine.getState();
      const currentPlayer = state.players[state.currentPlayer];
      if (currentPlayer && currentPlayer.streak && currentPlayer.streak >= 3 && yayAudioRef.current.length > 0) {
        const randomIndex = Math.floor(Math.random() * yayAudioRef.current.length);
        const audio = yayAudioRef.current[randomIndex];
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Audio play failed:', e));
      }
    }
  }, [engine, language]);

  const handleCloseMessage = useCallback(() => {
    engine.closeMessage();
    engine.nextTurn();
  }, [engine]);

  const handlePurchaseItem = useCallback((itemType: ItemType) => {
    const success = engine.purchaseItem(itemType);
    if (success) {
      // Close shop
      engine.closeShop();

      if (itemType === ItemType.ExtraDiceRoll) {
        // Consume one use immediately, then advance turn
        engine.useItem(itemType);
        engine.nextTurn();
      } else if (itemType === ItemType.Teleport) {
        // Activate teleporter immediately
        engine.activateTeleporter();
      } else {
        // Shield and PointBooster are passive inventory items:
        // Shield auto-activates on obstacle tiles, PointBooster on math problems.
        // No "use now" prompt needed — just advance the turn.
        engine.nextTurn();
      }
    }
  }, [engine]);

  const handleCloseShop = useCallback(() => {
    engine.closeShop();
    engine.nextTurn();
  }, [engine]);

  const handleUseItem = useCallback((itemType: ItemType) => {
    if (itemType === ItemType.Teleport) {
      // For Teleporter, activate selection mode (activateTeleporter also updates context)
      engine.activateTeleporter();
    } else {
      engine.useItem(itemType);
    }
  }, [engine]);

  const handleDeclineItem = useCallback(() => {
    const state = engine.getState();
    // If declining a Teleporter (context: teleport), advance turn; others just clear the prompt
    if (state.pendingItemUse?.context === 'teleport') {
      engine.declineItemUse();
      engine.nextTurn();
    } else {
      engine.declineItemUse();
    }
  }, [engine]);

  const handleDiceChoice = useCallback((chosenRoll: number) => {
    // Stop ALL audio immediately
    diceAudioRef.current.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    yayAudioRef.current.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    if (chimeAudioRef.current) {
      chimeAudioRef.current.pause();
      chimeAudioRef.current.currentTime = 0;
    }

    // Suppress dice sound while moving player
    setSuppressDiceSound(true);

    // Use the Lucky Dice and set the chosen value
    engine.useLuckyDice(chosenRoll);

    // Continue immediately without animation
    handleMovePlayer(chosenRoll);

    // Re-enable sound after a delay
    setTimeout(() => {
      setSuppressDiceSound(false);
    }, 2000);
  }, [engine, handleMovePlayer]);

  // Expose debug tools in development (after all handlers are defined)
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      const devTools = new DevTools(engine);
      (window as any).__gameDebug = devTools;
      // Expose the movement trigger for debug tools
      (window as any).__triggerMove = handleMovePlayer;
      console.log('%c💾 Game Debug Tools Loaded', 'color: #00ff00; font-weight: bold;');
      console.log('%cType __gameDebug.help() for available commands', 'color: #00ffff;');
      devTools.help();
    }
  }, [engine, handleMovePlayer]);

  // ===== RESPONSIVE BOARD SIZING =====
  const headerRef = useRef<HTMLDivElement>(null);
  const [boardMaxHeight, setBoardMaxHeight] = useState(0);

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout | null = null;

    const calculateBoardHeight = () => {
      const headerHeight = headerRef.current?.offsetHeight ?? 0;
      // Safety margin for any browser chrome / bottom padding
      const safetyMargin = 16;
      const available = window.innerHeight - headerHeight - safetyMargin;
      setBoardMaxHeight(Math.max(available, 100));
    };

    const handleResize = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(calculateBoardHeight, 100);
    };

    calculateBoardHeight();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [gameState.screen, gameState.players.length]);

  // ===== RENDER =====

  return (
    <div
      className={`flex h-screen items-start justify-center bg-cover bg-center bg-no-repeat p-2 sm:items-center sm:p-5 ${gameState.screen !== GameScreen.Playing ? 'bg-gradient-to-br from-purple-500 to-purple-800' : ''}`}
      style={{ backgroundImage: gameState.screen === GameScreen.Playing ? `url('${assetPath('/table-wizzard.jpg')}')` : undefined }}
    >
      <div className={`w-full max-w-6xl rounded-2xl p-4 sm:p-8 ${gameState.screen !== GameScreen.Playing ? 'bg-white/95 shadow-2xl' : ''}`}>
        <div ref={headerRef}>
          <div className="mb-1 text-center sm:mb-4">
            <h1 className="mb-0.5 bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-xl font-bold text-transparent sm:mb-2.5 sm:text-5xl md:text-5xl">
              Math Quest
            </h1>
            {gameState.screen === GameScreen.Playing && (
              <div className="text-sm font-semibold text-black sm:text-xl">
                Round <span>{gameState.round}</span> of {gameState.config.maxRounds}
              </div>
            )}
          </div>

          {gameState.screen === GameScreen.Playing && (
            <div className="mb-1 flex flex-wrap justify-center gap-1 sm:mb-4 sm:gap-4">
              {gameState.players.map((player, index) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isActive={index === gameState.currentPlayer}
                />
              ))}
            </div>
          )}
        </div>

        {gameState.screen === GameScreen.Setup && <GameSetup onStart={handleStartGame} />}

        {gameState.screen === GameScreen.AvatarSelection && (
          <AvatarSelection
            playerNumber={gameState.avatarSelectionCurrentPlayer + 1}
            selectedAvatars={gameState.selectedAvatars}
            selectedColors={gameState.selectedColors}
            onSelectAvatar={handleSelectAvatar}
          />
        )}

        {gameState.screen === GameScreen.Playing && (
          <>
            <PixiBoard
              tiles={gameState.tiles}
              players={gameState.players}
              currentPlayer={gameState.currentPlayer}
              movingPlayer={gameState.movingPlayer}
              teleporterMode={gameState.teleporterActive}
              selectedTeleportTile={gameState.selectedTeleportTile}
              maxHeight={boardMaxHeight}
              onTileTeleportClick={(tileIndex) => {
                engine.selectTeleportTile(tileIndex);
              }}
            />

            {/* Check if current player has teleporter available */}
            {gameState.players[gameState.currentPlayer] &&
              gameState.teleporterActive &&
              !gameState.pendingItemUse &&
              ItemSystem.hasItem(gameState.players[gameState.currentPlayer], ItemType.Teleport) ? (
              // Show Teleporter prompt instead of dice
              <TeleporterPrompt
                isOpen={true}
                selectedTile={gameState.selectedTeleportTile}
                onConfirm={(tileIndex) => {
                  // Confirm teleportation
                  engine.confirmTeleport();

                  // Wait for the next state update, then handle tile landing
                  setTimeout(() => {
                    const state = engine.getState();
                    const playerId = state.currentPlayer;
                    const actualPosition = state.players[playerId]?.position ?? tileIndex;

                    // Handle tile landing
                    const result = engine.handleTileLanding(actualPosition, playerId);
                    if (result === TileLandingResult.Next) {
                      // Wait for message modal to display before advancing
                      const latestState = engine.getState();
                      if (latestState.message !== null) {
                        setTimeout(() => {
                          engine.nextTurn();
                        }, 2600);
                      } else {
                        engine.nextTurn();
                      }
                    }
                  }, 50);
                }}
                onCancel={() => {
                  // If player cancels, consume the teleporter and advance turn
                  engine.useItem(ItemType.Teleport);
                  engine.nextTurn();
                }}
              />
            ) : !gameState.pendingItemUse || gameState.pendingItemUse.context !== 'dice' ? (
              <Dice
                value={gameState.diceValue}
                isRolling={gameState.isRolling}
                label={diceLabel}
                onClick={handleRollDice}
              />
            ) : null}

            {gameState.bannerMessage && (
              <div
                className={`mx-auto mt-5 max-w-md rounded-lg p-2.5 text-center font-bold ${gameState.bannerMessage.type === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}
              >
                {gameState.bannerMessage.text}
              </div>
            )}
          </>
        )}

        {gameState.screen === GameScreen.GameOver && (
          <GameOver players={gameState.players} onPlayAgain={() => engine.resetGame()} />
        )}

        <MathModal
          isOpen={gameState.mathProblem !== null}
          problem={gameState.mathProblem?.question || ''}
          points={gameState.mathProblem?.points}
          timeLeft={gameState.timeLeft}
          onSubmit={handleSubmitAnswer}
          timerEnabled={gameState.config.timerEnabled}
          isPaused={gameState.isPaused}
          onTogglePause={() => engine.togglePause()}
        />

        <MessageModal
          isOpen={gameState.message !== null && gameState.mathProblem === null}
          message={gameState.message?.text || ''}
          type={gameState.message?.type || 'success'}
          streak={gameState.message?.streak}
          problem={gameState.message?.problem}
          onClose={handleCloseMessage}
          autoClose={gameState.config.autoCloseModal}
        />

        <ShopDrawer
          isOpen={gameState.shopOpen}
          player={gameState.players[gameState.currentPlayer] || gameState.players[0]}
          onPurchase={handlePurchaseItem}
          onClose={handleCloseShop}
        />

        {gameState.pendingItemUse && gameState.pendingItemUse.context === 'dice' ? (
          <DiceChoicePrompt
            isOpen={true}
            onChoose={handleDiceChoice}
          />
        ) : gameState.pendingItemUse ? (
          <ItemPrompt
            isOpen={true}
            itemEmoji={ITEM_CATALOG[gameState.pendingItemUse.itemType].emoji}
            itemName={ITEM_CATALOG[gameState.pendingItemUse.itemType].name}
            promptMessage={`Would you like to use your ${ITEM_CATALOG[gameState.pendingItemUse.itemType].name}?`}
            onUse={() => handleUseItem(gameState.pendingItemUse!.itemType)}
            onDecline={handleDeclineItem}
          />
        ) : null}
      </div>
    </div>
  );
}
