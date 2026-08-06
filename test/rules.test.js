const fs=require("fs");
const html=fs.readFileSync(__dirname+"/../index.html","utf8");
const js=html.split("<script>")[1].split("</script>")[0];
const core=js.split("/* ==================== 状態 ====================")[0];
const mod={};
new Function("exports", core+"\nObject.assign(exports,{initState,cl,isLegal,applyMove,allMoves,destsFrom,attacksFrom,dropOk,mustPromo,moveInfo,suggest,mkey,bookNext,coverage,givesCheck,inCheck,attackedBy,leavesKingTaken,kingSq,xOf,yOf,fileOf,rankOf,BOOK,NM});")(mod);
const M=mod;
let fail=0;
const ok=(c,msg)=>{ if(!c){console.log("NG "+msg);fail++;} else console.log("ok "+msg); };

// --- 1. 初期局面の合法手は30通り ---
let st=M.initState();
const first=M.allMoves(st);
ok(first.length===30, "初期局面の合法手 = "+first.length+" (期待 30)");

// --- 2. 定跡7ラインが全部最後まで合法か ---
const key2m=k=>({from:{x:M.xOf(+k[0]),y:M.yOf(+k[1])},to:{x:M.xOf(+k[2]),y:M.yOf(+k[3])},promote:k.length>4});
M.BOOK.forEach((line,li)=>{
  let s=M.initState(), bad=null;
  line.forEach((k,i)=>{ if(bad!==null)return; const m=key2m(k); if(!M.isLegal(s,m)){bad=i;return;} M.applyMove(s,m); });
  ok(bad===null, "定跡ライン"+li+" 全"+line.length+"手が合法"+(bad!==null?" (NG at "+(bad+1)+"手目 "+line[bad]+")":""));
});

// --- 3. 二歩・行き所のない駒 ---
st=M.initState();
ok(!M.dropOk(st,"FU",0,4), "二歩は打てない(9筋に歩あり)");
ok(M.mustPromo("KE",0,1)&&M.mustPromo("FU",0,0)&&!M.mustPromo("GI",0,0), "行き所のない駒の判定");

// --- 4. 「同」の表記 ---
// ▲7六歩 △3四歩 ▲2二角成 △同銀
st=M.initState();
const seq=["7776","3334","8822+","3122"];
let prevTo=null, disp=[];
for(const k of seq){ const m=key2m(k); const inf=M.moveInfo(st,m,prevTo); disp.push(inf.disp+"|"+inf.kif); M.applyMove(st,m); prevTo=m.to; }
ok(disp[2].startsWith("２二角成"), "3手目 = "+disp[2]);
ok(disp[3].startsWith("同銀"), "4手目 = "+disp[3]);
ok(disp[3].split("|")[1]==="同　銀(31)", "4手目KIF = "+disp[3].split("|")[1]);

// --- 5. 王手判定 ---
st=M.initState();
for(const k of ["7776","3334","8822+"]) { M.applyMove(st,key2m(k)); }
// 2二馬は後手の玉(5一)に王手ではない
ok(!M.givesCheck(st,0), "２二角成は王手ではない");

// --- 6. suggest: 取りかえしが最上位に来るか ---
// ▲7六歩 △3四歩 ▲2二角成 のあと、後手は同銀 or 同飛? 2二には先手の馬
st=M.initState(); prevTo=null;
for(const k of ["7776","3334","8822+"]){ const m=key2m(k); M.applyMove(st,m); prevTo=m.to; }
let sg=M.suggest(st,{prevTo,ply:3,limit:5});
let top=sg.map(m=>M.moveInfo(st,m,prevTo).disp);
ok(top[0]==="同銀"||top[0]==="同飛", "取りかえしが1番目: "+JSON.stringify(top));

// --- 7. suggest: 序盤の定跡が上位に出るか ---
st=M.initState();
sg=M.suggest(st,{prevTo:null,ply:0,bookSet:new Set(M.bookNext([])),limit:3});
top=sg.map(m=>M.moveInfo(st,m,null).disp);
ok(top.includes("７六歩"), "初手の3択に▲７六歩: "+JSON.stringify(top));

