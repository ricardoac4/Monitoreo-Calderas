// ── Módulo Resumen — Dashboard de Resultados ──

// ─────────────────────────────────────────────
// CÁLCULO DE AHORRO EN GAS
// ─────────────────────────────────────────────
function calcAhorro() {
  const consumoBase = parseFloat(document.getElementById('p_consumo').value) || 5000;
  const tarifa = parseFloat(document.getElementById('p_tarifa').value) || 380;
  let items = [];

  // 1. Aislación — sumar déficit de todos los tramos
  tramosData.forEach(t => {
    if (!t.diam || !t.temp) return;
    const espMin = (espesoresMin[t.diam]?.[t.temp]||30) + (t.ubic==='ext'?10:0);
    const espMed = parseFloat(t.esp);
    const longitud = parseFloat(t.long) || 0;
    if (!isNaN(espMed) && longitud > 0 && espMed < espMin) {
      const deficit = espMin - espMed;
      const pct = Math.min(0.22, (deficit/espMin)*0.35);
      const ahorro = Math.round(consumoBase * pct * (longitud/50));
      if (ahorro > 0) items.push({ concepto:`Corrección aislación tramo ${diamLabel(t.diam)} ${tempLabel(t.temp)}`, ahorro, pct:Math.round(pct*100), ref:'Apéndice 03.1', prioridad:'alta' });
    }
  });

  // 2. Caldera — temperatura gases
  const tgas = parseFloat(document.getElementById('c_tgas').value);
  if (tgas > 180) {
    const pct = Math.min(0.08, (tgas - 160) / 2000);
    const ahorro = Math.round(consumoBase * pct);
    items.push({ concepto:'Limpieza conducto de humos caldera', ahorro, pct:Math.round(pct*100), ref:'ITE 08.1.3 Tabla 10', prioridad:'media' });
  }

  // 3. Caldera — rendimiento
  const rend = ( window._rendCalc !== undefined ? window._rendCalc : NaN );
  if (rend && rend < 88) {
    const pct = Math.min(0.10, (90 - rend)/100);
    const ahorro = Math.round(consumoBase * pct);
    items.push({ concepto:'Mejora rendimiento caldera', ahorro, pct:Math.round(pct*100), ref:'ITE 04.9', prioridad:'media' });
  }

  // 4. Retorno ACS
  const retorno = getToggle('tg_retorno');
  if (retorno === 'no') {
    const ahorro = Math.round(consumoBase * 0.07);
    items.push({ concepto:'Instalación red de retorno ACS', ahorro, pct:7, ref:'ITE 02.5.3', prioridad:'media' });
  }

  const totalAhorro = items.reduce((s,i) => s+i.ahorro, 0);
  const totalPesos = Math.round(totalAhorro * tarifa);
  const pctTotal = consumoBase > 0 ? Math.round(totalAhorro/consumoBase*100) : 0;
  const roi = totalPesos > 0 ? (totalAhorro * 0.8 / (totalAhorro * tarifa / 12)).toFixed(1) : '—';
  return { items, totalAhorro, totalPesos, pctTotal, roi };
}

