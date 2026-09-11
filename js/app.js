/**
 * Main Application Logic
 * National Cancer Institute ERAS Web Application
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize view switcher
  initNavigation();

  // Initialize Form Event Listeners & Auto-calculators
  initFormCalculators();

  // Load and render initial registry data
  renderRegistry();

  // Render initial dashboard KPIs & charts
  renderDashboard();

  // Export handlers
  document.getElementById('btnExportCSV')?.addEventListener('click', () => window.PatientStore.exportCSV());
  document.getElementById('btnExportJSON')?.addEventListener('click', () => window.PatientStore.exportJSON());
  document.getElementById('btnImportJSON')?.addEventListener('click', () => document.getElementById('fileImportJSON').click());
  document.getElementById('fileImportJSON')?.addEventListener('change', handleImportJSON);

  // New Patient button
  document.getElementById('btnNewPatient')?.addEventListener('click', () => openFormView());
  document.getElementById('btnHeroStart')?.addEventListener('click', () => openFormView());
  document.getElementById('btnCancelForm')?.addEventListener('click', () => switchView('registry-view'));

  // Patient Form Submit
  document.getElementById('erasPatientForm')?.addEventListener('submit', handleFormSubmit);

  // Search & Filter Listeners
  document.getElementById('searchPatientInput')?.addEventListener('input', renderRegistryTable);
  document.getElementById('filterApproach')?.addEventListener('change', renderRegistryTable);
  document.getElementById('filterComplication')?.addEventListener('change', renderRegistryTable);
});

/**
 * View Navigation
 */
function initNavigation() {
  const navLinks = document.querySelectorAll('.sub-nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = link.getAttribute('data-target');
      if (targetView) {
        switchView(targetView);
      }
    });
  });
}

