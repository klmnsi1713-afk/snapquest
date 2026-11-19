// =============================================
// SNAPQUEST — PHOTOGRAPHY ADVENTURE GAME SYSTEM
// =============================================

// Progress is saved in this browser using localStorage.
// Players can replay completed games, but XP rewards are earned only once.

const STORAGE_KEY = "snapQuestPlayerProgress";

const defaultProgress = {
    xp: 0,
    quizCompleted: false,
    huntCompleted: false,
    puzzleCompleted: false,
    quizXP: 0,
    huntXP: 0,
    puzzleXP: 0
};

let playerProgress = loadProgress();

function loadProgress() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return saved ? { ...defaultProgress, ...saved } : { ...defaultProgress };
    } catch (error) {
        return { ...defaultProgress };
    }
}

function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(playerProgress));
    updateDashboard();
}

function getCompletedCount() {
    return [
        playerProgress.quizCompleted,
        playerProgress.huntCompleted,
        playerProgress.puzzleCompleted
    ].filter(Boolean).length;
}

function updateDashboard() {
    const completed = getCompletedCount();
    const percent = Math.round((completed / 3) * 100);

    const totalXP = document.getElementById("totalXP");
    const questsCleared = document.getElementById("questsCleared");
    const overallProgressText = document.getElementById("overallProgressText");
    const overallProgressBar = document.getElementById("overallProgressBar");
    const playerRank = document.getElementById("playerRank");

    if (totalXP) totalXP.textContent = playerProgress.xp;
    if (questsCleared) questsCleared.textContent = completed + " / 3";
    if (overallProgressText) overallProgressText.textContent = percent + "%";
    if (overallProgressBar) overallProgressBar.style.width = percent + "%";

    let rank = "The Observer";
    if (playerProgress.quizCompleted) rank = "The Detail Detective";
    if (playerProgress.huntCompleted) rank = "The Frame Master";
    if (playerProgress.puzzleCompleted) rank = "SnapQuest Champion";
    if (playerRank) playerRank.textContent = rank;

    updateQuestNode(1, true, playerProgress.quizCompleted);
    updateQuestNode(2, playerProgress.quizCompleted, playerProgress.huntCompleted);
    updateQuestNode(3, playerProgress.huntCompleted, playerProgress.puzzleCompleted);

    setText("quizEarned", playerProgress.quizXP);
    setText("huntEarned", playerProgress.huntXP);
    setText("puzzleEarned", playerProgress.puzzleXP);

    setWidth("quizProgressBar", (playerProgress.quizXP / 50) * 100);
    setWidth("huntProgressBar", (playerProgress.huntXP / 60) * 100);
    setWidth("puzzleProgressBar", playerProgress.puzzleCompleted ? 100 : 0);

    setStatus("quizLevelStatus", playerProgress.quizCompleted ? "✓ QUEST CLEARED" : "● READY TO PLAY");
    setStatus("huntLevelStatus", playerProgress.huntCompleted ? "✓ QUEST CLEARED" :
        (playerProgress.quizCompleted ? "● LEVEL UNLOCKED" : "🔒 COMPLETE LEVEL 01 FIRST"));
    setStatus("puzzleLevelStatus", playerProgress.puzzleCompleted ? "✓ QUEST CLEARED" :
        (playerProgress.huntCompleted ? "● LEVEL UNLOCKED" : "🔒 COMPLETE LEVEL 02 FIRST"));

    const huntCard = document.getElementById("huntCard");
    const puzzleCard = document.getElementById("puzzleCard");
    if (huntCard) huntCard.classList.toggle("quest-locked", !playerProgress.quizCompleted);
    if (puzzleCard) puzzleCard.classList.toggle("quest-locked", !playerProgress.huntCompleted);

    const results = document.getElementById("finalResults");
    if (results) results.hidden = !playerProgress.puzzleCompleted;
    setText("finalXP", playerProgress.xp);

    const resetButton = document.getElementById("resetProgress");
    if (resetButton) resetButton.disabled = completed === 0 && playerProgress.xp === 0;
}

