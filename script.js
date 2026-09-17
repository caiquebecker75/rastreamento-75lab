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
  $('pdf').onclick = function(){ window.print(); };

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

  /* ================= 03 · o que fazemos ================= */
  var FAZ = {
    os:{c:'', call:'QR único', h:'One Shot', l:'Rastreio estático',
      p:'Um QR único impresso ou colado na peça. Ele registra o momento da instalação: a prova de que o material chegou e foi montado.',
      s:['A peça sai da produção com seu QR único.','Na loja, o promotor escaneia com a câmera do celular, sem aplicativo.','O registro guarda GPS, loja, foto da fachada, data e promotor.'],
      ex:'Ideal para ações de curta duração e entrega direta na loja.'},
    ot:{c:'ot', call:'Tag ao vivo', h:'OnTiming', l:'Rastreio ao vivo',
      p:'Uma tag discreta, sem fio e sem tomada, fixada no display. A peça passa a informar sozinha onde está, do CD até a loja e durante toda a vida útil.',
      s:['A tag é aplicada e ativada na produção.','A localização é atualizada automaticamente, sem ninguém escanear.','O painel mostra trajeto, tempo em cada etapa e alerta se a peça sai da loja.'],
      ex:'Ideal para materiais de valor, que viajam por CD e ficam meses no PDV. Inclui o registro One Shot.'}
  };
  var fazT = null;
  function fazSet(t){
    var d = FAZ[t];
    $('fDisp').classList.toggle('ot', t === 'ot');
    $('fCallT').textContent = d.call;
    [].forEach.call($('fTabs').children, function(b){ b.classList.toggle('on', b.getAttribute('data-t') === t); });
    $('fBody').innerHTML = '<div class="fb ' + d.c + '"><span class="lbl">' + d.l + '</span><h3>' + d.h + '</h3><p>' + d.p + '</p><ol>' +
      d.s.map(function(x, i){ return '<li><i>' + (i + 1) + '</i><span>' + x + '</span></li>'; }).join('') + '</ol><div class="ex"><b>Quando usar</b>' + d.ex + '</div></div>';
    var fs = document.querySelector('.fflow .fs.on span');
    fs.innerHTML = ico(t === 'ot' ? 'i-live' : 'i-qr');
  }
  $('fTabs').addEventListener('click', function(e){ var b = e.target.closest('button'); if (b){ clearTimeout(fazT); fazSet(b.getAttribute('data-t')); } });
  hooks.fazemos = function(){ fazSet('os'); clearTimeout(fazT); fazT = setTimeout(function(){ if (slides[cur].id === 'fazemos') fazSet('ot'); }, 5000); };

  /* ================= 04 · one shot ================= */
  var MPINS = [[18,40,'#F07A1A','WP'],[34,62,'#0F8A80','FR'],[62,70,'#F07A1A','WP'],[76,34,'#3B6EF5','PP'],[48,28,'#D93A6A','MM'],[86,78,'#F07A1A','WP']];
  $('osMap').insertAdjacentHTML('beforeend', MPINS.map(function(p, k){
    return '<div class="mpin" style="left:' + p[0] + '%;top:' + p[1] + '%;opacity:0" data-k="' + k + '"><svg viewBox="0 0 44 52"><path d="M22 51S3 33 3 20a19 19 0 0 1 38 0c0 13-19 31-19 31z" fill="' + p[2] + '" stroke="#fff" stroke-width="3"/></svg><span>' + p[3] + '</span></div>';
  }).join(''));
  var osK = 0, osT = null;
  function osSet(k){
    osK = k;
    [].forEach.call($('osSteps').children, function(s, i){ s.classList.toggle('on', i === k); });
    var ph = $('osPhone'), rows = ph.querySelectorAll('.ph-row');
    ph.classList.toggle('scan', k === 1);
    [].forEach.call(rows, function(r, i){ r.classList.toggle('ok', k >= 2 || (k === 1 && i === 0)); });
    ph.style.transform = k === 3 ? 'translateX(-60px) scale(.92)' : k === 0 ? 'translateY(30px)' : 'none';
    $('osKpis').classList.toggle('hlc', k === 3);
    $('osMap').classList.toggle('hlc', k === 2);
    [].forEach.call($('osMap').querySelectorAll('.mpin'), function(p, i){
      var show = k >= 2 || i < 3;
      p.style.opacity = show ? 1 : .25;
      p.style.transform = (k === 2 && i === 5) ? 'scale(1.35)' : 'none';
    });
  }
  $('osSteps').addEventListener('click', function(e){ var b = e.target.closest('.step'); if (b){ clearInterval(osT); osSet(+b.getAttribute('data-k')); } });
  hooks.oneshot = function(){ osSet(0); clearInterval(osT); osT = setInterval(function(){ if (slides[cur].id !== 'oneshot') return clearInterval(osT); osSet((osK + 1) % 4); }, 2600); };

  /* ================= 05 · ontiming ================= */
  var otPath = $('otPath'), otOn = $('otPathOn'), otLen = 0, otRun = null;
  var OTEV = [
    [0,  'No CD · agora', 'saiu do <b>CD Cajamar</b>'],
    [.27,'Em trânsito · agora', 'em rota com a <b>transportadora</b>'],
    [.52,'No armazém · agora', 'parado no <b>armazém regional</b>'],
    [.78,'No lugar · agora', 'chegou na <b>Loja 214</b>'],
    [1,  'Fora da loja · agora', '<b style="color:#E5484D">saiu da cerca</b> da Loja 214']
  ];
  function otDraw(p){
    if (!otLen) otLen = otPath.getTotalLength();
    otOn.style.strokeDasharray = otLen; otOn.style.strokeDashoffset = otLen * (1 - p);
    var pt = otPath.getPointAtLength(otLen * p), svg = otPath.ownerSVGElement, sc = svg.clientWidth / 980;
    $('otDot').style.transform = 'translate(' + (pt.x * sc) + 'px,' + (pt.y * sc) + 'px)';
    $('otDot').classList.toggle('red', p > .9);
    [].forEach.call(document.querySelectorAll('#otRoute .node'), function(n){ n.classList.toggle('lit', p >= parseFloat(n.getAttribute('data-at')) - .001); });
  }
  function otPlay(){
    cancelAnimationFrame(otRun); $('otLog').innerHTML = '';
    var t0 = null, fired = -1, li = document.querySelector('#otList li');
    function step(ts){
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / 7000, 1);
      otDraw(p);
      for (var k = fired + 1; k < OTEV.length; k++){
        if (p >= OTEV[k][0]){
          fired = k;
          $('otS0').textContent = OTEV[k][1];
          li.classList.toggle('red', k === 4); li.classList.remove('fresh'); void li.offsetWidth; li.classList.add('fresh');
          var hh = pad(8 + k * 2) + ':' + pad((k * 17) % 60);
          $('otLog').innerHTML = '<p><b>' + hh + '</b> Display Loja 214 ' + OTEV[k][2] + '</p>';
        }
      }
      if (p < 1) otRun = requestAnimationFrame(step);
      else setTimeout(function(){ if (slides[cur].id === 'ontiming') otPlay(); }, 2500);
    }
    otRun = requestAnimationFrame(step);
  }
  $('otRoute').addEventListener('click', otPlay);
  hooks.ontiming = function(){ otDraw(0); $('otLog').innerHTML = ''; $('otS0').textContent = 'No CD · agora'; setTimeout(otPlay, 1100); };

  /* ================= indicadores (base do catálogo e da matriz) ================= */
  var IND = [
    ['i-percent','Penetração','Quantas lojas-alvo já têm a peça montada.','execucao','ambos'],
    ['i-users','Número de promotores','Quem registrou peças, onde e quando.','promotores','ambos'],
    ['i-target','Planejado x executado','Peças previstas contra peças instaladas de verdade.','execucao','ambos'],
    ['i-flag','Positivação por bandeira','Execução comparada entre redes e bandeiras.','positivacao','ambos'],
    ['i-city','Positivação por cidade','Ranking das praças com e sem presença.','positivacao','ambos'],
    ['i-map','Positivação por estado','Mapa do Brasil pintado pela execução.','positivacao','ambos'],
    ['i-clock','Tempo de positivação','Dias entre a chegada e a peça montada.','execucao','ambos'],
    ['i-chart','Positivação por promotor','Ranking individual de execução.','promotores','ambos'],
    ['i-swap','Próprio x compartilhado','Performance da equipe própria contra a terceirizada.','promotores','ambos'],
    ['i-rocket','Tempo de introdução no varejo','Da saída do CD à primeira instalação.','execucao','parcial'],
    ['i-cam','Geolocalização com foto da fachada','GPS, loja e foto que provam a instalação.','loja','ambos'],
    ['i-hour','Tempo de existência na loja','Quantos dias a peça realmente trabalhou.','loja','parcial'],
    ['i-shield','Prevenção de perda','Alerta quando o display sai da loja.','logistica','ontiming'],
    ['i-route','Monitoramento de transporte e armazenagem','Onde a peça está entre o CD e a loja.','logistica','ontiming'],
    ['i-cd','Tempo de armazenagem','Quantos dias o display ficou parado.','logistica','ontiming'],
    ['i-truck','Tempo de transporte CD até a loja','Duração real de cada entrega.','logistica','ontiming'],
    ['i-box','Inventário de ativos','Onde está cada peça, agora.','logistica','ontiming']
  ];

  /* ================= catálogos de indicadores ================= */
  var FAM = {exe:['Execução','#0E1110'], pos:['Positivação','#00837D'], eq:['Equipe','#1DD4C8'], loja:['Loja','#8DBE2A'], log:['Logística','#F2A93B']};
  // família, valor de exemplo, legenda, gráfico
  var VIS = [
    ['exe','62%','lojas-alvo','ring',62], ['eq','48','promotores ativos','dots',48], ['exe','84%','1.014 de 1.200','pair',[100,84]],
    ['pos','86%','melhor bandeira','hbars',[86,79,71,64]], ['pos','9','praças no ranking','cols',[91,78,74,72,69]], ['pos','27','UFs no mapa','tiles',0],
    ['exe','4,2','dias em média','clock',0], ['eq','96%','top promotor','cols',[96,93,88,85,79]], ['eq','91 x 73','próprio x compartilhado','duel',[91,73]],
    ['exe','9','dias do CD à loja','rocket',0], ['loja','8 m','precisão do GPS','pin',0], ['loja','74','de 90 dias','line',82],
    ['log','3','alertas hoje','alert',0], ['log','ao vivo','posição da frota','route',0], ['log','12','dias parado no CD','bars',[30,55,80,100,70]],
    ['log','3,2','dias por entrega','truck',0], ['log','1.200','ativos rastreados','donut',0]
  ];
  function gfx(t, d){
    var s = '<svg class="cg" viewBox="0 0 80 40">';
    if (t === 'ring') s += '<circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" stroke-opacity=".15" stroke-width="6"/><circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + (d / 100 * 94.2) + ' 94.2" transform="rotate(-90 20 20)"/>';
    else if (t === 'pair') s += '<rect x="4" y="' + (40 - d[0] * .36) + '" width="16" height="' + (d[0] * .36) + '" rx="3" fill="currentColor" fill-opacity=".2"/><rect x="26" y="' + (40 - d[1] * .36) + '" width="16" height="' + (d[1] * .36) + '" rx="3" fill="currentColor"/><path d="M48 12h28M48 22h20M48 32h24" stroke="currentColor" stroke-opacity=".2" stroke-width="4" stroke-linecap="round"/>';
    else if (t === 'hbars') d.forEach(function(v, i){ s += '<rect x="0" y="' + (i * 10 + 1) + '" width="' + (v * .8) + '" height="6" rx="3" fill="currentColor" fill-opacity="' + (1 - i * .22) + '"/>'; });
    else if (t === 'cols' || t === 'bars') d.forEach(function(v, i){ s += '<rect x="' + (i * 16 + 2) + '" y="' + (40 - v * .38) + '" width="10" height="' + (v * .38) + '" rx="3" fill="currentColor" fill-opacity="' + (t === 'cols' ? 1 - i * .16 : .35 + i * .13) + '"/>'; });
    else if (t === 'tiles') [[1,0],[3,0],[0,1],[1,1],[2,1],[3,1],[1,2],[2,2],[2,3]].forEach(function(p, i){ s += '<rect x="' + (p[0] * 11 + 16) + '" y="' + (p[1] * 10) + '" width="9" height="8" rx="2" fill="currentColor" fill-opacity="' + [.3,.2,.5,.8,1,.6,.9,1,.7][i] + '"/>'; });
    else if (t === 'dots') for (var i = 0; i < 18; i++) s += '<circle cx="' + (i % 6 * 13 + 6) + '" cy="' + (Math.floor(i / 6) * 13 + 7) + '" r="4.5" fill="currentColor" fill-opacity="' + (i < 14 ? 1 : .2) + '"/>';
    else if (t === 'duel') s += '<rect x="0" y="8" width="' + (d[0] * .8) + '" height="9" rx="4" fill="currentColor"/><rect x="0" y="24" width="' + (d[1] * .8) + '" height="9" rx="4" fill="currentColor" fill-opacity=".35"/>';
    else if (t === 'line') s += '<rect x="0" y="17" width="80" height="6" rx="3" fill="currentColor" fill-opacity=".15"/><rect x="0" y="17" width="' + (d * .8) + '" height="6" rx="3" fill="currentColor"/><circle cx="' + (d * .8) + '" cy="20" r="6" fill="#E5484D"/><path d="M79 8v24" stroke="currentColor" stroke-dasharray="3 3" stroke-width="2"/>';
    else if (t === 'donut') s += '<g transform="rotate(-90 40 20)" fill="none" stroke-width="7"><circle cx="40" cy="20" r="15" stroke="currentColor" stroke-dasharray="64 94.2"/><circle cx="40" cy="20" r="15" stroke="currentColor" stroke-opacity=".45" stroke-dasharray="16 94.2" stroke-dashoffset="-65"/><circle cx="40" cy="20" r="15" stroke="#E5484D" stroke-dasharray="7 94.2" stroke-dashoffset="-83"/></g>';
    else if (t === 'route') s += '<path d="M6 32C20 32 20 8 40 8s20 24 34 24" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="4 5"/><circle cx="6" cy="32" r="5" fill="currentColor"/><circle cx="74" cy="32" r="5" fill="currentColor"/><circle cx="40" cy="8" r="6" fill="#1DD4C8" stroke="currentColor" stroke-width="2"/>';
    else if (t === 'alert') s += '<circle cx="40" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/><rect x="33" y="13" width="14" height="14" rx="4" fill="currentColor"/><circle cx="68" cy="10" r="6" fill="#E5484D"/>';
    else if (t === 'pin') s += '<path d="M40 38s-12-11-12-20a12 12 0 0 1 24 0c0 9-12 20-12 20z" fill="currentColor"/><circle cx="40" cy="18" r="4.5" fill="#C0EE4E"/><circle cx="40" cy="36" r="3" fill="none" stroke="currentColor" stroke-opacity=".4" stroke-width="2"/>';
    else { var ic = {clock:'i-clock', rocket:'i-rocket', truck:'i-truck'}[t]; s = '<svg class="cg"><use href="#' + ic + '"/>'; }
    return s + '</svg>';
  }
  function card(k, cls, badge){
    var d = IND[k], v = VIS[k], f = FAM[v[0]];
    return '<div class="ic ' + (cls || '') + '">' +
      '<span class="ic-top"><span class="ic-i">' + ico(d[0]) + '</span><span class="ic-f"><i style="background:' + f[1] + '"></i>' + f[0] + '</span></span>' +
      '<b class="ic-n">' + d[1] + '</b>' +
      '<span class="ic-v"><span class="ic-num">' + v[1] + '<small>' + v[2] + '</small></span>' + gfx(v[3], v[4]) + '</span>' +
      '<span class="ic-q">' + ico('i-search') + d[2] + '</span>' + (badge || '') + '</div>';
  }
  var OS_ORDER = [0,2,6,9,3,4,5,1,7,8,10,11], EXCL = [12,13,14,15,16];
  document.querySelector('[data-cat="os-indicadores"]').innerHTML = OS_ORDER.map(function(k, i){
    return card(k, 'c' + i, IND[k][4] === 'parcial' ? '<span class="ic-b">com leitura extra</span>' : '');
  }).join('');
  document.querySelector('[data-cat="ot-indicadores"]').innerHTML = EXCL.map(function(k, i){ return card(k, 'ex c' + i, '<span class="ic-b ex">exclusivo</span>'); }).join('') +
    '<div class="ic plus c5"><span class="lbl">Também inclui</span><b>+ os 12 do One Shot</b><p>Execução, positivação, equipe e loja, todos completos.</p><svg class="down"><use href="#i-drop"/></svg></div>' +
    OS_ORDER.map(function(k, i){ return card(k, 'c' + (i + 6), IND[k][4] === 'parcial' ? '<span class="ic-b">completo aqui</span>' : ''); }).join('');

  /* ================= One Shot · preço ================= */
  function osq(){ var q = +$('osq').value; $('osq').style.setProperty('--p', ((q - 50) / 2950 * 100) + '%'); $('osqN').textContent = nf0.format(q); $('osqV').textContent = money(q * PRICE.osVista); }
  $('osq').addEventListener('input', osq); osq();
  [].forEach.call(document.querySelectorAll('.payopts .po'), function(p){ p.addEventListener('mouseenter', function(){ [].forEach.call(document.querySelectorAll('.payopts .po'), function(x){ x.classList.toggle('on', x === p); }); }); });

  /* ================= OnTiming · planos ================= */
  var otPlan = {m:12, p:'v'};
  function plansRender(){
    var rows = [6, 9, 12];
    $('plans').innerHTML = '<div class="ph"><span></span><span class="lbl">À vista · 1 parcela <em>20% off</em></span><span class="lbl">Mensal · parcelado</span></div>' + rows.map(function(m){
      function cell(p){
        var mes = p === 'v' ? PRICE.otVista : PRICE.otMensal, tot = mes * m, on = otPlan.m === m && otPlan.p === p;
        return '<button class="pc ' + p + (on ? ' on' : '') + '" data-m="' + m + '" data-p="' + p + '"><span class="pm">' + money(mes) + '<small>/mês</small></span><span class="pt">' + (p === 'v' ? money(tot) + ' em 1 parcela' : m + 'x de ' + money(mes)) + '</span></button>';
      }
      return '<div class="pr"><span class="pl"><b>' + m + '</b>meses</span>' + cell('v') + cell('m') + '</div>';
    }).join('');
    var mes = otPlan.p === 'v' ? PRICE.otVista : PRICE.otMensal, tot = mes * otPlan.m;
    $('otSel').innerHTML = '<span class="lbl">Plano escolhido · ' + otPlan.m + ' meses · ' + (otPlan.p === 'v' ? 'à vista' : 'mensal') + '</span>' +
      '<div class="bp"><em>R$</em>' + money(mes).replace('R$', '').trim().replace(/,(\d\d)$/, '<small>,$1</small>') + '<i>por display<br>por mês</i></div>' +
      '<p>' + (otPlan.p === 'v' ? 'Total de <b>' + money(tot) + '</b> por display em 1 parcela. Economia de <b>' + money((PRICE.otMensal - PRICE.otVista) * otPlan.m) + '</b> contra o mensal.' : '<b>' + otPlan.m + ' parcelas de ' + money(mes) + '</b> por display. Total de ' + money(tot) + '.') + '</p>' +
      '<button class="btn" data-go="simulador">Simular com meus números <span class="arr">→</span></button>';
  }
  $('plans').addEventListener('click', function(e){ var b = e.target.closest('.pc'); if (b){ otPlan = {m:+b.getAttribute('data-m'), p:b.getAttribute('data-p')}; plansRender(); } });
  plansRender();

  /* ================= 14 · simulador ================= */
  var sim = {q:500, m:12, p:'v'};
  var YES = '<span class="cell ck">' + ico('i-ok', 'y') + '</span>', NO = '<span class="cell ck">' + ico('i-no', 'n') + '</span>';
  function simCalc(){
    var q = sim.q, m = sim.m, v = sim.p === 'v';
    var os = { vista: q * PRICE.osVista, mensTot: q * PRICE.osParc, n: 12 };
    os.parc = os.mensTot / 12; os.save = os.mensTot - os.vista; os.total = v ? os.vista : os.mensTot;
    var ot = { vista: q * PRICE.otVista * m, mensTot: q * PRICE.otMensal * m, n: m };
    ot.parc = ot.mensTot / m; ot.save = ot.mensTot - ot.vista; ot.total = v ? ot.vista : ot.mensTot;
    return {os:os, ot:ot};
  }
  function simRender(flash){
    var c = simCalc(), v = sim.p === 'v';
    $('sQtyLbl').textContent = nf0.format(sim.q) + ' displays · ' + (v ? 'à vista' : 'mensal');
    $('mOut').textContent = sim.m;
    $('mIn').style.setProperty('--p', ((sim.m - 6) / 6 * 100) + '%');
    var sv = v ? ' sel' : '', sm = v ? '' : ' sel';
    $('colOs').innerHTML =
      '<div class="cell hd"><span class="tag" style="background:var(--paper);color:var(--ink)">' + ico('i-cam') + 'estático</span><b>One Shot</b><small>pagamento único por display</small></div>' +
      '<div class="cell"><span class="v">' + money(PRICE.osVista) + '<small>ou 12x ' + money(PRICE.osParc / 12) + '</small></span></div>' +
      '<div class="cell rw-v' + sv + '"><span class="v">' + money(c.os.vista) + '</span></div>' +
      '<div class="cell rw-m' + sm + '"><span class="v">12x ' + money(c.os.parc) + '<small>total ' + money(c.os.mensTot) + '</small></span></div>' +
      '<div class="cell tot"><span class="v">' + money(c.os.total) + '</span></div>' +
      '<div class="cell gap"></div>' + YES + YES + YES + YES + NO + NO + NO + NO;
    $('colOt').innerHTML =
      '<div class="cell hd"><span class="tag">' + ico('i-live') + 'recomendado</span><b>OnTiming</b><small>assinatura de ' + sim.m + ' meses</small></div>' +
      '<div class="cell"><span class="v">' + money(PRICE.otVista) + '<small>/mês à vista · ' + money(PRICE.otMensal) + '/mês mensal</small></span></div>' +
      '<div class="cell rw-v' + sv + '"><span class="v">' + money(c.ot.vista) + '</span></div>' +
      '<div class="cell rw-m' + sm + '"><span class="v">' + sim.m + 'x ' + money(c.ot.parc) + '<small>total ' + money(c.ot.mensTot) + '</small></span></div>' +
      '<div class="cell tot"><span class="v">' + money(c.ot.total) + '</span></div>' +
      '<div class="cell gap"></div>' + YES + YES + YES + YES + YES + YES + YES + YES;
    [].forEach.call(document.querySelectorAll('#stab .c0 .rw-v'), function(x){ x.classList.toggle('sel', v); });
    [].forEach.call(document.querySelectorAll('#stab .c0 .rw-m'), function(x){ x.classList.toggle('sel', !v); });
    if (flash) [].forEach.call(document.querySelectorAll('#stab .tot'), function(t){ t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash'); });
    [].forEach.call($('qChips').children, function(b){ b.classList.toggle('on', +b.getAttribute('data-q') === sim.q); });
    [].forEach.call($('payIn').children, function(b){ b.classList.toggle('on', b.getAttribute('data-p') === sim.p); });
    $('colOt').querySelector('.hd small').innerHTML = 'assinatura de ' + sim.m + ' meses · <span class="sav">à vista economiza ' + money(c.ot.save) + '</span>';
    $('colOs').querySelector('.hd small').innerHTML = 'pagamento único · <span class="sav">à vista economiza ' + money(c.os.save) + '</span>';
  }
  function setQ(q){ q = Math.max(1, Math.min(100000, Math.round(q) || 1)); sim.q = q; $('qIn').value = nf0.format(q); simRender(true); }
  $('qIn').addEventListener('input', function(){ var raw = this.value.replace(/\D/g, ''); if (raw){ sim.q = Math.min(100000, +raw); simRender(false); } });
  $('qIn').addEventListener('blur', function(){ setQ(sim.q); });
  $('qMinus').onclick = function(){ setQ(sim.q - (sim.q > 100 ? 50 : 10)); };
  $('qPlus').onclick = function(){ setQ(sim.q + (sim.q >= 100 ? 50 : 10)); };
  $('qChips').addEventListener('click', function(e){ var b = e.target.closest('button'); if (b) setQ(+b.getAttribute('data-q')); });
  $('mIn').addEventListener('input', function(){ sim.m = +this.value; simRender(true); });
  $('payIn').addEventListener('click', function(e){ var b = e.target.closest('button'); if (b){ sim.p = b.getAttribute('data-p'); simRender(true); } });
  $('simCopy').onclick = function(){
    var c = simCalc(), v = sim.p === 'v';
    var txt = 'Rastreamento de PDV · 75 LAB\n' + nf0.format(sim.q) + ' displays\n\n' +
      'ONE SHOT (rastreio estático)\nÀ vista: ' + money(c.os.vista) + ' em 1 parcela\nMensal: 12x de ' + money(c.os.parc) + ' (total ' + money(c.os.mensTot) + ')\n\n' +
      'ONTIMING (rastreio ao vivo, ' + sim.m + ' meses)\nÀ vista: ' + money(c.ot.vista) + ' em 1 parcela (20% off)\nMensal: ' + sim.m + 'x de ' + money(c.ot.parc) + ' (total ' + money(c.ot.mensTot) + ')\n\n' +
      'Simulador: ' + location.href.split('#')[0] + '#simulador';
    function done(){ var t = $('toast'); t.classList.add('on'); setTimeout(function(){ t.classList.remove('on'); }, 1800); }
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, done); else done();
  };
  simRender(false);

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
