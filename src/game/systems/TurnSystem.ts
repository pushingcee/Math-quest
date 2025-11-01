export interface TurnState {
  currentPlayer: number;
  round: number;
  movesInRound: number;
}

export interface NextTurnResult {
  newState: TurnState;
  shouldEndGame: boolean;
  roundCompleted: boolean;
}

export class TurnSystem {
  /**
   * Advance to next turn
   */
  static nextTurn(
    currentPlayer: number,
    round: number,
    movesInRound: number,
    totalPlayers: number,
    maxRounds: number
  ): NextTurnResult {
    const newMovesInRound = movesInRound + 1;
    let newRound = round;
    let finalMovesInRound = newMovesInRound;
    let roundCompleted = false;

    // Check if round is complete
    if (newMovesInRound >= totalPlayers) {
      newRound = round + 1;
      finalMovesInRound = 0;
      roundCompleted = true;

      // Check if game should end
      if (newRound > maxRounds) {
        return {
          newState: {
            currentPlayer,
            round: newRound,
            movesInRound: finalMovesInRound
          },
          shouldEndGame: true,
          roundCompleted: true
        };
      }
    }

    const nextPlayer = (currentPlayer + 1) % totalPlayers;

    return {
      newState: {
        currentPlayer: nextPlayer,
        round: newRound,
        movesInRound: finalMovesInRound
      },
      shouldEndGame: false,
      roundCompleted
    };
  }

  /**
   * Get dice label for current player
   */
  static getDiceLabel(playerName: string, hasRolled: boolean): string {
    if (hasRolled) {
      return `${playerName} rolled!`;
    }
    return `${playerName}'s turn - Click to Roll!`;
  }

  /**
   * Check if it's a new game (first turn)
   */
  static isFirstTurn(round: number, movesInRound: number): boolean {
    return round === 1 && movesInRound === 0;
  }
}
