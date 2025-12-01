/* shinken.js: しんけんしらうんちどりのロジック */

function initShinken() {
    const startScreen = document.getElementById("start-screen");
    const shinkenContainer = document.getElementById('shinken-container');
    const shinkenButton = document.getElementById('shinken-button');
    const shinkenStartBtn = document.getElementById('shinken-start-btn');
    const shinkenActionBtn = document.getElementById('shinken-action-btn');
    const backToTitleFromShinken = document.getElementById('back-to-title-from-shinken');
    const whitePoop = document.getElementById('white-poop');
    const shinkenMessage = document.getElementById('shinken-message');
    const catcherHands = document.getElementById('catcher-hands');
    
    const diffButtons = document.querySelectorAll('.diff-btn');

    let shinkenState = 'idle'; // idle, waiting, dropping, result
    let dropTimer, reactionTimer;
    let currentDropSpeed = 0.3; // デフォルト: はやい

    // 白うんちの見た目をセット
    whitePoop.innerHTML = poopSVGwithFace;

    // --- 関数定義 ---

    function resetShinkenUI() {
        shinkenState = 'idle';
        shinkenStartBtn.style.display = 'block';
        shinkenStartBtn.style.margin = '10px auto';
        
        // Uボタンを非表示
        shinkenActionBtn.style.display = 'none';
        
        shinkenMessage.textContent = 'スタートをおしてね';
        shinkenMessage.style.color = '#fff';
        
        // 待機中も上の方に見えるように配置
        whitePoop.style.transition = 'none';
        whitePoop.style.top = '10px'; 
        
        catcherHands.textContent = '✋　　✋';
    }

    function resetShinken() {
        clearTimeout(dropTimer);
        clearTimeout(reactionTimer);
        resetShinkenUI();
    }

    function successShinken() {
        clearTimeout(reactionTimer);
        shinkenState = 'result';

        // キャッチ演出
        catcherHands.textContent = '✊';
        whitePoop.style.transition = 'none';
        whitePoop.style.top = '140px'; // 位置固定

        shinkenMessage.textContent = 'キャッチせいこう!!';
        shinkenMessage.style.color = '#FFD700'; // 金色で見やすく
        playSound("reveal-sound");

        setTimeout(resetShinkenUI, 2000);
    }

    function failShinken(reason) {
        clearTimeout(dropTimer);
        clearTimeout(reactionTimer);
        shinkenState = 'result';

        if (reason === 'false_start') {
            shinkenMessage.textContent = 'お手つき...';
        } else {
            // missed: しっぱい
            shinkenMessage.textContent = 'しっぱい...';
            // アニメーションは継続して下に落ちる
            
            catcherHands.textContent = '🤕';
            playSound("drop-sound");
        }
        shinkenMessage.style.color = '#ddd'; // 明るいグレー

        setTimeout(resetShinkenUI, 2000);
    }

    function dropPoop() {
        shinkenState = 'dropping';
        shinkenMessage.textContent = '';
        
        // 画面外(400px)まで一気に落とすアニメーション
        const timeMultiplier = 1.5; 
        const totalTime = currentDropSpeed * timeMultiplier;

        whitePoop.style.transition = `top ${totalTime}s ease-in`;
        whitePoop.style.top = '400px'; 
        playSound("drop-sound");

        // 見逃し判定
        const reactionTimeMs = (currentDropSpeed * 1000) + 100;
        
        reactionTimer = setTimeout(() => {
            if (shinkenState === 'dropping') {
                failShinken('missed');
            }
        }, reactionTimeMs);
    }

    function handleShinkenAction() {
        if (shinkenActionBtn.style.display === 'none') return;

        if (shinkenState === 'waiting') {
            failShinken('false_start');
        } else if (shinkenState === 'dropping') {
            successShinken();
        }
    }

    // --- イベントリスナー ---

    // 難易度選択
    diffButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (shinkenState !== 'idle') return;
            
            diffButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            
            currentDropSpeed = parseFloat(btn.getAttribute('data-speed'));
        });
    });

    // スタート画面からの遷移
    shinkenButton.addEventListener('click', () => {
        playSound("bgm-sound");
        startScreen.style.display = 'none';
        shinkenContainer.style.display = 'block';
        resetShinken();
    });

    // タイトルへ戻る
    backToTitleFromShinken.addEventListener('click', () => {
        shinkenContainer.style.display = 'none';
        startScreen.style.display = 'block';
        resetShinken();
    });

    // ゲームスタート
    shinkenStartBtn.addEventListener('click', () => {
        if (shinkenState !== 'idle') return;
        shinkenState = 'waiting';
        shinkenMessage.textContent = 'しゅうちゅう...';
        shinkenMessage.style.color = '#fff';
        shinkenStartBtn.style.display = 'none';
        
        shinkenActionBtn.style.display = 'inline-flex';

        // 一度画面外へ隠す
        whitePoop.style.transition = 'top 0.2s ease-out';
        whitePoop.style.top = '-100px';

        // 2〜5秒後に落下
        const waitTime = Math.random() * 3000 + 2000;
        dropTimer = setTimeout(dropPoop, waitTime);
    });

    // Uボタンクリック
    shinkenActionBtn.addEventListener('click', handleShinkenAction);

    // キーボード操作
    document.addEventListener('keydown', (e) => {
        if (shinkenContainer.style.display === 'block' && (e.key === 'u' || e.key === 'U')) {
            handleShinkenAction();
        }
    });
}