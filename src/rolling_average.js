/**
 * rolling_average.js - Functions for creating rolling average plots
 * Shows the rolling average of vote tallies for each tabulator
 */
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

// Cached Tabulator Processing for Rolling Average
let cachedRollingAverageTabulatorVoteCounts = null;
let cachedRollingAverageTabulatorArray = null;

// Cache management functions
export function clearRollingAverageCache() {
    cachedRollingAverageTabulatorVoteCounts = null;
    cachedRollingAverageTabulatorArray = null;
}

/**
 * Process scatter data to create rolling average data
 * @param {Array} scatterData - Scatter data with vote_history arrays
 * @param {number} windowSize - Rolling window size for the average calculation
 * @returns {Array} - Array with processed rolling average data points
 */
export function processRollingAverageData(scatterData, windowSize) {
    const startTime = performance.now();
    
    // Create rolling average data from vote_history arrays
    const rollingAverageData = [];
    
    const processingStart = performance.now();
    
    let processedItems = 0;
    let skippedItems = 0;
    let totalVotePoints = 0;
    
    scatterData.forEach(item => {
        // Skip if vote_history is missing
        if (!item.vote_history || !Array.isArray(item.vote_history)) {
            skippedItems++;
            return;
        }
        
        // Skip if the vote history is shorter than the window size
        if (item.vote_history.length < windowSize) {
            skippedItems++;
            return;
        }
        
        processedItems++;
        totalVotePoints += item.vote_history.length - windowSize + 1;
        
        // Sliding window optimization: Calculate initial window sum
        let trumpVotesInWindow = 0;
        for (let j = 0; j < windowSize; j++) {
            if (item.vote_history[j] === 1) {
                trumpVotesInWindow++;
            }
        }
        
        // Initialize urban vote count for cumulative calculation
        let urbanVoteCount = 0;
        if (item.urban_voter && Array.isArray(item.urban_voter)) {
            for (let j = 0; j < windowSize; j++) {
                if (item.urban_voter[j] === 1) {
                    urbanVoteCount++;
                }
            }
        }
        
        // Process vote history using sliding window
        for (let i = windowSize - 1; i < item.vote_history.length; i++) {
            // For positions after the first window, update the sliding window
            if (i >= windowSize) {
                // Remove the vote that's sliding out of the window
                const exitingVoteIndex = i - windowSize;
                if (item.vote_history[exitingVoteIndex] === 1) {
                    trumpVotesInWindow--;
                }
                
                // Add the new vote that's entering the window
                if (item.vote_history[i] === 1) {
                    trumpVotesInWindow++;
                }
                
                // Update urban vote count for cumulative calculation
                if (item.urban_voter && Array.isArray(item.urban_voter)) {
                    if (item.urban_voter[i] === 1) {
                        urbanVoteCount++;
                    }
                }
            } else {
                // For the first window position, add the current vote to urban count
                if (item.urban_voter && Array.isArray(item.urban_voter) && item.urban_voter[i] === 1) {
                    // Urban count was already calculated above for the initial window
                    // Just need to ensure we have the right count for position i
                    urbanVoteCount = 0;
                    for (let j = 0; j <= i; j++) {
                        if (item.urban_voter[j] === 1) {
                            urbanVoteCount++;
                        }
                    }
                }
            }
            
            // Calculate rolling average as percentage
            const rollingAverage = (trumpVotesInWindow / windowSize) * 100;
            
            // Calculate cumulative urban percentage
            const cumulativeUrbanPercentage = item.urban_voter ? 
                (urbanVoteCount / (i + 1)) * 100 : 
                (item.urban_percentage || 0);
            
            // Create a data point for each step where we have a full window
            rollingAverageData.push({
                tabulator: item.tabulator,
                vote_index: i + 1, // 1-indexed position in vote history
                total_votes: i + 1, // Total votes counted so far
                window_trump_votes: trumpVotesInWindow,
                window_size: windowSize,
                rolling_average: rollingAverage,
                is_urban: item.is_urban,
                urban_percentage: item.urban_percentage || 0,
                area_type: item.is_urban ? 'Urban' : 'Rural',
                cumulative_urban_percentage: cumulativeUrbanPercentage
            });
        }
    });
    
    const processingTime = performance.now() - processingStart;
    
    const totalTime = performance.now() - startTime;
    
    return rollingAverageData;
}

/**
 * Create a rolling average plot
 * @param {string} containerId - ID of the container element
 * @param {Array} scatterData - Scatter plot data with vote_history arrays
 * @param {Object} options - Configuration options
 */
