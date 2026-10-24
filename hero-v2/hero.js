/* ==========================================================================
   Hero v2 controller.
   - builds the same CSS-drawn pump the site already uses (decorative only: no dosing or rate logic here)
   - maps scroll progress through the hero to tilt, spread (--e), screen content and caption
   - adds a light pointer tilt on desktop
   ========================================================================== */
(function(){
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hero  = document.getElementById('top');
  var rot   = document.getElementById('rot');
  var mount = document.getElementById('pump');
  var cap   = document.getElementById('cap');
  var hint  = document.getElementById('hint');
  if(!hero || !rot || !mount) return;

  /* ---------- pump markup (same structure as app.js so site.css styles it) ---------- */
  var SCREENS = {
    run:  [['M','GILL','t'],['IV fluid  ·  PRIM','','d'],['125 ml/h','','big'],['VTBI 500 ml  ·  Time 4h00min','','d'],['Infusing','','go']],
    prime:[['Prime IV line?','','big'],['Priming…  25 mL','','d'],['OK to stop','','go']],
    prog: [['IV fluid  ·  PRIM','','d'],['Rate    125 ml/h','','big'],['VTBI    500 ml','','big'],['Time    4h00min','','d'],['Start/Stop to begin','','go']],
    alarm:[['Upstream occlusion','','big'],['above pump','','big'],['Check roller clamp, bag and drip chamber.','','d'],['Press OK','','go']]
  };
  var AR = {
    u:'M12 19V6M6.5 11.5L12 6l5.5 5.5', d:'M12 5v13M6.5 12.5L12 18l5.5-5.5',
    l:'M19 12H6M11.5 6.5L6 12l5.5 5.5', r:'M5 12h13M12.5 6.5L18 12l-5.5 5.5'
  };
  function arrow(k){ return '<svg viewBox="0 0 24 24"><path d="'+AR[k]+'"/></svg>'; }
  function lcd(name){
    var out = '<div class="bar"><span>((•))</span><span>100%</span></div>';
    SCREENS[name].forEach(function(r){
      out += r[2]==='t' ? '<div class="t">'+r[0]+'<i>|</i>'+r[1]+'</div>' : '<div class="'+r[2]+'">'+r[0]+'</div>';
    });
    return out;
  }
  var pw  = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" style="stroke:#5B4DE0"><path d="M12 3.5v8"/><path d="M6.4 7a8 8 0 1 0 11.2 0"/></svg>';
  var dr  = '<svg viewBox="0 0 24 24" style="fill:#5B4DE0;stroke:none"><path d="M12 5l7 8H5z"/><rect x="5" y="15.5" width="14" height="2.8" rx="1.2"/></svg>';
  var aut = '<svg viewBox="0 0 24 24" style="stroke:#fff"><path d="M6 6.5l6 5 6-5M6 12.5l6 5 6-5"/></svg>';

  mount.classList.add('pf');
  mount.innerHTML =
    '<div class="pf__scale"><div class="pump900"><div class="p9-lid"></div><div class="p9-face">'+
      '<div class="p9-left"><div class="p9-logo"><span class="p9-brand">M | GILL</span><span class="p9-led"><i></i><i></i><i></i><i class="on"></i></span></div>'+
        '<div class="p9-lcd lcd" id="lcd">'+lcd('run')+'</div><div class="p9-model">M | Gill Infusion Pump</div></div>'+
      '<div class="p9-lower"><div class="p9-keys">'+
        '<div class="p9-dpad"><div class="k" style="grid-area:1/2">'+arrow('u')+'</div><div class="k" style="grid-area:2/1">'+arrow('l')+'</div><div class="k" style="grid-area:2/3">'+arrow('r')+'</div><div class="k" style="grid-area:3/2">'+arrow('d')+'</div></div>'+
        '<div class="p9-cluster"><div class="k">C</div><div class="k bol">BOL</div><div class="k">'+pw+'</div><div class="k">OK</div><div class="k v">'+aut+'</div><div class="k ss"><span class="st">Start</span><span class="sp">Stop</span></div></div>'+
      '</div><div class="p9-door"><div class="k">'+dr+'</div></div></div>'+
    '</div></div></div>';

  var lcdEl = document.getElementById('lcd');
  var scaleEl = mount.firstChild;

  /* ---------- scale the 900px design to the stage (full pump always visible) ---------- */
  function fit(){
    var w = mount.parentNode.clientWidth;
    var phone = window.innerWidth <= 860;
    var k = (w / 900) * (phone ? 0.9 : 1.04);       /* a little under 1 on desktop so tilt never clips */
    scaleEl.style.transform = 'scale(' + k + ')';
    scaleEl.style.transformOrigin = 'center top';   /* layout box stays 900px wide, so scale from the top */
    mount.style.height = (scaleEl.offsetHeight * k) + 'px';
    scaleEl.style.marginLeft = ((w - 900) / 2) + 'px';   /* centre the unscaled 900px box in the stage */
  }
  fit();
  window.addEventListener('resize', fit);
  if(window.ResizeObserver) new ResizeObserver(fit).observe(mount.parentNode);

  /* ---------- scroll story ---------- */
  /* The pump opens over the first ~70% of the hero's scroll, then HOLDS spread out
     (with a gentle float) until the visitor scrolls back up. Nothing snaps back. */
  var STAGES = [
    { at:0.00, lcd:'run',   t:'The pump',    d:'Rate, volume and time at a glance.' },
    { at:0.32, lcd:'alarm', t:'Every alarm', d:'Learn what it means and what to check first.' },
    { at:0.64, lcd:'prog',  t:'Every step',  d:'Program the rate and VTBI exactly as your lab marks it.' }
  ];
  var cur = -1;
  function setStage(i){
    if(i === cur) return; cur = i;
    var s = STAGES[i];
    lcdEl.innerHTML = lcd(s.lcd);
    cap.style.opacity = 0;
    setTimeout(function(){ cap.querySelector('b').textContent = s.t; cap.querySelector('span').textContent = s.d; cap.style.opacity = 1; }, 160);
  }

  function ease(t){ return t<.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }      /* easeInOutCubic */
  function lerp(a,b,t){ return a + (b-a)*t; }
  function clamp(v){ return Math.max(0, Math.min(1, v)); }

  var px = 0, py = 0, tx = 0, ty = 0;      /* pointer tilt (smoothed) */
  var progress = 0, sp = 0, lastT = 0;     /* sp = smoothed progress, so fast flicks still glide */

  function readProgress(){
    var r = hero.getBoundingClientRect();
    var span = hero.offsetHeight - window.innerHeight;
    progress = span > 0 ? clamp(-r.top / span) : 0;
  }

  function render(t){
    var dt = lastT ? Math.min(64, t - lastT) : 16; lastT = t;
    readProgress();
    sp += (progress - sp) * (1 - Math.exp(-dt / 130));
    px += (tx - px) * .06; py += (ty - py) * .06;

    var phone = window.innerWidth <= 860;
    var open = ease(clamp(sp / 0.7));            /* 0 closed -> 1 fully spread; stays 1 after */
    var rx = lerp(16, phone ? 38 : 56, open);
    var ry = lerp(-24, 0, open);
    var rz = lerp(0, -30, open);
    var up = lerp(0, phone ? 3 : -4, open);     /* vh nudge so the spread pump stays centred */

    /* idle float once open, so the held pose still feels alive */
    var f = open * open;
    rx += Math.sin(t / 1500) * 1.1 * f;
    rz += Math.sin(t / 1900) * 1.6 * f;

    var tiltX = phone ? 0 : py * -6, tiltY = phone ? 0 : px * 8;
    rot.style.transform = 'translateY('+up+'vh) rotateX('+(rx+tiltX)+'deg) rotateZ('+rz+'deg) rotateY('+(ry+tiltY)+'deg)';
    var root = document.documentElement.style;
    root.setProperty('--e', open.toFixed(3));
    root.setProperty('--scroll', sp.toFixed(3));

    var idx = 0; for(var i=0;i<STAGES.length;i++){ if(sp >= STAGES[i].at) idx = i; }
    setStage(idx);
    if(hint) hint.style.opacity = sp > 0.04 ? 0 : 1;

    requestAnimationFrame(render);
  }

  if(reduce){
    /* static, still-readable pose */
    rot.style.transform = 'rotateX(14deg) rotateY(-14deg)';
    document.documentElement.style.setProperty('--e', '0.25');
    return;
  }

  window.addEventListener('pointermove', function(ev){
    if(ev.pointerType === 'touch') return;
    tx = (ev.clientX / window.innerWidth - .5) * 2;
    ty = (ev.clientY / window.innerHeight - .5) * 2;   /* smoothed toward px/py inside render() */
  }, {passive:true});

  setStage(0);
  cap.querySelector('b').textContent = STAGES[0].t; cap.querySelector('span').textContent = STAGES[0].d;
  requestAnimationFrame(render);
})();
