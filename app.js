(function(){
  var doc=document.documentElement;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  doc.classList.add('js');

  /* ---------- pump renderer (CSS-drawn, decorative) ---------- */
  var SCREENS={
    run:[['M','GILL','t'],['IV fluid  ·  PRIM','','d'],['125 ml/h','','big'],['VTBI 500 ml  ·  Time 4h00min','','d'],['Infusing','','go']],
    load:[['M','GILL','t'],['Press ⏏ to load IV line','','d'],['Door open. IV line clamped?','','d'],['▲ Yes   ▼ No','','go']],
    prime:[['Prime IV line?','','big'],['Priming…  25 mL','','d'],['OK to stop','','go']],
    prog:[['IV fluid  ·  PRIM','','d'],['Rate    125 ml/h','','big'],['VTBI    500 ml','','big'],['Time    4h00min','','d'],['Start/Stop to begin','','go']],
    limit:[['Value ABOVE upper','','big'],['soft limit','','big'],['Soft: 2 - 10 mg/h','','d'],['Override?','','go']],
    alarm:[['Upstream occlusion','','big'],['above pump','','big'],['Check roller clamp, bag and drip chamber.','','d'],['Press OK','','go']],
    bolus:[['BOLUS  5 mL','','big'],['Delivering at 600 ml/h','','d'],['Then back to continuous','','d'],['Hold BOL = manual bolus','','go']],
    kvo:[['KVO mode','','big'],['VTBI complete','','d'],['Keep-vein-open 1 mL/h','','d'],['Press OK','','go']],
    sec:[['SECondary  ·  IV fluid','','d'],['Rate    260 ml/h','','big'],['VTBI    130 ml','','big'],['Time    30 min','','d'],['Back to PRIM: manual','','go']]
  };
  var AR={
    u:'M12 19V6M6.5 11.5L12 6l5.5 5.5', d:'M12 5v13M6.5 12.5L12 18l5.5-5.5',
    l:'M19 12H6M11.5 6.5L6 12l5.5 5.5', r:'M5 12h13M12.5 6.5L18 12l-5.5 5.5'
  };
  function arrow(k){return '<div class="k"><svg viewBox="0 0 24 24"><path d="'+AR[k]+'"/></svg></div>';}
  function lcdHTML(name){
    var rows=SCREENS[name]||SCREENS.run, out='<div class="bar"><span>((•))</span><span>100%</span></div>';
    rows.forEach(function(r){
      if(r[2]==='t') out+='<div class="t">'+r[0]+'<i>|</i>'+r[1]+'</div>';
      else out+='<div class="'+r[2]+'">'+r[0]+'</div>';
    });
    return out;
  }
  function pumpHTML(name){
    var pw='<svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" style="stroke:#5B4DE0"><path d="M12 3.5v8"/><path d="M6.4 7a8 8 0 1 0 11.2 0"/></svg>';
    var dr='<svg viewBox="0 0 24 24" style="fill:#5B4DE0;stroke:none"><path d="M12 5l7 8H5z"/><rect x="5" y="15.5" width="14" height="2.8" rx="1.2"/></svg>';
    var auto='<svg viewBox="0 0 24 24" style="stroke:#fff"><path d="M6 6.5l6 5 6-5M6 12.5l6 5 6-5"/></svg>';
    return '<div class="pf__scale"><div class="pump900"><div class="p9-lid"></div><div class="p9-face">'+
      '<div class="p9-left"><div class="p9-logo"><span class="p9-brand">M | GILL</span><span class="p9-led"><i></i><i></i><i></i><i class="on"></i></span></div>'+
        '<div class="p9-lcd lcd" data-lcd>'+lcdHTML(name)+'</div><div class="p9-model">M | Gill Infusion Pump</div></div>'+
      '<div class="p9-lower"><div class="p9-keys">'+
        '<div class="p9-dpad"><div class="k" style="grid-area:1/2">'+arrowSvg('u')+'</div><div class="k" style="grid-area:2/1">'+arrowSvg('l')+'</div><div class="k" style="grid-area:2/3">'+arrowSvg('r')+'</div><div class="k" style="grid-area:3/2">'+arrowSvg('d')+'</div></div>'+
        '<div class="p9-cluster"><div class="k">C</div><div class="k bol">BOL</div><div class="k">'+pw+'</div><div class="k">OK</div><div class="k v">'+auto+'</div><div class="k ss"><span class="st">Start</span><span class="sp">Stop</span></div></div>'+
      '</div><div class="p9-door"><div class="k">'+dr+'</div></div></div>'+
    '</div></div></div>';
  }
  function arrowSvg(k){return '<svg viewBox="0 0 24 24"><path d="'+AR[k]+'"/></svg>';}
  function fit(pf){ var s=pf.firstChild; if(!s) return; var k=pf.clientWidth/900; s.style.transform='scale('+k+')'; pf.style.height=(s.offsetHeight*k)+'px'; }
  document.querySelectorAll('[data-pump]').forEach(function(m){
    m.classList.add('pf'); m.innerHTML=pumpHTML(m.getAttribute('data-pump')); fit(m);
    if(window.ResizeObserver) new ResizeObserver(function(){fit(m);}).observe(m); else window.addEventListener('resize',function(){fit(m);});
  });
  function setLcd(mount,name){
    var l=mount.querySelector('[data-lcd]'); if(!l||l.getAttribute('data-name')===name) return;
    l.setAttribute('data-name',name); l.innerHTML=lcdHTML(name);
    l.classList.remove('lcd-swap'); void l.offsetWidth; l.classList.add('lcd-swap');
  }

  /* ---------- nav ---------- */
  var nav=document.querySelector('.nav');
  var mb=document.querySelector('.menu-btn');
  if(mb) mb.addEventListener('click',function(){ var o=nav.classList.toggle('open'); mb.setAttribute('aria-expanded',o); });
  function onScroll(){ if(nav) nav.classList.toggle('scrolled',window.scrollY>8); }
  window.addEventListener('scroll',onScroll,{passive:true}); onScroll();

  /* ---------- reveal on scroll ---------- */
  var rvs=[].slice.call(document.querySelectorAll('.rv'));
  if(reduce||!('IntersectionObserver' in window)){ rvs.forEach(function(e){e.classList.add('in');}); }
  else{
    var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); },{threshold:.15,rootMargin:'0px 0px -50px 0px'});
    rvs.forEach(function(e){io.observe(e);});
  }

  /* ---------- hero parallax + pinned scene (rAF) ---------- */
  var hp=document.querySelector('.hero-pump');
  var scene=document.querySelector('.scene');
  var steps=[].slice.call(document.querySelectorAll('.step'));
  var rail=[].slice.call(document.querySelectorAll('.scene__rail i'));
  var sceneMount=document.querySelector('.scene__pump [data-pump]');
  var keys=['prime','prog','alarm','limit'], last=-1, ticking=false;

  /* Hero pump parallax (desktop only). */
  function frame(){
    ticking=false;
    var vh=window.innerHeight;
    if(hp && !reduce && window.innerWidth>900){ var y=Math.min(window.scrollY,vh); hp.style.transform='translate3d(0,'+(y*-0.08)+'px,0)'; }
  }
  function req(){ if(!ticking){ ticking=true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll',req,{passive:true}); window.addEventListener('resize',req); frame();

  /* ---------- four-step slider ----------
     A normal block in the page (it never pins or captures the scroll). Move between
     steps with the arrows, the dots, the keyboard (left/right) or a swipe. The pump's
     screen changes with the step. */
  var dots=[].slice.call(document.querySelectorAll('.sn-dots button'));
  var arrows=[].slice.call(document.querySelectorAll('.sn-arrow'));
  var col=document.querySelector('.scene__col');
  var idx=0;
  function show(i,fromUser){
    i=Math.max(0,Math.min(steps.length-1,i));
    if(i===idx && last!==-1) return;
    idx=i; last=i;
    steps.forEach(function(s,k){
      s.classList.toggle('on',k===i);
      s.classList.toggle('before',k<i);
      s.setAttribute('aria-hidden',k===i?'false':'true');
    });
    dots.forEach(function(d,k){ if(k===i) d.setAttribute('aria-current','true'); else d.removeAttribute('aria-current'); });
    arrows.forEach(function(a){ var dir=+a.getAttribute('data-dir'); a.disabled=(i+dir<0||i+dir>=steps.length); });
    if(sceneMount) setLcd(sceneMount,keys[i]);
  }
  if(scene && !reduce && steps.length){
    arrows.forEach(function(a){ a.addEventListener('click',function(){ show(idx+(+a.getAttribute('data-dir')),true); }); });
    dots.forEach(function(d,k){ d.addEventListener('click',function(){ show(k,true); }); });
    scene.addEventListener('keydown',function(e){
      if(e.key==='ArrowRight'){ show(idx+1,true); } else if(e.key==='ArrowLeft'){ show(idx-1,true); }
    });
    /* swipe: horizontal drags change the step, vertical drags still scroll the page */
    var x0=null,y0=0;
    if(col){
      col.addEventListener('pointerdown',function(e){ x0=e.clientX; y0=e.clientY; },{passive:true});
      col.addEventListener('pointerup',function(e){
        if(x0===null) return;
        var dx=e.clientX-x0, dy=e.clientY-y0; x0=null;
        if(Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)*1.4){ show(idx+(dx<0?1:-1),true); }
      },{passive:true});
      col.addEventListener('pointercancel',function(){ x0=null; });
    }
    show(0);
  }
  if(scene && reduce){ steps.forEach(function(s){s.classList.add('on');}); }

  /* ---------- toast (used by the mock checkout) ---------- */
  window.toast=function(msg){
    var t=document.querySelector('.toast'); if(!t) return;
    t.textContent=msg; t.classList.add('show'); setTimeout(function(){t.classList.remove('show');},3200);
  };
})();