// --- 8. suggest: 同じ駒ばかり並ばない（ひとつの駒から2手まで） ---
st=M.initState();
sg=M.suggest(st,{prevTo:null,ply:0,limit:12});
const byFrom={};
for(const m of sg){ const k=m.from.x+","+m.from.y; byFrom[k]=(byFrom[k]||0)+1; }
ok(Object.values(byFrom).every(v=>v<=2), "候補は1つの駒から2手まで: "+JSON.stringify(byFrom));

// --- 9. suggest: あとの手との辻褄（穴うめ） ---
// 局面: 初期。実際の3手目は ▲2二角成、4手目 △同銀 が入っているとき、
// 3手目の穴に入るべきは ▲2二角成のみ（△同銀=31→22 が成立する手）
st=M.initState();
for(const k of ["7776","3334"]) M.applyMove(st,key2m(k));
const rest=[{k:"m",...key2m("3122")}];
sg=M.suggest(st,{prevTo:key2m("3334").to,ply:2,rest,limit:3});
top=sg.map(m=>M.moveInfo(st,m,key2m("3334").to).disp);
ok(top[0]==="２二角成", "穴うめ候補の1番目 = "+JSON.stringify(top));

// --- 10. 玉を取る手が候補の先頭に来るか（王手放置のあと） ---
// ▲7六歩 △3四歩 ▲2二角成 △4二玉 ▲7五歩 △3三玉（玉を取られる場所へ）
st=M.initState(); prevTo=null;
for(const k of ["7776","3334","8822+","5142","7675","4233"]){ const m=key2m(k); M.applyMove(st,m); prevTo=m.to; }
sg=M.suggest(st,{prevTo,ply:6,limit:3});
top=sg.map(m=>M.moveInfo(st,m,prevTo).disp);
ok(top[0]==="同馬", "玉を取る手が1番目: "+JSON.stringify(top));
{
  const m=sg[0], cap=st.b[m.to.y][m.to.x];
  ok(cap&&cap.t==="OU", "その手は玉を取っている: "+(cap?M.NM[cap.t]:"なし"));
}

// --- 11. 王手されているとき、玉が取られる手を勧めないか ---
// 後手玉5二に先手金4二の王手。ほかに後手の飛8二と歩たち。
{
  const b=(f,r)=>[M.yOf(r),M.xOf(f)];
  st=M.initState();
  for(let y=0;y<9;y++)for(let x=0;x<9;x++) st.b[y][x]=null;
  const put=(f,r,t,side,pr)=>{const[y,x]=b(f,r); st.b[y][x]={t,s:side,p:!!pr};};
  put(5,2,"OU",1); put(4,2,"KI",0);       // 後手玉と、王手している先手の金
  put(5,9,"OU",0);                         // 先手玉
  put(8,2,"HI",1); put(9,4,"KY",1); put(8,4,"FU",1);
  put(2,4,"KA",0,true);                    // 先手の馬（4二の金を支える）
  st.t=1;
  ok(M.inCheck(st,1), "後手は王手をかけられている");
  const cand=M.suggest(st,{ply:44,limit:12});
  const disp=cand.map(m=>M.moveInfo(st,m,null).disp);
  const top3=cand.slice(0,3);
  const bad=top3.filter(m=>{
    const s2=M.cl(st); M.applyMove(s2,m);
    return M.givesCheck(s2,0);             // 指したあとも後手玉が取られる
  });
  ok(bad.length===0, "3択に玉が取られる手がない: "+JSON.stringify(disp.slice(0,3)));
  const all=cand.filter(m=>{
    const s2=M.cl(st); M.applyMove(s2,m); return M.givesCheck(s2,0);
  });
  ok(all.length<cand.length, "王手を解く手が候補に含まれる（"+(cand.length-all.length)+"手）");
}

// --- 12. 速度 ---
st=M.initState();
for(const k of M.BOOK[1]) if(M.isLegal(st,key2m(k))) M.applyMove(st,key2m(k));
let t0=Date.now(); for(let i=0;i<20;i++) M.suggest(st,{ply:14,limit:12}); let ms=(Date.now()-t0)/20;
ok(ms<40, "suggest 1回 = "+ms.toFixed(1)+"ms");

console.log(fail? "\n=== FAIL "+fail+" ===" : "\n=== ALL PASS ===");
process.exit(fail?1:0);
