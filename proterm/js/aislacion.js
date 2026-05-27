// ── Módulo Aislación de Cañerías (multi-tramo) ──

// ─────────────────────────────────────────────
// SISTEMA MULTI-TRAMO DE AISLACIÓN
// ─────────────────────────────────────────────
let tramosData = []; // Array de objetos tramo
let tramoIdCounter = 0;

function agregarTramo() {
  const id = ++tramoIdCounter;
  tramosData.push({ id, diam:'', temp:'', ubic:'int', long:'', esp:'', mat:'Espuma elastomérica', estado:'bueno' });
  renderTramos();
  // Scroll al nuevo tramo
  setTimeout(() => {
    const el = document.getElementById('tramo_card_' + id);
    if (el) el.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }, 50);
}

function eliminarTramo(id) {
  tramosData = tramosData.filter(t => t.id !== id);
  renderTramos();
}

function actualizarTramo(id, campo, valor) {
  const t = tramosData.find(t => t.id === id);
  if (t) { t[campo] = valor; renderTramoAlert(id); }
}

function renderTramoAlert(id) {
  const t = tramosData.find(t => t.id === id);
  if (!t) return;
  const alertEl = document.getElementById('tramo_alert_' + id);
  if (!alertEl) return;
  if (t.diam && t.temp) {
    let espMin = espesoresMin[t.diam]?.[t.temp] || 30;
    if (t.ubic === 'ext') espMin += 10;
    const espMed = parseFloat(t.esp);
    let html = `<div class="alert alert-ok" style="margin-top:8px"><b>Espesor mínimo RITCH:</b> ${espMin} mm${t.ubic==='ext'?' (+10 mm exterior)':''}</div>`;
    if (!isNaN(espMed)) {
      const deficit = espMin - espMed;
      if (deficit > 0) {
        html += `<div class="alert alert-warn" style="margin-top:6px"><b>Déficit: ${deficit} mm</b> — medido ${espMed} mm vs mínimo ${espMin} mm (Apéndice 03.1)</div>`;
      } else {
        html += `<div class="alert alert-ok" style="margin-top:6px">Espesor conforme: ${espMed} mm ≥ ${espMin} mm exigido</div>`;
      }
    }
    alertEl.innerHTML = html;
  } else {
    alertEl.innerHTML = '';
  }
}