function updateQuestNode(number, unlocked, completed) {
    const node = document.getElementById("questNode" + number);
    const status = document.getElementById("questStatus" + number);
    if (!node || !status) return;

    node.classList.toggle("locked", !unlocked);
    node.classList.toggle("completed", completed);
    node.classList.toggle("active", unlocked && !completed);
    node.setAttribute("aria-disabled", String(!unlocked));
    status.textContent = completed ? "CLEARED" : (unlocked ? "READY" : "LOCKED");
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function setWidth(id, percentage) {
    const element = document.getElementById(id);
    if (element) element.style.width = Math.max(0, Math.min(100, percentage)) + "%";
}

function setStatus(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function awardXP(game, amount) {
    const completedKey = game + "Completed";
    const xpKey = game + "XP";

    // Never award the same level's reward twice.
    if (playerProgress[completedKey]) return false;

    playerProgress[completedKey] = true;
    playerProgress[xpKey] = amount;
    playerProgress.xp += amount;
    saveProgress();
    return true;
}


// =============================================
// 1. MOBILE NAVIGATION
// =============================================

const menuToggle = document.getElementById("menuToggle");
const navigation = document.getElementById("navigation");

if (menuToggle && navigation) {
    menuToggle.addEventListener("click", function () {
        const isOpen = navigation.classList.toggle("show");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navigation.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            navigation.classList.remove("show");
            menuToggle.setAttribute("aria-expanded", "false");
        });
    });
}


// =============================================
// 2. PHOTOGRAPHY QUIZ — LEVEL 01
// =============================================

const questions = [
    {
        question: "Which photography element refers to the outline or path that guides the viewer's eyes?",
        answers: ["Texture", "Line", "Shape", "Color"],
        correct: "Line",
        explanation: "Lines guide the viewer's eyes through a photograph."
    },
    {
        question: "What element refers to the surface quality of an object?",
        answers: ["Pattern", "Perspective", "Texture", "Space"],
        correct: "Texture",
        explanation: "Texture describes how a surface looks or feels."
    },
    {
        question: "Which photography element is created by repeating visual objects or designs?",
        answers: ["Pattern", "Line", "Form", "Color"],
        correct: "Pattern",
        explanation: "Patterns are created through repeated visual elements."
    },
    {
        question: "What refers to the viewpoint or angle from which a photograph is taken?",
        answers: ["Texture", "Perspective", "Shape", "Lighting"],
        correct: "Perspective",
        explanation: "Perspective changes how subjects appear depending on the camera viewpoint."
    },
    {
        question: "Which element refers to the area enclosed by lines or boundaries?",
        answers: ["Shape", "Pattern", "Texture", "Focus"],
        correct: "Shape",
        explanation: "A shape is a two-dimensional enclosed area."
    }
];

let currentQuestion = 0;
let quizScore = 0;
let quizAnswered = false;

const quizProgress = document.getElementById("quizProgress");
const questionText = document.getElementById("question");
const answersContainer = document.getElementById("answers");
const quizFeedback = document.getElementById("quizFeedback");
const nextQuestion = document.getElementById("nextQuestion");
const quizScoreDisplay = document.getElementById("quizScore");
const restartQuiz = document.getElementById("restartQuiz");

function showQuestion() {
    if (!questionText || !answersContainer) return;

    quizAnswered = false;
    const item = questions[currentQuestion];

    quizProgress.textContent = "QUESTION " + (currentQuestion + 1) + " / " + questions.length;
    questionText.textContent = item.question;
    answersContainer.innerHTML = "";
    quizFeedback.textContent = "";
    quizFeedback.className = "";
    quizScoreDisplay.textContent = "";
    nextQuestion.hidden = true;
    restartQuiz.hidden = true;

    item.answers.forEach(function (answer, index) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "answer-button";
        button.innerHTML = '<span class="answer-letter">' + String.fromCharCode(65 + index) +
            '</span><span>' + answer + '</span>';
        button.addEventListener("click", function () {
            checkAnswer(button, answer);
        });
        answersContainer.appendChild(button);
    });
}

function checkAnswer(selectedButton, answer) {
    if (quizAnswered) return;
    quizAnswered = true;

    const item = questions[currentQuestion];
    const correct = answer === item.correct;
    const buttons = answersContainer.querySelectorAll(".answer-button");

    buttons.forEach(function (button) {
        button.disabled = true;
        if (button.textContent.trim().endsWith(item.correct)) {
            button.classList.add("correct");
        }
    });

    if (correct) {
        quizScore += 10;
        selectedButton.classList.add("correct");
        quizFeedback.textContent = "✦ Correct! +10 XP — " + item.explanation;
        quizFeedback.className = "feedback-correct";
    } else {
        selectedButton.classList.add("wrong");
        quizFeedback.textContent = "Not quite. The answer is " + item.correct + ". " + item.explanation;
        quizFeedback.className = "feedback-wrong";
    }

    setText("quizEarned", playerProgress.quizCompleted ? playerProgress.quizXP : quizScore);
    setWidth("quizProgressBar", (quizScore / 50) * 100);

    if (currentQuestion < questions.length - 1) {
        nextQuestion.hidden = false;
    } else {
        finishQuiz();
    }
}

