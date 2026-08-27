const P = require("pureimage");
const fs = require("fs");
const path = require("path");

const FONT = "/root/.npm/_npx/8b377f6eec906bc4/node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf";
const FAM = "Geist";

const COL = {
  greenXD: "#0E3322", greenD: "#13402C", green: "#1B5E20", greenL: "#2E7D32",
  gold: "#C9A227", goldL: "#E3C766", cream: "#FBF9F4", card: "#FFFFFF",
  ink: "#1C2B26", mute: "#6E7A72", line: "#E2DDD0", white: "#FFFFFF", soft: "#EAF1EA",
  bgc: "#F3EFE5",
};
function hexToRgb(h){h=h.replace("#","");return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function rgbToHex(r){return "#"+r.map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,"0")).join("");}
function mix(c1,c2,t){const a=hexToRgb(c1),b=hexToRgb(c2);return rgbToHex([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]);}
function tint(color,base,t){return mix(color,base,1-t);} // strength t

function circle(ctx,x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function vGrad(ctx,w,h,top,bottom){for(let y=0;y<h;y++){ctx.fillStyle=mix(top,bottom,y/h);ctx.fillRect(0,y,w,1);}}
function roundRect(ctx,x,y,w,h,r,color){ctx.fillStyle=color;ctx.fillRect(x+r,y,w-2*r,h);ctx.fillRect(x,y+r,w,h-2*r);circle(ctx,x+r,y+r,r);circle(ctx,x+w-r,y+r,r);circle(ctx,x+r,y+h-r,r);circle(ctx,x+w-r,y+h-r,r);}
function softBlob(ctx,cx,cy,r,color,base,strength){
  for(let i=18;i>0;i--){const rr=r*i/18;ctx.fillStyle=tint(color,base,strength*(i/18)*0.5);circle(ctx,cx,cy,rr);}
}
function text(ctx,str,x,y,size,color,align){ctx.fillStyle=color;ctx.font=size+"px "+FAM;ctx.textAlign=align||"left";ctx.fillText(str,x,y);ctx.textAlign="left";}

const OUT = path.join(__dirname, "proposal", "assets");
fs.mkdirSync(OUT, { recursive: true });

function enc(name,img){return P.encodePNGToStream(img,fs.createWriteStream(path.join(OUT,name)));}
function bgCover(){
  const w=1333,h=750,img=P.make(w,h),c=img.getContext("2d");
  vGrad(c,w,h,COL.greenXD,COL.greenD);
  softBlob(c,w-260,-200,460,COL.gold,COL.greenD,0.5);
  softBlob(c,-150,h-260,380,COL.greenL,COL.greenD,0.4);
  return enc("bg-cover.png",img);
}
function bgContent(){
  const w=1333,h=750,img=P.make(w,h),c=img.getContext("2d");
  vGrad(c,w,h,COL.cream,COL.bgc);
  softBlob(c,w-230,-200,360,COL.gold,COL.bgc,0.35);
  softBlob(c,-140,h-230,320,COL.greenL,COL.bgc,0.28);
  return enc("bg-content.png",img);
}
function bgGreen(){
  const w=1333,h=750,img=P.make(w,h),c=img.getContext("2d");
  vGrad(c,w,h,COL.greenD,COL.greenXD);
  softBlob(c,w-260,-200,440,COL.gold,COL.greenD,0.45);
  return enc("bg-green.png",img);
}
function bgDark(){
  const w=1333,h=750,img=P.make(w,h),c=img.getContext("2d");
  vGrad(c,w,h,COL.greenXD,COL.greenD);
  softBlob(c,w-260,-200,460,COL.gold,COL.greenD,0.5);
  softBlob(c,-150,h-260,380,COL.greenL,COL.greenD,0.4);
  return enc("bg-dark.png",img);
}

/* ---------- mock app screens (900x600) ---------- */
function header(c,t,sub){c.fillStyle=COL.greenD;c.fillRect(0,0,900,86);softBlob(c,820,-30,160,COL.greenL,COL.greenD,0.5);text(c,t,32,38,26,COL.white);if(sub)text(c,sub,32,66,15,COL.goldL);c.fillStyle=COL.gold;c.beginPath();c.arc(840,43,22,0,7);c.fill();text(c,"A",834,50,18,COL.greenD);}
function cardW(c,x,y,w,h){roundRect(c,x,y,w,h,12,COL.card);c.strokeStyle=COL.line;c.lineWidth=1;}
function screen(name,draw){
  const w=900,h=600,img=P.make(w,h),c=img.getContext("2d");
  c.fillStyle=COL.cream;c.fillRect(0,0,w,h);
  draw(c);
  return enc("shot-"+name+".png",img);
}
function shotDashboard(){
  screen("dashboard",c=>{
    header(c,"Dashboard","Ringkasan kunjungan hari ini");
    const stats=[["Hari Ini","24",COL.green],["Besok","18",COL.gold],["Minggu Ini","142",COL.greenL],["Terlambat","3",COL.greenD]];
    stats.forEach((s,i)=>{const x=32+i*212;roundRect(c,x,108,188,120,14,COL.card);c.strokeStyle=COL.line;c.lineWidth=1;c.stroke();c.fillStyle=s[2];c.beginPath();c.arc(x+28,150,18,0,7);c.fill();text(c,s[0],x+24,196,16,COL.mute);text(c,s[1],x+24,236,30,COL.ink);});
    text(c,"Kunjungan Hari Ini",32,272,18,COL.ink);
    for(let i=0;i<4;i++){const y=296+i*64;roundRect(c,32,y,836,52,10,COL.white);c.strokeStyle=COL.line;c.lineWidth=1;c.stroke();c.fillStyle=COL.gold;c.beginPath();c.arc(64,y+26,14,0,7);c.fill();text(c,["Blok A-12 · Pemupukan","Blok C-04 · Pestisida","Blok B-09 · Panen","Blok D-02 · Inspeksi"][i],92,y+33,15,COL.ink);text(c,["08:00 · Febri","10:30 · Akbar","13:00 · Sinta","15:30 · Dedi"][i],560,y+33,13,COL.mute);}
  });
}
function shotSchedules(){
  screen("schedules",c=>{
    header(c,"Jadwal","Daftar kunjungan & filter");
    const chips=["Semua","Hari Ini","Besok","Minggu Ini"];
    chips.forEach((ch,i)=>{const x=32+i*150;roundRect(c,x,108,138,38,19,i===1?COL.green:COL.card);c.strokeStyle=i===1?COL.green:COL.line;c.lineWidth=1;c.stroke();text(c,ch,x+18,133,13,i===1?COL.white:COL.mute);});
    for(let i=0;i<5;i++){const y=164+i*82;roundRect(c,32,y,836,70,12,COL.card);c.strokeStyle=COL.line;c.lineWidth=1;c.stroke();roundRect(c,48,y+14,52,42,8,COL.soft);text(c,["22","23","24","25","26"][i],58,y+42,16,COL.greenD);text(c,["Mei","Mei","Mei","Mei","Mei"][i],56,y+30,10,COL.mute);text(c,["Blok A-12 · Pemupukan","Blok C-04 · Pestisida","Blok B-09 · Panen","Blok D-02 · Inspeksi","Blok E-07 · Pupuk"][i],120,y+30,15,COL.ink);text(c,["08:00","10:30","13:00","15:30","09:15"][i],120,y+50,12,COL.mute);roundRect(c,690,y+22,150,28,14,COL.soft);text(c,["Menunggu","Disetujui","Selesai","Menunggu","Ditolak"][i],710,y+41,12,COL.green);}
  });
}
function shotVisit(){
  screen("visit",c=>{
    header(c,"Kunjungan","Validasi GPS & bukti foto");
    c.fillStyle="#DCE8DE";c.fillRect(32,108,836,300);
    for(let i=0;i<6;i++){c.strokeStyle="#C2D2C6";c.lineWidth=10;c.beginPath();c.moveTo(60+i*140,108);c.lineTo(120+i*120,408);c.stroke();}
    c.strokeStyle="#CBD8CE";c.lineWidth=14;c.beginPath();c.moveTo(32,250);c.lineTo(868,250);c.stroke();
    c.fillStyle=COL.greenD;c.beginPath();c.arc(470,230,18,0,7);c.fill();c.strokeStyle=COL.white;c.lineWidth=4;c.beginPath();c.arc(470,230,10,0,7);c.stroke();
    text(c,"Lokasi tervalidasi  ·  Akurasi 4 m",360,400,13,COL.mute);
    roundRect(c,32,430,260,140,12,COL.card);c.strokeStyle=COL.line;c.lineWidth=1;c.stroke();text(c,"Foto Bukti",52,460,15,COL.ink);c.fillStyle=COL.soft;c.fillRect(52,478,220,76);c.strokeStyle=COL.gold;c.setLineDash&&c.setLineDash([]);text(c,"📷",140,525,28,COL.gold);
    text(c,"Timeline Aktivitas",320,460,15,COL.ink);
    const tl=["08:00  Tiba di lokasi","08:10  Foto & catatan","08:25  Selesai"];
    tl.forEach((t,i)=>{const y=482+i*30;c.fillStyle=COL.gold;c.beginPath();c.arc(330,y+6,6,0,7);c.fill();text(c,t,348,y+11,13,COL.ink);});
  });
}
function shotReports(){
  screen("reports",c=>{
    header(c,"Laporan","Rekap & grafik per petugas");
    const bars=[120,200,160,90,150];const max=200;const bx=80;const bw=110;
    bars.forEach((b,i)=>{const bh=b/max*230;roundRect(c,bx+i*(bw+24),360-bh,bw,bh,8,COL.green);text(c,["A","B","C","D","E"][i],bx+i*(bw+24)+bw/2-6,388,13,COL.mute);});
    text(c,"Jumlah Kunjungan per Petugas",32,330,15,COL.ink);
    roundRect(c,700,108,168,470,12,COL.card);c.strokeStyle=COL.line;c.lineWidth=1;c.stroke();text(c,"Per Petugas",720,140,14,COL.ink);
    for(let i=0;i<5;i++){const y=170+i*74;text(c,["Febri","Akbar","Sinta","Dedi","Rina"][i],720,y+18,14,COL.ink);c.fillStyle=COL.soft;c.fillRect(720,y+34,128,8);c.fillStyle=COL.gold;c.fillRect(720,y+34,[0.8,0.6,0.9,0.5,0.7][i]*128,8);}
  });
}
function shotLahan(){
  screen("lahan",c=>{
    header(c,"Pengajuan Lahan","Alur persetujuan terpandu");
    const steps=["Ajukan","Review","Persetujuan","Jadwal"];
    steps.forEach((s,i)=>{const x=80+i*200;c.fillStyle=i<3?COL.green:COL.card;c.beginPath();c.arc(x,150,26,0,7);c.fill();if(i<3){c.strokeStyle=COL.gold;c.lineWidth=3;c.beginPath();c.arc(x,150,26,0,7);c.stroke();}text(c,String(i+1),x-7,158,18,COL.white);text(c,s,x-40,200,14,COL.ink);if(i<3){c.strokeStyle=COL.line;c.lineWidth=4;c.beginPath();c.moveTo(x+26,150);c.lineTo(x+200-26,150);c.stroke();}});
    text(c,"Detail Pengajuan",32,260,16,COL.ink);
    const rows=["Lokasi  ·  Blok E-07, Kebun Sawit","Luas  ·  12,5 Ha","Tanam  ·  Kelapa Sawit","Foto  ·  3 terlampir"];
    rows.forEach((r,i)=>{const y=290+i*54;roundRect(c,32,y,836,44,10,COL.white);c.strokeStyle=COL.line;c.lineWidth=1;c.stroke();c.fillStyle=COL.gold;c.beginPath();c.arc(56,y+22,8,0,7);c.fill();text(c,r,80,y+28,14,COL.ink);});
    roundRect(c,32,524,836,52,10,COL.soft);text(c,"Status: Menunggu persetujuan Admin / QC",52,556,15,COL.greenD);
  });
}

(async()=>{
  const f=P.registerFont(FONT,FAM); await f.load();
  await Promise.all([bgCover(),bgContent(),bgGreen(),bgDark(),shotDashboard(),shotSchedules(),shotVisit(),shotReports(),shotLahan()]);
  console.log("assets written to",OUT);
})();
