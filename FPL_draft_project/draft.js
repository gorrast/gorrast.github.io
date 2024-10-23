// Function to format numbers with space as a thousands separator
function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Function to apply color scale to '1st' column (gold), '2nd' column (silver), '3rd' column (bronze)
function applyColorScale(value, columnIndex) {
  const num = parseInt(value);
  
  // Apply the scale based on the column (3 = 1st, 4 = 2nd, 5 = 3rd)
  if (columnIndex === 3) {  // 1st column (Gold)
    if (num >= 3) return 'gold-scale-high';
    if (num === 2) return 'gold-scale-medium';
    if (num === 1) return 'gold-scale-low';
  }
  if (columnIndex === 4) {  // 2nd column (Silver)
    if (num >= 3) return 'silver-scale-high';
    if (num === 2) return 'silver-scale-medium';
    if (num === 1) return 'silver-scale-low';
  }
  if (columnIndex === 5) {  // 3rd column (Bronze)
    if (num >= 3) return 'bronze-scale-high';
    if (num === 2) return 'bronze-scale-medium';
    if (num === 1) return 'bronze-scale-low';
  }
  
  return '';  // Return no class if no match
}

// Function to load CSV and convert it to table format
function loadCSV(file) {
  fetch(file)
    .then(response => response.text())
    .then(data => {
      const rows = data.split('\n');
      const tableBody = document.querySelector('#data-table tbody');
      tableBody.innerHTML = '';  // Clear existing table rows

      rows.forEach((row, index) => {
        const cols = row.split(',');
        if (cols.length > 1 && index !== 0) {  // Skip header and empty rows
          const tr = document.createElement('tr');
          cols.forEach((col, colIndex) => {
            const td = document.createElement('td');
            let content = col.trim();

            // Format numbers with thousands separator if applicable
            if (!isNaN(content) && content !== '') {
              content = formatNumber(content);
            }

            td.textContent = content;

            // Add data-label for responsive design
            td.setAttribute('data-label', document.querySelectorAll('th')[colIndex].textContent);

            // Apply color scale to '1st', '2nd', and '3rd' columns (index 3, 4, 5)
            if ([3, 4, 5].includes(colIndex)) {
              const colorClass = applyColorScale(content, colIndex);
              if (colorClass) {  // Only add class if it’s not empty
                td.classList.add(colorClass);
              }
            }

            tr.appendChild(td);
          });
          tableBody.appendChild(tr);
        }
      });
    })
    .catch(error => console.error('Error loading CSV:', error));
}

// Load the CSV file dynamically
document.addEventListener('DOMContentLoaded', () => {
  loadCSV('../FPL_draft_project/overall.csv'); 
});