function finishQuiz() {
    const firstClear = awardXP("quiz", 50);

    quizScoreDisplay.textContent = "YOUR SCORE: " + quizScore + " / 50 XP";
    quizFeedback.textContent = firstClear
        ? "Quiz complete! You earned 50 XP. Level 02 is now unlocked!"
        : "Quiz complete! You have already collected the 50 XP reward.";
    quizFeedback.className = "feedback-correct";

    nextQuestion.hidden = true;
    restartQuiz.hidden = false;
    setText("quizEarned", playerProgress.quizXP);
    setWidth("quizProgressBar", 100);
}

if (nextQuestion) {
    nextQuestion.addEventListener("click", function () {
        currentQuestion++;
        if (currentQuestion < questions.length) {
            showQuestion();
        }
    });
}

if (restartQuiz) {
    restartQuiz.addEventListener("click", function () {
        currentQuestion = 0;
        quizScore = 0;
        showQuestion();
    });
}

if (questionText && answersContainer) {
    showQuestion();
}


// =============================================
// 3. EVIDENCE HUNT — LEVEL 02
// =============================================

const huntGrid = document.getElementById("huntGrid");
const huntClue = document.getElementById("huntClue");
const huntFeedback = document.getElementById("huntFeedback");
const huntAttempts = document.getElementById("huntAttempts");
const restartHunt = document.getElementById("restartHunt");
const galleryImages = Array.from(
    document.querySelectorAll("#gameImages img")
).map(function (image) {
    return image.src;
});

const huntRounds = [
    {
        clue: "Find the TOP-RIGHT section of the photograph.",
        zone: "3",
        imageIndex: 0
    },
    {
        clue: "Find the CENTER section of the photograph.",
        zone: "5",
        imageIndex: 1
    },
    {
        clue: "Find the BOTTOM-LEFT section of the photograph.",
        zone: "7",
        imageIndex: 2
    }
];

let huntRoundIndex = 0;
let attempts = 0;
let huntRoundSolved = false;
let huntSessionXP = 0;

function setHuntImage() {
    if (!huntGrid || galleryImages.length === 0) return;

    const round = huntRounds[huntRoundIndex];
    const image = galleryImages[
        round.imageIndex % galleryImages.length
    ];

    huntGrid.style.backgroundImage = "url('" + image + "')";
    huntGrid.style.backgroundSize = "cover";
    huntGrid.style.backgroundPosition = "center";
}

function startHuntRound() {
    if (!huntGrid) return;

    huntRoundSolved = false;
    const round = huntRounds[huntRoundIndex];

    setHuntImage();

    huntClue.textContent = round.clue;
    setText("huntRound", "ROUND " + (huntRoundIndex + 1) + " / " + huntRounds.length);
    huntFeedback.textContent = "Scan the image and select one of the nine areas.";
    huntFeedback.className = "";

    huntGrid.querySelectorAll("[data-zone]").forEach(function (button) {
        button.disabled = false;
        button.classList.remove("correct", "wrong");
    });
}

function handleHuntChoice(button) {
    if (huntRoundSolved || !playerProgress.quizCompleted) return;

    attempts++;
    setText("huntAttempts", attempts);

    if (button.dataset.zone === huntRounds[huntRoundIndex].zone) {
        huntRoundSolved = true;
        huntSessionXP += 20;

        huntFeedback.textContent = "Evidence found! +20 XP. Great eye, detective!";
        huntFeedback.className = "feedback-correct";
        button.classList.add("correct");

        huntGrid.querySelectorAll("[data-zone]").forEach(function (item) {
            item.disabled = true;
        });

        setText("huntEarned", playerProgress.huntCompleted ? playerProgress.huntXP : huntSessionXP);
        setWidth("huntProgressBar", (huntSessionXP / 60) * 100);

        if (huntRoundIndex < huntRounds.length - 1) {
            const continueButton = document.createElement("button");
            continueButton.type = "button";
            continueButton.id = "nextHuntRound";
            continueButton.className = "main-button hunt-next-button";
            continueButton.textContent = "Next Evidence →";

            huntFeedback.insertAdjacentElement("afterend", continueButton);

            continueButton.addEventListener("click", function () {
                continueButton.remove();
                huntRoundIndex++;
                startHuntRound();
            });
        } else {
            finishHunt();
        }
    } else {
        button.disabled = true;
        button.classList.add("wrong");
        huntFeedback.textContent = "No clue here. Try another section!";
        huntFeedback.className = "feedback-wrong";
    }
}

