import { GameState, GameConfig, createInitialState } from './GameState';
import { Player, MathProblem, Difficulty } from '@/types/game';
import { ImportedProblemsData } from '@/types/imported-problems';
import { GameScreen, MessageType, SpecialTilePosition, TileScoring, TileLandingResult, TileType } from '../constants/enums';
import { BoardSystem } from '../systems/BoardSystem';
import { PlayerSystem } from '../systems/PlayerSystem';
import { ProblemSystem } from '../systems/ProblemSystem';
import { ScoringSystem } from '../systems/ScoringSystem';
import { TurnSystem } from '../systems/TurnSystem';
import { ObstacleSystem } from '../systems/ObstacleSystem';
import { ItemSystem } from '../systems/ItemSystem';
import { ItemType } from '@/types/items';

export type StateChangeListener = (state: GameState) => void;

export class GameEngine {
  private state: GameState;
  private listeners: Set<StateChangeListener> = new Set();

  constructor(initialState?: Partial<GameState>) {
    this.state = { ...createInitialState(), ...initialState };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current state (immutable)
   */
  getState(): Readonly<GameState> {
    return this.state;
  }

  /**
   * Update state and notify listeners
   */
  private setState(updates: Partial<GameState>) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // ===== GAME LIFECYCLE =====

  /**
   * Start avatar selection after player count is chosen
   */
  startAvatarSelection(
    playerCount: number,
    problems?: ImportedProblemsData,
    config?: Partial<GameConfig>
  ) {
    // Store config for later use
    const newConfig = { ...this.state.config, ...config };

    this.setState({
      screen: GameScreen.AvatarSelection,
      avatarSelectionPlayerCount: playerCount,
      avatarSelectionCurrentPlayer: 0,
      selectedAvatars: [],
      selectedColors: [],
      importedProblems: problems || null,
      config: newConfig,
    });
  }

  /**
   * Select avatar and color for current player
   */
  selectAvatar(avatarIndex: number, color: string) {
    const newSelectedAvatars = [...this.state.selectedAvatars, avatarIndex];
    const newSelectedColors = [...this.state.selectedColors, color];
    const nextPlayer = this.state.avatarSelectionCurrentPlayer + 1;

    // Check if all players have selected their avatars
    if (nextPlayer >= this.state.avatarSelectionPlayerCount) {
      // All avatars selected, start the game
      this.startGameWithAvatars(newSelectedAvatars, newSelectedColors);
    } else {
      // Move to next player
      this.setState({
        selectedAvatars: newSelectedAvatars,
        selectedColors: newSelectedColors,
        avatarSelectionCurrentPlayer: nextPlayer,
      });
    }
  }

  /**
   * Start the game with selected avatars and colors
   */
  private startGameWithAvatars(avatarIndices: number[], colors: string[]) {
    // Initialize players with selected avatars and colors
    const players = PlayerSystem.initializePlayersWithAvatars(avatarIndices, colors);

    // Create board
    const tiles = BoardSystem.createBoard(this.state.config.boardSize, this.state.importedProblems || undefined);

    // Initialize problem pool
    const { pool, usedIds } = ProblemSystem.initializeProblemPool(this.state.importedProblems || null);

    this.setState({
      screen: GameScreen.Playing,
      players,
      tiles,
      currentPlayer: 0,
      round: 1,
      movesInRound: 0,
      diceValue: 0,
      problemPool: pool,
      usedProblemIds: usedIds,
      message: null,
      bannerMessage: null,
      mathProblem: null,
      isRolling: false,
      movingPlayer: null,
    });
  }

  /**
   * Start a new game (legacy method for backward compatibility)
   */
  startGame(
    playerCount: number,
    problems?: ImportedProblemsData,
    config?: Partial<GameConfig>
  ) {
    // Initialize players
    const players = PlayerSystem.initializePlayers(playerCount);

    // Update config
    const newConfig = { ...this.state.config, ...config };

    // Create board
    const tiles = BoardSystem.createBoard(newConfig.boardSize, problems);

    // Initialize problem pool
    const { pool, usedIds } = ProblemSystem.initializeProblemPool(problems || null);

    this.setState({
      screen: GameScreen.Playing,
      players,
      tiles,
      currentPlayer: 0,
      round: 1,
      movesInRound: 0,
      diceValue: 0,
      importedProblems: problems || null,
      problemPool: pool,
      usedProblemIds: usedIds,
      config: newConfig,
      message: null,
      bannerMessage: null,
      mathProblem: null,
      isRolling: false,
      movingPlayer: null,
    });
  }

  /**
   * Reset game to setup screen
   */
  resetGame() {
    this.state = createInitialState();
    this.notifyListeners();
  }

  // ===== DICE ACTIONS =====

  /**
   * Check if player has Lucky Dice and prompt to use it
   */
  checkForDiceItem(): boolean {
    const player = this.state.players[this.state.currentPlayer];
    if (!player) return false;

    const luckyDice = player.inventory.find(item => item.itemType === ItemType.ExtraDiceRoll && item.usesRemaining > 0);

    if (luckyDice) {
      // Set pending item use to prompt the player
      this.setState({
        pendingItemUse: {
          playerId: this.state.currentPlayer,
          itemType: ItemType.ExtraDiceRoll,
          context: 'dice',
        },
      });
      return true;
    }

    return false;
  }

  /**
   * Roll the dice
   */
  rollDice(): number {
    if (this.state.isRolling || this.state.movingPlayer !== null || this.state.mathProblem !== null || this.state.diceValue !== 0) {
      return 0;
    }

    const value = Math.floor(Math.random() * 6) + 1;
    this.setState({ isRolling: true });
    return value;
  }

  /**
   * Complete dice roll
   */
  completeDiceRoll(value: number) {
    this.setState({
      diceValue: value,
    });
  }

  /**
   * Roll twice with Lucky Dice and choose the better result
   * @param chosenValue The roll value the player wants to use (1 or 2 rolls)
   */
  useLuckyDice(chosenValue: number): number {
    const player = this.state.players[this.state.currentPlayer];
    if (!player) return 0;

    // Find and consume the Lucky Dice item
    const luckyDiceIndex = player.inventory.findIndex(item => item.itemType === ItemType.ExtraDiceRoll && item.usesRemaining > 0);
    if (luckyDiceIndex === -1) return 0;

    // Consume one use of the item
    const updatedPlayer = ItemSystem.useItem(player, ItemType.ExtraDiceRoll);
    const newPlayers = [...this.state.players];
    newPlayers[this.state.currentPlayer] = updatedPlayer;

    // Clear pending item use and update player
    this.setState({
      players: newPlayers,
      pendingItemUse: null,
      lastRollWasLuckyDice: true,
    });

    // Set the chosen dice value
    this.completeDiceRoll(chosenValue);

    return chosenValue;
  }

  /**
   * Set rolling state
   */
  setRolling(isRolling: boolean) {
    this.setState({ isRolling });
  }

  // ===== PLAYER MOVEMENT =====

  /**
   * Start moving player
   */
  startMovingPlayer(playerId: number) {
    this.setState({ movingPlayer: playerId });
  }

  /**
   * Update player position during movement
   */
  movePlayerStep(playerId: number, newPosition: number): boolean {
    const player = this.state.players[playerId];
    if (!player) return false;

    const oldPosition = player.position;
    const updatedPlayer = PlayerSystem.movePlayerToPosition(
      player,
      newPosition,
      this.state.config.boardSize
    );

    const newPlayers = [...this.state.players];
    newPlayers[playerId] = updatedPlayer;

    this.setState({ players: newPlayers });

    // Check if passed START
    return PlayerSystem.didPassStart(oldPosition, newPosition, this.state.config.boardSize);
  }

  /**
   * Complete player movement
   */
  completePlayerMovement() {
    this.setState({ movingPlayer: null });
  }

  /**
   * Handle passing START bonus
   */
  applyPassStartBonus(playerId: number) {
    const player = this.state.players[playerId];
    if (!player) return;

    const { scoreChange, coinReward, message } = ScoringSystem.calculatePassStartBonus();
    let updatedPlayer = ScoringSystem.applyScoreChange(player, scoreChange);
    updatedPlayer = ItemSystem.awardCoins(updatedPlayer, coinReward);

    const newPlayers = [...this.state.players];
    newPlayers[playerId] = updatedPlayer;

    this.setState({
      players: newPlayers,
      bannerMessage: { text: message, type: MessageType.Success }
    });
  }

  // ===== TILE LANDING =====

  /**
   * Handle landing on a tile
   */
  handleTileLanding(position: number, playerId: number): TileLandingResult {
    const tile = this.state.tiles[position];
    if (!tile) return TileLandingResult.Next;

    // Handle shop tiles
    if (tile.type === TileType.Shop) {
      this.openShop();
      return TileLandingResult.Special;
    }

    // Handle obstacle tiles
    if (tile.type === TileType.Obstacle && tile.obstacleType) {
      const player = this.state.players[playerId];
      if (player) {
        const { player: updatedPlayer, message } = ObstacleSystem.applyObstacleEffect(
          player,
          tile.obstacleType,
          this.state.config.boardSize
        );

        const newPlayers = [...this.state.players];
        newPlayers[playerId] = updatedPlayer;

        this.setState({
          players: newPlayers,
          message: {
            text: message,
            type: MessageType.Error
          }
        });
      }
      return TileLandingResult.Next;
    }

    // Handle special tiles
    const specialScore = ScoringSystem.calculateSpecialTileScore(position);
    if (specialScore) {
      const player = this.state.players[playerId];
      if (player) {
        const updatedPlayer = this.state.config.negativePointsEnabled || specialScore.scoreChange > 0
          ? ScoringSystem.applyScoreChange(player, specialScore.scoreChange)
          : player;

        const newPlayers = [...this.state.players];
        newPlayers[playerId] = updatedPlayer;

        this.setState({
          players: newPlayers,
          bannerMessage: {
            text: this.state.config.negativePointsEnabled || specialScore.scoreChange > 0
              ? specialScore.message
              : TileScoring[SpecialTilePosition.Penalty].messageNoDeduct,
            type: specialScore.scoreChange > 0 ? MessageType.Success : MessageType.Error
          }
        });
      }
      return TileLandingResult.Next;
    }

    // Handle corner bonus/challenge tiles
    if (position === SpecialTilePosition.Bonus) {
      // Calculate doubled points based on difficulty
      const difficulty = TileScoring[SpecialTilePosition.Bonus].difficulty;
      const basePoints = difficulty * 10 + Math.floor(Math.random() * 20);
      const bonusPoints = basePoints * 2; // Double the points!

      this.setState({
        bannerMessage: {
          text: TileScoring[SpecialTilePosition.Bonus].message,
          type: MessageType.Success
        }
      });
      this.showMathProblem(difficulty, bonusPoints);
      return TileLandingResult.Math;
    }

    if (position === SpecialTilePosition.Challenge) {
      this.setState({
        bannerMessage: {
          text: TileScoring[SpecialTilePosition.Challenge].message,
          type: MessageType.Success
        }
      });
      this.showMathProblem(
        TileScoring[SpecialTilePosition.Challenge].difficulty,
        TileScoring[SpecialTilePosition.Challenge].points
      );
      return TileLandingResult.Math;
    }

    // Regular tile with math problem
    if (tile.difficulty && tile.points && tile.question !== undefined && tile.answer !== undefined) {
      this.showMathProblem(tile.difficulty, tile.points, tile.question, tile.answer);
      return TileLandingResult.Math;
    }

    return TileLandingResult.Next;
  }

  // ===== MATH PROBLEM ACTIONS =====

  /**
   * Show a math problem
   */
  showMathProblem(difficulty: Difficulty, points: number, question?: string, answer?: number) {
    let problem;

    if (question !== undefined && answer !== undefined) {
      problem = { question, answer };
    } else {
      const result = ProblemSystem.getNextProblem(
        difficulty,
        this.state.importedProblems,
        this.state.problemPool,
        this.state.usedProblemIds
      );
      problem = result.problem;
      this.setState({
        problemPool: result.newPoolState.pool,
        usedProblemIds: result.newPoolState.usedIds
      });
    }

    this.setState({
      mathProblem: { ...problem, points },
      timeLeft: this.state.config.timerEnabled ? this.state.config.timerDuration : 0,
      isPaused: false
    });
  }

  /**
   * Submit an answer
   */
  submitAnswer(userAnswer: number): boolean {
    if (!this.state.mathProblem) return false;

    const player = this.state.players[this.state.currentPlayer];
    if (!player) return false;

    const result = ScoringSystem.calculateAnswerResult(
      userAnswer,
      this.state.mathProblem.answer,
      this.state.mathProblem.points,
      player.streak || 0,
      this.state.config.negativePointsEnabled
    );

    // Update player
    let updatedPlayer = ScoringSystem.applyScoreChange(player, result.scoreChange);
    updatedPlayer = PlayerSystem.updatePlayerStreak(updatedPlayer, result.newStreak);
    updatedPlayer = ItemSystem.awardCoins(updatedPlayer, result.coinReward);

    const newPlayers = [...this.state.players];
    newPlayers[this.state.currentPlayer] = updatedPlayer;

    this.setState({
      players: newPlayers,
      mathProblem: null,
      message: {
        text: result.message,
        type: result.correct ? MessageType.Success : MessageType.Error,
        streak: result.newStreak
      }
    });

    return result.correct;
  }

  /**
   * Handle timeout
   */
  submitAnswerTimeout() {
    if (!this.state.mathProblem) return;

    const player = this.state.players[this.state.currentPlayer];
    if (!player) return;

    const result = ScoringSystem.calculateTimeoutResult(
      this.state.mathProblem.answer,
      this.state.mathProblem.points,
      this.state.config.negativePointsEnabled
    );

    let updatedPlayer = ScoringSystem.applyScoreChange(player, result.scoreChange);
    updatedPlayer = PlayerSystem.updatePlayerStreak(updatedPlayer, 0);

    const newPlayers = [...this.state.players];
    newPlayers[this.state.currentPlayer] = updatedPlayer;

    this.setState({
      players: newPlayers,
      mathProblem: null,
      message: {
        text: result.message,
        type: MessageType.Error,
        streak: 0
      }
    });
  }

  /**
   * Toggle timer pause
   */
  togglePause() {
    this.setState({ isPaused: !this.state.isPaused });
  }

  /**
   * Update time left
   */
  setTimeLeft(time: number) {
    this.setState({ timeLeft: time });
  }

  // ===== TURN MANAGEMENT =====

  /**
   * Advance to next turn
   */
  nextTurn() {
    const result = TurnSystem.nextTurn(
      this.state.currentPlayer,
      this.state.round,
      this.state.movesInRound,
      this.state.players.length,
      this.state.config.maxRounds
    );

    if (result.shouldEndGame) {
      this.setState({ screen: GameScreen.GameOver });
      return;
    }

    this.setState({
      ...result.newState,
      diceValue: 0,
      message: null,
      lastRollWasLuckyDice: false
    });
  }

  /**
   * Close message modal
   */
  closeMessage() {
    this.setState({ message: null });
  }

  /**
   * Set banner message
   */
  setBannerMessage(text: string, type: MessageType) {
    this.setState({ bannerMessage: { text, type } });
  }

  /**
   * Clear banner message
   */
  clearBannerMessage() {
    this.setState({ bannerMessage: null });
  }

  // ===== SHOP ACTIONS =====

  /**
   * Open shop for current player
   */
  openShop() {
    this.setState({ shopOpen: true });
  }

  /**
   * Close shop
   */
  closeShop() {
    this.setState({ shopOpen: false });
  }

  /**
   * Purchase item from shop
   */
  purchaseItem(itemType: ItemType): boolean {
    const player = this.state.players[this.state.currentPlayer];
    if (!player) return false;

    const updatedPlayer = ItemSystem.purchaseItem(player, itemType);

    // Check if purchase was successful
    if (updatedPlayer.coins === player.coins) {
      return false; // Purchase failed
    }

    const newPlayers = [...this.state.players];
    newPlayers[this.state.currentPlayer] = updatedPlayer;

    this.setState({ players: newPlayers });
    return true;
  }

  // ===== ITEM USAGE ACTIONS =====

  /**
   * Prompt player to use an item
   */
  promptItemUse(itemType: ItemType, context: 'obstacle' | 'dice' | 'math' | 'teleport') {
    this.setState({
      pendingItemUse: {
        playerId: this.state.currentPlayer,
        itemType,
        context,
      },
    });
  }

  /**
   * Use an item
   */
  useItem(itemType: ItemType): boolean {
    const player = this.state.players[this.state.currentPlayer];
    if (!player) return false;

    if (!ItemSystem.hasItem(player, itemType)) {
      return false;
    }

    const updatedPlayer = ItemSystem.useItem(player, itemType);
    const newPlayers = [...this.state.players];
    newPlayers[this.state.currentPlayer] = updatedPlayer;

    this.setState({
      players: newPlayers,
      pendingItemUse: null,
    });

    return true;
  }

  /**
   * Decline to use an item
   */
  declineItemUse() {
    this.setState({ pendingItemUse: null });
  }

  /**
   * Activate teleporter - allow player to select a tile
   */
  activateTeleporter() {
    this.setState({
      teleporterActive: true,
      selectedTeleportTile: null,
      // Update pending item context to 'teleport' so TeleporterPrompt shows
      pendingItemUse: this.state.pendingItemUse ? {
        ...this.state.pendingItemUse,
        context: 'teleport'
      } : null
    });
  }

  /**
   * Select a tile for teleportation
   */
  selectTeleportTile(tileIndex: number) {
    this.setState({ selectedTeleportTile: tileIndex });
  }

  /**
   * Confirm teleportation and move player to selected tile
   */
  confirmTeleport() {
    const { selectedTeleportTile, currentPlayer } = this.state;
    if (selectedTeleportTile === null || selectedTeleportTile < 0) {
      this.cancelTeleport();
      return;
    }

    const player = this.state.players[currentPlayer];
    if (!player) {
      this.cancelTeleport();
      return;
    }

    // Move player to selected tile
    const newPlayers = [...this.state.players];
    newPlayers[currentPlayer] = {
      ...player,
      position: selectedTeleportTile,
    };

    // Consume the Teleporter item
    const updatedPlayer = ItemSystem.useItem(newPlayers[currentPlayer], ItemType.Teleport);
    newPlayers[currentPlayer] = updatedPlayer;

    this.setState({
      players: newPlayers,
      teleporterActive: false,
      selectedTeleportTile: null,
      pendingItemUse: null,
    });
  }

  /**
   * Cancel teleportation
   */
  cancelTeleport() {
    this.setState({
      teleporterActive: false,
      selectedTeleportTile: null,
      pendingItemUse: null,
    });
  }
}
