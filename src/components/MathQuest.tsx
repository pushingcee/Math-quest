'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Player, GameScreen } from '@/types/game';
import { ImportedProblemsData } from '@/types/imported-problems';
import { TileLandingResult } from '@/game/constants/enums';
import { GameEngine } from '@/game/engine/GameEngine';
import { GameState } from '@/game/engine/GameState';
import GameSetup from './GameSetup';
import Board from './Board';
import PlayerCard from './PlayerCard';
import PlayerToken from './PlayerToken';
import Dice from './Dice';
import MathModal from './MathModal';
import MessageModal from './MessageModal';
import GameOver from './GameOver';

export default function MathQuest() {
  // Create game engine instance (persists across renders)
  const engine = useMemo(() => new GameEngine(), []);

  // Subscribe to engine state
  const [gameState, setGameState] = useState<GameState>(engine.getState());

  // UI-specific state (not part of game logic)
  const [playerPositions, setPlayerPositions] = useState<Map<number, { left: number; top: number }>>(new Map());
  const [diceLabel, setDiceLabel] = useState('Click to Roll!');

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
          setDiceLabel(`${player.name}'s turn - Click to Roll!`);
        } else {
          setDiceLabel(`${player.name} rolled ${gameState.diceValue}!`);
        }
      }
    }
  }, [gameState.currentPlayer, gameState.diceValue, gameState.players, gameState.screen]);

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
            engine.submitAnswerTimeout();
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

  // Calculate token position (DOM-specific logic)
  const calculateTokenPosition = useCallback((position: number, playerId: number, allPlayers: Player[]) => {
    const tile = document.querySelector(`[data-index="${position}"]`);
    const board = document.getElementById('board');

    if (!tile || !board) {
      return { left: 0, top: 0 };
    }

    const tileRect = tile.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();

    const otherPlayersOnTile = allPlayers.filter(
      (p) => p.id < playerId && p.position === position
    ).length;

    const offsetX = otherPlayersOnTile * 20 - 10;
    const offsetY = otherPlayersOnTile * 8;

    const relativeLeft = tileRect.left - boardRect.left + tileRect.width / 2 - 32 + offsetX;
    const relativeTop = tileRect.top - boardRect.top + tileRect.height / 2 - 32 + offsetY;

    return { left: relativeLeft, top: relativeTop };
  }, []);

  // Update player positions when players change
  const updatePlayerPositions = useCallback(() => {
    const newPositions = new Map();
    gameState.players.forEach((player) => {
      const pos = calculateTokenPosition(player.position, player.id, gameState.players);
      newPositions.set(player.id, pos);
    });
    setPlayerPositions(newPositions);
  }, [gameState.players, calculateTokenPosition]);

  // Update positions when screen or tiles change
  useEffect(() => {
    if (gameState.screen === GameScreen.Playing && gameState.tiles.length > 0 && gameState.players.length > 0) {
      const timer = setTimeout(updatePlayerPositions, 100);
      return () => clearTimeout(timer);
    }
  }, [gameState.screen, gameState.tiles, updatePlayerPositions, gameState.players.length]);

  // Auto-dismiss banner message
  useEffect(() => {
    if (gameState.bannerMessage) {
      const timer = setTimeout(() => {
        engine.clearBannerMessage();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState.bannerMessage, engine]);

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
    autoClose?: boolean
  ) => {
    engine.startGame(playerCount, problems, {
      negativePointsEnabled: negativePoints !== undefined ? negativePoints : true,
      timerEnabled: enableTimer !== undefined ? enableTimer : false,
      timerDuration: timerValue !== undefined ? timerValue : 30,
      autoCloseModal: autoClose !== undefined ? autoClose : true,
    });
  }, [engine]);

  const handleRollDice = useCallback(() => {
    const value = engine.rollDice();
    if (value === 0) return; // Invalid roll

    // Play dice sound
    if (diceAudioRef.current.length > 0) {
      const randomIndex = Math.floor(Math.random() * diceAudioRef.current.length);
      const audio = diceAudioRef.current[randomIndex];
      audio.currentTime = 0;
      audio.play().catch(e => console.log('Audio play failed:', e));
    }

    // Complete dice roll after animation
    setTimeout(() => {
      engine.completeDiceRoll(value);

      // Wait to show result, then move player
      setTimeout(() => {
        handleMovePlayer(value);
      }, 500);
    }, 500);
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

    // Animate movement step by step
    for (let step = 1; step <= steps; step++) {
      await new Promise((resolve) => setTimeout(resolve, 400));

      const currentState = engine.getState();
      const newPosition = (oldPosition + step) % currentState.config.boardSize;
      const passedStart = engine.movePlayerStep(playerId, newPosition);

      // Update visual position
      setTimeout(() => {
        const freshState = engine.getState();
        const pos = calculateTokenPosition(newPosition, playerId, freshState.players);
        setPlayerPositions((prev) => {
          const newMap = new Map(prev);
          newMap.set(playerId, pos);
          return newMap;
        });
      }, 0);
    }

    engine.completePlayerMovement();

    const finalState = engine.getState();
    const finalPosition = (oldPosition + steps) % finalState.config.boardSize;

    // Check if passed START
    if (finalPosition < oldPosition) {
      engine.applyPassStartBonus(playerId);
    }

    // Handle tile landing
    setTimeout(() => {
      const result = engine.handleTileLanding(finalPosition, playerId);
      if (result === TileLandingResult.Next) {
        engine.nextTurn();
      }
    }, 500);
  }, [engine, calculateTokenPosition]);

  const handleSubmitAnswer = useCallback((userAnswer: number) => {
    const correct = engine.submitAnswer(userAnswer);

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
  }, [engine]);

  const handleCloseMessage = useCallback(() => {
    engine.closeMessage();
    engine.nextTurn();
  }, [engine]);

  // ===== RENDER =====

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-500 to-purple-800 p-5">
      <div className="w-full max-w-6xl rounded-2xl bg-white/95 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2.5 bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-5xl font-bold text-transparent">
            Math Quest
          </h1>
          {gameState.screen === GameScreen.Playing && (
            <div className="text-xl font-semibold text-black">
              Round <span>{gameState.round}</span> of {gameState.config.maxRounds}
            </div>
          )}
        </div>

        {gameState.screen === GameScreen.Setup && <GameSetup onStart={handleStartGame} />}

        {gameState.screen === GameScreen.Playing && (
          <>
            <div className="mb-8 flex flex-wrap justify-center gap-4">
              {gameState.players.map((player, index) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isActive={index === gameState.currentPlayer}
                />
              ))}
            </div>

            <div className="mx-auto max-w-[750px]">
              <Board tiles={gameState.tiles}>
                {gameState.players.map((player) => {
                  const pos = playerPositions.get(player.id) || { left: 0, top: 0 };
                  return (
                    <PlayerToken
                      key={player.id}
                      player={player}
                      left={pos.left}
                      top={pos.top}
                      isMoving={gameState.movingPlayer === player.id}
                      isActive={player.id === gameState.currentPlayer && gameState.mathProblem === null}
                    />
                  );
                })}
              </Board>
            </div>

            <Dice
              value={gameState.diceValue}
              isRolling={gameState.isRolling}
              label={diceLabel}
              onClick={handleRollDice}
            />

            {gameState.bannerMessage && (
              <div
                className={`mx-auto mt-5 max-w-md rounded-lg p-2.5 text-center font-bold ${
                  gameState.bannerMessage.type === 'success'
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
          onClose={handleCloseMessage}
          autoClose={gameState.config.autoCloseModal}
        />
      </div>
    </div>
  );
}
