/**
 * game_history.js - Functions for creating game history plots
 * Shows the progression of vote tallies for each tabulator
 */
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

/**
 * Process scatter data to create game history data
 * @param {Array} scatterData - Scatter data with vote_history and urban_voter arrays
 * @returns {Array} - Array with processed game history data points
 */
export function processGameHistoryData(scatterData) {
    // Create game history data from vote_history arrays
    const gameHistoryData = [];
    
    scatterData.forEach(item => {
        // Skip if vote_history is missing
        if (!item.vote_history || !Array.isArray(item.vote_history)) {
            return;
        }
        
        let trumpVotes = 0;
        let totalVotes = 0;
        
        // Calculate running tallies based on vote_history
        // Each 1 in vote_history is a Trump vote, 0 is a Harris vote
        item.vote_history.forEach((vote, index) => {
            // Increment counters
            if (vote === 1) {
                trumpVotes++;
            }
            totalVotes++;
            
            // Calculate urban votes up to this point if urban_voter array exists
            let urbanVoteCount = 0;
            if (item.urban_voter && Array.isArray(item.urban_voter)) {
                // Count urban votes up to current index
                for (let i = 0; i <= index; i++) {
                    if (item.urban_voter[i] === 1) {
                        urbanVoteCount++;
                    }
                }
            }
            
            // Calculate cumulative urban percentage
            const cumulativeUrbanPercentage = item.urban_voter ? 
                (urbanVoteCount / (index + 1)) * 100 : 
                (item.urban_percentage || 0);
            
            // Create a data point for each step
            gameHistoryData.push({
                tabulator: item.tabulator,
                total_votes: totalVotes,
                trump_votes: trumpVotes,
                trump_percentage: (trumpVotes / totalVotes) * 100,
                is_urban: item.is_urban,
                urban_percentage: item.urban_percentage || 0,
                area_type: item.is_urban ? 'Urban' : 'Rural',
                // If urban_voter array exists, include the info for each vote
                is_urban_voter: item.urban_voter && item.urban_voter[index] === 1,
                // Add cumulative urban percentage for coloring the line
                cumulative_urban_percentage: cumulativeUrbanPercentage
            });
        });
    });
    
    return gameHistoryData;
}

// No longer needed as we get all metadata directly from scatter data

/**
 * Create a game history plot
 * @param {string} containerId - ID of the container element
 * @param {Array} scatterData - Scatter plot data with vote_history and urban_voter arrays
 * @param {Object} options - Configuration options
 */
