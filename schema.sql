-- Cloudflare D1 Database Schema for ERAS Clinical Data Collection
-- National Cancer Institute (สถาบันมะเร็งแห่งชาติ)

CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    patient_hn TEXT NOT NULL,
    admission_an TEXT NOT NULL,
    dob TEXT NOT NULL,
    gender TEXT NOT NULL,
    height_cm REAL NOT NULL,
    weight_kg REAL NOT NULL,
    smoking_status TEXT NOT NULL,
    
    icd10_diagnosis TEXT NOT NULL,
    cancer_stage TEXT NOT NULL,
    neoadjuvant_rx TEXT NOT NULL,
    asa_physical_status INTEGER NOT NULL,
    nutrition_screen_score INTEGER NOT NULL,
    serum_albumin REAL NOT NULL,
    
    eras_counseling INTEGER NOT NULL, -- 1 for True, 0 for False
    fluid_fasting_hours REAL NOT NULL,
    carbo_loading_given INTEGER NOT NULL,
    bowel_prep_type TEXT NOT NULL,
    
    surgery_start_datetime TEXT NOT NULL,
    surgery_end_datetime TEXT NOT NULL,
    surgical_approach TEXT NOT NULL,
    intraop_fluid_ml INTEGER NOT NULL,
    estimated_blood_loss INTEGER NOT NULL,
    temp_monitoring_used INTEGER NOT NULL,
    
    first_mobilization_dt TEXT,
    first_oral_intake_dt TEXT,
    foley_removal_dt TEXT,
    pain_score_24h_max INTEGER NOT NULL,
    total_morphine_eq_mg REAL NOT NULL,
    
    discharge_datetime TEXT,
    complication_occured INTEGER NOT NULL,
    clavien_dindo_grade TEXT NOT NULL,
    readmission_30days INTEGER NOT NULL,
    
    created_at TEXT NOT NULL,
    updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_patients_hn ON patients(patient_hn);
CREATE INDEX IF NOT EXISTS idx_patients_an ON patients(admission_an);
CREATE INDEX IF NOT EXISTS idx_patients_created ON patients(created_at);
