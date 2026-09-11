/**
 * Patient Data Store Module (Hybrid Cloudflare D1 API + LocalStorage)
 * National Cancer Institute ERAS Registry
 */

window.PatientStore = {
  STORAGE_KEY: 'nci_eras_patients_v1',
  API_URL: '/api/patients',

  /**
   * Sample Initial Dataset for National Cancer Institute (NCI Thailand)
   */
  getInitialData() {
    return [
      {
        id: 'p-001',
        patient_hn: 'HN67-00124',
        admission_an: 'AN67-09412',
        dob: '1968-04-12',
        gender: 'Male',
        height_cm: 168.00,
        weight_kg: 65.50,
        smoking_status: 'Ex-smoker',

        icd10_diagnosis: 'C18.9',
        cancer_stage: 'Stage II',
        neoadjuvant_rx: 'None',
        asa_physical_status: 2,
        nutrition_screen_score: 2,
        serum_albumin: 3.80,

        eras_counseling: true,
        fluid_fasting_hours: 2.5,
        carbo_loading_given: true,
        bowel_prep_type: 'Clear_Liquid',

        surgery_start_datetime: '2026-08-10T08:30',
        surgery_end_datetime: '2026-08-10T11:45',
        surgical_approach: 'Laparoscopic',
        intraop_fluid_ml: 1200,
        estimated_blood_loss: 100,
        temp_monitoring_used: true,

        first_mobilization_dt: '2026-08-10T18:00',
        first_oral_intake_dt: '2026-08-11T07:30',
        foley_removal_dt: '2026-08-11T08:00',
        pain_score_24h_max: 3,
        total_morphine_eq_mg: 10.0,

        discharge_datetime: '2026-08-13T10:00',
        complication_occured: false,
        clavien_dindo_grade: 'None',
        readmission_30days: false,
        created_at: '2026-08-13T10:30:00Z'
      },
      {
        id: 'p-002',
        patient_hn: 'HN67-00289',
        admission_an: 'AN67-10115',
        dob: '1959-11-23',
        gender: 'Female',
        height_cm: 155.00,
        weight_kg: 52.00,
        smoking_status: 'Never',

        icd10_diagnosis: 'C20',
        cancer_stage: 'Stage III',
        neoadjuvant_rx: 'ChemoRT',
        asa_physical_status: 3,
        nutrition_screen_score: 4,
        serum_albumin: 3.20,

        eras_counseling: true,
        fluid_fasting_hours: 2.0,
        carbo_loading_given: true,
        bowel_prep_type: 'Clear_Liquid',

        surgery_start_datetime: '2026-08-14T09:00',
        surgery_end_datetime: '2026-08-14T13:30',
        surgical_approach: 'Robotic',
        intraop_fluid_ml: 1500,
        estimated_blood_loss: 150,
        temp_monitoring_used: true,

        first_mobilization_dt: '2026-08-14T20:00',
        first_oral_intake_dt: '2026-08-15T08:00',
        foley_removal_dt: '2026-08-15T09:30',
        pain_score_24h_max: 4,
        total_morphine_eq_mg: 15.0,

        discharge_datetime: '2026-08-18T11:00',
        complication_occured: true,
        clavien_dindo_grade: 'Grade_I',
        readmission_30days: false,
        created_at: '2026-08-18T11:30:00Z'
      },
      {
        id: 'p-003',
        patient_hn: 'HN67-00341',
        admission_an: 'AN67-11090',
        dob: '1974-02-05',
        gender: 'Male',
        height_cm: 172.00,
        weight_kg: 78.00,
        smoking_status: 'Current',

        icd10_diagnosis: 'C16.9',
        cancer_stage: 'Stage III',
        neoadjuvant_rx: 'Chemo',
        asa_physical_status: 3,
        nutrition_screen_score: 3,
        serum_albumin: 3.40,

        eras_counseling: false,
        fluid_fasting_hours: 6.0,
        carbo_loading_given: false,
        bowel_prep_type: 'Full_MBP',

        surgery_start_datetime: '2026-08-20T10:00',
        surgery_end_datetime: '2026-08-20T15:00',
        surgical_approach: 'Open',
        intraop_fluid_ml: 2800,
        estimated_blood_loss: 450,
        temp_monitoring_used: false,

        first_mobilization_dt: '2026-08-22T10:00',
        first_oral_intake_dt: '2026-08-22T14:00',
        foley_removal_dt: '2026-08-23T09:00',
        pain_score_24h_max: 7,
        total_morphine_eq_mg: 45.0,

        discharge_datetime: '2026-08-27T14:00',
        complication_occured: true,
        clavien_dindo_grade: 'Grade_II',
        readmission_30days: false,
        created_at: '2026-08-27T14:30:00Z'
      }
    ];
  },

  /**
   * Fetch all records (Attempts Cloudflare D1 API first, falls back to LocalStorage)
   */
  async fetchAllRemote() {
    try {
      const res = await fetch(this.API_URL);
      if (res.status === 401) {
        if (window.showLogin) window.showLogin();
        return [];
      }
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          this.saveAll(data);
          return data;
        }
      }
    } catch (e) {
      console.log('Cloudflare D1 API not reachable, using local cache:', e.message);
    }
    return this.getAll();
  },

  getAll() {
    const json = localStorage.getItem(this.STORAGE_KEY);
    if (!json) {
      const initial = this.getInitialData();
      this.saveAll(initial);
      return initial;
    }
    try {
      return JSON.parse(json);
    } catch (e) {
      console.error('Failed to parse patient data', e);
      return [];
    }
  },

  getById(id) {
    const list = this.getAll();
    return list.find(p => p.id === id) || null;
  },

  saveAll(patients) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(patients));
  },

  async save(patient) {
    const list = this.getAll();
    if (!patient.id) {
      patient.id = 'p-' + Date.now();
      patient.created_at = new Date().toISOString();
      list.unshift(patient);
    } else {
      const index = list.findIndex(p => p.id === patient.id);
      if (index !== -1) {
        list[index] = { ...list[index], ...patient, updated_at: new Date().toISOString() };
      } else {
        list.unshift(patient);
      }
    }
    this.saveAll(list);

    // Sync asynchronously to Cloudflare D1
    try {
      const res = await fetch(this.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patient)
      });
      if (res.status === 401 && window.showLogin) window.showLogin();
    } catch (e) {
      console.warn('Could not sync to Cloudflare D1 API:', e.message);
    }

    return patient;
  },

  async delete(id) {
    let list = this.getAll();
    list = list.filter(p => p.id !== id);
    this.saveAll(list);

    try {
      const res = await fetch(`${this.API_URL}?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (res.status === 401 && window.showLogin) window.showLogin();
    } catch (e) {
      console.warn('Could not sync delete to Cloudflare D1 API:', e.message);
    }
  },

  exportCSV() {
    const list = this.getAll();
    if (list.length === 0) return;

    const headers = [
      'ID', 'HN', 'AN', 'DOB', 'Gender', 'Height_cm', 'Weight_kg', 'BMI', 'Smoking_Status',
      'ICD10_Diagnosis', 'Cancer_Stage', 'Neoadjuvant_Rx', 'ASA_Status', 'Nutrition_NRS2002', 'Serum_Albumin',
      'ERAS_Counseling', 'Fluid_Fasting_Hours', 'Carbo_Loading', 'Bowel_Prep',
      'Surgery_Start', 'Surgery_End', 'Duration_Mins', 'Surgical_Approach', 'Intraop_Fluid_ml', 'EBL_ml', 'Temp_Monitoring',
      'First_Mobilization', 'First_Oral_Intake', 'Foley_Removal', 'Pain_24h_Max', 'Total_Morphine_MME',
      'Discharge_DateTime', 'LOS_Days', 'Complication_Occured', 'Clavien_Dindo_Grade', 'Readmission_30Days', 'Compliance_Percent'
    ];

    const rows = list.map(p => {
      const bmi = window.ErasCalculator.calculateBMI(p.height_cm, p.weight_kg) || '';
      const duration = window.ErasCalculator.calculateSurgeryDuration(p.surgery_start_datetime, p.surgery_end_datetime);
      const los = window.ErasCalculator.calculateLOS(p.surgery_start_datetime, p.discharge_datetime);
      const compliance = window.ErasCalculator.calculateCompliance(p);

      return [
        p.id,
        p.patient_hn,
        p.admission_an,
        p.dob,
        p.gender,
        p.height_cm,
        p.weight_kg,
        bmi,
        p.smoking_status,
        p.icd10_diagnosis,
        p.cancer_stage,
        p.neoadjuvant_rx,
        p.asa_physical_status,
        p.nutrition_screen_score,
        p.serum_albumin,
        p.eras_counseling ? 'Yes' : 'No',
        p.fluid_fasting_hours,
        p.carbo_loading_given ? 'Yes' : 'No',
        p.bowel_prep_type,
        p.surgery_start_datetime,
        p.surgery_end_datetime,
        duration ? duration.totalMinutes : '',
        p.surgical_approach,
        p.intraop_fluid_ml,
        p.estimated_blood_loss,
        p.temp_monitoring_used ? 'Yes' : 'No',
        p.first_mobilization_dt || '',
        p.first_oral_intake_dt || '',
        p.foley_removal_dt || '',
        p.pain_score_24h_max,
        p.total_morphine_eq_mg,
        p.discharge_datetime || '',
        los ? los.days : '',
        p.complication_occured ? 'Yes' : 'No',
        p.clavien_dindo_grade || 'None',
        p.readmission_30days ? 'Yes' : 'No',
        compliance.percent + '%'
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NCI_ERAS_Registry_Export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportJSON() {
    const list = this.getAll();
    const jsonStr = JSON.stringify(list, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NCI_ERAS_Backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
