/* アイコンを作りなおすスクリプト。
   駒の形（五角形）に「棋」を書いたものを PNG で書き出す。
   canvas で描いて撮るので Playwright が要る:
     npm i playwright && node tools/make-icons.js                     */
"use strict";
const path=require("path");
const {chromium}=require("playwright");

const OUT=path.join(__dirname,"..");
const SIZES=[
  {file:"icon-192.png",        size:192, koma:0.86},
  {file:"icon-512.png",        size:512, koma:0.86},
  {file:"apple-touch-icon.png",size:180, koma:0.86},
  // maskable は四隅を切られるので、駒を中央の安全圏に収める
  {file:"icon-512-maskable.png",size:512, koma:0.60}
];

const page=(size,koma)=>`<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;padding:0}canvas{display:block}</style>
<canvas id="c" width="${size}" height="${size}"></canvas>
<script>
const S=${size}, K=${koma};
const g=document.getElementById("c").getContext("2d");
g.fillStyle="#EFE7D6"; g.fillRect(0,0,S,S);
const w=S*K, h=S*K*1.04, cx=S/2, cy=S/2, hw=w/2, hh=h/2;
g.save(); g.translate(cx,cy);
g.beginPath();
g.moveTo(0,-hh);
g.lineTo(hw*0.72,-hh*0.62);
g.lineTo(hw,hh);
g.lineTo(-hw,hh);
g.lineTo(-hw*0.72,-hh*0.62);
g.closePath(); g.restore();
const grad=g.createLinearGradient(cx,cy-hh,cx,cy+hh);
grad.addColorStop(0,"#F7E8BE"); grad.addColorStop(1,"#E6CE94");
g.fillStyle=grad; g.fill();
g.strokeStyle="#8A6A34"; g.lineWidth=S*0.012; g.stroke();
g.fillStyle="#241C12";
g.font="600 "+Math.round(h*0.56)+'px "Hiragino Mincho ProN","Yu Mincho","Noto Serif JP",serif';
g.textAlign="center"; g.textBaseline="middle";
g.fillText("棋",cx,cy+h*0.03);
</script>`;

(async()=>{
  const exe=process.env.CHROME_PATH;             // 環境によっては実行ファイルを指定する
  const b=await chromium.launch(exe?{executablePath:exe}:{});
  for(const s of SIZES){
    const ctx=await b.newContext({viewport:{width:s.size,height:s.size},deviceScaleFactor:1});
    const p=await ctx.newPage();
    await p.setContent(page(s.size,s.koma));
    await p.locator("#c").screenshot({path:path.join(OUT,s.file)});
    await ctx.close();
    console.log(s.file,s.size+"x"+s.size);
  }
  await b.close();
})();
