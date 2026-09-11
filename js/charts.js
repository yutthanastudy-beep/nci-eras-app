/**
 * ERAS Clinical Analytics Charts Module
 * National Cancer Institute
 */

window.ErasCharts = {
  charts: {},

  renderDashboardCharts(patients) {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js is not loaded yet.');
      return;
    }

    this.renderComplianceChart(patients);
    this.renderApproachChart(patients);
    this.renderComplicationChart(patients);
  },

  renderComplianceChart(patients) {
    const ctx = document.getElementById('complianceChart');
    if (!ctx) return;

    if (this.charts.compliance) {
      this.charts.compliance.destroy();
    }

    if (patients.length === 0) return;

    // Protocol categories
    const categories = [
      'ERAS Counseling',
      'Fluid Fasting (2-3h)',
      'Carbo Loading',
      'Non-MBP Bowel Prep',
      'Core Temp ≥36°C',
      'Early Mobilization',
      'Early Oral Intake',
      'Early Foley Removal'
    ];

    let counts = [0, 0, 0, 0, 0, 0, 0, 0];

    patients.forEach(p => {
      if (p.eras_counseling) counts[0]++;
      const f = parseFloat(p.fluid_fasting_hours);
      if (f >= 2.0 && f <= 3.0) counts[1]++;
      if (p.carbo_loading_given) counts[2]++;
      if (p.bowel_prep_type === 'None' || p.bowel_prep_type === 'Clear_Liquid') counts[3]++;
      if (p.temp_monitoring_used) counts[4]++;
      if (p.first_mobilization_dt) counts[5]++;
      if (p.first_oral_intake_dt) counts[6]++;
      if (p.foley_removal_dt) counts[7]++;
    });

    const percentages = counts.map(c => Math.round((c / patients.length) * 100));

    this.charts.compliance = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: categories,
        datasets: [{
          label: 'อัตราการปฏิบัติตาม (%)',
          data: percentages,
          backgroundColor: 'rgba(0, 102, 204, 0.2)',
          borderColor: '#0066cc',
          borderWidth: 2,
          pointBackgroundColor: '#0066cc',
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: 'rgba(0, 0, 0, 0.08)' },
            grid: { color: 'rgba(0, 0, 0, 0.08)' },
            suggestedMin: 0,
            suggestedMax: 100,
            ticks: {
              stepSize: 20,
              callback: val => val + '%'
            }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  },

  renderApproachChart(patients) {
    const ctx = document.getElementById('approachChart');
    if (!ctx) return;

    if (this.charts.approach) {
      this.charts.approach.destroy();
    }

    const counts = {
      Laparoscopic: 0,
      Robotic: 0,
      Open: 0,
      Converted: 0
    };

    patients.forEach(p => {
      const app = p.surgical_approach || 'Open';
      if (counts[app] !== undefined) counts[app]++;
      else counts.Open++;
    });

    this.charts.approach = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Laparoscopic (ส่องกล้อง)', 'Robotic (หุ่นยนต์)', 'Open (ผ่าเปิด)', 'Converted (เปลี่ยนเปิด)'],
        datasets: [{
          data: [counts.Laparoscopic, counts.Robotic, counts.Open, counts.Converted],
          backgroundColor: ['#34c759', '#5856d6', '#ff9500', '#ff3b30'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  },

  renderComplicationChart(patients) {
    const ctx = document.getElementById('complicationChart');
    if (!ctx) return;

    if (this.charts.complication) {
      this.charts.complication.destroy();
    }

    const grades = {
      'None': 0,
      'Grade_I': 0,
      'Grade_II': 0,
      'Grade_IIIa': 0,
      'Grade_IIIb': 0,
      'Grade_IV': 0,
      'Grade_V': 0
    };

    patients.forEach(p => {
      const g = p.clavien_dindo_grade || 'None';
      if (grades[g] !== undefined) grades[g]++;
      else grades['None']++;
    });

    this.charts.complication = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['ไม่มีภาวะแทรกซ้อน', 'Grade I', 'Grade II', 'Grade IIIa', 'Grade IIIb', 'Grade IV', 'Grade V'],
        datasets: [{
          label: 'จำนวนผู้ป่วย (ราย)',
          data: Object.values(grades),
          backgroundColor: ['#34c759', '#ffcc00', '#ff9500', '#ff5e3a', '#ff3b30', '#af52de', '#000000'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
};
