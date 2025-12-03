/* rank.js: ウンチーランク管理ロジック */

const RANK_DATA = [
    { level: 12, name: "うんち みならい", color: "#333333", req: 0, poopColor: "#36454F" }, // 黒
    { level: 11, name: "うんち しんじん", color: "#FDD835", req: 5, poopColor: "#FDD835" }, // 黄色
    { level: 10, name: "うんち たんとう", color: "#1E88E5", req: 15, poopColor: "#1E88E5" }, // 青
    { level: 9, name: "うんち かかり", color: "#E53935", req: 30, poopColor: "#E53935" }, // 赤
    { level: 8, name: "うんち リーダー", color: "#87CEEB", req: 50, poopColor: "#87CEEB" }, // 水色
    { level: 7, name: "うんち かちょう", color: "#FFC0CB", req: 75, poopColor: "#FFC0CB" }, // ピンク
    { level: 6, name: "うんち ぶちょう", color: "#2E8B57", req: 100, poopColor: "#2E8B57" }, // 緑
    { level: 5, name: "うんち めいじん", color: "#8B4513", req: 130, poopColor: "#8B4513" }, // 茶色
    { level: 4, name: "うんち はかせ", color: "#9E9E9E", req: 170, poopColor: "transparent" }, // 透明
    { level: 3, name: "うんち プロ", color: "#9C27B0", req: 210, poopColor: "linear-gradient(45deg,red,orange,yellow,green,blue,indigo,violet)" }, // 虹色
    { level: 2, name: "うんち しゃちょう", color: "#C0C0C0", req: 250, poopColor: "#C0C0C0" }, // 銀
    { level: 1, name: "うんち マスター", color: "#FFD700", req: 300, poopColor: "#FFD700" } // 金
];

const ACHIEVEMENTS = [
    // 💩 うんち うらない ガチャ
    { id: "gacha_first", title: "はじめての占い", points: 1, desc: "ガチャを1回まわす" },
    { id: "gacha_pink", title: "ピンクうんちGET", points: 5, desc: "ピンクのうんちを出す" },
    { id: "gacha_red", title: "あかうんちGET", points: 5, desc: "あかいうんちを出す" },
    { id: "gacha_transparent", title: "とうめいうんちGET", points: 10, desc: "とうめいなうんちを出す" },
    { id: "gacha_rare", title: "キラキラうんち", points: 15, desc: "金または銀のうんちを出す" },
    { id: "gacha_rainbow", title: "にじいろの奇跡", points: 20, desc: "にじいろのうんちを出す" },
    { id: "gacha_col5", title: "うんちコレクター", points: 14, desc: "図鑑を5種類うめる" },
    { id: "gacha_comp", title: "うんちコンプリート", points: 40, desc: "図鑑を全12種類うめる" },

    // 👐 しんけん しらうんちどり
    { id: "shinken_catch", title: "キャッチ成功", points: 3, desc: "うんちをキャッチする" },
    { id: "shinken_normal", title: "ふつうでキャッチ", points: 7, desc: "難易度ふつうで成功" },
    { id: "shinken_fast", title: "はやいでキャッチ", points: 15, desc: "難易度はやいで成功" },

    // 🌋 うんち だいばくはつ
    { id: "exp_play", title: "はじめての爆発", points: 2, desc: "だいばくはつを遊ぶ" },
    { id: "exp_200", title: "200個突破", points: 3, desc: "1回で200個以上飛ばす" },
    { id: "exp_500", title: "500個突破", points: 5, desc: "1回で500個以上飛ばす" },
    { id: "exp_1000", title: "連打のオニ", points: 20, desc: "1回で1000個以上飛ばす" },

    // 💡 はやおし うんち
    { id: "haya_lv1", title: "レベル1クリア", points: 3, desc: "はやおし レベル1クリア" },
    { id: "haya_lv2", title: "レベル2クリア", points: 5, desc: "はやおし レベル2クリア" },
    { id: "haya_lv3", title: "レベル3クリア", points: 10, desc: "はやおし レベル3クリア" },
    { id: "haya_lv4", title: "レベル4クリア", points: 20, desc: "はやおし レベル4クリア" },
    { id: "haya_lv5", title: "レベル5クリア", points: 52, desc: "はやおし レベル5クリア" },

    // 🟣 デカうんち へのみち
    { id: "deka_100", title: "大きさ100", points: 3, desc: "サイズ100を超える" },
    { id: "deka_300", title: "大きさ300", points: 7, desc: "サイズ300を超える" },
    { id: "deka_eat10", title: "おなかいっぱい", points: 10, desc: "てきのうんちを10体食べる" },
    { id: "deka_clear_easy", title: "かんたんクリア", points: 5, desc: "かんたんモードクリア" },
    { id: "deka_clear_hard", title: "むずかしいクリア", points: 15, desc: "むずかしいモードクリア" }, // 追加
    { id: "deka_master", title: "デカうんちマスター", points: 20, desc: "サイズ500達成でクリア" },

    // 💣 うんち たいほう
    { id: "bazooka_lv1", title: "レベル1クリア", points: 2, desc: "たいほう レベル1クリア" },
    { id: "bazooka_lv3", title: "レベル3クリア", points: 5, desc: "たいほう レベル3クリア" },
    { id: "bazooka_lv5", title: "レベル5クリア", points: 8, desc: "たいほう レベル5クリア" },
    { id: "bazooka_lv7", title: "レベル7クリア", points: 15, desc: "たいほう レベル7クリア" },

    // その他
    { id: "misc_welcome", title: "うんちワールドへ", points: 1, desc: "ゲームを開く" },
    { id: "misc_sound", title: "サウンドチェック", points: 1, desc: "音量ボタンを押す" },
    { id: "misc_manual", title: "あそびかたチェック", points: 3, desc: "あそびかたを見る" },
    { id: "misc_zukan", title: "ずかんをみる", points: 5, desc: "うんちずかんを見る" }
];

