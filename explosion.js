/* explosion.js: うんちだいばくはつゲームのロジック */

function initExplosion() {
    const startScreen = document.getElementById("start-screen");
    const explosionContainer = document.getElementById("explosion-container");
    const explosionButton = document.getElementById("explosion-button");
    const backToTitleFromExplosion = document.getElementById("back-to-title-from-explosion");

    // ゲーム内要素
    const counterValue = document.getElementById("explosion-counter-value");
    const timerValue = document.getElementById("explosion-timer-value");
    const explosionField = document.getElementById("explosion-field");
    const volcanoSvg = document.getElementById("volcano-svg");

    // 結果・ランキング画面要素
    const resultOverlay = document.getElementById("explosion-result-overlay");
    const finalScoreDisplay = document.getElementById("final-score");
    const nameInput = document.getElementById("player-name-input");
    const registerRankButton = document.getElementById("register-rank-button");
    const rankingList = document.getElementById("ranking-list");
    const playAgainFromRankButton = document.getElementById("play-again-from-rank");

    let totalCount = 0;
    let isActive = false;
    let timeLeft = 30;
    let timerInterval = null;

    // カウントダウン用要素を作成して追加
    const countdownDisplay = document.createElement("div");
    countdownDisplay.id = "explosion-countdown";
    countdownDisplay.style.position = "absolute";
    countdownDisplay.style.top = "50%";
    countdownDisplay.style.left = "50%";
    countdownDisplay.style.transform = "translate(-50%, -50%)";
    countdownDisplay.style.fontSize = "100px";
    countdownDisplay.style.fontWeight = "bold";
    countdownDisplay.style.color = "#d84315";
    countdownDisplay.style.textShadow = "2px 2px 0 #fff, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff";
    countdownDisplay.style.zIndex = "20";
    countdownDisplay.style.whiteSpace = "nowrap";
    countdownDisplay.style.display = "none";
    explosionField.appendChild(countdownDisplay);

    // --- 関数定義 ---

    function startCountdown() {
        isActive = false; // カウントダウン中は操作不可
        timeLeft = 30;
        totalCount = 0;
        updateCounter();
        updateTimer();

        // 画面上のうんちクリア
        const flyingPoops = document.querySelectorAll('.flying-poop');
        flyingPoops.forEach(el => el.remove());

        // UI初期化
        resultOverlay.style.display = "none";
        document.getElementById("ranking-input-section").style.display = "block";
        document.getElementById("ranking-display-section").style.display = "none";
        nameInput.value = "";

        // カウントダウン開始
        countdownDisplay.style.display = "block";
        let count = 3;
        countdownDisplay.textContent = count;

        const countInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownDisplay.textContent = count;
                // 軽く音を鳴らしてもよい
            } else if (count === 0) {
                countdownDisplay.textContent = "スタート!";
            } else {
                clearInterval(countInterval);
                countdownDisplay.style.display = "none";
                startGame();
            }
        }, 1000);
    }

    function startGame() {
        isActive = true;

        // タイマースタート
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimer();
            if (timeLeft <= 0) {
                finishGame();
            }
        }, 1000);
    }

    function updateCounter() {
        counterValue.textContent = totalCount;
        // レベルアップ演出
        if (totalCount === 50 || totalCount === 100) {
            counterValue.style.color = "red";
            counterValue.style.transform = "scale(1.5)";
            setTimeout(() => {
                counterValue.style.color = "";
                counterValue.style.transform = "scale(1)";
            }, 500);
        }
    }

    function updateTimer() {
        timerValue.textContent = timeLeft;
        if (timeLeft <= 5) {
            timerValue.style.color = "red";
        } else {
            timerValue.style.color = "#333";
        }
    }

    function finishGame() {
        isActive = false;
        clearInterval(timerInterval);

        // 結果表示
        finalScoreDisplay.textContent = totalCount;
        resultOverlay.style.display = "flex";

        // 入力欄にフォーカス
        setTimeout(() => nameInput.focus(), 100);
    }

    function getSpawnCount() {
        if (totalCount >= 100) return 3;
        if (totalCount >= 50) return 2;
        return 1;
    }

    function spawnPoop() {
        const poopData = poops[Math.floor(Math.random() * poops.length)];

        const el = document.createElement("div");
        el.className = "flying-poop";
        setPoopStyle(el, poopData);

        // 初期位置: 火山の中央付近
        const startX = (explosionField.offsetWidth / 2) - 40;
        const startY = explosionField.offsetHeight - 120; // 火口の位置

        // 少し左右にばらけさせる
        let x = startX + (Math.random() * 60 - 30);
        let y = startY;

        // 物理パラメータ
        // 角度: 上方向(-90度)を中心に、左右に大きく広げる（-150度 〜 -30度）
        const angleDeg = -90 + (Math.random() * 120 - 60);
        const angleRad = angleDeg * (Math.PI / 180);

        // 速度
        const speed = Math.random() * 10 + 15;

        let vx = Math.cos(angleRad) * speed;
        let vy = Math.sin(angleRad) * speed;
        let gravity = 0.8;

        // 回転アニメーション用
        let rotation = 0;
        let rotationSpeed = (Math.random() * 20 - 10);

        // 初期配置
        el.style.left = x + "px";
        el.style.top = y + "px";
        explosionField.appendChild(el);

        function animate() {
            if (!el.parentNode) return;

            // 物理計算
            vy += gravity;
            x += vx;
            y += vy;
            rotation += rotationSpeed;

            // 描画更新
            el.style.left = x + "px";
            el.style.top = y + "px";
            el.style.transform = `rotate(${rotation}deg)`;

            // 画面外削除
            if (y > explosionField.offsetHeight + 100 ||
                x < -100 ||
                x > explosionField.offsetWidth + 100) {
                el.remove();
            } else {
                requestAnimationFrame(animate);
            }
        }
        requestAnimationFrame(animate);
    }

    function triggerExplosion() {
        if (!isActive) return;

        playSound("drop-sound");

        // 火山のアニメーション
        volcanoSvg.classList.remove("bump");
        void volcanoSvg.offsetWidth;
        volcanoSvg.classList.add("bump");

        const num = getSpawnCount();
        for (let i = 0; i < num; i++) {
            totalCount++;
            setTimeout(spawnPoop, i * 40);
        }
        updateCounter();
    }

    // ランキング保存と表示
    function registerRanking() {
        const name = nameInput.value.trim() || "ななし";
        const newRecord = { name: name, score: totalCount, date: new Date().toLocaleDateString() };

        // ローカルストレージから取得
        let rankings = JSON.parse(localStorage.getItem("unchiExplosionRank") || "[]");
        rankings.push(newRecord);

        // スコア順にソート（降順）
        rankings.sort((a, b) => b.score - a.score);

        // トップ10のみ保存
        rankings = rankings.slice(0, 10);
        localStorage.setItem("unchiExplosionRank", JSON.stringify(rankings));

        displayRanking(rankings);
    }

    function displayRanking(rankings) {
        document.getElementById("ranking-input-section").style.display = "none";
        document.getElementById("ranking-display-section").style.display = "block";

        rankingList.innerHTML = "";
        rankings.forEach((r, index) => {
            const li = document.createElement("li");
            li.innerHTML = `<span class="rank-num">${index + 1}い</span> <span class="rank-name">${r.name}</span> <span class="rank-score">${r.score}こ</span>`;

            // 今回のスコアを強調
            if (r.score === totalCount && r.name === (nameInput.value.trim() || "ななし")) {
                li.style.backgroundColor = "#fff9c4";
                li.style.fontWeight = "bold";
            }
            rankingList.appendChild(li);
        });
    }

    // --- イベントリスナー ---

    explosionButton.addEventListener("click", () => {
        playSound("bgm-sound");
        startScreen.style.display = "none";
        explosionContainer.style.display = "block";
        startCountdown(); // 変更: 直接リセットではなくカウントダウン開始
    });

    backToTitleFromExplosion.addEventListener("click", () => {
        isActive = false;
        clearInterval(timerInterval);
        explosionContainer.style.display = "none";
        startScreen.style.display = "block";
    });

    document.addEventListener("keydown", (e) => {
        if (isActive && explosionContainer.style.display === "block") {
            // 修正: 押しっぱなし(e.repeat)は無視する
            if (e.repeat) return;

            // アルファベットのみ許可 (A-Z, a-z)
            if (/^[a-zA-Z]$/.test(e.key)) {
                if (resultOverlay.style.display !== "flex") {
                    triggerExplosion();
                }
            }
        }
    });

    // タップ操作
    explosionField.addEventListener("touchstart", (e) => {
        if (e.target.tagName !== "BUTTON" && isActive) {
            e.preventDefault();
            triggerExplosion();
        }
    });
    explosionField.addEventListener("mousedown", (e) => {
        if (e.target.tagName !== "BUTTON" && isActive) {
            triggerExplosion();
        }
    });

    registerRankButton.addEventListener("click", registerRanking);

    // とうろくしないボタン
    const skipRankButton = document.getElementById("skip-rank-button");
    if (skipRankButton) {
        skipRankButton.addEventListener("click", () => {
            let rankings = JSON.parse(localStorage.getItem("unchiExplosionRank") || "[]");
            displayRanking(rankings);
        });
    }

    playAgainFromRankButton.addEventListener("click", startCountdown); // 変更: もう一度遊ぶ時もカウントダウン
}