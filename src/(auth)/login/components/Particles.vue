<!--
  TopoBg — fundo animado sem dependências.

  USO:   <div class="hero"> <TopoBg profile="quiet-grid" :config="{ colorA: '#ff6b5e' }" /> ...conteúdo... </div>

  O fundo cobre SOMENTE o elemento pai (não a página). Ao montar, o componente garante no pai
  position: relative (se estiver static) e isolation: isolate, e se coloca atrás do conteúdo (z-index -1).
  Os valores originais do pai são restaurados ao desmontar.

  PROPS
    config     Object  {}      Valores que sobrescrevem qualquer chave de DEFAULTS (parcial). Reativo.
    profile    String  ''      Nome de um perfil de PROFILES: valores fixos + faixas aleatórias. '' = sem perfil.
    randomSeed Number  null    Torna a aleatorização do perfil reproduzível. null = aleatório a cada montagem.
  Prioridade: DEFAULTS < profile.fixed < profile.ranges/choices (sorteio) < config.
-->
<template>
  <div ref="root" class="topo-bg" aria-hidden="true">
    <canvas ref="el"></canvas>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck -- animação de canvas escrita em JS; tipar quando for mexer nela
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

function resolveColor(value) {
  // Se for um hexadecimal, usa diretamente.
  if (value.startsWith('#')) return value

  // Se for o nome de uma variável CSS, resolve o valor.
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--${value}`)
    .trim() || '#00B4F1'
}


// ---------------------------------------------------------------------------
// DEFAULTS: todas as opções, com valor padrão e valores aceitos.
// ---------------------------------------------------------------------------
const DEFAULTS = {
  bg: "#141416", // cor de fundo, variavel de cor
  colorA: "#00B4F1", // cor inicial do degradê, variavel de cor
  colorB: "#398A49", // cor final do degradê, variavel de cor
  mode: "topo", // efeito: 'topo' (curvas de nível) | 'grid' (plano de pontos 3D) | 'trunk' (anéis)
  show: "dots", // o que desenhar: 'both' | 'lines' | 'dots'
  levels: 4, // 4–60 · nº de curvas (topo) ou anéis (trunk)
  scale: 1, // 0.2–4 · escala do relevo (maior = feições menores)
  octaves: 2, // 1–4 · camadas de ruído (mais = mais detalhe)
  speed: 0.25, // 0–3 · velocidade do deslocamento do relevo
  angle: 45, // 0–360 · direção do deslocamento (graus)
  morph: 0.25, // 0–2 · velocidade de transformação do relevo
  width: 1, // 0.3–4 · espessura das linhas (px)
  dot: 0.7, // 0.4–5 · raio dos pontos (px)
  opacity: 0.8, // 0.1–1 · opacidade geral
  cell: 40, // 5–40 · espaçamento entre pontos (px); menor = mais denso e mais pesado
  amp: 0.5, // 0–1.5 · intensidade do relevo (grid/trunk)
  camPreset: "over", // 'over'|'top'|'low'|'custom' · só usado pelo painel do gerador; o motor ignora
  pitch: 35, // 5–90 · inclinação da câmera em graus, 90 = vista de cima (grid)
  camY: 1.3, // 0.2–3 · altura da câmera (grid)
  camZ: -0.5, // posição da câmera na profundidade; negativo = atrás do plano (grid)
  zoom: 1, // 0.5–2.5 · zoom da câmera (grid)
  fly: 0.15, // 0–3 · velocidade de avanço da câmera (grid); 0 = parado
  xs: 3, // 1–8 · meia-largura do plano (grid)
  zs: 5, // 2–12 · profundidade do plano (grid)
  mouse: "on", // 'on' | 'off' · linhas do cursor até os pontos próximos (hover)
  mouseDist: 95, // 40–400 · alcance do hover (px)
  floatCount: 92, // 0–300 · nº de partículas flutuantes; 0 = nenhuma
  floatSize: 1.6, // 0.5–6 · tamanho das partículas (px)
  floatSpeed: 1, // 0–5 · velocidade das partículas
  floatLinks: "on", // 'on' | 'off' · liga partículas próximas entre si
  floatLinkDist: 80, // 30–300 · distância máxima da ligação (px)
  floatLinkWidth: 0.6, // 0.2–3 · espessura da ligação (px)
  cx: 0.5, // 0–1 · centro X dos anéis, fração da largura (trunk)
  cy: 0.5, // 0–1 · centro Y dos anéis, fração da altura (trunk)
  fade: 0.5, // 0–1 · esmaecer as bordas com a cor de fundo
  indexEvery: 0, // 0–10 · linha-mestra mais grossa a cada N linhas; 0 = desligado
  seed: 7, // inteiro · semente do ruído (muda o desenho do relevo)
}

// ---------------------------------------------------------------------------
// PROFILES: perfis de aleatorização (nenhum criado ainda). Formato de cada perfil:
//   'nome': {
//     fixed:   { mode: 'grid', show: 'both' },       // valores fixos (sobrescrevem DEFAULTS)
//     ranges:  { amp: [0.3, 0.6], levels: [10, 20] }, // [min, max]; inteiros se ambos forem inteiros
//     choices: { angle: [0, 90, 180, 270] }          // sorteia um item da lista
//   }
// Se o perfil não definir 'seed', o relevo também é sorteado.
// ---------------------------------------------------------------------------
const PROFILES = {
  "clean-flying-points": {
    fixed: {
      mode:"topo",
      show: "dots",
      cell: 40,
      mouse: "on",
      mouseDist: 150,
      floatLinkWidth: 1,
      fade: 1,
      floatLinkDist: 100,
      floatSpeed: 0.3,
    },
    ranges: {
      scale: [0.1, 0.5],
      octaves: [1, 2],
      speed: [0, 0.15],
      morph: [0, 0.25],
      dot: [0, 1.2],
      opacity: [0.5, 1],
      floatCount: [25, 100],
      floatSize: [1.5, 2],
    },
  },

  "grid": {
    fixed: {
      mode: "grid",   
      mouse: "off",
      floatCount: 0,
    },
    ranges: {
      scale: [0.7, 1.5],
      amp: [0.5, 0.8],
      width: [0.3, 1.3],
      dot: [2.5, 3],
      opacity: [0.7, 1],
      cell: [5, 15],
      zoom: [0.5, 2],
      xs: [1, 3],
      zs: [3, 7],
      speed: [0.2, 0.7],
      angle: [0, 365],
    },
    choices: {
      show: ["both", "lines", "dots"],
      camPreset: ['over', 'top', 'low'],
    }
  },
  
  "ring": {
    fixed: {
      mode: "trunk",
      mouse: "off",
      floatLinks: "on",
      floatLinkWidth: 0.5,
      speed: 0.5,
      pitch: 35,
    },
    ranges: {
      levels: [5, 15],
      scale: [0.2, 3],
      octaves: [1, 2],
      width: [0.5, 1.8],
      dot: [1, 1.9],
      angle: [0, 365],
      morph: [0.5, 1.25],
      opacity: [0.25, 0.75],
      cell: [5, 40],
      amp: [0.25, 0.5],
      floatSize:[0.5, 1],
      floatSpeed:[0.2, 1],
      floatLinkDist: [50, 100],
      fade: [0, 0.5],
      indexEvery: [0, 5],
    },
    choices: {
      show: ["both", "lines"],
      cx: [0, 0.5, 1],
      cy: [0, 0.5, 1],
      floatCount: [0, 0, 0, 25, 50]
    }
  },
}


function getCSSColor(colorVar) {
  const hex = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${colorVar}`)
    .trim()

  return hex
}