let unlockedAchievements = [];
let claimedAchievements = []; // ポイント回収済みリスト

function initRank() {
    // 達成済みデータ読み込み
    const saved = localStorage.getItem("unchi_achievements");
    if (saved) {
        unlockedAchievements = JSON.parse(saved);
    }

    // 回収済みデータ読み込み
    const savedClaimed = localStorage.getItem("unchi_claimed_achievements");
    if (savedClaimed) {
        claimedAchievements = JSON.parse(savedClaimed);
    }

    // 初回起動アチーブメント
    unlockAchievement("misc_welcome");

    // UIイベント設定
    const rankButton = document.getElementById("rank-button");
    const rankContainer = document.getElementById("rank-container");
    const backButton = document.getElementById("back-to-title-from-rank");
    const startScreen = document.getElementById("start-screen");

    // リセットボタン
    const resetRankBtn = document.getElementById("reset-rank-btn");
    if (resetRankBtn) {
        resetRankBtn.addEventListener("click", () => {
            if (confirm("ほんとうに リストを リセットしますか？\n（かくとくした ウンチーも なくなります）")) {
                resetAchievements();
            }
        });
    }

    if (rankButton) {
        rankButton.addEventListener("click", () => {
            playSound("bgm-sound");
            startScreen.style.display = "none";
            rankContainer.style.display = "flex"; // flexでレイアウト
            renderRankScreen();
        });
    }

    if (backButton) {
        backButton.addEventListener("click", () => {
            rankContainer.style.display = "none";
            startScreen.style.display = "block";
        });
    }

    // 他のボタン監視（アチーブメント用）
    const soundBtn = document.getElementById("sound-toggle");
    if (soundBtn) {
        soundBtn.addEventListener("click", () => unlockAchievement("misc_sound"));
    }
    const manualBtn = document.getElementById("how-to-play-btn");
    if (manualBtn) {
        manualBtn.addEventListener("click", () => unlockAchievement("misc_manual"));
    }
    const zukanBtn = document.getElementById("zukan-button");
    if (zukanBtn) {
        zukanBtn.addEventListener("click", () => unlockAchievement("misc_zukan"));
    }
}

// リセット処理
function resetAchievements() {
    unlockedAchievements = [];
    claimedAchievements = [];
    localStorage.removeItem("unchi_achievements");
    localStorage.removeItem("unchi_claimed_achievements");
    
    // 初期アチーブメント再付与
    unlockAchievement("misc_welcome");
    
    renderRankScreen();
    alert("リストを リセットしました！");
}

function unlockAchievement(id) {
    if (!unlockedAchievements.includes(id)) {
        unlockedAchievements.push(id);
        localStorage.setItem("unchi_achievements", JSON.stringify(unlockedAchievements));
    }
}

