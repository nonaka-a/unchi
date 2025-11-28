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
    // time: 表示時間(ms)
    // 15秒生き残ればクリア。
    const LEVEL_SETTINGS = {
        1: { time: 1500 },
        2: { time: 1000 },
        3: { time: 800 },
        4: { time: 500 }
    };
    const MAX_LEVEL = 4;
    const TIME_LIMIT = 15; // 制限時間（秒）

    let gameState = {
        score: 0,           // 現在の正解数（累計）
        levelStartScore: 0, // レベル開始時点のスコア（リトライ用）
        miss: 0,            // おてつき数（レベルごとにリセット）
        level: 1,           // 現在のレベル
        timeLeft: TIME_LIMIT,
        lastSec: TIME_LIMIT, // カウントダウンSE用
        isPlaying: false,
        activePoopIndex: -1,
        timerInterval: null
    };

    // --- イベントリスナー設定 ---

    if (hayaoshiButton) {
        hayaoshiButton.addEventListener("click", () => {
            startScreen.style.display = "none";
            hayaoshiContainer.style.display = "flex";
            startNewGame(); // 最初からスタート
        });
    }

    if (backButton) {
        backButton.addEventListener("click", backToTitle);
    }

    // 次のレベルへ（スコア引継ぎ、お手つきリセット）
    if (nextLevelBtn) {
        nextLevelBtn.addEventListener("click", () => {
            resultOverlay.style.display = "none";
            startLevel(gameState.level + 1);
        });
    }

    // もういちど（そのレベルの最初からリトライ）
    if (retryBtn) {
        retryBtn.addEventListener("click", () => {
            resultOverlay.style.display = "none";
            retryLevel();
        });
    }

    // さいしょから（レベル1へ、スコアリセット）
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

    // ゲーム全体を初期化して開始
    function startNewGame() {
        gameState.score = 0;
        startLevel(1);
    }

    // 特定のレベルを開始
    function startLevel(level) {
        if (level > MAX_LEVEL) level = MAX_LEVEL;
        
        // 状態設定
        gameState.level = level;
        gameState.miss = 0; // ★お手つき回数はレベルが上がるごとに0にリセット
        gameState.levelStartScore = gameState.score; // リトライ用に現在のスコアを保存
        gameState.timeLeft = TIME_LIMIT;
        gameState.lastSec = TIME_LIMIT;
        gameState.isPlaying = false;
        gameState.activePoopIndex = -1;

        updateUI();

        // ボタン表示リセット
        if (nextLevelBtn) nextLevelBtn.style.display = "none";
        if (retryBtn) retryBtn.style.display = "none";

        // Grid描画
        renderGrid();

        // レベル表示 -> カウントダウン -> ゲーム開始
        showLevelStart();
    }

    // 同じレベルをリトライ（スコアをレベル開始時に戻す）
    function retryLevel() {
        gameState.score = gameState.levelStartScore;
        startLevel(gameState.level);
    }

    function updateUI() {
        if (scoreDisplay) scoreDisplay.textContent = gameState.score;
        if (missDisplay) missDisplay.textContent = "0"; // 開始時は必ず0
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

            // イベント
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
            
            // 整数秒（切り上げ）
            const currentSec = Math.ceil(remaining);

            gameState.timeLeft = remaining;
            
            // 表示更新（整数表示）
            if (timerDisplay) timerDisplay.textContent = currentSec;

            // 残り3秒以下のカウントダウンSE (3, 2, 1)
            // 秒数が切り替わったタイミングで鳴らす
            if (currentSec < gameState.lastSec && currentSec <= 3 && currentSec > 0) {
                playBeepSound();
            }
            gameState.lastSec = currentSec;

            // 時間切れ＝クリア（生き残った）
            if (remaining <= 0) {
                levelClear();
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

            // レベルに応じた表示時間
            const settings = LEVEL_SETTINGS[gameState.level];
            const duration = settings ? settings.time : 500;

            timeoutId = setTimeout(() => {
                if (gameState.isPlaying && gameState.activePoopIndex === nextIndex) {
                    handleMiss(items[nextIndex]);
                    activateRandomPoop();
                }
            }, duration);
        }
    }

    function handlePoopClick(index, element) {
        if (!gameState.isPlaying) return;

        if (index === gameState.activePoopIndex) {
            // 正解
            gameState.score++;
            
            if (scoreDisplay) scoreDisplay.textContent = gameState.score;
            playSound("catch-sound"); 

            // 次へ
            activateRandomPoop();

        } else {
            // お手つき
            handleMiss(element);
        }
    }

    function handleMiss(element) {
        gameState.miss++;
        if (missDisplay) missDisplay.textContent = gameState.miss;
        
        playSound("incorrect-sound");

        element.classList.add("wrong");
        setTimeout(() => element.classList.remove("wrong"), 300);

        // 3回お手つきでゲームオーバー
        if (gameState.miss >= 3) {
            gameOver();
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

    // 15秒間耐え抜いた場合
    function levelClear() {
        stopGame();
        
        if (resultOverlay) {
            resultOverlay.style.display = "flex";
            
            if (resultTitle) {
                resultTitle.textContent = "クリア！";
                resultTitle.style.color = "#FFD700"; // Gold
            }
            if (finalScoreSpan) {
                finalScoreSpan.textContent = gameState.score;
            }

            // ボタンの出し分け
            if (gameState.level < MAX_LEVEL) {
                // 次のレベルがある場合
                if (nextLevelBtn) {
                    nextLevelBtn.style.display = "block";
                    nextLevelBtn.textContent = "レベル " + (gameState.level + 1) + " へ";
                }
            } else {
                // 最終レベルクリア
                if (resultTitle) resultTitle.textContent = "ぜんくりあ！";
            }
            
            // 共通ボタン
            if (restartBtn) restartBtn.style.display = "block";
            if (titleBtn) titleBtn.style.display = "block";
        }
        playSound("timeup-sound"); 
    }

    // 3回お手つきした場合
    function gameOver() {
        stopGame();

        if (resultOverlay) {
            resultOverlay.style.display = "flex";
            if (finalScoreSpan) finalScoreSpan.textContent = gameState.score;

            if (resultTitle) {
                resultTitle.textContent = "ゲームオーバー";
                resultTitle.style.color = "#f44336";
            }

            // 失敗時はリトライボタンを表示
            if (retryBtn) retryBtn.style.display = "block";
            if (restartBtn) restartBtn.style.display = "block";
            if (titleBtn) titleBtn.style.display = "block";
        }
        playSound("incorrect-sound"); 
    }
}