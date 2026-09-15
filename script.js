(function(){
'use strict';
var $=function(s,c){return (c||document).querySelector(s)},
    $$=function(s,c){return [].slice.call((c||document).querySelectorAll(s))},
    cl=function(v,a,b){return v<a?a:v>b?b:v},
    RM=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── i18n ── */
var LANG='es';
$$('[data-en]').forEach(function(e){ if(!e.hasAttribute('data-es')) e.setAttribute('data-es',e.innerHTML); });
function setLang(l){ LANG=l; document.documentElement.lang=l;
  try{ localStorage.setItem('gg-lang',l); }catch(_){}
  $$('[data-en]').forEach(function(e){
    var v=e.getAttribute('data-'+l); if(v===null) v=e.getAttribute('data-es');
    e.innerHTML=v; });
  $$('[data-lang]').forEach(function(b){ b.setAttribute('aria-pressed',String(b.dataset.lang===l)); });
  if(md && !md.hidden) fillMd(mdKey); }
$$('[data-lang]').forEach(function(b){ b.addEventListener('click',function(){ setLang(b.dataset.lang); }); });
(function(){ var l=null;
  try{ l=localStorage.getItem('gg-lang'); }catch(_){}
  if(l==='es'||l==='en'||l==='pt') setLang(l);
})();

/* ── vídeos: autoplay quando o navegador deixa; imagem parada quando não deixa ── */
(function(){
  var vids=$$('video');
  function showImg(v){
    if(v._img) return;
    var p=v.getAttribute('poster'); if(!p) return;
    var i=document.createElement('img');
    i.src=p; i.alt=''; i.className='vfb'; i.setAttribute('aria-hidden','true');
    i.style.cssText='width:100%;height:100%;object-fit:cover;display:block';
    if(v.parentNode) v.parentNode.insertBefore(i,v);
    v.style.display='none';
    v._img=i;
  }
  function hideImg(v){ if(v._img){ if(v._img.parentNode) v._img.parentNode.removeChild(v._img); v._img=null; v.style.display=''; } }
  function tryPlay(v){
    try{
      v.muted=true; v.defaultMuted=true; v.playsInline=true; v.controls=false;
      var pr=v.play();
      if(pr && pr.then) pr.then(function(){ hideImg(v); }).catch(function(){ showImg(v); });
    }catch(_){ showImg(v); }
  }
  vids.forEach(function(v){
    v.removeAttribute('controls');
    v.setAttribute('playsinline',''); v.setAttribute('webkit-playsinline','');
    tryPlay(v);
    v.addEventListener('loadeddata',function(){ tryPlay(v); });
    v.addEventListener('playing',function(){ hideImg(v); });
    v.addEventListener('timeupdate',function(){ if(v.currentTime>0) hideImg(v); });
    v.addEventListener('error',function(){ showImg(v); });
    v._check=function(){
      if(document.hidden) return;
      var t0=v.currentTime;
      setTimeout(function(){
        if(document.hidden) return;
        if(v.paused || v.currentTime===t0) showImg(v);
      }, 1200);
    };
    setTimeout(v._check, 2800);
  });
  function kickAll(){ vids.forEach(tryPlay); }
  ['pointerdown','touchstart','keydown','scroll','wheel'].forEach(function(ev){
    addEventListener(ev, kickAll, {passive:true});
  });
  document.addEventListener('visibilitychange',function(){
    if(!document.hidden){ kickAll(); setTimeout(function(){ vids.forEach(function(v){ if(v._check) v._check(); }); }, 2200); }
  });
  addEventListener('pageshow', kickAll);
  setTimeout(kickAll,700);
})();

/* ── reveal + counters ── */
function countUp(el){ var to=+el.dataset.count,pre=el.dataset.pre||'',suf=el.dataset.suf||'';
  if(RM){ el.textContent=pre+to+suf; return; }
  var dur=+el.dataset.dur||1300;
  var t0=performance.now();
  (function s(t){ var p=cl((t-t0)/dur,0,1),e=1-Math.pow(1-p,3);
    el.textContent=pre+Math.round(to*e)+suf; if(p<1) requestAnimationFrame(s); })(t0); }
var io=new IntersectionObserver(function(en){ en.forEach(function(e){ if(!e.isIntersecting) return;
  e.target.classList.add('go'); io.unobserve(e.target); }); },{rootMargin:'0px 0px -8% 0px',threshold:.1});
$$('.rv').forEach(function(e){ io.observe(e); });
var io2=new IntersectionObserver(function(en){ en.forEach(function(e){ if(!e.isIntersecting||e.target._c) return;
  e.target._c=1; countUp(e.target); io2.unobserve(e.target); }); },{threshold:.4});
$$('[data-count]').forEach(function(e){ io2.observe(e); });

/* ── rails: drag + arrows + progress ── */
$$('[data-rail]').forEach(function(r){
  var st=$('.strip',r), thumb=$('.thumb',r), cnt=$('.cnt',r),
      figs=$$('figure',st), down=false, sx=0, sl=0, moved=0;
  function step(){ var f=figs[0]; return f? f.getBoundingClientRect().width+18 : 320; }
  function upd(){ var max=st.scrollWidth-st.clientWidth;
    var p=max>0? st.scrollLeft/max : 0;
    if(thumb){ thumb.style.width=Math.max(12,(st.clientWidth/st.scrollWidth)*100)+'%';
      thumb.style.left=(p*(100-parseFloat(thumb.style.width)))+'%'; }
    if(cnt){ var i=Math.min(figs.length,Math.round(st.scrollLeft/step())+1);
      cnt.textContent=('0'+i).slice(-2)+' / '+('0'+figs.length).slice(-2); } }
  st.addEventListener('scroll',upd,{passive:true}); upd();
  addEventListener('resize',upd,{passive:true});
  var pv=$('[data-prev]',r), nx=$('[data-next]',r);
  if(pv) pv.addEventListener('click',function(){ st.scrollBy({left:-step(),behavior:'smooth'}); });
  if(nx) nx.addEventListener('click',function(){ st.scrollBy({left:step(),behavior:'smooth'}); });
  st.addEventListener('pointerdown',function(e){ down=true; moved=0; sx=e.clientX; sl=st.scrollLeft;
    st.classList.add('drag'); st.setPointerCapture(e.pointerId); });
  st.addEventListener('pointermove',function(e){ if(!down) return;
    var d=e.clientX-sx; moved=Math.abs(d); st.scrollLeft=sl-d; });
  function end(){ down=false; st.classList.remove('drag'); }
  st.addEventListener('pointerup',end); st.addEventListener('pointercancel',end);
  st.addEventListener('click',function(e){ if(moved>6){ e.preventDefault(); e.stopPropagation(); } },true);
});

/* ── métricas expansíveis ── */
var mxBtns=$$('#mx .row button'), mxPan=$$('#mx .panel');
mxBtns.forEach(function(b){ b.addEventListener('click',function(){
  var i=b.dataset.p, open=b.getAttribute('aria-expanded')==='true';
  mxBtns.forEach(function(o){ o.setAttribute('aria-expanded','false'); });
  mxPan.forEach(function(p){ p.classList.remove('open'); });
  if(!open){ b.setAttribute('aria-expanded','true');
    var p=$('#mx .panel[data-panel="'+i+'"]'); p.classList.add('open');
    setTimeout(function(){ var r=b.getBoundingClientRect();
      if(r.top<70) scrollTo({top:scrollY+r.top-90,behavior:'smooth'}); },80); } }); });

/* ── fachada: wipe transition ── */
var fim=$$('#fach .stage img'), fbt=$$('#fach .picker button'), hint=$('#hint'), stg=$('#fach .stage'), fi=0, fprev=-1;
function paintF(dir){
  fim.forEach(function(im,k){
    if(k===fi) return;
    im.style.transition='none';
    im.style.zIndex = (k===fprev)?2:1;
    im.style.clipPath = (k===fprev)?'inset(0)':'inset(0 0 0 100%)';
    im.style.transform = 'scale(1.03)';
  });
  var cur=fim[fi];
  cur.style.transition='none';
  cur.style.zIndex=3;
  cur.style.clipPath = dir>0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';
  cur.style.transform='scale(1.06)';
  void cur.offsetWidth;
  requestAnimationFrame(function(){
    cur.style.transition='clip-path 1.05s var(--e), transform 2.1s var(--e)';
    cur.style.clipPath='inset(0)';
    cur.style.transform='scale(1)';
  });
}
function goF(i){
  i=((i%fim.length)+fim.length)%fim.length;
  if(i===fi) return;
  var dir = (i>fi || (fi===fim.length-1 && i===0)) ? 1 : -1;
  fprev=fi; fi=i;
  fbt.forEach(function(b){ b.setAttribute('aria-pressed',String(+b.dataset.go===fi)); });
  hint.classList.add('gone');
  paintF(dir);
}
(function(){ var c=fim[0]; c.style.zIndex=3; c.style.clipPath='inset(0)'; c.style.transform='scale(1)'; })();
fbt.forEach(function(b){ b.addEventListener('click',function(){ goF(+b.dataset.go); }); });
stg.addEventListener('click',function(){ goF(fi+1); });
(function(){ var dx=0,sx=0,dn=false;
  stg.addEventListener('pointerdown',function(e){ dn=true; sx=e.clientX; dx=0; });
  stg.addEventListener('pointermove',function(e){ if(dn) dx=e.clientX-sx; });
  stg.addEventListener('pointerup',function(){ if(dn&&Math.abs(dx)>40){ goF(fi+(dx<0?1:-1)); } dn=false; });
  stg.addEventListener('pointercancel',function(){ dn=false; });
})();

/* ── modal ── */
var md=$('#md'), mdKey='cert';
var DOC={
 cert:{t:'Certified Digital Marketing Professional',k:{es:'Credencial',en:'Credential',pt:'Credencial'},img:'doc-cert.jpg',
   rows:[['Digital Marketing Institute','—'],
         [{es:'N.º de graduado',en:'Graduate No.',pt:'N.º de formado'},'BR-OPM275884'],
         [{es:'Temario',en:'Syllabus',pt:'Ementa'},'Version 9.0'],
         [{es:'Fecha',en:'Date',pt:'Data'},'01 · 12 · 2024']]},
 diploma:{t:{es:'Comunicación Social — Publicidad y Propaganda',en:'Social Communication — Advertising',pt:'Comunicação Social — Publicidade e Propaganda'},
   k:{es:'Diploma',en:'Degree',pt:'Diploma'},img:'doc-diploma.jpg',
   rows:[['ESPM','São Paulo'],
         [{es:'Grado',en:'Degree',pt:'Grau'},{es:'Bachiller',en:'Bachelor',pt:'Bacharel'}],
         [{es:'Carga horaria',en:'Class hours',pt:'Carga horária'},'3.564'],
         [{es:'Colación',en:'Graduation',pt:'Colação'},'29 · 08 · 2025']]},
 pdf:{t:'Portfolio 2026 — Gustavo Gurevich',k:{es:'Documento',en:'Document',pt:'Documento'},
   rows:[['PDF',{es:'17 páginas',en:'17 pages',pt:'17 páginas'}],
         [{es:'Idioma',en:'Language',pt:'Idioma'},{es:'Español',en:'Spanish',pt:'Espanhol'}],
         [{es:'Tamaño',en:'Size',pt:'Tamanho'},'3,3 MB']],
   links:[{u:'portfolio-gg.pdf',dl:1,l:{es:'Descargar el portfolio',en:'Download the portfolio',pt:'Baixar o portfólio'}}]},
 praum:{t:'30PRAUM',k:{es:'Producción comercial',en:'Commercial production',pt:'Produção comercial'},
   rows:[[{es:'Locación',en:'Location',pt:'Locação'},{es:'Helipuerto · esplanada · fachada',en:'Heliport · esplanade · façade',pt:'Heliponto · esplanada · fachada'}],
         [{es:'Visualizaciones',en:'Views',pt:'Visualizações'},'+5.000.000']],
   links:[{u:'https://youtu.be/fcgAQJMCoi0',l:{es:'Autobahn — ver en YouTube',en:'Autobahn — watch on YouTube',pt:'Autobahn — ver no YouTube'}},
          {u:'https://youtu.be/uTO7Dl2SE3g',l:{es:'Alterado — ver en YouTube',en:'Alterado — watch on YouTube',pt:'Alterado — ver no YouTube'}}]}};
function tr(v){ return (v&&typeof v==='object') ? (v[LANG]||v.es) : v; }
function fillMd(k){ var d=DOC[k]; mdKey=k;
  $('#mdT').textContent=tr(d.t); $('#mdK').textContent=tr(d.k);
  var rows=d.rows.map(function(r){ return '<div class="row"><div class="k">'+tr(r[0])+'</div><div class="v">'+tr(r[1])+'</div></div>'; }).join('');
  if(d.links) rows+='<div class="mdlk">'+d.links.map(function(x){
     return '<a href="'+x.u+'"'+(x.dl?' download':' target="_blank" rel="noopener"')+'>'+tr(x.l)+'<i>'+(x.dl?'\u2193':'\u2197')+'</i></a>'; }).join('')+'</div>';
  $('#mdD').innerHTML=rows;
  var sc=$('#mdScan');
  if(d.img){ sc.hidden=false; $('img',sc).src=d.img; } else { sc.hidden=true; $('img',sc).removeAttribute('src'); } }
$$('[data-md]').forEach(function(b){ b.addEventListener('click',function(){ fillMd(b.dataset.md);
  md.hidden=false; requestAnimationFrame(function(){md.classList.add('on')}); $('[data-close]',md).focus(); }); });
function closeM(){ md.classList.remove('on'); setTimeout(function(){md.hidden=true},400); }
$('[data-close]',md).addEventListener('click',closeM);
md.addEventListener('click',function(e){ if(e.target===md) closeM(); });
addEventListener('keydown',function(e){ if(e.key==='Escape'&&!md.hidden) closeM(); });

/* ── whatsapp label ── */
(function(){ var l=document.querySelector('#wa .lbl'); if(!l) return;
  setInterval(function(){ l.classList.toggle('up'); },3600); })();

/* ── estudio de marca: pestañas ── */
$$('[data-st]').forEach(function(st){
  var tabs=$$('.tabs button',st), panes=$$('.stp',st);
  tabs.forEach(function(b){ b.addEventListener('click',function(){
    var k=b.dataset.stp;
    tabs.forEach(function(t){ t.setAttribute('aria-pressed',String(t===b)); });
    panes.forEach(function(p){ p.classList.toggle('on',p.dataset.stp===k); });
  }); });
});

/* ── mobile menu ── */
var burger=$('#burger'), menu=$('#menu');
function mOpen(v){ menu.classList.toggle('on',v); burger.setAttribute('aria-expanded',String(v));
  document.body.style.overflow=v?'hidden':''; }
burger.addEventListener('click',function(){ mOpen(!menu.classList.contains('on')); });
$('#menu .cl').addEventListener('click',function(){ mOpen(false); });
$$('#menu a').forEach(function(a){ a.addEventListener('click',function(){ mOpen(false); }); });
addEventListener('keydown',function(e){ if(e.key==='Escape'&&menu.classList.contains('on')) mOpen(false); });

/* ── scroll engine ── */
var hd=$('#hd'), pgb=$('#pg'), navA=$$('#hd nav a[href^="#"]'),
    tg=navA.map(function(a){ return $(a.getAttribute('href')); }),
    darks=$$('.dark,#desc,#moras'),
    heroWrap=$('#heroWrap'), heroVid=$('#heroVid'), heroTxt=$('#heroTxt'), heroCue=$('#heroCue'), heroCue2=$('#heroCue2'), heroOver=$('#heroOver'),
    desc=$('#desc'), sh=$('#desc .sh'), says=$$('#desc .say'), fls=$$('#desc .fl div');
function pv(el){ var r=el.getBoundingClientRect(); return cl((-r.top)/((el.offsetHeight-innerHeight)||1),0,1); }
function ease(t){ return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2; }

var _gap=null;
function heroGap(){
  if(_gap) return _gap;
  var lead=$('#heroTxt .lead'), facts=$('#heroTxt .facts'),
      st=heroWrap.firstElementChild, Hs=st?st.offsetHeight:innerHeight,
      folga=14;
  var top = lead ? (lead.offsetTop+lead.offsetHeight+folga) : Hs*0.30;
  var bot = facts ? (facts.offsetTop-folga) : Hs*0.72;
  var h = bot-top;
  if(h < Hs*0.22){ h = Hs*0.22; top = (Hs-h)/2; }
  _gap={t:top,h:h};
  return _gap;
}
addEventListener('resize',function(){ _gap=null; },{passive:true});
addEventListener('orientationchange',function(){ _gap=null; });

function tick(){
  var y=scrollY,H=innerHeight,doc=document.documentElement.scrollHeight-H;
  pgb.style.transform='scaleX('+cl(y/doc,0,1)+')';

  var d=false;
  for(var i=0;i<darks.length;i++){ var r=darks[i].getBoundingClientRect();
    if(r.top<=70 && r.bottom>70){ d=true; break; } }
  /* hero expanded also counts as dark */
  var hr=heroWrap.getBoundingClientRect();
  if(hr.top<=70 && hr.bottom>70 && pv(heroWrap)>.62) d=true;
  hd.classList.toggle('on-dark',d);

  var mid=y+H*.42, act=-1;
  for(var k=0;k<tg.length;k++){ if(tg[k] && tg[k].offsetTop-80<=mid) act=k; }
  navA.forEach(function(a,i){ a.classList.toggle('act',i===act); });

  /* HERO expand */
  if(hr.top<H && hr.bottom>0){
    var p=ease(cl(pv(heroWrap)/.86,0,1));
    var mob=innerWidth<860;
    if(mob){
      /* no celular o vídeo ocupa exatamente a folga entre o texto de cima e os dados de baixo */
      var g=heroGap(), Hs=heroWrap.firstElementChild.offsetHeight||H;
      var h0=(g.h/Hs)*100, t0=(g.t/Hs)*100, w0=86, l0=7;
      heroVid.style.width=(w0+(100-w0)*p).toFixed(2)+'%';
      heroVid.style.height=(h0+(100-h0)*p).toFixed(2)+'%';
      heroVid.style.left=(l0*(1-p)).toFixed(2)+'%';
      heroVid.style.top=(t0*(1-p)).toFixed(2)+'%';
      heroVid.style.transform='none';
    } else {
      var wS=0.36, hS=0.42;
      heroVid.style.left=''; heroVid.style.top='';
      heroVid.style.width=((wS+(1-wS)*p)*100).toFixed(2)+'%';
      heroVid.style.height=((hS+(1-hS)*p)*100).toFixed(2)+'%';
      heroVid.style.transform='translate('+(36*(1-p)).toFixed(2)+'%,'+(12*(1-p)).toFixed(2)+'%)';
    }
    heroVid.style.borderRadius=(3*(1-p)).toFixed(1)+'px';
    heroVid.style.boxShadow='0 '+(30*(1-p)).toFixed(0)+'px '+(90*(1-p)).toFixed(0)+'px rgba(14,14,13,'+(0.14*(1-p)).toFixed(3)+')';
    heroTxt.style.opacity=cl(1-p*1.9,0,1);
    heroTxt.style.transform='translateY('+(-p*26).toFixed(1)+'px)';
    heroCue.style.opacity=cl(1-p*3,0,1);
    heroOver.style.opacity=cl((p-.6)/.3,0,1);
  }

  /* descent */
  var dr=desc.getBoundingClientRect();
  if(dr.top<H && dr.bottom>0){ var dp=pv(desc);
    sh.style.transform='translateY('+(14-dp*34).toFixed(2)+'%) scale('+(1.18-dp*.18).toFixed(3)+')';
    says[0].style.opacity=cl((dp-.04)*8,0,1)*cl(1-Math.max(0,dp-.36)*8,0,1);
    says[0].style.transform='translateY('+((1-cl((dp-.04)*8,0,1))*22).toFixed(1)+'px)';
    says[1].style.opacity=cl((dp-.56)*8,0,1)*cl(1-Math.max(0,dp-.95)*16,0,1);
    says[1].style.transform='translateY('+((1-cl((dp-.56)*8,0,1))*22).toFixed(1)+'px)';
    var th=[.13,.24,.34,.44];
    for(var f=0;f<fls.length;f++) fls[f].classList.toggle('on', dp>th[f] && dp<.54); }

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
})();
