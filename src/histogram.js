/**
 * histogram.js - Unified histogram visualization module for election data
 * Supports unary, binary, and ternary color modes with Observable Plot
 */
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

// Function to process election data based on the color mode
export function processData(data, colorMode = 'binary') {
    if (colorMode === 'ternary' || colorMode === 'unary') {
        // For ternary/unary modes, keep the original location types if present
        return data.map(d => ({
            ...d,
            trump_percentage: d.trumpPercentage !== undefined ? +d.trumpPercentage : +d.trump_percentage,
            type: d.locationType || (d.urban_percentage >= 50 ? 'Urban' : 'Rural')
        }));
    } else {
        // For binary mode
        return data.map(d => {
            let type;
            if (d.locationType) {
                // If we have location type, use it to determine binary classification
                type = (d.locationType === 'Rural') ? 'Rural' : 'Urban';
            } else {
                // Otherwise use urban_percentage
                type = d.urban_percentage >= 50 ? 'Urban' : 'Rural';
            }
            return {
                ...d,
                trump_percentage: d.trumpPercentage !== undefined ? +d.trumpPercentage : +d.trump_percentage,
                type
            };
        });
    }
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

// Create normal curve marks for visualization
function createNormalCurveMarks(data, types, colors, binSize) {
    const marks = [];
    const stats = {};
    
    types.forEach((type, i) => {
        const typeData = type === 'All' ? data : data.filter(d => d.type === type);
        if (typeData.length === 0) return;
        
        const mean = calculateMean(typeData);
        const stdDev = calculateStdDev(typeData, mean);
        const curvePoints = createPredictiveCurve(typeData, mean, stdDev, binSize);
        
        stats[type] = { mean, stdDev, count: typeData.length };
        
        marks.push(Plot.line(curvePoints, {
            x: "x",
            y: "y",
            stroke: colors[i],
            strokeWidth: 2
        }));
    });
    
    return { marks, stats };
}

// Create statistics text marks
function createStatsTextMarks(stats, types, colors, maxBinCount) {
    const marks = [];
    
    types.forEach((type, i) => {
        if (!stats[type]) return;
        const { mean, stdDev, count } = stats[type];
        const textY = maxBinCount * (0.7 - i * 0.1);
        
        marks.push(
            Plot.text(
                [{x: 10, y: textY, text: `${type} Mean = ${mean.toFixed(2)}`}],
                {x: "x", y: "y", text: "text", fill: colors[i], textAnchor: "start"}
            ),
            Plot.text(
                [{x: 10, y: textY * 0.9, text: `Std. Dev. = ${stdDev.toFixed(2)}`}],
                {x: "x", y: "y", text: "text", fill: colors[i], textAnchor: "start"}
            ),
            Plot.text(
                [{x: 10, y: textY * 0.8, text: `N = ${count}`}],
                {x: "x", y: "y", text: "text", fill: colors[i], textAnchor: "start"}
            )
        );
    });
    
    return marks;
}

// Create a histogram using Observable Plot
export function createHistogram(
    container, 
    data, 
    { 
        displayMode = 'stacked', 
        colorMode = 'binary',
        title = 'Election Results Histogram',
        referenceLines = null
    } = {}
) {
    console.log('Creating histogram with:', { displayMode, colorMode, dataLength: data.length });
    
    // Process data based on color mode
    const processedData = processData(data, colorMode);
    
    // For binning
    const binSize = 2; // 2% bins
    
    // Initialize marks array
    let marks = [];
    let stats = {};
    let maxBinCount = 0;
    
    // Configure based on color mode
    if (colorMode === 'unary' || colorMode === 'none') {
        // Single color mode (red)
        const allBinCounts = countBins(processedData, binSize);
        maxBinCount = Math.max(...Object.values(allBinCounts));
        
        marks.push(
            Plot.rectY(processedData, Plot.binX({y: "count"}, {
                x: "trump_percentage",
                fill: "red",
                stroke: "#a00000",
                interval: binSize
            }))
        );
        
        // Add normal curve and stats
        const { marks: curveMarks, stats: curveStats } = createNormalCurveMarks(
            processedData, ['All'], ['black'], binSize
        );
        marks.push(...curveMarks);
        stats = curveStats;
        
    } else if (colorMode === 'binary') {
        // Urban/Rural mode
        const urbanData = processedData.filter(d => d.type === 'Urban');
        const ruralData = processedData.filter(d => d.type === 'Rural');
        
        if (displayMode === 'stacked') {
            // Stack using Observable Plot's stack transform
            const stackData = processedData.map(d => ({
                ...d,
                category: d.type
            }));
            
            marks.push(
                Plot.rectY(stackData, 
                    Plot.stackY(
                        Plot.binX({y: "count"}, {
                            x: "trump_percentage",
                            fill: "category",
                            interval: binSize
                        })
                    )
                )
            );
        } else {
            // Overlapping
            marks.push(
                Plot.rectY(urbanData, Plot.binX({y: "count"}, {
                    x: "trump_percentage",
                    fill: "steelblue",
                    opacity: 0.7,
                    interval: binSize
                })),
                Plot.rectY(ruralData, Plot.binX({y: "count"}, {
                    x: "trump_percentage",
                    fill: "green",
                    opacity: 0.7,
                    interval: binSize
                }))
            );
        }
        
        // Calculate max bin count for positioning
        const urbanBinCounts = countBins(urbanData, binSize);
        const ruralBinCounts = countBins(ruralData, binSize);
        maxBinCount = displayMode === 'stacked' 
            ? Math.max(...Object.keys({...urbanBinCounts, ...ruralBinCounts}).map(bin => 
                (urbanBinCounts[bin] || 0) + (ruralBinCounts[bin] || 0)
              ))
            : Math.max(...Object.values(urbanBinCounts), ...Object.values(ruralBinCounts));
        
        // Add curves and stats
        const { marks: curveMarks, stats: curveStats } = createNormalCurveMarks(
            processedData, ['Urban', 'Rural'], ['steelblue', 'green'], binSize
        );
        marks.push(...curveMarks);
        stats = curveStats;
        
    } else if (colorMode === 'ternary') {
        // Urban/Suburban/Rural mode
        const urbanData = processedData.filter(d => d.type === 'Urban');
        const suburbanData = processedData.filter(d => d.type === 'Suburban');
        const ruralData = processedData.filter(d => d.type === 'Rural');
        
        const ternaryColors = {
            'Urban': '#FDEA45',
            'Suburban': '#808080',
            'Rural': '#002051'
        };
        
        if (displayMode === 'stacked') {
            // Stack using Observable Plot's stack transform
            const stackData = processedData.map(d => ({
                ...d,
                category: d.type
            }));
            
            marks.push(
                Plot.rectY(stackData, 
                    Plot.stackY(
                        Plot.binX({y: "count"}, {
                            x: "trump_percentage",
                            fill: "category",
                            interval: binSize
                        })
                    )
                )
            );
        } else {
            // Overlapping
            marks.push(
                Plot.rectY(urbanData, Plot.binX({y: "count"}, {
                    x: "trump_percentage",
                    fill: ternaryColors['Urban'],
                    opacity: 0.6,
                    interval: binSize
                })),
                Plot.rectY(suburbanData, Plot.binX({y: "count"}, {
                    x: "trump_percentage",
                    fill: ternaryColors['Suburban'],
                    opacity: 0.6,
                    interval: binSize
                })),
                Plot.rectY(ruralData, Plot.binX({y: "count"}, {
                    x: "trump_percentage",
                    fill: ternaryColors['Rural'],
                    opacity: 0.6,
                    interval: binSize
                }))
            );
        }
        
        // Calculate max bin count
        const urbanBinCounts = countBins(urbanData, binSize);
        const suburbanBinCounts = countBins(suburbanData, binSize);
        const ruralBinCounts = countBins(ruralData, binSize);
        
        if (displayMode === 'stacked') {
            // For stacked, sum the counts per bin
            const allBins = new Set([...Object.keys(urbanBinCounts), ...Object.keys(suburbanBinCounts), ...Object.keys(ruralBinCounts)]);
            maxBinCount = Math.max(...Array.from(allBins).map(bin => 
                (urbanBinCounts[bin] || 0) + (suburbanBinCounts[bin] || 0) + (ruralBinCounts[bin] || 0)
            ));
        } else {
            maxBinCount = Math.max(
                ...Object.values(urbanBinCounts),
                ...Object.values(suburbanBinCounts),
                ...Object.values(ruralBinCounts)
            );
        }
        
        // Add curves and stats
        const { marks: curveMarks, stats: curveStats } = createNormalCurveMarks(
            processedData, 
            ['Urban', 'Suburban', 'Rural'], 
            [ternaryColors['Urban'], ternaryColors['Suburban'], ternaryColors['Rural']], 
            binSize
        );
        marks.push(...curveMarks);
        stats = curveStats;
    }
    
    // Add reference lines if provided
    if (referenceLines && referenceLines.length > 0) {
        referenceLines.forEach(line => {
            marks.push(
                Plot.ruleX([line.value], {
                    stroke: line.color || "black",
                    strokeWidth: 2,
                    strokeDasharray: "5,5"
                })
            );
        });
    }
    
    // Add baseline
    marks.push(Plot.ruleY([0]));
    
    // Add statistics text
    if (colorMode !== 'none' && colorMode !== 'unary') {
        const types = colorMode === 'binary' ? ['Urban', 'Rural'] : ['Urban', 'Suburban', 'Rural'];
        const colors = colorMode === 'binary' 
            ? ['steelblue', 'green'] 
            : ['#FDEA45', '#808080', '#002051'];
        
        marks.push(...createStatsTextMarks(stats, types, colors, maxBinCount));
    } else {
        // For unary mode, show overall stats
        marks.push(...createStatsTextMarks(stats, ['All'], ['red'], maxBinCount));
    }
    
    // Create color configuration
    let colorConfig = {};
    if (colorMode === 'ternary') {
        colorConfig = {
            type: "categorical",
            domain: ["Urban", "Suburban", "Rural"],
            range: ["#FDEA45", "#808080", "#002051"],
            legend: displayMode === 'stacked' || displayMode === 'overlapping'
        };
    } else if (colorMode === 'binary') {
        colorConfig = {
            type: "categorical",
            domain: ["Urban", "Rural"],
            range: ["steelblue", "green"],
            legend: displayMode === 'stacked' || displayMode === 'overlapping'
        };
    }
    
    // Create the plot
    const plot = Plot.plot({
        title,
        width: 800,
        height: 400,
        marginLeft: 50,
        marginRight: 50,
        marginTop: 20,
        marginBottom: 50,
        x: {
            label: "Trump Percentage →",
            domain: [0, 100]
        },
        y: {
            label: "↑ Number of Machines"
        },
        color: Object.keys(colorConfig).length > 0 ? colorConfig : undefined,
        marks
    });
    
    // Clear container and add plot
    container.innerHTML = '';
    container.appendChild(plot);
}