function finishHunt() {
    const firstClear = awardXP("hunt", 60);

    huntClue.textContent = "All evidence collected. You are a Detail Detective!";
    huntFeedback.textContent = firstClear
        ? "Hunt complete! You earned 60 XP. Level 03 is now unlocked!"
        : "Hunt complete! Your first-clear reward has already been collected.";

    huntFeedback.className = "feedback-correct";
    setText("huntRound", "ALL 3 ROUNDS CLEARED");
    setText("huntEarned", playerProgress.huntXP);
    setWidth("huntProgressBar", 100);
}

if (huntGrid) {
    setHuntImage();

    huntGrid.querySelectorAll("[data-zone]").forEach(function (button) {
        button.addEventListener("click", function () {
            handleHuntChoice(button);
        });
    });
}

if (restartHunt) {
    restartHunt.addEventListener("click", function () {
        if (!playerProgress.quizCompleted) {
            huntFeedback.textContent = "Complete Level 01 first to unlock this hunt.";
            return;
        }

        const oldNext = document.getElementById("nextHuntRound");
        if (oldNext) oldNext.remove();

        huntRoundIndex = 0;
        attempts = 0;
        huntSessionXP = 0;
        setText("huntAttempts", "0");

        if (playerProgress.huntCompleted) {
            huntClue.textContent = "You have already cleared this hunt. Replay for practice!";
            huntFeedback.textContent = "Your 60 XP reward is safely saved.";
            return;
        }

        startHuntRound();
    });
}

if (huntGrid) {
    if (playerProgress.huntCompleted) {
        huntFeedback.textContent = "Practice mode: your 60 XP reward has already been collected.";
        startHuntRound();
    } else if (playerProgress.quizCompleted) {
        startHuntRound();
    } else {
        huntClue.textContent = "This challenge is locked. Complete the Photography Quiz first.";
        huntGrid.querySelectorAll("button").forEach(function (button) {
            button.disabled = true;
        });
    }
}


// =============================================
// 4. PHOTO PUZZLE — LEVEL 03
// =============================================

const puzzleBoard = document.getElementById("puzzleBoard");
const puzzleFeedback = document.getElementById("puzzleFeedback");
const shufflePuzzle = document.getElementById("shufflePuzzle");
const puzzleMovesDisplay = document.getElementById("puzzleMoves");

let puzzleTiles = [];
let firstSelected = null;
let puzzleMoves = 0;
let puzzleSolvedThisSession = false;
let puzzleImageURL = "";

function createPuzzle() {
    if (!puzzleBoard || galleryImages.length === 0) return;

    // Use only the first photo for the puzzle.
    puzzleImageURL = galleryImages[0];

    puzzleTiles = [0, 1, 2, 3, 4, 5, 6, 7, 8];

    shuffleTiles();
    displayPuzzle();
}

function shuffleTiles() {
    for (let i = puzzleTiles.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));

        [puzzleTiles[i], puzzleTiles[randomIndex]] =
            [puzzleTiles[randomIndex], puzzleTiles[i]];
    }

    if (isPuzzleComplete()) {
        [puzzleTiles[0], puzzleTiles[1]] =
            [puzzleTiles[1], puzzleTiles[0]];
    }
}

function displayPuzzle() {
    if (!puzzleBoard) return;

    puzzleBoard.innerHTML = "";

    puzzleTiles.forEach(function (tile, position) {
        const piece = document.createElement("button");
        piece.type = "button";
        piece.className = "puzzle-piece";
        piece.setAttribute("aria-label", "Puzzle tile " + (tile + 1));

        const row = Math.floor(tile / 3);
        const column = tile % 3;

        piece.style.backgroundImage = "url('" + puzzleImageURL + "')";
        piece.style.backgroundSize = "300% 300%";
        piece.style.backgroundPosition = (column * 50) + "% " + (row * 50) + "%";

        if (firstSelected === position) {
            piece.classList.add("selected");
        }

        piece.addEventListener("click", function () {
            selectPuzzlePiece(position);
        });

        puzzleBoard.appendChild(piece);
    });
}

