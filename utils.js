/* utils.js: 共通関数 */

// 音を再生する関数
function playSound(id) {
    const audio = document.getElementById(id);
    if (audio) {
        if (id !== "bgm-sound") {
            audio.currentTime = 0;
        }
        audio.play().catch(e => { /* 自動再生ブロック対策 */ });
    }
}

// うんちのスタイル（色やキラキラ）を適用する関数
function setPoopStyle(container, poopData) {
    container.classList.remove("sparkle-effect");
    
    if (poopData.color.startsWith("linear-gradient")) {
        const gradientId = "rainbow-gradient-" + Math.random().toString(36).substring(2, 9);
        const rainbowSVG = `<svg viewBox="0 0 100 100" width="1em" height="1em"><defs>
            <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:red;"/><stop offset="20%" style="stop-color:orange;"/><stop offset="40%" style="stop-color:yellow;"/><stop offset="60%" style="stop-color:green;"/><stop offset="80%" style="stop-color:blue;"/><stop offset="100%" style="stop-color:violet;"/></linearGradient></defs><g class="poop-body"><path fill="url(#${gradientId})" d="M50,95 C15,95 10,75 25,65 C15,60 20,38 40,40 C35,40 40,25 50,20 C60,25 65,40 60,40 C80,40 85,60 75,65 C90,80 85,95 50,95 Z"></path></g><g class="poop-face" fill="#5C3C20" stroke="none"><circle cx="38" cy="55" r="5"></circle><circle cx="62" cy="55" r="5"></circle><path d="M42 72 Q 50 82, 58 72" stroke="#5C3C20" stroke-width="4" fill="none" stroke-linecap="round"></path></g></svg>`;
        container.innerHTML = rainbowSVG;
    } else {
        container.innerHTML = poopSVGwithFace;
        const poopBody = container.querySelector(".poop-body");
        poopBody.style.webkitTextStroke = "";
        poopBody.style.textStroke = "";
        
        if (poopData.name === "とうめいな うんち") {
            poopBody.style.color = "transparent";
            poopBody.style.webkitTextStroke = "2px #a1887f";
            poopBody.style.textStroke = "2px #a1887f";
        } else {
            poopBody.style.color = poopData.color;
        }
    }
    
    if (poopData.isSparkle) {
        container.classList.add("sparkle-effect");
    }
}