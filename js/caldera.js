// ── Módulo Caldera y Combustión (Fórmula de Siegert) ──

function evalCaldera() {
  const pot  = parseFloat(document.getElementById('c_pot').value);
  const reg  = document.getElementById('c_reg').value;
  const tgas = parseFloat(document.getElementById('c_tgas').value);
  const ta   = parseFloat(document.getElementById('c_ta').value) || 20;
  const o2   = parseFloat(document.getElementById('c_o2').value);
  const co   = parseFloat(document.getElementById('c_co').value);

  // ── Regulación quemador ──
  let alertReg = '';
  if (pot && reg) {
    if (pot >= 100 && pot < 800 && reg === '1etapa') {
      alertReg = '<div class="alert alert-warn"><b>Incumplimiento ITE 02.6.2 Tabla 4:</b> Para potencias entre 100–800 kW se exige mínimo regulación de dos etapas. Quemador de una etapa detectado → deficiencia normativa.</div>';
    } else if (pot >= 100 && (reg === '2etapas' || reg === 'prop')) {
      alertReg = '<div class="alert alert-ok">Regulación conforme al mínimo exigido por ITE 02.6.2 para esta potencia.</div>';
    }
  }
  document.getElementById('alert_reg').innerHTML = alertReg;

  // ── Cálculo de rendimiento por fórmula de Siegert (gas natural) ──
  // Constantes gas natural: A2 = 0.66, B = 0.009
  // qA = (Tg - Ta) × [A2 / (21 - %O2) + B]
  // η  = 100 - qA
  // Exceso de aire EA = %O2 × 100 / (21 - %O2)
  // CO2 aprox. = 11.7 × (21 - %O2) / 21  (gas natural, CO2max ≈ 11.7%)
  let rend = null;
  if (!isNaN(tgas) && !isNaN(o2) && o2 >= 0 && o2 < 21) {
    const A2 = 0.66;
    const B  = 0.009;
    const qA = (tgas - ta) * (A2 / (21 - o2) + B);
    rend = Math.max(0, 100 - qA);
    const ea   = (o2 * 100 / (21 - o2));
    const co2  = (11.7 * (21 - o2) / 21);

    // Mostrar resultado
    document.getElementById('rend_result').style.display = 'block';
    document.getElementById('rend_val').textContent = rend.toFixed(1);
    document.getElementById('qa_val').textContent   = qA.toFixed(1);
    document.getElementById('ea_val').textContent   = ea.toFixed(1);
    document.getElementById('co2_val').textContent  = co2.toFixed(1);

    // Color del valor según rendimiento
    const rendEl = document.getElementById('rend_val');
    rendEl.style.color = rend >= 91 ? '#0072BC' : rend >= 85 ? '#F7941D' : '#E63329';

    // Barra indicadora (mapear 70%→0px, 100%→100%)
    const pct = Math.min(100, Math.max(0, (rend - 70) / 30 * 100));
    document.getElementById('rend_bar').style.left = pct + '%';
  } else {
    document.getElementById('rend_result').style.display = 'none';
  }

  // ── Alertas de diagnóstico ──
  let msgs = [];
  let tipo = 'warn';

  if (!isNaN(tgas) && tgas > 200) {
    msgs.push('<b>Temperatura de gases muy elevada (' + tgas + ' °C):</b> Indica acumulación severa de hollín o incrustaciones en conducto de humos. Cada 10 °C sobre el valor de referencia representa aprox. 0.5% de pérdida adicional. Limpiar chimenea. Ref: ITE 08.1.3 Tabla 10.');
  } else if (!isNaN(tgas) && tgas > 160) {
    msgs.push('<b>Temperatura de gases elevada (' + tgas + ' °C):</b> Superior al rango óptimo (120–160 °C). Se recomienda revisar limpieza de conducto de humos (ITE 08.1.3).');
  }

  if (!isNaN(o2)) {
    if (o2 > 10) {
      msgs.push('<b>Exceso de aire muy alto (%O₂ = ' + o2 + '%):</b> La caldera trabaja con demasiado aire frío, lo que enfría los gases y reduce la eficiencia de transferencia de calor. Ajustar relación aire/combustible en el quemador (ITE 04.9).');
    } else if (o2 < 2) {
      msgs.push('<b>%O₂ bajo (' + o2 + '%):</b> Posible deficiencia de aire → riesgo de combustión incompleta y producción de CO. Verificar aporte de aire primario al quemador.');
    } else if (o2 >= 2 && o2 <= 5) {
      msgs.push('<b>%O₂ en rango óptimo (' + o2 + '%):</b> Relación aire/combustible adecuada para gas natural (óptimo 3–5%).');
      tipo = 'ok';
    }
  }

  if (rend !== null) {
    if (rend < 85) {
      msgs.push('<b>Rendimiento calculado bajo (' + rend.toFixed(1) + '%):</b> Por debajo del mínimo recomendable para calderas a gas (85%). Se estima un exceso de consumo de aprox. ' + (90 - rend).toFixed(1) + '% respecto a una caldera bien mantenida.');
      tipo = 'warn';
    } else if (rend >= 91) {
      msgs.push('<b>Rendimiento calculado adecuado (' + rend.toFixed(1) + '%):</b> La caldera opera dentro de rango eficiente.');
      tipo = 'ok';
    } else {
      msgs.push('<b>Rendimiento calculado aceptable (' + rend.toFixed(1) + '%):</b> Margen de mejora posible con ajuste de combustión y mantenimiento.');
    }
  }

  if (!isNaN(co) && co > 100) {
    msgs.push('<b>CO en gases elevado (' + co + ' ppm):</b> Combustión incompleta. Revisar quemador y ajuste de aire primario (ITE 04.9). Valores > 500 ppm requieren paro inmediato.');
    tipo = 'warn';
  }

  let alertCal = '';
  if (msgs.length) {
    alertCal = '<div class="alert alert-' + tipo + '">' + msgs.join('<br><br>') + '</div>';
  }
  document.getElementById('alert_caldera').innerHTML = alertCal;

  // Guardar rendimiento calculado para uso en resumen/PDF
  window._rendCalc = rend;
}
