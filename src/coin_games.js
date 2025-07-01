/**
 * coin_games.js - Functions for creating multiple coin flip game visualizations
 * Shows the progression of multiple coin flip games with configurable probability
 */
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

// Constants
const TOTAL_GAMES = 20;
const MAX_FLIPS = 2000;

/**
 * Generate random coin flip games
 * @param {number} numGames - Number of games to generate
 * @param {number} flipsPerGame - Maximum number of flips per game
 * @param {number} headsProbability - Probability of flipping heads (0-1)
 * @returns {Array} - Array of game data where each element is an array of 0s and 1s (0=tails, 1=heads)
 */
function generateCoinGames(numGames, flipsPerGame, headsProbability = 0.5) {
    const games = [];
    
    for (let game = 0; game < numGames; game++) {
        const flips = [];
        
        for (let flip = 0; flip < flipsPerGame; flip++) {
            // Generate a random flip based on headsProbability
            // 1 = heads, 0 = tails
            const result = Math.random() < headsProbability ? 1 : 0;
            flips.push(result);
        }
        
        games.push({
            gameId: game + 1,
            flips: flips
        });
    }
    
    return games;
}

/**
 * Process coin games data to create plot points
 * @param {Array} games - Array of game data
 * @param {number} maxFlips - Maximum number of flips to include (truncation point)
 * @returns {Array} - Array of processed data points for plotting
 */
function processCoinGamesData(games, maxFlips) {
    const plotData = [];
    
    games.forEach(game => {
        let headsCount = 0;
        
        // Process only up to maxFlips or the length of the flip array, whichever is smaller
        const flipsToProcess = Math.min(maxFlips, game.flips.length);
        
        for (let flip = 0; flip < flipsToProcess; flip++) {
            // Update the heads count
            if (game.flips[flip] === 1) {
                headsCount++;
            }
            
            // Calculate the percentage of heads
            const headsPercentage = (headsCount / (flip + 1)) * 100;
            
            // Add data point
            plotData.push({
                gameId: game.gameId,
                flipNumber: flip + 1,
                headsCount: headsCount,
                headsPercentage: headsPercentage
            });
        }
    });
    
    return plotData;
}

/**
 * Create a coin games plot
 * @param {string} containerId - ID of the container element
 * @param {Array} games - Pregenerated coin games data
 * @param {Object} options - Configuration options
 */
export function createCoinGamesPlot(containerId, games, options = {}) {
    const { 
        maxFlips = 100, 
        guessLower = 45, 
        guessUpper = 55,
        title = "Multiple Coin Flip Games"
    } = options;
    
    // Process the data using the generated coin flips, truncated to maxFlips
    const plotData = processCoinGamesData(games, maxFlips);
    
    // Calculate the maximum number of flips to set domain appropriately
    function calculateMaxFlipsInData(data) {
        let max = 0;
        for (let i = 0; i < data.length; i++) {
            if (data[i].flipNumber > max) {
                max = data[i].flipNumber;
            }
        }
        return max;
    }
    
    // Create the plot
    const plot = Plot.plot({
        width: 800,
        height: 500,
        marginBottom: 50,
        marginLeft: 60,
        title: `${title} (${plotData.length} data points, ${TOTAL_GAMES} games)`,
        color: {
            type: "categorical",
            domain: Array.from({ length: TOTAL_GAMES }, (_, i) => i + 1),
            scheme: "Tableau10"
        },
        x: {
            label: "Number of Coin Flips",
            grid: true,
            domain: [0, calculateMaxFlipsInData(plotData)]
        },
        y: {
            label: "Heads %",
            domain: [0, 100],
            grid: true
        },
        marks: [
            // Add a user guess region
            Plot.rectY([1], {
                x1: 0,
                x2: calculateMaxFlipsInData(plotData),
                y1: guessLower,
                y2: guessUpper,
                fill: "#aaa",
                fillOpacity: 0.2
            }),
            
            // Add a reference line at theoretical probability (50% for fair coin)
            Plot.ruleY([50], {stroke: "#888", strokeWidth: 1, strokeDasharray: "4,4"}),
            
            // Draw a line for each game
            Plot.line(plotData, {
                x: "flipNumber",
                y: "headsPercentage",
                stroke: "gameId",
                strokeWidth: 1.5
            }),
            
            // Draw points for values within the guess range
            Plot.dot(
                plotData.filter(d => d.headsPercentage >= guessLower && d.headsPercentage <= guessUpper), 
                {
                    x: "flipNumber",
                    y: "headsPercentage",
                    fill: "gameId",
                    r: 3
                }
            ),
            
            // Add a text marker for the guess range
            Plot.text([{x: 5, y: guessLower - 3}], {
                text: [`User Guess: ${guessLower}% - ${guessUpper}%`],
                textAnchor: "start",
                fontSize: 12
            })
        ]
    });
    
    // Render the plot
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    container.appendChild(plot);
}

/**
 * Pre-generate all coin games
 * @param {number} headsProbability - Probability of flipping heads
 * @returns {Array} - Array of pregenerated games
 */
export function pregenerateCoinGames(headsProbability = 0.5) {
    return generateCoinGames(TOTAL_GAMES, MAX_FLIPS, headsProbability);
}

/**
 * Update the coin games plot with new options
 * @param {string} containerId - ID of the container element
 * @param {Array} games - Pregenerated coin games data
 * @param {Object} options - Updated configuration options
 */
export function updateCoinGamesPlot(containerId, games, options = {}) {
    createCoinGamesPlot(containerId, games, options);
}
