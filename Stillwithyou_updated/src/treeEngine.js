// Tree drawing engine - ported from original vanilla JS

const BARK_DARK  = '#3e2408';
const BARK_MID   = '#6b4220';
const BARK_LIGHT = '#9a6830';
const GREENS = ['#1e6810','#2e820e','#3e9818','#52aa28','#6abf38','#84cf50','#a0dc70'];
const PINKS  = ['#f8d0dc','#f4b0c8','#ee90b0','#fce8f0'];
const REDS   = ['#b81010','#d82020','#ee3828','#f05040'];

let _seed = 1;
function rng() { _seed = (_seed * 1664525 + 1013904223) >>> 0; return _seed / 4294967296; }
function rseed(n) { _seed = (n >>> 0) || 1; }

function drawLeaf(ctx, x, y, size, angle, colour) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const lg = ctx.createLinearGradient(0, 0, 0, -size);
  lg.addColorStop(0,   colour || GREENS[3]);
  lg.addColorStop(0.5, GREENS[Math.floor(rng() * 3) + 2]);
  lg.addColorStop(1,   GREENS[0]);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-size*.42,-size*.28,-size*.38,-size*.72,0,-size);
  ctx.bezierCurveTo( size*.42,-size*.28, size*.38,-size*.72,0, 0);
  ctx.fillStyle = lg; ctx.fill();
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-size);
  ctx.strokeStyle='rgba(15,70,8,.5)'; ctx.lineWidth=0.85; ctx.stroke();
  for (let i = 1; i <= 3; i++) {
    const py = -size * i * 0.25;
    const vl = size * 0.32 * (1 - i * 0.22);
    ctx.beginPath();
    ctx.moveTo(0,py); ctx.quadraticCurveTo(-vl*.7,py-size*.06,-vl,py-size*.09);
    ctx.moveTo(0,py); ctx.quadraticCurveTo( vl*.7,py-size*.06, vl,py-size*.09);
    ctx.strokeStyle='rgba(15,70,8,.32)'; ctx.lineWidth=0.65; ctx.stroke();
  }
  ctx.restore();
}

function leafCluster(ctx, x, y, n, size, baseAngle, type) {
  for (let i = 0; i < n; i++) {
    const spread = 1.9;
    const a  = baseAngle + (i/(n-1) - 0.5)*spread + (rng()-0.5)*0.28;
    const d  = size * 0.42 * (rng()*0.6 + 0.7);
    const lx = x + Math.cos(a)*d;
    const ly = y - Math.sin(a)*d;
    const ls = size * (0.75 + rng()*0.5);
    drawLeaf(ctx, lx, ly, ls, a - Math.PI/2, GREENS[Math.floor(rng()*GREENS.length)]);
    if (type === 'blossom' && rng() > 0.44) drawBlossom(ctx, lx, ly, ls*0.46);
    if (type === 'apple'   && rng() > 0.46) {
      drawApple(ctx, lx+(rng()-0.5)*ls*0.6, ly+ls*0.42+rng()*ls*0.3, ls*0.42);
    }
    if (type === 'mixed') {
      if (rng() > 0.62) {
        drawApple(ctx, lx+(rng()-0.5)*ls*0.58, ly+ls*0.40+rng()*ls*0.28, ls*0.38);
      }
      if (rng() > 0.74) {
        drawBlossom(ctx, lx+(rng()-0.5)*ls*0.30, ly-ls*0.10, ls*0.36);
      }
    }
  }
}

