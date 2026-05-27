// ── Módulo Generación de PDF ──

// ─────────────────────────────────────────────
// GENERACIÓN DE PDF
// ─────────────────────────────────────────────
function generarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const W = 210; const M = 16; const TW = W - M*2;
  let y = 0; let pageNum = 1;

  // ── Paleta Proterm ──
  const BLUE   = [0, 114, 188];
  const BLUE2  = [0, 90, 150];
  const ORANGE = [247, 148, 29];
  const RED_P  = [230, 51, 41];
  const DARK   = [26, 34, 51];
  const GRAY   = [100, 110, 130];
  const LGRAY  = [210, 217, 230];
  const BGPAGE = [242, 245, 249];
  const OKBG   = [230, 242, 251];
  const WARNBG = [254, 243, 231];
  const ERRBG  = [253, 234, 234];
  const WARNC  = [132, 80, 0];
  const ERRC   = [139, 26, 26];
  const WHITE  = [255, 255, 255];
  const GREENOK= [21, 95, 138];

  // ── Datos del formulario ──
  const nombre   = document.getElementById('p_nombre').value   || 'Edificio sin nombre';
  const dir      = document.getElementById('p_dir').value      || '—';
  const inspector= document.getElementById('p_inspector').value|| '—';
  const informe  = document.getElementById('p_informe').value  || '—';
  const fecha    = document.getElementById('p_fecha').value    || new Date().toISOString().slice(0,10);
  const cliente  = document.getElementById('p_cliente').value  || 'Administración';
  const depto    = document.getElementById('p_depto').value    || '—';
  const consumoBase = parseFloat(document.getElementById('p_consumo').value) || 0;
  const tarifa   = parseFloat(document.getElementById('p_tarifa').value) || 380;
  const tgas     = parseFloat(document.getElementById('c_tgas').value);
  const ta       = parseFloat(document.getElementById('c_ta').value) || 20;
  const o2       = parseFloat(document.getElementById('c_o2').value);
  const co       = parseFloat(document.getElementById('c_co').value);
  const pot      = parseFloat(document.getElementById('c_pot').value);
  const reg      = document.getElementById('c_reg').value;
  const marca    = document.getElementById('c_marca').value || '—';
  const cObs     = document.getElementById('c_obs').value;
  const tacum    = parseFloat(document.getElementById('a_tacum').value);
  const tiempo   = parseFloat(document.getElementById('a_tiempo').value);
  const retorno  = getToggle('tg_retorno');
  const contador = getToggle('tg_contador');
  const aObs     = document.getElementById('a_obs').value;
  const iObs     = document.getElementById('i_obs').value;
  const rend     = window._rendCalc != null ? window._rendCalc : null;

  const ahorro   = calcAhorro();
  const findings = buildFindings();
  const acciones = buildPlanAccion(findings);
  const noCump   = checkItems.filter(c => checks[c.id] === 'no').length;
  const okCump   = checkItems.filter(c => checks[c.id] === 'si').length;
  const urgentes = findings.filter(f => f.urgente).length;
  const medias   = findings.filter(f => !f.urgente).length;

  // ── Siegert ──
  let rendCalc=null, qA=null, ea=null, co2=null;
  if (!isNaN(tgas) && !isNaN(o2) && o2 < 21) {
    qA = (tgas - ta) * (0.66 / (21 - o2) + 0.009);
    rendCalc = Math.max(0, 100 - qA);
    ea  = o2 * 100 / (21 - o2);
    co2 = 11.7 * (21 - o2) / 21;
  }

  // ── Score global ──
  let pen = 0;
  if (rend != null) { pen += rend < 85 ? 20 : rend < 91 ? 8 : 0; }
  if (!isNaN(tgas)) { pen += tgas > 200 ? 15 : tgas > 160 ? 7 : 0; }
  if (!isNaN(o2) && (o2 > 10 || o2 < 2)) pen += 10;
  if (!isNaN(co) && co > 100) pen += 10;
  if (!isNaN(tacum) && tacum < 60) pen += 15;
  if (retorno === 'no') pen += 8;
  if (contador === 'no') pen += 5;
  tramosData.forEach(t => {
    if (!t.diam || !t.temp) return;
    const eMin = (espesoresMin[t.diam]?.[t.temp]||30)+(t.ubic==='ext'?10:0);
    const eMed = parseFloat(t.esp);
    if (!isNaN(eMed) && eMed < eMin) pen += 8;
  });
  pen += noCump * 4;
  const score = Math.max(0, Math.min(100, 100 - pen));
  const scoreColor = score >= 75 ? BLUE : score >= 50 ? ORANGE : [230,51,41];
  const scoreLabel = score >= 75 ? 'Buena condición' : score >= 50 ? 'Condición regular' : 'Condición deficiente';

  // ═══════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════
  function footer() {
    doc.setFillColor(...BLUE); doc.rect(0, 285, W, 12, 'F');
    doc.setFontSize(7.5); doc.setFont('helvetica','normal'); doc.setTextColor(...WHITE);
    doc.text(`Proterm Ambiente y Energía  ·  Auditoría Térmica RITCH 2007  ·  ${nombre}`, M, 291);
    doc.text(`Pág. ${pageNum}`, W-M, 291, { align:'right' });
  }

  function newPage() {
    footer();
    doc.addPage(); pageNum++;
    y = M;
    // Línea superior azul fina
    doc.setFillColor(...BLUE); doc.rect(0, 0, W, 3, 'F');
    doc.setFillColor(...ORANGE); doc.rect(0, 3, W, 1, 'F');
    y = 10;
  }

  function checkY(needed) { if (y + needed > 278) newPage(); }

  // Título de sección estilo dashboard
  function secTitle(txt, icon='') {
    checkY(14);
    doc.setFillColor(...BLUE); doc.roundedRect(M, y, 3, 9, 1, 1, 'F');
    doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(...BLUE);
    doc.text(txt, M+6, y+6.5);
    y += 13;
  }

  // Subsección label
  function subLabel(txt) {
    checkY(8);
    doc.setFontSize(8); doc.setFont('helvetica','bold');
    doc.setTextColor(...GRAY);
    doc.text(txt.toUpperCase(), M, y);
    y += 6;
  }

  // Texto normal con wrap
  function bodyText(txt, indent=0, color=DARK, size=9) {
    doc.setFontSize(size); doc.setFont('helvetica','normal'); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(txt, TW - indent);
    checkY(lines.length * 5 + 2);
    doc.text(lines, M + indent, y);
    y += lines.length * 5 + 1;
  }

  // Caja de alerta con borde izquierdo
  function alertBox(txt, type='warn') {
    const bg = type==='ok'?OKBG : type==='error'?ERRBG : WARNBG;
    const tc = type==='ok'?GREENOK : type==='error'?ERRC : WARNC;
    const bc = type==='ok'?BLUE : type==='error'?[230,51,41] : ORANGE;
    const lines = doc.splitTextToSize(txt, TW - 14);
    const h = lines.length * 4.8 + 7;
    checkY(h + 3);
    doc.setFillColor(...bg); doc.roundedRect(M, y, TW, h, 2, 2, 'F');
    doc.setFillColor(...bc); doc.rect(M, y, 2.5, h, 'F');
    doc.setFontSize(8.5); doc.setFont('helvetica','normal'); doc.setTextColor(...tc);
    doc.text(lines, M + 6, y + 5.5);
    y += h + 3;
  }

  // KPI box pequeño
  function kpiBox(x, yy, w, h, val, lbl, valColor=BLUE) {
    doc.setFillColor(242, 245, 249); doc.roundedRect(x, yy, w, h, 2, 2, 'F');
    doc.setDrawColor(...LGRAY); doc.setLineWidth(0.3);
    doc.roundedRect(x, yy, w, h, 2, 2, 'S');
    doc.setFontSize(16); doc.setFont('helvetica','bold'); doc.setTextColor(...valColor);
    doc.text(String(val), x + w/2, yy + h*0.52, { align:'center' });
    doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(...GRAY);
    const lblLines = doc.splitTextToSize(lbl, w - 4);
    doc.text(lblLines, x + w/2, yy + h*0.78, { align:'center' });
  }

  // Barra horizontal con rango tricolor
  function rangeBar(x, yy, w, h, pct, colorFill) {
    doc.setFillColor(...LGRAY); doc.roundedRect(x, yy, w, h, h/2, h/2, 'F');
    if (pct > 0) {
      const fw = Math.min(w, w * pct / 100);
      doc.setFillColor(...colorFill); doc.roundedRect(x, yy, fw, h, h/2, h/2, 'F');
    }
  }

  // Fila de tabla con zebra
  function tableRow(cols, widths, yy, even, header=false) {
    const rowH = header ? 8 : 7.5;
    const totalW = widths.reduce((a,b)=>a+b,0);
    if (header) {
      doc.setFillColor(...BLUE); doc.roundedRect(M, yy, totalW, rowH, 1, 1, 'F');
    } else {
      doc.setFillColor(...(even ? [242,245,249] : WHITE));
      doc.rect(M, yy, totalW, rowH, 'F');
    }
    let cx = M;
    cols.forEach((col, i) => {
      const align = col.align || 'left';
      const color = header ? WHITE : (col.color || DARK);
      const bold  = header || col.bold;
      doc.setFontSize(header ? 7.5 : 8);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...color);
      const tx = align === 'right' ? cx + widths[i] - 2 : align === 'center' ? cx + widths[i]/2 : cx + 2;
      const ay = yy + (header ? 5.5 : 5);
      const maxW = widths[i] - 4;
      const txt = String(col.text || '');
      const lines = doc.splitTextToSize(txt, maxW);
      doc.text(lines[0], tx, ay, { align });
      cx += widths[i];
    });
    return rowH;
  }

  // Badge de estado (texto + punto de color)
  function statusDot(x, yy, estado) {
    const map = {
      'OK':       BLUE,   'Óptimo':   BLUE,
      'Aceptable':ORANGE, 'Elevado':  ORANGE, 'Bajo': ORANGE,
      'Alto':     [230,51,41], 'Crítico':[230,51,41], 'Excesivo':[230,51,41],
    };
    const c = map[estado] || GRAY;
    doc.setFillColor(...c); doc.circle(x + 2, yy + 3.5, 2, 'F');
    doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(...c);
    doc.text(estado, x + 6, yy + 5);
  }

  // ═══════════════════════════════════════════════
  // PÁG 1 — PORTADA + RESUMEN EJECUTIVO
  // ═══════════════════════════════════════════════
  // Header portada
  doc.setFillColor(...BLUE); doc.rect(0, 0, W, 55, 'F');
  doc.setFillColor(...ORANGE); doc.rect(0, 55, W, 3, 'F');

  // Logo real Proterm (imagen PNG embebida)
  // El logo tiene fondo negro, lo ponemos sobre un rect blanco redondeado
  doc.setFillColor(255,255,255); doc.roundedRect(M, 8, 52, 26, 3, 3, 'F');
  if (window.LOGO_PDF_B64) {
    doc.addImage(window.LOGO_PDF_B64, 'PNG', M+1, 9, 50, 24);
  } else {
    // Fallback texto si no carga la imagen
    doc.setFontSize(14); doc.setFont('helvetica','bold'); doc.setTextColor(...BLUE);
    doc.text('Proterm', M+4, 20);
    doc.setFontSize(7); doc.setFont('helvetica','normal');
    doc.text('Ambiente y Energía', M+4, 26);
  }

  // Título derecha
  doc.setFontSize(7.5); doc.setTextColor(180, 215, 240);
  doc.text('INFORME DE AUDITORÍA TÉRMICA  ·  RITCH 2007', W-M, 18, { align:'right' });
  doc.setFontSize(15); doc.setFont('helvetica','bold'); doc.setTextColor(...WHITE);
  doc.text(nombre, M, 38);
  doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(200, 225, 245);
  doc.text(dir, M, 46);
  doc.setFontSize(8); doc.setTextColor(150, 200, 235);
  doc.text(`Informe N° ${informe}  ·  ${fecha}`, W-M, 46, { align:'right' });

  // Metadata strip
  y = 64;
  doc.setFillColor(242, 245, 249); doc.roundedRect(M, y, TW, 28, 2, 2, 'F');
  doc.setDrawColor(...LGRAY); doc.setLineWidth(0.3);
  doc.roundedRect(M, y, TW, 28, 2, 2, 'S');
  // 4 columnas
  const mcols = [[M+3,'Inspector',inspector],[M+TW/4+3,'Fecha',fecha],[M+TW/2+3,'Destinatario',cliente],[M+TW*3/4+3,'N° Deptos.',depto]];
  mcols.forEach(([mx, lbl, val]) => {
    doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(...GRAY);
    doc.text(lbl, mx, y+8);
    doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(...DARK);
    doc.text(String(val), mx, y+15);
  });
  // Líneas divisoras
  [TW/4, TW/2, TW*3/4].forEach(dx => {
    doc.setDrawColor(...LGRAY); doc.setLineWidth(0.3);
    doc.line(M+dx, y+4, M+dx, y+24);
  });
  y += 34;

  // ── Score + KPIs ──
  secTitle('Resumen ejecutivo');

  // Score círculo
  const scoreR = 16;
  const scX = M + scoreR + 2; const scY = y + scoreR + 2;
  doc.setFillColor(...scoreColor); doc.circle(scX, scY, scoreR, 'F');
  doc.setFillColor(...WHITE); doc.circle(scX, scY, scoreR - 3, 'F');
  doc.setFontSize(14); doc.setFont('helvetica','bold'); doc.setTextColor(...scoreColor);
  doc.text(String(score), scX, scY + 1, { align:'center' });
  doc.setFontSize(6.5); doc.setFont('helvetica','normal'); doc.setTextColor(...GRAY);
  doc.text('/ 100', scX, scY + 6, { align:'center' });
  // Label score
  doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(...scoreColor);
  doc.text(scoreLabel, scX + scoreR + 4, scY - 2);
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(...GRAY);
  doc.text('Score de condición global de la instalación térmica', scX + scoreR + 4, scY + 4);

  y += scoreR * 2 + 8;

  // Grid de KPIs 6 columnas
  const kw = TW / 6; const kh = 20;
  const kpis = [
    { val:urgentes,  lbl:'Urgentes',        color: urgentes>0?[230,51,41]:BLUE },
    { val:medias,    lbl:'Defic. medias',   color: medias>0?ORANGE:BLUE },
    { val:okCump,    lbl:'Conformes RITCH', color: BLUE },
    { val:rend!=null?rend.toFixed(1)+'%':'N/D', lbl:'Rendimiento η',color:rend==null?GRAY:rend>=91?BLUE:rend>=85?ORANGE:[230,51,41] },
    { val:ahorro.pctTotal+'%', lbl:'Ahorro potencial', color:ahorro.pctTotal>0?BLUE:GRAY },
    { val:ahorro.totalAhorro>0?'$'+Math.round(ahorro.totalPesos/1000)+'K':'—', lbl:'Ahorro CLP/año', color:BLUE },
  ];
  checkY(kh + 4);
  kpis.forEach((k, i) => kpiBox(M + i*kw, y, kw - 1, kh, k.val, k.lbl, k.color));
  y += kh + 6;

  // Ahorro destacado
  if (ahorro.totalAhorro > 0) {
    checkY(16);
    doc.setFillColor(...OKBG); doc.roundedRect(M, y, TW, 14, 2, 2, 'F');
    doc.setFillColor(...BLUE); doc.roundedRect(M, y, 3, 14, 1, 1, 'F');
    doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(...BLUE);
    doc.text('Ahorro potencial total aplicando medidas correctivas:', M+6, y+5);
    doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(...BLUE);
    doc.text(`${ahorro.totalAhorro.toLocaleString()} m³/año  ·  $${Math.round(ahorro.totalPesos/1000).toLocaleString()}K CLP/año  ·  ${ahorro.pctTotal}% de reducción`, M+6, y+11);
    y += 18;
  }

  // ═══════════════════════════════════════════════
  // PÁG 2 — RESULTADOS ANALÍTICOS
  // ═══════════════════════════════════════════════
  newPage();
  secTitle('Resultados analíticos por parámetro');

  // Cabecera tabla
  const cw = [28, 38, 24, 24, 26, 28]; // anchos columnas
  const headers = [
    {text:'Sistema'}, {text:'Parámetro'}, {text:'Medido',align:'center'},
    {text:'Referencia',align:'center'}, {text:'Rango',align:'center'}, {text:'Estado',align:'center'}
  ];
  checkY(10);
  tableRow(headers, cw, y, true, true);
  y += 8;

  // Función fila de resultado
  function resultRow(sistema, param, val, ref, pctBar, colorBar, estado) {
    checkY(9);
    const even = (y % 2 === 0);
    doc.setFillColor(...(even ? [245,248,252] : WHITE));
    doc.rect(M, y, TW, 8, 'F');
    // Línea separadora
    doc.setDrawColor(...LGRAY); doc.setLineWidth(0.15);
    doc.line(M, y+8, M+TW, y+8);

    let cx = M;
    // Sistema
    doc.setFontSize(7.5); doc.setFont('helvetica','normal'); doc.setTextColor(...GRAY);
    doc.text(sistema, cx+2, y+5.5); cx += cw[0];
    // Parámetro
    doc.setFont('helvetica','bold'); doc.setTextColor(...DARK);
    doc.text(param, cx+2, y+5.5); cx += cw[1];
    // Valor
    doc.setFont('helvetica','bold'); doc.setTextColor(...DARK);
    doc.text(String(val), cx + cw[2]/2, y+5.5, {align:'center'}); cx += cw[2];
    // Referencia
    doc.setFont('helvetica','normal'); doc.setTextColor(...GRAY);
    doc.text(ref, cx + cw[3]/2, y+5.5, {align:'center'}); cx += cw[3];
    // Barra
    if (pctBar !== null) {
      rangeBar(cx + 2, y + 2, cw[4]-4, 4, pctBar, colorBar);
    }
    cx += cw[4];
    // Estado con punto de color
    statusDot(cx, y, estado);
    y += 8;
  }

  function estadoColor(e) {
    if (e==='OK'||e==='Óptimo') return BLUE;
    if (e==='Aceptable'||e==='Elevado'||e==='Bajo') return ORANGE;
    return [230,51,41];
  }
  function pctInRange(val, min, max) { return Math.min(100,Math.max(0,(val-min)/(max-min)*100)); }

  // Caldera
  subLabel('Caldera y combustión');
  resultRow('Caldera','Rendimiento η',
    rendCalc!=null?rendCalc.toFixed(1)+'%':'—', '≥ 91%',
    rendCalc!=null?pctInRange(rendCalc,70,100):null, BLUE,
    rendCalc==null?'N/D':rendCalc>=91?'Óptimo':rendCalc>=85?'Aceptable':'Bajo');

  resultRow('Caldera','Temp. gases Tg',
    !isNaN(tgas)?tgas+' °C':'—', '120–160 °C',
    !isNaN(tgas)?pctInRange(Math.min(tgas,300),100,300):null,
    tgas<=160?BLUE:tgas<=200?ORANGE:[230,51,41],
    !isNaN(tgas)?(tgas<=160?'OK':tgas<=200?'Elevado':'Crítico'):'N/D');

  resultRow('Caldera','O₂ en gases',
    !isNaN(o2)?o2.toFixed(1)+' %':'—', '3–5 %',
    !isNaN(o2)?pctInRange(o2,0,21):null,
    o2>=2&&o2<=6?BLUE:o2<=10?ORANGE:[230,51,41],
    !isNaN(o2)?(o2>=2&&o2<=6?'OK':o2<=10?'Elevado':'Excesivo'):'N/D');

  resultRow('Caldera','CO en chimenea',
    !isNaN(co)?co+' ppm':'—', '< 100 ppm',
    !isNaN(co)?pctInRange(Math.min(co,2000),0,2000):null,
    co<=100?BLUE:co<=500?ORANGE:[230,51,41],
    !isNaN(co)?(co<=100?'OK':co<=500?'Alto':'Crítico'):'N/D');

  if (rendCalc!=null) {
    resultRow('Caldera','Pérdida qA',
      qA.toFixed(1)+' %', '< 8 %',
      pctInRange(Math.min(qA,20),0,20),
      qA<=8?BLUE:qA<=12?ORANGE:[230,51,41],
      qA<=8?'OK':qA<=12?'Aceptable':'Alto');

    resultRow('Caldera','Exceso de aire',
      ea.toFixed(1)+' %', '15–30 %',
      pctInRange(Math.min(ea,100),0,100),
      ea<=30?BLUE:ea<=60?ORANGE:[230,51,41],
      ea<=30?'OK':ea<=60?'Elevado':'Excesivo');
  }

  y += 4;
  subLabel('Agua caliente sanitaria (ACS)');

  resultRow('ACS','Temp. acumulación',
    !isNaN(tacum)?tacum+' °C':'—', '≥ 60 °C',
    !isNaN(tacum)?pctInRange(tacum,40,80):null,
    !isNaN(tacum)?(tacum>=60?BLUE:tacum>=55?ORANGE:[230,51,41]):GRAY,
    !isNaN(tacum)?(tacum>=60?'OK':tacum>=55?'Bajo':'Crítico'):'N/D');

  resultRow('ACS','Red de retorno',
    retorno==='si'?'Presente':retorno==='no'?'Ausente':'—', 'Obligatoria',
    retorno==='si'?100:retorno==='no'?0:null,
    BLUE, retorno==='si'?'OK':retorno==='no'?'Crítico':'N/D');

  resultRow('ACS','Tiempo llegada ACS',
    !isNaN(tiempo)?tiempo+' seg':'—', '≤ 30 seg',
    !isNaN(tiempo)?pctInRange(Math.min(tiempo,120),0,120):null,
    tiempo<=30?BLUE:tiempo<=60?ORANGE:[230,51,41],
    !isNaN(tiempo)?(tiempo<=30?'OK':tiempo<=60?'Elevado':'Crítico'):'N/D');

  resultRow('ACS','Contador individual',
    contador==='si'?'Presente':contador==='no'?'Ausente':'—', 'ITE 02.13',
    contador==='si'?100:contador==='no'?0:null,
    BLUE, contador==='si'?'OK':contador==='no'?'Crítico':'N/D');

  y += 4;
  if (tramosData.some(t=>t.diam&&t.temp)) {
    subLabel('Aislación de cañerías');
    tramosData.forEach((t, idx) => {
      if (!t.diam || !t.temp) return;
      const eMin = (espesoresMin[t.diam]?.[t.temp]||30)+(t.ubic==='ext'?10:0);
      const eMed = parseFloat(t.esp);
      const pct  = !isNaN(eMed) ? pctInRange(eMed, 0, eMin*2) : null;
      const ec   = !isNaN(eMed) ? (eMed>=eMin?BLUE:eMed>=eMin*0.7?ORANGE:[230,51,41]) : GRAY;
      const est  = !isNaN(eMed) ? (eMed>=eMin?'OK':eMed>=eMin*0.7?'Bajo':'Crítico') : 'N/D';
      resultRow(`Tramo ${idx+1}`, `${diamLabel(t.diam)} · ${tempLabel(t.temp)}`,
        !isNaN(eMed)?eMed+' mm':'—', `≥ ${eMin} mm`, pct, ec, est);
    });
  }

  // ═══════════════════════════════════════════════
  // PÁG 3 — HALLAZGOS + AHORRO
  // ═══════════════════════════════════════════════
  newPage();
  secTitle('Hallazgos y deficiencias detectadas');

  if (findings.length === 0) {
    alertBox('No se detectaron deficiencias relevantes con los datos ingresados.', 'ok');
  } else {
    findings.forEach((f, i) => {
      checkY(12);
      const urg = f.urgente;
      const bc  = urg ? [230,51,41] : ORANGE;
      doc.setFillColor(...(urg ? ERRBG : WARNBG));
      doc.roundedRect(M, y, TW, 10, 2, 2, 'F');
      doc.setFillColor(...bc); doc.roundedRect(M, y, 2.5, 10, 1, 1, 'F');
      // Número
      doc.setFillColor(...bc); doc.circle(M+8, y+5, 4, 'F');
      doc.setFontSize(7.5); doc.setFont('helvetica','bold'); doc.setTextColor(...WHITE);
      doc.text(String(i+1), M+8, y+6, {align:'center'});
      // Texto
      doc.setFontSize(8.5); doc.setFont('helvetica','bold'); doc.setTextColor(...DARK);
      doc.text(doc.splitTextToSize(f.titulo, TW-40)[0], M+15, y+5);
      doc.setFontSize(7.5); doc.setFont('helvetica','normal'); doc.setTextColor(...GRAY);
      doc.text(f.ref, M+15, y+9);
      // Badge
      doc.setFillColor(...bc);
      doc.roundedRect(M+TW-22, y+2.5, 20, 5.5, 1, 1, 'F');
      doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(...WHITE);
      doc.text(urg?'URGENTE':'MEDIA', M+TW-12, y+6.5, {align:'center'});
      y += 12;
    });
  }

  y += 4;
  secTitle('Estimación de ahorro en gas');

  if (ahorro.items.length === 0) {
    alertBox('No se detectaron deficiencias con impacto calculable, o faltan datos de consumo base.', 'warn');
  } else {
    if (consumoBase > 0) {
      doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(...GRAY);
      doc.text(`Consumo base: ${consumoBase.toLocaleString()} m³/año  ·  Tarifa: $${tarifa}/m³`, M, y);
      y += 7;
    }
    ahorro.items.forEach(it => {
      checkY(14);
      doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(...DARK);
      doc.text(it.concepto, M, y+4);
      doc.setFont('helvetica','bold'); doc.setTextColor(...BLUE);
      doc.text(`${it.ahorro.toLocaleString()} m³/año`, W-M, y+4, {align:'right'});
      doc.setFontSize(7.5); doc.setFont('helvetica','normal'); doc.setTextColor(...GRAY);
      doc.text(it.ref, M, y+9);
      // Barra con porcentaje
      const bw = TW * 0.55;
      rangeBar(M, y+11, bw, 3.5, it.ahorro/(ahorro.totalAhorro||1)*100, BLUE);
      doc.setFontSize(7.5); doc.setTextColor(...BLUE);
      doc.text(`${it.pct}%`, M+bw+3, y+14);
      y += 16;
    });
    // Total
    checkY(14);
    doc.setFillColor(...OKBG); doc.roundedRect(M, y, TW, 12, 2, 2, 'F');
    doc.setFillColor(...BLUE); doc.roundedRect(M, y, 3, 12, 1, 1, 'F');
    doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(...BLUE);
    doc.text('Total estimado:', M+6, y+5);
    doc.setFontSize(10);
    doc.text(`${ahorro.totalAhorro.toLocaleString()} m³/año  ·  $${Math.round(ahorro.totalPesos/1000).toLocaleString()}K CLP/año  ·  ${ahorro.pctTotal}% reducción`, M+6, y+10);
    y += 16;
  }

  // ═══════════════════════════════════════════════
  // PÁG 4 — PLAN DE ACCIÓN + CHECKLIST + FIRMA
  // ═══════════════════════════════════════════════
  newPage();
  secTitle('Plan de acción priorizado');

  acciones.forEach((ac, i) => {
    checkY(13);
    const pColor = i===0?[230,51,41]:i<=2?ORANGE:BLUE;
    doc.setFillColor(242, 245, 249); doc.roundedRect(M, y, TW, 11, 2, 2, 'F');
    // Número circular
    doc.setFillColor(...pColor); doc.circle(M+6, y+5.5, 4.5, 'F');
    doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(...WHITE);
    doc.text(String(i+1), M+6, y+6.8, {align:'center'});
    // Título y meta
    doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(...DARK);
    const titulo = doc.splitTextToSize(ac.titulo, TW-50)[0];
    doc.text(titulo, M+14, y+5);
    doc.setFontSize(7.5); doc.setFont('helvetica','normal'); doc.setTextColor(...GRAY);
    doc.text(ac.meta, M+14, y+9.5);
    // Plazo badge
    doc.setFillColor(...pColor);
    doc.roundedRect(W-M-28, y+2, 26, 7, 1, 1, 'F');
    doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(...WHITE);
    doc.text(ac.plazo, W-M-15, y+6.5, {align:'center'});
    y += 13;
  });

  y += 4;
  secTitle('Checklist de cumplimiento RITCH');

  // Tabla checklist
  const chW = [TW-28, 20, 8];
  checkY(9);
  tableRow([{text:'Ítem evaluado'},{text:'Ref. RITCH',align:'center'},{text:'',align:'center'}], chW, y, true, true);
  y += 8;

  checkItems.forEach((item, ri) => {
    checkY(8);
    const val = checks[item.id];
    doc.setFillColor(...(ri%2===0 ? [245,248,252] : WHITE));
    doc.rect(M, y, TW, 7.5, 'F');
    doc.setDrawColor(...LGRAY); doc.setLineWidth(0.15);
    doc.line(M, y+7.5, M+TW, y+7.5);
    // Ícono estado
    const ic = val==='si'?'✓':val==='no'?'✗':val==='na'?'—':'?';
    const ic_color = val==='si'?BLUE:val==='no'?[230,51,41]:GRAY;
    doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(...ic_color);
    doc.text(ic, M+2, y+5.5);
    // Label
    doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(...DARK);
    doc.text(item.label, M+8, y+5.5);
    // Ref
    doc.setFontSize(7); doc.setTextColor(...GRAY);
    doc.text(item.ref, M+chW[0]+chW[1]/2, y+5.5, {align:'center'});
    y += 7.5;
  });

  // Resumen cumplimiento
  y += 4;
  checkY(12);
  doc.setFillColor(242, 245, 249); doc.roundedRect(M, y, TW, 10, 2, 2, 'F');
  const totalEval = checkItems.filter(c=>checks[c.id]!==null).length;
  const pctCump = totalEval > 0 ? Math.round(okCump/totalEval*100) : 0;
  doc.setFontSize(8); doc.setFont('helvetica','bold');
  doc.setTextColor(...BLUE); doc.text(`✓ ${okCump} conformes`, M+4, y+6);
  doc.setTextColor(...[230,51,41]); doc.text(`✗ ${noCump} no conformes`, M+40, y+6);
  doc.setTextColor(...GRAY); doc.text(`${totalEval}/${checkItems.length} evaluados`, M+90, y+6);
  // Mini barra cumplimiento
  rangeBar(M+130, y+3, 40, 4, pctCump, BLUE);
  doc.setFontSize(7.5); doc.setFont('helvetica','bold'); doc.setTextColor(...BLUE);
  doc.text(`${pctCump}%`, M+173, y+6.5);
  y += 14;

  // ── Certificado y firmas ──
  secTitle('Certificado y firmas');
  alertBox('El suscrito certifica que la inspección fue realizada conforme al Reglamento de Instalaciones Térmicas en los Edificios (RITCH 2007). Los resultados consignados reflejan las condiciones observadas en terreno a la fecha de visita.', 'ok');

  y += 6;
  checkY(32);
  // Dos zonas de firma
  [[M, inspector, 'Inspector responsable', 'Auditor térmico RITCH'],
   [M + TW/2 + 4, cliente, 'Recibido conforme', 'Fecha: ___/___/______']
  ].forEach(([sx, name, role, sub]) => {
    doc.setDrawColor(...LGRAY); doc.setLineWidth(0.4);
    doc.line(sx, y+18, sx+70, y+18);
    doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(...DARK);
    doc.text(name, sx, y+24);
    doc.setFontSize(7.5); doc.setFont('helvetica','normal'); doc.setTextColor(...GRAY);
    doc.text(role, sx, y+29);
    doc.text(sub, sx, y+34);
  });
  y += 40;

  doc.setFontSize(7.5); doc.setFont('helvetica','normal'); doc.setTextColor(...GRAY);
  const disc = 'Este informe no reemplaza el Certificado de Instalación formal requerido por el RITCH (Art. 10°). Las observaciones urgentes deben subsanarse antes de la próxima temporada de calefacción.';
  const discL = doc.splitTextToSize(disc, TW);
  checkY(discL.length * 4.5 + 2);
  doc.text(discL, M, y);

  footer();
  const filename = `EdificiosProterm_${nombre.replace(/\s+/g,'-')}_${fecha}.pdf`;
  doc.save(filename);
}


