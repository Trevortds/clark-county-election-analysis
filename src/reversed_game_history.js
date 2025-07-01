/**
 * Reversed Game History Visualization Module
 * 
 * This module provides functions to create a reversed game history plot 
 * showing vote counting in reverse order (final vote to first vote).
 * Only includes tabulators with at least 250 total votes.
 */

import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

/**
 * Process game history data from scatter data with configurable time direction
 * Filters to only include tabulators with at least 250 total votes
 * 
 * @param {Array} scatterData - The scatter plot data containing vote_history arrays
 * @param {Object} options - Configuration options
 * @param {string} options.timeDirection - 'forward' or 'reverse' direction
 * @returns {Array} Processed game history data
 */
export function processGameHistoryData(scatterData, options = {}) {
    const { timeDirection = 'reverse' } = options;
    const gameHistoryData = [];
    
    // Ensure scatterData is an array
    if (!scatterData || !Array.isArray(scatterData)) {
        console.error('Invalid scatter data format:', scatterData);
        return gameHistoryData; // Return empty array
    }
    
    console.log('Processing', scatterData.length, 'data points');
    
    // First pass - identify tabulators with at least 250 votes
    const validTabulators = new Set();
    scatterData.forEach(item => {
        if (item && item.vote_history && item.vote_history.length >= 250) {
            validTabulators.add(item.tabulator);
        }
    });
    
    // Second pass - process only valid tabulators and reverse the vote history
    scatterData.forEach(item => {
        // Skip tabulators with fewer than 250 votes
        if (!validTabulators.has(item.tabulator)) return;
        
        let trumpVotes = 0;
        let totalVotes = 0;
        
        // Count total votes and Trump votes for this tabulator
        if (item.vote_history) {
            item.vote_history.forEach(vote => {
                if (vote === 1) trumpVotes++;
                totalVotes++;
            });
        }
        
        // Create a reversed history by working backwards
        // Start with the final count and subtract votes one by one
        let reverseData = [];
        
        // Start with the final state
        let currentTrumpVotes = trumpVotes;
        let currentTotalVotes = totalVotes;
        
        // Process votes in the specified order
        if (item.vote_history) {
            // Determine the iteration range based on time direction
            const processVotes = (timeDirection === 'reverse') 
                // Reverse: last to first
                ? () => {
                    for (let i = item.vote_history.length - 1; i >= 0; i--) {
                        processVoteAtIndex(i);
                    }
                }
                // Forward: first to last
                : () => {
                    for (let i = 0; i < item.vote_history.length; i++) {
                        processVoteAtIndex(i);
                    }
                };
            
            // Function to process a vote at a specific index
            const processVoteAtIndex = (i) => {
                // Calculate urban votes up to this point based on time direction
                let urbanVoteCount = 0;
                if (item.urban_voter && Array.isArray(item.urban_voter)) {
                    if (timeDirection === 'reverse') {
                        // Count urban votes from the end to the current position (reverse)
                        for (let j = item.urban_voter.length - 1; j >= i; j--) {
                            if (item.urban_voter[j] === 1) {
                                urbanVoteCount++;
                            }
                        }
                    } else {
                        // Count urban votes from the start to the current position (forward)
                        for (let j = 0; j <= i; j++) {
                            if (item.urban_voter[j] === 1) {
                                urbanVoteCount++;
                            }
                        }
                    }
                }
                
                // Calculate cumulative urban percentage based on time direction
                const cumulativeUrbanPercentage = item.urban_voter ? 
                    (timeDirection === 'reverse' ?
                        (urbanVoteCount / (item.urban_voter.length - i)) * 100 :
                        (urbanVoteCount / (i + 1)) * 100) : 
                    (item.urban_percentage || 0);
                
                // Create a data point for each step
                reverseData.push({
                    tabulator: item.tabulator,
                    total_votes: currentTotalVotes,
                    trump_votes: currentTrumpVotes,
                    trump_percentage: (currentTrumpVotes / currentTotalVotes) * 100,
                    is_urban: item.is_urban,
                    urban_percentage: item.urban_percentage || 0,
                    area_type: item.is_urban ? 'Urban' : 'Rural',
                    // If urban_voter array exists, include the info for each vote
                    is_urban_voter: item.urban_voter && item.urban_voter[i] === 1,
                    // Add cumulative urban percentage for coloring the line
                    cumulative_urban_percentage: cumulativeUrbanPercentage,
                    // Track the original position for reference
                    original_position: i
                });
                
                // Remove the current vote for the next iteration
                if (item.vote_history[i] === 1) currentTrumpVotes--;
                currentTotalVotes--;
            };
            
            // Process votes in the appropriate order
            processVotes();
        }
        
        // Add the processed data to our result
        gameHistoryData.push(...reverseData);
    });
    
    return gameHistoryData;
}

/**
 * Create a game history plot showing vote progression in forward or reverse
 * 
 * @param {string} containerId - The HTML container element ID
 * @param {Array} scatterData - The scatter plot data
 * @param {Object} options - Configuration options including timeDirection
 */
export function createReversedGameHistoryPlot(containerId, scatterData, options = {}) {
    const { colorMode = 'binary', lineCount = '50', selectionMethod = 'longest', timeDirection = 'reverse', selectedRandomTabulators = null } = options;
    
    // Process the data using the vote_history arrays in specified direction
    const gameHistoryData = processGameHistoryData(scatterData, { timeDirection });
    
    // Get unique tabulators
    const uniqueTabulators = [...new Set(gameHistoryData.map(point => point.tabulator))];
    
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
            // Use previously selected random tabulators if available (for time direction changes)
            if (selectedRandomTabulators && selectedRandomTabulators.length > 0) {
                console.log('Using preserved random selection');
                tabulatorsToDisplay = selectedRandomTabulators;
            } else {
                // Shuffle the array using Fisher-Yates algorithm
                for (let i = tabulatorArray.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [tabulatorArray[i], tabulatorArray[j]] = [tabulatorArray[j], tabulatorArray[i]];
                }
                
                // Take random N tabulators
                tabulatorsToDisplay = tabulatorArray
                    .slice(0, parseInt(lineCount))
                    .map(item => item.tabulator);
                
                // Save the random selection for future use
                if (window.setSelectedRandomTabulators) {
                    window.setSelectedRandomTabulators(tabulatorsToDisplay);
                }
            }
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
        title: `${timeDirection === 'reverse' ? 'Reversed' : 'Forward'} Vote Counting Progression by Tabulator (${filteredData.length} data points, ${tabulatorsToDisplay.length} machines)`,
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
            // Reference line at 50%
            Plot.ruleY([50], {stroke: "#bbb", strokeDasharray: "4,4"}),
            
            // Line for each tabulator showing its vote counting progression
            Plot.line(
                filteredData,
                {
                    x: "total_votes",
                    y: "trump_percentage",
                    z: "tabulator", // Group by tabulator
                    ...lineConfig,
                    strokeWidth: 1.5,
                    title: d => `Tabulator: ${d.tabulator}\nTotal Votes: ${d.total_votes}\nTrump %: ${d.trump_percentage.toFixed(2)}%\nArea: ${d.area_type}`
                }
            ),
            
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
    
    // Add the plot to the container
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '';
        container.appendChild(plot);
    }
    
    return plot;
}
