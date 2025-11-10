/**
 * Advanced Chart Manager using Chart.js
 * For the Advanced Binance Futures Bot
 */

class AdvancedChartManager {
    constructor(containerId, config = {}) {
        this.container = document.getElementById(containerId);
        this.config = config;
        this.chart = null;
        this.isRealTime = false;
        this.data = [];
        
        // Chart colors - Binance theme
        this.colors = {
            background: 'rgba(26, 26, 26, 0.8)',
            border: '#FCD535',
            text: '#FFFFFF',
            grid: '#333333',
            priceUp: '#00C851',
            priceDown: '#FF4444',
            volume: '#FCD535'
        };
    }

    /**
     * Initialize the price chart
     */
    initializeChart(symbol = 'BTC/USDT', timeframe = '5m') {
        if (!this.container) {
            console.error('Chart container not found');
            return;
        }

        const ctx = this.container.getContext('2d');
        
        // Generate initial data
        this.generateSampleData(symbol);
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.data.map(d => d.time),
                datasets: [{
                    label: 'Price',
                    data: this.data.map(d => d.price),
                    borderColor: this.colors.border,
                    backgroundColor: 'rgba(252, 213, 53, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: this.colors.border,
                    pointHoverBorderColor: '#FFFFFF',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: this.colors.background,
                        titleColor: this.colors.text,
                        bodyColor: this.colors.text,
                        borderColor: this.colors.border,
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            label: (context) => `Price: $${context.parsed.y.toFixed(2)}`
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            color: this.colors.grid,
                            drawBorder: false
                        },
                        ticks: {
                            color: this.colors.text,
                            maxTicksLimit: 8,
                            font: {
                                size: 10
                            }
                        }
                    },
                    y: {
                        display: true,
                        position: 'right',
                        grid: {
                            color: this.colors.grid,
                            drawBorder: false
                        },
                        ticks: {
                            color: this.colors.text,
                            font: {
                                size: 10
                            },
                            callback: (value) => `$${value.toFixed(0)}`
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 0
                    }
                }
            }
        });

        // Start real-time updates if enabled
        if (this.isRealTime) {
            this.startRealTimeUpdates();
        }
    }

    /**
     * Generate sample market data
     */
    generateSampleData(symbol) {
        const now = Date.now();
        const interval = 60000; // 1 minute
        const count = 50;
        
        this.data = [];
        let price = this.getBasePrice(symbol);
        
        for (let i = count - 1; i >= 0; i--) {
            const timestamp = now - (i * interval);
            const time = new Date(timestamp).toLocaleTimeString();
            
            // Simulate price movement
            const change = (Math.random() - 0.5) * (price * 0.01);
            price += change;
            
            this.data.push({
                time,
                price: Math.max(price, 0),
                volume: Math.random() * 1000 + 500
            });
        }
    }

    /**
     * Get base price for a symbol
     */
    getBasePrice(symbol) {
        const basePrices = {
            'BTCUSDT': 45000,
            'ETHUSDT': 2800,
            'BNBUSDT': 320,
            'SOLUSDT': 95,
            'ADAUSDT': 0.45
        };
        return basePrices[symbol] || 45000;
    }

    /**
     * Update chart with new data point
     */
    updateChart(newData) {
        if (!this.chart) return;

        // Add new data point
        this.data.push(newData);
        
        // Keep only last 50 data points
        if (this.data.length > 50) {
            this.data = this.data.slice(-50);
        }

        // Update chart
        this.chart.data.labels = this.data.map(d => d.time);
        this.chart.data.datasets[0].data = this.data.map(d => d.price);
        this.chart.update('none'); // No animation for real-time updates
    }

    /**
     * Start real-time data updates
     */
    startRealTimeUpdates() {
        this.isRealTime = true;
        
        const updateInterval = setInterval(() => {
            if (!this.isRealTime) {
                clearInterval(updateInterval);
                return;
            }

            // Generate new data point
            const lastPrice = this.data[this.data.length - 1]?.price || this.getBasePrice('BTCUSDT');
            const newPrice = lastPrice + (Math.random() - 0.5) * (lastPrice * 0.005);
            
            this.updateChart({
                time: new Date().toLocaleTimeString(),
                price: Math.max(newPrice, 0),
                volume: Math.random() * 1000 + 500
            });
        }, 2000); // Update every 2 seconds
    }

    /**
     * Stop real-time updates
     */
    stopRealTimeUpdates() {
        this.isRealTime = false;
    }

    /**
     * Change symbol
     */
    changeSymbol(newSymbol) {
        this.generateSampleData(newSymbol);
        
        if (this.chart) {
            this.chart.data.labels = this.data.map(d => d.time);
            this.chart.data.datasets[0].data = this.data.map(d => d.price);
            this.chart.update();
        }
    }

    /**
     * Update chart with new data
     */
    updateChart(newData, symbol = 'BTC/USDT') {
        if (!this.chart) {
            console.error('Chart not initialized');
            return;
        }
        
        if (newData && newData.length > 0) {
            // Update data array
            this.data = newData;
            
            // Update chart data
            this.chart.data.labels = this.data.map(d => d.time);
            this.chart.data.datasets[0].data = this.data.map(d => d.price);
            
            // Update chart title if provided
            const chartTitle = document.getElementById('chart-title');
            if (chartTitle && symbol) {
                chartTitle.textContent = `Price Action - ${symbol}`;
            }
            
            // Update the chart
            this.chart.update('none'); // Update without animation for better performance
        } else {
            console.warn('No data provided for chart update');
        }
    }

    /**
     * Destroy chart
     */
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        this.stopRealTimeUpdates();
    }

    /**
     * Resize chart
     */
    resize() {
        if (this.chart) {
            this.chart.resize();
        }
    }
}

// Volume chart for additional market data
class VolumeChartManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.chart = null;
        this.data = [];
    }

    initializeVolumeChart() {
        if (!this.container) return;

        const ctx = this.container.getContext('2d');
        
        // Generate volume data
        this.data = Array.from({length: 50}, () => Math.random() * 1000 + 500);
        
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Array.from({length: 50}, (_, i) => `T${i + 1}`),
                datasets: [{
                    label: 'Volume',
                    data: this.data,
                    backgroundColor: 'rgba(252, 213, 53, 0.6)',
                    borderColor: '#FCD535',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        display: false
                    }
                }
            }
        });
    }
}

// Initialize chart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for trading bot app to initialize
    setTimeout(() => {
        if (window.tradingBotApp && window.tradingBotApp.marketData.length > 0) {
            const chartManager = new AdvancedChartManager('price-chart');
            chartManager.initializeChart();
            
            // Update chart with app data
            const updateChartFromApp = () => {
                if (window.tradingBotApp && chartManager.chart) {
                    const latestData = window.tradingBotApp.marketData[window.tradingBotApp.marketData.length - 1];
                    if (latestData) {
                        chartManager.updateChart(latestData);
                    }
                }
            };
            
            // Update chart every time market data changes
            setInterval(updateChartFromApp, 1000);
        }
    }, 3000);
});