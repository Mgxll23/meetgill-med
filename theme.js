/* Light / dark theme for MeetGill Med.
   Loaded in <head> so the saved choice is applied before the page paints (no flash).
   Choice is remembered in localStorage ('mgm_theme'); with no saved choice it follows the device setting.
   The pump simulator (pump/index.html, in an iframe) loads this too and follows the same choice. */
(function(){
  var KEY='mgm_theme', root=document.documentElement;
  function saved(){ try{ return localStorage.getItem(KEY); }catch(e){ return null; } }
  function system(){ return (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light'; }
  function current(){ return saved() || system(); }
  function apply(t){
    root.setAttribute('data-theme',t);
    var b=document.querySelectorAll('.theme-btn');
    for(var i=0;i<b.length;i++){ b[i].setAttribute('aria-pressed',t==='dark'?'true':'false'); b[i].setAttribute('aria-label',t==='dark'?'Switch to light mode':'Switch to dark mode'); b[i].title=t==='dark'?'Light mode':'Dark mode'; }
  }
  apply(current());
  window.mgmSetTheme=function(t){
    try{ localStorage.setItem(KEY,t); }catch(e){}
    apply(t);
    var fr=document.querySelectorAll('iframe');                 /* tell the pump simulator right away */
    for(var i=0;i<fr.length;i++){ try{ fr[i].contentWindow.postMessage({mgmTheme:t},location.origin); }catch(e){} }
  };
  window.addEventListener('message',function(e){ if(e.origin===location.origin && e.data && e.data.mgmTheme){ apply(e.data.mgmTheme); } });
  window.addEventListener('storage',function(e){ if(e.key===KEY && e.newValue){ apply(e.newValue); } });

  /* the moon / sun button: added to the site nav, and to the phone full-screen pump bar */
  var ICON='<svg class="ti-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"/></svg>'+
           '<svg class="ti-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M5.3 18.7L7 17M17 7l1.7-1.7"/></svg>';
  function make(){
    var b=document.createElement('button'); b.type='button'; b.className='theme-btn'; b.innerHTML=ICON;
    b.addEventListener('click',function(){ window.mgmSetTheme(root.getAttribute('data-theme')==='dark'?'light':'dark'); });
    return b;
  }
  document.addEventListener('DOMContentLoaded',function(){
    var cta=document.querySelector('.nav-cta'), mb=cta&&cta.querySelector('.menu-btn');
    if(cta){ cta.insertBefore(make(), mb||null); }
    var fs=document.querySelector('.pump-fsbar'); if(fs){ var x=make(); x.classList.add('theme-btn--fs'); fs.appendChild(x); }
    apply(current());
  });
})();