function buildPlanAccion(findings) {
  const plan = [];

  // Seguridad siempre primero
  const segItems = checkItems.filter(c => checks[c.id]==='no' && c.prioridad==='alta');
  segItems.forEach(it => plan.push({ titulo:it.label, meta:`Seguridad · ${it.ref}`, plazo:'Inmediato' }));

  // Déficit aislación — recorrer todos los tramos
  tramosData.forEach((t, idx) => {
    if (!t.diam || !t.temp) return;
    const espMin = (espesoresMin[t.diam]?.[t.temp]||30) + (t.ubic==='ext'?10:0);
    const espMed = parseFloat(t.esp);
    if (!isNaN(espMed) && espMed < espMin) {
      plan.push({ titulo:`Corregir aislación Tramo ${idx+1} (${diamLabel(t.diam)}) a mínimo ${espMin} mm`, meta:`Apéndice 03.1 · Mayor ahorro en gas`, plazo:'1–2 meses' });
    }
    if (t.estado === 'ausente') {
      plan.push({ titulo:`Instalar aislación en Tramo ${idx+1} (${diamLabel(t.diam)} · ${tempLabel(t.temp)})`, meta:'ITE 03.12 · Sin aislación detectada', plazo:'Inmediato' });
    }
  });

  // Caldera
  const tgas = parseFloat(document.getElementById('c_tgas').value);
  if (tgas > 180) plan.push({ titulo:'Limpieza conducto de humos y chimenea caldera', meta:'ITE 08.1.3 · Reducción consumo gas', plazo:'1 mes' });

  const rend = ( window._rendCalc !== undefined ? window._rendCalc : NaN );
  if (rend && rend < 85) plan.push({ titulo:'Revisión y mantención quemador caldera', meta:'ITE 04.9 · Mejorar rendimiento', plazo:'1 mes' });

  // ACS
  const retorno = getToggle('tg_retorno');
  if (retorno === 'no') plan.push({ titulo:'Instalar o reparar red de retorno ACS + circulador', meta:'ITE 02.5.3 · Ahorro energía ACS', plazo:'2–3 meses' });

  const tacum = parseFloat(document.getElementById('a_tacum').value);
  if (tacum && tacum < 60) plan.push({ titulo:'Subir temperatura acumulación ACS a mínimo 60 °C', meta:'ITE 02.5.1 · Prevención legionela', plazo:'Inmediato' });

  const contador = getToggle('tg_contador');
  if (contador === 'no') plan.push({ titulo:'Instalar contadores individuales de ACS por vivienda', meta:'ITE 02.13 · Obligatorio', plazo:'3–6 meses' });

  // Mantención
  if (checks['ch6'] === 'no') plan.push({ titulo:'Implementar registro de mantención preventiva', meta:'ITE 08.1.4 · Sin costo de inversión', plazo:'Inmediato' });

  return plan;
}

// ─────────────────────────────────────────────
// INICIALIZACIÓN
// ─────────────────────────────────────────────
buildChecklist();
document.getElementById('p_fecha').valueAsDate = new Date();
agregarTramo(); // Primer tramo automático
