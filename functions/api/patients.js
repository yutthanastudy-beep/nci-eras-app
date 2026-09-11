/**
 * Cloudflare Pages Function - ERAS Patients API
 * Interacts directly with Cloudflare D1 Database (env.DB)
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Header response for CORS & JSON
  const jsonHeaders = {
    'Content-Type': 'application/json;charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: jsonHeaders });
  }

  // Ensure DB binding is present
  if (!env.DB) {
    return new Response(JSON.stringify({
      error: 'Cloudflare D1 Database binding (env.DB) not found. Please bind D1 Database named "DB" in Cloudflare Pages dashboard.'
    }), { status: 500, headers: jsonHeaders });
  }

  try {
    // GET /api/patients -> List all patients
    if (method === 'GET') {
      const id = url.searchParams.get('id');
      if (id) {
        const patient = await env.DB.prepare('SELECT * FROM patients WHERE id = ?').bind(id).first();
        if (!patient) {
          return new Response(JSON.stringify({ error: 'Patient not found' }), { status: 404, headers: jsonHeaders });
        }
        return new Response(JSON.stringify(formatPatientFromDB(patient)), { headers: jsonHeaders });
      }

      const { results } = await env.DB.prepare('SELECT * FROM patients ORDER BY created_at DESC').all();
      const formatted = results.map(formatPatientFromDB);
      return new Response(JSON.stringify(formatted), { headers: jsonHeaders });
    }

    // POST /api/patients -> Create or Update patient
    if (method === 'POST') {
      const data = await request.json();
      if (!data.patient_hn || !data.admission_an) {
        return new Response(JSON.stringify({ error: 'HN and AN are required' }), { status: 400, headers: jsonHeaders });
      }

      const id = data.id || 'p-' + Date.now();
      const now = new Date().toISOString();

      await env.DB.prepare(`
        INSERT INTO patients (
          id, patient_hn, admission_an, dob, gender, height_cm, weight_kg, smoking_status,
          icd10_diagnosis, cancer_stage, neoadjuvant_rx, asa_physical_status, nutrition_screen_score, serum_albumin,
          eras_counseling, fluid_fasting_hours, carbo_loading_given, bowel_prep_type,
          surgery_start_datetime, surgery_end_datetime, surgical_approach, intraop_fluid_ml, estimated_blood_loss, temp_monitoring_used,
          first_mobilization_dt, first_oral_intake_dt, foley_removal_dt, pain_score_24h_max, total_morphine_eq_mg,
          discharge_datetime, complication_occured, clavien_dindo_grade, readmission_30days, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?
        )
        ON CONFLICT(id) DO UPDATE SET
          patient_hn = excluded.patient_hn,
          admission_an = excluded.admission_an,
          dob = excluded.dob,
          gender = excluded.gender,
          height_cm = excluded.height_cm,
          weight_kg = excluded.weight_kg,
          smoking_status = excluded.smoking_status,
          icd10_diagnosis = excluded.icd10_diagnosis,
          cancer_stage = excluded.cancer_stage,
          neoadjuvant_rx = excluded.neoadjuvant_rx,
          asa_physical_status = excluded.asa_physical_status,
          nutrition_screen_score = excluded.nutrition_screen_score,
          serum_albumin = excluded.serum_albumin,
          eras_counseling = excluded.eras_counseling,
          fluid_fasting_hours = excluded.fluid_fasting_hours,
          carbo_loading_given = excluded.carbo_loading_given,
          bowel_prep_type = excluded.bowel_prep_type,
          surgery_start_datetime = excluded.surgery_start_datetime,
          surgery_end_datetime = excluded.surgery_end_datetime,
          surgical_approach = excluded.surgical_approach,
          intraop_fluid_ml = excluded.intraop_fluid_ml,
          estimated_blood_loss = excluded.estimated_blood_loss,
          temp_monitoring_used = excluded.temp_monitoring_used,
          first_mobilization_dt = excluded.first_mobilization_dt,
          first_oral_intake_dt = excluded.first_oral_intake_dt,
          foley_removal_dt = excluded.foley_removal_dt,
          pain_score_24h_max = excluded.pain_score_24h_max,
          total_morphine_eq_mg = excluded.total_morphine_eq_mg,
          discharge_datetime = excluded.discharge_datetime,
          complication_occured = excluded.complication_occured,
          clavien_dindo_grade = excluded.clavien_dindo_grade,
          readmission_30days = excluded.readmission_30days,
          updated_at = excluded.updated_at
      `).bind(
        id, data.patient_hn, data.admission_an, data.dob, data.gender, data.height_cm, data.weight_kg, data.smoking_status,
        data.icd10_diagnosis, data.cancer_stage, data.neoadjuvant_rx, data.asa_physical_status, data.nutrition_screen_score, data.serum_albumin,
        data.eras_counseling ? 1 : 0, data.fluid_fasting_hours, data.carbo_loading_given ? 1 : 0, data.bowel_prep_type,
        data.surgery_start_datetime, data.surgery_end_datetime, data.surgical_approach, data.intraop_fluid_ml, data.estimated_blood_loss, data.temp_monitoring_used ? 1 : 0,
        data.first_mobilization_dt || null, data.first_oral_intake_dt || null, data.foley_removal_dt || null, data.pain_score_24h_max, data.total_morphine_eq_mg,
        data.discharge_datetime || null, data.complication_occured ? 1 : 0, data.clavien_dindo_grade, data.readmission_30days ? 1 : 0,
        data.created_at || now, now
      ).run();

      return new Response(JSON.stringify({ success: true, id }), { headers: jsonHeaders });
    }

    // DELETE /api/patients -> Delete patient by id
    if (method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ error: 'ID parameter required' }), { status: 400, headers: jsonHeaders });
      }

      await env.DB.prepare('DELETE FROM patients WHERE id = ?').bind(id).run();
      return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: jsonHeaders });
  }
}

/**
 * Format database record into boolean JavaScript object
 */
function formatPatientFromDB(row) {
  return {
    ...row,
    eras_counseling: row.eras_counseling === 1 || row.eras_counseling === true,
    carbo_loading_given: row.carbo_loading_given === 1 || row.carbo_loading_given === true,
    temp_monitoring_used: row.temp_monitoring_used === 1 || row.temp_monitoring_used === true,
    complication_occured: row.complication_occured === 1 || row.complication_occured === true,
    readmission_30days: row.readmission_30days === 1 || row.readmission_30days === true
  };
}
