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

  /* ================= cursor especial ================= */
  var curEl = $('cur'), dot = $('cdot');
  var mx = -100, my = -100, rx = -100, ry = -100, lastTrail = 0, ltx = 0, lty = 0;
  var fine = matchMedia('(pointer:fine)').matches;
  if (fine){
    document.addEventListener('mousemove', function(e){
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      var now = performance.now();
      if (now - lastTrail > 28 && Math.hypot(mx - ltx, my - lty) > 14){
        lastTrail = now; ltx = mx; lty = my;
        var t = document.createElement('i'); t.className = 'trail'; t.style.left = mx + 'px'; t.style.top = my + 'px';
        document.body.appendChild(t); setTimeout(function(){ t.remove(); }, 720);
      }
      var hov = e.target.closest && e.target.closest('button,a,input,[data-go],.uf,.oi,.hb,.mrow,.bst,.polaroid,.ptag');
      curEl.classList.toggle('on', !!hov);
    });
    document.addEventListener('mousedown', function(e){
      curEl.classList.add('down');
      var p = document.createElement('i'); p.className = 'ping'; p.style.left = e.clientX + 'px'; p.style.top = e.clientY + 'px';
      document.body.appendChild(p); setTimeout(function(){ p.remove(); }, 820);
    });
    document.addEventListener('mouseup', function(){ curEl.classList.remove('down'); });
    (function loop(){ rx += (mx - rx) * .2; ry += (my - ry) * .2; curEl.style.transform = 'translate(' + rx + 'px,' + ry + 'px)'; requestAnimationFrame(loop); })();
  }
  document.addEventListener('pointerdown', function(e){
    var r = stage.getBoundingClientRect(), s = r.width / 1600;
    lastPt = {x:(e.clientX - r.left) / s, y:(e.clientY - r.top) / s};
  });

  /* ================= 02 · problema ================= */
  var FUN = [['i-display','Produzidos',1],['i-truck','Chegaram na loja',.82],['i-ok','Montados',.61],['i-target','No lugar certo',.43],['i-clock','Ativos após 60 dias',.29]];
  $('funnel').innerHTML = FUN.map(function(f, k){
    var col = '<div class="fcol"><div class="bar" data-h="' + f[2] + '"><span class="num">0</span></div><div class="fl">' + ico(f[0]) + f[1] + '</div></div>';
    if (k < FUN.length - 1) col += '<div class="fgap"><div class="drip">' + ico('i-drop') + '<b data-l="' + k + '">0</b><small>sem registro</small></div></div>';
    return col;
  }).join('');
  function renderProb(){
    var q = +$('pRange').value;
    $('pRange').style.setProperty('--p', ((q - 100) / 9900 * 100) + '%');
    $('pQty').textContent = nf0.format(q); $('pQty2').textContent = nf0.format(q);
    var bars = $('funnel').querySelectorAll('.bar'), drips = $('funnel').querySelectorAll('.drip b');
    [].forEach.call(bars, function(b, k){ b.style.height = (FUN[k][2] * 220) + 'px'; b.querySelector('.num').textContent = nf0.format(Math.round(q * FUN[k][2])); });
    [].forEach.call(drips, function(d, k){ d.textContent = '-' + nf0.format(Math.round(q * FUN[k][2]) - Math.round(q * FUN[k + 1][2])); });
    $('pLoss').textContent = nf0.format(q - Math.round(q * .29));
  }
  $('pRange').addEventListener('input', renderProb);
  hooks.problema = function(){
    [].forEach.call($('funnel').querySelectorAll('.bar'), function(b){ b.style.height = '0px'; });
    setTimeout(renderProb, 350);
  };

  /* ================= 03 · comparador ================= */
  function duo(){ var v = $('duoR').value + '%'; $('tecnologias').style.setProperty('--x', v); }
  $('duoR').addEventListener('input', duo);
  hooks.tecnologias = function(){
    var el = $('duoR'), t0 = null, seq = [50, 64, 36, 50];
    function step(ts){ if (!t0) t0 = ts; var p = Math.min((ts - t0) / 2200, 1);
      var seg = Math.min(Math.floor(p * 3), 2), lp = p * 3 - seg, e = .5 - Math.cos(lp * Math.PI) / 2;
      el.value = seq[seg] + (seq[seg + 1] - seq[seg]) * e; duo(); if (p < 1) requestAnimationFrame(step); }
    setTimeout(function(){ requestAnimationFrame(step); }, 900);
  };
  // os botões dentro dos painéis ficam acima do range invisível só onde existem
  [].forEach.call(document.querySelectorAll('.s-duo .pc'), function(pc){ pc.style.pointerEvents = 'none'; });
  [].forEach.call(document.querySelectorAll('.s-duo .go'), function(g){ g.style.pointerEvents = 'auto'; g.style.position = 'relative'; g.style.zIndex = 8; });

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
          $('otLog').insertAdjacentHTML('afterbegin', '<p><b>' + hh + '</b> Display Loja 214 ' + OTEV[k][2] + '</p>');
        }
      }
      if (p < 1) otRun = requestAnimationFrame(step);
    }
    otRun = requestAnimationFrame(step);
  }
  $('otPlay').onclick = otPlay;
  hooks.ontiming = function(){ otDraw(0); $('otLog').innerHTML = ''; $('otS0').textContent = 'No CD · agora'; setTimeout(otPlay, 1100); };

  /* ================= 06 · órbita dos 17 ================= */
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
  var ring = $('orbRing'), R = 320;
  ring.innerHTML = IND.map(function(d, k){
    var a = k / IND.length * Math.PI * 2 - Math.PI / 2;
    return '<div class="oi" style="transform:translate(' + (Math.cos(a) * R) + 'px,' + (Math.sin(a) * R) + 'px)"><button data-k="' + k + '" aria-label="' + d[1] + '">' + ico(d[0]) + '</button></div>';
  }).join('');
  var TGL = {ambos:'<span class="tag lime" style="background:#fff">One Shot</span><span class="tag">OnTiming</span>', parcial:'<span class="tag" style="background:#fff;color:#0E1110">One Shot parcial</span><span class="tag">OnTiming</span>', ontiming:'<span class="tag">Só OnTiming</span>'};
  function orbShow(k){
    var d = IND[k];
    $('orbC').innerHTML = '<span class="lbl">Indicador ' + pad(k + 1) + '</span><b>' + d[1] + '</b><p>' + d[2] + '</p><div class="tg">' + TGL[d[4]] + '</div>';
    [].forEach.call(ring.querySelectorAll('button'), function(b, i){ b.classList.toggle('on', i === k); });
  }
  ring.addEventListener('mouseover', function(e){ var b = e.target.closest('button'); if (b) orbShow(+b.getAttribute('data-k')); });
  ring.addEventListener('click', function(e){ var b = e.target.closest('button'); if (b) go(IND[+b.getAttribute('data-k')][3]); });

  /* ================= 07 · execução ================= */
  var WK = [
    {e:210, pen:14, intro:11, pos:5.8}, {e:470, pen:29, intro:10, pos:5.1}, {e:690, pen:43, intro:10, pos:4.7},
    {e:860, pen:53, intro:9, pos:4.4}, {e:960, pen:59, intro:9, pos:4.3}, {e:1014, pen:62, intro:9, pos:4.2}
  ];
  var PLAN = 1200, CELL = 4, NCELL = 300; // 25 × 12
  var wf = $('waffle'); wf.innerHTML = new Array(NCELL + 1).join('<i></i>');
  $('weeks').innerHTML = WK.map(function(w, k){ return '<button data-k="' + k + '">Semana ' + (k + 1) + '</button>'; }).join('');
  function exSet(k){
    var w = WK[k], prevE = k ? WK[k - 1].e : 0;
    var on = Math.round(w.e / CELL), was = Math.round(prevE / CELL);
    [].forEach.call(wf.children, function(c, i){
      c.classList.toggle('on', i < was); c.classList.toggle('new', i >= was && i < on);
      c.style.transitionDelay = (i >= was && i < on) ? ((i - was) * 4) + 'ms' : '0ms';
    });
    [].forEach.call($('weeks').children, function(b, i){ b.classList.toggle('on', i === k); });
    tween($('exN'), w.e, function(v){ return nf0.format(Math.round(v)); });
    tween($('exPen'), w.pen, function(v){ return Math.round(v); });
    tween($('exIn'), w.intro, function(v){ return Math.round(v); });
    tween($('exPo'), w.pos, function(v){ return nf1.format(v); });
    $('exSub').textContent = 'de ' + nf0.format(PLAN) + ' planejadas · ' + nf1.format(w.e / PLAN * 100) + '%';
    $('exBar').style.width = (w.e / PLAN * 100) + '%';
  }
  $('weeks').addEventListener('click', function(e){ var b = e.target.closest('button'); if (b) exSet(+b.getAttribute('data-k')); });
  hooks.execucao = function(){
    var k = 0; exSet(0);
    var t = setInterval(function(){ k++; if (k >= WK.length || slides[cur].id !== 'execucao') return clearInterval(t); exSet(k); }, 900);
  };

  /* ================= 08 · positivação ================= */
  var UF = {
    RR:[3,0,22,'Boa Vista'], AP:[5,0,0,''],
    AM:[2,1,33,'Manaus'], PA:[4,1,38,'Belém'], MA:[6,1,36,'São Luís'], CE:[7,1,54,'Fortaleza'], RN:[8,1,47,'Natal'],
    AC:[1,2,0,''], RO:[2,2,28,'Porto Velho'], TO:[5,2,31,'Palmas'], PI:[6,2,42,'Teresina'], PE:[7,2,61,'Recife'], PB:[8,2,49,'João Pessoa'],
    MT:[3,3,41,'Cuiabá'], GO:[4,3,63,'Goiânia'], DF:[5,3,72,'Brasília'], BA:[6,3,58,'Salvador'], SE:[7,3,44,'Aracaju'], AL:[8,3,46,'Maceió'],
    MS:[3,4,46,'Campo Grande'], SP:[4,4,88,'São Paulo'], MG:[5,4,71,'Belo Horizonte'], ES:[6,4,57,'Vitória'],
    PR:[3,5,69,'Curitiba'], RJ:[5,5,76,'Rio de Janeiro'],
    SC:[3,6,74,'Florianópolis'], RS:[3,7,66,'Porto Alegre']
  };
  var UFN = {SP:'São Paulo',RJ:'Rio de Janeiro',MG:'Minas Gerais',PR:'Paraná',SC:'Santa Catarina',RS:'Rio Grande do Sul',BA:'Bahia',PE:'Pernambuco',CE:'Ceará',GO:'Goiás',DF:'Distrito Federal',ES:'Espírito Santo',MT:'Mato Grosso',MS:'Mato Grosso do Sul',PA:'Pará',AM:'Amazonas',MA:'Maranhão',RN:'Rio Grande do Norte',PB:'Paraíba',AL:'Alagoas',SE:'Sergipe',PI:'Piauí',TO:'Tocantins',RO:'Rondônia',RR:'Roraima',AP:'Amapá',AC:'Acre'};
  function band(v){ return !v ? '' : v < 40 ? 'b1' : v < 60 ? 'b2' : v < 75 ? 'b3' : 'b4'; }
  $('carto').innerHTML = Object.keys(UF).map(function(u){
    var d = UF[u];
    return '<button class="uf ' + band(d[2]) + '" data-u="' + u + '" style="left:' + (d[0] * 78 - 30) + 'px;top:' + (d[1] * 80 + 10) + 'px">' + u + (d[2] ? '<small>' + d[2] + '%</small>' : '') + '</button>';
  }).join('');
  function ufShow(u){
    var d = UF[u], lojas = d[2] ? Math.round(d[2] * 1.6 + 12) : 0;
    [].forEach.call($('carto').children, function(b){ b.classList.toggle('on', b.getAttribute('data-u') === u); });
    $('posDet').innerHTML = '<span class="lbl">' + UFN[u] + '</span><div class="num">' + d[2] + '<small>%</small></div>' +
      (d[2] ? '<p>' + Math.round(lojas * d[2] / 100) + ' de ' + lojas + ' lojas positivadas. Capital: ' + d[3] + '.</p>' : '<p>Estado fora do plano desta campanha.</p>');
  }
  $('carto').addEventListener('mouseover', function(e){ var b = e.target.closest('.uf'); if (b) ufShow(b.getAttribute('data-u')); });
  $('carto').addEventListener('click', function(e){ var b = e.target.closest('.uf'); if (b) ufShow(b.getAttribute('data-u')); });
  var CITY = [['São Paulo','SP',91,212],['Rio de Janeiro','RJ',78,118],['Belo Horizonte','MG',74,64],['Curitiba','PR',72,48],['Brasília','DF',72,40],['Campinas','SP',69,38],['Porto Alegre','RS',66,36],['Recife','PE',61,30],['Salvador','BA',58,34]];
  var FLAG = [['A','Bandeira Atacarejo',86,120],['B','Bandeira Hiper',79,96],['C','Bandeira Super Regional',71,88],['D','Bandeira Farma',64,74],['E','Bandeira Conveniência',52,60],['F','Bandeira Cash &amp; Carry',47,42]];
  function hbars(el, rows, isCity){
    el.innerHTML = rows.map(function(r){
      var badge = isCity ? r[1] : r[0], name = isCity ? r[0] : r[1];
      return '<div class="hb" data-p="' + r[2] + '"><span class="hn"><i>' + badge + '</i>' + name + '</span><span class="ht"><u></u><s></s></span><span class="hv">' + r[2] + '%<small> · ' + r[3] + ' lojas</small></span></div>';
    }).join('');
  }
  hbars($('cityBars'), CITY, true); hbars($('flagBars'), FLAG, false);
  function barsIn(el){ [].forEach.call(el.querySelectorAll('.hb'), function(h, i){ var u = h.querySelector('u'), s = h.querySelector('s'); u.style.width = '0'; s.style.width = '0';
    setTimeout(function(){ u.style.width = h.getAttribute('data-p') + '%'; s.style.width = '80%'; }, 80 + i * 70); }); }
  var POSDET = {
    city:'<span class="lbl">Cidades</span><div class="num">9<small> praças</small></div><p>Ranking de positivação por praça. A linha tracejada marca a meta de 80%.</p>',
    flag:'<span class="lbl">Bandeiras</span><div class="num">6<small> redes</small></div><p>Execução por bandeira para negociar com cada rede com dado na mão. Linha tracejada: meta de 80%.</p>'
  };
  $('posTabs').addEventListener('click', function(e){
    var b = e.target.closest('button'); if (!b) return; var v = b.getAttribute('data-v');
    [].forEach.call($('posTabs').children, function(x){ x.classList.toggle('on', x === b); });
    ['uf','city','flag'].forEach(function(k){ $('pv-' + k).classList.toggle('on', k === v); });
    if (v === 'uf') ufShow('SP'); else { $('posDet').innerHTML = POSDET[v]; barsIn($(v === 'city' ? 'cityBars' : 'flagBars')); }
  });
  hooks.positivacao = function(){ var t = $('posTabs').querySelector('.on').getAttribute('data-v'); if (t === 'uf') ufShow('SP'); else barsIn($(t === 'city' ? 'cityBars' : 'flagBars')); };

  /* ================= 09 · promotores ================= */
  var DUEL = [['Positivação',91,73,'%'],['Peças com foto válida',98,81,'%'],['Lojas visitadas por dia',6.1,8.4,''],['Tempo médio por loja (min)',38,22,'']];
  $('duel').innerHTML = DUEL.map(function(d){
    return '<div class="drow"><div class="l"><u data-w="' + d[1] + '"></u><b>' + (d[3] ? d[1] : nf1.format(d[1]).replace(',0','')) + d[3] + '</b></div><div class="m">' + d[0] + '</div><div class="r"><u data-w="' + d[2] + '"></u><b>' + (d[3] ? d[2] : nf1.format(d[2]).replace(',0','')) + d[3] + '</b></div></div>';
  }).join('');
  var RK = [['Promotor 07','own',96,7.2],['Promotor 12','own',93,6.4],['Promotor 03','shr',88,9.1],['Promotor 21','own',85,5.8],['Promotor 16','shr',79,8.7],['Promotor 30','shr',71,9.4]];
  function rankSet(m){
    var rows = RK.slice().sort(function(a, b){ return m === 'p' ? b[2] - a[2] : b[3] - a[3]; });
    var max = m === 'p' ? 100 : 10;
    $('rank').innerHTML = rows.map(function(r, i){
      var v = m === 'p' ? r[2] : r[3];
      return '<div class="rk"><em>' + pad(i + 1) + '</em><b>' + r[0] + '</b><span class="ty ' + r[1] + '">' + (r[1] === 'own' ? 'Próprio' : 'Compartilhado') + '</span><span class="tr"><i data-w="' + (v / max * 100) + '"></i></span><span>' + (m === 'p' ? v + '%' : nf1.format(v)) + '</span></div>';
    }).join('');
    setTimeout(function(){ [].forEach.call($('rank').querySelectorAll('.tr i'), function(i){ i.style.width = i.getAttribute('data-w') + '%'; }); }, 60);
    [].forEach.call($('rkTabs').children, function(b){ b.classList.toggle('on', b.getAttribute('data-m') === m); });
  }
  $('rkTabs').addEventListener('click', function(e){ var b = e.target.closest('button'); if (b) rankSet(b.getAttribute('data-m')); });
  hooks.promotores = function(){
    [].forEach.call($('duel').querySelectorAll('u'), function(u){ u.style.width = '0'; });
    setTimeout(function(){ [].forEach.call($('duel').querySelectorAll('.drow'), function(r){
      var us = r.querySelectorAll('u'), a = +us[0].getAttribute('data-w'), b = +us[1].getAttribute('data-w'), mx = Math.max(a, b);
      us[0].style.width = (a / mx * 72) + '%'; us[1].style.width = (b / mx * 72) + '%';
    }); }, 400);
    rankSet('p');
  };

  /* ================= 10 · loja ================= */
  var LIFE = [[0,'i-ok','Dia 0','<b>Instalado</b> em 14/09 pelo Promotor 07, com GPS e foto da fachada.'],[30,'i-eye','Dia 30','<b>Conferido</b> na visita de rotina: peça no lugar e abastecida.'],[60,'i-eye','Dia 60','<b>Conferido</b> de novo. Peça com desgaste leve no topo.'],[74,'i-alert','Dia 74','<b>Retirado</b> pela loja 16 dias antes do fim planejado. Última posição registrada.']];
  $('ltrack').insertAdjacentHTML('beforeend', LIFE.map(function(l, k){
    return '<div class="lm' + (k === 3 ? ' end' : '') + '" style="left:' + (l[0] / 90 * 100) + '%" data-k="' + k + '"><button>' + ico(l[1]) + '</button><span>' + l[2] + '</span></div>';
  }).join('') + '<div class="lm" style="left:100%;opacity:.5"><span style="top:-44px">Plano: 90 dias</span></div>');
  function lifeShow(k){ [].forEach.call($('ltrack').querySelectorAll('.lm[data-k]'), function(m, i){ m.classList.toggle('on', i === k); }); $('ltxt').innerHTML = LIFE[k][3]; }
  $('ltrack').addEventListener('mouseover', function(e){ var m = e.target.closest('.lm[data-k]'); if (m) lifeShow(+m.getAttribute('data-k')); });
  $('ltrack').addEventListener('click', function(e){ var m = e.target.closest('.lm[data-k]'); if (m) lifeShow(+m.getAttribute('data-k')); });
  hooks.loja = function(){ $('lfill').style.width = '0'; setTimeout(function(){ $('lfill').style.width = (74 / 90 * 100) + '%'; lifeShow(3); }, 500); };

  /* ================= 11 · logística ================= */
  var INV = [['Instalado na loja',816,'#C0EE4E'],['No CD',204,'#00837D'],['Em trânsito',108,'#1DD4C8'],['Com alerta',72,'#E5484D']];
  (function(){
    var total = INV.reduce(function(s, d){ return s + d[1]; }, 0), r = 78, c = 2 * Math.PI * r, off = 0, h = '';
    INV.forEach(function(d, k){
      var len = d[1] / total * c;
      h += '<circle class="arc" data-k="' + k + '" cx="100" cy="100" r="' + r + '" fill="none" stroke="' + d[2] + '" stroke-width="26" stroke-dasharray="' + (len - 3) + ' ' + (c - len + 3) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 100 100)"/>';
      off += len;
    });
    $('donut').innerHTML = h;
    $('invList').innerHTML = INV.map(function(d, k){ return '<li data-k="' + k + '"><i style="background:' + d[2] + '"></i><span>' + d[0] + '</span><b>' + nf0.format(d[1]) + '</b></li>'; }).join('');
    function hl(k){ [].forEach.call($('donut').querySelectorAll('.arc'), function(a, i){ a.classList.toggle('on', i === k); }); [].forEach.call($('invList').children, function(l, i){ l.classList.toggle('on', i === k); }); }
    $('invList').addEventListener('mouseover', function(e){ var l = e.target.closest('li'); if (l) hl(+l.getAttribute('data-k')); });
    $('donut').addEventListener('mouseover', function(e){ var a = e.target.closest('.arc'); if (a) hl(+a.getAttribute('data-k')); });
  })();
  var geoT = null;
  function geoRun(){
    var gd = $('gDot'), g = $('geof'), t0 = null; g.classList.remove('alarm');
    cancelAnimationFrame(geoT);
    function step(ts){ if (!t0) t0 = ts; var p = ((ts - t0) % 6000) / 6000;
      var a = p * Math.PI * 2, rr = p < .5 ? 30 + p * 40 : 50 + (p - .5) * 2 * 110;
      var x = 170 + Math.cos(a) * rr, y = 120 + Math.sin(a) * rr * .8;
      gd.setAttribute('cx', x); gd.setAttribute('cy', y);
      var out = Math.hypot(x - 170, y - 120) > 80;
      gd.setAttribute('fill', out ? '#E5484D' : '#1DD4C8'); g.classList.toggle('alarm', out);
      if (slides[cur].id === 'logistica') geoT = requestAnimationFrame(step);
    }
    geoT = requestAnimationFrame(step);
  }
  hooks.logistica = function(){ setTimeout(geoRun, 700); };

  /* ================= 12 · matriz ================= */
  var MXG = {execucao:'Execução', positivacao:'Positivação', promotores:'Promotores', loja:'Loja', logistica:'Logística'};
  $('mxTabs').innerHTML = '<button class="on" data-g="all">Todos</button>' + Object.keys(MXG).map(function(g){ return '<button data-g="' + g + '">' + MXG[g] + '</button>'; }).join('');
  var half = Math.ceil(IND.length / 2);
  function mxCol(list, start){
    return '<div><div class="mh"><span></span><span>Indicador</span><i>One Shot</i><i>OnTiming</i></div>' + list.map(function(d, k){
      var os = d[4] === 'ambos' ? '<i class="dotf"></i>' : d[4] === 'parcial' ? '<i class="doth"></i>' : '<i class="doto"></i>';
      return '<div class="mrow" data-g="' + d[3] + '"><svg class="mi"><use href="#' + d[0] + '"/></svg><span>' + d[1] + '</span><span class="c">' + os + '</span><span class="c"><i class="dotf l"></i></span></div>';
    }).join('') + '</div>';
  }
  $('mtab').innerHTML = mxCol(IND.slice(0, half), 0) + mxCol(IND.slice(half), half);
  $('mxTabs').addEventListener('click', function(e){
    var b = e.target.closest('button'); if (!b) return; var g = b.getAttribute('data-g');
    [].forEach.call($('mxTabs').children, function(x){ x.classList.toggle('on', x === b); });
    [].forEach.call($('mtab').querySelectorAll('.mrow'), function(r){ r.classList.toggle('dim', g !== 'all' && r.getAttribute('data-g') !== g); });
  });

  /* ================= 13 · tabela de preços ================= */
  var tPay = 'v', tMes = 12;
  function splitPrice(v){ var s = money(v).replace('R$', '').trim(); var p = s.split(','); return p[0] + '<small>,' + p[1] + '</small>'; }
  function renderTags(){
    var mes = tPay === 'v' ? PRICE.otVista : PRICE.otMensal;
    $('tOtV').innerHTML = splitPrice(mes);
    $('tOff').classList.toggle('hide', tPay !== 'v');
    $('tOtAlt').innerHTML = tPay === 'v'
      ? 'Plano de ' + tMes + ' meses: <b>' + money(PRICE.otVista * tMes) + '</b> por display em 1 parcela. Economia de <b>' + money((PRICE.otMensal - PRICE.otVista) * tMes) + '</b>.'
      : 'Plano de ' + tMes + ' meses: <b>' + tMes + 'x de ' + money(PRICE.otMensal) + '</b> por display. À vista sai 20% menor.';
    [].forEach.call($('tPay').children, function(b){ b.classList.toggle('on', b.getAttribute('data-p') === tPay); });
    [].forEach.call($('tMes').children, function(b){ b.classList.toggle('on', +b.getAttribute('data-m') === tMes); });
  }
  $('tPay').addEventListener('click', function(e){ var b = e.target.closest('button'); if (b){ tPay = b.getAttribute('data-p'); renderTags(); } });
  $('tMes').addEventListener('click', function(e){ var b = e.target.closest('button'); if (b){ tMes = +b.getAttribute('data-m'); renderTags(); } });
  $('tOsAlt').innerHTML = 'ou <b>12x de ' + money(PRICE.osParc / 12) + '</b> por display';
  renderTags();

  /* ================= 14 · simulador ================= */
  var sim = {q:500, m:12, p:'v'};
  var YES = '<span class="cell ck">' + ico('i-ok', 'y') + '</span>', NO = '<span class="cell ck">' + ico('i-no', 'n') + '</span>';
  function simCalc(){
    var q = sim.q, m = sim.m, v = sim.p === 'v';
    var os = { unit: v ? PRICE.osVista : PRICE.osParc, n: v ? 1 : 12 };
    os.total = q * os.unit; os.parc = os.total / os.n; os.save = q * (PRICE.osParc - PRICE.osVista);
    var ot = { mes: v ? PRICE.otVista : PRICE.otMensal, n: v ? 1 : m };
    ot.total = q * ot.mes * m; ot.parc = ot.total / ot.n; ot.save = q * (PRICE.otMensal - PRICE.otVista) * m;
    return {os:os, ot:ot};
  }
  function simRender(flash){
    var c = simCalc(), v = sim.p === 'v';
    $('sQtyLbl').textContent = nf0.format(sim.q) + ' displays · ' + (v ? 'à vista' : 'parcelado');
    $('mOut').textContent = sim.m;
    $('mIn').style.setProperty('--p', ((sim.m - 6) / 6 * 100) + '%');
    $('colOs').innerHTML =
      '<div class="cell hd"><span class="tag" style="background:var(--paper);color:var(--ink)">' + ico('i-cam') + 'estático</span><b>One Shot</b><small>pagamento único por display</small></div>' +
      '<div class="cell"><span class="v">' + money(c.os.unit) + '</span></div>' +
      '<div class="cell"><span class="v">' + (v ? '1 parcela' : '12 parcelas') + '</span></div>' +
      '<div class="cell"><span class="v">' + money(c.os.parc) + (v ? '' : '<small>/mês</small>') + '</span></div>' +
      '<div class="cell tot"><span class="v">' + money(c.os.total) + '</span></div>' +
      '<div class="cell gap"></div>' + YES + YES + YES + YES + NO + NO + NO + NO;
    $('colOt').innerHTML =
      '<div class="cell hd"><span class="tag">' + ico('i-live') + 'recomendado</span><b>OnTiming</b><small>assinatura de ' + sim.m + ' meses</small></div>' +
      '<div class="cell"><span class="v">' + money(c.ot.mes) + '<small>/mês</small></span></div>' +
      '<div class="cell"><span class="v">' + (v ? '1 parcela' : sim.m + ' parcelas') + '</span></div>' +
      '<div class="cell"><span class="v">' + money(c.ot.parc) + (v ? '' : '<small>/mês</small>') + '</span></div>' +
      '<div class="cell tot"><span class="v">' + money(c.ot.total) + '</span></div>' +
      '<div class="cell gap"></div>' + YES + YES + YES + YES + YES + YES + YES + YES;
    if (flash) [].forEach.call(document.querySelectorAll('#stab .tot'), function(t){ t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash'); });
    [].forEach.call($('qChips').children, function(b){ b.classList.toggle('on', +b.getAttribute('data-q') === sim.q); });
    [].forEach.call($('payIn').children, function(b){ b.classList.toggle('on', b.getAttribute('data-p') === sim.p); });
    var saveTxt = v ? 'Economia à vista: ' + money(c.ot.save) : 'Pagando à vista economiza ' + money(c.ot.save);
    $('colOt').querySelector('.hd small').innerHTML = 'assinatura de ' + sim.m + ' meses · <span class="sav">' + saveTxt + '</span>';
    $('colOs').querySelector('.hd small').innerHTML = v ? 'pagamento único · <span class="sav">economia de ' + money(c.os.save) + '</span>' : 'pagamento único em 12x';
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
    var txt = 'Rastreamento de PDV · 75 LAB\n' + nf0.format(sim.q) + ' displays · pagamento ' + (v ? 'à vista (20% off)' : 'parcelado') + '\n\n' +
      'ONE SHOT (rastreio estático)\n' + money(c.os.unit) + ' por display · ' + (v ? '1 parcela' : '12x de ' + money(c.os.parc)) + '\nTotal: ' + money(c.os.total) + '\n\n' +
      'ONTIMING (rastreio ao vivo, ' + sim.m + ' meses)\n' + money(c.ot.mes) + ' por display por mês · ' + (v ? '1 parcela' : sim.m + 'x de ' + money(c.ot.parc)) + '\nTotal: ' + money(c.ot.total) + '\n\n' +
      'Simulador: ' + location.href.split('#')[0] + '#simulador';
    function done(){ var t = $('toast'); t.classList.add('on'); setTimeout(function(){ t.classList.remove('on'); }, 1800); }
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, done); else done();
  };
  simRender(false);

  /* ================= 15 · qual escolher ================= */
  var ans = [];
  function decRender(){
    var qs = $('flow').querySelectorAll('.q'), arrs = $('flow').querySelectorAll('.farr');
    [].forEach.call(qs, function(q, k){
      q.classList.toggle('done', ans[k] !== undefined);
      q.classList.toggle('wait', k > ans.length);
      [].forEach.call(q.querySelectorAll('.yn button'), function(b){ b.classList.toggle('pick', ans[k] !== undefined && +b.getAttribute('data-a') === ans[k]); });
    });
    [].forEach.call(arrs, function(a, k){ a.classList.toggle('lit', ans[k] !== undefined); });
    var res = $('res');
    res.classList.remove('ready', 'ot');
    if (ans.length === 3){
      res.classList.add('ready');
      if (ans[1] || ans[2]){
        res.classList.add('ot'); $('resT').textContent = 'OnTiming ' + (ans[0] ? '12 meses' : '6 meses');
        $('resP').textContent = 'A peça viaja e tem valor: acompanhe do CD à loja e receba alerta de perda.';
      } else if (ans[0]){
        res.classList.add('ot'); $('resT').textContent = 'OnTiming 6 meses';
        $('resP').textContent = 'Peça de longa permanência: meça quanto tempo ela realmente trabalha na loja.';
      } else {
        $('resT').textContent = 'One Shot';
        $('resP').textContent = 'Ação curta e entrega direta: prove a execução com foto, GPS e positivação.';
      }
    } else { $('resT').textContent = 'Responda as 3 perguntas'; $('resP').textContent = 'A recomendação aparece aqui.'; }
  }
  $('flow').addEventListener('click', function(e){
    var b = e.target.closest('.yn button'); if (!b) return;
    var k = +b.closest('.q').getAttribute('data-q'); if (k > ans.length) return;
    ans = ans.slice(0, k); ans[k] = +b.getAttribute('data-a'); decRender();
  });
  $('decReset').onclick = function(){ ans = []; decRender(); };
  decRender();

  /* ================= 16 · escada ================= */
  var stairs = [].slice.call($('stair').querySelectorAll('.st'));
  var SPOS = [[150,200],[510,270],[870,340],[1240,410]];
  function stairSet(k){
    stairs.forEach(function(s, i){ s.classList.toggle('on', i === k); });
    var w = $('walker'); w.style.left = (SPOS[k][0] - 22 + 120) + 'px'; w.style.bottom = (SPOS[k][1] + 16) + 'px';
  }
  stairs.forEach(function(s, i){ s.addEventListener('click', function(){ stairSet(i); }); s.addEventListener('mouseenter', function(){ stairSet(i); }); });
  hooks.comecar = function(){
    stairSet(0); var k = 0;
    var t = setInterval(function(){ k++; if (k > 3 || slides[cur].id !== 'comecar') return clearInterval(t); stairSet(k); }, 1100);
  };

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
    [].forEach.call(to.querySelectorAll('[data-count]'), countUp);
    if (hooks[to.id]) hooks[to.id]();
    buildMenuState();
  })();
})();