/* instruments dropdown: click/keyboard (hover is handled in CSS) */
(function(){
  var subs=[].slice.call(document.querySelectorAll('.has-sub'));
  function closeAll(except){ subs.forEach(function(s){ if(s!==except){ s.classList.remove('open'); var b=s.querySelector('.sub-btn'); if(b) b.setAttribute('aria-expanded','false'); } }); }
  subs.forEach(function(s){
    var b=s.querySelector('.sub-btn');
    b.addEventListener('click',function(e){ e.stopPropagation(); var o=s.classList.toggle('open'); b.setAttribute('aria-expanded',o); closeAll(s); });
  });
  document.addEventListener('click',function(){ closeAll(); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'){ closeAll(); } });
})();


/* ---------- student reviews ----------
   MGM_REVIEWS_API is the review service address (the Cloudflare Worker in tools/reviews-worker), no trailing slash.
   While it is empty the site reads reviews.json instead and the form only saves on the visitor's own device. */
window.MGM_REVIEWS_API='';
window.mgmLoadReviews=function(ok,fail){
  var api=window.MGM_REVIEWS_API, url=api?api+'/reviews':'reviews.json';
  fetch(url,{cache:'no-cache'}).then(function(r){ if(!r.ok){ throw new Error('x'); } return r.json(); }).then(function(d){
    var list=Array.isArray(d)?d:(d.reviews||[]), st=d.stats;
    if(!st){ var n=0,t=0; list.forEach(function(x){ if(+x.rating){ n++; t+=+x.rating; } }); st={overall:n?Math.round(t/n*10)/10:null,count:list.length}; }
    ok(list,st);
  }).catch(function(){ if(fail) fail(); });
};
/* one review card; text goes in as plain text */
window.mgmReviewCard=function(x){
  function el(t,c,tx){ var e=document.createElement(t); if(c) e.className=c; if(tx!=null) e.textContent=tx; return e; }
  var c=el('article','rcard'), n=Math.max(0,Math.min(5,+x.rating||0));
  var st=el('div','rstars','★★★★★'.slice(0,n)+'☆☆☆☆☆'.slice(0,5-n));
  st.setAttribute('aria-label',n+' out of 5'); c.appendChild(st);
  if(x.liked) c.appendChild(el('p','rtext',x.liked));
  if(x.improve) c.appendChild(el('p','rtext rimp','To improve: '+x.improve));
  c.appendChild(el('p','rwho',x.name+(x.role?', '+x.role:'')));
  return c;
};
/* home page: floating row of student reviews (hidden until there is at least one review with text) */
(function(){
  var sec=document.getElementById('student-reviews'); if(!sec) return;
  var track=document.getElementById('rvs-track'), sum=document.getElementById('rvs-sum');
  window.mgmLoadReviews(function(list,stats){
    list=list.filter(function(x){ return x.liked||x.improve; });
    if(!list.length) return;
    list.forEach(function(x){ track.appendChild(window.mgmReviewCard(x)); });
    if(stats&&stats.overall) sum.textContent=stats.overall+' out of 5 from '+(stats.count||list.length)+(list.length===1?' student review':' student reviews');
    var reduce=window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(list.length>=4 && !reduce){
      var kids=[].slice.call(track.children);
      kids.forEach(function(k){ var cl=k.cloneNode(true); cl.setAttribute('aria-hidden','true'); track.appendChild(cl); });
      track.style.setProperty('--dur',Math.max(30,list.length*8)+'s');
      track.classList.add('rvs-marquee');
    }
    sec.hidden=false;
  });
})();
