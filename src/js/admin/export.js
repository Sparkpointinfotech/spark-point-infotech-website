import { state } from './state.js';

export function toggleExportMenu() {
  const menu = document.getElementById('export-dropdown');
  menu.classList.toggle('hidden');
}

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('export-dropdown');
  const btn = e.target.closest('button[onclick="toggleExportMenu()"]');
  if (!btn && dropdown && !dropdown.contains(e.target)) {
    dropdown.classList.add('hidden');
  }
});

export function exportData(format, allTabs) {
  document.getElementById('export-dropdown').classList.add('hidden');

  let exportPayload = [];
  let filenamePrefix = '';

  if (allTabs) {
    filenamePrefix = 'spark_point_all_submissions';
    exportPayload = {
      contact_submissions: state.contactData,
      talent_submissions: state.talentData
    };
  } else {
    filenamePrefix = `spark_point_${state.activeTab}_submissions`;
    exportPayload = state.activeTab === 'contact' ? state.contactData : state.talentData;
  }

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.json`);
  } else if (format === 'csv') {
    if (allTabs) {
      const contactCsv = generateCSV(state.contactData);
      const talentCsv = generateCSV(state.talentData);
      downloadBlob(new Blob([contactCsv], { type: 'text/csv' }), `spark_point_contact_enquiries_${new Date().toISOString().split('T')[0]}.csv`);
      setTimeout(() => {
        downloadBlob(new Blob([talentCsv], { type: 'text/csv' }), `spark_point_talent_profiles_${new Date().toISOString().split('T')[0]}.csv`);
      }, 300);
    } else {
      const csvText = generateCSV(exportPayload);
      downloadBlob(new Blob([csvText], { type: 'text/csv' }), `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`);
    }
  }
}

function generateCSV(data) {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] === null || row[header] === undefined ? '' : row[header];
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