export function createRollingAveragePlot(containerId, scatterData, options = {}) {
    
    const { 
        colorMode = 'binary', 
        lineCount = '50', 
        selectionMethod = 'longest',
        windowSize = 10,
        selectedRandomTabulators = null,
        fakeDataMode = false
    } = options;
    
    // Process the data using the vote_history arrays
    const rollingAverageData = processRollingAverageData(scatterData, windowSize);
    
    // Get a list of unique tabulators
    const uniqueTabulators = [...new Set(rollingAverageData.map(item => item.tabulator))];
    
    // Limit the number of tabulators to display if needed
    let tabulatorsToDisplay = uniqueTabulators;
    if (lineCount !== 'all') {
        // Use cached tabulator vote counts if available
        let tabulatorVoteCounts, tabulatorArray;
        
        if (cachedRollingAverageTabulatorVoteCounts && cachedRollingAverageTabulatorArray) {
            tabulatorVoteCounts = cachedRollingAverageTabulatorVoteCounts;
            tabulatorArray = cachedRollingAverageTabulatorArray;
        } else {
            // Count votes per tabulator
            
            tabulatorVoteCounts = {};
            rollingAverageData.forEach(point => {
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
            cachedRollingAverageTabulatorVoteCounts = tabulatorVoteCounts;
            cachedRollingAverageTabulatorArray = [...tabulatorArray]; // Create a copy for caching
        }
        
        if (selectionMethod === 'longest') {
            // Sort by vote count (descending) and take the top N
            tabulatorArray.sort((a, b) => b.voteCount - a.voteCount);
            tabulatorsToDisplay = tabulatorArray
                .slice(0, parseInt(lineCount))
                .map(item => item.tabulator);
        } else if (selectionMethod === 'random') {
            // Use previously selected random tabulators if available (to preserve selection when window size changes)
            if (selectedRandomTabulators && selectedRandomTabulators.length > 0) {
                console.log('Using preserved random selection:', selectedRandomTabulators.length, 'tabulators');
                tabulatorsToDisplay = selectedRandomTabulators;
            } else {
                console.log('Randomly selecting', lineCount, 'tabulators');
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
                    console.log('Saved random selection for future use');
                }
            }
        }
    }
    
    
    // Use Set for O(1) lookup instead of Array.includes() which is O(n)
    const tabulatorSet = new Set(tabulatorsToDisplay);
    
    let filteredData = rollingAverageData.filter(point => 
        tabulatorSet.has(point.tabulator)
    );
    
    // Apply fake data manipulation if the toggle is enabled
    if (fakeDataMode) {
        // Create a deep copy to avoid modifying the original data
        filteredData = JSON.parse(JSON.stringify(filteredData));
        
        // Group data by tabulator
        const tabulatorGroups = {};
        filteredData.forEach(point => {
            if (!tabulatorGroups[point.tabulator]) {
                tabulatorGroups[point.tabulator] = [];
            }
            tabulatorGroups[point.tabulator].push(point);
        });
        
        // Apply the manipulation: -20% for points below 250 votes
        Object.keys(tabulatorGroups).forEach(tabulator => {
            const points = tabulatorGroups[tabulator];
            
            // Sort by total votes to ensure we're manipulating in order
            points.sort((a, b) => a.total_votes - b.total_votes);
            
            // Apply the manipulation to points below 250 votes
            points.forEach(point => {
                if (point.total_votes <= 250) {
                    // Reduce the rolling average by 20 percentage points
                    point.rolling_average = Math.max(0, point.rolling_average - 20);
                }
            });
        });
        
        // Flatten the groups back to a single array
        filteredData = Object.values(tabulatorGroups).flat();
        }
    
    // Data sampling optimization for large datasets
    let sampledData = filteredData;
    const maxPointsPerLine = 100; // Reasonable limit for smooth visualization
    
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
    
    // Helper function to calculate maximum votes without using spread operator
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
        // Use canvas for better performance with large datasets
        style: {
            background: "white"
        },
        title: fakeDataMode ? 
            `SIMULATED FRAUD SCENARIO - Rolling Average (Window Size: ${windowSize}) of Trump Votes` :
            `Rolling Average (Window Size: ${windowSize}) of Trump Votes by Tabulator`,
        subtitle: fakeDataMode ?
            `FAKE DATA - NOT REAL - ${filteredData.length} points, ${tabulatorsToDisplay.length} machines` :
            `${filteredData.length} points, ${tabulatorsToDisplay.length} machines`,
        color: colorConfig,
        x: {
            label: "Total Votes Counted",
            grid: true,
            domain: lineCount === 'all' ? [0, 1250] : [0, maxVotes * 1.05]
        },
        y: {
            label: `Trump % (${windowSize}-Vote Rolling Average)`,
            domain: [0, 100],
            grid: true
        },
        marks: [
            // Add a reference line at 50%
            Plot.ruleY([50], {stroke: "#888", strokeWidth: 1, strokeDasharray: "4,4"}),
            // Add the rolling average lines using sampled data
            Plot.line(sampledData, {
                x: "total_votes",
                y: "rolling_average",
                z: "tabulator", // Group by tabulator to create one line per tabulator
                ...lineConfig,
                strokeWidth: 1.5,
                strokeOpacity: 0.8, // Slightly more transparent for better performance
            }),
            
            // Add a dot to show exactly which point is being hovered using sampled data
            Plot.dot(sampledData, {
                x: "total_votes",
                y: "rolling_average",
                r: 5,
                fill: "white",
                stroke: "black",
                strokeWidth: 1.5,
                filter: Plot.pointerX({x: "total_votes", y: "rolling_average"})
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
                    // Add a class to these dots so we can select them with D3
                    class: "endpoint",
                    x: "total_votes",
                    y: "rolling_average",
                    fill: colorMode === 'binary' ? d => d.area_type === 'Urban' ? "#4e79a7" : "#59a14f" : 
                          colorMode === 'gradient' ? "cumulative_urban_percentage" : "tabulator",
                    r: 4,
                    title: d => `Tabulator: ${d.tabulator}\nTotal Votes: ${d.total_votes}\nRolling Avg Trump %: ${d.rolling_average.toFixed(2)}%\nArea: ${d.area_type}\nWindow Size: ${d.window_size}`
                }
            )
        ]
    });
    
    // Render the plot
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    container.appendChild(plot);
    
    // Add D3-based line highlighting behavior
    setTimeout(() => {
        if (typeof d3 === 'undefined') {
            console.warn('D3 is not available. Line highlighting will not work.');
            return;
        }
        
        try {
            // Find all path elements that are lines in the plot
            // We need to try different selectors as Plot's DOM structure can vary
            let paths = d3.select(plot).selectAll('path');
            
            // Also get the endpoint dots so we can dim them during highlighting
            let endpointDots = d3.select(plot).selectAll('circle');
            if (endpointDots.size() === 0) {
                // If we can't find the dots by class, try to get them by position in the SVG
                // Typically, the endpoint dots are in the last mark group
                endpointDots = d3.select(plot).selectAll('g.mark:last-child circle');
            }
            
            // Filter to only include the paths that are part of our line chart
            // This helps exclude axis lines and other non-data paths
            if (paths.size() > 0) {
                
                // Add hover effects to each path
                paths.on('pointerenter', function() {
                    // Save the current color and width for restoration
                    const originalColor = d3.select(this).attr('stroke');
                    const originalWidth = d3.select(this).attr('stroke-width');
                    
                    // Dim all lines
                    paths.each(function() {
                        const path = d3.select(this);
                        if (!path.attr('__original_opacity')) {
                            path.attr('__original_opacity', path.attr('opacity') || 1);
                        }
                        path.attr('opacity', 0.15);
                    });
                    
                    // Also dim all endpoint dots
                    endpointDots.each(function() {
                        const dot = d3.select(this);
                        if (!dot.attr('__original_opacity')) {
                            dot.attr('__original_opacity', dot.attr('opacity') || 1);
                        }
                        dot.attr('opacity', 0.15);
                    });
                    
                    // Highlight the hovered line
                    d3.select(this)
                        .attr('opacity', 1)
                        .attr('stroke-width', 3);
                    
                    // Bring the hovered path to the front
                    const parent = this.parentNode;
                    parent.appendChild(this);
                });
                
                // Handle mouse leave on each path to restore its original appearance
                // This helps with multiple consecutive hovers
                paths.on('pointerleave', function() {
                    d3.select(this).attr('stroke-width', 1.5);
                });
                
                // Reset all paths when mouse leaves the plot area
                d3.select(plot).on('pointerleave', function() {
                    // Restore original appearance to paths
                    paths.each(function() {
                        const path = d3.select(this);
                        const originalOpacity = path.attr('__original_opacity') || 1;
                        path.attr('opacity', originalOpacity)
                            .attr('stroke-width', 1.5);
                    });
                    
                    // Restore original appearance to endpoint dots
                    endpointDots.each(function() {
                        const dot = d3.select(this);
                        const originalOpacity = dot.attr('__original_opacity') || 1;
                        dot.attr('opacity', originalOpacity);
                    });
                });
                
                console.log('Successfully added line highlighting');
            }
        } catch (e) {
            console.error('Error setting up line highlighting:', e);
        }
    }, 200); // Give more time for the SVG to fully render
}