// ---------------------------------------------------------------------------
// CAMERA_PRESETS: atalhos escolhidos por camPreset. Cada um define pitch, camY, camZ e zoom.
// Valores passados explicitamente (em config ou no perfil) têm prioridade sobre o preset.
// ---------------------------------------------------------------------------
const CAMERA_PRESETS = {"over":{"pitch":35,"camY":1.3,"camZ":-0.5,"zoom":1},"top":{"pitch":90,"camY":2.4,"camZ":2.5,"zoom":1},"low":{"pitch":8,"camY":0.35,"camZ":-0.4,"zoom":1}}

/** PRNG determinístico (mulberry32): mesma semente -> mesma sequência em [0,1). */
function mulberry32(a) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 }
}

/** Sorteia um valor em [min, max]; arredonda se ambos os limites forem inteiros. */
function pick(range, rnd) {
  const v = range[0] + rnd() * (range[1] - range[0])
  return Number.isInteger(range[0]) && Number.isInteger(range[1]) ? Math.round(v) : +v.toFixed(3)
}

/** Monta a configuração final: DEFAULTS < perfil fixo < sorteio do perfil < overrides. */
function resolveConfig(profileName, overrides, randomSeed) {
  const prof = PROFILES[profileName]
  if (profileName && !prof) console.warn('[TopoBg] perfil desconhecido: ' + profileName)
  const rnd = randomSeed == null ? Math.random : mulberry32(randomSeed)
  const out = { ...DEFAULTS, ...(prof && prof.fixed) }
  if (prof) {
    for (const k in prof.ranges || {}) out[k] = pick(prof.ranges[k], rnd)
    for (const k in prof.choices || {}) out[k] = prof.choices[k][Math.floor(rnd() * prof.choices[k].length)]
    if (!('seed' in (prof.ranges || {})) && !('seed' in (prof.fixed || {}))) out.seed = 1 + Math.floor(rnd() * 9998)
  }
  // Preset de câmera: preenche pitch/camY/camZ/zoom, exceto o que o perfil ou o config definiram.
  const set = new Set([...Object.keys((prof && prof.fixed) || {}), ...Object.keys((prof && prof.ranges) || {}), ...Object.keys((prof && prof.choices) || {}), ...Object.keys(overrides)])
  const cam = CAMERA_PRESETS[overrides.camPreset || out.camPreset]
  if (cam) for (const k in cam) if (!set.has(k)) out[k] = cam[k]
  return { ...out, ...overrides }
}

