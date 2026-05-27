// ── Módulo Checklist de Cumplimiento RITCH ──

// ─────────────────────────────────────────────
// CHECKLIST
// ─────────────────────────────────────────────
function buildChecklist() {
  const list = document.getElementById('checklist');
  list.innerHTML = '';
  checkItems.forEach(item => {
    const row = document.createElement('div');
    row.className = 'check-row';
    row.innerHTML = `
      <div class="check-info">
        <div class="check-label">${item.label}</div>
        <div class="check-ref">${item.ref}</div>
      </div>
      <div class="toggle-group" id="tg_${item.id}">
        <button class="tog" onclick="setCheckToggle('${item.id}','si')">Sí</button>
        <button class="tog" onclick="setCheckToggle('${item.id}','no')">No</button>
        <button class="tog" onclick="setCheckToggle('${item.id}','na')">N/A</button>
      </div>`;
    list.appendChild(row);
  });
}

function setCheckToggle(id, val) {
  checks[id] = val;
  const group = document.getElementById('tg_' + id);
  group.querySelectorAll('.tog').forEach((b, i) => {
    b.classList.remove('yes','no','na');
    const vals = ['si','no','na'];
    if (vals[i] === val) b.classList.add(val==='si'?'yes':val==='no'?'no':'na');
  });
  updateCumplimientoAlert();
}

function updateCumplimientoAlert() {
  const noCump = checkItems.filter(c => checks[c.id] === 'no').length;
  const respondidos = Object.values(checks).filter(v => v !== null).length;
  let html = '';
  if (noCump > 0) html = `<div class="alert alert-warn"><b>${noCump} incumplimiento${noCump>1?'s':''} detectado${noCump>1?'s':''}.</b> Se incluirán en el informe con referencia RITCH y acción correctiva requerida.</div>`;
  else if (respondidos === checkItems.length) html = '<div class="alert alert-ok">Todos los ítems evaluados cumplen la normativa RITCH.</div>';
  document.getElementById('alert_cumplimiento').innerHTML = html;
}
