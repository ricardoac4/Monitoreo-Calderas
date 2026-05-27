// ── Módulo ACS — Agua Caliente Sanitaria ──

function evalACS() {
  const tacum = parseFloat(document.getElementById('a_tacum').value);
  const tiempo = parseFloat(document.getElementById('a_tiempo').value);
  const retorno = getToggle('tg_retorno');
  const contador = getToggle('tg_contador');

  // Temperatura
  let alertTemp = '';
  if (tacum) {
    if (tacum < 60) alertTemp = '<div class="alert alert-warn"><b>Riesgo legionela:</b> Temperatura de acumulación (' + tacum + ' °C) inferior a 60 °C recomendado para prevención de Legionella pneumophila (UNE 100030 ref. ITE 02.5.1). Subir temperatura o programar choque térmico periódico.</div>';
    else alertTemp = '<div class="alert alert-ok">Temperatura de acumulación adecuada para prevención de legionela (≥ 60 °C).</div>';
  }
  document.getElementById('alert_acs_temp').innerHTML = alertTemp;

  // Retorno
  let alertRet = '';
  if (retorno === 'no') alertRet = '<div class="alert alert-warn"><b>Ausencia de red de retorno:</b> Incumplimiento ITE 02.5.3. La pérdida de agua caliente en espera genera consumo adicional de gas estimado en 6–10% del consumo ACS anual.</div>';
  if (tiempo > 30) alertRet += '<div class="alert alert-warn"><b>Tiempo de llegada excesivo (' + tiempo + ' s):</b> Superior a 30 s recomendado. Confirmar estado del circuito de retorno y bomba de recirculación (ITE 02.5.3).</div>';
  document.getElementById('alert_retorno').innerHTML = alertRet;

  // Contador
  let alertCont = '';
  if (contador === 'no') alertCont = '<div class="alert alert-error"><b>Incumplimiento ITE 02.13:</b> Las instalaciones centralizadas de ACS deben disponer de contador individual por vivienda para contabilización de consumos. Corrección obligatoria.</div>';
  else if (contador === 'si') alertCont = '<div class="alert alert-ok">Contadores individuales presentes. Conforme con ITE 02.13.</div>';
  document.getElementById('alert_contador').innerHTML = alertCont;
}
