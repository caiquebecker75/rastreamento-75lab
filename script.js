(function(){
  'use strict';
  var stage = document.getElementById('stage');
  var slides = [].slice.call(document.querySelectorAll('.slide'));
  var N = slides.length, cur = 0;
  function $(id){ return document.getElementById(id); }
  function pad(n){ return String(n).padStart(2,'0'); }
  function ico(id, cls){ return '<svg' + (cls ? ' class="' + cls + '"' : '') + '><use href="#' + id + '"/></svg>'; }
  var nf0 = new Intl.NumberFormat('pt-BR');
  var nf1 = new Intl.NumberFormat('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});
  var brl = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
  function money(v){ return brl.format(Math.round(v * 100) / 100); }

  /* ================= PREÇOS (valores de venda por display) =================
     OnTiming mensal: parcela cheia. À vista: 20% de desconto sobre a mensal.
     One Shot: pagamento único; parcelado em 12x com a mesma regra. */
  var PRICE = {
    otVista: 27.27,   // por display por mês, pago à vista
    otMensal: 34.09,  // por display por mês, parcelado
    osVista: 13.64,   // por display, pagamento único
    osParc: 17.05     // por display, total parcelado em 12x
  };

  /* ================= palco escalado ================= */
  function fit(){ stage.style.transform = 'scale(' + Math.min(innerWidth / 1600, innerHeight / 900) + ')'; }
  addEventListener('resize', fit); fit();

  /* ================= navegação ================= */
  var hooks = {};
  var lastPt = {x:800, y:450};
  function idxOf(id){ for (var k = 0; k < N; k++) if (slides[k].id === id) return k; return -1; }
  function go(n){
    if (typeof n === 'string') n = idxOf(n);
    if (n < 0 || n >= N || n === cur && slides[cur].classList.contains('act')) return;
    var from = slides[cur], to = slides[n];
    slides.forEach(function(s){ s.classList.remove('prev'); });
    from.classList.remove('act'); from.classList.add('prev');
    to.style.setProperty('--cx', lastPt.x + 'px'); to.style.setProperty('--cy', lastPt.y + 'px');
    to.classList.add('act');
    setTimeout(function(){ from.classList.remove('prev'); }, 950);
    cur = n;
    var th = to.classList.contains('t-ink') ? 'ink' : to.classList.contains('t-lime') ? 'lime' : 'light';
    stage.setAttribute('data-theme', th);
    stage.setAttribute('data-slide', to.id);
    $('prog').style.width = ((n + 1) / N * 100) + '%';
    $('cnt').innerHTML = pad(n + 1) + ' <i>/ ' + pad(N) + '</i>';
    $('who').innerHTML = '<b>75 LAB</b> · ' + (to.getAttribute('data-chap') || 'Rastreamento de PDV');
    [].forEach.call(to.querySelectorAll('[data-count]'), countUp);
    if (hooks[to.id]) hooks[to.id]();
    buildMenuState();
    try { history.replaceState(null, '', '#' + to.id); } catch(e){}
  }
  function next(){ go(Math.min(cur + 1, N - 1)); }
  function prev(){ go(Math.max(cur - 1, 0)); }
  $('btnNext').onclick = next; $('btnPrev').onclick = prev;
  document.addEventListener('click', function(e){
    var t = e.target.closest('[data-go]');
    if (t){ go(t.getAttribute('data-go')); }
  });
  document.addEventListener('keydown', function(e){
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input') { if (e.key === 'Escape') e.target.blur(); if (e.target.type === 'range' || e.target.type === 'text') return; }
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(N - 1);
    else if (e.key === 'm' || e.key === 'M') toggleMenu();
    else if (e.key === 'Escape') toggleMenu(false);
  });
  var tx = null, ty = null;
  document.addEventListener('touchstart', function(e){ tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, {passive:true});
  document.addEventListener('touchend', function(e){
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && !e.target.closest('input')) { dx < 0 ? next() : prev(); }
    tx = null;
  });

  /* índice */
  var menu = $('menu');
  $('menuList').innerHTML = slides.map(function(s, k){ return '<button data-k="' + k + '"><span>' + pad(k + 1) + '</span>' + s.getAttribute('data-title') + '</button>'; }).join('');
  $('menuList').addEventListener('click', function(e){ var b = e.target.closest('button'); if (b){ toggleMenu(false); go(+b.getAttribute('data-k')); } });
  function toggleMenu(force){ var on = typeof force === 'boolean' ? force : !menu.classList.contains('open'); menu.classList.toggle('open', on); }
  function buildMenuState(){ [].forEach.call($('menuList').children, function(b, k){ b.classList.toggle('cur-sl', k === cur); }); }
  $('btnMenu').onclick = function(){ toggleMenu(true); };
  $('menuClose').onclick = function(){ toggleMenu(false); };
  if ($('pdf')) $('pdf').onclick = function(){ window.print(); };

  /* count-up */
  function countUp(el){
    var target = parseFloat(el.getAttribute('data-count'));
    var small = el.querySelector('small'); var smallHTML = small ? small.outerHTML : '';
    var t0 = null, dur = 1300;
    function step(ts){
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.innerHTML = nf0.format(Math.round(target * e)) + smallHTML;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function tween(el, to, fmt, dur){
    var from = parseFloat(el.getAttribute('data-v') || '0'); el.setAttribute('data-v', to);
    var t0 = null; dur = dur || 800;
    function step(ts){ if (!t0) t0 = ts; var p = Math.min((ts - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * e); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }

  /* ================= cursor do guia 75 LAB (ponto lime com mistura difference) ================= */
  var cursorEl = $('cursor'), ctxt = $('ctxt'), spot = $('cineSpot');
  var mx = -100, my = -100, cx = -100, cy = -100;
  if (matchMedia('(pointer:fine)').matches){
    document.addEventListener('mousemove', function(e){
      mx = e.clientX; my = e.clientY;
      var t = e.target.closest ? e.target : null;
      var lab = t && t.closest('[data-cursor]');
      var hov = t && t.closest('button,a,input,.ic,.pc,.po,.steps4 li,.step,.fs');
      cursorEl.classList.toggle('label', !!lab);
      cursorEl.classList.toggle('big', !lab && !!hov);
      ctxt.textContent = lab ? lab.getAttribute('data-cursor') : '';
      var r = stage.getBoundingClientRect();
      spot.style.setProperty('--mx', ((mx - r.left) / r.width * 100) + '%');
      spot.style.setProperty('--my', ((my - r.top) / r.height * 100) + '%');
    });
    (function loop(){ cx += (mx - cx) * .28; cy += (my - cy) * .28; cursorEl.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)'; requestAnimationFrame(loop); })();
  }
  document.addEventListener('pointerdown', function(e){
    var r = stage.getBoundingClientRect(), s = r.width / 1600;
    lastPt = {x:(e.clientX - r.left) / s, y:(e.clientY - r.top) / s};
  });

  /* ================= 09 · investimento do QR (tabela por volume) =================
     Preço de venda por peça rastreada. Faixas da tabela comercial de 13/10/2026. */
  var FAIXAS = [
    {min:1,     max:99,    p:4.80, r:'1 a 99'},
    {min:100,   max:499,   p:3.00, r:'100 a 499'},
    {min:500,   max:999,   p:1.80, r:'500 a 999'},
    {min:1000,  max:2499,  p:1.20, r:'1.000 a 2.499'},
    {min:2500,  max:4999,  p:0.80, r:'2.500 a 4.999'},
    {min:5000,  max:9999,  p:0.55, r:'5.000 a 9.999'},
    {min:10000, max:24999, p:0.45, r:'10.000 a 24.999'},
    {min:25000, max:49999, p:0.35, r:'25.000 a 49.999'},
    {min:50000, max:1e9,   p:0.30, r:'50.000 ou mais'}
  ];
  var maxP = 4.80;
  $('prEsc').innerHTML = FAIXAS.map(function(f, k){
    var h = Math.round(26 + (f.p / maxP) * 150);
    return '<div class="pe" data-k="' + k + '"><div class="bar" style="height:' + h + 'px"></div>' +
      '<span class="v">' + money(f.p) + '</span><span class="q">' + f.r + '</span></div>';
  }).join('');
  function faixaDe(q){ for (var i = 0; i < FAIXAS.length; i++) if (q >= FAIXAS[i].min && q <= FAIXAS[i].max) return i; return FAIXAS.length - 1; }
  function prRender(){
    var q = +$('prQ').value, k = faixaDe(q), f = FAIXAS[k];
    $('prQ').style.setProperty('--p', ((q - 100) / 59900 * 100) + '%');
    $('prQn').textContent = nf0.format(q);
    $('prU').textContent = money(f.p);
    $('prT').textContent = money(q * f.p);
    $('prF').textContent = f.r;
    [].forEach.call($('prEsc').children, function(el, i){ el.classList.toggle('on', i === k); });
  }
  $('prQ').addEventListener('input', prRender);
  $('prEsc').addEventListener('click', function(e){
    var d = e.target.closest('.pe'); if (!d) return;
    var f = FAIXAS[+d.getAttribute('data-k')];
    $('prQ').value = Math.min(60000, Math.max(100, f.min === 1 ? 100 : f.min));
    prRender();
  });
  prRender();

  /* ================= início ================= */
  var start = idxOf((location.hash || '').slice(1));
  slides[0].classList.add('act'); cur = 0;
  stage.setAttribute('data-theme', 'ink');
  slides[0].classList.remove('act');
  cur = start > 0 ? start : 0;
  slides[cur].style.setProperty('--cx', '50%'); slides[cur].style.setProperty('--cy', '50%');
  (function first(){
    var to = slides[cur];
    to.classList.add('act');
    var th = to.classList.contains('t-ink') ? 'ink' : to.classList.contains('t-lime') ? 'lime' : 'light';
    stage.setAttribute('data-theme', th); stage.setAttribute('data-slide', to.id);
    $('prog').style.width = ((cur + 1) / N * 100) + '%';
    $('cnt').innerHTML = pad(cur + 1) + ' <i>/ ' + pad(N) + '</i>';
    $('who').innerHTML = '<b>75 LAB</b> · ' + (to.getAttribute('data-chap') || 'Rastreamento de PDV');
    [].forEach.call(to.querySelectorAll('[data-count]'), countUp);
    if (hooks[to.id]) hooks[to.id]();
    buildMenuState();
  })();
})();