const props = defineProps({
  /** Sobrescritas parciais das opções (veja DEFAULTS). Mudanças são aplicadas ao vivo. */
  config: { type: Object, default: () => ({}) },
  /** Nome do perfil de aleatorização (chave de PROFILES). */
  profile: { type: String, default: '' },
  /** Semente da aleatorização do perfil (Number) ou null para aleatório. */
  randomSeed: { type: Number, default: null }
})

const root = ref(null) // wrapper absoluto que cobre o elemento pai
const el = ref(null)   // canvas
const cfg = resolveConfig(props.profile, props.config, props.randomSeed) // objeto lido pelo motor a cada quadro
let stop, parent, prevPos, prevIso

// Aplica mudanças de config ao vivo, sem recriar o canvas.
watch(() => props.config, v => {
  Object.assign(cfg, v)
  const cam = CAMERA_PRESETS[v.camPreset] // trocar camPreset aplica o preset (exceto chaves também passadas em config)
  if (cam) for (const k in cam) if (!(k in v)) cfg[k] = cam[k]
}, { deep: true })

onMounted(() => {
  parent = root.value.parentElement
  prevPos = parent.style.position
  prevIso = parent.style.isolation
  if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative'
  parent.style.isolation = 'isolate' // mantém o z-index -1 do fundo dentro do pai
  stop = createTopo(el.value, cfg)
})

onBeforeUnmount(() => {
  if (stop) stop()
  if (parent) { parent.style.position = prevPos; parent.style.isolation = prevIso }
})

