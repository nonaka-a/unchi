/* main.js: メインエントリーポイント */

document.addEventListener("DOMContentLoaded", () => {
    // ランク機能の初期化
    initRank();
    
    // 各ゲームの初期化関数を呼び出し
    initGacha();
    initShinken();
    initExplosion();
    initDekaUnchi();
    initHayaoshi(); 
    initBazooka(); 

    // トップ画面のうんち表示
    const startPoopContainer = document.getElementById("start-poop-container");
    if (startPoopContainer) {
        try {
            if (typeof poops === 'undefined') {
                throw new Error("poops data is missing");
            }
            // ランダムに5つ選ぶ
            const shuffled = [...poops].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 5);

            selected.forEach(poop => {
                const el = document.createElement("div");
                el.className = "mini-poop";
                setPoopStyle(el, poop); // utils.jsの関数を使用
                startPoopContainer.appendChild(el);
            });
        } catch (e) {
            console.error("Start screen poop error:", e);
            startPoopContainer.textContent = "💩"; // Fallback
        }
    }

    // サウンド切り替えボタンの共通ロジック
    // グローバルコントロールの機能実装
    const soundToggle = document.getElementById("sound-toggle");
    const allSounds = document.querySelectorAll("audio");
    const zoomInBtn = document.getElementById("zoom-in-btn");
    const zoomOutBtn = document.getElementById("zoom-out-btn");
    const fullscreenBtn = document.getElementById("fullscreen-btn");
    const mainWrapper = document.querySelector(".main-wrapper");

    // サウンド切り替え
    soundToggle.addEventListener("click", () => {
        const isMuted = !allSounds[0].muted;
        allSounds.forEach(audio => {
            audio.muted = isMuted;
        });
        // 音符マークのまま、ミュート時は不透明度を下げるなどの視覚的フィードバック
        soundToggle.style.opacity = isMuted ? "0.5" : "1";
    });

    // ズーム機能
    let currentZoom = 1.0;
    const ZOOM_STEP = 0.1;
    const MAX_ZOOM = 2.0;
    const MIN_ZOOM = 0.5;

    function applyZoom() {
        mainWrapper.style.transform = `scale(${currentZoom})`;
        // ズームの中心を画面中央上に設定（必要に応じて調整）
        mainWrapper.style.transformOrigin = "top center";
        // ズーム時にレイアウトが崩れないようにマージン調整が必要な場合があるが、
        // 今回はシンプルにscaleのみ適用。
    }

    zoomInBtn.addEventListener("click", () => {
        if (currentZoom < MAX_ZOOM) {
            currentZoom += ZOOM_STEP;
            applyZoom();
        }
    });

    zoomOutBtn.addEventListener("click", () => {
        if (currentZoom > MIN_ZOOM) {
            currentZoom -= ZOOM_STEP;
            applyZoom();
        }
    });

    // フルスクリーン機能
    fullscreenBtn.addEventListener("click", () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    });

    // あそびかたモーダルの制御
    const howToPlayBtn = document.getElementById("how-to-play-btn");
    const howToPlayModal = document.getElementById("how-to-play-modal");
    const closeModalSpan = document.querySelector(".close-modal");

    if (howToPlayBtn && howToPlayModal && closeModalSpan) {
        howToPlayBtn.addEventListener("click", () => {
            howToPlayModal.style.display = "flex";

            // あそびかたアイコンの描画
            const instructionIcons = document.querySelectorAll(".instruction-icon");
            instructionIcons.forEach(icon => {
                const idx = parseInt(icon.getAttribute("data-poop-idx"), 10);
                if (!isNaN(idx) && poops[idx]) {
                    // すでに描画済みかチェック（簡易的）
                    if (!icon.hasChildNodes()) {
                        setPoopStyle(icon, poops[idx]);
                    }
                }
            });
        });

        closeModalSpan.addEventListener("click", () => {
            howToPlayModal.style.display = "none";
        });

        window.addEventListener("click", (event) => {
            if (event.target === howToPlayModal) {
                howToPlayModal.style.display = "none";
            }
        });
    }
});