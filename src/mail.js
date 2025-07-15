// Election Visualization using Observable Plot

// Import Observable Plot as an ES module
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

// Initialize visualization as soon as the module is loaded
initializeVisualization();

/**
 * Processes vote data to create candidate summaries
 * @param {Array} voteData - Raw vote data from JSON
 * @returns {Array} - Summary data for visualization
 */
function processVoteData(voteData) {
    // Create a map to count votes for each candidate
    const candidateVotes = {};
    
    // Process each vote record
    voteData.forEach(record => {
        // Check votes for Harris and Trump
        if (record['Harris, Kamala D. (DEM)'] === 1) {
            candidateVotes['Harris, Kamala D. (DEM)'] = (candidateVotes['Harris, Kamala D. (DEM)'] || 0) + 1;
        }
        
        if (record['Trump, Donald J. (REP)'] === 1) {
            candidateVotes['Trump, Donald J. (REP)'] = (candidateVotes['Trump, Donald J. (REP)'] || 0) + 1;
        }
    });
    
    // Convert to array format for Plot
    return Object.entries(candidateVotes).map(([candidate, votes]) => {
        // Extract party from candidate string
        const party = candidate.includes('(DEM)') ? 'Democratic' : 
                     candidate.includes('(REP)') ? 'Republican' : 'Other';
        
        // Extract just the name without party
        const name = candidate.split(' (')[0];
        
        return {
            candidate: name,
            party: party,
            votes: votes
        };
    });
}

/**
 * Creates a bar chart visualization of vote counts by candidate
 * @param {Array} data - Processed candidate vote data
 */
function createVoteCountVisualization(data) {
    const vizContainer = document.getElementById('visualization');
    
    // Clear previous content
    vizContainer.innerHTML = '';
    
    // Create title element
    const titleElement = document.createElement('h2');
    titleElement.textContent = 'Mail Votes by Candidate';
    vizContainer.appendChild(titleElement);
    
    // Create a new div for the plot
    const plotContainer = document.createElement('div');
    plotContainer.className = 'plot-container';
    vizContainer.appendChild(plotContainer);
    
    // Get responsive width
    const getResponsiveWidth = () => {
        const container = document.querySelector('.viz-container-light');
        if (container) {
            const containerWidth = container.clientWidth;
            return Math.min(800, Math.max(320, containerWidth));
        }
        return window.innerWidth < 768 ? Math.min(320, window.innerWidth - 40) : 800;
    };
    
    // Create the bar chart using Observable Plot
    const chart = Plot.plot({
        width: getResponsiveWidth(),
        height: window.innerWidth < 768 ? 300 : 400,
        marginLeft: 60,
        marginBottom: 40,
        x: {
            label: 'Votes'
        },
        y: {
            label: 'Candidate',
            domain: data.map(d => d.candidate)
        },
        color: {
            domain: ['Democratic', 'Republican', 'Other'],
            range: ['#2676E6', '#EC332A', '#808080']
        },
        marks: [
            Plot.rectX(data, {
                x: 'votes',
                y: 'candidate',
                fill: 'party',
                sort: {y: '-x'}
            }),
            Plot.ruleX([0]),
            Plot.textX(data, {
                x: 'votes',
                y: 'candidate',
                text: d => d.votes.toLocaleString(),
                dx: 5,
                fill: 'currentColor',
                fontWeight: 'bold'
            })
        ]
    });
    
    // Add the chart to the container
    plotContainer.appendChild(chart);
    
    // Add description
    const descElement = document.createElement('p');
    descElement.className = 'visualization-description';
    descElement.textContent = 'This chart shows the distribution of mail-in votes between the major presidential candidates.';
    vizContainer.appendChild(descElement);
}

/**
 * Initialize the visualization by loading data and creating visualizations
 */
async function initializeVisualization() {
    try {
        // Load mail votes data
        const response = await fetch('data/processed_data/mail_votes.json');
        if (!response.ok) {
            throw new Error(`Failed to load data: ${response.status}`);
        }
        
        const mailVotes = await response.json();
        console.log('Loaded mail votes data:', mailVotes.length, 'records');
        
        // Process the data for visualization
        const processedData = processVoteData(mailVotes);
        
        // Create visualization
        createVoteCountVisualization(processedData);
        
        console.log('Visualization created successfully');
    } catch (error) {
        console.error('Error loading or processing data:', error);
        
        // Show error message to user
        const vizContainer = document.getElementById('visualization');
        vizContainer.innerHTML = `
            <div class="error-message">
                <h3>Error Loading Data</h3>
                <p>${error.message}</p>
                <p>Make sure you have processed the election data and the JSON files are in the correct location.</p>
            </div>
        `;
    }
}
