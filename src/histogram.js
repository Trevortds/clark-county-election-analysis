/**
 * histogram.js - Reusable histogram visualization functions for election data
 * Uses Observable Plot for visualization
 */
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

// Function to process election data and add type information
export function processData(data) {
    return data.map(d => ({
        ...d,
        trump_percentage: +d.trump_percentage,
        type: d.urban_percentage >= 50 ? 'Urban' : 'Rural' // Classify as Urban if urban_percent >= 50
    }));
}

// Create a normal curve that correctly predicts bin counts based on probability density function
export function createPredictiveCurve(data, mean, stdDev, binSize) {
    const points = [];
    const totalCount = data.length;
    
    for (let x = 0; x <= 100; x += 0.5) {
        // Calculate normal distribution density at this point
        const normalDensity = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * 
                            Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
        
        // Convert to expected count in a bin of width binSize
        // Normal density * total count * bin width = expected count in bin
        const expectedCount = normalDensity * totalCount * binSize;
        
        points.push({x, y: expectedCount});
    }
    
    return points;
}

// Count items in each bin manually for a dataset
export function countBins(data, binSize) {
    const bins = {};
    data.forEach(d => {
        const binIndex = Math.floor(d.trump_percentage / binSize) * binSize;
        bins[binIndex] = (bins[binIndex] || 0) + 1;
    });
    return bins;
}

// Calculate mean for a dataset
export function calculateMean(data) {
    return data.reduce((sum, d) => sum + d.trump_percentage, 0) / (data.length || 1);
}

// Calculate standard deviation for a dataset
export function calculateStdDev(data, mean) {
    return Math.sqrt(
        data.reduce((sum, d) => sum + Math.pow(d.trump_percentage - mean, 2), 0) / (data.length || 1)
    );
}

