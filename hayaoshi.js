/* hayaoshi.js: はやおし うんち ゲームロジック */

function initHayaoshi() {
    const startScreen = document.getElementById("start-screen");
    const hayaoshiButton = document.getElementById("hayaoshi-button");
    const hayaoshiContainer = document.getElementById("hayaoshi-container");
    const backButton = document.getElementById("back-to-title-from-hayaoshi");

    // Game Elements
    const gridContainer = document.getElementById("hayaoshi-grid");
    const scoreDisplay = document.getElementById("hayaoshi-score");
    const timerDisplay = document.getElementById("hayaoshi-timer");
    const missDisplay = document.getElementById("hayaoshi-miss");
    const levelDisplay = document.getElementById("hayaoshi-level");

    // Overlays & Buttons
    const levelOverlay = document.getElementById("hayaoshi-level-overlay");
    const levelTitle = document.getElementById("hayaoshi-level-title");
    const countdownOverlay = document.getElementById("hayaoshi-countdown-overlay");
    const countdownText = document.getElementById("hayaoshi-countdown-text");
    
    const resultOverlay = document.getElementById("hayaoshi-result-overlay");
    const finalScoreSpan = document.getElementById("hayaoshi-final-score");
    const resultTitle = document.getElementById("hayaoshi-result-title");
    
    // Result Buttons
    const nextLevelBtn = document.getElementById("hayaoshi-next-level");
    const retryBtn = document.getElementById("hayaoshi-retry");
    const restartBtn = document.getElementById("hayaoshi-restart");
    const titleBtn = document.getElementById("hayaoshi-title-button");

    // Audio
    const bgm = document.getElementById("bgm-sound");

    // ゲーム設定
    const LEVEL_SETTINGS = {
        1: { time: 1500 },
        2: { time: 1000 },
        3: { time: 800 },
        4: { time: 500 }
    };
    const MAX_LEVEL = 4;
    const TIME_LIMIT = 15; // 制限時間（秒）
    const SCORE_THRESHOLD = 20; // 各レベルで必要なスコア
    const MAX_MISS = 5; // おてつき許容回数

    let gameState = {
        totalScore: 0,        // 確定した過去レベルの合計スコア
        currentLevelScore: 0, // 現在プレイ中のレベルのスコア
        miss: 0,
        level: 1,
        timeLeft: TIME_LIMIT,
        lastSec: TIME_LIMIT,
        isPlaying: false,
        activePoopIndex: -1,
        timerInterval: null
    };

    // --- イベントリスナー設定 ---

    if (hayaoshiButton) {
        hayaoshiButton.addEventListener("click", () => {
            startScreen.style.display = "none";
            hayaoshiContainer.style.display = "flex";
            startNewGame();
        });
    }

    if (backButton) {
        backButton.addEventListener("click", backToTitle);
    }

    if (nextLevelBtn) {
        nextLevelBtn.addEventListener("click", () => {
            resultOverlay.style.display = "none";
            // クリアしたので現在のスコアを合計に確定させて次へ
            gameState.totalScore += gameState.currentLevelScore;
            startLevel(gameState.level + 1);
        });
    }

    if (retryBtn) {
        retryBtn.addEventListener("click", () => {
            resultOverlay.style.display = "none";
            retryLevel();
        });
    }

    if (restartBtn) {
        restartBtn.addEventListener("click", () => {
            resultOverlay.style.display = "none";
            startNewGame();
        });
    }

    if (titleBtn) {
        titleBtn.addEventListener("click", () => {
            resultOverlay.style.display = "none";
            backToTitle();
        });
    }

    // --- ゲーム進行管理 ---

    function backToTitle() {
        stopGame();
        hayaoshiContainer.style.display = "none";
        startScreen.style.display = "block";
    }

    function startNewGame() {
        gameState.totalScore = 0;
        startLevel(1);
    }

    function startLevel(level) {
        if (level > MAX_LEVEL) level = MAX_LEVEL;
        
        gameState.level = level;
        gameState.currentLevelScore = 0; // 新しいレベルなので0から
        gameState.miss = 0; 
        gameState.timeLeft = TIME_LIMIT;
        gameState.lastSec = TIME_LIMIT;
        gameState.isPlaying = false;
        gameState.activePoopIndex = -1;

        updateUI();

        if (nextLevelBtn) nextLevelBtn.style.display = "none";
        if (retryBtn) retryBtn.style.display = "none";

        renderGrid();
        showLevelStart();
    }

    function retryLevel() {
        // リトライ時は totalScore はそのままで、現在のレベルをやり直す
        startLevel(gameState.level);
    }

    function updateUI() {
        if (scoreDisplay) scoreDisplay.textContent = gameState.currentLevelScore;
        if (missDisplay) missDisplay.textContent = "0 / " + MAX_MISS;
        if (levelDisplay) levelDisplay.textContent = gameState.level;
        if (timerDisplay) timerDisplay.textContent = TIME_LIMIT;
    }

    function renderGrid() {
        if (!gridContainer) return;
        gridContainer.innerHTML = "";
        
        if (typeof poops === 'undefined' || !Array.isArray(poops)) {
            gridContainer.textContent = "データエラー";
            return;
        }

        poops.forEach((poop, index) => {
            const item = document.createElement("div");
            item.className = "hayaoshi-item";
            
            const icon = document.createElement("div");
            icon.className = "hayaoshi-icon";
            setPoopStyle(icon, poop);

            item.appendChild(icon);

            item.addEventListener("mousedown", (e) => handlePoopClick(index, item));
            item.addEventListener("touchstart", (e) => {
                e.preventDefault();
                handlePoopClick(index, item);
            });

            gridContainer.appendChild(item);
        });
    }

    function showLevelStart() {
        if (levelOverlay && levelTitle) {
            levelOverlay.style.display = "flex";
            levelTitle.textContent = "レベル " + gameState.level;
            
            setTimeout(() => {
                levelOverlay.style.display = "none";
                startCountdown();
            }, 1500);
        } else {
            startCountdown();
        }
    }

    function startCountdown() {
        if (countdownOverlay) countdownOverlay.style.display = "flex";
        let count = 3;
        if (countdownText) countdownText.textContent = count;
        playBeepSound();

        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                if (countdownText) countdownText.textContent = count;
                playBeepSound();
            } else if (count === 0) {
                if (countdownText) countdownText.textContent = "スタート！";
                playSound("reveal-sound");
            } else {
                clearInterval(interval);
                if (countdownOverlay) countdownOverlay.style.display = "none";
                startGame();
            }
        }, 1000);
    }

    function startGame() {
        gameState.isPlaying = true;
        if (bgm) {
            bgm.currentTime = 0;
            bgm.volume = 0.4;
            bgm.play().catch(e => console.log(e));
        }

        activateRandomPoop();

        const startTime = Date.now();
        gameState.timerInterval = setInterval(() => {
            if (!gameState.isPlaying) return;

            const elapsed = (Date.now() - startTime) / 1000;
            const remaining = Math.max(0, TIME_LIMIT - elapsed);
            
            const currentSec = Math.ceil(remaining);

            gameState.timeLeft = remaining;
            
            if (timerDisplay) timerDisplay.textContent = currentSec;

            if (currentSec < gameState.lastSec && currentSec <= 3 && currentSec > 0) {
                playBeepSound();
            }
            gameState.lastSec = currentSec;

            if (remaining <= 0) {
                checkWinCondition();
            }
        }, 10);
    }

    let timeoutId = null;

    function activateRandomPoop() {
        if (!gameState.isPlaying) return;

        const items = document.querySelectorAll(".hayaoshi-item");
        items.forEach(item => item.classList.remove("active"));

        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }

        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * poops.length);
        } while (nextIndex === gameState.activePoopIndex && poops.length > 1);

        gameState.activePoopIndex = nextIndex;
        if (items[nextIndex]) {
            items[nextIndex].classList.add("active");

            const settings = LEVEL_SETTINGS[gameState.level];
            const duration = settings ? settings.time : 500;

            timeoutId = setTimeout(() => {
                if (gameState.isPlaying && gameState.activePoopIndex === nextIndex) {
                    activateRandomPoop();
                }
            }, duration);
        }
    }

    function handlePoopClick(index, element) {
        if (!gameState.isPlaying) return;

        if (index === gameState.activePoopIndex) {
            gameState.currentLevelScore++;
            if (scoreDisplay) scoreDisplay.textContent = gameState.currentLevelScore;
            playSound("catch-sound"); 
            activateRandomPoop();
        } else {
            handleMiss(element);
        }
    }

    function handleMiss(element) {
        gameState.miss++;
        if (missDisplay) missDisplay.textContent = gameState.miss + " / " + MAX_MISS;
        playSound("incorrect-sound");

        element.classList.add("wrong");
        setTimeout(() => element.classList.remove("wrong"), 300);

        if (gameState.miss >= MAX_MISS) {
            gameOver("miss_limit");
        }
    }

    function stopGame() {
        gameState.isPlaying = false;
        clearInterval(gameState.timerInterval);
        if (timeoutId) { 
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        if (bgm) bgm.pause();
    }

    function checkWinCondition() {
        if (gameState.currentLevelScore >= SCORE_THRESHOLD) {
            levelClear();
        } else {
            gameOver("score_low");
        }
    }

    function levelClear() {
        stopGame();
        
        if (resultOverlay) {
            resultOverlay.style.display = "flex";
            
            if (resultTitle) {
                resultTitle.textContent = "クリア！";
                resultTitle.style.color = "#FFD700"; 
            }
            
            // クリア時は「そのレベルのスコア」を表示
            // まだ合計には加算していない（次のレベルへ進むボタンを押した時に加算）
            if (finalScoreSpan) {
                finalScoreSpan.textContent = "スコア: " + gameState.currentLevelScore;
            }

            if (gameState.level < MAX_LEVEL) {
                if (nextLevelBtn) {
                    nextLevelBtn.style.display = "block";
                    nextLevelBtn.textContent = "レベル " + (gameState.level + 1) + " へ";
                }
            } else {
                // 全クリ時はその場で合算して表示
                gameState.totalScore += gameState.currentLevelScore;
                if (resultTitle) resultTitle.textContent = "ぜんくりあ！";
                if (finalScoreSpan) {
                    finalScoreSpan.textContent = "ごうけい: " + gameState.totalScore;
                }
                // 次へボタンは出さない
                if (nextLevelBtn) nextLevelBtn.style.display = "none";
            }
            
            if (restartBtn) restartBtn.style.display = "block";
            if (titleBtn) titleBtn.style.display = "block";
        }
        playSound("timeup-sound"); 
    }

    function gameOver(reason) {
        stopGame();

        // ゲームオーバー時は、今までの合計 + 今回のレベルのスコアを表示
        const currentTotal = gameState.totalScore + gameState.currentLevelScore;

        if (resultOverlay) {
            resultOverlay.style.display = "flex";
            
            if (finalScoreSpan) {
                finalScoreSpan.textContent = "ごうけい: " + currentTotal;
            }

            if (resultTitle) {
                if (reason === "score_low") {
                    resultTitle.textContent = "スコア不足...";
                } else {
                    resultTitle.textContent = "ゲームオーバー";
                }
                resultTitle.style.color = "#f44336";
            }

            if (retryBtn) retryBtn.style.display = "block";
            if (restartBtn) restartBtn.style.display = "block";
            if (titleBtn) titleBtn.style.display = "block";
        }
        playSound("incorrect-sound"); 
    }
}