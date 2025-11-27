/* data.js: データと定数 */

const poopSVGwithFace = `<svg viewBox="0 0 100 100" width="1em" height="1em"><g class="poop-body"><path fill="currentColor" d="M50,95 C15,95 10,75 25,65 C15,60 20,38 40,40 C35,40 40,25 50,20 C60,25 65,40 60,40 C80,40 85,60 75,65 C90,80 85,95 50,95 Z"></path></g><g class="poop-face" fill="#5C3C20" stroke="none"><circle cx="38" cy="55" r="5"></circle><circle cx="62" cy="55" r="5"></circle><path d="M42 72 Q 50 82, 58 72" stroke="#5C3C20" stroke-width="4" fill="none" stroke-linecap="round"></path></g></svg>`;

const poops = [
    { name: "金の うんち", color: "#FFD700", fortune: "ちょう 大きち", fortuneClass: "fortune-daikichi", message: "さいきょうの きんうん！ たからくじを かうなら きょうしかない！", weight: 8, isSparkle: true },
    { name: "ぎんの うんち", color: "#C0C0C0", fortune: "大きち", fortuneClass: "fortune-daikichi", message: "キラリと かがやく うん！ すてきな であいが あるかも？", weight: 4, isSparkle: true },
    { name: "にじいろの うんち", color: "linear-gradient(45deg,red,orange,yellow,green,blue,indigo,violet)", fortune: "ミラクル 大きち", fortuneClass: "fortune-daikichi", message: "きせきが おこる よかん！ すべての ねがいが かなうかも！？", weight: 5, isSparkle: true },
    { name: "とうめいな うんち", color: "transparent", fortune: "ふしぎな きぶん", fortuneClass: "fortune-shokichi", message: "そんざいかんが きえるかも？ だれにも きづかれず、いたずらしほうだい！", weight: 7 },
    { name: "げんきな ちゃいろの うんち", color: "#8B4513", fortune: "きち", fortuneClass: "fortune-kichi", message: "こころも からだも げんき！ おだやかで へいわな 一日。", weight: 25 },
    { name: "みどりの うんち", color: "#2E8B57", fortune: "ちゅうきち", fortuneClass: "fortune-chukichi", message: "けんこううん アップ！ やさいを たべると さらに よいことが。", weight: 12 },
    { name: "ピンクの うんち", color: "#FFC0CB", fortune: "れんあい 大きち", fortuneClass: "fortune-daikichi", message: "れんあいうんが さいこう！ すきな ひとに アタックしてみては？", weight: 8 },
    { name: "みずいろの うんち", color: "#87CEEB", fortune: "しょうきち", fortuneClass: "fortune-shokichi", message: "スッキリ さわやかな 一日。 わすれものに ちゅういしよう。", weight: 15 },
    { name: "あかい うんち", color: "#E53935", fortune: "ちゅうきち", fortuneClass: "fortune-chukichi", message: "やるきが もりもり わいてくる！ スポーツを すると いいかも！", weight: 10 },
    { name: "あおい うんち", color: "#1E88E5", fortune: "しょうきち", fortuneClass: "fortune-shokichi", message: "あたまが スッキリ！ べんきょうや どくしょに むいている日。", weight: 10 },
    { name: "きいろい うんち", color: "#FDD835", fortune: "きち", fortuneClass: "fortune-kichi", message: "ともだちと なかよく できる！ えがおで あいさつしてみよう！", weight: 13 },
    { name: "くろい うんち", color: "#36454F", fortune: "きょう", fortuneClass: "fortune-kyo", message: "ちょっと つかれぎみ？ きょうは ゆっくり 休もう。", weight: 10 }
];