// ポイント回収処理（クリック時）
function claimPoints(id) {
    if (!claimedAchievements.includes(id)) {
        // 現在のランクを保存
        const oldRank = getCurrentRank();
        
        claimedAchievements.push(id);
        localStorage.setItem("unchi_claimed_achievements", JSON.stringify(claimedAchievements));
        
        // 新しいランクを取得
        const newRank = getCurrentRank();
        
        // ランクアップ判定 (レベルの値が小さくなるほど上位ランク)
        if (newRank.level < oldRank.level) {
            triggerRankUpEffect();
        } else {
            playSound("catch-sound"); // 通常回収音
        }
        
        renderRankScreen(); // 画面更新
    }
}

// ランクアップ演出
function triggerRankUpEffect() {
    playSound("reveal-sound"); // ランクアップ音
    
    const rankContainer = document.getElementById("rank-container");
    rankContainer.classList.add("rank-up-shake");
    
    // 紙吹雪エフェクト (簡易的)
    createConfetti(rankContainer);

    // アニメーション終了後にクラス削除
    setTimeout(() => {
        rankContainer.classList.remove("rank-up-shake");
    }, 1000);
}

// 簡易的な紙吹雪エフェクト
function createConfetti(container) {
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement("div");
        confetti.className = "confetti";
        confetti.style.left = Math.random() * 100 + "%";
        confetti.style.top = "-10px";
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        confetti.style.animationDuration = (Math.random() * 1 + 1) + "s";
        container.appendChild(confetti);
        
        // アニメーション後に削除
        setTimeout(() => {
            confetti.remove();
        }, 2000);
    }
}

function getTotalPoints() {
    let total = 0;
    ACHIEVEMENTS.forEach(ach => {
        // 回収済みのものだけ計算対象
        if (claimedAchievements.includes(ach.id)) {
            total += ach.points;
        }
    });
    return total;
}

function getCurrentRank() {
    const total = getTotalPoints();
    const sortedRanks = [...RANK_DATA].sort((a, b) => a.level - b.level); // 1, 2...
    
    for (const rank of sortedRanks) {
        if (total >= rank.req) {
            return rank;
        }
    }
    return RANK_DATA.find(r => r.level === 12); // フォールバック
}

function renderRankScreen() {
    const totalPoints = getTotalPoints();
    const currentRank = getCurrentRank();
    
    // 左カラム更新
    const rankIcon = document.getElementById("rank-current-icon");
    const rankName = document.getElementById("rank-current-name");
    const rankLevel = document.getElementById("rank-current-level");
    const scoreVal = document.getElementById("rank-score-value");
    
    // アイコン（うんちのスタイル適用）
    const poopData = {
        color: currentRank.poopColor,
        isSparkle: (currentRank.level <= 3) // 上位ランクはキラキラ
    };
    if(currentRank.poopColor === "transparent") {
        poopData.name = "とうめいな うんち";
    } else {
        poopData.name = "";
    }
    
    setPoopStyle(rankIcon, poopData);
    
    rankName.textContent = currentRank.name;
    rankName.style.color = currentRank.color;
    rankLevel.textContent = `ランク ${currentRank.level}`;
    scoreVal.textContent = totalPoints;

    // 右カラム（リスト）更新
    const listContainer = document.getElementById("rank-list");
    listContainer.innerHTML = "";

    // ゲーム名のマッピング
    const gameNames = {
        "gacha": "うんち うらない ガチャ",
        "shinken": "しんけん しらうんちどり",
        "exp": "うんち だいばくはつ",
        "haya": "はやおし うんち",
        "deka": "デカうんち へのみち",
        "bazooka": "うんち たいほう",
        "misc": "その他"
    };

    ACHIEVEMENTS.forEach(ach => {
        const isUnlocked = unlockedAchievements.includes(ach.id);
        const isClaimed = claimedAchievements.includes(ach.id);
        
        const item = document.createElement("div");
        
        let className = "rank-list-item";
        if (isClaimed) {
            className += " claimed";
        } else if (isUnlocked) {
            className += " unlocked"; // 未回収だが達成済み（黄色）
            // クリックイベント付与
            item.onclick = () => claimPoints(ach.id);
            item.style.cursor = "pointer";
            item.title = "タップしてウンチーをゲット！";
        } else {
            className += " locked";
        }
        item.className = className;
        
        const prefix = ach.id.split('_')[0];
        const gameName = gameNames[prefix] || "";
        const descText = gameName ? `「${gameName}」<br>${ach.desc}` : ach.desc;

        item.innerHTML = `
            <div class="rank-item-info">
                <div class="rank-item-title">${ach.title}</div>
                <div class="rank-item-desc">${descText}</div>
            </div>
            <div class="rank-item-points">${ach.points} ウンチー</div>
        `;
        listContainer.appendChild(item);
    });
}