 // TODOS
        // - Download the libs I am reliant on and use them either primarily or as a fallback
        // - Add histogram (footnote?) with mail-in votes, also one that combines mail ins and early, to show the curve balance out
        // - convert the rest of the radio toggles to buttons 
        
        // Import our visualization modules
        import { animateCoinFlip } from './src/coin_flip.js';
        import { animateCoins, calculateStats, formatStats } from './src/multi_coin_flip.js';
        import { pregenerateCoinGames, createCoinGamesPlot, updateCoinGamesPlot } from './src/coin_games.js';
        import { createHistogram } from './src/histogram.js';
        import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
        // import * as Plot from "./assets/plot@0.6.esm.js";

        
        // Create separate state for each visualization to avoid conflicts
        const vizStates = {
            global: {
                headsProbability: 0.4
            },
            single: {
                isAnimating: false,
            },
            four: {
                isAnimating: false,
            },
            ten: {
                isAnimating: false,
            },
            coinGames: {
                isAnimating: false,
                coinGames: [],
                maxFlips: 10,
            },
            userPrediction: 50
        };

        /*
        is there a way to make the scrollama a little more robust with the sections? like, it's currently set up with the assumption that you'll scroll fro the top to the bottom, but if you move too fast, it might miss that a trigger point has passed, and so the coin flip sliders are visible in the election section, and vice versa. Also it's a problem when refreshing the page, because you may be far down the page but the trigger to draw the color mode toggle is far up the page. 


        */
        
        // Handle single coin flip
        document.querySelector('button[data-viz="single"]').addEventListener('click', async function() {
            if (vizStates.single.isAnimating) return;
            
            vizStates.single.isAnimating = true;
            const coin = document.querySelector('.coin-container[data-viz="single"] .coin');
            const resultDiv = document.querySelector('.viz-result[data-viz="single"]');
            
            // Clear previous result
            resultDiv.innerHTML = '<p style="color: var(--text-secondary);">Tails! (Don\'t worry, I always choose tails)</p>';
            
            // Create a modified version of animateCoinFlip that uses our local state
            coin.style.animation = 'none';
            coin.offsetHeight; // Trigger reflow
            
            // Determine result
            const result = Math.random() < vizStates.global.headsProbability ? 'heads' : 'tails';
            const animationName = result === 'heads' ? 'flip-to-heads' : 'flip-to-tails';
            coin.style.animation = `${animationName} 2000ms ease-out forwards`;
            const extra_text = result === 'heads' ? 'You Win! 🎉' : 'You Lose! 😔';
            
            setTimeout(() => {
                resultDiv.innerHTML = `<p style="color: var(--text-light);">Result: <strong>${result.toUpperCase()}</strong></p><p style="color: var(--olivine); font-weight: 600; font-size: 18px; margin-top: 10px;">${extra_text}</p>`;
                vizStates.single.isAnimating = false;
            }, 2000);
        });
        
        // Handle four coins flip
        document.querySelector('button[data-viz="four"]').addEventListener('click', async function() {
            if (vizStates.four.isAnimating) return;
            
            vizStates.four.isAnimating = true;
            const coins = document.querySelectorAll('.coins-grid[data-viz="four"] .coin');
            const resultDiv = document.querySelector('.viz-result[data-viz="four"]');
            
            // Clear previous result
            resultDiv.innerHTML = '<p style="color: var(--text-secondary);">Flipping all coins...</p>';
            
            // Animate all coins
            const results = [];
            const promises = Array.from(coins).map((coin, index) => {
                return new Promise((resolve) => {
                    // Clear animation
                    coin.style.animation = 'none';
                    coin.offsetHeight;
                    const resultDiv = 
                    
                    // Random delay for staggered effect
                    setTimeout(() => {
                        const result = Math.random() < vizStates.global.headsProbability ? 'heads' : 'tails';
                        const animationName = result === 'heads' ? 'flip-to-heads' : 'flip-to-tails';
                        const duration = 2000 + Math.random() * 500;
                        
                        coin.style.animation = `${animationName} ${duration}ms ease-out forwards`;
                        
                        setTimeout(() => {
                            results.push(result);
                            resolve(result);
                        }, duration);
                    }, index * 100); // Stagger by 100ms
                });
            });
            
            // Wait for all coins to finish
            await Promise.all(promises);
            
            // Calculate and display stats
            const stats = calculateStats(results);
            const userPredictionNum = parseInt(vizStates.userPrediction ?? 50);
            const extra_text = (Math.abs(stats.headsPercentage - userPredictionNum) <= 5) ? 'You Win! 🎉' : 'You Lose! 😔';
            resultDiv.innerHTML = formatStats(stats) + `<p style="color: var(--olivine); font-weight: 600; font-size: 18px; margin-top: 10px;">${extra_text}</p>`;
            vizStates.four.isAnimating = false;
        });

        // Handle ten coins flip
        document.querySelector('button[data-viz="ten"]').addEventListener('click', async function() {
            if (vizStates.ten.isAnimating) return;
            
            vizStates.ten.isAnimating = true;
            const coins = document.querySelectorAll('.ten-coins-grid[data-viz="ten"] .coin');
            const resultDiv = document.querySelector('.viz-result[data-viz="ten"]');
            
            // Clear previous result
            resultDiv.innerHTML = '<p style="color: var(--text-secondary);">Flipping all coins...</p>';
            
            // Animate all coins
            const results = [];
            const promises = Array.from(coins).map((coin, index) => {
                return new Promise((resolve) => {
                    // Clear animation
                    coin.style.animation = 'none';
                    coin.offsetHeight;
                    const resultDiv = 
                    
                    // Random delay for staggered effect
                    setTimeout(() => {
                        const result = Math.random() < vizStates.global.headsProbability ? 'heads' : 'tails';
                        const animationName = result === 'heads' ? 'flip-to-heads' : 'flip-to-tails';
                        const duration = 2000 + Math.random() * 500;
                        
                        coin.style.animation = `${animationName} ${duration}ms ease-out forwards`;
                        
                        setTimeout(() => {
                            results.push(result);
                            resolve(result);
                        }, duration);
                    }, index * 100); // Stagger by 100ms
                });
            });
            
            // Wait for all coins to finish
            await Promise.all(promises);
            
            // Calculate and display stats
            const stats = calculateStats(results);
            const userPredictionNum = parseInt(vizStates.userPrediction ?? 50);
            const extra_text = (Math.abs(stats.headsPercentage - userPredictionNum) <= 10) ? 'You Win! 🎉' : 'You Lose! 😔';
            resultDiv.innerHTML = formatStats(stats) + `<p style="color: var(--olivine); font-weight: 600; font-size: 18px; margin-top: 10px;">${extra_text}</p>`;
            vizStates.ten.isAnimating = false;
        });
        

        // Coin Games logic
        // Initialize the visualization
        function initCoinGamesVisualization() {
            // Pre-generate all games
            vizStates.coinGames.coinGames = pregenerateCoinGames(vizStates.global.headsProbability);
            
            // Create initial plot
            createCoinGamesPlot('coin-games-plot', vizStates.coinGames.coinGames, {
                maxFlips: vizStates.coinGames.maxFlips,
                guessLower: vizStates.userPrediction - 5,
                guessUpper: vizStates.userPrediction + 5,
                title: "Multiple Coin Flip Games"
            });
            
            // Calculate initial win percentage
            calculateAndDisplayWinPercentage();
            
            // Set up event listeners
            document.getElementById('flips-slider').addEventListener('input', handleFlipsChange);
            document.getElementById('coinBias').addEventListener('input', handleProbabilityChange);
            document.getElementById('userPrediction').addEventListener('input', handleGuessChange);
        }

        // Handler for flips slider change
        function handleFlipsChange(e) {
            const flipsSlider = e.target;
            const flipsDisplay = document.getElementById('flips-display');
            const convergenceNotice = document.getElementById('convergence-notice');
            vizStates.coinGames.maxFlips = parseInt(flipsSlider.value);
            flipsDisplay.textContent = vizStates.coinGames.maxFlips;
            
            // Show/hide convergence notice
            if (vizStates.coinGames.maxFlips > 250) {
                convergenceNotice.style.display = 'block';
                // Trigger opacity transition
                setTimeout(() => {
                    convergenceNotice.style.opacity = '1';
                }, 10);
            } else {
                convergenceNotice.style.opacity = '0';
                setTimeout(() => {
                    convergenceNotice.style.display = 'none';
                }, 500); // Wait for transition to complete
            }
            
            updateCoinVisualization();
        }

        // Handler for probability slider change
        function handleProbabilityChange(e) {
            const probabilitySlider = e.target;
            
            // Regenerate games with new probability
            vizStates.coinGames.coinGames = pregenerateCoinGames(vizStates.global.headsProbability);
            
            updateCoinVisualization();
        }
        
        // Handler for guess range sliders
        function handleGuessChange(e) {
            const userPrediction = e.target;
            vizStates.userPrediction = parseInt(userPrediction.value);
            
            // Update display
            e.target.previousElementSibling.querySelector('.value').textContent = e.target.value + '%';
            
            updateCoinVisualization();
        }
        function updateCoinVisualization() {
            updateCoinGamesPlot('coin-games-plot', vizStates.coinGames.coinGames, {
                maxFlips: vizStates.coinGames.maxFlips,
                guessLower: vizStates.userPrediction - 5,
                guessUpper: vizStates.userPrediction + 5,
                title: "Multiple Coin Flip Games"
            });
            
            // Calculate and display win percentage
            calculateAndDisplayWinPercentage();
        }
        
        function calculateAndDisplayWinPercentage() {
            const games = vizStates.coinGames.coinGames;
            const maxFlips = vizStates.coinGames.maxFlips;
            const lowerBound = vizStates.userPrediction - 5;
            const upperBound = vizStates.userPrediction + 5;
            
            // Count games within the prediction window
            let wins = 0;
            const totalGames = games.length;
            
            games.forEach(game => {
                if (maxFlips <= game.flips.length) {
                    const headsCount = game.flips.slice(0, maxFlips).filter(f => f).length;
                    const headsPercentage = (headsCount / maxFlips) * 100;
                    if (headsPercentage >= lowerBound && headsPercentage <= upperBound) {
                        wins++;
                    }
                }
            });
            
            const winPercentage = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
            const winRateElement = document.getElementById('win-rate-value');
            const winPercentageElement = document.getElementById('win-percentage');
            
            if (winRateElement && winPercentageElement) {
                winRateElement.textContent = `${winPercentage}%`;
                
                // Show win percentage after a short delay
                setTimeout(() => {
                    winPercentageElement.style.opacity = '1';
                }, 300);
                
                // Update color based on win rate
                if (winPercentage >= 70) {
                    winPercentageElement.style.color = 'var(--dark-spring-green)';
                } else if (winPercentage >= 40) {
                    winPercentageElement.style.color = 'var(--olivine)';
                } else {
                    winPercentageElement.style.color = 'var(--auburn)';
                }
            }
        }

        // Initialize when the page loads
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initCoinGamesVisualization);
        } else {
            // DOM is already loaded
            initCoinGamesVisualization();
        }


        // Connect sliders to both visualizations
        document.getElementById('coinBias').addEventListener('input', function(e) {
            const value = e.target.value / 100;
            vizStates.global.headsProbability = value;
            e.target.previousElementSibling.querySelector('.value').textContent = e.target.value + '%';
        });
        
        
        // Handle prediction slider
        document.getElementById('userPrediction').addEventListener('input', function(e) {
            e.target.previousElementSibling.querySelector('.value').textContent = e.target.value + '%';
            // Store the prediction for later use
            vizStates.userPrediction = e.target.value;
        });
        
        // Initialize Scrollama instances
        const predictionControl = document.getElementById('predictionControl');
        
        // Set up prediction control visibility using Scrollama
        const predictionScroller = scrollama();
        
        predictionScroller
            .setup({
                step: '#four-coins-viz',
                offset: 0.9, // Trigger when section is 90% up the viewport
                once: true // Only trigger once
            })
            .onStepEnter(response => {
                // Show prediction control when entering four-coins section
                predictionControl.style.display = 'block';
                setTimeout(() => {
                    predictionControl.style.opacity = '1';
                }, 50);
            });

        // Set up bias control visibility using Scrollama
        const biasControl = document.getElementById("coinBiasControl")
        const biasScroller = scrollama();

        biasScroller
            .setup({
                step: '#coin-game-explanation',
                offset: 0.5, // Trigger when section is 90% up the viewport
                once: true // Only trigger once
            })
            .onStepEnter(response => {
                // Show prediction control when entering four-coins section
                biasControl.style.display = 'block';
                setTimeout(() => {
                    biasControl.style.opacity = '1';
                }, 50);
            });

        const coinElectionSwitcher = scrollama();
        coinElectionSwitcher
            .setup({
                step: '#eta-introduction-lead-in',
                offset: 0.5, // Trigger when section is 90% up the viewport
            })
            .onStepEnter(response => {
                // Show coin controls when scrolling up into coin section
                if (response.direction === 'up') {
                    biasControl.style.display = 'block';
                    setTimeout(() => {
                        biasControl.style.opacity = '1';
                    }, 50);
                    predictionControl.style.display = 'block';
                    setTimeout(() => {
                        predictionControl.style.opacity = '1';
                    }, 50);
                } else {
                    biasControl.style.display = 'none';
                    predictionControl.style.display = 'none';
                }
            });
        
        // Set up dynamic footnote system using Scrollama
        const setupFootnotes = () => {
            const footnotes = document.querySelectorAll('.footnote[data-section]');
            const sectionsToFootnotes = new Map();
            
            // Map sections to their footnotes (handle multiple footnotes per section)
            footnotes.forEach(footnote => {
                const sectionId = footnote.getAttribute('data-section');
                const section = document.getElementById(sectionId);
                if (section) {
                    if (!sectionsToFootnotes.has(section)) {
                        sectionsToFootnotes.set(section, []);
                    }
                    sectionsToFootnotes.get(section).push(footnote);
                }
            });
            
            // Create Scrollama instance for footnotes
            const footnoteScroller = scrollama();
            
            // Get all sections that have footnotes
            const sectionsWithFootnotes = Array.from(sectionsToFootnotes.keys());
            
            footnoteScroller
                .setup({
                    step: sectionsWithFootnotes,
                    offset: 0.6, // Trigger when section is 40% down from top
                    debug: false
                })
                .onStepEnter(response => {
                    const sectionFootnotes = sectionsToFootnotes.get(response.element);
                    if (sectionFootnotes) {
                        // Show footnotes for this section
                        sectionFootnotes.forEach(f => f.classList.add('visible'));
                    }
                })
                .onStepExit(response => {
                    const sectionFootnotes = sectionsToFootnotes.get(response.element);
                    if (sectionFootnotes) {
                        // Hide footnotes for this section when it leaves
                        sectionFootnotes.forEach(f => f.classList.remove('visible'));
                    }
                });
            
            // Handle window resize
            window.addEventListener('resize', () => {
                footnoteScroller.resize();
                predictionScroller.resize();
            });
        };
        
        // Initialize footnotes after DOM is ready
        setupFootnotes();
        
        // Mobile controls functionality
        const setupMobileControls = () => {
            const toggleBtn = document.getElementById('mobile-controls-toggle');
            const closeBtn = document.getElementById('mobile-close-btn');
            const sidebar = document.getElementById('controls-sidebar');
            const overlay = document.getElementById('mobile-overlay');
            const tooltip = document.getElementById('mobile-controls-tooltip');
            const tooltipClose = document.getElementById('tooltip-close');
            // Track if the tooltip has ever been dismissed to avoid showing it again
            let tooltipShown = false;
            let tooltipDismissed = false;
            
            const showTooltip = () => {
                tooltip.classList.add('show');
                tooltipShown = true;
            };
            
            const hideTooltip = () => {
                tooltip.classList.remove('show');
                tooltipDismissed = true; // Mark as dismissed so it won't show again
            };
            
            const openSidebar = () => {
                hideTooltip(); // Hide tooltip when opening sidebar
                
                // Delay the position fixing slightly to let any address bar animations complete
                requestAnimationFrame(() => {
                    // Store current scroll position and prevent scrolling
                    // Use position fixed instead of overflow hidden to avoid Firefox mobile issues
                    const scrollY = window.scrollY;
                    
                    // Add classes first
                    sidebar.classList.add('mobile-active', 'open');
                    overlay.classList.add('active');
                    
                    // Then lock scrolling (slight delay helps with mobile browsers)
                    setTimeout(() => {
                        document.body.style.position = 'fixed';
                        document.body.style.top = `-${scrollY}px`;
                        document.body.style.width = '100%';
                        document.body.style.overscrollBehavior = 'none'; // Prevent pull-to-refresh
                    }, 50);
                });
            };
            
            const closeSidebar = () => {
                // First remove open class to start transition
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
                
                // Restore scroll position and body styles
                const scrollY = document.body.style.top;
                document.body.style.overscrollBehavior = ''; // Restore pull-to-refresh
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                
                // Use requestAnimationFrame to ensure smooth transition
                requestAnimationFrame(() => {
                    if (scrollY) {
                        window.scrollTo(0, parseInt(scrollY || '0') * -1);
                    }
                    
                    // Remove mobile-active class after transition
                    setTimeout(() => {
                        sidebar.classList.remove('mobile-active');
                    }, 300);
                });
            };
            
            // Toggle button click
            toggleBtn.addEventListener('click', openSidebar);
            
            // Close button click
            closeBtn.addEventListener('click', closeSidebar);
            
            // Overlay click
            overlay.addEventListener('click', closeSidebar);
            
            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && sidebar.classList.contains('open')) {
                    closeSidebar();
                }
            });
            
            // Tooltip close button
            tooltipClose.addEventListener('click', hideTooltip);
            
            // Show tooltip initially on mobile (with delay to ensure visibility)
            const showTooltipInitially = () => {
                if (!tooltipShown && window.innerWidth <= 968) {
                    setTimeout(() => {
                        showTooltip();
                        
                        // Auto-hide tooltip after 8 seconds if not manually closed
                        setTimeout(() => {
                            hideTooltip();
                        }, 8000);
                    }, 1000);
                }
            };
            
            // Show tooltip on page load if on mobile
            showTooltipInitially();
            
            // Show tooltip again when resizing to mobile
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    if (window.innerWidth <= 968 && !tooltip.classList.contains('show') && !tooltipShown) {
                        showTooltipInitially();
                    } else if (window.innerWidth > 968) {
                        hideTooltip();
                    }
                }, 250);
            });
        };
        
        // Early Voting Scatterplot Functionality
        async function initEarlyVotingScatterplot() {
            document.getElementById('early-voting-loading').style.display = 'block';
            
            try {
                const data = await getEarlyVotingData();
                document.getElementById('early-voting-loading').style.display = 'none';
                globalVisualizationData.earlyVotingData = data;
                createEarlyVotingScatterPlot(data);
                
                // Add event listeners for radio buttons
                document.querySelectorAll('input[name="earlyVotingColorMode"]').forEach(radio => {
                    radio.addEventListener('change', function() {
                        createEarlyVotingScatterPlot(data);
                    });
                });
            } catch (error) {
                console.error('Error loading early voting data:', error);
                document.getElementById('early-voting-loading').textContent = 'Error loading data.';
            }
        }
        
        function createEarlyVotingScatterPlot(data) {
            // Get the selected color mode - try global first, then fallback to local
            let colorMode;
            const globalColorModeElement = document.querySelector('input[name="globalColorMode"]:checked');
            const truncateModeElement = document.querySelector('input[name="earlyVotingColorMode"]:checked');

            if (truncateModeElement && truncateModeElement.value !== "none") {
                colorMode = truncateModeElement.value;
            } else if (globalColorModeElement) {
                colorMode = globalColorModeElement.value;
            } else {
                colorMode = 'binary'; // default fallback
            }
            
            // Process data for the plot
            const plotData = data.map(item => ({
                tabulator: item.tabulator,
                total_votes: item.total_votes,
                trump_percentage: item.trump_percentage,
                area_type: item.is_urban === true ? 'Urban' : 'Rural',
                urban_percentage: item.urban_percentage || 0
            }));
            
            // Create color scale configuration based on color mode
            let colorConfig = {};
            let dotConfig = {};
            
            if (colorMode === 'binary') {
                // Binary Urban/Rural coloring
                dotConfig = {
                    fill: d => d.area_type === 'Urban' ? "blue" : "green",
                    title: d => `Tabulator: ${d.tabulator}\nTotal Votes: ${d.total_votes}\nTrump %: ${d.trump_percentage.toFixed(2)}%\nArea: ${d.area_type}`
                };
            } else if (colorMode === 'gradient') {
                // Urban percentage gradient coloring
                colorConfig = {
                    scheme: "Cividis",
                    legend: true,
                    label: "Urban %",
                    pivot: 50,
                    domain: [0, 100]
                };
                dotConfig = {
                    stroke: "urban_percentage",
                    fill: "urban_percentage",
                    title: d => `Tabulator: ${d.tabulator}\nTotal Votes: ${d.total_votes}\nTrump %: ${d.trump_percentage.toFixed(2)}%\nUrban %: ${d.urban_percentage.toFixed(1)}%`
                };
            } else if (colorMode === 'cutoff800') {
                // Cut off at 800 votes with dual candidate display
                dotConfig = {
                    fill: "red",
                    title: d => `Tabulator: ${d.tabulator}\nTotal Votes: ${d.total_votes}\nTrump %: ${d.trump_percentage.toFixed(2)}%`
                };
                const kDotConfig = {
                    fill: "blue",
                    title: d => `Tabulator: ${d.tabulator}\nTotal Votes: ${d.total_votes}\nKamala %: ${(100-d.trump_percentage).toFixed(2)}%`
                };
                
                // Add kamala percentage to data
                for (let i = 0; i < plotData.length; i++) {
                    plotData[i].kamala_percentage = 100 - plotData[i].trump_percentage;
                }
                
                const filteredPlotData = plotData.filter(d => d.total_votes < 800);
                
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
                
                // Create the scatter plot with dual candidates
                const plot = Plot.plot({
                    width: getResponsiveWidth(),
                    height: window.innerWidth < 768 ? 400 : 500,
                    marginBottom: 50,
                    marginLeft: 60,
                    grid: true,
                    x: {
                        label: "Total Votes per Machine",
                        nice: true,
                        domain: [0, Math.max(...filteredPlotData.map(d => d.total_votes)) * 1.05]
                    },
                    y: {
                        label: "Vote %",
                        nice: true,
                        domain: [0, 100],
                        tickFormat: d => `${d.toFixed(0)}`,
                        grid: true
                    },
                    marks: [
                        Plot.dot(filteredPlotData, {
                            x: "total_votes",
                            y: "trump_percentage",
                            r: 4,
                            opacity: 0.7,
                            ...dotConfig
                        }),
                        Plot.dot(filteredPlotData, {
                            x: "total_votes",
                            y: "kamala_percentage",
                            r: 4,
                            opacity: 0.7,
                            ...kDotConfig
                        })
                    ]
                });
                
                // Clear and append the plot to the container
                const container = document.getElementById('early-voting-scatterplot');
                container.innerHTML = '';
                container.appendChild(plot);
                return;
            } else if (colorMode === 'cutoff125') {
                // Cut off at 125 votes with dual candidate display
                dotConfig = {
                    fill: "red",
                    title: d => `Tabulator: ${d.tabulator}\nTotal Votes: ${d.total_votes}\nTrump %: ${d.trump_percentage.toFixed(2)}%`
                };
                const kDotConfig = {
                    fill: "blue",
                    title: d => `Tabulator: ${d.tabulator}\nTotal Votes: ${d.total_votes}\nKamala %: ${(100-d.trump_percentage).toFixed(2)}%`
                };
                
                // Add kamala percentage to data
                for (let i = 0; i < plotData.length; i++) {
                    plotData[i].kamala_percentage = 100 - plotData[i].trump_percentage;
                }
                
                const filteredPlotData = plotData.filter(d => d.total_votes < 125);
                
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
                
                // Create the scatter plot with dual candidates
                const plot = Plot.plot({
                    width: getResponsiveWidth(),
                    height: window.innerWidth < 768 ? 400 : 500,
                    marginBottom: 50,
                    marginLeft: 60,
                    grid: true,
                    x: {
                        label: "Total Votes per Machine",
                        nice: true,
                        domain: [0, Math.max(...filteredPlotData.map(d => d.total_votes)) * 1.05]
                    },
                    y: {
                        label: "Vote %",
                        nice: true,
                        domain: [0, 100],
                        tickFormat: d => `${d.toFixed(0)}`,
                        grid: true
                    },
                    marks: [
                        Plot.dot(filteredPlotData, {
                            x: "total_votes",
                            y: "trump_percentage",
                            r: 4,
                            opacity: 0.7,
                            ...dotConfig
                        }),
                        Plot.dot(filteredPlotData, {
                            x: "total_votes",
                            y: "kamala_percentage",
                            r: 4,
                            opacity: 0.7,
                            ...kDotConfig
                        })
                    ]
                });
                
                // Clear and append the plot to the container
                const container = document.getElementById('early-voting-scatterplot');
                container.innerHTML = '';
                container.appendChild(plot);
                return;
            } else {
                // No coloring (red dots)
                dotConfig = {
                    fill: "red",
                    title: d => `Tabulator: ${d.tabulator}\nTotal Votes: ${d.total_votes}\nTrump %: ${d.trump_percentage.toFixed(2)}%`
                };
            }
            
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
            
            // Create the standard scatter plot
            const plot = Plot.plot({
                width: getResponsiveWidth(),
                height: window.innerWidth < 768 ? 400 : 500,
                marginBottom: 50,
                marginLeft: 60,
                grid: true,
                color: colorMode === 'gradient' ? colorConfig : null,
                x: {
                    label: "Total Votes per Machine",
                    nice: true,
                    domain: [0, Math.max(...plotData.map(d => d.total_votes)) * 1.05]
                },
                y: {
                    label: "Trump %",
                    nice: true,
                    domain: [0, 100],
                    tickFormat: d => `${d.toFixed(0)}`,
                    grid: true
                },
                marks: [
                    Plot.dot(plotData, {
                        x: "total_votes",
                        y: "trump_percentage",
                        r: 4,
                        opacity: 0.7,
                        ...dotConfig
                    })
                ]
            });
            
            // Clear and append the plot to the container
            const container = document.getElementById('early-voting-scatterplot');
            container.innerHTML = '';
            container.appendChild(plot);
        }

        const earlyVotingPlotInitializer = scrollama();

        earlyVotingPlotInitializer
            .setup({
                step: document.querySelectorAll('#early-voting-scatterplot-viz'),
                offset: 0.9, // Trigger when section is 90% down the viewport
                threshold: 4,
                once: true,
            })
            .onStepEnter((response) => {
                if (response.index === 0) {
                    initEarlyVotingScatterplot();
                }
            });

        // Election Day Scatterplot Functionality
        function initElectionDayScatterplot() {
            // Show loading indicator
            document.getElementById('election-day-loading').style.display = 'block';
            
            // Fetch the election day scatter data
            fetch('data/processed_data/election_day_votes_scatter_data.json')
                .then(response => response.json())
                .then(scatterData => {
                    // Hide loading indicator
                    document.getElementById('election-day-loading').style.display = 'none';
                    
                    // Store data in global state
                    globalVisualizationData.electionDayData = scatterData.data;
                    
                    // Create the scatter plot
                    createElectionDayScatterPlot(scatterData.data);
                    
                    // Add event listeners for radio buttons
                    document.querySelectorAll('input[name="electionDayColorMode"]').forEach(radio => {
                        radio.addEventListener('change', function() {
                            createElectionDayScatterPlot(scatterData.data);
                        });
                    });
                })
                .catch(error => {
                    console.error('Error loading election day data:', error);
                    document.getElementById('election-day-loading').textContent = 'Error loading data. Please check console for details.';
                });
        }
        
        function createElectionDayScatterPlot(data) {
            // Get the selected color mode - try global first, then fallback to local
            let colorMode;
            const globalColorModeElement = document.querySelector('input[name="globalColorMode"]:checked');
            const localColorModeElement = document.querySelector('input[name="electionDayColorMode"]:checked');
            
            if (globalColorModeElement) {
                colorMode = globalColorModeElement.value;
            } else if (localColorModeElement) {
                colorMode = localColorModeElement.value;
            } else {
                colorMode = 'binary'; // default fallback
            }
            
            // Process data for the plot
            const plotData = data.map(item => ({
                tabulator: item.tabulator,
                total_votes: item.total_votes,
                trump_percentage: item.trump_percentage,
                area_type: item.is_urban === true ? 'Urban' : 'Rural',
                urban_percentage: item.urban_percentage || 0
            }));
            
            // Create color scale configuration based on color mode
            let colorConfig = {};
            let dotConfig = {};
            
            if (colorMode === 'binary') {
                // Binary Urban/Rural coloring
                dotConfig = {
                    fill: d => d.area_type === 'Urban' ? "blue" : "green",
                    title: d => `Tabulator: ${d.tabulator}\nTotal Votes: ${d.total_votes}\nTrump %: ${d.trump_percentage.toFixed(2)}%\nArea: ${d.area_type}`
                };
            } else if (colorMode === 'gradient') {
                // Urban percentage gradient coloring
                colorConfig = {
                    scheme: "Cividis",
                    legend: true,
                    label: "Urban %",
                    pivot: 50,
                    domain: [0, 100]
                };
                dotConfig = {
                    stroke: "urban_percentage",
                    fill: "urban_percentage",
                    title: d => `Tabulator: ${d.tabulator}\nTotal Votes: ${d.total_votes}\nTrump %: ${d.trump_percentage.toFixed(2)}%\nUrban %: ${d.urban_percentage.toFixed(1)}%`
                };
            } else {
                // No coloring (red dots)
                dotConfig = {
                    fill: "red",
                    title: d => `Tabulator: ${d.tabulator}\nTotal Votes: ${d.total_votes}\nTrump %: ${d.trump_percentage.toFixed(2)}%`
                };
            }
            
            // Get responsive width
            const getResponsiveWidth = () => {
                const container = document.querySelector('.viz-container-light');
                if (container) {
                    const containerWidth = container.clientWidth;
                    return Math.min(800, Math.max(320, containerWidth));
                }
                return window.innerWidth < 768 ? Math.min(320, window.innerWidth - 40) : 800;
            };
            
            // Create the scatter plot
            const plot = Plot.plot({
                width: getResponsiveWidth(),
                height: window.innerWidth < 768 ? 400 : 500,
                marginBottom: 50,
                marginLeft: 60,
                grid: true,
                color: colorMode === 'gradient' ? colorConfig : null,
                x: {
                    label: "Total Votes per Machine",
                    nice: true,
                    domain: [0, Math.max(...plotData.map(d => d.total_votes)) * 1.05]
                },
                y: {
                    label: "Trump %",
                    nice: true,
                    domain: [0, 100],
                    tickFormat: d => `${d.toFixed(0)}`,
                    grid: true
                },
                marks: [
                    Plot.dot(plotData, {
                        x: "total_votes",
                        y: "trump_percentage",
                        r: 4,
                        opacity: 0.7,
                        ...dotConfig
                    })
                ]
            });
            
            // Clear and append the plot to the container
            const container = document.getElementById('election-day-scatterplot');
            container.innerHTML = '';
            container.appendChild(plot);
        }

        const electionDayPlotInitializer = scrollama();

        electionDayPlotInitializer
            .setup({
                step: document.querySelectorAll('#election-day-scatterplot-viz'),
                offset: 0.9, // Trigger when section is 90% down the viewport
                threshold: 4,
                once: true,
            })
            .onStepEnter((response) => {
                if (response.index === 0) {
                    initElectionDayScatterplot();
                }
            });

        // Machine History Visualization Functionality
        async function initMachineHistoryVisualization() {
            document.getElementById('machine-history-loading').style.display = 'block';
            
            const globalColorControls = document.getElementById('globalColorControls');
            globalColorControls.style.display = 'block';
            setTimeout(() => {
                globalColorControls.style.opacity = '1';
            }, 100);
            
            try {
                const data = await getEarlyVotingData();
                document.getElementById('machine-history-loading').style.display = 'none';
                globalVisualizationData.machineHistoryData = data;
                updateMachineHistoryPlot(data);
                
                document.querySelectorAll('input[name="globalColorMode"], input[name="machineHistoryLineCount"], input[name="machineHistorySelectionMethod"]').forEach(radio => {
                    radio.addEventListener('change', () => updateMachineHistoryPlot(data));
                });
            } catch (error) {
                console.error('Error loading machine history data:', error);
                document.getElementById('machine-history-loading').textContent = 'Error loading data.';
            }
        }
        
        function updateMachineHistoryPlot(scatterData) {
            // Get the selected options
            const colorMode = document.querySelector('input[name="globalColorMode"]:checked').value;
            const lineCount = document.querySelector('input[name="machineHistoryLineCount"]:checked').value;
            const selectionMethod = document.querySelector('input[name="machineHistorySelectionMethod"]:checked').value;
            
            // Import and use the game history function
            import('./src/game_history.js').then(module => {
                const { createGameHistoryPlot } = module;
                
                // Create the plot
                createGameHistoryPlot('machine-history-plot', scatterData, {
                    colorMode,
                    lineCount,
                    selectionMethod
                });
            }).catch(error => {
                console.error('Error loading game history module:', error);
            });
        }

        const machineHistoryInitializer = scrollama();

        machineHistoryInitializer
            .setup({
                step: document.querySelectorAll('#machine-history-viz'),
                offset: 0.9, // Trigger when section is 90% down the viewport
                threshold: 4,
                once: true,
            })
            .onStepEnter((response) => {
                if (response.index === 0) {
                    initMachineHistoryVisualization();
                }
            });

        // Reversed Game History Functionality
        async function initReversedGameHistory() {
            document.getElementById('reversed-game-history-loading').style.display = 'block';
            
            try {
                const data = await getEarlyVotingData();
                document.getElementById('reversed-game-history-loading').style.display = 'none';
                updateReversedGameHistoryPlot(data);
                
                document.querySelectorAll('input[name="globalColorMode"], input[name="reversedHistoryLineCount"], input[name="reversedHistorySelectionMethod"], input[name="reversedHistoryTimeDirection"]').forEach(radio => {
                    radio.addEventListener('change', () => updateReversedGameHistoryPlot(data));
                });
            } catch (error) {
                console.error('Error loading reversed game history data:', error);
                document.getElementById('reversed-game-history-loading').textContent = 'Error loading data.';
            }
        }
        
        function updateReversedGameHistoryPlot(scatterData) {
            const colorMode = document.querySelector('input[name="globalColorMode"]:checked')?.value || 'binary';
            const lineCount = document.querySelector('input[name="reversedHistoryLineCount"]:checked').value;
            const selectionMethod = document.querySelector('input[name="reversedHistorySelectionMethod"]:checked').value;
            const timeDirection = document.querySelector('input[name="reversedHistoryTimeDirection"]:checked').value;
            
            import('./src/reversed_game_history.js').then(module => {
                const { createReversedGameHistoryPlot } = module;
                createReversedGameHistoryPlot('reversed-game-history-plot', scatterData, {
                    colorMode,
                    lineCount,
                    selectionMethod,
                    timeDirection
                });
            }).catch(error => {
                console.error('Error loading reversed game history module:', error);
            });
        }

        const reversedGameHistoryInitializer = scrollama();
        reversedGameHistoryInitializer
            .setup({
                step: document.querySelectorAll('#reversed-game-history-viz'),
                offset: 0.9,
                threshold: 4,
                once: true,
            })
            .onStepEnter((response) => {
                console.log("reversed game history enter")
                if (response.index === 0) {
                    initReversedGameHistory();
                }
            });
        
        // Smoking Gun Visualization Functionality
        let smokingGunSelectedRandomTabulators = null;
        
        async function initSmokingGunVisualization() {
            document.getElementById('smoking-gun-loading').style.display = 'block';
            
            try {
                const data = await getEarlyVotingData();
                globalVisualizationData.smokingGunData = data;
                document.getElementById('smoking-gun-loading').style.display = 'none';
                updateSmokingGunPlot(data);
                
                // Initialize button groups for smoking gun controls
                ButtonGroup.init('.smoking-gun-line-count-btn', () => {
                    updateSmokingGunPlot(data);
                });
                
                ButtonGroup.init('.smoking-gun-selection-btn', () => {
                    updateSmokingGunPlot(data);
                });
                
                document.getElementById('smokingGunFakeToggle').addEventListener('change', () => updateSmokingGunPlot(data));
                
                // Window size slider
                const windowSizeSlider = document.getElementById('smokingGunWindowSize');
                const windowSizeValue = document.getElementById('smokingGunWindowSizeValue');
                
                windowSizeSlider.addEventListener('input', function() {
                    windowSizeValue.textContent = this.value;
                    updateSmokingGunPlot(data);
                });
                
                // Global color mode changes
                document.querySelectorAll('input[name="globalColorMode"]').forEach(radio => {
                    radio.addEventListener('change', () => updateSmokingGunPlot(data));
                });
                
            } catch (error) {
                console.error('Error loading smoking gun data:', error);
                document.getElementById('smoking-gun-loading').textContent = 'Error loading data.';
            }
        }
        
        function updateSmokingGunPlot(scatterData) {
            const colorMode = document.querySelector('input[name="globalColorMode"]:checked')?.value || 'binary';
            const lineCount = ButtonGroup.getActiveValue('.smoking-gun-line-count-btn') || '50';
            const selectionMethod = ButtonGroup.getActiveValue('.smoking-gun-selection-btn') || 'longest';
            const windowSize = parseInt(document.getElementById('smokingGunWindowSize').value);
            const fakeDataMode = document.getElementById('smokingGunFakeToggle').checked;
            
            import('./src/rolling_average.js').then(module => {
                const { createRollingAveragePlot } = module;
                createRollingAveragePlot('smoking-gun-plot', scatterData, {
                    colorMode,
                    lineCount,
                    selectionMethod,
                    windowSize,
                    selectedRandomTabulators: smokingGunSelectedRandomTabulators,
                    fakeDataMode
                });
            }).catch(error => {
                console.error('Error loading rolling average module:', error);
            });
        }
        
        const smokingGunInitializer = scrollama();
        smokingGunInitializer
            .setup({
                step: document.querySelectorAll('#smoking-gun-viz'),
                offset: 0.9,
                threshold: 4,
                once: true,
            })
            .onStepEnter((response) => {
                console.log("smoking gun enter")
                if (response.index === 0) {
                    initSmokingGunVisualization();
                }
            });
        
        // Russian Tail Simulation Functionality
        const russianTailSimulation = {
            manipulationLevel: 10,
            displayMode: 'overlapping',
            data: null
        };
        
        function initRussianTailSimulation() {
            // Generate initial data
            russianTailSimulation.data = generateRussianTailData();
            drawRussianTailChart();
            
            // Add event listeners
            const manipulationSlider = document.getElementById('russianTailManipulationLevel');
            const manipulationValue = document.getElementById('russianTailManipulationValue');
            
            manipulationSlider.addEventListener('input', function() {
                russianTailSimulation.manipulationLevel = parseInt(this.value);
                manipulationValue.textContent = this.value + '%';
                russianTailSimulation.data = generateRussianTailData();
                drawRussianTailChart();
            });
            
            // Initialize Russian Tail display mode button group
            ButtonGroup.init('.russian-tail-display-btn', (mode) => {
                russianTailSimulation.displayMode = mode;
                drawRussianTailChart();
            });
            
            document.getElementById('russianTailGenerate').addEventListener('click', function() {
                russianTailSimulation.data = generateRussianTailData();
                drawRussianTailChart();
            });
        }
        
        function generateRussianTailData() {
            const districts = 2000;
            const manipulations = Math.floor(districts * (russianTailSimulation.manipulationLevel / 100));
            const data = [];
            
            // Box-Muller transform for normal distribution
            function normalRandom(mean, stdDev) {
                const u1 = Math.random();
                const u2 = Math.random();
                const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
                return z0 * stdDev + mean;
            }
            
            // Generate normal distributions for non-manipulated districts
            const urbanCount = Math.floor((districts - manipulations) * 0.4);
            const ruralCount = (districts - manipulations) - urbanCount;
            
            // Urban districts - normal distribution centered around 35%
            for (let i = 0; i < urbanCount; i++) {
                let votePercentage = normalRandom(35, 8);
                votePercentage = Math.max(0, Math.min(100, votePercentage));
                data.push({ 
                    district: i, 
                    votePercentage: votePercentage, 
                    type: 'Urban'
                });
            }
            
            // Rural districts - normal distribution centered around 65%
            for (let i = 0; i < ruralCount; i++) {
                let votePercentage = normalRandom(65, 8);
                votePercentage = Math.max(0, Math.min(100, votePercentage));
                data.push({ 
                    district: urbanCount + i, 
                    votePercentage: votePercentage, 
                    type: 'Rural'
                });
            }
            
            // Add manipulated districts (gradually decreasing tail all the way to 100%)
            for (let location = 0; location < manipulations; location++) {
                const randomValue = Math.random();
                let votePercentage;
                
                // Distributing values in specified ranges:
                if (randomValue < 0.6) {
                    // 60% of manipulated districts between 80-90%
                    votePercentage = 80 + ((randomValue) / 0.6) * 10;
                } else if (randomValue < 0.85) {
                    // 25% of manipulated districts between 90-95%
                    votePercentage = 90 + ((randomValue - 0.6) / 0.25) * 5;
                } else if (randomValue < 0.95) {
                    // 10% of manipulated districts between 95-99%
                    votePercentage = 95 + ((randomValue - 0.85) / 0.1) * 4;
                } else {
                    // 5% of manipulated districts between 99-100% (including some at exactly 100%)
                    votePercentage = 99 + ((randomValue - 0.95) / 0.05) * 1;
                }
                
                data.push({
                    district: districts - manipulations + location,
                    votePercentage: votePercentage,
                    type: 'Manipulated'
                });
            }
            
            return data;
        }
        
        function drawRussianTailChart() {
            const data = russianTailSimulation.data;
            if (!data || data.length === 0) return;
            
            import('https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm').then(Plot => {
                // For overlapping mode, combine manipulated with rural
                const dataForOverlapping = russianTailSimulation.displayMode === 'overlapping' 
                    ? data.map(d => ({
                        ...d,
                        type: d.type === 'Manipulated' ? 'Rural' : d.type
                      }))
                    : data;
                
                const marks = russianTailSimulation.displayMode === 'stacked' 
                    ? [
                        Plot.rectY(data, Plot.binX({y: "count"}, {
                            x: "votePercentage",
                            fill: "type",
                            mixBlendMode: "normal",
                            thresholds: 50
                        })),
                        Plot.ruleY([0])
                      ]
                    : [
                        Plot.rectY(dataForOverlapping.filter(d => d.type === 'Urban'), Plot.binX({y2: "count"}, {
                            x: "votePercentage",
                            fill: "#FDEA45",
                            fillOpacity: 0.5,
                            thresholds: 50
                        })),
                        Plot.rectY(dataForOverlapping.filter(d => d.type === 'Rural'), Plot.binX({y2: "count"}, {
                            x: "votePercentage",
                            fill: "#002051",
                            fillOpacity: 0.5,
                            thresholds: 50
                        })),
                        Plot.ruleY([0])
                      ];
                
                // Get responsive width
                const getResponsiveWidth = () => {
                    const container = document.querySelector('.viz-container-light');
                    if (container) {
                        const containerWidth = container.clientWidth;
                        return Math.min(900, Math.max(320, containerWidth));
                    }
                    return window.innerWidth < 768 ? Math.min(320, window.innerWidth - 40) : 900;
                };
                
                const chart = Plot.plot({
                    width: getResponsiveWidth(),
                    height: window.innerWidth < 768 ? 400 : 500,
                    marginLeft: 50, 
                    marginRight: 100, 
                    marginTop: 20, 
                    marginBottom: 50,
                    x: {
                        label: "Vote Percentage for Candidate →",
                        domain: [0, 100]
                    },
                    y: {
                        label: "↑ Number of Districts"
                    },
                    color: russianTailSimulation.displayMode === 'stacked' ? {
                        legend: true,
                        domain: ["Urban", "Rural", "Manipulated"],
                        range: ["#FDEA45", "#002051", "#e74c3c"]
                    } : undefined,
                    marks: marks
                });
                
                // Add legend and annotation for overlapping mode
                if (russianTailSimulation.displayMode === 'overlapping') {
                    const legendData = [
                        {x: 780, y: 30, label: "Urban", color: "#FDEA45"},
                        {x: 780, y: 50, label: "Rural + Manipulated", color: "#002051"}
                    ];
                    
                    const annotationMarks = russianTailSimulation.manipulationLevel > 0 ? [
                        Plot.rect([{x1: 80, x2: 100, y1: 0, y2: 100}], {
                            x1: "x1",
                            x2: "x2", 
                            y1: "y1",
                            y2: "y2",
                            fill: "#e74c3c",
                            fillOpacity: 0.1
                        }),
                        Plot.text([{x: 90, y: 80, text: "Russian Tail"}], {
                            x: "x",
                            y: "y",
                            text: "text",
                            fill: "#e74c3c",
                            fontSize: 14,
                            fontWeight: "bold",
                            textAnchor: "middle"
                        })
                    ] : [];
                    
                    // Get responsive width for legend chart
                    const getResponsiveWidth = () => {
                        const container = document.querySelector('.viz-container-light');
                        if (container) {
                            const containerWidth = container.clientWidth;
                            return Math.min(900, Math.max(320, containerWidth));
                        }
                        return window.innerWidth < 768 ? Math.min(320, window.innerWidth - 40) : 900;
                    };
                    
                    const legendChart = Plot.plot({
                        width: getResponsiveWidth(),
                        height: window.innerWidth < 768 ? 400 : 500,
                        marginLeft: 50, 
                        marginRight: 100, 
                        marginTop: 20, 
                        marginBottom: 50,
                        x: {
                            label: "Vote Percentage for Candidate →",
                            domain: [0, 100]
                        },
                        y: {
                            label: "↑ Number of Districts"
                        },
                        marks: [
                            ...annotationMarks,
                            ...marks,
                            Plot.dot(legendData, {
                                x: "x",
                                y: "y",
                                r: 6,
                                fill: "color"
                            }),
                            Plot.text(legendData, {
                                x: d => d.x + 15,
                                y: "y",
                                text: "label",
                                textAnchor: "start",
                                dy: 3
                            })
                        ]
                    });
                    
                    document.getElementById('russian-tail-sim-plot').replaceChildren(legendChart);
                    return;
                }
                
                document.getElementById('russian-tail-sim-plot').replaceChildren(chart);
            }).catch(error => {
                console.error('Error loading Plot module:', error);
            });
        }
        
        const russianTailInitializer = scrollama();
        russianTailInitializer
            .setup({
                step: document.querySelectorAll('#russian-tail-sim-viz'),
                offset: 0.9,
                threshold: 4,
                once: true,
            })
            .onStepEnter((response) => {
                console.log("russian tail enter")
                if (response.index === 0) {
                    initRussianTailSimulation();
                }
            });
        
        // Early Voting Histogram Initialization
        async function initEarlyVotingHistogram() {
            try {
                const response = await fetch('data/processed_data/early_votes_scatter_data.json');
                const scatterData = await response.json();
                const data = scatterData.data;
                
                globalVisualizationData.earlyVotingHistogramData = data;
                
                // Initial histogram creation
                updateEarlyVotingHistogram();
                
                // Add event listeners for controls
                document.querySelectorAll('input[name="earlyVotingDisplayMode"], input[name="earlyVotingColorMode"]').forEach(input => {
                    input.addEventListener('change', updateEarlyVotingHistogram);
                });
            } catch (error) {
                console.error('Error loading early voting histogram data:', error);
            }
        }
        
        // Function to update early voting histogram based on current control settings
        function updateEarlyVotingHistogram() {
            if (!globalVisualizationData.earlyVotingHistogramData) return;
            
            const displayMode = document.querySelector('input[name="earlyVotingDisplayMode"]:checked')?.value || 'stacked';
            const colorMode = document.querySelector('input[name="earlyVotingColorMode"]:checked')?.value || 'binary';
            
            const plotContainer = document.getElementById('early-voting-histogram-plot');
            createHistogram(plotContainer, globalVisualizationData.earlyVotingHistogramData, {
                displayMode,
                colorMode,
                title: '2024 Early Voting in Clark County, NV for Trump'
            });
        }
        
        // Election Day Histogram Initialization
        async function initElectionDayHistogram() {
            try {
                const response = await fetch('data/processed_data/election_day_votes_scatter_data.json');
                const scatterData = await response.json();
                const data = scatterData.data;
                
                globalVisualizationData.electionDayHistogramData = data;
                
                // Initial histogram creation
                updateElectionDayHistogram();
                
                // Initialize button groups for controls
                ButtonGroup.init('.election-day-display-btn', () => {
                    updateElectionDayHistogram();
                });
                
                ButtonGroup.init('.election-day-color-btn', () => {
                    updateElectionDayHistogram();
                });
            } catch (error) {
                console.error('Error loading election day histogram data:', error);
            }
        }
        
        // Function to update election day histogram based on current control settings
        function updateElectionDayHistogram() {
            if (!globalVisualizationData.electionDayHistogramData) return;
            
            const displayMode = ButtonGroup.getActiveValue('.election-day-display-btn') || 'stacked';
            const colorMode = ButtonGroup.getActiveValue('.election-day-color-btn') || 'binary';
            
            const plotContainer = document.getElementById('election-day-histogram-plot');
            createHistogram(plotContainer, globalVisualizationData.electionDayHistogramData, {
                displayMode,
                colorMode,
                title: '2024 Election Day Voting in Clark County, NV for Trump'
            });
        }
        
        // Histogram Scrollama Initializers
        const earlyVotingHistogramInitializer = scrollama();
        earlyVotingHistogramInitializer
            .setup({
                step: document.querySelectorAll('#early-voting-histogram-viz'),
                offset: 0.9,
                threshold: 4,
                once: true,
            })
            .onStepEnter((response) => {
                console.log("early voting histogram enter")
                if (response.index === 0) {
                    initEarlyVotingHistogram();
                }
            });
        
        const electionDayHistogramInitializer = scrollama();
        electionDayHistogramInitializer
            .setup({
                step: document.querySelectorAll('#election-day-histogram-viz'),
                offset: 0.9,
                threshold: 4,
                once: true,
            })
            .onStepEnter((response) => {
                console.log("election day histogram enter")
                if (response.index === 0) {
                    initElectionDayHistogram();
                }
            });
        
        // Cached Data Loader
        let cachedEarlyVotingData = null;
        
        async function getEarlyVotingData() {
            if (cachedEarlyVotingData) {
                return cachedEarlyVotingData;
            }
            
            const response = await fetch('data/processed_data/early_votes_scatter_data.json');
            const scatterData = await response.json();
            cachedEarlyVotingData = scatterData.data;
            return cachedEarlyVotingData;
        }
        
        // Global Color Control Management
        let globalVisualizationData = {
            earlyVotingData: null,
            electionDayData: null,
            machineHistoryData: null,
            reversedGameHistoryData: null,
            smokingGunData: null,
            earlyVotingHistogramData: null,
            electionDayHistogramData: null
        };
        
        // Function to update all visualizations when global color mode changes
        function updateAllVisualizationsColorMode() {
            // Update early voting scatterplot if data is available
            if (globalVisualizationData.earlyVotingData) {
                createEarlyVotingScatterPlot(globalVisualizationData.earlyVotingData);
            }
            
            // Update election day scatterplot if data is available
            if (globalVisualizationData.electionDayData) {
                createElectionDayScatterPlot(globalVisualizationData.electionDayData);
            }
            
            // Update machine history if data is available
            if (globalVisualizationData.machineHistoryData) {
                updateMachineHistoryPlot(globalVisualizationData.machineHistoryData);
            }
            
            // Update smoking gun if data is available
            if (globalVisualizationData.smokingGunData) {
                updateSmokingGunPlot(globalVisualizationData.smokingGunData);
            }
            
            // Get current global color mode
            const globalColorMode = document.querySelector('input[name="globalColorMode"]:checked')?.value || 'binary';
            
            // Update early voting histogram if data is available
            if (globalVisualizationData.earlyVotingHistogramData) {
                updateEarlyVotingHistogram();
            }
            
            // Update election day histogram if data is available
            if (globalVisualizationData.electionDayHistogramData) {
                updateElectionDayHistogram();
            }
        }
        
        // Add event listeners for global color controls
        document.querySelectorAll('input[name="globalColorMode"]').forEach(radio => {
            radio.addEventListener('change', updateAllVisualizationsColorMode);
        });
        
        // Reusable Button Group Utilities
        const ButtonGroup = {
            // Initialize a button group with click handlers
            init: function(groupSelector, onChangeCallback) {
                const buttons = document.querySelectorAll(groupSelector);
                buttons.forEach(btn => {
                    btn.addEventListener('click', function() {
                        ButtonGroup.setActive(groupSelector, this);
                        if (onChangeCallback) {
                            onChangeCallback(this.getAttribute('data-mode'), this);
                        }
                    });
                });
            },
            
            // Set a button as active within its group
            setActive: function(groupSelector, activeButton) {
                const buttons = document.querySelectorAll(groupSelector);
                buttons.forEach(btn => {
                    btn.style.background = 'white';
                    btn.style.color = '#333';
                    btn.classList.remove('active');
                });
                activeButton.style.background = '#0066cc';
                activeButton.style.color = 'white';
                activeButton.classList.add('active');
            },
            
            // Get the active button's data-mode value from a group
            getActiveValue: function(groupSelector) {
                const activeBtn = document.querySelector(groupSelector + '.active');
                return activeBtn ? activeBtn.getAttribute('data-mode') : null;
            },
            
            // Set active button by data-mode value
            setActiveByValue: function(groupSelector, value) {
                const targetBtn = document.querySelector(groupSelector + '[data-mode="' + value + '"]');
                if (targetBtn) {
                    ButtonGroup.setActive(groupSelector, targetBtn);
                }
            },
            
            // Create button group HTML structure
            createButtonGroup: function(title, buttons, groupClass, defaultValue) {
                let html = `
                    <div class="control-group" style="text-align: center;">
                        <h4 style="margin: 0 0 10px 0; color: var(--text-primary); font-size: 1em;">${title}</h4>
                        <div class="button-group" style="display: inline-flex; border: 1px solid #ccc; border-radius: 6px; overflow: hidden; flex-wrap: wrap;">
                `;
                
                buttons.forEach(btn => {
                    const isDefault = btn.value === defaultValue;
                    const bgColor = isDefault ? '#0066cc' : 'white';
                    const textColor = isDefault ? 'white' : '#333';
                    const activeClass = isDefault ? ' active' : '';
                    
                    html += `
                        <button type="button" class="${groupClass}${activeClass}" data-mode="${btn.value}" 
                                style="padding: 8px 16px; border: none; background: ${bgColor}; color: ${textColor}; cursor: pointer; font-size: 0.9em; transition: all 0.2s;">${btn.label}</button>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                `;
                
                return html;
            }
        };
        
        // Election Simulation Functionality
        const simulation = {
            urbanSupportBase: 45,
            ruralSupportBase: 73,
            suburbanSupportBase: 60,
            urbanPercentage: 55,  // Percentage of non-rural machines that are urban
            urbanClusterStrength: 11,
            suburbanClusterStrength: 3,
            ruralClusterStrength: 9,
            // Fixed machine counts based on real election data
            ruralMachines: 250,
            nonRuralMachines: 714,
            totalMachines: 964,
            data: null
        };
        
        function initElectionSimulation() {
            // Generate initial data
            simulation.data = generateElectionData();
            drawSimulationChart(simulation.data);
            drawSimulationHistogram(simulation.data);
            updateSimulationResults(simulation.data);
            
            // Add event listeners for all controls
            setupSimulationControls();
        }
        
        function setupSimulationControls() {
            // Support base sliders - regenerate data on change
            document.getElementById('urbanSupportBase').addEventListener('input', (e) => {
                simulation.urbanSupportBase = parseInt(e.target.value);
                document.getElementById('urbanSupportBaseValue').textContent = e.target.value + '%';
                simulation.data = generateElectionData();
                drawSimulationChart(simulation.data);
                drawSimulationHistogram(simulation.data);
                updateSimulationResults(simulation.data);
            });
            
            document.getElementById('ruralSupportBase').addEventListener('input', (e) => {
                simulation.ruralSupportBase = parseInt(e.target.value);
                document.getElementById('ruralSupportBaseValue').textContent = e.target.value + '%';
                simulation.data = generateElectionData();
                drawSimulationChart(simulation.data);
                drawSimulationHistogram(simulation.data);
                updateSimulationResults(simulation.data);
            });
            
            document.getElementById('suburbanSupportBase').addEventListener('input', (e) => {
                simulation.suburbanSupportBase = parseInt(e.target.value);
                document.getElementById('suburbanSupportBaseValue').textContent = e.target.value + '%';
                simulation.data = generateElectionData();
                drawSimulationChart(simulation.data);
                drawSimulationHistogram(simulation.data);
                updateSimulationResults(simulation.data);
            });
            
            // Machine distribution sliders - regenerate data on change
            document.getElementById('ruralMachines').addEventListener('input', (e) => {
                simulation.ruralMachines = parseInt(e.target.value);
                simulation.nonRuralMachines = simulation.totalMachines - simulation.ruralMachines;
                document.getElementById('ruralMachinesValue').textContent = e.target.value;
                document.getElementById('nonRuralCount').textContent = simulation.nonRuralMachines;
                document.getElementById('ruralCountDisplay').textContent = simulation.ruralMachines;
                
                // Recalculate urban/suburban split
                const urbanMachines = Math.round(simulation.nonRuralMachines * (simulation.urbanPercentage / 100));
                const suburbanMachines = simulation.nonRuralMachines - urbanMachines;
                document.getElementById('urbanCount').textContent = urbanMachines;
                document.getElementById('suburbanCount').textContent = suburbanMachines;
                
                simulation.data = generateElectionData();
                drawSimulationChart(simulation.data);
                drawSimulationHistogram(simulation.data);
                updateSimulationResults(simulation.data);
            });
            
            document.getElementById('urbanPercentage').addEventListener('input', (e) => {
                simulation.urbanPercentage = parseInt(e.target.value);
                document.getElementById('urbanPercentageValue').textContent = e.target.value + '%';
                
                // Calculate and display machine counts
                const urbanMachines = Math.round(simulation.nonRuralMachines * (simulation.urbanPercentage / 100));
                const suburbanMachines = simulation.nonRuralMachines - urbanMachines;
                document.getElementById('urbanCount').textContent = urbanMachines;
                document.getElementById('suburbanCount').textContent = suburbanMachines;
                
                simulation.data = generateElectionData();
                drawSimulationChart(simulation.data);
                drawSimulationHistogram(simulation.data);
                updateSimulationResults(simulation.data);
            });
            
            // Cluster strength sliders - regenerate data on change
            document.getElementById('urbanClusterStrength').addEventListener('input', (e) => {
                simulation.urbanClusterStrength = parseInt(e.target.value);
                document.getElementById('urbanClusterStrengthValue').textContent = e.target.value;
                simulation.data = generateElectionData();
                drawSimulationChart(simulation.data);
                drawSimulationHistogram(simulation.data);
                updateSimulationResults(simulation.data);
            });
            
            document.getElementById('suburbanClusterStrength').addEventListener('input', (e) => {
                simulation.suburbanClusterStrength = parseInt(e.target.value);
                document.getElementById('suburbanClusterStrengthValue').textContent = e.target.value;
                simulation.data = generateElectionData();
                drawSimulationChart(simulation.data);
                drawSimulationHistogram(simulation.data);
                updateSimulationResults(simulation.data);
            });
            
            document.getElementById('ruralClusterStrength').addEventListener('input', (e) => {
                simulation.ruralClusterStrength = parseInt(e.target.value);
                document.getElementById('ruralClusterStrengthValue').textContent = e.target.value;
                simulation.data = generateElectionData();
                drawSimulationChart(simulation.data);
                drawSimulationHistogram(simulation.data);
                updateSimulationResults(simulation.data);
            });
            
            // Initialize histogram button groups
            ButtonGroup.init('.display-mode-btn', () => {
                if (simulation.data) drawSimulationHistogram(simulation.data);
            });
            
            ButtonGroup.init('.color-mode-btn', () => {
                if (simulation.data) drawSimulationHistogram(simulation.data);
            });
            
            // Run simulation button
            document.getElementById('runSimulation').addEventListener('click', () => {
                simulation.data = generateElectionData();
                drawSimulationChart(simulation.data);
                drawSimulationHistogram(simulation.data);
                updateSimulationResults(simulation.data);
            });
        }
        
        // Generate election data
        function generateElectionData() {
            const data = [];
            const urbanSupportBase = simulation.urbanSupportBase / 100;
            const ruralSupportBase = simulation.ruralSupportBase / 100;
            const suburbanSupportBase = simulation.suburbanSupportBase / 100;
            
            // Calculate actual machine counts
            const urbanMachines = Math.round(simulation.nonRuralMachines * (simulation.urbanPercentage / 100));
            const suburbanMachines = simulation.nonRuralMachines - urbanMachines;
            const ruralMachines = simulation.ruralMachines;
            
            // Box-Muller transform for normal distribution
            function normalRandom(mean, stdDev) {
                const u1 = Math.random();
                const u2 = Math.random();
                const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
                return z0 * stdDev + mean;
            }
            
            // Generate vote count distribution - right-skewed with long tail
            function generateVoteCount(locationType) {
                if (locationType === "Urban") {
                    const mu = 5.5;
                    const sigma = 0.4;
                    return Math.min(1200, Math.round(Math.exp(normalRandom(mu, sigma))));
                } else if (locationType === "Suburban") {
                    const mu = 5.85;
                    const sigma = 0.45;
                    return Math.min(1200, Math.round(Math.exp(normalRandom(mu, sigma))));
                } else {
                    const mu = 6.1;
                    const sigma = 0.35;
                    return Math.min(1200, Math.round(Math.exp(normalRandom(mu, sigma))));
                }
            }
            
            // Group machines by polling locations (3-5 machines per location)
            function generateMachinesForLocationType(numMachines, locationType, supportBase, clusterStrength, startIndex) {
                const machines = [];
                let machineIndex = 0;
                
                while (machineIndex < numMachines) {
                    const machinesAtLocation = Math.min(numMachines - machineIndex, 
                        Math.floor(Math.random() * 3) + 3);
                    
                    const baseVoteCount = generateVoteCount(locationType);
                    const clusterMean = supportBase;
                    const clusterStdDev = clusterStrength / 100;
                    const locationSupportRate = normalRandom(clusterMean, clusterStdDev);
                    
                    for (let j = 0; j < machinesAtLocation; j++) {
                        const voteVariation = 0.9 + Math.random() * 0.2;
                        const voteCount = Math.round(baseVoteCount * voteVariation);
                        
                        let trumpVotes = 0;
                        for (let voter = 0; voter < voteCount; voter++) {
                            if (Math.random() < locationSupportRate) {
                                trumpVotes++;
                            }
                        }
                        
                        const trumpPercentage = voteCount > 0 ? (trumpVotes / voteCount) * 100 : 0;
                        
                        machines.push({
                            location: startIndex + machineIndex + j,
                            totalVotes: voteCount,
                            trumpPercentage: trumpPercentage,
                            trumpVotes: trumpVotes,
                            supportRate: locationSupportRate * 100,
                            locationType: locationType
                        });
                    }
                    
                    machineIndex += machinesAtLocation;
                }
                
                return machines;
            }
            
            // Generate machines for each location type
            const urbanData = generateMachinesForLocationType(urbanMachines, "Urban", urbanSupportBase, simulation.urbanClusterStrength, 0);
            const suburbanData = generateMachinesForLocationType(suburbanMachines, "Suburban", suburbanSupportBase, simulation.suburbanClusterStrength, urbanMachines);
            const ruralData = generateMachinesForLocationType(ruralMachines, "Rural", ruralSupportBase, simulation.ruralClusterStrength, urbanMachines + suburbanMachines);
            
            data.push(...urbanData, ...suburbanData, ...ruralData);
            return data;
        }
        
        // Draw main scatter plot
        function drawSimulationChart(data) {
            if (!data || data.length === 0) return;
            
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
            
            const chart = Plot.plot({
                width: getResponsiveWidth(),
                height: window.innerWidth < 768 ? 400 : 500,
                marginLeft: 50, 
                marginRight: 100, 
                marginTop: 20, 
                marginBottom: 50,
                x: {
                    label: "Total Votes per Machine →",
                    grid: true,
                    domain: [1, 1250]
                },
                y: {
                    label: "↑ Trump %",
                    domain: [0, 100],
                    grid: true
                },
                color: {
                    type: "categorical",
                    domain: ["Urban", "Suburban", "Rural"],
                    range: ["#FDEA45", "#808080", "#002051"],
                    label: "Location Type",
                    legend: true
                },
                marks: [
                    Plot.dot(data, {
                        x: "totalVotes",
                        y: "trumpPercentage",
                        fill: "locationType",
                        stroke: "gray",
                        strokeWidth: 0.5,
                        r: 3.5,
                        opacity: 0.7,
                        title: d => `Location ${d.location}\nVotes: ${d.totalVotes}, Trump: ${d.trumpPercentage.toFixed(1)}%`
                    }),
                    Plot.ruleY([simulation.urbanSupportBase], {
                        stroke: "#FDEA45",
                        strokeWidth: 2,
                        strokeDasharray: "5,5"
                    }),
                    Plot.ruleY([simulation.suburbanSupportBase], {
                        stroke: "#808080",
                        strokeWidth: 2,
                        strokeDasharray: "5,5"
                    }),
                    Plot.ruleY([simulation.ruralSupportBase], {
                        stroke: "#002051",
                        strokeWidth: 2,
                        strokeDasharray: "5,5"
                    }),
                    Plot.text([{x: 1150, y: simulation.urbanSupportBase}], {
                        text: ["Urban: " + simulation.urbanSupportBase + "%"],
                        fill: "#FDEA45",
                        fontSize: 12,
                        dx: 0
                    }),
                    Plot.text([{x: 1150, y: simulation.suburbanSupportBase}], {
                        text: ["Suburban: " + simulation.suburbanSupportBase + "%"],
                        fill: "#808080",
                        fontSize: 12,
                        dx: 0
                    }),
                    Plot.text([{x: 1150, y: simulation.ruralSupportBase}], {
                        text: ["Rural: " + simulation.ruralSupportBase + "%"],
                        fill: "#002051",
                        fontSize: 12,
                        dx: 0
                    })
                ]
            });
            
            document.getElementById('election-simulation-plot').innerHTML = '';
            document.getElementById('election-simulation-plot').appendChild(chart);
        }
        
        // Draw histogram
        function drawSimulationHistogram(data) {
            if (!data || data.length === 0) return;
            
            // Get selected values using ButtonGroup utility
            const displayMode = ButtonGroup.getActiveValue('.display-mode-btn') || 'stacked';
            const colorMode = ButtonGroup.getActiveValue('.color-mode-btn') || 'ternary';
            
            // Transform data to match expected format
            const transformedData = data.map(d => ({
                trumpPercentage: d.trumpPercentage,
                trump_percentage: d.trumpPercentage,
                locationType: d.locationType,
                urban_percentage: d.locationType === 'Urban' ? 100 : (d.locationType === 'Suburban' ? 50 : 0)
            }));
            
            // Prepare reference lines for the simulation's support bases
            const referenceLines = [
                { value: simulation.urbanSupportBase, color: '#FDEA45' },
                { value: simulation.suburbanSupportBase, color: '#808080' },
                { value: simulation.ruralSupportBase, color: '#002051' }
            ];
            
            // Use the histogram module
            import('./src/histogram.js').then(module => {
                const { createHistogram } = module;
                const container = document.getElementById('election-simulation-histogram');
                container.innerHTML = '';
                createHistogram(container, transformedData, {
                    displayMode,
                    colorMode,
                    title: 'Distribution of Trump Vote % by Machine',
                    referenceLines: colorMode === 'ternary' ? referenceLines : null
                });
            }).catch(error => {
                console.error('Error loading histogram module:', error);
            });
        }
        
        // Update simulation results display
        function updateSimulationResults(data) {
            if (!data || data.length === 0) return;
            
            const totalVotes = data.reduce((sum, d) => sum + d.totalVotes, 0);
            const totalTrumpVotes = data.reduce((sum, d) => sum + d.trumpVotes, 0);
            const trumpPercentage = totalVotes > 0 ? (totalTrumpVotes / totalVotes) * 100 : 0;
            const harrisPercentage = 100 - trumpPercentage;
            
            document.getElementById('simTotalVotes').textContent = totalVotes.toLocaleString();
            document.getElementById('simTrumpPercent').textContent = trumpPercentage.toFixed(1) + '%';
            document.getElementById('simHarrisPercent').textContent = harrisPercentage.toFixed(1) + '%';
        }
        
        // Initialize simulation when scrolled to
        const simulationInitializer = scrollama();
        simulationInitializer
            .setup({
                step: document.querySelectorAll('#election-simulation-viz'),
                offset: 0.9,
                threshold: 4,
                once: true,
            })
            .onStepEnter((response) => {
                console.log("simulation enter");
                if (response.index === 0) {
                    initElectionSimulation();
                }
            });
        
        // Show simulation controls when entering simulation section
        const simulationControlsScroller = scrollama();
        simulationControlsScroller
            .setup({
                step: '#election-simulation-viz',
                offset: 0.5,
                once: true
            })
            .onStepEnter(response => {
                const simulationControls = document.getElementById('simulationControls');
                simulationControls.style.display = 'block';
                setTimeout(() => {
                    simulationControls.style.opacity = '1';
                }, 50);
            });
        
        // Initialize mobile controls
        setupMobileControls();
        
        // Add window resize event listener to make visualizations responsive
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // Re-render all active visualizations when window is resized
                updateAllVisualizationsColorMode();
                
                // Update coin games if active
                if (vizStates.coinGames.coinGames.length > 0) {
                    updateCoinVisualization();
                }
                
                // Update histograms if active
                if (globalVisualizationData.earlyVotingHistogramData) {
                    updateEarlyVotingHistogram();
                }
                if (globalVisualizationData.electionDayHistogramData) {
                    updateElectionDayHistogram();
                }
                
                // Update simulation charts if active
                if (simulation.data) {
                    drawSimulationChart(simulation.data);
                    drawSimulationHistogram(simulation.data);
                }
            }, 250); // Debounce resize events
        });
        
        // Lightbox functionality
        function initLightbox() {
            const lightboxOverlay = document.getElementById('lightbox-overlay');
            const lightboxImage = document.getElementById('lightbox-image');
            const lightboxCaption = document.getElementById('lightbox-caption');
            const lightboxClose = document.getElementById('lightbox-close');
            
            // Add click event to all images with content-image class
            document.querySelectorAll('.content-image').forEach(img => {
                img.addEventListener('click', function() {
                    lightboxImage.src = this.src;
                    lightboxImage.alt = this.alt;
                    lightboxCaption.textContent = this.alt;
                    lightboxOverlay.classList.add('active');
                    document.body.style.overflow = 'hidden'; // Prevent background scrolling
                });
            });
            
            // Close lightbox when clicking close button
            lightboxClose.addEventListener('click', closeLightbox);
            
            // Close lightbox when clicking overlay (but not the image)
            lightboxOverlay.addEventListener('click', function(e) {
                if (e.target === lightboxOverlay) {
                    closeLightbox();
                }
            });
            
            // Close lightbox when clicking overlay container
            document.querySelector('.lightbox-container').addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent closing when clicking the image
            });
            
            // Close lightbox with Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && lightboxOverlay.classList.contains('active')) {
                    closeLightbox();
                }
            });
            
            function closeLightbox() {
                lightboxOverlay.classList.remove('active');
                document.body.style.overflow = ''; // Restore scrolling
            }
        }
        
        // Initialize lightbox when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initLightbox);
        } else {
            initLightbox();
        }
        
        // Table of Contents scroll highlighting
        function initTableOfContents() {
            const tocLinks = document.querySelectorAll('.toc-link');
            
            // Define content areas with their approximate boundaries
            const contentAreas = [
                { id: 'coin-flip', start: '#coin-flip', end: '#eta-introduction' },
                { id: 'eta-introduction', start: '#eta-introduction', end: '#main-chart' },
                { id: 'main-chart', start: '#main-chart', end: '#smoking-gun' },
                { id: 'smoking-gun', start: '#smoking-gun', end: '#clark-county-russian-tail' },
                { id: 'clark-county-russian-tail', start: '#clark-county-russian-tail', end: '#simulation-introduction' },
                { id: 'simulation-analysis', start: '#simulation-introduction', end: '#pattern-of-deception' },
                { id: 'pattern-of-deception', start: '#pattern-of-deception', end: '#conclusion' },
                { id: 'conclusion', start: '#conclusion', end: null } // Last section goes to end
            ];
            
            // Function to get element position
            function getElementTop(selector) {
                const element = document.querySelector(selector);
                return element ? element.offsetTop : 0;
            }
            
            // Function to update active TOC link
            function updateActiveTocLink() {
                const scrollPosition = window.scrollY + 200; // Increased offset for better UX
                let activeSection = null;
                
                // Find the current content area based on scroll position
                for (let i = 0; i < contentAreas.length; i++) {
                    const area = contentAreas[i];
                    const startPos = getElementTop(area.start);
                    const endPos = area.end ? getElementTop(area.end) : document.body.scrollHeight;
                    
                    if (scrollPosition >= startPos && scrollPosition < endPos) {
                        activeSection = area.id;
                        break;
                    }
                }
                
                // If no section found, use the last section if we're near the bottom
                if (!activeSection && (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
                    activeSection = 'conclusion';
                }
                
                // Update TOC links
                tocLinks.forEach(link => {
                    const href = link.getAttribute('href').substring(1); // Remove #
                    if (href === activeSection) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            }
            
            // Throttled scroll handler
            let ticking = false;
            function handleScroll() {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        updateActiveTocLink();
                        ticking = false;
                    });
                    ticking = true;
                }
            }
            
            // Add scroll event listener
            window.addEventListener('scroll', handleScroll);
            
            // Initial call to set active link
            updateActiveTocLink();
            
            // Smooth scroll for TOC links
            tocLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href').substring(1);
                    const targetSection = document.getElementById(targetId);
                    
                    if (targetSection) {
                        targetSection.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });
        }
        
        // Initialize TOC when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initTableOfContents);
        } else {
            initTableOfContents();
        }