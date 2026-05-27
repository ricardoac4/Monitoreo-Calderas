// ── Estado global, navegación y utilidades ──


// ─────────────────────────────────────────────
// ESTADO GLOBAL
// ─────────────────────────────────────────────
let currentStep = 0;
const totalSteps = 5;

// Checklist items
const checkItems = [
  { id:'ch1', label:'Señalización de emergencia visible en sala', ref:'ITE 02.15.6', prioridad:'alta' },
  { id:'ch2', label:'Cuadro con teléfonos de emergencia', ref:'ITE 02.15.6 p.3', prioridad:'alta' },
  { id:'ch3', label:'Extintor operativo en sala de máquinas', ref:'ITE 02.15.7', prioridad:'alta' },
  { id:'ch4', label:'Puerta sala abre desde el interior', ref:'ITE 02.15.7', prioridad:'alta' },
  { id:'ch5', label:'Manómetros en colectores de impulsión y retorno', ref:'ITE 02.12', prioridad:'media' },
  { id:'ch6', label:'Registro de operaciones de mantención al día', ref:'ITE 08.1.4', prioridad:'media' },
  { id:'ch7', label:'Sala de máquinas no usada como bodega', ref:'ITE 02.7', prioridad:'alta' },
  { id:'ch8', label:'Termómetros en colectores', ref:'ITE 02.12', prioridad:'media' },
  { id:'ch9', label:'Válvula de seguridad visible y operativa', ref:'ITE 02.11.2', prioridad:'alta' },
  { id:'ch10', label:'Vaso de expansión instalado y revisado', ref:'ITE 02.11.3', prioridad:'alta' },
];

// Estado checks
let checks = {};
checkItems.forEach(c => checks[c.id] = null);

// Tabla espesores mínimos RITCH Apéndice 03.1 (mm) [diametro][temperatura]
const espesoresMin = {
  d1: { t1:20, t2:20, t3:30 },
  d2: { t1:20, t2:30, t3:40 },
  d3: { t1:30, t2:30, t3:40 },
  d4: { t1:30, t2:40, t3:50 },
  d5: { t1:30, t2:40, t3:50 },
};

// ─────────────────────────────────────────────
// NAVEGACIÓN
// ─────────────────────────────────────────────
function goTo(n) {
  // Navegar por ID para evitar problemas con índices del DOM
  for (let i = 0; i <= totalSteps; i++) {
    const el = document.getElementById('step' + i);
    if (el) el.classList.toggle('active', i === n);
  }
  document.querySelectorAll('.nav-item').forEach((el, i) => {
    el.classList.remove('active');
    if (i === n) el.classList.add('active');
  });
  currentStep = n;
  document.getElementById('progressFill').style.width = (n / totalSteps * 100) + '%';
  if (n === 5) buildSummary();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─────────────────────────────────────────────
// TOGGLES
// ─────────────────────────────────────────────
function setToggle(groupId, val, cb) {
  const group = document.getElementById(groupId);
  const btns = group.querySelectorAll('.tog');
  btns.forEach((b,i) => {
    b.classList.remove('yes','no','na');
    const vals = ['si','no','na'];
    if (vals[i]===val) b.classList.add(val==='si'?'yes':val==='no'?'no':'na');
  });
  group.dataset.val = val;
  if (cb) window[cb]();
}

function getToggle(groupId) {
  const el = document.getElementById(groupId);
  return el ? el.dataset.val || null : null;
}
