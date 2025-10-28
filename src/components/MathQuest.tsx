'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Player, MathProblem, TileData, GameScreen } from '@/types/game';
import { ImportedProblemsData, ImportedProblem } from '@/types/imported-problems';
import { playerColors } from './PlayerSprites';
import GameSetup from './GameSetup';
import Board from './Board';
import PlayerCard from './PlayerCard';
import PlayerToken from './PlayerToken';
import Dice from './Dice';
import MathModal from './MathModal';
import MessageModal from './MessageModal';
import GameOver from './GameOver';

export default function MathQuest() {
  const [screen, setScreen] = useState<GameScreen>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [round, setRound] = useState(1);
  const [diceValue, setDiceValue] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [diceLabel, setDiceLabel] = useState('Click to Roll!');
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [mathProblem, setMathProblem] = useState<MathProblem | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [movesInRound, setMovesInRound] = useState(0);
  const [playerPositions, setPlayerPositions] = useState<Map<number, { left: number; top: number }>>(new Map());
  const [movingPlayer, setMovingPlayer] = useState<number | null>(null);
  const [importedProblems, setImportedProblems] = useState<ImportedProblemsData | null>(null);
  const [problemPool, setProblemPool] = useState<ImportedProblem[]>([]);
  const [usedProblemIds, setUsedProblemIds] = useState<Set<number>>(new Set());
  const [negativePointsEnabled, setNegativePointsEnabled] = useState(true);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState(30);

  const boardRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxRounds = 10;
  const boardSize = 40;

  // Create board tiles
  const createBoard = useCallback(() => {
    const newTiles: TileData[] = [];
    for (let i = 0; i < 40; i++) {
      if (i === 0) {
        newTiles.push({ index: i, type: 'corner', label: 'START<br>+50pts' });
      } else if (i === 10) {
        newTiles.push({ index: i, type: 'corner', label: 'BONUS<br>×2pts' });
      } else if (i === 20) {
        newTiles.push({ index: i, type: 'corner', label: 'CHALLENGE<br>±100pts' });
      } else if (i === 30) {
        newTiles.push({ index: i, type: 'corner', label: 'PENALTY<br>-30pts' });
      } else {
        const difficulty = Math.floor(Math.random() * 3) + 1;
        const points = difficulty * 10 + Math.floor(Math.random() * 20);
        newTiles.push({ index: i, type: 'regular', difficulty, points });
      }
    }
    console.log('Created tiles:', newTiles.slice(0, 5)); // Log first 5 tiles
    setTiles(newTiles);
  }, []);

  // Initialize players
  const initializePlayers = (count: number) => {
    const newPlayers: Player[] = [];
    for (let i = 0; i < count; i++) {
      newPlayers.push({
        id: i,
        name: `Player ${i + 1}`,
        position: 0,
        score: 0,
        color: playerColors[i],
      });
    }
    setPlayers(newPlayers);
  };

  // Calculate token positions
  const calculateTokenPosition = (position: number, playerId: number, allPlayers: Player[]) => {
    const tile = document.querySelector(`[data-index="${position}"]`);
    const board = document.getElementById('board');

    if (!tile || !board) {
      console.log('Tile or board not found', { position, tile: !!tile, board: !!board });
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
  };

  // Update all player positions
  const updatePlayerPositions = useCallback(() => {
    const newPositions = new Map();
    players.forEach((player) => {
      const pos = calculateTokenPosition(player.position, player.id, players);
      newPositions.set(player.id, pos);
    });
    setPlayerPositions(newPositions);
  }, [players]);

  // Generate math problem (returns plain text, will be converted to LaTeX by MathModal)
  const generateMathProblem = (difficulty: number): { question: string; answer: number } => {
    let a: number, b: number, operation: string, answer: number;

    switch (difficulty) {
      case 1: // Easy
        a = Math.floor(Math.random() * 20) + 1;
        b = Math.floor(Math.random() * 20) + 1;
        operation = Math.random() < 0.5 ? '+' : '-';
        answer = operation === '+' ? a + b : a - b;
        break;
      case 2: // Medium
        a = Math.floor(Math.random() * 50) + 10;
        b = Math.floor(Math.random() * 30) + 5;
        const ops = ['+', '-', '*'];
        operation = ops[Math.floor(Math.random() * ops.length)];
        if (operation === '+') answer = a + b;
        else if (operation === '-') answer = a - b;
        else answer = a * b;
        break;
      case 3: // Hard
        const hardOps = ['*', '/'];
        operation = hardOps[Math.floor(Math.random() * hardOps.length)];
        if (operation === '*') {
          a = Math.floor(Math.random() * 20) + 5;
          b = Math.floor(Math.random() * 20) + 5;
          answer = a * b;
        } else {
          b = Math.floor(Math.random() * 10) + 2;
          answer = Math.floor(Math.random() * 20) + 5;
          a = b * answer;
        }
        break;
      default:
        a = 0;
        b = 0;
        operation = '+';
        answer = 0;
    }

    return { question: `${a} ${operation} ${b}`, answer };
  };

  // Get next imported problem or generate random one
  const getNextProblem = (difficulty: number): { question: string; answer: number } => {
    // Use imported problems if available
    if (importedProblems && problemPool.length > 0) {
      // Get a random problem from the pool
      const randomIndex = Math.floor(Math.random() * problemPool.length);
      const importedProblem = problemPool[randomIndex];

      // Remove from pool
      const newPool = [...problemPool];
      newPool.splice(randomIndex, 1);
      setProblemPool(newPool);

      // Add to used set
      setUsedProblemIds(prev => new Set(prev).add(importedProblem.id));

      // If pool is empty, refill it (excluding just-used problems for variety)
      if (newPool.length === 0 && importedProblems.problems.length > 1) {
        const availableProblems = importedProblems.problems.filter(
          p => p.id !== importedProblem.id
        );
        setProblemPool([...availableProblems]);
        console.log('Problem pool refilled');
      }

      // Parse answer as number
      const answer = parseFloat(importedProblem.answer.trim());

      console.log('Using imported problem:', importedProblem);
      return {
        question: importedProblem.question.trim(),
        answer: isNaN(answer) ? 0 : answer
      };
    }

    // Fall back to generated problems
    return generateMathProblem(difficulty);
  };

  // Show math problem
  const showMathProblem = (difficulty: number, points: number) => {
    console.log('showMathProblem called', { difficulty, points, hasImported: !!importedProblems });
    const problem = getNextProblem(difficulty);
    const problemWithPoints = { ...problem, points };
    setMathProblem(problemWithPoints);
    setTimeLeft(timerEnabled ? timerDuration : 0);

    // Clear any existing timer first
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    // Only start timer if enabled
    if (timerEnabled) {
      // Capture the problem answer and points for the timer closure
      const capturedAnswer = problemWithPoints.answer;
      const capturedPoints = problemWithPoints.points;

      // Start timer
      let time = timerDuration;
      timerIntervalRef.current = setInterval(() => {
        time--;
        setTimeLeft(time);
        console.log('Timer tick:', time);
        if (time <= 0) {
          console.log('Timer expired, submitting answer as wrong');
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          // Call submitAnswerTimeout with captured values
          submitAnswerTimeout(capturedAnswer, capturedPoints);
        }
      }, 1000);
    }
  };

  // Handle timeout separately to avoid closure issues
  const submitAnswerTimeout = (correctAnswer: number, points: number) => {
    console.log('submitAnswerTimeout called', { correctAnswer, points, currentPlayer });

    // Close math modal
    setMathProblem(null);

    // Update score (only deduct if negative points enabled)
    if (negativePointsEnabled) {
      setPlayers((prevPlayers) => {
        const newPlayers = [...prevPlayers];
        newPlayers[currentPlayer] = {
          ...newPlayers[currentPlayer],
          score: newPlayers[currentPlayer].score - points,
        };
        return newPlayers;
      });
    }

    // Show timeout message
    setMessage({
      text: negativePointsEnabled
        ? `⏰ You ran out of time! The correct answer was ${correctAnswer}. -${points} points!`
        : `⏰ You ran out of time! The correct answer was ${correctAnswer}.`,
      type: 'error'
    });
    console.log('Timeout message set');
  };

  // Submit answer (called when user manually submits)
  const submitAnswer = (userAnswer: number) => {
    console.log('submitAnswer called', { userAnswer, mathProblem });

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (!mathProblem) {
      console.log('No math problem, returning');
      return;
    }

    const correct = userAnswer === mathProblem.answer;
    const points = mathProblem.points;
    const answer = mathProblem.answer;

    // Close math modal first
    setMathProblem(null);

    // Update score and show result modal
    if (correct) {
      setPlayers((prevPlayers) => {
        const newPlayers = [...prevPlayers];
        newPlayers[currentPlayer] = {
          ...newPlayers[currentPlayer],
          score: newPlayers[currentPlayer].score + points,
        };
        return newPlayers;
      });
      setMessage({
        text: `+${points} points!`,
        type: 'success'
      });
    } else {
      // Only deduct points if negative points enabled
      if (negativePointsEnabled) {
        setPlayers((prevPlayers) => {
          const newPlayers = [...prevPlayers];
          newPlayers[currentPlayer] = {
            ...newPlayers[currentPlayer],
            score: newPlayers[currentPlayer].score - points,
          };
          return newPlayers;
        });
      }
      setMessage({
        text: negativePointsEnabled
          ? `The answer was ${answer}. -${points} points!`
          : `The answer was ${answer}.`,
        type: 'error'
      });
    }
  };

  // Close message modal and continue to next turn
  const closeMessageModal = () => {
    setMessage(null);
    nextTurn();
  };

  // Show banner message (auto-dismiss)
  const showMessage = (text: string, type: 'success' | 'error') => {
    setBannerMessage({ text, type });
    setTimeout(() => setBannerMessage(null), 3000);
  };

  // Handle tile landing
  const handleTileLanding = useCallback((position: number, playerId: number) => {
    console.log('handleTileLanding', { position, playerId, tile: tiles[position] });

    if (position === 0) {
      showMessage('Landed on START! +50 points!', 'success');
      setPlayers((prevPlayers) => {
        const newPlayers = [...prevPlayers];
        newPlayers[playerId] = {
          ...newPlayers[playerId],
          score: newPlayers[playerId].score + 50,
        };
        return newPlayers;
      });
      nextTurn();
    } else if (position === 10) {
      showMessage('BONUS! Your next correct answer worth double!', 'success');
      showMathProblem(2, 2);
    } else if (position === 20) {
      showMessage('CHALLENGE! High risk, high reward!', 'success');
      showMathProblem(3, 100);
    } else if (position === 30) {
      if (negativePointsEnabled) {
        showMessage('PENALTY! -30 points!', 'error');
        setPlayers((prevPlayers) => {
          const newPlayers = [...prevPlayers];
          newPlayers[playerId] = {
            ...newPlayers[playerId],
            score: newPlayers[playerId].score - 30,
          };
          return newPlayers;
        });
      } else {
        showMessage('PENALTY! (No points deducted)', 'error');
      }
      nextTurn();
    } else {
      const tile = tiles[position];
      if (tile && tile.difficulty && tile.points) {
        showMathProblem(tile.difficulty, tile.points);
      }
    }
  }, [tiles]);

  // Move player
  const movePlayer = async (steps: number) => {
    const playerId = currentPlayer;
    const oldPosition = players[playerId].position;

    setMovingPlayer(playerId);

    for (let step = 1; step <= steps; step++) {
      await new Promise((resolve) => setTimeout(resolve, 400));

      const newPosition = (oldPosition + step) % boardSize;

      // Update player position immutably
      setPlayers((prevPlayers) => {
        const newPlayers = [...prevPlayers];
        newPlayers[playerId] = {
          ...newPlayers[playerId],
          position: newPosition,
        };

        // Calculate position with updated players array
        const pos = calculateTokenPosition(newPosition, playerId, newPlayers);
        setPlayerPositions((prev) => {
          const newMap = new Map(prev);
          newMap.set(playerId, pos);
          return newMap;
        });

        return newPlayers;
      });
    }

    setMovingPlayer(null);

    const finalPosition = (oldPosition + steps) % boardSize;

    // Check if passed START
    if (finalPosition < oldPosition) {
      setPlayers((prevPlayers) => {
        const newPlayers = [...prevPlayers];
        newPlayers[playerId] = {
          ...newPlayers[playerId],
          score: newPlayers[playerId].score + 50,
        };
        return newPlayers;
      });
      showMessage('Passed START! +50 points!', 'success');
    }

    setTimeout(() => {
      handleTileLanding(finalPosition, playerId);
    }, 500);
  };

  // Roll dice
  const rollDice = () => {
    if (isRolling) return;

    setIsRolling(true);
    setDiceLabel('Rolling...');

    const value = Math.floor(Math.random() * 6) + 1;

    setTimeout(() => {
      setDiceValue(value);
      setIsRolling(false);
      setDiceLabel(`${players[currentPlayer].name} rolled ${value}!`);

      // Wait 1 second before starting movement so player can see the result
      setTimeout(() => {
        movePlayer(value);
      }, 1000);
    }, 500);
  };

  // Next turn
  const nextTurn = () => {
    const newMovesInRound = movesInRound + 1;
    setMovesInRound(newMovesInRound);

    if (newMovesInRound >= players.length) {
      const newRound = round + 1;
      setRound(newRound);
      setMovesInRound(0);

      if (newRound > maxRounds) {
        setScreen('gameOver');
        return;
      }
    }

    const nextPlayer = (currentPlayer + 1) % players.length;
    setCurrentPlayer(nextPlayer);
    setDiceLabel(`${players[nextPlayer].name}'s turn - Click to Roll!`);
    setDiceValue(0);
  };

  // Start game
  const startGame = (
    playerCount: number,
    problems?: ImportedProblemsData,
    negativePoints?: boolean,
    enableTimer?: boolean,
    timerValue?: number
  ) => {
    initializePlayers(playerCount);
    createBoard();

    // Set up imported problems if provided
    if (problems) {
      console.log('Starting game with imported problems:', problems);
      setImportedProblems(problems);
      setProblemPool([...problems.problems]);
      setUsedProblemIds(new Set());
    } else {
      console.log('Starting game with generated problems');
      setImportedProblems(null);
      setProblemPool([]);
      setUsedProblemIds(new Set());
    }

    // Set negative points setting (default to true if not specified)
    setNegativePointsEnabled(negativePoints !== undefined ? negativePoints : true);

    // Set timer settings
    setTimerEnabled(enableTimer !== undefined ? enableTimer : false);
    setTimerDuration(timerValue !== undefined ? timerValue : 30);

    setScreen('playing');
    setCurrentPlayer(0);
    setRound(1);
    setMovesInRound(0);
    setDiceLabel(`Player 1's turn - Click to Roll!`);
  };

  // Reset game
  const resetGame = () => {
    setScreen('setup');
    setPlayers([]);
    setCurrentPlayer(0);
    setRound(1);
    setDiceValue(0);
    setMovesInRound(0);
    setMathProblem(null);
    setMessage(null);
    setBannerMessage(null);
    setImportedProblems(null);
    setProblemPool([]);
    setUsedProblemIds(new Set());
  };

  // Update positions when screen or tiles change (not on every player update)
  useEffect(() => {
    if (screen === 'playing' && tiles.length > 0 && players.length > 0) {
      const timer = setTimeout(updatePlayerPositions, 100);
      return () => clearTimeout(timer);
    }
  }, [screen, tiles, updatePlayerPositions, players.length]);

  // Cleanup timer when component unmounts
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-500 to-purple-800 p-5">
      <div className="w-full max-w-6xl rounded-2xl bg-white/95 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2.5 bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-5xl font-bold text-transparent">
            Math Quest
          </h1>
          {screen === 'playing' && (
            <div className="text-xl font-semibold text-black">
              Round <span>{round}</span> of {maxRounds}
            </div>
          )}
        </div>

        {screen === 'setup' && <GameSetup onStart={startGame} />}

        {screen === 'playing' && (
          <>
            <div className="mb-8 flex flex-wrap justify-center gap-4">
              {players.map((player, index) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isActive={index === currentPlayer}
                />
              ))}
            </div>

            <div className="mx-auto max-w-[750px]">
              <Board tiles={tiles}>
                {players.map((player) => {
                  const pos = playerPositions.get(player.id) || { left: 0, top: 0 };
                  return (
                    <PlayerToken
                      key={player.id}
                      player={player}
                      left={pos.left}
                      top={pos.top}
                      isMoving={movingPlayer === player.id}
                    />
                  );
                })}
              </Board>
            </div>

            <Dice
              value={diceValue}
              isRolling={isRolling}
              label={diceLabel}
              onClick={rollDice}
            />

            {bannerMessage && (
              <div
                className={`mx-auto mt-5 max-w-md rounded-lg p-2.5 text-center font-bold ${
                  bannerMessage.type === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {bannerMessage.text}
              </div>
            )}
          </>
        )}

        {screen === 'gameOver' && (
          <GameOver players={players} onPlayAgain={resetGame} />
        )}

        <MathModal
          isOpen={mathProblem !== null}
          problem={mathProblem?.question || ''}
          timeLeft={timeLeft}
          onSubmit={submitAnswer}
          timerEnabled={timerEnabled}
        />

        <MessageModal
          isOpen={message !== null && mathProblem === null}
          message={message?.text || ''}
          type={message?.type || 'success'}
          onClose={closeMessageModal}
        />
        {/* Debug logging */}
        {console.log('MessageModal condition:', {
          messageNotNull: message !== null,
          mathProblemNull: mathProblem === null,
          isOpen: message !== null && mathProblem === null,
          message,
          mathProblem
        })}
      </div>
    </div>
  );
}
