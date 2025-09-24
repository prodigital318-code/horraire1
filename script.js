// script.js
let employeActuel = null;
let qrCodeScanner = null;

// Helpers
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const show = (el) => el.classList.remove('hidden');
const hide = (el) => el.classList.add('hidden');

document.addEventListener('DOMContentLoaded', () => {
  if ($('#tabEmployes')) initAdmin();
  if ($('#reader')) initEmploye();
});

/* -------------------- ADMIN -------------------- */
function initAdmin() {
  ['#tabEmployes','#tabShifts','#tabPointages'].forEach((id)=>{
    document.querySelector(id).addEventListener('click', (ev) => {
      $$('.nav-btn').forEach(b => b.classList.remove('active'));
      ev.currentTarget.classList.add('active');
      switchSection(ev.currentTarget.getAttribute('data-section'));
    });
  });

  $('#btnAjouterEmploye').addEventListener('click', () => openEmployeeModal());
  $('#btnGenererQR')?.addEventListener('click', () => { if (employeActuel?.id) renderQR(employeActuel.id); });

  $('#formEmploye').addEventListener('submit', async (e) => { e.preventDefault(); await saveEmployee(); });

  const modal = $('#modalEmploye');
  modal.querySelector('.close').addEventListener('click', () => hide(modal));
  window.addEventListener('click', (ev) => { if (ev.target === modal) hide(modal); });

  $('#formShift').addEventListener('submit', async (e) => { e.preventDefault(); await addShift(); });
  $('#btnFiltrer').addEventListener('click', loadPointages);

  switchSection('sectionEmployes');
  loadEmployees();
}

function switchSection(id) {
  $$('.admin-section').forEach(hide);
  show(document.getElementById(id));
  if (id === 'sectionEmployes') loadEmployees();
  if (id === 'sectionShifts') { loadEmployeesForSelect('selectEmployeShift'); loadShifts(); }
  if (id === 'sectionPointages') { loadEmployeesForSelect('selectEmployePointage'); loadPointages(); }
}

/** EMPLOYES **/
async function loadEmployees() {
  try {
    const { data, error } = await sb.from('employes').select('*').order('nom', { ascending: true });
    if (error) throw error;
    const box = $('#listeEmployes'); box.innerHTML = '';
    data.forEach(e => {
      const card = document.createElement('div'); card.className = 'employe-card';
      card.innerHTML = `
        <h3>${escapeHTML(e.prenom)} ${escapeHTML(e.nom)}</h3>
        <p>Email: ${e.email ? escapeHTML(e.email) : '—'}</p>
        <p>ID: <code>${e.id}</code></p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
          <button class="btn-primary" data-edit="${e.id}">Modifier</button>
          <button class="btn-secondary" data-del="${e.id}">Supprimer</button>
          <button class="btn-secondary" data-qr="${e.id}">QR</button>
        </div>
      `;
      box.appendChild(card);
    });
    box.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => editEmployee(b.dataset.edit));
    box.querySelectorAll('[data-del]').forEach(b => b.onclick = () => deleteEmployee(b.dataset.del));
    box.querySelectorAll('[data-qr]').forEach(b => b.onclick = async () => {
      const { data, error } = await sb.from('employes').select('*').eq('id', b.dataset.qr).single();
      if (error) return alert('Employé introuvable');
      openEmployeeModal(data);
    });
  } catch (err) { console.error(err); alert("Erreur lors du chargement des employés"); }
}

async function loadEmployeesForSelect(selectId) {
  try {
    const { data, error } = await sb.from('employes').select('id, nom, prenom').order('nom', { ascending: true });
    if (error) throw error;
    const sel = document.getElementById(selectId);
    sel.innerHTML = '<option value="">Sélectionner un employé</option>';
    data.forEach(e => { const opt = document.createElement('option'); opt.value = e.id; opt.textContent = `${e.prenom} ${e.nom}`; sel.appendChild(opt); });
  } catch (err) { console.error(err); }
}

function openEmployeeModal(e = null) {
  const modal = $('#modalEmploye'); const qrBox = $('#qrCodeContainer');
  if (e) {
    $('#titreModal').textContent = "Modifier l'employé";
    $('#nomEmploye').value = e.nom; $('#prenomEmploye').value = e.prenom; $('#emailEmploye').value = e.email || '';
    employeActuel = e; show(qrBox); renderQR(e.id);
  } else {
    $('#titreModal').textContent = "Ajouter un employé";
    $('#formEmploye').reset(); employeActuel = null; hide(qrBox);
  }
  show(modal);
}