// ---------------------------------------------------------------------------
// MOTOR DE DESENHO (Canvas 2D). Lê 'cfg' a cada quadro.
// ---------------------------------------------------------------------------
function createTopo(canvas, cfg){
  // createTopo(canvas, cfg) -> stop()
  // Inicia a animação no <canvas> (2D). `cfg` é lido A CADA QUADRO, então alterar cfg.* ao vivo funciona.
  // Retorna uma função que cancela a animação e remove os listeners. Chaves de cfg: veja DEFAULTS.
  const ctx = canvas.getContext('2d');
  let P, lastSeed, field, raf, last = performance.now(), ox = 0, oy = 0, z = 0, fly = 0, mx = -1e4, my = -1e4, tx = 0, ty = 0, ma = 0, on = false, fresh = false;
  const parts = [];
  const mv = e => { const r = canvas.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; const i = tx>=0 && ty>=0 && tx<=r.width && ty<=r.height; if (i && !on) fresh = true; on = i; };
  const ml = () => { on = false; };
  addEventListener('pointermove', mv); document.addEventListener('mouseleave', ml);
  // Tabela do marching squares: caso (4 cantos acima/abaixo do nível) -> pares de arestas a ligar [0=topo,1=direita,2=base,3=esquerda].
  const T = {1:[[3,2]],2:[[2,1]],3:[[3,1]],4:[[0,1]],5:[[0,3],[2,1]],6:[[0,2]],7:[[0,3]],8:[[0,3]],9:[[0,2]],10:[[0,1],[3,2]],11:[[0,1]],12:[[3,1]],13:[[2,1]],14:[[3,2]]};
  // sm: suavização (smoothstep) | lr: interpolação linear.
  const sm = t => t*t*(3-2*t), lr = (a,b,t) => a+(b-a)*t;
  // perm(seed): embaralha a tabela do ruído de forma determinística (mesma seed = mesmo relevo).
  function perm(seed){
    P = new Uint8Array(256); for (let i=0;i<256;i++) P[i]=i;
    let s = (seed*9301+49297)>>>0;
    for (let i=255;i>0;i--){ s=(s*1664525+1013904223)>>>0; const j=s%(i+1); [P[i],P[j]]=[P[j],P[i]]; }
  }
  // vn(x,y,z): ruído de valor 3D suave, retorna 0..1. O eixo z funciona como 'tempo' da transformação.
  function vn(x,y,zz){
    const xi=Math.floor(x), yi=Math.floor(y), zi=Math.floor(zz);
    const xf=sm(x-xi), yf=sm(y-yi), zf=sm(zz-zi);
    const h=(i,j,k)=>P[(P[(P[(xi+i)&255]+yi+j)&255]+zi+k)&255]/255;
    return lr(lr(lr(h(0,0,0),h(1,0,0),xf),lr(h(0,1,0),h(1,1,0),xf),yf),lr(lr(h(0,0,1),h(1,0,1),xf),lr(h(0,1,1),h(1,1,1),xf),yf),zf);
  }
  // fbm(x,y,z): soma de `cfg.octaves` camadas de ruído (frequência x2, amplitude /2 a cada camada). Retorna ~0..1.
  function fbm(x,y,zz){
    let a=1,f=1,s=0,n=0;
    for (let o=0;o<cfg.octaves;o++){ s+=a*vn(x*f,y*f,zz+o*7); n+=a; a*=.5; f*=2; }
    return s/n;
  }
  // rgb('#rrggbb') -> [r,g,b]
  const rgb = h => [1,3,5].map(i=>parseInt(h.slice(i,i+2),16)||0);
  // resize(): ajusta a resolução do canvas ao tamanho CSS atual do elemento (DPR limitado a 2 por desempenho).
  function resize(){
    const d = Math.min(devicePixelRatio||1,2);
    canvas.width = Math.max(1,Math.round(canvas.clientWidth*d));
    canvas.height = Math.max(1,Math.round(canvas.clientHeight*d));
  }
  // frame(now): desenha um quadro completo e agenda o próximo. `now` vem do requestAnimationFrame (ms).
  function frame(now){
    const dt = Math.min((now-last)/1000,.1); last = now;
    if (cfg.seed!==lastSeed){ perm(cfg.seed); lastSeed=cfg.seed; }
    const a = cfg.angle*Math.PI/180;
    ox += Math.cos(a)*dt*cfg.speed*.15; oy += Math.sin(a)*dt*cfg.speed*.15; z += dt*cfg.morph*.1; fly += dt*cfg.fly*.6;
    const W=canvas.width, H=canvas.height, d=W/canvas.clientWidth, k=cfg.scale*.0025;
    const A=rgb(resolveColor(props.config.colorA)), B=rgb(resolveColor(props.config.colorB)), BG=rgb(cfg.bg), L=cfg.levels;
    const showL=cfg.show!=='dots', showD=cfg.show!=='lines';
    // mix(m, alpha): cor do degradê A->B na posição m (0..1) com transparência alpha.
    const mix=(m,al)=>`rgba(${A.map((v,i)=>Math.round(lr(v,B[i],m))).join(',')},${al})`;
    // dot(x,y,r): adiciona um círculo ao caminho atual (preencha depois com ctx.fill()).
    const dot=(x,y,r)=>{ctx.moveTo(x+r,y);ctx.arc(x,y,r,0,6.2832);};
    ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.fillStyle=cfg.bg; ctx.fillRect(0,0,W,H);
    // lines(segs,cor,largura): desenha segmentos [x1,y1,x2,y2,...] numa só passada | dots(segs,cor,raio): pontos nos (x1,y1) de cada segmento.
    const lines=(sg,col,w)=>{ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();for(let q=0;q<sg.length;q+=4){ctx.moveTo(sg[q],sg[q+1]);ctx.lineTo(sg[q+2],sg[q+3]);}ctx.stroke();};
    const dots=(sg,col,r)=>{ctx.fillStyle=col;ctx.beginPath();for(let q=0;q<sg.length;q+=4)dot(sg[q],sg[q+1],r);ctx.fill();};

    // ---- Mouse: ma = intensidade do hover (0..1); R2 = alcance² (0 = desativado); add(x,y) coleta pontos ao alcance do cursor.
    const mOn=cfg.mouse==='on';
    if (fresh){ mx=tx*d; my=ty*d; fresh=false; }
    ma+=((mOn&&on?1:0)-ma)*Math.min(1,dt*6); mx=tx*d; my=ty*d; // sem suavização: o ponto acompanha o cursor exatamente
    const R2=mOn&&ma>.02?(cfg.mouseDist*d)**2:0, pts=[];
    const add=(x,y)=>{const dx=x-mx,dy=y-my;if(dx*dx+dy*dy<R2)pts.push(x,y);};
    // ---- Efeito 'topo': curvas de nível (marching squares) sobre um campo de ruído.
    if (cfg.mode==='topo'){
      const cs=cfg.cell*d, cols=Math.ceil(W/cs)+1, rows=Math.ceil(H/cs)+1;
      if (!field || field.length!==cols*rows) field = new Float32Array(cols*rows);
      for (let j=0;j<rows;j++) for (let i=0;i<cols;i++) field[j*cols+i]=fbm(i*cfg.cell*k+ox,j*cfg.cell*k+oy,z);
      for (let n=0;n<L;n++){
        const lv=.28+.44*(n+.5)/L, m=L>1?n/(L-1):0, idx=cfg.indexEvery>0&&n%cfg.indexEvery===0, sg=[];
        for (let j=0;j<rows-1;j++) for (let i=0;i<cols-1;i++){
          const a1=field[j*cols+i], b1=field[j*cols+i+1], c1=field[(j+1)*cols+i+1], d1=field[(j+1)*cols+i];
          const c=(a1>lv?8:0)|(b1>lv?4:0)|(c1>lv?2:0)|(d1>lv?1:0);
          if (c===0||c===15) continue;
          const X=i*cs, Y=j*cs;
          const pe=e=>e===0?[X+cs*((lv-a1)/(b1-a1)),Y]:e===1?[X+cs,Y+cs*((lv-b1)/(c1-b1))]:e===2?[X+cs*((lv-d1)/(c1-d1)),Y+cs]:[X,Y+cs*((lv-a1)/(d1-a1))];
          for (const s of T[c]){ const p=pe(s[0]), q=pe(s[1]); sg.push(p[0],p[1],q[0],q[1]); }
        }
        const col=mix(m,idx?1:cfg.opacity);
        if (showL) lines(sg,col,cfg.width*d*(idx?1.8:1));
        if (showD) dots(sg,col,cfg.dot*d*(idx?1.4:1));
        if (R2) for (let q=0;q<sg.length;q+=4) add(sg[q],sg[q+1]);
      }
    } else if (cfg.mode==='trunk'){
      // ---- Efeito 'trunk': anéis concêntricos deformados pelo ruído.
      const cx=cfg.cx*W, cy=cfg.cy*H, maxR=Math.hypot(Math.max(cx,W-cx),Math.max(cy,H-cy))*1.05, rho=cfg.scale*.9;
      // ring(i,R,n): n+1 pontos [x,y,...] do anel i com raio base R, deformado pelo ruído.
      const ring=(i,R,n)=>{const o=[];for(let q=0;q<=n;q++){const t=q/n*6.2832,r=R*(1+cfg.amp*(fbm(Math.cos(t)*rho+ox,Math.sin(t)*rho+oy,z+i*.08)-.5));{const X=cx+Math.cos(t)*r,Y=cy+Math.sin(t)*r;o.push(X,Y);if(R2)add(X,Y);}}return o;};
      for (let i=0;i<L;i++){
        const R=maxR*(i+.6)/L, m=L>1?i/(L-1):0, idx=cfg.indexEvery>0&&i%cfg.indexEvery===0, col=mix(m,idx?1:cfg.opacity);
        if (showL){ const p=ring(i,R,Math.max(64,Math.ceil(6.2832*R/(6*d)))); ctx.strokeStyle=col;ctx.lineWidth=cfg.width*d*(idx?1.8:1);ctx.beginPath();ctx.moveTo(p[0],p[1]);for(let q=2;q<p.length;q+=2)ctx.lineTo(p[q],p[q+1]);ctx.stroke(); }
        if (showD){ const p=ring(i,R,Math.max(48,Math.ceil(6.2832*R/(cfg.cell*d)))), r=cfg.dot*d*(idx?1.4:1); ctx.fillStyle=col;ctx.beginPath();for(let q=0;q<p.length;q+=2)dot(p[q],p[q+1],r);ctx.fill(); }
      }
    } else {
      // ---- Efeito 'grid': plano de pontos 3D com relevo, projetado em perspectiva. Linhas = ligações com vizinhos.
      const gs=cfg.cell*.012, cols=Math.max(4,Math.round(2*cfg.xs/gs)), rows=Math.max(3,Math.ceil(cfg.zs/gs)+1);
      const pr=cfg.pitch*Math.PI/180, cs=Math.cos(pr), sn=Math.sin(pr), fl=H*.9*cfg.zoom, f0=Math.floor(fly), fr=fly-f0;
      let px=null, py=null;
      for (let r=0;r<rows;r++){
        const dzc=(r-fr)*gs-cfg.camZ, za=(r+f0)*gs, t=r/(rows-1);
        const al=cfg.opacity*(1-.85*t)*Math.min(1,Math.max(0,(dzc*cs+cfg.camY*sn-.1)*4));
        if (al<.01){ px=null; continue; }
        const xs=[], ys=[], rs=[];
        for (let c=0;c<=cols;c++){
          const x=(c/cols*2-1)*cfg.xs, h=(fbm(x*cfg.scale*.9+ox,za*cfg.scale*.9+oy,z)-.5)*cfg.amp*2;
          // Projeção: ponto do mundo (x,h,z) -> tela, câmera em (0,camY,camZ) inclinada em `pitch` graus.
          const dy=h-cfg.camY, zc=dzc*cs-dy*sn, yc=dy*cs+dzc*sn;
          if (zc<.1){ xs.push(NaN); ys.push(NaN); rs.push(0); continue; }
          xs.push(W/2+fl*x/zc); ys.push(H/2-fl*yc/zc); rs.push(Math.min(3,2/zc));
        }
        const col=mix(t,al), v=c=>xs[c]===xs[c];
        if (showL){
          ctx.strokeStyle=col; ctx.lineWidth=Math.max(.4*d,cfg.width*d*rs[cols>>1]*.6); ctx.beginPath();
          for (let c=0;c<=cols;c++){
            if (!v(c)) continue;
            if (c>0&&v(c-1)){ ctx.moveTo(xs[c-1],ys[c-1]); ctx.lineTo(xs[c],ys[c]); }
            if (px&&px[c]===px[c]){ ctx.moveTo(px[c],py[c]); ctx.lineTo(xs[c],ys[c]); }
          }
          ctx.stroke();
        }
        if (showD){ ctx.fillStyle=col; ctx.beginPath(); for (let c=0;c<=cols;c++) if (v(c)) dot(xs[c],ys[c],Math.max(.5*d,cfg.dot*d*rs[c]*.7)); ctx.fill(); }
        if (R2) for (let c=0;c<=cols;c++) if (v(c)) add(xs[c],ys[c]);
        px=xs; py=ys;
      }
    }
    // ---- Partículas flutuantes: vagam pelo elemento inteiro (posição normalizada 0..1, com wrap nas bordas).
    const NP=Math.round(cfg.floatCount);
    while (parts.length<NP){ const q=Math.random()*6.2832; parts.push({x:Math.random(),y:Math.random(),vx:Math.cos(q),vy:Math.sin(q),s:.5+Math.random(),m:Math.random(),ph:Math.random()*6.2832}); }
    parts.length=NP;
    for (const p of parts){
      p.x=((p.x+(p.vx*.02+Math.sin(now/3000+p.ph)*.004)*cfg.floatSpeed*dt)%1+1)%1;
      p.y=((p.y+(p.vy*.02+Math.cos(now/3300+p.ph)*.004)*cfg.floatSpeed*dt)%1+1)%1;
      p.X=p.x*W; p.Y=p.y*H;
    }
    // Ligações entre partículas: pares a menos de floatLinkDist px; opacidade cai com a distância (4 faixas, 1 traçado por faixa).
    if (cfg.floatLinks==='on' && NP>1){
      const D=cfg.floatLinkDist*d, D2=D*D, bk=[[],[],[],[]];
      for (let i=0;i<NP;i++) for (let j=i+1;j<NP;j++){
        const dx=parts[i].X-parts[j].X, dy=parts[i].Y-parts[j].Y, q=dx*dx+dy*dy;
        if (q<D2) bk[Math.min(3,Math.floor((1-Math.sqrt(q)/D)*4))].push(parts[i].X,parts[i].Y,parts[j].X,parts[j].Y);
      }
      bk.forEach((sg,k)=>{ if (sg.length) lines(sg,mix(.5,cfg.opacity*(k+1)/4),cfg.floatLinkWidth*d); });
    }
    for (const p of parts){
      ctx.fillStyle=mix(p.m,cfg.opacity*(.3+.7*(.5+.5*Math.sin(now/1500+p.ph))));
      ctx.beginPath(); dot(p.X,p.Y,cfg.floatSize*d*p.s); ctx.fill();
      if (R2) add(p.X,p.Y);
    }
    // ---- Hover: linhas do cursor até os pontos ao alcance (opacidade cai com a distância) + ponto no cursor.
    if (R2){
      const R=Math.sqrt(R2); ctx.lineWidth=Math.max(.6,cfg.width*.7)*d;
      for (let q=0;q<pts.length;q+=2){
        const dd=Math.hypot(pts[q]-mx,pts[q+1]-my);
        ctx.strokeStyle=mix(0,(1-dd/R)*ma*.9); ctx.beginPath(); ctx.moveTo(mx,my); ctx.lineTo(pts[q],pts[q+1]); ctx.stroke();
      }
      ctx.fillStyle=mix(0,ma*.7); ctx.beginPath(); dot(mx,my,2*d); ctx.fill();
    }
    // Esmaecer bordas: gradiente radial da cor de fundo (transparente no centro) por cima de tudo.
    if (cfg.fade>0){
      const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.2*(1-cfg.fade),W/2,H/2,Math.hypot(W,H)/2);
      g.addColorStop(0,`rgba(${BG},0)`); g.addColorStop(1,`rgba(${BG},${Math.min(1,cfg.fade*1.2)})`);
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    }
    raf = requestAnimationFrame(frame);
  }
  resize();
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); removeEventListener('pointermove', mv); document.removeEventListener('mouseleave', ml); };
}
</script>

<style scoped>
.topo-bg { position: absolute; inset: 0; z-index: -1; overflow: hidden; border-radius: inherit; pointer-events: none; }
.topo-bg canvas { display: block; width: 100%; height: 100%; }
</style>