function drawBlossom(ctx, x, y, r) {
  for (let i = 0; i < 5; i++) {
    const a = (i/5)*Math.PI*2;
    ctx.beginPath();
    ctx.ellipse(x+Math.cos(a)*r*.68, y+Math.sin(a)*r*.68, r*.68, r*.42, a, 0, Math.PI*2);
    ctx.fillStyle = PINKS[Math.floor(rng()*PINKS.length)];
    ctx.globalAlpha=0.9; ctx.fill(); ctx.globalAlpha=1;
    ctx.strokeStyle='rgba(210,90,130,.28)'; ctx.lineWidth=0.55; ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(x,y,r*.32,0,Math.PI*2);
  ctx.fillStyle='#fffae0'; ctx.fill();
  ctx.beginPath(); ctx.arc(x,y,r*.16,0,Math.PI*2);
  ctx.fillStyle='#e8c040'; ctx.fill();
}

function drawApple(ctx, x, y, r) {
  const ag = ctx.createRadialGradient(x-r*.3,y-r*.3,r*.04,x+r*.1,y+r*.1,r*1.1);
  ag.addColorStop(0,'#ff8878');
  ag.addColorStop(0.4,REDS[Math.floor(rng()*REDS.length)]);
  ag.addColorStop(1,'#780808');
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fillStyle=ag; ctx.fill();
  ctx.beginPath(); ctx.arc(x,y-r+r*0.22,r*0.22,0,Math.PI*2);
  ctx.fillStyle='rgba(0,0,0,.17)'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(x-r*.28,y-r*.28,r*.26,r*.18,-0.5,0,Math.PI*2);
  ctx.fillStyle='rgba(255,255,255,.5)'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(x,y-r);
  ctx.quadraticCurveTo(x+r*.35,y-r*1.55,x+r*.12,y-r*1.62);
  ctx.strokeStyle='#3a2008'; ctx.lineWidth=1.4; ctx.lineCap='round'; ctx.stroke();
  ctx.save(); ctx.translate(x+r*.18,y-r*1.46);
  drawLeaf(ctx, 0,0,r*0.55,-0.4,'#52aa28'); ctx.restore();
}

function drawBranch(ctx, x1,y1,angle,length,width,depth,maxDepth,leafSz,type) {
  if (length < 4 || width < 0.6) return;
  const x2 = x1 + Math.cos(angle)*length;
  const y2 = y1 - Math.sin(angle)*length;
  const bg = ctx.createLinearGradient(x1,y1,x2,y2);
  bg.addColorStop(0,   depth===0?BARK_MID:BARK_DARK);
  bg.addColorStop(0.5, depth===0?BARK_LIGHT:BARK_MID);
  bg.addColorStop(1,   BARK_DARK);
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
  ctx.strokeStyle=bg; ctx.lineWidth=Math.max(0.8,width);
  ctx.lineCap='round'; ctx.stroke();
  if (depth >= maxDepth) {
    leafCluster(ctx, x2,y2,4+Math.floor(rng()*4),leafSz,angle,type);
    return;
  }
  const splits = (depth<2 && maxDepth>3) ? 3 : 2;
  const fan    = 0.48 + depth*0.05;
  for (let i=0;i<splits;i++) {
    const da = splits===1 ? 0 : (i/(splits-1)-0.5)*fan*2;
    drawBranch(ctx, x2,y2,angle+da+(rng()-0.5)*0.12,length*(0.65+rng()*0.08),width*(0.60+rng()*0.06),depth+1,maxDepth,leafSz,type);
  }
}

function stage1(ctx, CX, GY) {
  rseed(11); const bx=CX,by=GY;
  const sg=ctx.createRadialGradient(bx,by,0,bx,by,38);
  sg.addColorStop(0,'rgba(90,50,14,.42)'); sg.addColorStop(1,'rgba(90,50,14,0)');
  ctx.beginPath(); ctx.ellipse(bx,by,34,9,0,0,Math.PI*2); ctx.fillStyle=sg; ctx.fill();
  ctx.beginPath();
  ctx.ellipse(bx, by - 10, 11, 14, 0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#8a5a24';
  ctx.fill();
  ctx.strokeStyle = '#5c3712';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx + 2, by + 3);
  ctx.bezierCurveTo(bx + 6, by + 12, bx - 2, by + 17, bx + 4, by + 25);
  ctx.strokeStyle = '#8d6d3a';
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function stage2(ctx, CX, GY) {
  rseed(22); const bx=CX,by=GY;
  ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(bx,by-72);
  ctx.strokeStyle='#4a8828'; ctx.lineWidth=3.5; ctx.lineCap='round'; ctx.stroke();
  ctx.save(); ctx.translate(bx,by-50); drawLeaf(ctx,-12,-6,36,-Math.PI*0.62,'#70ba38'); ctx.restore();
  ctx.save(); ctx.translate(bx,by-50); drawLeaf(ctx,12,-6,36,-Math.PI*0.38,'#88cc48'); ctx.restore();
  ctx.save(); ctx.translate(bx,by-74); drawLeaf(ctx,0,0,24,-Math.PI/2,'#a0dc60'); ctx.restore();
}

function stage3(ctx, CX, GY) {
  rseed(33); const bx=CX,by=GY;
  ctx.beginPath(); ctx.moveTo(bx,by); ctx.quadraticCurveTo(bx-3,by-70,bx+1,by-126);
  const tg=ctx.createLinearGradient(bx-8,by,bx+8,by);
  tg.addColorStop(0,BARK_DARK); tg.addColorStop(0.4,BARK_LIGHT); tg.addColorStop(1,BARK_DARK);
  ctx.strokeStyle=tg; ctx.lineWidth=9; ctx.lineCap='round'; ctx.stroke();
  drawBranch(ctx,bx,by-120,Math.PI/2+0.62,54,5.5,0,2,22,'blossom');
  drawBranch(ctx,bx,by-120,Math.PI/2-0.62,54,5.5,0,2,22,'blossom');
}

function stage4(ctx, CX, GY) {
  rseed(44); const bx=CX,by=GY;
  ctx.save();
  ctx.translate(bx, by);
  ctx.scale(0.7, 0.7);
  ctx.translate(-bx, -by);
  ctx.beginPath(); ctx.moveTo(bx,by); ctx.quadraticCurveTo(bx-3,by-76,bx+2,by-148);
  const tg=ctx.createLinearGradient(bx-10,by,bx+10,by);
  tg.addColorStop(0,BARK_DARK); tg.addColorStop(0.4,BARK_LIGHT); tg.addColorStop(1,BARK_DARK);
  ctx.strokeStyle=tg; ctx.lineWidth=11; ctx.lineCap='round'; ctx.stroke();
  drawBranch(ctx,bx,by-140,Math.PI/2+0.72,72,6.5,0,3,24,'apple');
  drawBranch(ctx,bx,by-140,Math.PI/2-0.72,72,6.5,0,3,24,'apple');
  ctx.restore();
}

function stage5(ctx, CX, GY) {
  rseed(55); const bx=CX,by=GY;
  ctx.save();
  ctx.translate(bx, by);
  ctx.scale(0.62, 0.62);
  ctx.translate(-bx, -by);
  for (let pass=0;pass<2;pass++) {
    ctx.beginPath(); ctx.moveTo(bx+(pass?9:-9),by);
    ctx.bezierCurveTo(bx+(pass?11:-11),by-98,bx+(pass?4:-4),by-186,bx+(pass?1:-1),by-250);
    const tg=ctx.createLinearGradient(bx-24,by,bx+24,by);
    tg.addColorStop(0,BARK_DARK); tg.addColorStop(0.35,pass?BARK_LIGHT:BARK_MID); tg.addColorStop(1,BARK_DARK);
    ctx.strokeStyle=tg; ctx.lineWidth=pass?24:22; ctx.lineCap='round'; ctx.stroke();
  }
  for (let i=0;i<7;i++) {
    ctx.beginPath(); ctx.moveTo(bx-9+i*3,by-36-i*32);
    ctx.quadraticCurveTo(bx-6+i*2,by-76-i*32,bx-3+i*2.8,by-114-i*32);
    ctx.strokeStyle='rgba(14,3,0,.14)'; ctx.lineWidth=1.45; ctx.stroke();
  }
  [
    [bx-2,by-244,Math.PI/2+0.93,124,12],[bx+2,by-244,Math.PI/2-0.93,124,12],
    [bx,by-246,Math.PI/2+0.50,109,11],  [bx,by-246,Math.PI/2-0.46,109,11],
    [bx,by-248,Math.PI/2+0.22,96,10],   [bx,by-248,Math.PI/2-0.18,96,10],
    [bx,by-250,Math.PI/2,84,9],
    [bx-8,by-208,Math.PI/2+1.12,72,7],  [bx+8,by-206,Math.PI/2-1.12,72,7]
  ].forEach(b => drawBranch(ctx,b[0],b[1],b[2],b[3],b[4],0,3,20,'mixed'));
  ctx.restore();
}

function stage6(ctx, CX, GY) {
  rseed(66); const bx=CX,by=GY;
  ctx.save();
  ctx.translate(bx, by);
  ctx.scale(0.56, 0.56);
  ctx.translate(-bx, -by);
  for (let pass=0;pass<2;pass++) {
    ctx.beginPath(); ctx.moveTo(bx+(pass?9:-9),by);
    ctx.bezierCurveTo(bx+(pass?11:-11),by-98,bx+(pass?4:-4),by-186,bx+(pass?1:-1),by-250);
    const tg=ctx.createLinearGradient(bx-24,by,bx+24,by);
    tg.addColorStop(0,BARK_DARK); tg.addColorStop(0.35,pass?BARK_LIGHT:BARK_MID); tg.addColorStop(1,BARK_DARK);
    ctx.strokeStyle=tg; ctx.lineWidth=pass?24:22; ctx.lineCap='round'; ctx.stroke();
  }
  [
    [bx-2,by-244,Math.PI/2+0.93,124,12],[bx+2,by-244,Math.PI/2-0.93,124,12],
    [bx,by-246,Math.PI/2+0.50,109,11],  [bx,by-246,Math.PI/2-0.46,109,11],
    [bx,by-248,Math.PI/2+0.22,96,10],   [bx,by-248,Math.PI/2-0.18,96,10],
    [bx,by-250,Math.PI/2,84,9],
    [bx-8,by-208,Math.PI/2+1.12,72,7],  [bx+8,by-206,Math.PI/2-1.12,72,7]
  ].forEach(b => drawBranch(ctx,b[0],b[1],b[2],b[3],b[4],0,3,18,'mixed'));
  ctx.restore();
}

const STAGE_FNS = [null, stage1, stage2, stage3, stage4, stage5, stage6];

export function animateGrow(canvas, n) {
  if (!canvas || !STAGE_FNS[n]) return;
  const ctx = canvas.getContext('2d');
  const CW = canvas.width;
  const CH = canvas.height;
  const CX = CW / 2;
  const GY = CH - 6;

  let rafId = null;
  const t0 = performance.now();
  const dur = 900;

  function frame(now) {
    const elapsed = now - t0;
    const p = Math.min(1, elapsed / dur);
    const ease = 1 - Math.pow(1 - p, 3.5);
    ctx.clearRect(0, 0, CW, CH);
    ctx.save();
    ctx.translate(CX, GY); ctx.scale(ease, ease); ctx.translate(-CX, -GY);
    rseed(n * 11);
    STAGE_FNS[n](ctx, CX, GY);
    ctx.restore();
    if (p < 1) {
      rafId = requestAnimationFrame(frame);
    } else {
      // Ensure final state is drawn and persists
      ctx.clearRect(0, 0, CW, CH);
      rseed(n * 11);
      STAGE_FNS[n](ctx, CX, GY);
    }
  }

  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(frame);
}
