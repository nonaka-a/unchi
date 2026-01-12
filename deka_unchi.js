/* deka_unchi.js: デカうんちへのみち ゲームロジック */

function initDekaUnchi() {
    const startScreen = document.getElementById("start-screen");
    const dekaUnchiButton = document.getElementById("deka-unchi-button");
    const dekaSelectionScreen = document.getElementById("deka-unchi-selection");
    const dekaGameScreen = document.getElementById("deka-unchi-game");
    const dekaCanvas = document.getElementById("deka-canvas");
    const ctx = dekaCanvas.getContext("2d");
    const selectionGrid = document.getElementById("deka-selection-grid");

    // Difficulty Selection Elements
    const difficultyScreen = document.getElementById("deka-difficulty-selection");
    const easyBtn = document.getElementById("deka-easy-btn");
    const hardBtn = document.getElementById("deka-hard-btn");
    const backToCharBtn = document.getElementById("back-to-char-select");

    const backToTitleButton = document.getElementById("back-to-title-from-deka");

    // オーバーレイ要素
    const gameOverOverlay = document.getElementById("deka-game-over-overlay");
    const gameClearOverlay = document.getElementById("deka-game-clear-overlay");
    const finalScoreSpan = document.getElementById("deka-final-score");
    const retryButton = document.getElementById("deka-retry-button");
    const titleButton = document.getElementById("deka-title-button");
    const clearTitleButton = document.getElementById("deka-clear-title-button");

    // ポーズ用要素
    const pauseOverlay = document.getElementById("deka-pause-overlay");
    const pauseScoreSpan = document.getElementById("deka-pause-score");
    const resumeButton = document.getElementById("deka-resume-button");
    const quitButton = document.getElementById("deka-quit-button");

    // ランキングコンテナ
    const rankingContainer = document.getElementById("deka-ranking-container");

    // 音声要素
    const bgm = document.getElementById("bgm-sound");
    let audioCtx = null;

    let player = {
        x: 0,
        y: 0,
        size: 30,
        color: "#8B4513",
        name: "",
        poopData: null,
        img: null,
        angle: 0,
        lastShot: 0,
        eatenCount: 0 // 追加: NPC捕食数
    };

    let foods = [];
    let npcs = [];
    let bullets = [];
    let animationId;
    let mapWidth = 3000;
    let mapHeight = 3000;
    let cameraX = 0;
    let cameraY = 0;
    let mouseX = 0;
    let mouseY = 0;
    let frameCount = 0; // ランキング更新頻度調整用
    let isPaused = false; // ポーズ状態フラグ
    let currentDifficulty = 'hard'; // 'easy' or 'hard'
    let selectedPoopData = null; // Store selected poop for difficulty screen

    // 追加: ゲーム終了状態フラグ
    let isGameClear = false;
    let isGameOver = false;

    // SE
    function playEatSound() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.type = 'sine';
        const now = audioCtx.currentTime;
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);

        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    // 画像生成関連
    function svgToImage(svgString) {
        const img = new Image();
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        img.src = url;
        return img;
    }

    function createPoopImage(poopData) {
        const tempDiv = document.createElement("div");
        setPoopStyle(tempDiv, poopData);

        const svgEl = tempDiv.querySelector("svg");
        if (svgEl) {
            svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            svgEl.setAttribute("width", "100");
            svgEl.setAttribute("height", "100");

            const path = svgEl.querySelector(".poop-body path");
            if (path) {
                if (poopData.name === "とうめいな うんち") {
                    path.setAttribute("fill", "none");
                    path.setAttribute("stroke", "#a1887f");
                    path.setAttribute("stroke-width", "2");
                } else if (!poopData.color.startsWith("linear-gradient")) {
                    path.setAttribute("fill", poopData.color);
                }
            }
            return svgToImage(svgEl.outerHTML);
        }
        return null;
    }

    function createSelectionScreen() {
        selectionGrid.innerHTML = "";
        poops.forEach(poop => {
            const item = document.createElement("div");
            item.className = "deka-selection-item";
            const icon = document.createElement("div");
            icon.className = "deka-selection-icon";
            setPoopStyle(icon, poop);
            const name = document.createElement("div");
            name.textContent = poop.name;
            item.appendChild(icon);
            item.appendChild(name);
            item.addEventListener("click", () => {
                showDifficultyScreen(poop);
            });
            selectionGrid.appendChild(item);
        });
    }

    function showDifficultyScreen(poop) {
        selectedPoopData = poop;
        dekaSelectionScreen.style.display = "none";
        difficultyScreen.style.display = "block";
    }

    function startGame(selectedPoop, difficulty) {
        currentDifficulty = difficulty;
        dekaSelectionScreen.style.display = "none";
        dekaGameScreen.style.display = "block";
        gameOverOverlay.style.display = "none";
        gameClearOverlay.style.display = "none";
        pauseOverlay.style.display = "none";

        // フラグ初期化
        isGameClear = false;
        isGameOver = false;

        if (bgm) {
            bgm.currentTime = 0;
            bgm.volume = 0.4;
            bgm.play().catch(e => { console.log("Audio play blocked", e); });
        }

        player.poopData = selectedPoop;
        player.size = 30;
        player.x = mapWidth / 2;
        player.y = mapHeight / 2;
        player.img = createPoopImage(selectedPoop);
        player.lastShot = 0;
        player.eatenCount = 0; // 初期化

        // カメラの初期座標を設定（UIだけで描画されない問題の対策）
        resizeCanvas();
        cameraX = player.x - dekaCanvas.width / 2;
        cameraY = player.y - dekaCanvas.height / 2;

        foods = [];
        for (let i = 0; i < 400; i++) {
            spawnFood();
        }

        npcs = [];
        const otherPoops = poops.filter(p => p.name !== selectedPoop.name);

        // 1位: サイズ200
        spawnNPC(otherPoops, false, 200);
        // 2位: サイズ150
        spawnNPC(otherPoops, false, 150);

        // 残りの13体は通常のランダムサイズ
        for (let i = 0; i < 13; i++) {
            spawnNPC(otherPoops, false);
        }

        bullets = [];
        frameCount = 0;
        isPaused = false;

        // 既存のアニメーションループを確実に停止させてから開始
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        animate();
    }

    function spawnFood() {
        foods.push({
            x: Math.random() * mapWidth,
            y: Math.random() * mapHeight,
            size: 5 + Math.random() * 5,
            color: `hsl(${Math.random() * 360}, 70%, 60%)`
        });
    }

    function spawnNPC(availablePoops, isRespawn = true, fixedSize = null) {
        if (availablePoops.length === 0) return;

        const randomPoop = availablePoops[Math.floor(Math.random() * availablePoops.length)];
        let size;

        if (fixedSize !== null) {
            size = fixedSize;
        } else if (isRespawn) {
            size = 20 + Math.random() * 5;
        } else {
            size = 20 + Math.random() * 60;
        }

        let x, y;
        let safe = false;
        let retry = 0;
        while (!safe && retry < 100) {
            x = Math.random() * mapWidth;
            y = Math.random() * mapHeight;
            safe = true;
            if (Math.sqrt((x - player.x) ** 2 + (y - player.y) ** 2) < 500) {
                safe = false;
            }
            retry++;
        }

        npcs.push({
            x: x,
            y: y,
            size: size,
            poopData: randomPoop,
            img: createPoopImage(randomPoop),
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            changeDirTimer: 0,
            lastShot: 0,
            aiMode: 'wander', // 'wander', 'flee_eat', 'attack'
            aiNextDecision: 0 // 次に判断を変える時間
        });
    }

    function shootBullet(owner) {
        let angle = 0;
        if (owner === player) {
            angle = player.angle;
        } else {
            angle = Math.atan2(owner.vy, owner.vx);
        }

        const offset = owner.size + 5;
        const bx = owner.x + Math.cos(angle) * offset;
        const by = owner.y + Math.sin(angle) * offset;

        const speed = 10;

        bullets.push({
            x: bx,
            y: by,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            owner: owner,
            radius: 5,
            life: 100
        });
    }

    function resizeCanvas() {
        // コンテナのサイズに合わせる
        dekaCanvas.width = window.innerWidth;
        dekaCanvas.height = window.innerHeight;
    }

    function handleInput(e) {
        if (isPaused) return; // ポーズ中は操作無効
        e.preventDefault();
        if (e.touches) {
            mouseX = e.touches[0].clientX;
            mouseY = e.touches[0].clientY;
        } else {
            mouseX = e.clientX;
            mouseY = e.clientY;
        }
    }

    function updateRankingDisplay() {
        if (frameCount % 30 !== 0) return; // 0.5秒に1回更新

        const allEntities = [
            { name: "あなた", size: player.size, isPlayer: true },
            ...npcs.map(npc => ({ name: npc.poopData.name, size: npc.size, isPlayer: false }))
        ];

        allEntities.sort((a, b) => b.size - a.size);
        const topEntities = allEntities.slice(0, 5);

        let html = '<div class="deka-rank-title">大きさランキング</div><ul class="deka-rank-list">';

        topEntities.forEach((entity, index) => {
            const rankClass = entity.isPlayer ? "deka-rank-item player-rank" : "deka-rank-item";
            const nameDisplay = entity.isPlayer ? "あなた" : entity.name;
            html += `
                <li class="${rankClass}">
                    <span class="rank-order">${index + 1}</span>
                    <span class="rank-name">${nameDisplay}</span>
                    <span class="rank-size">${Math.floor(entity.size)}</span>
                </li>
            `;
        });

        const playerRankIndex = allEntities.findIndex(e => e.isPlayer);
        if (playerRankIndex >= 5) {
            html += `
                <li class="deka-rank-item player-rank" style="margin-top:5px; border-top:1px dashed #aaa;">
                    <span class="rank-order">${playerRankIndex + 1}</span>
                    <span class="rank-name">あなた</span>
                    <span class="rank-size">${Math.floor(player.size)}</span>
                </li>
            `;
        }

        html += '</ul>';
        rankingContainer.innerHTML = html;
        rankingContainer.style.display = "block";
    }

    function update() {
        // 終了状態なら更新しない
        if (isGameClear || isGameOver) return;

        const now = Date.now();
        frameCount++;

        updateRankingDisplay();

        // アチーブメント判定: サイズ
        if (player.size >= 100) unlockAchievement("deka_100");
        if (player.size >= 300) unlockAchievement("deka_300");

        // --- プレイヤー ---
        const targetX = mouseX - dekaCanvas.width / 2;
        const targetY = mouseY - dekaCanvas.height / 2;

        // Speed calculation
        let speed;
        if (currentDifficulty === 'easy') {
            // Easy: Speed drops less significantly
            speed = 300 / (player.size * 0.7);
        } else {
            // Hard (Normal): Standard speed drop
            speed = 300 / player.size;
        }
        const angle = Math.atan2(targetY, targetX);
        const dist = Math.sqrt(targetX * targetX + targetY * targetY);

        player.angle = angle;

        if (dist > 10) {
            player.x += Math.cos(angle) * Math.min(dist * 0.05, speed);
            player.y += Math.sin(angle) * Math.min(dist * 0.05, speed);
        }

        // プレイヤー発射
        if (currentDifficulty === 'easy') {
            // Easy: Always shoot every 1 second
            if (now - player.lastShot > 1000) {
                shootBullet(player);
                player.lastShot = now;
            }
        } else {
            // Hard: Only shoot when small (original logic)
            if (player.size < 50) {
                if (now - player.lastShot > 2000) {
                    shootBullet(player);
                    player.lastShot = now;
                }
            }
        }

        // クリア判定
        if (player.size >= 500) {
            if (!isGameClear) {
                gameClear();
            }
            return;
        }

        const collisionSize = player.size * 0.5;
        player.x = Math.max(collisionSize, Math.min(mapWidth - collisionSize, player.x));
        player.y = Math.max(collisionSize, Math.min(mapHeight - collisionSize, player.y));

        cameraX = player.x - dekaCanvas.width / 2;
        cameraY = player.y - dekaCanvas.height / 2;

        // --- エサ ---
        for (let i = foods.length - 1; i >= 0; i--) {
            const f = foods[i];
            let eaten = false;

            const dPlayer = Math.sqrt((player.x - f.x) ** 2 + (player.y - f.y) ** 2);
            if (dPlayer < (player.size + f.size) * 0.6) {
                // Easy mode: Double growth
                const growthMultiplier = currentDifficulty === 'easy' ? 2 : 1;
                player.size += f.size * 0.1 * growthMultiplier;
                eaten = true;
                playEatSound();
            }

            if (!eaten) {
                for (let npc of npcs) {
                    const dNpc = Math.sqrt((npc.x - f.x) ** 2 + (npc.y - f.y) ** 2);
                    if (dNpc < (npc.size + f.size) * 0.6) {
                        npc.size += f.size * 0.1;
                        eaten = true;
                        break;
                    }
                }
            }

            if (eaten) {
                foods.splice(i, 1);
                spawnFood();
            }
        }

        // --- 弾 ---
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.x += b.vx;
            b.y += b.vy;
            b.life--;

            if (b.life <= 0 || b.x < 0 || b.x > mapWidth || b.y < 0 || b.y > mapHeight) {
                bullets.splice(i, 1);
                continue;
            }

            // vs Player
            if (b.owner !== player) {
                const dist = Math.sqrt((b.x - player.x) ** 2 + (b.y - player.y) ** 2);
                if (dist < player.size * 0.6) {
                    player.size = Math.max(5, player.size - 1);
                    bullets.splice(i, 1);
                    continue;
                }
            }

            // vs NPC
            let hitNPC = false;
            for (let j = 0; j < npcs.length; j++) {
                const npc = npcs[j];
                if (b.owner !== npc) {
                    const dist = Math.sqrt((b.x - npc.x) ** 2 + (b.y - npc.y) ** 2);
                    if (dist < npc.size * 0.6) {
                        npc.size = Math.max(5, npc.size - 1);
                        bullets.splice(i, 1);
                        hitNPC = true;
                        break;
                    }
                }
            }
            if (hitNPC) continue;
        }

        // --- NPC AI ---
        npcs.forEach(npc => {
            const npcSpeed = 280 / npc.size;
            let moveAngle = 0;
            let moveSpeed = 0;
            const sightRange = npc.size * 8 + 300;
            const canShoot = npc.size < 50;

            let closestThreat = null;
            let closestPrey = null;
            let minThreatDist = Infinity;
            let minPreyDist = Infinity;

            const distToPlayer = Math.sqrt((npc.x - player.x) ** 2 + (npc.y - player.y) ** 2);
            if (distToPlayer < sightRange) {
                if (player.size > npc.size * 1.1) {
                    minThreatDist = distToPlayer;
                    closestThreat = player;
                } else if (player.size < npc.size * 0.9) {
                    minPreyDist = distToPlayer;
                    closestPrey = player;
                }
            }

            npcs.forEach(other => {
                if (npc === other) return;
                const d = Math.sqrt((npc.x - other.x) ** 2 + (npc.y - other.y) ** 2);
                if (d < sightRange) {
                    if (other.size > npc.size * 1.1) {
                        if (d < minThreatDist) {
                            minThreatDist = d;
                            closestThreat = other;
                        }
                    } else if (other.size < npc.size * 0.9) {
                        if (d < minPreyDist) {
                            minPreyDist = d;
                            closestPrey = other;
                        }
                    }
                }
            });

            if (closestThreat) {
                // 脅威がある場合
                if (now > npc.aiNextDecision) {
                    const choice = Math.random();
                    if (choice < 0.5) {
                        npc.aiMode = 'flee_eat';
                    } else {
                        npc.aiMode = 'attack';
                    }
                    npc.aiNextDecision = now + 2000;
                }

                if (npc.aiMode === 'flee_eat') {
                    const angleFromThreat = Math.atan2(npc.y - closestThreat.y, npc.x - closestThreat.x);

                    let bestFood = null;
                    let minFoodDist = 300;

                    for (const f of foods) {
                        const df = Math.sqrt((npc.x - f.x) ** 2 + (npc.y - f.y) ** 2);
                        if (df < minFoodDist) {
                            const angleToFood = Math.atan2(f.y - npc.y, f.x - npc.x);
                            const angleDiff = Math.abs(angleFromThreat - angleToFood);
                            if (angleDiff < Math.PI / 2 || angleDiff > 3 * Math.PI / 2) {
                                minFoodDist = df;
                                bestFood = f;
                            }
                        }
                    }

                    if (bestFood) {
                        const fleeX = Math.cos(angleFromThreat);
                        const fleeY = Math.sin(angleFromThreat);
                        const foodAngle = Math.atan2(bestFood.y - npc.y, bestFood.x - npc.x);
                        const foodX = Math.cos(foodAngle) * 0.8;
                        const foodY = Math.sin(foodAngle) * 0.8;
                        moveAngle = Math.atan2(fleeY + foodY, fleeX + foodX);
                    } else {
                        moveAngle = angleFromThreat;
                    }
                    moveSpeed = npcSpeed * 1.1;

                } else if (npc.aiMode === 'attack') {
                    const angleToThreat = Math.atan2(closestThreat.y - npc.y, closestThreat.x - npc.x);
                    moveAngle = angleToThreat;

                    const idealDist = 200;
                    if (minThreatDist > idealDist) {
                        moveSpeed = npcSpeed * 0.8;
                    } else {
                        moveAngle = angleToThreat + Math.PI;
                        moveSpeed = npcSpeed * 0.5;
                    }

                    if (canShoot) {
                        if (now - npc.lastShot > 500) {
                            shootBullet(npc);
                            npc.lastShot = now;
                        }
                    }
                }
            } else if (closestPrey) {
                const angleToPrey = Math.atan2(closestPrey.y - npc.y, closestPrey.x - npc.x);
                moveAngle = angleToPrey;
                moveSpeed = npcSpeed * 0.9;
                npc.aiMode = 'wander';
            } else {
                npc.aiMode = 'wander';
                moveSpeed = 0;
            }

            if (moveSpeed > 0) {
                npc.vx = Math.cos(moveAngle) * moveSpeed;
                npc.vy = Math.sin(moveAngle) * moveSpeed;
                npc.changeDirTimer--;
            } else {
                npc.changeDirTimer--;
                if (npc.changeDirTimer <= 0) {
                    const randomAngle = Math.random() * Math.PI * 2;
                    npc.vx = Math.cos(randomAngle) * (npcSpeed * 0.5);
                    npc.vy = Math.sin(randomAngle) * (npcSpeed * 0.5);
                    npc.changeDirTimer = 60 + Math.random() * 60;
                }
            }

            npc.x += npc.vx;
            npc.y += npc.vy;

            const npcColSize = npc.size * 0.5;
            if (npc.x < npcColSize || npc.x > mapWidth - npcColSize) {
                npc.vx *= -1;
                npc.x = Math.max(npcColSize, Math.min(mapWidth - npcColSize, npc.x));
            }
            if (npc.y < npcColSize || npc.y > mapHeight - npcColSize) {
                npc.vy *= -1;
                npc.y = Math.max(npcColSize, Math.min(mapHeight - npcColSize, npc.y));
            }

            if (canShoot && npc.aiMode !== 'attack') {
                if (now - npc.lastShot > 2000) {
                    shootBullet(npc);
                    npc.lastShot = now;
                }
            }
        });

        // --- 衝突判定（NPC同士） ---
        for (let i = npcs.length - 1; i >= 0; i--) {
            for (let j = npcs.length - 1; j >= 0; j--) {
                if (i === j) continue;
                const n1 = npcs[i];
                const n2 = npcs[j];
                if (!n1 || !n2) continue;

                const dist = Math.sqrt((n1.x - n2.x) ** 2 + (n1.y - n2.y) ** 2);
                if (dist < (n1.size + n2.size) * 0.5) {
                    if (n1.size > n2.size) {
                        n1.size += n2.size * 0.2;
                        npcs.splice(j, 1);
                        const otherPoops = poops.filter(p => p.name !== player.poopData.name);
                        spawnNPC(otherPoops, true);
                        break;
                    }
                }
            }
        }

        // --- 衝突判定（プレイヤー vs NPC） ---
        for (let i = npcs.length - 1; i >= 0; i--) {
            const npc = npcs[i];
            const distToPlayer = Math.sqrt((npc.x - player.x) ** 2 + (npc.y - player.y) ** 2);

            if (distToPlayer < (player.size + npc.size) * 0.5) {
                if (player.size > npc.size) {
                    player.size += npc.size * 0.2;
                    npcs.splice(i, 1);
                    playSound("reveal-sound");

                    // アチーブメント: おなかいっぱい
                    player.eatenCount++;
                    if (player.eatenCount >= 10) unlockAchievement("deka_eat10");

                    const otherPoops = poops.filter(p => p.name !== player.poopData.name);
                    spawnNPC(otherPoops, true);

                } else {
                    if (!isGameOver) {
                        gameOver();
                    }
                    return;
                }
            }
        }
    }

    function gameClear() {
        if (isGameClear) return;
        isGameClear = true;

        cancelAnimationFrame(animationId);
        if (bgm) bgm.pause();
        playSound("timeup-sound");
        gameClearOverlay.style.display = "flex";

        // アチーブメント
        unlockAchievement("deka_master");
        if (currentDifficulty === 'easy') {
            unlockAchievement("deka_clear_easy");
        } else if (currentDifficulty === 'hard') {
            unlockAchievement("deka_clear_hard"); // 追加
        }
    }

    function gameOver() {
        if (isGameOver) return;
        isGameOver = true;

        cancelAnimationFrame(animationId);
        if (bgm) bgm.pause();
        playSound("timeup-sound");
        finalScoreSpan.textContent = Math.floor(player.size);
        gameOverOverlay.style.display = "flex";
    }

    function backToTitle() {
        if (bgm) {
            bgm.pause();
            bgm.currentTime = 0;
        }
        if (audioCtx) {
            audioCtx.suspend();
        }
        dekaGameScreen.style.display = "none";
        dekaSelectionScreen.style.display = "none";
        difficultyScreen.style.display = "none";
        rankingContainer.style.display = "none";
        startScreen.style.display = "block";
        cancelAnimationFrame(animationId);
    }

    // ポーズ機能の実装
    function pauseGame() {
        if (isPaused) return;
        isPaused = true;
        cancelAnimationFrame(animationId);
        pauseScoreSpan.textContent = Math.floor(player.size);
        pauseOverlay.style.display = "flex";
    }

    function resumeGame() {
        if (!isPaused) return;
        isPaused = false;
        pauseOverlay.style.display = "none";
        // すでにループが走っていないか確認してから再開
        if (!animationId) {
            animate();
        }
    }

    function draw() {
        ctx.clearRect(0, 0, dekaCanvas.width, dekaCanvas.height);
        ctx.save();
        ctx.translate(-cameraX, -cameraY);

        // 背景グリッド
        ctx.strokeStyle = "#ddd";
        ctx.lineWidth = 1;
        const gridSize = 50;
        // 描画範囲の最適化（画面外を描画しない）
        const startX = Math.floor(cameraX / gridSize) * gridSize;
        const startY = Math.floor(cameraY / gridSize) * gridSize;
        const endX = startX + dekaCanvas.width + gridSize;
        const endY = startY + dekaCanvas.height + gridSize;

        for (let x = startX; x < endX; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, Math.max(0, cameraY));
            ctx.lineTo(x, Math.min(mapHeight, cameraY + dekaCanvas.height));
            ctx.stroke();
        }
        for (let y = startY; y < endY; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(Math.max(0, cameraX), y);
            ctx.lineTo(Math.min(mapWidth, cameraX + dekaCanvas.width), y);
            ctx.stroke();
        }

        // マップ枠
        ctx.strokeStyle = "#aaa";
        ctx.lineWidth = 5;
        ctx.strokeRect(0, 0, mapWidth, mapHeight);

        // エサ
        foods.forEach(f => {
            // 画面内判定（簡易）
            if (f.x < cameraX - 50 || f.x > cameraX + dekaCanvas.width + 50 ||
                f.y < cameraY - 50 || f.y > cameraY + dekaCanvas.height + 50) return;

            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
            ctx.fillStyle = f.color;
            ctx.fill();
        });

        // 弾
        ctx.fillStyle = "#000";
        bullets.forEach(b => {
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        // NPC
        npcs.forEach(npc => {
            // 画面内判定
            if (npc.x < cameraX - npc.size || npc.x > cameraX + dekaCanvas.width + npc.size ||
                npc.y < cameraY - npc.size || npc.y > cameraY + dekaCanvas.height + npc.size) return;

            ctx.save();
            ctx.translate(npc.x, npc.y);

            // 画像描画チェックとフォールバック
            if (npc.img && npc.img.complete && npc.img.naturalWidth > 0) {
                try {
                    ctx.drawImage(npc.img, -npc.size, -npc.size, npc.size * 2, npc.size * 2);
                } catch (e) {
                    drawSimplePoop(ctx, npc.size, npc.poopData.color);
                }
            } else {
                drawSimplePoop(ctx, npc.size, npc.poopData.color);
            }

            ctx.fillStyle = "#555";
            ctx.font = "12px Arial";
            ctx.textAlign = "center";
            ctx.fillText(npc.poopData.name, 0, -npc.size - 5);
            ctx.restore();
        });

        // プレイヤー
        ctx.save();
        ctx.translate(player.x, player.y);
        if (player.img && player.img.complete && player.img.naturalWidth > 0) {
            try {
                ctx.drawImage(player.img, -player.size, -player.size, player.size * 2, player.size * 2);
            } catch (e) {
                drawSimplePoop(ctx, player.size, player.poopData ? player.poopData.color : player.color);
            }
        } else {
            drawSimplePoop(ctx, player.size, player.poopData ? player.poopData.color : player.color);
        }
        ctx.fillStyle = "#000";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(player.poopData ? player.poopData.name : "うんち", 0, -player.size - 10);
        ctx.restore();

        ctx.restore();

        // UI
        ctx.fillStyle = "#000";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`大きさ: ${Math.floor(player.size)} / 500`, dekaCanvas.width / 2, 50);
    }

    function drawSimplePoop(ctx, size, color) {
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }

    function animate() {
        if (dekaGameScreen.style.display === "none" || isPaused) {
            animationId = null;
            return;
        }
        update();
        draw();
        animationId = requestAnimationFrame(animate);
    }

    // イベントリスナーの登録（initDekaUnchi 内で一度だけ行う）
    window.addEventListener("resize", resizeCanvas);
    dekaCanvas.addEventListener("mousemove", handleInput);
    dekaCanvas.addEventListener("touchmove", handleInput, { passive: false });

    // イベントリスナー
    if (dekaUnchiButton) {
        dekaUnchiButton.addEventListener("click", () => {
            startScreen.style.display = "none";
            dekaSelectionScreen.style.display = "block";
            createSelectionScreen();
        });
    }

    if (easyBtn) {
        easyBtn.addEventListener("click", () => {
            if (selectedPoopData) startGame(selectedPoopData, 'easy');
        });
    }

    if (hardBtn) {
        hardBtn.addEventListener("click", () => {
            if (selectedPoopData) startGame(selectedPoopData, 'hard');
        });
    }

    if (backToCharBtn) {
        backToCharBtn.addEventListener("click", () => {
            difficultyScreen.style.display = "none";
            dekaSelectionScreen.style.display = "block";
        });
    }

    if (backToTitleButton) {
        backToTitleButton.addEventListener("click", pauseGame);
    }

    if (retryButton) {
        retryButton.addEventListener("click", () => {
            startGame(player.poopData, currentDifficulty);
        });
    }

    if (titleButton) {
        titleButton.addEventListener("click", () => {
            gameOverOverlay.style.display = "none";
            backToTitle();
        });
    }

    if (clearTitleButton) {
        clearTitleButton.addEventListener("click", () => {
            gameClearOverlay.style.display = "none";
            backToTitle();
        });
    }

    if (resumeButton) {
        resumeButton.addEventListener("click", resumeGame);
    }
    if (quitButton) {
        quitButton.addEventListener("click", () => {
            pauseOverlay.style.display = "none";
            backToTitle();
        });
    }
}