function selectPuzzlePiece(position) {
    if (!playerProgress.huntCompleted) return;

    if (firstSelected === null) {
        firstSelected = position;
        displayPuzzle();
        puzzleFeedback.textContent = "Tile selected. Now choose another tile to swap.";
        return;
    }

    if (firstSelected === position) {
        firstSelected = null;
        displayPuzzle();
        puzzleFeedback.textContent = "Selection cleared. Choose a tile.";
        return;
    }

    [puzzleTiles[firstSelected], puzzleTiles[position]] =
        [puzzleTiles[position], puzzleTiles[firstSelected]];

    firstSelected = null;
    puzzleMoves++;

    setText("puzzleMoves", "MOVES: " + puzzleMoves);
    displayPuzzle();

    console.log("Current puzzle arrangement:", puzzleTiles);
    console.log("Puzzle completed:", isPuzzleComplete());
    
    if (isPuzzleComplete()) {
    finishPuzzle();
} else {
    puzzleFeedback.textContent = "Nice move! Keep putting the photograph together.";
}
}

function isPuzzleComplete() {
    return puzzleTiles.every(function (tile, index) {
        return tile === index;
    });
}

function finishPuzzle() {
    puzzleSolvedThisSession = true;
    const firstClear = awardXP("puzzle", 30);

    puzzleFeedback.textContent = firstClear
        ? "PERFECT FRAME! You completed the puzzle and earned 30 XP. SnapQuest Champion!"
        : "PERFECT FRAME! You solved it again. Your 30 XP reward was already collected.";

    puzzleFeedback.className = "feedback-correct";
    setText("puzzleEarned", playerProgress.puzzleXP);
    setWidth("puzzleProgressBar", 100);
    setText("finalXP", playerProgress.xp);
}

if (puzzleBoard) {
    if (playerProgress.huntCompleted && !playerProgress.puzzleCompleted) {
        createPuzzle();
    } else if (playerProgress.puzzleCompleted) {
        createPuzzle();
        puzzleFeedback.textContent = "You have already mastered this frame! Shuffle to practice again.";
    } else {
        puzzleFeedback.textContent = "This level is locked. Complete the Evidence Hunt first.";
    }
}

if (shufflePuzzle) {
    shufflePuzzle.addEventListener("click", function () {
        if (!playerProgress.huntCompleted) {
            puzzleFeedback.textContent = "Complete Level 02 first to unlock the Photo Puzzle.";
            return;
        }

        if (playerProgress.puzzleCompleted) {
            puzzleFeedback.textContent = "You have already earned the reward. Replay for practice!";
        }

        firstSelected = null;
        puzzleMoves = 0;
        puzzleSolvedThisSession = false;

        setText("puzzleMoves", "MOVES: 0");
        createPuzzle();

        puzzleFeedback.textContent = "New puzzle shuffled! Swap two tiles at a time.";
        puzzleFeedback.className = "";
    });
}


// =============================================
// 5. RESET PLAYER PROGRESS
// =============================================

const resetProgress = document.getElementById("resetProgress");

if (resetProgress) {
    resetProgress.addEventListener("click", function () {
        const confirmed = window.confirm(
            "Reset all SnapQuest progress and XP? This cannot be undone."
        );

        if (!confirmed) return;

        localStorage.removeItem(STORAGE_KEY);
        playerProgress = { ...defaultProgress };

        currentQuestion = 0;
        quizScore = 0;
        quizAnswered = false;
        huntRoundIndex = 0;
        attempts = 0;
        huntSessionXP = 0;
        firstSelected = null;
        puzzleMoves = 0;

        if (questionText && answersContainer) {
            showQuestion();
        }

        if (huntGrid) {
            const nextButton = document.getElementById("nextHuntRound");
            if (nextButton) nextButton.remove();

            setText("huntAttempts", "0");

            huntGrid.querySelectorAll("button").forEach(function (button) {
                button.disabled = false;
                button.classList.remove("correct", "wrong");
            });

            startHuntRound();
        }

        if (puzzleBoard) {
            createPuzzle();
        }

        setText("puzzleMoves", "MOVES: 0");
        setText("puzzleFeedback", "Click two tiles to swap their positions.");

        updateDashboard();
    });
}
