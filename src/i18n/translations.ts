export type Language = 'bg' | 'en';

export const translations = {
  bg: {
    // Problem Sets
    savedProblemSets: 'Запазени набори от задачи',

    // Game Setup
    gameSetup: 'Настройка на игра',
    numberOfPlayers: 'Брой играчи:',
    player1: '1 играч',
    player2: '2 играчи',
    player3: '3 играчи',
    player4: '4 играчи',
    enableNegativePoints: 'отрицателни точки',
    enableTimer: 'таймер',
    seconds: 'секунди',
    enableModalAutoClose: 'автоматично затваряне',
    displayProblemsInTiles: 'Покажи задачи в плочки',
    importMathProblems: '📁 Добави математически задачи (по желание)',
    uploadJsonFile: 'Качи JSON файл с персонализирани математически задачи',
    loaded: '✓ Зареден:',
    problems: 'задачи',
    invalidJsonFile: '✗ Невалиден JSON файл. Моля, проверете формата.',
    startGame: 'Старт',

    // Language Selection
    selectLanguage: 'Избери език',
    bulgarian: 'Български',
    english: 'English',

    // Avatar Selection
    selectAvatar: 'Избери аватар',
    next: 'Напред',
    selectAvatarToStart: 'Избери аватар, за да продължиш',
    playerChooseCharacter: 'Играч {number} - Избери своя герой',
    selectYourClass: '1. Избери своя клас',
    selectYourColor: '2. Избери своя цвят',
    confirmSelection: 'Потвърди',
    taken: 'Зает',
    knight: 'Рицар',
    wizard: 'Магьосник',
    archer: 'Стрелец',
    rogue: 'Разбойник',
    jester: 'Шут',
    red: 'Червен',
    blue: 'Син',
    green: 'Зелен',
    orange: 'Оранжев',
    purple: 'Лилав',
    pink: 'Розов',
    teal: 'Тюркоаз',
    yellow: 'Жълт',

    // Player Card
    coins: 'Монети',
    points: 'Точки',

    // Dice
    clickToRoll: 'Натисни, за да хвърлиш заровете!',
    turnClickToRoll: '{name} - Натисни, за да хвърлиш!',
    rolled: '{name} хвърли {value}!',
    rolling: 'Хвърляне...',

    // Shop
    itemShop: '🏪 Магазин',
    yourCoins: 'Твоите монети:',
    close: 'Затвори',
    singleUse: 'Еднократна употреба',
    uses: '{count} употреби',
    owned: 'Притежавано: {count}',
    buy: 'Купи',
    ownedButton: 'Притежавано',
    tooExpensive: 'Твърде скъпо',
    yourInventory: 'Твоят инвентар',

    // Items
    shield: 'Щит',
    shieldDescription: 'Защита от следващата капан или плъзгане',
    luckyDice: 'Двойни зарове',
    luckyDiceDescription: 'Хвърли два пъти и избери по-добрия резултат',
    pointBooster: 'Усилвател на точки',
    pointBoosterDescription: '1.5x точки на следващите 2 правилни отговора',
    teleporter: 'Телепортер',
    teleporterDescription: 'Премести се на която и да е плочка (без препятствия)',

    // Item Prompts
    useIt: 'Използвай!',
    noThanks: 'Не, благодаря',
    useItemPrompt: 'Използвам ли {name}?',

    // Dice Choice
    rollTwiceAndChoose: 'Двойно хвърляне',
    choose: 'Избери',

    // Teleporter
    teleporter_label: 'Телепортер',
    tapTileToTeleport: 'Натисни на плочката, на която искаш да се телепортираш',
    teleportConfirm: 'Телепортирам ли се?',
    teleportTo: 'Телепортирам ли се до плочка {tile}?',
    cancel: 'Отмяна',
    teleportButton: 'Телепортирам!',

    // Math Modal
    solveMathProblem: 'Реши задачата!',
    points_label: '{points} Точки',
    time: 'Време:',
    pause: '⏸ Пауза',
    resume: '▶ Продължи',
    yourAnswer: 'Твоят отговор',
    submitAnswer: 'Изпрати отговор',
    answer: 'Отговор',
    submit: 'Изпрати',
    correct: '✓ Вярно!',
    incorrect: '✗ Неправилно! Правилния отговор е: {answer}',
    timeUp: 'Времето е изтекло!',
    nextProblem: 'Следваща задача',

    // Message Modal
    correctAnswer: 'Вярно!',
    wrongAnswer: 'Грешно!',
    timesUp: 'Времето изтече!',
    continue: 'Продължи',

    // Scoring Messages
    pointsGained: '+{points} точки!',
    answerWasWithPenalty: 'Отговорът е {answer}. -{points} точки!',
    answerWas: 'Отговорът е {answer}.',
    ranOutOfTimeWithPenalty: '⏰ Времето изтече! Правилният отговор беше {answer}. -{points} точки!',
    ranOutOfTime: '⏰ Времето изтече! Правилният отговор беше {answer}.',

    // Game Over
    gameOver: 'Край на играта',
    finalScores: 'Финални резултати',
    playAgain: 'Играй отново',

    // Messages
    shieldProtected: 'Щитът те защити!',
    landedOnShop: 'Попадна на магазин!',
    landedOnTrap: 'Попадна на капан!',
    landedOnIce: 'Попадна на лед!',
    landedOnObstacle: 'Попадна на препятствие!',
  },
  en: {
    // Problem Sets
    savedProblemSets: 'Saved Problem Sets',

    // Game Setup
    gameSetup: 'Game Setup',
    numberOfPlayers: 'Number of Players:',
    player1: '1 Player',
    player2: '2 Players',
    player3: '3 Players',
    player4: '4 Players',
    enableNegativePoints: 'Enable Negative Points',
    enableTimer: 'Enable Timer',
    seconds: 'seconds',
    enableModalAutoClose: 'Enable Modal Auto-Close',
    displayProblemsInTiles: 'Display Problems in Tiles',
    importMathProblems: '📁 Import Math Problems (Optional)',
    uploadJsonFile: 'Upload a JSON file with custom math problems',
    loaded: '✓ Loaded:',
    problems: 'problems',
    invalidJsonFile: '✗ Invalid JSON file. Please check the format.',
    startGame: 'Start Game',

    // Language Selection
    selectLanguage: 'Select Language',
    bulgarian: 'Български',
    english: 'English',

    // Avatar Selection
    selectAvatar: 'Select Avatar',
    next: 'Next',
    selectAvatarToStart: 'Select an avatar to start',
    playerChooseCharacter: 'Player {number} - Choose Your Character',
    selectYourClass: '1. Select Your Class',
    selectYourColor: '2. Select Your Color',
    confirmSelection: 'Confirm Selection',
    taken: 'Taken',
    knight: 'Knight',
    wizard: 'Wizard',
    archer: 'Archer',
    rogue: 'Rogue',
    jester: 'Jester',
    red: 'Red',
    blue: 'Blue',
    green: 'Green',
    orange: 'Orange',
    purple: 'Purple',
    pink: 'Pink',
    teal: 'Teal',
    yellow: 'Yellow',

    // Player Card
    coins: 'Coins',
    points: 'Points',

    // Dice
    clickToRoll: 'Click to Roll!',
    turnClickToRoll: '{name} - Click to Roll!',
    rolled: '{name} rolled {value}!',
    rolling: 'Rolling...',

    // Shop
    itemShop: '🏪 Item Shop',
    yourCoins: 'Your Coins:',
    close: 'Close',
    singleUse: 'Single Use',
    uses: '{count} Uses',
    owned: 'Owned: {count}',
    buy: 'Buy',
    ownedButton: 'Owned',
    tooExpensive: 'Too Expensive',
    yourInventory: 'Your Inventory',

    // Items
    shield: 'Shield',
    shieldDescription: 'Protects from the next trap or slip',
    luckyDice: 'Lucky Dice',
    luckyDiceDescription: 'Roll twice and choose the better result',
    pointBooster: 'Point Booster',
    pointBoosterDescription: '1.5x points on next 2 correct answers',
    teleporter: 'Teleporter',
    teleporterDescription: 'Move to any tile (no obstacles)',

    // Item Prompts
    useIt: 'Use It!',
    noThanks: 'No Thanks',
    useItemPrompt: 'Use {name}?',

    // Dice Choice
    rollTwiceAndChoose: 'Roll twice - choose the better result',
    choose: 'Choose',

    // Teleporter
    teleporter_label: 'Teleporter',
    tapTileToTeleport: 'Tap on the tile you want to teleport to',
    teleportConfirm: 'Teleport?',
    teleportTo: 'Teleport to tile {tile}?',
    cancel: 'Cancel',
    teleportButton: 'Teleport!',

    // Math Modal
    solveMathProblem: 'Solve the Math Problem!',
    points_label: '{points} Points',
    time: 'Time:',
    pause: '⏸ Pause',
    resume: '▶ Resume',
    yourAnswer: 'Your answer',
    submitAnswer: 'Submit Answer',
    answer: 'Answer',
    submit: 'Submit',
    correct: '✓ Correct!',
    incorrect: '✗ Incorrect! The correct answer is: {answer}',
    timeUp: 'Time\'s up!',
    nextProblem: 'Next Problem',

    // Message Modal
    correctAnswer: 'Correct!',
    wrongAnswer: 'Wrong!',
    timesUp: 'Time\'s Up!',
    continue: 'Continue',

    // Scoring Messages
    pointsGained: '+{points} points!',
    answerWasWithPenalty: 'The answer was {answer}. -{points} points!',
    answerWas: 'The answer was {answer}.',
    ranOutOfTimeWithPenalty: '⏰ You ran out of time! The correct answer was {answer}. -{points} points!',
    ranOutOfTime: '⏰ You ran out of time! The correct answer was {answer}.',

    // Game Over
    gameOver: 'Game Over',
    finalScores: 'Final Scores',
    playAgain: 'Play Again',

    // Messages
    shieldProtected: 'You were protected by your shield!',
    landedOnShop: 'Landed on Shop!',
    landedOnTrap: 'Landed on Trap!',
    landedOnIce: 'Landed on Ice!',
    landedOnObstacle: 'Landed on Obstacle!',
  },
};

export function t(language: Language, key: keyof (typeof translations.en), variables?: Record<string, string | number>): string {
  let text = translations[language][key] || translations.en[key] || key;

  if (variables) {
    Object.entries(variables).forEach(([varKey, value]) => {
      text = text.replace(`{${varKey}}`, String(value));
    });
  }

  return text;
}
