/**
 * ERAS Calculator & Clinical Logic Module
 * National Cancer Institute (สถาบันมะเร็งแห่งชาติ)
 */

window.ErasCalculator = {
  /**
   * Calculate age in years based on DOB and Surgery Date
   * @param {string} dobStr - YYYY-MM-DD
   * @param {string} surgeryDateStr - YYYY-MM-DD or ISO string
   * @returns {number|null}
   */
  calculateAge(dobStr, surgeryDateStr) {
    if (!dobStr) return null;
    const dob = new Date(dobStr);
    const refDate = surgeryDateStr ? new Date(surgeryDateStr) : new Date();
    if (isNaN(dob.getTime()) || isNaN(refDate.getTime())) return null;

    let age = refDate.getFullYear() - dob.getFullYear();
    const m = refDate.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && refDate.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  },

  /**
   * Calculate Body Mass Index (BMI)
   * BMI = weight_kg / (height_cm / 100)^2
   */
  calculateBMI(heightCm, weightKg) {
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    if (!h || !w || h <= 0 || w <= 0) return null;
    const hMeter = h / 100;
    const bmi = w / (hMeter * hMeter);
    return Math.round(bmi * 100) / 100;
  },

  /**
   * Evaluate NRS-2002 Nutrition Screening Score
   * Score >= 3 indicates high nutritional risk
   */
  evaluateNutritionRisk(score) {
    const s = parseInt(score, 10);
    if (isNaN(s)) return { isHighRisk: false, label: 'ยังไม่ประเมิน', badgeClass: 'alert-badge-info' };
    if (s >= 3) {
      return { isHighRisk: true, label: 'ความเสี่ยงสูง (High Risk ≥ 3)', badgeClass: 'alert-badge-danger' };
    }
    return { isHighRisk: false, label: 'ความเสี่ยงต่ำ (Low Risk < 3)', badgeClass: 'alert-badge-success' };
  },

  /**
   * Evaluate Fluid Fasting Hours (Target: 2-3 hours)
   */
  evaluateFluidFasting(hours) {
    const h = parseFloat(hours);
    if (isNaN(h)) return { isCompliant: false, label: 'ยังไม่ระบุ', badgeClass: 'alert-badge-info' };
    if (h >= 2.0 && h <= 3.0) {
      return { isCompliant: true, label: `ตรงตามเกณฑ์ ERAS (${h} ชม.)`, badgeClass: 'alert-badge-success' };
    } else if (h > 3.0) {
      return { isCompliant: false, label: `งดนานเกินเป้าหมาย (${h} ชม. > 3 ชม.)`, badgeClass: 'alert-badge-warning' };
    } else {
      return { isCompliant: false, label: `งดน้อยกว่าเกณฑ์ (${h} ชม. < 2 ชม.)`, badgeClass: 'alert-badge-danger' };
    }
  },

  /**
   * Calculate Surgery Duration in minutes & formatted string
   */
  calculateSurgeryDuration(startStr, endStr) {
    if (!startStr || !endStr) return null;
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null;

    const diffMs = end - start;
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return {
      totalMinutes,
      formatted: `${hours} ชม. ${mins} นาที`
    };
  },

  /**
   * Calculate Length of Stay (LOS) from Surgery Start or Admit date to Discharge date
   */
  calculateLOS(startStr, dischargeStr) {
    if (!startStr || !dischargeStr) return null;
    const start = new Date(startStr);
    const dc = new Date(dischargeStr);
    if (isNaN(start.getTime()) || isNaN(dc.getTime()) || dc < start) return null;

    const diffMs = dc - start;
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;

    return {
      days,
      hours: remainingHours,
      totalHours,
      formatted: `${days} วัน ${remainingHours} ชม.`
    };
  },

  /**
   * Calculate ERAS Compliance Score (%) for a patient record
   * Checks key ERAS core protocol items
   */
  calculateCompliance(patient) {
    let totalItems = 0;
    let metItems = 0;

    // 1. ERAS Counseling
    totalItems++;
    if (patient.eras_counseling === true || patient.eras_counseling === 'true' || patient.eras_counseling === 1) metItems++;

    // 2. Fluid Fasting 2-3 hours
    totalItems++;
    const fasting = parseFloat(patient.fluid_fasting_hours);
    if (!isNaN(fasting) && fasting >= 2.0 && fasting <= 3.0) metItems++;

    // 3. Carbohydrate Loading Given
    totalItems++;
    if (patient.carbo_loading_given === true || patient.carbo_loading_given === 'true' || patient.carbo_loading_given === 1) metItems++;

    // 4. Bowel Prep (Avoid full MBP if possible)
    totalItems++;
    if (patient.bowel_prep_type === 'None' || patient.bowel_prep_type === 'Clear_Liquid') metItems++;

    // 5. Intraoperative Temperature Monitoring & Maintenance >= 36.0 C
    totalItems++;
    if (patient.temp_monitoring_used === true || patient.temp_monitoring_used === 'true' || patient.temp_monitoring_used === 1) metItems++;

    // 6. Early Mobilization recorded
    totalItems++;
    if (patient.first_mobilization_dt) metItems++;

    // 7. Early Oral Intake recorded
    totalItems++;
    if (patient.first_oral_intake_dt) metItems++;

    // 8. Foley Removal recorded
    totalItems++;
    if (patient.foley_removal_dt) metItems++;

    const percent = Math.round((metItems / totalItems) * 100);
    return {
      metItems,
      totalItems,
      percent
    };
  }
};