export function createGameHistoryPlot(containerId, scatterData, options = {}) {
    const { colorMode = 'binary', lineCount = '50', selectionMethod = 'longest' } = options;
    
    // Process the data using the vote_history arrays
    const gameHistoryData = processGameHistoryData(scatterData);
    
    // Get a list of unique tabulators
    const uniqueTabulators = [...new Set(gameHistoryData.map(item => item.tabulator))];
    
    // Limit the number of tabulators to display if needed
    let tabulatorsToDisplay = uniqueTabulators;
    if (lineCount !== 'all') {
        // Count votes per tabulator
        const tabulatorVoteCounts = {};
        gameHistoryData.forEach(point => {
            if (!tabulatorVoteCounts[point.tabulator]) {
                tabulatorVoteCounts[point.tabulator] = 0;
            }
            tabulatorVoteCounts[point.tabulator] = Math.max(
                tabulatorVoteCounts[point.tabulator], 
                point.total_votes
            );
        });
        
        // Convert to array for sorting or random selection
        const tabulatorArray = Object.entries(tabulatorVoteCounts).map(([tabulator, voteCount]) => ({
            tabulator,
            voteCount
        }));
        
        if (selectionMethod === 'longest') {
            // Sort by vote count (descending) and take the top N
            tabulatorArray.sort((a, b) => b.voteCount - a.voteCount);
            tabulatorsToDisplay = tabulatorArray
                .slice(0, parseInt(lineCount))
                .map(item => item.tabulator);
        } else if (selectionMethod === 'random') {
            // Shuffle the array using Fisher-Yates algorithm
            for (let i = tabulatorArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [tabulatorArray[i], tabulatorArray[j]] = [tabulatorArray[j], tabulatorArray[i]];
            }
            
            // Take random N tabulators
            tabulatorsToDisplay = tabulatorArray
                .slice(0, parseInt(lineCount))
                .map(item => item.tabulator);
        }
    }
    
    // Filter data to only include selected tabulators
    const filteredData = gameHistoryData.filter(point => 
        tabulatorsToDisplay.includes(point.tabulator)
    );
    
    // Helper function to calculate maximum votes without using spread operator
    // which can cause stack overflow with large datasets
    function calculateMaxVotes(data) {
        let max = 0;
        for (let i = 0; i < data.length; i++) {
            if (data[i].total_votes > max) {
                max = data[i].total_votes;
            }
        }
        return max;
    }
    
    // Configure line color based on color mode
    let colorConfig = {};
    let lineConfig = {};
    
    if (colorMode === 'binary') {
        // Urban/Rural coloring
        lineConfig = {
            stroke: d => d.area_type === 'Urban' ? "#4e79a7" : "#59a14f"
        };
    } else if (colorMode === 'gradient') {
        // Urban percentage gradient coloring - use cumulative percentage
        colorConfig = {
            type: "linear",
            scheme: "Cividis",
            label: "Urban %",
            domain: [0, 100],
            legend: true
        };
        lineConfig = {
            stroke: "cumulative_urban_percentage"
        };
    } else {
        // Rainbow coloring - use tabulator as category
        colorConfig = {
            type: "categorical",
            domain: tabulatorsToDisplay,
            scheme: "Tableau10"
        };
        lineConfig = {
            stroke: "tabulator"
        };
    }
    
    // Create the plot
    const plot = Plot.plot({
        width: 800,
        height: 500,
        marginBottom: 50,
        marginLeft: 60,
        title: `Vote Counting Progression by Tabulator (${filteredData.length} data points, ${tabulatorsToDisplay.length} machines)`,
        color: colorConfig,
        x: {
            label: "Total Votes Counted",
            grid: true,
            // Use hardcoded value for 'all' to avoid stack overflow
            domain: lineCount === 'all' ? [0, 1250] : [0, calculateMaxVotes(filteredData) * 1.05]
        },
        y: {
            label: "Trump %",
            domain: [0, 100],
            grid: true
        },
        marks: [
            // Add a reference line at 50%
            Plot.ruleY([50], {stroke: "#888", strokeWidth: 1, strokeDasharray: "4,4"}),
            
            // Add the game history lines
            Plot.line(filteredData, {
                x: "total_votes",
                y: "trump_percentage",
                z: "tabulator", // Group by tabulator to create one line per tabulator
                ...lineConfig,
                strokeWidth: 1.5,
                strokeOpacity: 0.7
            }),
            
            // Add dots at the end points for each tabulator
            Plot.dot(
                // Get the last point for each tabulator
                Object.values(
                    filteredData.reduce((acc, point) => {
                        acc[point.tabulator] = point;
                        return acc;
                    }, {})
                ),
                {
                    x: "total_votes",
                    y: "trump_percentage",
                    fill: colorMode === 'binary' ? d => d.area_type === 'Urban' ? "#4e79a7" : "#59a14f" : 
                          colorMode === 'gradient' ? "cumulative_urban_percentage" : "tabulator",
                    r: 4,
                    title: d => `Tabulator: ${d.tabulator}\nFinal Total Votes: ${d.total_votes}\nFinal Trump %: ${d.trump_percentage.toFixed(2)}%\nArea: ${d.area_type}\nCumulative Urban %: ${d.cumulative_urban_percentage.toFixed(1)}%`
                }
            )
        ]
    });
    
    // Render the plot
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    container.appendChild(plot);
}
