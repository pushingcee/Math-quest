import { GameEngine } from '../engine/GameEngine';

/**
 * Debug utilities for development
 * Exposed via window.__gameDebug in development mode
 */
export class DevTools {
  constructor(private engine: GameEngine) {}

  /**
   * Teleport current player directly to a specific tile (no animation, instant)
   * This is useful for quickly testing tile interactions
   * @param tileIndex The tile index (0-39)
   */
  movePlayerTo(tileIndex: number) {
    const state = this.engine.getState();
    const playerId = state.currentPlayer;
    const player = state.players[playerId];

    if (!player) {
      console.error('No current player found');
      return;
    }

    if (tileIndex < 0 || tileIndex >= state.tiles.length) {
      console.error(`Tile index must be between 0 and ${state.tiles.length - 1}`);
      return;
    }

    // Check if game is in playing state
    if (state.screen !== 'playing') {
      console.warn('Game is not in playing state. Start the game first.');
      return;
    }

    console.log(`⚡ Teleporting ${player.name} from tile ${player.position} to tile ${tileIndex}`);

    // Directly update player position
    const newPlayers = [...state.players];
    newPlayers[playerId] = {
      ...player,
      position: tileIndex,
    };

    this.engine.patchState({ players: newPlayers });

    console.log(`✓ Player now at tile ${tileIndex}`);

    // Trigger tile landing logic (shop, obstacle, math problem, etc.)
    setTimeout(() => {
      const graph = this.engine.getBoardGraph();
      const tile = graph?.getTileByIndex(tileIndex);
      // Only handle landing on traversable tiles (linked in the graph)
      if (tile?.next) {
        console.log(`📍 Handling tile landing for tile ${tileIndex}...`);
        this.engine.handleTileLanding(tileIndex, playerId);
      }
    }, 100);
  }

  /**
   * Auto-answer the current math problem correctly
   */
  answerCorrectly() {
    const state = this.engine.getState();

    if (!state.mathProblem) {
      console.warn('No math problem currently open');
      return;
    }

    const correctAnswer = state.mathProblem.answer;
    console.log(`Auto-answering: ${state.mathProblem.question} = ${correctAnswer}`);
    this.engine.submitAnswer(correctAnswer);
  }

  /**
   * Auto-answer the current math problem incorrectly
   */
  answerIncorrectly() {
    const state = this.engine.getState();

    if (!state.mathProblem) {
      console.warn('No math problem currently open');
      return;
    }

    // Answer with something obviously wrong
    const wrongAnswer = state.mathProblem.answer + 999;
    console.log(`Auto-answering incorrectly: ${wrongAnswer} (correct: ${state.mathProblem.answer})`);
    this.engine.submitAnswer(wrongAnswer);
  }

  /**
   * Skip current math problem (timeout)
   */
  skipProblem() {
    const state = this.engine.getState();

    if (!state.mathProblem) {
      console.warn('No math problem currently open');
      return;
    }

    console.log('Skipping current problem');
    this.engine.submitAnswerTimeout();
  }

  /**
   * Give player coins for testing shop
   * @param amount Number of coins to add
   */
  addCoins(amount: number = 100) {
    const state = this.engine.getState();
    const playerId = state.currentPlayer;
    const player = state.players[playerId];

    if (!player) {
      console.error('No current player found');
      return;
    }

    const oldCoins = player.coins;
    const newCoins = player.coins + amount;

    // Directly update player coins
    const newPlayers = [...state.players];
    newPlayers[playerId] = {
      ...player,
      coins: newCoins,
    };

    this.engine.patchState({ players: newPlayers });

    console.log(`💰 Added ${amount} coins to ${player.name} (${oldCoins} → ${newCoins})`);
  }

  /**
   * Skip timer for current problem
   */
  skipTimer() {
    const state = this.engine.getState();

    if (!state.mathProblem || !state.config.timerEnabled) {
      console.warn('No timer currently running');
      return;
    }

    console.log('Skipping timer');
    this.engine.setTimeLeft(0);
  }

  /**
   * Toggle pause
   */
  togglePause() {
    const state = this.engine.getState();
    const newPauseState = !state.isPaused;
    console.log(`Game ${newPauseState ? 'paused' : 'resumed'}`);
    this.engine.togglePause();
  }

  /**
   * Get current game state (pretty printed)
   */
  getState() {
    const state = this.engine.getState();
    console.table({
      currentScreen: state.screen,
      currentPlayer: state.currentPlayer,
      currentRound: state.round,
      maxRounds: state.config.maxRounds,
    });

    console.log('Players:');
    state.players.forEach((p, i) => {
      console.log(
        `  ${i}: ${p.name} - Score: ${p.score}, Position: ${p.position}, Coins: ${p.coins}`
      );
    });

    if (state.mathProblem) {
      console.log(`Current Problem: ${state.mathProblem.question} = ${state.mathProblem.answer}`);
    }

    return state;
  }

  /**
   * Force the next dice roll to produce a specific number of steps.
   * Respects the full roll event loop: animation, completeDiceRoll, movement.
   * @param value Positive integer
   */
  setNextDiceRoll(value: number) {
    if (!Number.isInteger(value) || value < 1) {
      console.error('Value must be a positive integer');
      return;
    }
    this.engine.setForcedDiceValue(value);
    console.log(`🎯 Next dice roll locked to ${value} — click the dice to trigger`);
  }

  /**
   * Advance to next turn
   */
  nextTurn() {
    console.log('Advancing to next turn');
    this.engine.nextTurn();
  }

  /**
   * Skip to game over screen
   */
  skipToGameOver() {
    const state = this.engine.getState();
    const players = state.players;

    // Find the player with highest score
    const winner = players.reduce((prev, current) =>
      prev.score > current.score ? prev : current
    );

    console.log(`Ending game - ${winner.name} wins with ${winner.score} points!`);

    // We'd need to expose endGame in GameEngine for this to work properly
    console.warn('Game over screen requires GameEngine.endGame() method to be exposed');
  }

  /**
   * Print available debug commands
   */
  help() {
    console.log(`
╔════════════════════════════════════════════╗
║         Math Quest Debug Commands          ║
╚════════════════════════════════════════════╝

Movement:
  __gameDebug.movePlayerTo(tileIndex)  - Move to tile 0-39
  __gameDebug.setNextDiceRoll(n)       - Lock next roll to n steps (click dice to trigger)

Problem Solving:
  __gameDebug.answerCorrectly()        - Auto-answer current problem correctly
  __gameDebug.answerIncorrectly()      - Auto-answer with wrong answer
  __gameDebug.skipProblem()            - Skip current problem (timeout)

Shop Testing:
  __gameDebug.addCoins(amount)         - Add coins to current player

Timer:
  __gameDebug.skipTimer()              - Skip timer for current problem

Game Control:
  __gameDebug.togglePause()            - Toggle pause state
  __gameDebug.nextTurn()               - Advance to next turn
  __gameDebug.getState()               - Print current game state

Help:
  __gameDebug.help()                   - Show this menu
    `);
  }
}
