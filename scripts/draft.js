
// Value for what season should be viewed. Defaulted to the most recent one
let currentSeason = "24/25";
let rankChart;
let totalChart;
let forChart;
let againstChart;


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

// Function to load CSV and convert it to table format (for OVERALL TABLE)
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

// Define a color palette for each team
const teamColors = {
  // Hugo
  "Gorast FC": "rgb(180, 99, 132)",
  "Gorast Gunners": "rgb(180, 99, 132)",   
  // Markus
  "Glizzy Darwizzy": "rgb(54, 162, 235)",
  // Benjamin
  "Draftjamin 2.0": "rgb(255, 206, 86)",
  // Johan
  "Laplace FC": "rgb(75, 192, 192)",
  "gg": "rgb(75, 192, 192)",
  // Anton
  "Royal Antonwerp FC": "rgb(153, 102, 255)",
  // Hampus
  "Galna hästen sthlm": "rgb(255, 159, 64)",
  // Erik
  "Kasko Fantastico": "rgb(0, 204, 102)", // Medium Green
  // Jakob
  "Miami Boys Choir": "rgb(255, 128, 0)", // Bright Orange
  // Samuel
  "Smul FC": "rgb(102, 0, 204)", // Dark Purple
  // Nima
  "Draken United": "rgb(0, 102, 204)", // Deep Blue
  // August
  "Boca Blue Bay": "rgb(201, 203, 207)", // Light gray

};


// Set up chart-specific options for each graph
// Rank
const rankOptions = getChartOptions({
  yAxisInverted: true,
  yMin: 1,
  yMax: 10,
  yAxisTitle: 'Rank',
  xAxisTitle: 'Gameweek',
  chartTitle: 'Rank by Gameweek'
});

// Total Points
const totalOptions = getChartOptions({
  yAxisInverted: false,
  yMin: 0,
  yAxisTitle: 'Total Points',
  xAxisTitle: 'Gameweek',
  chartTitle: 'Total Points by Gameweek'
});
// Points for
const forOptions = getChartOptions({
  yAxisInverted: false,
  yMin: 0,
  yAxisTitle: 'Points For',
  xAxisTitle: 'Gameweek',
  chartTitle: 'Points For by Gameweek'
});

// Points against
const againstOptions = getChartOptions({
  yAxisInverted: false,
  yMin: 0,
  yAxisTitle: 'Points Against',
  xAxisTitle: 'Gameweek',
  chartTitle: 'Points Against by Gameweek'
});

function getChartOptions({ yAxisInverted = false, yMin = 0, yMax = null, yAxisTitle = '', xAxisTitle = '', chartTitle = '' }) {
  const yAxisOptions = {
      reverse: yAxisInverted,
      min: yMin,
      ticks: {
          stepSize: 1
      },
      title: {
          display: true,
          text: yAxisTitle
      },
      responsive: true,
      maintainAspectRatio: false

  };

  // Only set max if yMax is provided (not null)
  if (yMax !== null) {
      yAxisOptions.max = yMax;
  }

  return {
      scales: {
          y: yAxisOptions,
          x: {
              title: {
                  display: true,
                  text: xAxisTitle
              }
          }
      },
      plugins: {
          title: {
              display: true,
              text: chartTitle
          },
          legend: {
              display: true,
              position: 'bottom'
          }
      }
  };
}


async function genSeasonChart(filePath, type){
  /* 
  param: filePath - path to the file containing the data
  param: type - what data should the chart contain
   */

  // Load data from the JSON file
  const response = await fetch(filePath);
  const data = await response.json();

  // Check if the specified season exists in the data
  if (!data[currentSeason]) {
    console.error('Season not found in data ', currentSeason);
    return;
  }
  const seasonData = data[currentSeason];

  // Generate x-axis labels (e.g., "GW1", "GW2", ..., "GW39")
  const maxGameWeeks = 38;  
  const xLabels = Array.from({length: maxGameWeeks + 1}, (_, i) => `GW${i}`);

  // Prepare y-values for each team
  const datasets = [];
  for (const [team, values] of Object.entries(seasonData)){
    const yValues = values.map(gw => parseInt(gw[type], 10));

    // get the color for graph
    const color = teamColors[team] || "rgb(0,0,0)"; // Fallback to black if no color is found

    // Add team data to datasets
    datasets.push({
      label: team, 
      data: yValues,
      borderColor: color,
      fill: false
    });
  }

  // Set dimensions for a 2x2 grid layout
  const chartWidth = Math.min(window.innerWidth / 2 - 40, 600); // Limit max width
  const chartHeight = Math.min(window.innerHeight / 2 - 40, 400); // Limit max height

  if (type == 'rank'){
    
    const ctx = document.getElementById('rank-dev').getContext('2d');

    ctx.width = chartWidth;
    ctx.height = chartHeight;
    if (rankChart) {
      rankChart.destroy();
    }
    rankChart = new Chart(ctx, {
      type: 'line', 
      data: {
        labels: xLabels,
        datasets: datasets
      },
      options: rankOptions
    });

  }else if (type== 'total'){
    
    const ctx = document.getElementById('total-points-dev').getContext('2d');

    ctx.width = chartWidth;
    ctx.height = chartHeight;
    if (totalChart){
      totalChart.destroy();
    }
    totalChart = new Chart(ctx, {
      type: 'line', 
      data: {
        labels: xLabels,
        datasets: datasets
      },
      options: totalOptions
    });

  }else if (type == 'points_for'){
    const ctx = document.getElementById('points-for-dev').getContext('2d');

    ctx.width = chartWidth;
    ctx.height = chartHeight;
    if (forChart) {
      forChart.destroy();
    }
    forChart = new Chart(ctx, {
      type: 'line', 
      data: {
        labels: xLabels,
        datasets: datasets
      },
      options: forOptions
    });

  }else if (type == 'points_against'){
    
    const ctx = document.getElementById('points-against-dev').getContext('2d');

    ctx.width = chartWidth;
    ctx.height = chartHeight;
    if (againstChart) {
      againstChart.destroy();
    }
    againstChart = new Chart(ctx, {
      type: 'line', 
      data: {
        labels: xLabels,
        datasets: datasets
      },
      options: againstOptions
    });
  }

}