function switchView(viewId) {
  // Update view containers
  const views = document.querySelectorAll('.view-container');
  views.forEach(v => v.classList.remove('active'));

  const target = document.getElementById(viewId);
  if (target) {
    target.classList.add('active');
  }

  // Update sub-nav active link
  const navLinks = document.querySelectorAll('.sub-nav-link');
  navLinks.forEach(link => {
    if (link.getAttribute('data-target') === viewId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Refresh view specific data
  if (viewId === 'dashboard-view') {
    renderDashboard();
  } else if (viewId === 'registry-view') {
    renderRegistry();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openFormView(patientId = null) {
  const form = document.getElementById('erasPatientForm');
  form.reset();

  const titleEl = document.getElementById('formViewTitle');
  document.getElementById('formPatientId').value = '';

  if (patientId) {
    const patient = window.PatientStore.getById(patientId);
    if (patient) {
      titleEl.textContent = `แก้ไขข้อมูลผู้ป่วย: ${patient.patient_hn}`;
      populateForm(patient);
    }
  } else {
    titleEl.textContent = 'บันทึกข้อมูลผู้ป่วย ERAS รายใหม่';
    // Set default surgery start date to today
    const now = new Date();
    const isoNow = now.toISOString().slice(0, 16);
    document.getElementById('surgery_start_datetime').value = isoNow;
  }

  triggerCalculators();
  switchView('form-view');
}

/**
 * Populate Form fields with patient data
 */
function populateForm(patient) {
  const fields = [
    'patient_hn', 'admission_an', 'dob', 'gender', 'height_cm', 'weight_kg', 'smoking_status',
    'icd10_diagnosis', 'cancer_stage', 'neoadjuvant_rx', 'asa_physical_status', 'nutrition_screen_score', 'serum_albumin',
    'fluid_fasting_hours', 'bowel_prep_type', 'surgery_start_datetime', 'surgery_end_datetime', 'surgical_approach',
    'intraop_fluid_ml', 'estimated_blood_loss', 'first_mobilization_dt', 'first_oral_intake_dt', 'foley_removal_dt',
    'pain_score_24h_max', 'total_morphine_eq_mg', 'discharge_datetime', 'clavien_dindo_grade'
  ];

  document.getElementById('formPatientId').value = patient.id;

  fields.forEach(field => {
    const el = document.getElementById(field);
    if (el && patient[field] !== undefined) {
      el.value = patient[field];
    }
  });

  // Checkboxes
  document.getElementById('eras_counseling').checked = !!patient.eras_counseling;
  document.getElementById('carbo_loading_given').checked = !!patient.carbo_loading_given;
  document.getElementById('temp_monitoring_used').checked = !!patient.temp_monitoring_used;
  document.getElementById('complication_occured').checked = !!patient.complication_occured;
  document.getElementById('readmission_30days').checked = !!patient.readmission_30days;
}

/**
 * Auto-calculators & Field Change Listeners
 */
function initFormCalculators() {
  const dobInput = document.getElementById('dob');
  const startInput = document.getElementById('surgery_start_datetime');
  const heightInput = document.getElementById('height_cm');
  const weightInput = document.getElementById('weight_kg');
  const nrsInput = document.getElementById('nutrition_screen_score');
  const fastingInput = document.getElementById('fluid_fasting_hours');
  const endInput = document.getElementById('surgery_end_datetime');
  const dischargeInput = document.getElementById('discharge_datetime');

  dobInput?.addEventListener('input', calculateAge);
  startInput?.addEventListener('input', () => {
    calculateAge();
    calculateDuration();
    calculateLOS();
  });

  heightInput?.addEventListener('input', calculateBMI);
  weightInput?.addEventListener('input', calculateBMI);

  nrsInput?.addEventListener('input', evaluateNRS);
  fastingInput?.addEventListener('input', evaluateFasting);

  endInput?.addEventListener('input', calculateDuration);
  dischargeInput?.addEventListener('input', calculateLOS);
}

function triggerCalculators() {
  calculateAge();
  calculateBMI();
  evaluateNRS();
  evaluateFasting();
  calculateDuration();
  calculateLOS();
}

function calculateAge() {
  const dob = document.getElementById('dob').value;
  const surg = document.getElementById('surgery_start_datetime').value;
  const age = window.ErasCalculator.calculateAge(dob, surg);

  const display = document.getElementById('calc_age_display');
  if (display) {
    display.value = age !== null ? `${age} ปี` : '-';
  }
}

function calculateBMI() {
  const h = document.getElementById('height_cm').value;
  const w = document.getElementById('weight_kg').value;
  const bmi = window.ErasCalculator.calculateBMI(h, w);

  const display = document.getElementById('calc_bmi_display');
  if (display) {
    display.value = bmi !== null ? `${bmi} kg/m²` : '-';
  }
}

function evaluateNRS() {
  const score = document.getElementById('nutrition_screen_score').value;
  const res = window.ErasCalculator.evaluateNutritionRisk(score);

  const badge = document.getElementById('badge_nrs');
  if (badge) {
    badge.className = `alert-badge ${res.badgeClass}`;
    badge.textContent = res.label;
  }
}

function evaluateFasting() {
  const hours = document.getElementById('fluid_fasting_hours').value;
  const res = window.ErasCalculator.evaluateFluidFasting(hours);

  const badge = document.getElementById('badge_fasting');
  if (badge) {
    badge.className = `alert-badge ${res.badgeClass}`;
    badge.textContent = res.label;
  }
}

function calculateDuration() {
  const start = document.getElementById('surgery_start_datetime').value;
  const end = document.getElementById('surgery_end_datetime').value;
  const dur = window.ErasCalculator.calculateSurgeryDuration(start, end);

  const display = document.getElementById('calc_duration_display');
  if (display) {
    display.value = dur ? dur.formatted : '-';
  }
}

function calculateLOS() {
  const start = document.getElementById('surgery_start_datetime').value;
  const dc = document.getElementById('discharge_datetime').value;
  const los = window.ErasCalculator.calculateLOS(start, dc);

  const display = document.getElementById('calc_los_display');
  if (display) {
    display.value = los ? los.formatted : '-';
  }
}

/**
 * Handle Form Submission
 */
function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('formPatientId').value;
  const startStr = document.getElementById('surgery_start_datetime').value;
  const endStr = document.getElementById('surgery_end_datetime').value;

  // Validation: End must be after Start
  if (endStr && new Date(endStr) <= new Date(startStr)) {
    alert('ข้อผิดพลาด: เวลาสิ้นสุดผ่าตัด ต้องมากกว่าเวลาเริ่มลงมีดผ่าตัด');
    document.getElementById('surgery_end_datetime').focus();
    return;
  }

  const patientData = {
    id: id || undefined,
    patient_hn: document.getElementById('patient_hn').value.trim(),
    admission_an: document.getElementById('admission_an').value.trim(),
    dob: document.getElementById('dob').value,
    gender: document.getElementById('gender').value,
    height_cm: parseFloat(document.getElementById('height_cm').value),
    weight_kg: parseFloat(document.getElementById('weight_kg').value),
    smoking_status: document.getElementById('smoking_status').value,

    icd10_diagnosis: document.getElementById('icd10_diagnosis').value.trim(),
    cancer_stage: document.getElementById('cancer_stage').value,
    neoadjuvant_rx: document.getElementById('neoadjuvant_rx').value,
    asa_physical_status: parseInt(document.getElementById('asa_physical_status').value, 10),
    nutrition_screen_score: parseInt(document.getElementById('nutrition_screen_score').value, 10),
    serum_albumin: parseFloat(document.getElementById('serum_albumin').value),

    eras_counseling: document.getElementById('eras_counseling').checked,
    fluid_fasting_hours: parseFloat(document.getElementById('fluid_fasting_hours').value),
    carbo_loading_given: document.getElementById('carbo_loading_given').checked,
    bowel_prep_type: document.getElementById('bowel_prep_type').value,

    surgery_start_datetime: startStr,
    surgery_end_datetime: endStr,
    surgical_approach: document.getElementById('surgical_approach').value,
    intraop_fluid_ml: parseInt(document.getElementById('intraop_fluid_ml').value, 10),
    estimated_blood_loss: parseInt(document.getElementById('estimated_blood_loss').value, 10),
    temp_monitoring_used: document.getElementById('temp_monitoring_used').checked,

    first_mobilization_dt: document.getElementById('first_mobilization_dt').value || null,
    first_oral_intake_dt: document.getElementById('first_oral_intake_dt').value || null,
    foley_removal_dt: document.getElementById('foley_removal_dt').value || null,
    pain_score_24h_max: parseInt(document.getElementById('pain_score_24h_max').value, 10),
    total_morphine_eq_mg: parseFloat(document.getElementById('total_morphine_eq_mg').value),

    discharge_datetime: document.getElementById('discharge_datetime').value || null,
    complication_occured: document.getElementById('complication_occured').checked,
    clavien_dindo_grade: document.getElementById('clavien_dindo_grade').value,
    readmission_30days: document.getElementById('readmission_30days').checked
  };

  window.PatientStore.save(patientData);
  alert('บันทึกข้อมูลผู้ป่วยสำเร็จ!');
  switchView('registry-view');
}

/**
 * Render Registry View (Patient Directory)
 */
function renderRegistry() {
  renderRegistryTable();
}

function renderRegistryTable() {
  const patients = window.PatientStore.getAll();
  const tbody = document.getElementById('patientRegistryTbody');
  if (!tbody) return;

  const searchQuery = (document.getElementById('searchPatientInput')?.value || '').toLowerCase();
  const filterApproach = document.getElementById('filterApproach')?.value || '';
  const filterComplication = document.getElementById('filterComplication')?.value || '';

  const filtered = patients.filter(p => {
    const matchSearch = p.patient_hn.toLowerCase().includes(searchQuery) ||
                        p.admission_an.toLowerCase().includes(searchQuery) ||
                        p.icd10_diagnosis.toLowerCase().includes(searchQuery);

    const matchApproach = !filterApproach || p.surgical_approach === filterApproach;

    let matchComp = true;
    if (filterComplication === 'yes') matchComp = p.complication_occured === true;
    if (filterComplication === 'no') matchComp = !p.complication_occured;

    return matchSearch && matchApproach && matchComp;
  });

  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 32px; color: var(--color-ink-muted-48);">ไม่พบข้อมูลผู้ป่วยตามเงื่อนไขที่ค้นหา</td></tr>`;
    return;
  }

  filtered.forEach(p => {
    const age = window.ErasCalculator.calculateAge(p.dob, p.surgery_start_datetime);
    const bmi = window.ErasCalculator.calculateBMI(p.height_cm, p.weight_kg);
    const compliance = window.ErasCalculator.calculateCompliance(p);
    const los = window.ErasCalculator.calculateLOS(p.surgery_start_datetime, p.discharge_datetime);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${p.patient_hn}</strong></td>
      <td>${p.admission_an}</td>
      <td>${p.gender === 'Male' ? 'ชาย' : 'หญิง'} / ${age ? age + ' ปี' : '-'}</td>
      <td><span class="alert-badge alert-badge-info">${p.icd10_diagnosis}</span> (${p.cancer_stage})</td>
      <td>${p.surgical_approach}</td>
      <td>
        <span class="alert-badge ${compliance.percent >= 80 ? 'alert-badge-success' : 'alert-badge-warning'}">
          ${compliance.percent}% (${compliance.metItems}/${compliance.totalItems})
        </span>
      </td>
      <td>${los ? los.formatted : 'ยังไม่จำหน่าย'}</td>
      <td>
        ${p.complication_occured ? `<span class="alert-badge alert-badge-danger">${p.clavien_dindo_grade}</span>` : `<span class="alert-badge alert-badge-success">ไม่มี</span>`}
      </td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="btn-pearl-capsule" onclick="viewSummaryModal('${p.id}')">ดูสรุป</button>
          <button class="btn-pearl-capsule" onclick="openFormView('${p.id}')">แก้ไข</button>
          <button class="btn-pearl-capsule" style="color:var(--color-danger);" onclick="deletePatientRecord('${p.id}')">ลบ</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function deletePatientRecord(id) {
  if (confirm('คุณต้องการลบข้อมูลผู้ป่วยรายนี้ใช่หรือไม่?')) {
    window.PatientStore.delete(id);
    renderRegistryTable();
    renderDashboard();
  }
}

/**
 * Render Dashboard KPIs & Charts
 */
function renderDashboard() {
  const patients = window.PatientStore.getAll();

  // KPIs
  const totalCount = patients.length;
  document.getElementById('kpiTotalPatients').textContent = totalCount;

  let totalCompliance = 0;
  let losSumDays = 0;
  let losCount = 0;
  let compCount = 0;
  let readmitCount = 0;

  patients.forEach(p => {
    const comp = window.ErasCalculator.calculateCompliance(p);
    totalCompliance += comp.percent;

    const los = window.ErasCalculator.calculateLOS(p.surgery_start_datetime, p.discharge_datetime);
    if (los) {
      losSumDays += los.days + (los.hours / 24);
      losCount++;
    }

    if (p.complication_occured) compCount++;
    if (p.readmission_30days) readmitCount++;
  });

  const avgCompliance = totalCount > 0 ? Math.round(totalCompliance / totalCount) : 0;
  const avgLOS = losCount > 0 ? (losSumDays / losCount).toFixed(1) : '-';
  const compRate = totalCount > 0 ? Math.round((compCount / totalCount) * 100) : 0;

  document.getElementById('kpiAvgCompliance').textContent = `${avgCompliance}%`;
  document.getElementById('kpiAvgLOS').textContent = `${avgLOS} วัน`;
  document.getElementById('kpiComplicationRate').textContent = `${compRate}%`;

  // Render Charts
  window.ErasCharts.renderDashboardCharts(patients);
}

/**
 * Patient Summary Modal (View & Print)
 */
function viewSummaryModal(patientId) {
  const p = window.PatientStore.getById(patientId);
  if (!p) return;

  const age = window.ErasCalculator.calculateAge(p.dob, p.surgery_start_datetime);
  const bmi = window.ErasCalculator.calculateBMI(p.height_cm, p.weight_kg);
  const dur = window.ErasCalculator.calculateSurgeryDuration(p.surgery_start_datetime, p.surgery_end_datetime);
  const los = window.ErasCalculator.calculateLOS(p.surgery_start_datetime, p.discharge_datetime);
  const compliance = window.ErasCalculator.calculateCompliance(p);
  const nrsRisk = window.ErasCalculator.evaluateNutritionRisk(p.nutrition_screen_score);

  const container = document.getElementById('summaryModalContent');
  container.innerHTML = `
    <div style="text-align:center; margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid #eee;">
      <h2 style="font-size:22px; font-weight:600;">สรุปผลการปฏิบัติตามแนวทาง ERAS (Clinical Summary Report)</h2>
      <p style="font-size:14px; color:#666;">สถาบันมะเร็งแห่งชาติ (National Cancer Institute, Thailand)</p>
    </div>

    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-item-label">HN / AN</div>
        <div class="summary-item-value">${p.patient_hn} / ${p.admission_an}</div>
      </div>
      <div class="summary-item">
        <div class="summary-item-label">เพศ / อายุ / BMI</div>
        <div class="summary-item-value">${p.gender === 'Male' ? 'ชาย' : 'หญิง'} | ${age ? age + ' ปี' : '-'} | BMI: ${bmi || '-'}</div>
      </div>
      <div class="summary-item">
        <div class="summary-item-label">การวินิจฉัยหลัก (ICD-10)</div>
        <div class="summary-item-value">${p.icd10_diagnosis} (${p.cancer_stage})</div>
      </div>
      <div class="summary-item">
        <div class="summary-item-label">โภชนาการ (NRS-2002) / Albumin</div>
        <div class="summary-item-value">คะแนน ${p.nutrition_screen_score} (${nrsRisk.label}) | Albumin: ${p.serum_albumin} g/dL</div>
      </div>
      <div class="summary-item">
        <div class="summary-item-label">วิธีผ่าตัด & ระยะเวลา</div>
        <div class="summary-item-value">${p.surgical_approach} (${dur ? dur.formatted : '-'})</div>
      </div>
      <div class="summary-item">
        <div class="summary-item-label">อัตรา ERAS Compliance</div>
        <div class="summary-item-value" style="color:var(--color-primary);">${compliance.percent}% (${compliance.metItems}/${compliance.totalItems} ข้อ)</div>
      </div>
      <div class="summary-item">
        <div class="summary-item-label">ระยะเวลานอนโรงพยาบาล (LOS)</div>
        <div class="summary-item-value">${los ? los.formatted : 'ยังไม่จำหน่าย'}</div>
      </div>
      <div class="summary-item">
        <div class="summary-item-label">ภาวะแทรกซ้อน (Clavien-Dindo)</div>
        <div class="summary-item-value">${p.complication_occured ? p.clavien_dindo_grade : 'ไม่มีภาวะแทรกซ้อน'}</div>
      </div>
    </div>
  `;

  document.getElementById('summaryModal').classList.add('active');
}

function closeSummaryModal() {
  document.getElementById('summaryModal').classList.remove('active');
}

function printSummaryReport() {
  window.print();
}

/**
 * Handle JSON Import
 */
function handleImportJSON(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const data = JSON.parse(evt.target.result);
      if (Array.isArray(data)) {
        window.PatientStore.saveAll(data);
        alert('นำเข้าข้อมูลสำเร็จ!');
        renderRegistry();
        renderDashboard();
      } else {
        alert('รูปแบบไฟล์ JSON ไม่ถูกต้อง');
      }
    } catch (err) {
      alert('ไม่สามารถอ่านไฟล์ JSON ได้: ' + err.message);
    }
  };
  reader.readAsText(file);
}

// Global functions for inline HTML click handlers
window.openFormView = openFormView;
window.viewSummaryModal = viewSummaryModal;
window.closeSummaryModal = closeSummaryModal;
window.printSummaryReport = printSummaryReport;
window.deletePatientRecord = deletePatientRecord;
