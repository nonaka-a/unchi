/* gacha.js: ガチャゲームと図鑑のロジック */

function initGacha() {
    // DOM要素の取得
    const startScreen = document.getElementById("start-screen");
    const startButton = document.getElementById("start-button");
    const gameContainer = document.getElementById("game-container");
    const gachaView = document.getElementById("gacha-view");
    const resultView = document.getElementById("result-view");
    const gachaMachineSvg = document.getElementById("gacha-machine-svg");
    const capsule = document.getElementById("capsule");
    // const gachaHandle = document.getElementById("gacha-handle"); // 不要
    const playAgainButton = document.getElementById("play-again-button");
    const poopDisplayParent = document.getElementById("poop-display");
    const poopName = document.getElementById("poop-name");
    const fortuneText = document.getElementById("fortune-text");
    const fortuneMessage = document.getElementById("fortune-message");
    const backToTitleButton = document.getElementById("back-to-title-button");

    // ずかん用DOM
    const zukanContainer = document.getElementById("zukan-container");
    const zukanButton = document.getElementById("zukan-button");
    const backToGameButton = document.getElementById("back-to-game-button");
    const zukanGrid = document.getElementById("zukan-grid");

    let isGachaSpinning = false;
    let isZukanCreated = false;

    // 初期SVGのセット
    poopDisplayParent.innerHTML = poopSVGwithFace;
    gachaMachineSvg.innerHTML = `<rect x="5" y="5" width="90" height="90" rx="10" fill="#2196F3" stroke="#1976D2" stroke-width="2"/><rect x="10" y="10" width="80" height="80" rx="5" fill="rgba(255,255,255,0.3)"/><g class="inner-poop" style="font-size:30px; color:#D2691E" transform="translate(15, 20)">${poopSVGwithFace}</g><g class="inner-poop" style="font-size:35px; color:#FFC107" transform="translate(50, 15) rotate(20)">${poopSVGwithFace}</g><g class="inner-poop" style="font-size:40px; color:#FFC0CB" transform="translate(35, 50) rotate(-10)">${poopSVGwithFace}</g><g class="inner-poop" style="font-size:32px; color:#87CEEB" transform="translate(65, 60) rotate(15)">${poopSVGwithFace}</g><g class="inner-poop" style="font-size:38px; color:#2E8B57" transform="translate(10, 65) rotate(-30)">${poopSVGwithFace}</g><path d="M5 95 L 95 95 L 85 135 L 15 135 Z" fill="#E0E0E0" stroke="#BDBDBD" stroke-width="2"/><rect x="35" y="100" width="30" height="20" rx="5" fill="#424242"/><rect x="38" y="115" width="24" height="10" fill="#616161" rx="3"/><g id="gacha-handle" transform-origin="50 110"><circle cx="50" cy="110" r="12" fill="#F44336" stroke="#C62828" stroke-width="2"/><circle cx="50" cy="110" r="5" fill="#fff"/></g>`;

    // ガチャハンドルの再取得（innerHTMLで書き換えたため）
    const newGachaHandle = document.getElementById("gacha-handle");

    // --- 関数定義 ---

    function choosePoop() {
        const totalWeight = poops.reduce((sum, poop) => sum + poop.weight, 0);
        let random = Math.random() * totalWeight;
        for (const poop of poops) {
            if (random < poop.weight) return poop;
            random -= poop.weight;
        }
    }

    function displayResult(poop) {
        poopName.textContent = poop.name;
        fortuneText.textContent = poop.fortune;
        fortuneMessage.textContent = poop.message;
        fortuneText.className = "fortune-text " + poop.fortuneClass;
        setPoopStyle(poopDisplayParent, poop);

        // アチーブメント判定
        unlockAchievement("gacha_first");
        if (poop.name === "ピンクの うんち") unlockAchievement("gacha_pink");
        if (poop.name === "あかい うんち") unlockAchievement("gacha_red"); // 赤い うんち か あかい うんち か要確認（data.jsは "あかい うんち"）
        if (poop.name === "とうめいな うんち") unlockAchievement("gacha_transparent");
        if (poop.name === "金の うんち" || poop.name === "ぎんの うんち") unlockAchievement("gacha_rare");
        if (poop.name === "にじいろの うんち") unlockAchievement("gacha_rainbow");

        // 図鑑チェック
        const visited = JSON.parse(localStorage.getItem("zukan_visited") || "[]");
        if (!visited.includes(poop.name)) {
            visited.push(poop.name);
            localStorage.setItem("zukan_visited", JSON.stringify(visited));
        }
        if (visited.length >= 5) unlockAchievement("gacha_col5");
        if (visited.length >= 12) unlockAchievement("gacha_comp");
    }

    function resetGame() {
        isGachaSpinning = false;
        resultView.style.display = "none";
        gachaView.style.display = "block";
        newGachaHandle.classList.remove("rotate");
        capsule.classList.remove("drop", "openable");
        gachaMachineSvg.classList.remove("shake");
    }

    function createZukan() {
        // 毎回生成して訪問済みバッジをつけるため、isZukanCreated判定を緩和するか、ここでclass更新する
        zukanGrid.innerHTML = "";
        const visited = JSON.parse(localStorage.getItem("zukan_visited") || "[]");
        
        poops.forEach(poop => {
            const item = document.createElement("div");
            item.className = "zukan-item";
            
            // 未発見ならシルエットにするなどの処理も可能だが、今回はすべて表示しつつ「New」などをつけないシンプルな形
            // 達成条件は内部データ(localStorage)で判定済み

            const icon = document.createElement("div");
            icon.className = "zukan-poop-icon";
            setPoopStyle(icon, poop);

            const name = document.createElement("h3");
            name.className = "zukan-poop-name";
            name.textContent = poop.name;

            const msg = document.createElement("p");
            msg.className = "zukan-poop-message";
            msg.textContent = poop.message;

            // 訪問済みマーク（任意実装、今回はシンプルにリストのみ）
            if (visited.includes(poop.name)) {
                // 既に持っていることがわかるようにスタイルを変えても良い
                item.style.borderColor = "#FFD54F";
                item.style.backgroundColor = "#FFFDE7";
            }

            item.appendChild(icon);
            item.appendChild(name);
            item.appendChild(msg);
            zukanGrid.appendChild(item);
        });
        isZukanCreated = true;
    }

    // --- イベントリスナー ---

    // 「うらなう」ボタン
    startButton.addEventListener("click", () => {
        const bgm = document.getElementById("bgm-sound");
        if (bgm) bgm.volume = 0.5;
        playSound("bgm-sound");
        startScreen.style.display = "none";
        gameContainer.style.display = "block";
    });

    // ガチャハンドル
    newGachaHandle.addEventListener("click", () => {
        if (!isGachaSpinning) {
            isGachaSpinning = true;
            playSound("turn-sound");
            gachaMachineSvg.classList.add("shake");
            newGachaHandle.classList.add("rotate");

            newGachaHandle.addEventListener("animationend", () => {
                playSound("drop-sound");
                capsule.classList.add("drop");
            }, { once: true });
        }
    });

    // カプセル落下後
    capsule.addEventListener("animationend", (e) => {
        if (e.animationName === "drop-capsule") {
            gachaMachineSvg.classList.remove("shake");
            capsule.classList.add("openable");
        }
    });

    // カプセル開封
    capsule.addEventListener("click", () => {
        if (capsule.classList.contains("openable")) {
            playSound("reveal-sound");
            displayResult(choosePoop());
            gachaView.style.display = "none";
            resultView.style.display = "flex";
        }
    });

    // 「もう一度うらなう」ボタン
    playAgainButton.addEventListener("click", resetGame);

    // 「タイトルへもどる」ボタン
    backToTitleButton.addEventListener("click", () => {
        gameContainer.style.display = "none";
        startScreen.style.display = "block";
        resetGame();
    });

    // 「うんちずかん」ボタン
    zukanButton.addEventListener("click", () => {
        startScreen.style.display = "none";
        zukanContainer.style.display = "block";
        createZukan();
    });

    // 図鑑の「もどる」ボタン
    backToGameButton.addEventListener("click", () => {
        zukanContainer.style.display = "none";
        startScreen.style.display = "block";
    });
}