async function saveEmployee() {
  const nom = $('#nomEmploye').value.trim();
  const prenom = $('#prenomEmploye').value.trim();
  const email = $('#emailEmploye').value.trim() || null;
  try {
    if (employeActuel) {
      const { error } = await sb.from('employes').update({ nom, prenom, email }).eq('id', employeActuel.id);
      if (error) throw error;
      alert('Employé mis à jour'); loadEmployees();
    } else {
      const { data, error } = await sb.from('employes').insert([{ nom, prenom, email }]).select().single();
      if (error) throw error;
      employeActuel = data; show($('#qrCodeContainer')); renderQR(employeActuel.id);
      alert('Employé créé'); loadEmployees();
    }
  } catch (err) { console.error(err); alert("Erreur lors de l'enregistrement"); }
}

async function editEmployee(id) {
  try {
    const { data, error } = await sb.from('employes').select('*').eq('id', id).single();
    if (error) throw error; openEmployeeModal(data);
  } catch (err) { console.error(err); alert("Erreur de chargement"); }
}

async function deleteEmployee(id) {
  if (!confirm("Supprimer cet employé ?")) return;
  try {
    const { error } = await sb.from('employes').delete().eq('id', id);
    if (error) throw error; alert("Supprimé"); loadEmployees();
  } catch (err) { console.error(err); alert("Erreur de suppression"); }
}

/** SHIFTS **/
async function addShift() {
  const employeId = $('#selectEmployeShift').value;
  const date = $('#dateShift').value;
  const heure_debut = $('#heureDebut').value;
  const heure_fin = $('#heureFin').value;
  if (!employeId || !date || !heure_debut || !heure_fin) return alert("Champs manquants");

  try {
    const { error } = await sb.from('shifts').insert([{ employe_id: employeId, date, heure_debut, heure_fin }]);
    if (error) throw error; alert('Shift ajouté'); loadShifts(); $('#formShift').reset();
  } catch (err) { console.error(err); alert("Erreur ajout shift"); }
}

async function loadShifts() {
  try {
    const { data, error } = await sb.from('shifts')
      .select('id, date, heure_debut, heure_fin, employes:employe_id(prenom, nom)')
      .order('date', { ascending: false });
    if (error) throw error;
    const box = $('#listeShifts'); box.innerHTML = '';
    data.forEach(s => {
      const card = document.createElement('div'); card.className = 'shift-card';
      card.innerHTML = `
        <h3>${escapeHTML(s.employes?.prenom || '')} ${escapeHTML(s.employes?.nom || '')}</h3>
        <p>Date: ${new Date(s.date).toLocaleDateString('fr-FR')}</p>
        <p>Début: ${s.heure_debut} — Fin: ${s.heure_fin}</p>
        <button class="btn-secondary" data-del-shift="${s.id}">Supprimer</button>`;
      box.appendChild(card);
    });
    box.querySelectorAll('[data-del-shift]').forEach(b => b.onclick = () => deleteShift(b.dataset.delShift));
  } catch (err) { console.error(err); alert("Erreur chargement shifts"); }
}

async function deleteShift(id) {
  if (!confirm("Supprimer ce shift ?")) return;
  try {
    const { error } = await sb.from('shifts').delete().eq('id', id);
    if (error) throw error; alert('Shift supprimé'); loadShifts();
  } catch (err) { console.error(err); alert("Erreur suppression"); }
}

/** POINTAGES **/
async function loadPointages() {
  try {
    let q = sb.from('pointages')
      .select('id, date_pointage, heure_pointage, type_pointage, employes:employe_id(prenom, nom)')
      .order('date_pointage', { ascending: false });

    const employeId = $('#selectEmployePointage').value;
    const date = $('#datePointage').value;
    if (employeId) q = q.eq('employe_id', employeId);
    if (date) q = q.eq('date_pointage', date);

    const { data, error } = await q;
    if (error) throw error;

    const box = $('#listePointages'); box.innerHTML = '';
    data.forEach(p => {
      const card = document.createElement('div'); card.className = 'pointage-card';
      card.innerHTML = `
       <h3>${escapeHTML(p.employes?.prenom || '')} ${escapeHTML(p.employes?.nom || '')}</h3>
       <p>${new Date(p.date_pointage).toLocaleDateString('fr-FR')} — ${p.heure_pointage}</p>
       <p>Type: ${p.type_pointage === 'arrivee' ? 'Arrivée' : 'Départ'}</p>`;
      box.appendChild(card);
    });
  } catch (err) { console.error(err); alert("Erreur chargement pointages"); }
}