// ─────────────────────────────────────────────
// BUILD SUMMARY — Dashboard estilo análisis
// ─────────────────────────────────────────────
function buildSummary() {
  const ahorro    = calcAhorro();
  const findings  = buildFindings();
  const noCump    = checkItems.filter(c => checks[c.id] === 'no').length;
  const okCump    = checkItems.filter(c => checks[c.id] === 'si').length;
  const rend      = window._rendCalc != null ? window._rendCalc : null;
  const tgas      = parseFloat(document.getElementById('c_tgas').value);
  const o2        = parseFloat(document.getElementById('c_o2').value);
  const co        = parseFloat(document.getElementById('c_co').value);
  const tacum     = parseFloat(document.getElementById('a_tacum').value);
  const tiempo    = parseFloat(document.getElementById('a_tiempo').value);
  const retorno   = getToggle('tg_retorno');
  const contador  = getToggle('tg_contador');
  const tramoPpal = getTramoPrincipal(); // tramo con mayor déficit
  const nombre    = document.getElementById('p_nombre').value || 'Edificio';
  const fecha     = document.getElementById('p_fecha').value || '—';
  const inspector = document.getElementById('p_inspector').value || '—';

  // ── Score global (0–100) ──
  let penalizacion = 0;
  if (rend !== null && rend < 85)  penalizacion += 20;
  else if (rend !== null && rend < 91) penalizacion += 8;
  if (!isNaN(tgas) && tgas > 200)  penalizacion += 15;
  else if (!isNaN(tgas) && tgas > 160) penalizacion += 7;
  if (!isNaN(o2) && (o2 > 10 || o2 < 2)) penalizacion += 10;
  if (!isNaN(co) && co > 100)      penalizacion += 10;
  if (!isNaN(tacum) && tacum < 60) penalizacion += 15;
  if (retorno === 'no')             penalizacion += 8;
  if (contador === 'no')            penalizacion += 5;
  // Penalizar por tramos con déficit
  tramosData.forEach(t => {
    if (!t.diam || !t.temp) return;
    const eMin = (espesoresMin[t.diam]?.[t.temp]||30)+(t.ubic==='ext'?10:0);
    const eMed = parseFloat(t.esp);
    if (!isNaN(eMed) && eMed < eMin) penalizacion += 8;
  });
  penalizacion += noCump * 4;
  const score = Math.max(0, Math.min(100, 100 - penalizacion));
  const scoreColor = score >= 75 ? '#0072BC' : score >= 50 ? '#F7941D' : '#E63329';
  const scoreLabel = score >= 75 ? 'Buena condición' : score >= 50 ? 'Condición regular' : 'Condición deficiente';

  // ── Vida útil estimada caldera ──
  const yearCal = parseInt(document.getElementById('c_year').value);
  const edadCal = yearCal ? (new Date().getFullYear() - yearCal) : null;
  const vidaRestante = edadCal != null ? Math.max(0, 20 - edadCal) : null;

  // ── Gauge SVG ──
  function gauge(valor, max, color, label, unit='') {
    const pct = Math.min(1, Math.max(0, valor/max));
    const angle = pct * 180;
    const r = 42; const cx = 56; const cy = 56;
    const rad = (angle - 180) * Math.PI / 180;
    const endX = cx + r * Math.cos(rad);
    const endY = cy + r * Math.sin(rad);
    const large = angle > 180 ? 1 : 0;
    return `<svg viewBox="0 0 112 66" width="112" height="66" style="overflow:visible">
      <path d="M${cx-r},${cy} A${r},${r} 0 0,1 ${cx+r},${cy}" fill="none" stroke="#E8EDF4" stroke-width="9" stroke-linecap="round"/>
      <path d="M${cx-r},${cy} A${r},${r} 0 ${large},1 ${endX},${endY}" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round"/>
      <text x="${cx}" y="${cy-4}" text-anchor="middle" font-size="16" font-weight="600" font-family="DM Mono,monospace" fill="${color}">${valor}${unit}</text>
      <text x="${cx}" y="${cy+10}" text-anchor="middle" font-size="8" fill="#8A9AB0" font-family="DM Sans,sans-serif">${label}</text>
    </svg>`;
  }

  // ── Barra de rango con zonas de color ──
  function rangeBar(valor, zonas) {
    if (isNaN(valor) || valor == null) return '<div style="font-size:11px;color:#8A9AB0;padding:4px 0">Sin datos</div>';
    const total = zonas[zonas.length-1].max - zonas[0].min;
    const base  = zonas[0].min;
    let barHtml = '<div style="position:relative;height:10px;border-radius:20px;overflow:hidden;display:flex">';
    zonas.forEach(z => { barHtml += `<div style="width:${(z.max-z.min)/total*100}%;background:${z.color};"></div>`; });
    const pos = Math.min(100, Math.max(0, (valor - base) / total * 100));
    barHtml += `</div><div style="position:relative;height:0">
      <div style="position:absolute;left:calc(${pos}% - 6px);top:-14px;width:12px;height:12px;background:#1A2233;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>
    </div>`;
    return barHtml;
  }

  function estadoBadge(estado) {
    const map = {
      'OK':      { bg:'#E6F2FB', color:'#0072BC', icon:'✓' },
      'Óptimo':  { bg:'#E6F2FB', color:'#0072BC', icon:'✓' },
      'Aceptable':{ bg:'#FEF3E7', color:'#C47200', icon:'~' },
      'Elevado': { bg:'#FEF3E7', color:'#C47200', icon:'▲' },
      'Bajo':    { bg:'#FEF3E7', color:'#C47200', icon:'▼' },
      'Alto':    { bg:'#FDEAEA', color:'#B52020', icon:'▲' },
      'Crítico': { bg:'#FDEAEA', color:'#B52020', icon:'!' },
      'Excesivo':{ bg:'#FDEAEA', color:'#B52020', icon:'▲' },
      'N/D':     { bg:'#F2F5F9', color:'#8A9AB0', icon:'—' },
    };
    const s = map[estado] || map['N/D'];
    return `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px;background:${s.bg};color:${s.color}">${s.icon} ${estado}</span>`;
  }

  function estadoRend(v) { return v==null?'N/D':v>=91?'Óptimo':v>=85?'Aceptable':'Bajo'; }
  function estadoTgas(v) { return isNaN(v)?'N/D':v>200?'Crítico':v>160?'Elevado':'OK'; }
  function estadoO2(v)   { return isNaN(v)?'N/D':v>10?'Excesivo':v<2?'Bajo':'OK'; }
  function estadoCO(v)   { return isNaN(v)?'N/D':v>500?'Crítico':v>100?'Alto':'OK'; }
  function estadoTacum(v){ return isNaN(v)?'N/D':v<55?'Crítico':v<60?'Bajo':'OK'; }
  function estadoEsp(med, min) { return isNaN(med)||isNaN(min)?'N/D':med>=min?'OK':med>=min*0.7?'Bajo':'Crítico'; }

  const espMed = tramoPpal ? parseFloat(tramoPpal.esp) : NaN;
  const espMin = tramoPpal ? tramoPpal.espMin : NaN;

  // ── Tabla de resultados analíticos ──
  function resultRow(sistema, parametro, valor, unidad, rangeBarHtml, estado, referencia, detalle='') {
    return `<tr style="border-bottom:1px solid #E8EDF4">
      <td style="padding:10px 10px 10px 0;font-size:12px;color:#8A9AB0;white-space:nowrap;vertical-align:top">${sistema}</td>
      <td style="padding:10px 8px;font-size:13px;font-weight:500;color:#1A2233;vertical-align:top">${parametro}</td>
      <td style="padding:10px 8px;vertical-align:top">
        <div style="font-size:15px;font-weight:600;font-family:'DM Mono',monospace;color:#1A2233">${valor}<span style="font-size:11px;font-weight:400;color:#8A9AB0;margin-left:3px">${unidad}</span></div>
        ${detalle ? `<div style="font-size:11px;color:#8A9AB0;margin-top:2px">${detalle}</div>` : ''}
      </td>
      <td style="padding:10px 8px;min-width:120px;vertical-align:middle">${rangeBarHtml}</td>
      <td style="padding:10px 0 10px 8px;vertical-align:top;text-align:right">${estadoBadge(estado)}</td>
      <td style="padding:10px 0 10px 8px;font-size:11px;color:#8A9AB0;font-family:'DM Mono',monospace;vertical-align:top;white-space:nowrap">${referencia}</td>
    </tr>`;
  }

  const zTgas  = [{min:100,max:160,color:'#4CAF50'},{min:160,max:200,color:'#F7941D'},{min:200,max:300,color:'#E63329'}];
  const zO2    = [{min:0,max:2,color:'#F7941D'},{min:2,max:6,color:'#4CAF50'},{min:6,max:12,color:'#F7941D'},{min:12,max:21,color:'#E63329'}];
  const zRend  = [{min:70,max:85,color:'#E63329'},{min:85,max:91,color:'#F7941D'},{min:91,max:100,color:'#0072BC'}];
  const zCO    = [{min:0,max:100,color:'#4CAF50'},{min:100,max:500,color:'#F7941D'},{min:500,max:2000,color:'#E63329'}];
  const zTacum = [{min:40,max:55,color:'#E63329'},{min:55,max:60,color:'#F7941D'},{min:60,max:80,color:'#0072BC'}];
  const zEsp   = !isNaN(espMin) ? [{min:0,max:espMin*0.7,color:'#E63329'},{min:espMin*0.7,max:espMin,color:'#F7941D'},{min:espMin,max:espMin*2,color:'#4CAF50'}] : [];

  const rows = [
    resultRow('Caldera','Rendimiento combustión',
      rend != null ? rend.toFixed(1) : '—', '%',
      rend != null ? rangeBar(rend, zRend) : '<div style="font-size:11px;color:#8A9AB0">Sin datos O₂ / Tg</div>',
      estadoRend(rend), 'ITE 04.9', rend != null ? `Método Siegert` : ''),

    resultRow('Caldera','Temp. gases combustión',
      !isNaN(tgas) ? tgas : '—', '°C',
      rangeBar(tgas, zTgas), estadoTgas(tgas), 'ITE 08.1.3', 'Rango óptimo: 120–160 °C'),

    resultRow('Caldera','Oxígeno en gases',
      !isNaN(o2) ? o2.toFixed(1) : '—', '%',
      rangeBar(o2, zO2), estadoO2(o2), 'ITE 04.9', 'Óptimo gas natural: 3–5%'),

    resultRow('Caldera','CO en chimenea',
      !isNaN(co) ? co : '—', 'ppm',
      rangeBar(co, zCO), estadoCO(co), 'ITE 04.9', 'Límite aceptable: <100 ppm'),

    resultRow('ACS','Temp. acumulación',
      !isNaN(tacum) ? tacum : '—', '°C',
      rangeBar(tacum, zTacum), estadoTacum(tacum), 'ITE 02.5.1', 'Mín. 60°C anti-legionela'),

    resultRow('ACS','Red de retorno',
      retorno === 'si' ? 'Presente' : retorno === 'no' ? 'Ausente' : '—', '',
      retorno === 'si' ? '<div style="height:10px;border-radius:20px;background:#0072BC"></div>' :
      retorno === 'no' ? '<div style="height:10px;border-radius:20px;background:#E63329"></div>' :
      '<div style="height:10px;border-radius:20px;background:#E8EDF4"></div>',
      retorno === 'si' ? 'OK' : retorno === 'no' ? 'Crítico' : 'N/D', 'ITE 02.5.3', ''),

    resultRow('ACS','Tiempo llegada agua caliente',
      !isNaN(tiempo) ? tiempo : '—', 'seg',
      rangeBar(tiempo, [{min:0,max:30,color:'#4CAF50'},{min:30,max:60,color:'#F7941D'},{min:60,max:120,color:'#E63329'}]),
      !isNaN(tiempo) ? (tiempo<=30?'OK':tiempo<=60?'Elevado':'Crítico') : 'N/D', 'ITE 02.5.3', 'Máx. recomendado: 30 s'),
  ];

  // Filas de aislación — una por tramo registrado
  tramosData.forEach((t, idx) => {
    if (!t.diam || !t.temp) return;
    const eMin = (espesoresMin[t.diam]?.[t.temp]||30)+(t.ubic==='ext'?10:0);
    const eMed = parseFloat(t.esp);
    const zE = [{min:0,max:eMin*0.7,color:'#E63329'},{min:eMin*0.7,max:eMin,color:'#F7941D'},{min:eMin,max:eMin*2,color:'#4CAF50'}];
    rows.push(resultRow(
      idx===0?'Aislación':`Tramo ${idx+1}`,
      `${diamLabel(t.diam)} · ${tempLabel(t.temp)}`,
      !isNaN(eMed) ? eMed : '—', 'mm',
      !isNaN(eMed) ? rangeBar(eMed, zE) : '<div style="font-size:11px;color:#8A9AB0">Sin espesor medido</div>',
      !isNaN(eMed) ? estadoEsp(eMed, eMin) : 'N/D',
      'Apéndice 03.1',
      `Mín. ${eMin} mm · ${t.ubic==='ext'?'Exterior':'Interior'} · ${t.mat||'—'}`
    ));
  });
  if (tramosData.length === 0) {
    rows.push(resultRow('Aislación','Sin tramos registrados','—','','<div style="font-size:11px;color:#8A9AB0">Agregar tramos en paso 3</div>','N/D','Apéndice 03.1',''));
  }

  const urgentes = findings.filter(f=>f.urgente).length;
  const medias   = findings.filter(f=>!f.urgente).length;

  // ── Acciones recomendadas ──
  const acciones = buildPlanAccion(findings);
  let accionesHtml = '';
  acciones.slice(0,5).forEach((ac,i) => {
    const prioColor = i===0?'#E63329':i<=1?'#F7941D':'#0072BC';
    accionesHtml += `
    <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #E8EDF4">
      <div style="min-width:22px;height:22px;border-radius:50%;background:${prioColor};color:#fff;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">${i+1}</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:500;color:#1A2233">${ac.titulo}</div>
        <div style="font-size:11px;color:#8A9AB0;margin-top:2px;font-family:'DM Mono',monospace">${ac.meta} · Plazo: ${ac.plazo}</div>
      </div>
    </div>`;
  });

  const html = `
  <style>
    .dash-section{background:#fff;border:1px solid #D0D9E6;border-radius:10px;padding:18px 20px;margin-bottom:14px;box-shadow:0 1px 3px rgba(0,114,188,.06)}
    .dash-section-title{font-size:12px;font-weight:600;color:#8A9AB0;text-transform:uppercase;letter-spacing:.07em;margin-bottom:14px;display:flex;align-items:center;gap:8px}
    .dash-section-title span{display:inline-block;width:3px;height:14px;border-radius:2px;background:#0072BC}
    .kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin-bottom:14px}
    .kpi{background:#F2F5F9;border-radius:8px;padding:12px 14px;text-align:center}
    .kpi-val{font-size:22px;font-weight:600;font-family:'DM Mono',monospace}
    .kpi-lbl{font-size:11px;color:#8A9AB0;margin-top:3px;line-height:1.3}
    .results-table{width:100%;border-collapse:collapse}
    .results-table th{font-size:11px;color:#8A9AB0;font-weight:500;text-align:left;padding:6px 8px 10px;border-bottom:2px solid #0072BC;text-transform:uppercase;letter-spacing:.05em}
    .results-table th:first-child{padding-left:0}
    .results-table th:last-child{padding-right:0;text-align:right}
    .results-table tr:last-child td{border-bottom:none}
    @media(max-width:600px){.results-table th:nth-child(6),.results-table td:nth-child(6){display:none}}
  </style>

  <!-- Header del informe -->
  <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:18px;padding-bottom:16px;border-bottom:2px solid #0072BC">
    <div>
      <div style="font-size:11px;color:#8A9AB0;text-transform:uppercase;letter-spacing:.07em">Análisis de resultados</div>
      <div style="font-size:18px;font-weight:600;color:#1A2233;margin-top:2px">${nombre}</div>
      <div style="font-size:12px;color:#8A9AB0;margin-top:2px">Inspector: ${inspector} · Fecha: ${fecha}</div>
    </div>
    <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
      ${rend != null ? gauge(rend.toFixed(1), 100, rend>=91?'#0072BC':rend>=85?'#F7941D':'#E63329', 'Rendimiento', '%') : ''}
      <div style="text-align:center">
        <div style="font-size:32px;font-weight:700;font-family:'DM Mono',monospace;color:${scoreColor}">${score}</div>
        <div style="font-size:10px;color:#8A9AB0;text-transform:uppercase;letter-spacing:.06em">Score global</div>
        <div style="font-size:11px;font-weight:600;color:${scoreColor};margin-top:2px">${scoreLabel}</div>
      </div>
      ${vidaRestante != null ? gauge(vidaRestante, 20, vidaRestante>10?'#0072BC':vidaRestante>5?'#F7941D':'#E63329', 'Vida rest. caldera', ' años') : ''}
    </div>
  </div>

  <!-- KPIs -->
  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-val" style="color:#E63329">${urgentes}</div><div class="kpi-lbl">Deficiencias urgentes</div></div>
    <div class="kpi"><div class="kpi-val" style="color:#F7941D">${medias}</div><div class="kpi-lbl">Deficiencias medias</div></div>
    <div class="kpi"><div class="kpi-val" style="color:#0072BC">${okCump}</div><div class="kpi-lbl">Ítems conformes RITCH</div></div>
    <div class="kpi"><div class="kpi-val" style="color:${ahorro.pctTotal>0?'#0072BC':'#8A9AB0'}">${ahorro.pctTotal}%</div><div class="kpi-lbl">Ahorro potencial gas</div></div>
    <div class="kpi"><div class="kpi-val" style="color:#0072BC">${ahorro.totalAhorro.toLocaleString()}</div><div class="kpi-lbl">m³/año ahorro est.</div></div>
    <div class="kpi"><div class="kpi-val" style="color:#0072BC">$${Math.round(ahorro.totalPesos/1000)}K</div><div class="kpi-lbl">Ahorro anual CLP</div></div>
  </div>

  <!-- Tabla de resultados analíticos -->
  <div class="dash-section">
    <div class="dash-section-title"><span></span>Resultados analíticos por parámetro</div>
    <div style="overflow-x:auto">
      <table class="results-table">
        <thead>
          <tr>
            <th>Sistema</th>
            <th>Parámetro</th>
            <th>Valor medido</th>
            <th style="min-width:120px">Rango de referencia</th>
            <th>Estado</th>
            <th>Ref. RITCH</th>
          </tr>
        </thead>
        <tbody>${rows.join('')}</tbody>
      </table>
    </div>
  </div>

  <!-- Acciones recomendadas -->
  <div class="dash-section">
    <div class="dash-section-title"><span></span>Acciones recomendadas — ordenadas por prioridad</div>
    ${accionesHtml || '<div style="font-size:13px;color:#8A9AB0">Sin acciones detectadas con los datos ingresados.</div>'}
  </div>

  <!-- Cumplimiento RITCH -->
  <div class="dash-section">
    <div class="dash-section-title"><span></span>Cumplimiento normativo RITCH</div>
    <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
      <div style="flex:1;background:#E8EDF4;border-radius:20px;height:12px;overflow:hidden;min-width:120px">
        <div style="width:${checkItems.filter(c=>checks[c.id]!==null).length>0?Math.round(okCump/checkItems.filter(c=>checks[c.id]!==null).length*100):0}%;height:100%;background:#0072BC;border-radius:20px;transition:width .6s"></div>
      </div>
      <div style="display:flex;gap:16px;font-size:13px;flex-shrink:0">
        <span style="color:#0072BC;font-weight:600">✓ ${okCump} conformes</span>
        <span style="color:#E63329;font-weight:600">✗ ${noCump} no conformes</span>
        <span style="color:#8A9AB0">${checkItems.filter(c=>checks[c.id]!==null).length}/${checkItems.length} evaluados</span>
      </div>
    </div>
  </div>`;

  document.getElementById('summary_content').innerHTML = html;
}