// Create a histogram using Observable Plot
export function createHistogram(
    container, 
    data, 
    { 
        displayMode = 'stacked', 
        colorMode = 'binary',
        title = 'Election Results Histogram' 
    } = {}
) {
    console.log('Creating histogram with:', { displayMode, colorMode, dataLength: data.length });
    console.log("data sample", data.slice(0, 3));
    
    // Process data - classify as Urban or Rural
    const processedData = processData(data);
    
    // Separate urban and rural data
    const urbanData = processedData.filter(d => d.type === 'Urban');
    const ruralData = processedData.filter(d => d.type === 'Rural');
    
    // Calculate statistics
    const mean = calculateMean(processedData);
    const stdDev = calculateStdDev(processedData, mean);
    
    const urbanMean = calculateMean(urbanData);
    const urbanStdDev = calculateStdDev(urbanData, urbanMean);
    
    const ruralMean = calculateMean(ruralData);
    const ruralStdDev = calculateStdDev(ruralData, ruralMean);
    
    // Log statistics
    console.log('Overall stats:', { mean, stdDev, count: processedData.length });
    console.log('Urban stats:', { mean: urbanMean, stdDev: urbanStdDev, count: urbanData.length });
    console.log('Rural stats:', { mean: ruralMean, stdDev: ruralStdDev, count: ruralData.length });
    
    // For binning and curve estimation
    const binSize = 2; // 2% bins (since we're using 50 thresholds for 0-100)
    const thresholds = 50;
    
    // Count bins for scaling
    const allBinCounts = countBins(processedData, binSize);
    const urbanBinCounts = countBins(urbanData, binSize);
    const ruralBinCounts = countBins(ruralData, binSize);
    
    const maxBinCount = Math.max(...Object.values(allBinCounts));
    const maxUrbanBinCount = Math.max(...Object.values(urbanBinCounts));
    const maxRuralBinCount = Math.max(...Object.values(ruralBinCounts));
    
    // Create normal distribution curves
    const allCurvePoints = createPredictiveCurve(processedData, mean, stdDev, binSize);
    const urbanCurvePoints = createPredictiveCurve(urbanData, urbanMean, urbanStdDev, binSize);
    const ruralCurvePoints = createPredictiveCurve(ruralData, ruralMean, ruralStdDev, binSize);
    
    // Create marks based on display mode
    let marks = [];
    
    if (displayMode === 'stacked') {
        // For stacked mode
        if (colorMode === 'none') {
            // Single color histogram (red)
            marks = [
                Plot.rectY(processedData, Plot.binX({y: "count"}, {
                    x: "trump_percentage",
                    fill: "red",
                    stroke: "#a00000",
                    thresholds: thresholds
                })),
                Plot.line(allCurvePoints, {
                    x: "x",
                    y: "y",
                    stroke: "black",
                    strokeWidth: 2
                }),
                Plot.text([{
                    x: 80, 
                    y: maxBinCount * 0.8, 
                    text: `Mean = ${mean.toFixed(2)}\nStd. Dev. = ${stdDev.toFixed(3)}\nN = ${processedData.length}`
                }], {
                    x: "x",
                    y: "y",
                    text: "text",
                    textAnchor: "end"
                }),
                Plot.ruleY([0])
            ];
        } else if (colorMode === 'binary') {
            // Urban/Rural stacked histogram
            marks = [
                Plot.rectY(processedData, Plot.binX({y: "count"}, {
                    x: "trump_percentage",
                    fill: "type", // Use the type field (Urban/Rural)
                    interval: binSize
                })),
                // Urban normal curve
                Plot.line(urbanCurvePoints, {
                    x: "x",
                    y: "y",
                    stroke: "#3498db", // Blue for urban
                    strokeWidth: 2
                }),
                // Rural normal curve
                Plot.line(ruralCurvePoints, {
                    x: "x",
                    y: "y",
                    stroke: "#27ae60", // Green for rural
                    strokeWidth: 2
                }),
                // Add urban statistics text
                Plot.text([{
                    x: 25, 
                    y: maxBinCount * 0.8, 
                    text: `Urban Mean = ${urbanMean.toFixed(2)}\nStd. Dev. = ${urbanStdDev.toFixed(3)}\nN = ${urbanData.length}`
                }], {
                    x: "x",
                    y: "y",
                    text: "text",
                    textAnchor: "start",
                    fill: "#3498db"
                }),
                // Add rural statistics text
                Plot.text([{
                    x: 80, 
                    y: maxBinCount * 0.8, 
                    text: `Rural Mean = ${ruralMean.toFixed(2)}\nStd. Dev. = ${ruralStdDev.toFixed(3)}\nN = ${ruralData.length}`
                }], {
                    x: "x",
                    y: "y",
                    text: "text",
                    textAnchor: "end",
                    fill: "#27ae60"
                }),
                Plot.ruleY([0])
            ];
        }
    } else {
        // Overlapping mode - show urban and rural as separate, semi-transparent histograms
        marks = [
            // Urban histogram (blue)
            Plot.rectY(urbanData, Plot.binX({y: "count"}, {
                x: "trump_percentage",
                fill: "#3498db", // Blue for urban
                fillOpacity: 0.6,
                interval: binSize
            })),
            // Rural histogram (green)
            Plot.rectY(ruralData, Plot.binX({y: "count"}, {
                x: "trump_percentage",
                fill: "#27ae60", // Green for rural
                fillOpacity: 0.6,
                interval: binSize
            })),
            // Urban normal curve
            Plot.line(urbanCurvePoints, {
                x: "x",
                y: "y",
                stroke: "#3498db", // Blue for urban
                strokeWidth: 2
            }),
            // Rural normal curve
            Plot.line(ruralCurvePoints, {
                x: "x",
                y: "y",
                stroke: "#27ae60", // Green for rural
                strokeWidth: 2
            }),
            // Add urban statistics text
            Plot.text([{
                x: 25, 
                y: maxBinCount * 0.8, 
                text: `Urban Mean = ${urbanMean.toFixed(2)}\nStd. Dev. = ${urbanStdDev.toFixed(3)}\nN = ${urbanData.length}`
            }], {
                x: "x",
                y: "y",
                text: "text",
                textAnchor: "start",
                fill: "#3498db"
            }),
            // Add rural statistics text
            Plot.text([{
                x: 80, 
                y: maxBinCount * 0.8, 
                text: `Rural Mean = ${ruralMean.toFixed(2)}\nStd. Dev. = ${ruralStdDev.toFixed(3)}\nN = ${ruralData.length}`
            }], {
                x: "x",
                y: "y",
                text: "text",
                textAnchor: "end",
                fill: "#27ae60"
            }),
            // Legend
            Plot.dot([
                {x: 10, y: maxBinCount * 0.95, type: "Urban"},
                {x: 10, y: maxBinCount * 0.9, type: "Rural"}
            ], {
                x: "x",
                y: "y",
                fill: "type",
                r: 5
            }),
            Plot.text([
                {x: 12, y: maxBinCount * 0.95, text: `Urban (${urbanData.length})`},
                {x: 12, y: maxBinCount * 0.9, text: `Rural (${ruralData.length})`}
            ], {
                x: "x",
                y: "y",
                text: "text",
                textAnchor: "start",
                dx: 5
            }),
            Plot.ruleY([0])
        ];
    }

    // Set color scale
    const color = Plot.scale({
        color: {
            domain: ["Urban", "Rural"],
            range: ["#3498db", "#27ae60"] // Blue for urban, green for rural
        }
    });
    
    // Create the plot
    try {
        // Create the plot with all marks
        const plot = Plot.plot({
            title: title,
            width: 800,
            height: 500,
            marginLeft: 60,
            y: {
                grid: true,
                label: "↑ Number of Machines"
            },
            x: {
                domain: [0, 100],
                label: "Trump % →"
            },
            color,
            marks
        });
        
        // Clear the container and add the plot
        container.innerHTML = '';
        container.appendChild(plot);
        
        return plot;
    } catch (error) {
        console.error('Error creating plot:', error);
        const errorDiv = document.createElement('div');
        errorDiv.textContent = `Error: ${error.message}`;
        errorDiv.style.color = 'red';
        errorDiv.style.padding = '20px';
        
        container.innerHTML = '';
        container.appendChild(errorDiv);
        
        return errorDiv;
    }
}