function renderTramos() {
  const container = document.getElementById('tramos_container');
  if (!container) return;
  if (tramosData.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text3);font-size:13px;border:1px dashed var(--border);border-radius:var(--radius);margin-bottom:14px">
      No hay tramos registrados. Agrega el primer tramo con el botón de abajo.
    </div>`;
    return;
  }
  container.innerHTML = tramosData.map((t, idx) => `
    <div class="card" id="tramo_card_${t.id}" style="margin-bottom:12px;border-left:3px solid #0072BC">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div class="card-title" style="margin-bottom:0">
          <span style="background:#0072BC;color:#fff;font-size:11px;padding:2px 8px;border-radius:20px;margin-right:8px">Tramo ${idx+1}</span>
          ${t.diam && t.temp ? `<span style="font-size:12px;color:var(--text2);font-weight:400">${diamLabel(t.diam)} · ${tempLabel(t.temp)} · ${t.ubic==='ext'?'Exterior':'Interior'}</span>` : '<span style="font-size:12px;color:var(--text3);font-weight:400">Sin configurar</span>'}
        </div>
        ${tramosData.length > 1 ? `<button onclick="eliminarTramo(${t.id})" style="font-size:12px;color:var(--error);background:none;border:none;cursor:pointer;padding:4px 8px;border-radius:4px" title="Eliminar tramo">✕ Eliminar</button>` : ''}
      </div>
      <div class="field-grid" style="margin-bottom:10px">
        <div class="field">
          <label>Diámetro exterior</label>
          <select onchange="actualizarTramo(${t.id},'diam',this.value)">
            <option value="" ${!t.diam?'selected':''}>— Seleccionar —</option>
            <option value="d1" ${t.diam==='d1'?'selected':''}>D &lt; 1¼"</option>
            <option value="d2" ${t.diam==='d2'?'selected':''}>1¼" ≤ D &lt; 2"</option>
            <option value="d3" ${t.diam==='d3'?'selected':''}>2" ≤ D &lt; 3"</option>
            <option value="d4" ${t.diam==='d4'?'selected':''}>3" ≤ D &lt; 5"</option>
            <option value="d5" ${t.diam==='d5'?'selected':''}>D ≥ 5"</option>
          </select>
        </div>
        <div class="field">
          <label>Temperatura fluido</label>
          <select onchange="actualizarTramo(${t.id},'temp',this.value)">
            <option value="" ${!t.temp?'selected':''}>— Seleccionar —</option>
            <option value="t1" ${t.temp==='t1'?'selected':''}>40–65 °C</option>
            <option value="t2" ${t.temp==='t2'?'selected':''}>66–100 °C</option>
            <option value="t3" ${t.temp==='t3'?'selected':''}>101–150 °C</option>
          </select>
        </div>
        <div class="field">
          <label>Ubicación</label>
          <select onchange="actualizarTramo(${t.id},'ubic',this.value)">
            <option value="int" ${t.ubic==='int'?'selected':''}>Interior edificio</option>
            <option value="ext" ${t.ubic==='ext'?'selected':''}>Exterior / intemperie</option>
          </select>
        </div>
        <div class="field">
          <label>Longitud (m)</label>
          <input type="number" placeholder="Ej: 45" min="0" value="${t.long}" oninput="actualizarTramo(${t.id},'long',this.value)">
        </div>
        <div class="field">
          <label>Espesor medido (mm)</label>
          <input type="number" placeholder="Ej: 20" value="${t.esp}" oninput="actualizarTramo(${t.id},'esp',this.value)">
        </div>
        <div class="field">
          <label>Material aislante</label>
          <select onchange="actualizarTramo(${t.id},'mat',this.value)">
            <option ${t.mat==='Lana mineral'?'selected':''}>Lana mineral</option>
            <option ${t.mat==='Espuma elastomérica'?'selected':''}>Espuma elastomérica</option>
            <option ${t.mat==='Poliestireno expandido'?'selected':''}>Poliestireno expandido</option>
            <option ${t.mat==='Coquilla de PUR'?'selected':''}>Coquilla de PUR</option>
            <option ${t.mat==='Otro / desconocido'?'selected':''}>Otro / desconocido</option>
          </select>
        </div>
        <div class="field">
          <label>Estado del aislante</label>
          <select onchange="actualizarTramo(${t.id},'estado',this.value)">
            <option value="bueno" ${t.estado==='bueno'?'selected':''}>Bueno</option>
            <option value="deteriorado" ${t.estado==='deteriorado'?'selected':''}>Deteriorado</option>
            <option value="ausente" ${t.estado==='ausente'?'selected':''}>Ausente</option>
          </select>
        </div>
      </div>
      <div id="tramo_alert_${t.id}"></div>
    </div>`).join('');
  // Re-evaluar alertas
  tramosData.forEach(t => renderTramoAlert(t.id));
}

function diamLabel(v) { return {d1:'D<1¼"',d2:'1¼"–2"',d3:'2"–3"',d4:'3"–5"',d5:'D≥5"'}[v]||v; }
function tempLabel(v) { return {t1:'40–65°C',t2:'66–100°C',t3:'101–150°C'}[v]||v; }

// Helpers para el resto del código (compatibilidad)
function getTramoPrincipal() {
  // Retorna el tramo con mayor déficit, o el primero
  if (tramosData.length === 0) return null;
  return tramosData.reduce((worst, t) => {
    if (!t.diam || !t.temp) return worst;
    const espMin = (espesoresMin[t.diam]?.[t.temp]||30) + (t.ubic==='ext'?10:0);
    const espMed = parseFloat(t.esp);
    const deficit = isNaN(espMed) ? 0 : espMin - espMed;
    if (!worst) return { ...t, espMin, espMed, deficit };
    const espMinW = (espesoresMin[worst.diam]?.[worst.temp]||30)+(worst.ubic==='ext'?10:0);
    return deficit > worst.deficit ? { ...t, espMin, espMed, deficit } : worst;
  }, null);
}

function evalAislacion() { /* legacy — ya no se usa, reemplazado por renderTramos */ }
