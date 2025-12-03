/* bazooka.js: うんちバズーカ ゲームロジック */

function initBazooka() {
    const startScreen = document.getElementById("start-screen");
    const bazookaButton = document.getElementById("bazooka-button");
    const bazookaContainer = document.getElementById("bazooka-container");
    const backButton = document.getElementById("back-to-title-from-bazooka");
    const canvas = document.getElementById("bazooka-canvas");
    const ctx = canvas.getContext("2d");

    const overlay = document.getElementById("bazooka-overlay");
    const messageEl = document.getElementById("bazooka-message");
    const retryBtn = document.getElementById("bazooka-retry-btn");
    const titleBtn = document.getElementById("bazooka-title-btn");

    overlay.innerHTML = `
        <div class="result-box">
            <h2 id="bazooka-message"></h2>
            <div id="bazooka-result-buttons" style="display:flex; flex-direction:column; gap:10px; align-items:center; margin-top:15px;">
                <button id="bazooka-retry-btn" class="play-again-button">もういちど</button>
                <button id="bazooka-title-btn" class="start-button" style="background-color: #795548;">タイトルへ</button>
            </div>
        </div>
    `;
    
    const newMessageEl = document.getElementById("bazooka-message");
    const newRetryBtn = document.getElementById("bazooka-retry-btn");
    const newTitleBtn = document.getElementById("bazooka-title-btn");

    let animationId;
    let audioCtx = null;

    // ゲーム状態
    let gameState = "idle";
    let width, height;
    let currentLevel = 1;
    const MAX_LEVEL = 7;

    // 設定
    let bazookaPos = { x: 0, y: 0, dir: 1 };
    const bazookaLength = 90; 
    const wheelRadius = 45;   

    let aimAngle = 0;
    let aimPower = 0;
    const MAX_POWER = 35; 

    // 弾薬管理
    let ammoQueue = []; 
    let stoppedBullets = []; 
    let activeBullet = null; 

    // 定数
    const BULLET_RADIUS = 26; 

    // トイレターゲット
    let toilet = { x: 0, y: 0 };

    // 障害物リスト
    let obstacles = [];

    // 操作用
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;

    // SVGからImage作成
    function createPoopImage(poopData) {
        const tempDiv = document.createElement("div");
        setPoopStyle(tempDiv, poopData);
        const svgEl = tempDiv.querySelector("svg");
        
        if (svgEl) {
            svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            svgEl.setAttribute("width", "100");
            svgEl.setAttribute("height", "100");
            const blob = new Blob([svgEl.outerHTML], { type: "image/svg+xml" });
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.src = url;
            return img;
        }
        return null;
    }

    // サウンド生成
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playBazookaSound() {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    }

    function playBounceSound() {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    }

    function playFlushSound() {
        initAudio();
        const bufferSize = audioCtx.sampleRate * 2.0; 
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 2.0);
        noise.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start();
    }

    function resizeCanvas() {
        width = canvas.width = canvas.clientWidth;
        height = canvas.height = canvas.clientHeight;
    }

    function setupLevel(level) {
        resizeCanvas(); 
        
        const groundY = height - 40;
        obstacles = [];
        stoppedBullets = [];
        
        // デフォルト設定
        bazookaPos = { x: 80, y: groundY - wheelRadius + 10, dir: 1 };
        toilet = { x: width - 150, y: groundY };

        const blockColor = '#B3E5FC'; 

        if (level === 1) {
            const highGroundH = 200;
            const highGroundW = 200;
            bazookaPos.x = 80;
            bazookaPos.y = groundY - highGroundH - wheelRadius + 10;
            
            obstacles.push({
                type: 'rect',
                x: 0, y: groundY - highGroundH,
                w: highGroundW, h: highGroundH,
                color: blockColor
            });

            const slopeW = 300;
            obstacles.push({
                type: 'slope',
                x1: highGroundW, y1: groundY - highGroundH,
                x2: highGroundW + slopeW, y2: groundY,
                color: blockColor
            });

            toilet.x = width - 150;
            toilet.y = groundY;

        } else if (level === 2) {
            // 平地

        } else if (level === 3) {
            const wallH = 250;
            const wallW = 40;
            const wallX = width / 2 - wallW / 2;
            
            obstacles.push({
                type: 'rect',
                x: wallX, y: groundY - wallH,
                w: wallW, h: wallH,
                color: blockColor
            });

        } else if (level === 4) {
            bazookaPos.dir = -1;
            bazookaPos.x = 150; 
            
            const wallX = 230; 
            const wallH = 180;
            obstacles.push({
                type: 'rect',
                x: wallX, y: groundY - wallH,
                w: 40, h: wallH,
                color: blockColor
            });

            toilet.x = width - 250;
        } else if (level === 5) {
            // Level 5: 空中で静止している正方形ブロックが障害物として2つ
            const blockSize = 60;
            obstacles.push({
                type: 'rect',
                x: width * 0.4, y: groundY - 250,
                w: blockSize, h: blockSize,
                color: blockColor
            });
            obstacles.push({
                type: 'rect',
                x: width * 0.6, y: groundY - 150,
                w: blockSize, h: blockSize,
                color: blockColor
            });
            toilet.x = width - 100;
        } else if (level === 6) {
            // Level 6: Level 5の障害物がゆっくりと上下に動いている
            const blockSize = 60;
            obstacles.push({
                type: 'rect',
                x: width * 0.4, y: groundY - 250,
                w: blockSize, h: blockSize,
                color: blockColor,
                vy: 1, minY: groundY - 350, maxY: groundY - 150
            });
            obstacles.push({
                type: 'rect',
                x: width * 0.6, y: groundY - 150,
                w: blockSize, h: blockSize,
                color: blockColor,
                vy: -1, minY: groundY - 250, maxY: groundY - 50
            });
            toilet.x = width - 100;
        } else if (level === 7) {
            // Level 7: Level 3にあった壁が左右にゆっくり動いている
            const wallH = 250;
            const wallW = 40;
            const wallX = width / 2 - wallW / 2;

            obstacles.push({
                type: 'rect',
                x: wallX, y: groundY - wallH,
                w: wallW, h: wallH,
                color: blockColor,
                vx: 1.5, minX: width * 0.3, maxX: width * 0.7
            });
            toilet.x = width - 150;
        }

        if (bazookaPos.dir === 1) {
            aimAngle = -Math.PI / 4;
        } else {
            aimAngle = -Math.PI * 0.75;
        }
        aimPower = 0;
    }

    function startGame() {
        const shuffled = [...poops].sort(() => 0.5 - Math.random());
        ammoQueue = shuffled.map(p => ({
            data: p,
            img: createPoopImage(p)
        }));
        
        currentLevel = 1;
        startLevel(currentLevel);
    }

    function startLevel(level) {
        gameState = "idle";
        setupLevel(level);
        loadNextBullet();
        
        overlay.style.display = "none";
        
        newRetryBtn.style.display = "block";
        newRetryBtn.textContent = "もういちど";
        newRetryBtn.onclick = () => {
            startGame(); 
        };
    }

    function nextLevel() {
        currentLevel++;
        if (currentLevel > MAX_LEVEL) {
            return;
        }
        startLevel(currentLevel);
    }

    function loadNextBullet() {
        if (ammoQueue.length > 0) {
            const nextPoop = ammoQueue.pop(); 
            activeBullet = {
                x: bazookaPos.x,
                y: bazookaPos.y,
                vx: 0,
                vy: 0,
                radius: BULLET_RADIUS,
                img: nextPoop.img,
                data: nextPoop.data,
                rotation: 0,
                isStoppedCount: 0,
                isResting: false
            };
            if (bazookaPos.dir === 1) {
                aimAngle = -Math.PI / 4;
            } else {
                aimAngle = -Math.PI * 0.75;
            }
            gameState = "idle";
        } else {
            activeBullet = null;
            gameState = "result";
            showResult(false);
        }
    }

    function shakeScreen() {
        const intensity = 15;
        const duration = 400;
        const startTime = Date.now();

        function shake() {
            const elapsed = Date.now() - startTime;
            if (elapsed < duration) {
                const dx = (Math.random() - 0.5) * intensity;
                const dy = (Math.random() - 0.5) * intensity;
                canvas.style.transform = `translate(${dx}px, ${dy}px)`;
                requestAnimationFrame(shake);
            } else {
                canvas.style.transform = "none";
            }
        }
        shake();
    }

    function resolveRectCollision(bullet, rect) {
        const closeX = Math.max(rect.l, Math.min(bullet.x, rect.r));
        const closeY = Math.max(rect.t, Math.min(bullet.y, rect.b));

        const dx = bullet.x - closeX;
        const dy = bullet.y - closeY;
        const distSq = dx * dx + dy * dy;

        if (distSq < bullet.radius * bullet.radius) {
            const dist = Math.sqrt(distSq);
            const overlap = bullet.radius - dist;
            
            let nx, ny;
            if (dist === 0) {
                 nx = 0; ny = -1; 
            } else {
                 nx = dx / dist;
                 ny = dy / dist;
            }

            bullet.x += nx * overlap;
            bullet.y += ny * overlap;

            const dot = bullet.vx * nx + bullet.vy * ny;
            bullet.vx -= 2 * dot * nx * 0.6; 
            bullet.vy -= 2 * dot * ny * 0.6;
            
            return true;
        }
        return false;
    }

    function checkObstacleCollision(bullet) {
        let hit = false;
        for (const obs of obstacles) {
            if (obs.type === 'rect') {
                const rect = { l: obs.x, r: obs.x + obs.w, t: obs.y, b: obs.y + obs.h };
                if (resolveRectCollision(bullet, rect)) {
                    hit = true;
                }
            } else if (obs.type === 'slope') {
                const abx = obs.x2 - obs.x1;
                const aby = obs.y2 - obs.y1;
                const apx = bullet.x - obs.x1;
                const apy = bullet.y - obs.y1;
                const lenSq = abx*abx + aby*aby;
                let t = (apx*abx + apy*aby) / lenSq;
                t = Math.max(0, Math.min(1, t));
                
                const closestX = obs.x1 + abx * t;
                const closestY = obs.y1 + aby * t;
                
                const dx = bullet.x - closestX;
                const dy = bullet.y - closestY;
                const distSq = dx*dx + dy*dy;

                if (distSq < bullet.radius * bullet.radius) {
                    const dist = Math.sqrt(distSq);
                    let nx, ny;
                    if (dist > 0) {
                        nx = dx / dist;
                        ny = dy / dist;
                    } else {
                        nx = -aby;
                        ny = abx;
                        const len = Math.sqrt(nx*nx + ny*ny);
                        nx /= len;
                        ny /= len;
                    }
                    const overlap = bullet.radius - dist;
                    bullet.x += nx * overlap;
                    bullet.y += ny * overlap;
                    const dot = bullet.vx * nx + bullet.vy * ny;
                    bullet.vx -= 2 * dot * nx * 0.6;
                    bullet.vy -= 2 * dot * ny * 0.6;
                    hit = true;
                }
            }
        }
        return hit;
    }

    function update() {
        // 障害物の移動
        obstacles.forEach(obs => {
            if (obs.vx) {
                obs.x += obs.vx;
                if (obs.x < obs.minX) {
                    obs.x = obs.minX;
                    obs.vx *= -1;
                } else if (obs.x > obs.maxX) {
                    obs.x = obs.maxX;
                    obs.vx *= -1;
                }
            }
            if (obs.vy) {
                obs.y += obs.vy;
                if (obs.y < obs.minY) {
                    obs.y = obs.minY;
                    obs.vy *= -1;
                } else if (obs.y > obs.maxY) {
                    obs.y = obs.maxY;
                    obs.vy *= -1;
                }
            }
        });

        if (gameState === "flying" && activeBullet) {
            const b = activeBullet;
            const gravity = 0.5;
            const bounce = 0.5; 
            const friction = 0.99; 
            
            b.vy += gravity;
            b.vx *= friction;
            b.vy *= friction;

            if (Math.abs(b.vx) < 0.01) b.vx = 0;
            if (Math.abs(b.vy) < 0.01) b.vy = 0;
            
            b.x += b.vx;
            b.y += b.vy;
            
            const speed = Math.sqrt(b.vx*b.vx + b.vy*b.vy);
            if (speed > 0.1) b.rotation += speed * 2;

            const groundY = height - 40;
            const r = b.radius;

            const tx = toilet.x;
            const ty = toilet.y;
            
            const waterRect = {
                l: tx - 45, r: tx + 45, 
                t: ty - 70, b: ty - 15  
            };

            const bowlRect = {
                l: tx - 35, r: tx + 35,
                t: ty - 35, b: ty
            };

            // クリア判定
            if (b.vy > 0 && 
                b.x > waterRect.l && b.x < waterRect.r &&
                b.y > waterRect.t && b.y < waterRect.b) {
                
                gameState = "result";
                showResult(true);
                return;
            }

            // 障害物衝突
            let hitObj = false;

            if (resolveRectCollision(b, bowlRect)) hitObj = true;
            if (checkObstacleCollision(b)) hitObj = true;
            
            if (hitObj && speed > 2) {
                playBounceSound();
            }

            // 壁・床・天井
            let hitWall = false;

            if (b.y + r > groundY) {
                b.y = groundY - r;
                if (Math.abs(b.vy) < gravity * 2) {
                    b.vy = 0;
                    b.vx *= 0.5; 
                } else {
                    b.vy *= -bounce;
                    b.vx *= 0.8; 
                }
                hitWall = true;
            }
            if (b.y - r < 0) {
                b.y = r;
                b.vy *= -bounce;
                hitWall = true;
            }
            if (b.x - r < 0) {
                b.x = r;
                b.vx *= -bounce;
                hitWall = true;
            }
            if (b.x + r > width) {
                b.x = width - r;
                b.vx *= -bounce;
                hitWall = true;
            }

            if (hitWall && speed > 2) {
                playBounceSound();
            }

            // 停止判定
            if (speed < 0.5) { 
                b.isStoppedCount++;
            } else {
                b.isStoppedCount = 0;
            }

            if (b.x < -100 || b.x > width + 100 || b.y > height + 100) {
                loadNextBullet();
                return;
            }

            if (b.isStoppedCount > 30) {
                b.isResting = true;
                if (Math.abs((b.y + r) - groundY) < 5) b.y = groundY - r;
                stoppedBullets.push(b);
                activeBullet = null;
                
                gameState = "next_turn";
                setTimeout(loadNextBullet, 500);
            }
        }
    }

    function showResult(isClear) {
        overlay.style.display = "flex";
        
        newRetryBtn.style.display = "block";
        newTitleBtn.style.display = "block";
        newRetryBtn.onclick = startGame;

        newTitleBtn.onclick = () => {
            bazookaContainer.style.display = "none";
            startScreen.style.display = "block";
            cancelAnimationFrame(animationId);
        };

        if (isClear) {
            playFlushSound();

            // アチーブメント
            if (currentLevel === 1) unlockAchievement("bazooka_lv1");
            if (currentLevel === 3) unlockAchievement("bazooka_lv3");
            if (currentLevel === 5) unlockAchievement("bazooka_lv5");
            if (currentLevel === 7) unlockAchievement("bazooka_lv7");
            
            if (currentLevel < MAX_LEVEL && ammoQueue.length > 0) {
                newMessageEl.innerHTML = `レベル${currentLevel}<br>クリア！`;
                newMessageEl.style.color = "#FFD700";
                
                newRetryBtn.textContent = "つぎのレベルへ";
                newRetryBtn.style.backgroundColor = "#FF9800";
                newRetryBtn.onclick = () => {
                    nextLevel();
                };
            } else {
                if (ammoQueue.length === 0 && currentLevel < MAX_LEVEL) {
                    newMessageEl.innerHTML = `レベル${currentLevel} クリア！<br>でも タマぎれ...`;
                } else {
                    newMessageEl.textContent = "ぜんくりあ！";
                }
                
                newMessageEl.style.color = "#FFD700"; 
                newRetryBtn.textContent = "さいしょから";
                newRetryBtn.style.backgroundColor = "#4CAF50";
                newRetryBtn.onclick = startGame;
            }
        } else {
            if (ammoQueue.length === 0) {
                newMessageEl.textContent = "おしまい";
            } else {
                newMessageEl.textContent = "しっぱい...";
            }
            newMessageEl.style.color = "#555";
            playSound("incorrect-sound");
            newRetryBtn.textContent = "もういちど";
            newRetryBtn.style.backgroundColor = ""; 
        }
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);

        const groundY = height - 40;
        
        ctx.save();
        ctx.fillStyle = "#E1F5FE"; 
        ctx.fillRect(0, 0, width, groundY);
        ctx.fillStyle = "rgba(129, 212, 250, 0.2)";
        for(let i=0; i<width; i+=40) {
            for(let j=0; j<groundY; j+=40) {
                if ((i+j)%80 === 0) ctx.fillRect(i, j, 40, 40);
            }
        }
        ctx.restore();

        obstacles.forEach(obs => {
            ctx.fillStyle = obs.color || '#B3E5FC';
            if (obs.type === 'rect') {
                ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
                ctx.strokeStyle = "#81D4FA";
                ctx.lineWidth = 2;
                ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
            } else if (obs.type === 'slope') {
                ctx.beginPath();
                ctx.moveTo(obs.x1, obs.y1);
                ctx.lineTo(obs.x2, obs.y2);
                ctx.lineTo(obs.x2, groundY); 
                ctx.lineTo(obs.x1, groundY);
                ctx.fill();
                ctx.strokeStyle = "#81D4FA";
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });

        ctx.fillStyle = "#81D4FA";
        ctx.fillRect(0, groundY, width, 40);
        ctx.fillStyle = "#4FC3F7"; 
        ctx.fillRect(0, groundY, width, 2);

        ctx.save();
        ctx.font = "bold 28px sans-serif";
        ctx.fillStyle = "#01579B"; 
        ctx.textBaseline = "top";
        
        ctx.textAlign = "right";
        let count = ammoQueue.length;
        if (gameState === "idle" || gameState === "aiming") count++;
        ctx.fillText(`${count} / 12`, width - 20, 20);
        
        ctx.textAlign = "center";
        ctx.fillText(`レベル ${currentLevel}`, width / 2, 20);
        ctx.restore();

        drawToilet(ctx, toilet.x, toilet.y);
        drawBazooka(ctx, bazookaPos.x, bazookaPos.y, aimAngle, bazookaPos.dir);

        stoppedBullets.forEach(b => {
            if (b.img) {
                ctx.save();
                ctx.translate(b.x, b.y);
                ctx.rotate(b.rotation * Math.PI / 180);
                ctx.drawImage(b.img, -b.radius, -b.radius, b.radius * 2, b.radius * 2);
                ctx.restore();
            }
        });

        if (activeBullet && activeBullet.img) {
            let drawX = activeBullet.x;
            let drawY = activeBullet.y;
            let drawRot = activeBullet.rotation;

            if (gameState === "aiming" || gameState === "idle") {
                drawX = bazookaPos.x + Math.cos(aimAngle) * (bazookaLength - 20);
                drawY = bazookaPos.y + Math.sin(aimAngle) * (bazookaLength - 20);
                drawRot = aimAngle * (180/Math.PI) + 90; 
            }

            ctx.save();
            ctx.translate(drawX, drawY);
            ctx.rotate(drawRot * Math.PI / 180);
            ctx.drawImage(activeBullet.img, -activeBullet.radius, -activeBullet.radius, activeBullet.radius * 2, activeBullet.radius * 2);
            ctx.restore();
        }

        if (gameState === "aiming" && aimPower > 0) {
            drawGuide(ctx, bazookaPos.x, bazookaPos.y, aimAngle, aimPower);
        }
    }

    function drawToilet(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);
        const scale = 1.56;
        ctx.scale(scale, scale);

        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#bbb";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-30, -90, 60, 50, 5);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(0, -75, 24, 25, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, -75, 16, 18, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#f0f0f0";
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-20, 0); 
        ctx.quadraticCurveTo(-25, -20, -30, -40); 
        ctx.lineTo(30, -40);
        ctx.quadraticCurveTo(25, -20, 20, 0); 
        ctx.closePath();
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-30, -40);
        ctx.bezierCurveTo(-35, -15, 35, -15, 30, -40); 
        ctx.lineTo(-30, -40);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(0, -40, 30, 9, 0, 0, Math.PI * 2); 
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(0, -40, 22, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#29B6F6";
        ctx.fill();

        ctx.restore();
    }

    function drawBazooka(ctx, x, y, angle, dir) {
        ctx.save();
        ctx.translate(x, y);

        ctx.save();
        ctx.rotate(angle);
        
        ctx.fillStyle = "#37474F";
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(bazookaLength, -25);
        ctx.lineTo(bazookaLength, 25);
        ctx.lineTo(0, 20);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#263238";
        ctx.fillRect(20, -22, 10, 44);
        ctx.fillRect(60, -24, 10, 48);
        
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.ellipse(bazookaLength, 0, 5, 25, 0, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();

        drawWheel(ctx, "#8D6E63", "#5D4037");

        ctx.restore();
    }

    function drawWheel(ctx, colorLight, colorDark) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#3E2723";
        ctx.beginPath();
        ctx.arc(0, 0, wheelRadius, 0, Math.PI*2);
        ctx.fillStyle = colorLight;
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, wheelRadius - 8, 0, Math.PI*2);
        ctx.fillStyle = "rgba(0,0,0,0.1)"; 
        ctx.fill();
        ctx.stroke();
        ctx.save();
        ctx.strokeStyle = colorLight;
        ctx.lineWidth = 6;
        for(let i=0; i<8; i++) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            const rad = (i * 45) * Math.PI / 180;
            ctx.lineTo(Math.cos(rad) * wheelRadius, Math.sin(rad) * wheelRadius);
            ctx.stroke();
        }
        ctx.restore();
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI*2);
        ctx.fillStyle = colorDark;
        ctx.fill();
    }

    function drawGuide(ctx, x, y, angle, power) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        const start = bazookaLength + 10;
        const len = power * 4;
        
        ctx.beginPath();
        ctx.moveTo(start, 0);
        ctx.lineTo(start + len, 0);
        if (len > 0) {
            ctx.moveTo(start + len - 15, -8);
            ctx.lineTo(start + len, 0);
            ctx.lineTo(start + len - 15, 8);
        }
        const percent = Math.min(1, power / MAX_POWER);
        const r = Math.floor(255 * percent);
        const g = Math.floor(255 * (1 - percent));
        ctx.strokeStyle = `rgb(${r}, ${g}, 0)`;
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.restore();
    }

    function loop() {
        if (bazookaContainer.style.display === "none") return;
        update();
        draw();
        animationId = requestAnimationFrame(loop);
    }

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function onDown(e) {
        if (gameState !== "idle") return;
        isDragging = true;
        const pos = getPos(e);
        dragStartX = pos.x;
        dragStartY = pos.y;
        gameState = "aiming";
        
        const dx = pos.x - bazookaPos.x;
        const dy = pos.y - bazookaPos.y;
        aimAngle = Math.atan2(dy, dx);
    }

    function onMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        const pos = getPos(e);
        
        // 修正: キャンセル判定(大砲中心から50px以内ならパワー0)
        const distToBazooka = Math.sqrt((pos.x - bazookaPos.x)**2 + (pos.y - bazookaPos.y)**2);
        if (distToBazooka < 50) {
            aimPower = 0;
            // 角度は更新してドラッグ操作の追従感を残す
            const dx = pos.x - bazookaPos.x;
            const dy = pos.y - bazookaPos.y;
            aimAngle = Math.atan2(dy, dx);
            return;
        }

        const dx = pos.x - bazookaPos.x;
        const dy = pos.y - bazookaPos.y;
        aimAngle = Math.atan2(dy, dx);
        
        const pullDx = pos.x - dragStartX;
        const pullDy = pos.y - dragStartY;
        const pullDist = Math.sqrt(pullDx*pullDx + pullDy*pullDy);
        
        aimPower = Math.min(pullDist * 0.25, MAX_POWER);
    }

    function onUp(e) {
        if (!isDragging) return;
        isDragging = false;
        
        // 修正: パワー0なら発射せずアイドル状態へ
        if (aimPower > 3) {
            fire();
        } else {
            gameState = "idle";
        }
    }

    function fire() {
        if (!activeBullet) return;
        gameState = "flying";
        playBazookaSound();
        shakeScreen();

        activeBullet.x = bazookaPos.x + Math.cos(aimAngle) * bazookaLength;
        activeBullet.y = bazookaPos.y + Math.sin(aimAngle) * bazookaLength;
        
        activeBullet.vx = Math.cos(aimAngle) * aimPower;
        activeBullet.vy = Math.sin(aimAngle) * aimPower;
    }

    if (bazookaButton) {
        bazookaButton.addEventListener("click", () => {
            playSound("bgm-sound");
            startScreen.style.display = "none";
            bazookaContainer.style.display = "block";
            // 初回開始
            resizeCanvas(); 
            startGame(); 
            loop();
        });
    }

    if (backButton) {
        backButton.addEventListener("click", () => {
            bazookaContainer.style.display = "none";
            startScreen.style.display = "block";
            cancelAnimationFrame(animationId);
            if (audioCtx) audioCtx.suspend();
        });
    }

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    canvas.addEventListener("touchstart", onDown, {passive: false});
    canvas.addEventListener("touchmove", onMove, {passive: false});
    window.addEventListener("touchend", onUp);

    // ウィンドウリサイズ対応
    window.addEventListener("resize", () => {
        if (bazookaContainer.style.display === "block") {
            setupLevel(currentLevel);
            // 飛んでる弾があればリセット
            if (gameState === "flying") {
                loadNextBullet();
            }
        }
    });
}