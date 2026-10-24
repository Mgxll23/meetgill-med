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
  var hint  = document.getElementById('hint');
  if(!hero || !rot || !mount) return;

  /* ---------- pump markup (same structure as app.js so site.css styles it) ---------- */
  var SCREENS = {
    home: [['M','GILL','t'],['Press ⏏ to load IV line or','','d'],['Press OK to program an infusion','','d'],['Door key (far right) = load IV line','','go']],
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


  /* ---------- internals: board, chips, mechanism, wiring (decorative, shown as the pump spreads open) ----------
     Coordinates are in the face's own space (852 x 328). Palette stays navy / violet / ice blue. */
  function pins(x,y,w,h,step,len){                       /* little chip legs along all four sides */
    var o='', i, j;
    for(i=x+6;i<x+w-4;i+=step){ o+='<path d="M'+i+' '+(y-len)+'v'+len+'M'+i+' '+(y+h)+'v'+len+'"/>'; }
    for(j=y+6;j<y+h-4;j+=step){ o+='<path d="M'+(x-len)+' '+j+'h'+len+'M'+(x+w)+' '+j+'h'+len+'"/>'; }
    return o;
  }
  function gutsHTML(){
    var i, tr='', fingers='', lobes='', rib='', wr='';
    /* trace bus from the MCU toward the two connectors */
    for(i=0;i<8;i++){
      tr+='<path d="M154 '+(112+i*8)+'H'+(176+i*3)+'V'+(70+i*2)+'H'+(230+i*3)+'V280"/>';
      tr+='<path d="M244 '+(120+i*5)+'H'+(330+i*4)+'V'+(60+i*9)+'H392"/>';
    }
    tr+='<path d="M70 190V230H30M118 190V222H60M246 150H330V250"/><path d="M286 126H372V300H420"/>';
    /* peristaltic mechanism behind the door: cam shaft, 9 fingers, motor */
    for(i=0;i<9;i++){
      fingers+='<rect x="786" y="'+(58+i*19)+'" width="36" height="10" rx="3"/>';
      lobes+='<circle cx="'+(804+(i%2?6:-6))+'" cy="'+(63+i*19)+'" r="4"/>';
    }
    /* flat ribbon cable + loose wires rise in 3D from the board to the screen and keypad */
    rib='<i class="g-rib" style="left:170px;top:268px;width:100px"></i>';
    var cols=['#8fb4ff','#e8ebf7','#9d8cff','#aab3d1','#6fa4ff','#c9bfff'];
    for(i=0;i<6;i++) wr+='<i class="g-w g-w--lcd" style="left:'+(52+i*6)+'px;top:236px;background:'+cols[i%6]+'"></i>';
    for(i=0;i<8;i++) wr+='<i class="g-w g-w--key" style="left:'+(398+(i%2)*5)+'px;top:'+(52+i*15)+'px;background:'+cols[(i+2)%6]+'"></i>';
    var mono='font-family="ui-monospace,Consolas,monospace"';
    return '<div class="p9-guts" aria-hidden="true">'+
      '<svg class="g-board" viewBox="0 0 852 328" width="852" height="328">'+
        '<rect x="4" y="4" width="844" height="320" rx="16" fill="#0e1838" stroke="#31478a" stroke-width="2"/>'+
        '<rect x="12" y="12" width="828" height="304" rx="11" fill="none" stroke="rgba(130,160,255,.18)"/>'+
        '<g fill="#070d22" stroke="#7088cc" stroke-width="2"><circle cx="24" cy="24" r="7"/><circle cx="828" cy="24" r="7"/><circle cx="24" cy="304" r="7"/><circle cx="828" cy="304" r="7"/></g>'+
        '<g fill="none" stroke="#6f93ff" stroke-width="1.6" stroke-linecap="round" opacity=".6">'+tr+'</g>'+
        '<text x="300" y="36" fill="#6f86c9" '+mono+' font-size="11" letter-spacing="2">M | GILL  MAIN BOARD  REV A</text>'+
      '</svg>'+
      '<svg class="g-parts" viewBox="0 0 852 328" width="852" height="328">'+
        '<g fill="#e8ebf7" stroke="#9aa6d6"><rect x="150" y="262" width="130" height="16" rx="3"/><rect x="392" y="40" width="12" height="130" rx="3"/></g>'+
        '<g stroke="#5b6fb0" stroke-width="1.2"><path d="M158 262v16M166 262v16M174 262v16M182 262v16M190 262v16M198 262v16M206 262v16M214 262v16M222 262v16M230 262v16M238 262v16M246 262v16M254 262v16M262 262v16M270 262v16"/></g>'+
        '<g fill="#0a0f26" stroke="#97a8e2" stroke-width="1.5"><rect x="70" y="100" width="84" height="84" rx="5"/><rect x="180" y="110" width="64" height="34" rx="4"/><rect x="180" y="158" width="50" height="38" rx="4"/></g>'+
        '<g stroke="#b9c4ee" stroke-width="2" stroke-linecap="round">'+pins(70,100,84,84,9,6)+pins(180,110,64,34,8,5)+pins(180,158,50,38,8,5)+'</g>'+
        '<circle cx="82" cy="112" r="3.5" fill="#97a8e2"/>'+
        '<g fill="#8fa3dc" '+mono+' font-size="10"><text x="86" y="146">M|G32</text><text x="190" y="131">MEM</text><text x="188" y="181">PWR</text></g>'+
        '<rect x="262" y="118" width="28" height="13" rx="5" fill="#d5dbf2" stroke="#8f9ccc"/>'+
        '<g fill="#cfd6f0" stroke="#7f90cc"><circle cx="276" cy="168" r="7"/><circle cx="298" cy="168" r="7"/><circle cx="320" cy="168" r="7"/><circle cx="276" cy="190" r="7"/><circle cx="298" cy="190" r="7"/></g>'+
        '<g fill="#7b6cff"><circle cx="40" cy="38" r="4"/><circle cx="56" cy="38" r="4"/><circle cx="72" cy="38" r="4" fill="#6fa4ff"/></g>'+
        '<g><rect x="30" y="240" width="170" height="64" rx="10" fill="#1a2750" stroke="#8fa3e0" stroke-width="2"/><rect x="200" y="258" width="10" height="28" rx="2" fill="#aab3d1"/>'+
        '<text x="46" y="268" fill="#9fb0e6" '+mono+' font-size="13" letter-spacing="1">LI-ION  7.4V</text><text x="46" y="288" fill="#6f86c9" '+mono+' font-size="10">BATTERY PACK</text></g>'+
        '<g fill="#0a0f26" stroke="#8fa3e0" stroke-width="2"><circle cx="340" cy="250" r="32"/></g><g fill="none" stroke="#6f86c9"><circle cx="340" cy="250" r="23"/><circle cx="340" cy="250" r="14"/><circle cx="340" cy="250" r="5" fill="#8fa3e0"/></g>'+
        '<g fill="none" stroke-linecap="round" stroke-width="3.2"><path d="M210 272C250 272 262 222 300 222" stroke="#9d8cff"/><path d="M210 280C255 284 268 230 300 230" stroke="#e8ebf7"/>'+
        '<path d="M776 276C700 296 560 300 430 298" stroke="#8fb4ff"/><path d="M776 286C700 306 560 308 430 306" stroke="#e8ebf7"/></g>'+
        '<g><rect x="798" y="44" width="12" height="190" rx="4" fill="#5b6fb0"/><g fill="#6f86c9" stroke="none">'+lobes+'</g><g fill="#cfd6f0" stroke="#7f90cc" stroke-width="1.4">'+fingers+'</g>'+
        '<rect x="776" y="244" width="56" height="64" rx="10" fill="#1b2a58" stroke="#8fa3e0" stroke-width="2"/><circle cx="804" cy="276" r="13" fill="#0e1838" stroke="#9db0ee" stroke-width="2"/><circle cx="804" cy="276" r="4" fill="#9db0ee"/>'+
        '<rect x="790" y="14" width="28" height="18" rx="4" fill="#0a0f26" stroke="#9db0ee"/></g>'+
      '</svg>'+
      '<div class="g-risers">'+rib+wr+'</div>'+
    '</div>';
  }

  mount.classList.add('pf');
  mount.innerHTML =
    '<div class="pf__scale"><div class="pump900"><div class="p9-lid"></div><div class="p9-face">'+
      '<div class="p9-left"><div class="p9-logo"><span class="p9-brand">M | GILL</span><span class="p9-led"><i></i><i></i><i></i><i class="on"></i></span></div>'+
        '<div class="p9-lcd lcd" id="lcd">'+lcd('home')+'</div><div class="p9-model">M | Gill Infusion Pump</div></div>'+
      '<div class="p9-lower"><div class="p9-keys">'+
        '<div class="p9-dpad"><div class="k" style="grid-area:1/2">'+arrow('u')+'</div><div class="k" style="grid-area:2/1">'+arrow('l')+'</div><div class="k" style="grid-area:2/3">'+arrow('r')+'</div><div class="k" style="grid-area:3/2">'+arrow('d')+'</div></div>'+
        '<div class="p9-cluster"><div class="k">C</div><div class="k bol">BOL</div><div class="k">'+pw+'</div><div class="k">OK</div><div class="k v">'+aut+'</div><div class="k ss"><span class="st">Start</span><span class="sp">Stop</span></div></div>'+
      '</div><div class="p9-door"><div class="k">'+dr+'</div></div></div>'+
    '</div>'+gutsHTML()+'</div></div>';

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
  /* The hero is a normal block: it scrolls away like any other section (no pinning).
     As the visitor scrolls, the pump opens up; once open it stays open (with a gentle
     float) until they scroll back to the top. The screen stays on the home screen. */
  function ease(t){ return t<.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }      /* easeInOutCubic */
  function lerp(a,b,t){ return a + (b-a)*t; }
  function clamp(v){ return Math.max(0, Math.min(1, v)); }

  var px = 0, py = 0, tx = 0, ty = 0;      /* pointer tilt (smoothed) */
  var progress = 0, sp = 0, lastT = 0;     /* sp = smoothed progress, so fast flicks still glide */

  function render(t){
    var dt = lastT ? Math.min(64, t - lastT) : 16; lastT = t;
    /* opens over the first ~60% of the hero's height of scrolling */
    progress = clamp(window.scrollY / (hero.offsetHeight * 0.6));
    sp += (progress - sp) * (1 - Math.exp(-dt / 130));
    px += (tx - px) * .06; py += (ty - py) * .06;

    var phone = window.innerWidth <= 860;
    var open = ease(sp);                          /* 0 closed -> 1 fully spread; stays 1 afterwards */
    var rx = lerp(16, phone ? 38 : 56, open);
    var ry = lerp(-24, 0, open);
    var rz = lerp(0, -30, open);
    var up = lerp(0, phone ? 3 : -4, open);       /* vh nudge so the spread pump stays centred */

    /* idle float once open, so the held pose still feels alive */
    var f = open * open;
    rx += Math.sin(t / 1500) * 1.1 * f;
    rz += Math.sin(t / 1900) * 1.6 * f;

    var tiltX = phone ? 0 : py * -6, tiltY = phone ? 0 : px * 8;
    rot.style.transform = 'translateY('+up+'vh) rotateX('+(rx+tiltX)+'deg) rotateZ('+rz+'deg) rotateY('+(ry+tiltY)+'deg)';
    var root = document.documentElement.style;
    root.setProperty('--e', open.toFixed(3));
    root.setProperty('--scroll', sp.toFixed(3));
    if(hint) hint.style.opacity = sp > 0.05 ? 0 : 1;

    /* stop drawing while the hero is far off screen */
    if(hero.getBoundingClientRect().bottom < -200 && Math.abs(progress - sp) < 0.001){ idle = true; return; }
    requestAnimationFrame(render);
  }
  var idle = false;
  window.addEventListener('scroll', function(){ if(idle){ idle = false; lastT = 0; requestAnimationFrame(render); } }, {passive:true});

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

  requestAnimationFrame(render);
})();
