/**
 * game_history.js - Functions for creating game history plots
 * Shows the progression of vote tallies for each tabulator
 */
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

// Cached Data Loader
let cachedGameHistoryData = null;

// Cached Tabulator Processing
let cachedTabulatorVoteCounts = null;
let cachedTabulatorArray = null;

// Cache management functions
export function clearGameHistoryCache() {
    cachedGameHistoryData = null;
    cachedTabulatorVoteCounts = null;
    cachedTabulatorArray = null;
}

function getGameHistoryData(scatterData) {
    if (cachedGameHistoryData) {
        return cachedGameHistoryData;
    }
    cachedGameHistoryData = processGameHistoryData(scatterData);
    return cachedGameHistoryData;
}   

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
    const startTime = performance.now();
    const { colorMode = 'binary', lineCount = '50', selectionMethod = 'longest' } = options;
    
    // Process the data using the vote_history arrays
    const dataProcessingStart = performance.now();
    const gameHistoryData = getGameHistoryData(scatterData);
    const dataProcessingTime = performance.now() - dataProcessingStart;
    
    // Get a list of unique tabulators
    const tabulatorProcessingStart = performance.now();
    const uniqueTabulators = [...new Set(gameHistoryData.map(item => item.tabulator))];
    
    // Limit the number of tabulators to display if needed
    let tabulatorsToDisplay = uniqueTabulators;
    if (lineCount !== 'all') {
        // Use cached tabulator vote counts if available
        let tabulatorVoteCounts, tabulatorArray;
        
        if (cachedTabulatorVoteCounts && cachedTabulatorArray) {
            tabulatorVoteCounts = cachedTabulatorVoteCounts;
            tabulatorArray = cachedTabulatorArray;
        } else {
            // Count votes per tabulator
            const voteCountingStart = performance.now();
            
            tabulatorVoteCounts = {};
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
            tabulatorArray = Object.entries(tabulatorVoteCounts).map(([tabulator, voteCount]) => ({
                tabulator,
                voteCount
            }));
            
            // Cache the results
            cachedTabulatorVoteCounts = tabulatorVoteCounts;
            cachedTabulatorArray = [...tabulatorArray]; // Create a copy for caching
            
            const voteCountingTime = performance.now() - voteCountingStart;
        }
        
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
    
    const tabulatorProcessingTime = performance.now() - tabulatorProcessingStart;
    
    // Filter data to only include selected tabulators
    const filteringStart = performance.now();
    
    // Use Set for O(1) lookup instead of Array.includes() which is O(n)
    const tabulatorSet = new Set(tabulatorsToDisplay);
    
    const filteredData = gameHistoryData.filter(point => 
        tabulatorSet.has(point.tabulator)
    );
    const filteringTime = performance.now() - filteringStart;
    
    // Data sampling optimization for large datasets
    const samplingStart = performance.now();
    
    let sampledData = filteredData;
    const maxPointsPerLine = 80; // Reasonable limit for smooth visualization
    
    // Group data by tabulator for sampling
    const dataByTabulator = {};
    filteredData.forEach(point => {
        if (!dataByTabulator[point.tabulator]) {
            dataByTabulator[point.tabulator] = [];
        }
        dataByTabulator[point.tabulator].push(point);
    });
    
    // Sample each tabulator's data if it's too large
    const sampledDataByTabulator = {};
    let totalOriginalPoints = 0;
    let totalSampledPoints = 0;
    
    Object.keys(dataByTabulator).forEach(tabulator => {
        const tabulatorData = dataByTabulator[tabulator];
        totalOriginalPoints += tabulatorData.length;
        
        if (tabulatorData.length <= maxPointsPerLine) {
            // Keep all data if under limit
            sampledDataByTabulator[tabulator] = tabulatorData;
            totalSampledPoints += tabulatorData.length;
        } else {
            // Sample data using uniform sampling
            const step = Math.floor(tabulatorData.length / maxPointsPerLine);
            const sampled = [];
            
            // Always include first and last points
            sampled.push(tabulatorData[0]);
            
            // Sample intermediate points
            for (let i = step; i < tabulatorData.length - step; i += step) {
                sampled.push(tabulatorData[i]);
            }
            
            // Always include the last point
            if (tabulatorData.length > 1) {
                sampled.push(tabulatorData[tabulatorData.length - 1]);
            }
            
            sampledDataByTabulator[tabulator] = sampled;
            totalSampledPoints += sampled.length;
        }
    });
    
    // Flatten back to single array
    sampledData = Object.values(sampledDataByTabulator).flat();
    
    const samplingTime = performance.now() - samplingStart;
    
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
    
    // Use sampled data for max calculation
    const maxVotes = calculateMaxVotes(sampledData);
    
    // Configure line color based on color mode
    const colorConfigStart = performance.now();
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
    
    const colorConfigTime = performance.now() - colorConfigStart;
    
    // Create the plot with optimizations
    const plotCreationStart = performance.now();
    
    // Get responsive width
    const getResponsiveWidth = () => {
        const container = document.querySelector('.viz-container-light');
        if (container) {
            const containerWidth = container.clientWidth;
            const padding = 96; // Account for container padding
            return Math.min(800, Math.max(320, containerWidth));
        }
        return window.innerWidth < 768 ? Math.min(320, window.innerWidth - 40) : 800;
    };
    
    const plot = Plot.plot({
        width: getResponsiveWidth(),
        height: window.innerWidth < 768 ? 400 : 500,
        marginBottom: 50,
        marginLeft: 60,
        // Use canvas for better performance with large datasets
        style: {
            background: "white"
        },
        title: `Vote Counting Progression by Tabulator ${filteredData.length} points, ${tabulatorsToDisplay.length} machines)`,
        color: colorConfig,
        x: {
            label: "Total Votes Counted",
            grid: true,
            domain: lineCount === 'all' ? [0, 1250] : [0, maxVotes * 1.05]
        },
        y: {
            label: "Trump %",
            domain: [0, 100],
            grid: true
        },
        marks: [
            // Add a reference line at 50%
            Plot.ruleY([50], {stroke: "#888", strokeWidth: 1, strokeDasharray: "4,4"}),
            
            // Add the game history lines using sampled data
            Plot.line(sampledData, {
                x: "total_votes",
                y: "trump_percentage",
                z: "tabulator", // Group by tabulator to create one line per tabulator
                ...lineConfig,
                strokeWidth: 1.5,
                strokeOpacity: 0.8 // Slightly more transparent for better performance
            }),
            
            // Add dots at the end points for each tabulator using sampled data
            Plot.dot(
                // Get the last point for each tabulator from sampled data
                Object.values(
                    sampledData.reduce((acc, point) => {
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
    
    const plotCreationTime = performance.now() - plotCreationStart;
    
    // Render the plot
    const renderingStart = performance.now();
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    container.appendChild(plot);
    const renderingTime = performance.now() - renderingStart;
}