function buildFindings() {
  const findings = [];
  const tgas = parseFloat(document.getElementById('c_tgas').value);
  const rend = ( window._rendCalc !== undefined ? window._rendCalc : NaN );
  const tacum = parseFloat(document.getElementById('a_tacum').value);
  const retorno = getToggle('tg_retorno');
  const contador = getToggle('tg_contador');
  const pot = parseFloat(document.getElementById('c_pot').value);
  const reg = document.getElementById('c_reg').value;

  if (tgas > 180) findings.push({ titulo:`Temperatura gases combustión elevada (${tgas}°C)`, ref:'ITE 08.1.3 · Tabla 10', urgente:false });
  if (rend && rend < 85) findings.push({ titulo:`Rendimiento caldera bajo (${rend.toFixed(1)}%)`, ref:'ITE 04.9', urgente:false });
  if (tacum && tacum < 60) findings.push({ titulo:`Temperatura ACS insuficiente (${tacum}°C) — riesgo legionela`, ref:'ITE 02.5.1', urgente:true });
  if (retorno === 'no') findings.push({ titulo:'Sin red de retorno ACS', ref:'ITE 02.5.3', urgente:false });
  if (contador === 'no') findings.push({ titulo:'Sin contador individual de ACS por vivienda', ref:'ITE 02.13', urgente:false });
  if (pot >= 100 && reg === '1etapa') findings.push({ titulo:'Quemador de una etapa para potencia ≥100 kW', ref:'ITE 02.6.2', urgente:false });

  // Tramos con déficit de aislación
  tramosData.forEach((t, idx) => {
    if (!t.diam || !t.temp) return;
    const espMin = (espesoresMin[t.diam]?.[t.temp]||30) + (t.ubic==='ext'?10:0);
    const espMed = parseFloat(t.esp);
    if (!isNaN(espMed) && espMed < espMin) {
      findings.push({ titulo:`Aislación insuficiente — Tramo ${idx+1} (${diamLabel(t.diam)}, ${espMed} mm medidos, mínimo ${espMin} mm)`, ref:'Apéndice 03.1 RITCH', urgente:false });
    }
    if (t.estado === 'ausente') {
      findings.push({ titulo:`Sin aislación — Tramo ${idx+1} (${diamLabel(t.diam)} · ${tempLabel(t.temp)})`, ref:'ITE 03.12', urgente:true });
    }
  });

  checkItems.forEach(item => {
    if (checks[item.id] === 'no') {
      findings.push({ titulo:item.label, ref:item.ref, urgente:item.prioridad==='alta' });
    }
  });

  return findings;
}