/** QR */
function renderQR(text) {
  const canvas = document.getElementById('qrCanvas');
  if (!canvas) return;
  QRCode.toCanvas(canvas, String(text), { width: 256, margin: 1 }, (err) => { if (err) console.error(err); });
}

/* -------------------- EMPLOYÉ -------------------- */
function initEmploye() {
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    show($('#httpsWarning'));
  }
  $('#btnStartScan').addEventListener('click', startLiveScan);
  $('#fileInput').addEventListener('change', onFileImport);
  $('#btnPointer').addEventListener('click', pointer);
}

async function startLiveScan() {
  try {
    qrCodeScanner = new Html5Qrcode("reader");
    await qrCodeScanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (text) => onScanSuccess(text),
      () => {}
    );
  } catch (err) {
    console.error(err);
    $('#result').innerHTML = '<p class="warning">La caméra ne peut pas démarrer. Utilisez "Importer une image".</p>';
  }
}

async function onFileImport(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const reader = new Html5Qrcode('reader');
    const decoded = await reader.scanFile(file, true);
    onScanSuccess(decoded.text);
    await reader.clear();
  } catch (err) {
    console.error(err);
    $('#result').innerHTML = '<p style="color:red">Impossible de lire le QR depuis l’image.</p>';
  }
}

function onScanSuccess(decodedText) {
  if (qrCodeScanner) { qrCodeScanner.stop().catch(()=>{}).finally(()=>{ qrCodeScanner = null; }); }
  $('#result').innerHTML = `<p>QR Code scanné: <b>${escapeHTML(decodedText)}</b></p>`;
  fetchEmployee(decodedText);
}

async function fetchEmployee(idText) {
  try {
    const { data, error } = await sb.from('employes').select('*').eq('id', idText).single();
    if (error) throw error;
    employeActuel = data;
    $('#nomEmployePointage').textContent = `${data.prenom} ${data.nom}`;
    show($('#infoEmploye'));
    await computeNextStatus(data.id);
  } catch (err) {
    console.error(err);
    $('#result').innerHTML = '<p style="color:red">Employé non trouvé</p>';
  }
}

async function computeNextStatus(employeId) {
  try {
    const d = formatSQLDate();
    const { data, error } = await sb.from('pointages')
      .select('type_pointage')
      .eq('employe_id', employeId).eq('date_pointage', d)
      .order('heure_pointage', { ascending: false }).limit(1);
    if (error) throw error;
    const next = (!data || data.length === 0 || data[0].type_pointage === 'depart') ? 'Arrivée' : 'Départ';
    $('#statutPointage').textContent = `Prochain pointage : ${next}`;
  } catch (err) { console.error(err); }
}

async function pointer() {
  if (!employeActuel) return;
  try {
    const now = new Date();
    const date_pointage = formatSQLDate(now);
    const heure_pointage = formatSQLTime(now);
    const { data: last, error: e1 } = await sb.from('pointages')
      .select('type_pointage').eq('employe_id', employeActuel.id).eq('date_pointage', date_pointage)
      .order('heure_pointage', { ascending: false }).limit(1);
    if (e1) throw e1;
    const type_pointage = (!last || last.length === 0 || last[0].type_pointage === 'depart') ? 'arrivee' : 'depart';
    const { error } = await sb.from('pointages').insert([{ employe_id: employeActuel.id, date_pointage, heure_pointage, type_pointage }]);
    if (error) throw error;
    $('#heurePointage').textContent = `Pointage enregistré à ${heure_pointage}`;
    $('#btnPointer').disabled = true;
    await computeNextStatus(employeActuel.id);
    setTimeout(()=> $('#btnPointer').disabled = false, 3000);
  } catch (err) { console.error(err); alert("Erreur lors du pointage"); }
}

/* util */
function escapeHTML(s=''){return s.replace(/[&<>"'`=\/]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;','\\':'\\'}[c]))}
