# Debug Tools Guide

During development, the game exposes debug utilities via the browser console. These tools are **only available in development mode** and won't be included in production builds.

## Accessing Debug Tools

1. Open the browser Developer Tools (F12 or Cmd+Opt+I on Mac)
2. Switch to the **Console** tab
3. You should see a message: "💾 Game Debug Tools Loaded"
4. All commands are accessible via the `__gameDebug` object

## Available Commands

### Movement
```javascript
// Move the current player to a specific tile (0-39)
__gameDebug.movePlayerTo(5)     // Move to tile 5
__gameDebug.movePlayerTo(25)    // Move to tile 25
```

### Problem Solving
```javascript
// Auto-answer the current math problem correctly
__gameDebug.answerCorrectly()

// Auto-answer with an obviously wrong answer
__gameDebug.answerIncorrectly()

// Skip the current problem (trigger timeout)
__gameDebug.skipProblem()
```

### Timer Control
```javascript
// Skip the timer for the current problem
__gameDebug.skipTimer()
```

### Shop Testing
```javascript
// Add coins to the current player
__gameDebug.addCoins(100)       // Add 100 coins
__gameDebug.addCoins(50)        // Add 50 coins
```

### Game Control
```javascript
// Toggle pause/resume
__gameDebug.togglePause()

// Advance to the next player's turn
__gameDebug.nextTurn()

// Print current game state (players, scores, positions, etc.)
__gameDebug.getState()
```

### Help
```javascript
// Display all available commands
__gameDebug.help()
```

## Common Debugging Workflows

### Testing Shop System
1. Start a game
2. Use `__gameDebug.movePlayerTo(19)` to move to a shop tile
3. The shop drawer should open
4. Use `__gameDebug.addCoins(100)` to give yourself coins
5. Test purchasing items

### Testing Obstacles
1. Move to tile 7 (slip) or tile 18 (trap): `__gameDebug.movePlayerTo(7)`
2. The obstacle message should appear

### Testing Math Problems
1. Land on a regular tile with `__gameDebug.movePlayerTo(5)`
2. Use `__gameDebug.answerCorrectly()` to solve instantly
3. Or use `__gameDebug.answerIncorrectly()` to test wrong answers

### Rapid Testing
1. Use `__gameDebug.movePlayerTo()` to quickly navigate
2. Use `__gameDebug.answerCorrectly()` to skip problems instantly
3. Use `__gameDebug.nextTurn()` to advance turns manually

## Notes

- Debug tools are only available in `NODE_ENV === 'development'`
- They won't impact the production build
- Commands execute immediately without waiting for animations
- The `movePlayerTo()` function calculates the shortest path automatically
- All state changes are logged to the console for debugging