async function genSeasonTable(filePath) {

  // Load data from the JSON file
  const response = await fetch(filePath);
  const data = await response.json();

  // Check if the specified season exists in the data
  if (!data[currentSeason]) {
    console.error('Season not found in data ', currentSeason);
    return;
  }
  const seasonData = data[currentSeason];

  const tableBody = document.querySelector("#seasonTable tbody"); // Target tbody for inserting rows
  tableBody.innerHTML = ""; // Clear any existing rows

  // Find latest gameweek
  const latestGameweek = findLatestGameweek(seasonData);

  // If no populated gameweek is found, exit early
  if (latestGameweek === -1) return;

  const teamsData = [];

  // Populate the table
  for (const [team, values] of Object.entries(seasonData)) {
    const latestGameweekData = values[latestGameweek];

    // Prepare data with a default value for rank if it's missing
    teamsData.push({
      team: team,
      rank: latestGameweekData.rank !== undefined ? latestGameweekData.rank : Infinity, // Use a high value if rank is missing
      wins: latestGameweekData.wins !== undefined ? latestGameweekData.wins : "-",
      draws: latestGameweekData.draws !== undefined ? latestGameweekData.draws : "-",
      losses: latestGameweekData.losses !== undefined ? latestGameweekData.losses : "-",
      points_for: latestGameweekData.points_for !== undefined ? latestGameweekData.points_for : "-",
      total: latestGameweekData.total !== undefined ? latestGameweekData.total : "-"
    });
  }

  // Sort teamsData by rank in ascending order
  teamsData.sort((a, b) => a.rank - b.rank);
  // Populate the table with sorted data
  for (const teamData of teamsData) {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${teamData.rank !== Infinity ? teamData.rank : "-"}</td>
        <td>${teamData.team}</td>
        <td>${teamData.wins}</td>
        <td>${teamData.draws}</td>
        <td>${teamData.losses}</td>
        <td>${teamData.points_for}</td>
        <td>${teamData.total}</td>
    `;
    tableBody.appendChild(row);
  }
}

function findLatestGameweek(data) {
  const sampleTeam = Object.values(data)[0]; // Take any teams data as reference
  for (let i = sampleTeam.length -1; i >= 0; i--) {
    if (Object.keys(sampleTeam[i]).length !== 0) {
      return i; // Return the index of the latest populated gameweek
    }
  }
  return -1; // Return -1 if no populated gameweeks are found
}

// Helper function to get a random color for each line
function getRandomColor() {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgb(${r}, ${g}, ${b})`;
}

// Load the CSV file dynamically
document.addEventListener('DOMContentLoaded', () => {
  // Generate overall table
  loadCSV('../FPL_draft_project/overall.csv'); 

  // Generate season table
  genSeasonTable('../FPL_draft_project/draft_data.json');

  // Generate season data charts
  genSeasonChart('../FPL_draft_project/draft_data.json', 'rank');
  genSeasonChart('../FPL_draft_project/draft_data.json', 'total');
  genSeasonChart('../FPL_draft_project/draft_data.json', 'points_for');
  genSeasonChart('../FPL_draft_project/draft_data.json', 'points_against');


  //visualizeRank('../FPL_draft_project/draft_data.json');
});

document.querySelectorAll('.season-button').forEach(button => {
  
  button.addEventListener('click', function() {
    
    //update currentSeason based on the button's data-season attribute
    currentSeason = button.getAttribute('data-season');
    

    // Generate new table
    genSeasonTable('../FPL_draft_project/draft_data.json');

    // Remove the old charts
    if (rankChart) rankChart.destroy();
    if (totalChart) totalChart.destroy();
    if (forChart) forChart.destroy();
    if (againstChart) againstChart.destroy();

    // Generate new charts
    genSeasonChart('../FPL_draft_project/draft_data.json', 'rank');
    genSeasonChart('../FPL_draft_project/draft_data.json', 'total');
    genSeasonChart('../FPL_draft_project/draft_data.json', 'points_for');
    genSeasonChart('../FPL_draft_project/draft_data.json', 'points_against');

    document.querySelectorAll('.season-button').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
  });
});

// Add actionlistener to resize chart automatically when window is resized
/* window.addEventListener('resize', () => {
  // Remove the old charts
  if (rankChart) rankChart.destroy();
  if (totalChart) totalChart.destroy();
  if (forChart) forChart.destroy();
  if (againstChart) againstChart.destroy();

  // Generate new charts
  genSeasonChart('../FPL_draft_project/draft_data.json', 'rank');
  genSeasonChart('../FPL_draft_project/draft_data.json', 'total');
  genSeasonChart('../FPL_draft_project/draft_data.json', 'points_for');
  genSeasonChart('../FPL_draft_project/draft_data.json', 'points_against');
}) */