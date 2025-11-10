/**
 * Advanced Binance Futures Trading Bot - Main Application
 * Based on the TSX interface with advanced strategies
 */

class AdvancedTradingBotApp {
    constructor() {
        this.isRunning = false;
        this.botStatus = 'idle';
        this.accountBalance = 0; // Will be fetched from real account
        this.totalPnL = 0;
        this.positions = [];
        this.trades = [];
        this.signals = [];
        this.marketData = [];
        
        // Connection status tracking
        this.connectionStatus = 'connecting';
        this.lastUpdateTime = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        // Initialize with real account data
        this.initializeAccountData();
        
        // Configuration
        this.config = {
            symbol: 'BTCUSDT',
            leverage: 10,
            riskPercent: 1.0,
            strategyMode: 'advanced',
            timeframe: '5m'
        };
        
        // Strategy performance tracking
        this.strategyStats = {
            'EMA Crossover with RSI': { win_rate: 68, trades: 0, profit: 0 },
            'Volume Profile + Order Flow': { win_rate: 72, trades: 0, profit: 0 },
            'Market Structure Break': { win_rate: 65, trades: 0, profit: 0 },
            'Liquidity Sweep + FVG': { win_rate: 75, trades: 0, profit: 0 },
            'Delta Divergence': { win_rate: 70, trades: 0, profit: 0 }
        };
        
        this.setupEventListeners();
        this.generateInitialMarketData();
        
        // Set initial connection status
        this.updateConnectionStatus('connecting', 'Connecting to Binance...');
        
        // Hide loading screen after a short delay if no error occurs
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen && loadingScreen.style.display !== 'none') {
                this.hideLoadingScreen();
            }
        }, 3000);
    }

    async initializeAccountData() {
        try {
            await this.fetchAccountData();
            this.hideLoadingScreen();
        } catch (error) {
            console.error('Failed to fetch account data:', error);
            this.accountBalance = 0;
            this.updateConnectionStatus('error', '❌ Failed to connect to Binance');
            this.showNotification('Failed to connect to Binance account. Using demo mode.', 'warning');
            this.hideLoadingScreen();
        }
    }

    async fetchAccountData() {
        try {
            this.updateConnectionStatus('connecting', 'Connecting to Binance API...');
            
            const response = await fetch('/api/account');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const accountData = await response.json();
            
            // Check if there's an API error
            if (accountData.error) {
                throw new Error(accountData.error);
            }
            
            // Update account balance from real data
            this.accountBalance = accountData.total || 0;
            this.totalPnL = accountData.totalPnL || 0;
            
            // Update positions if available
            if (accountData.positions) {
                this.positions = accountData.positions;
            }
            
            // Update trades history if available
            if (accountData.trades) {
                this.trades = accountData.trades;
            }
            
            // Update connection status to connected
            this.retryCount = 0;
            this.updateConnectionStatus('connected', '✅ Connected to Binance', this.accountBalance);
            this.lastUpdateTime = new Date();
            this.updateLastUpdateTime();
            
            console.log('Account data fetched successfully:', accountData);
            
            // Show appropriate notification based on account status
            if (this.accountBalance > 0) {
                this.showNotification(`✅ Connected to Binance (Balance: $${this.accountBalance.toFixed(2)})`, 'success');
            } else {
                this.showNotification('⚠️ Connected to Binance, but account balance is $0.00', 'warning');
            }
            
        } catch (error) {
            console.error('Error fetching account data:', error);
            this.accountBalance = 0; // Reset balance on error
            this.retryCount++;
            
            // Update connection status to error
            this.updateConnectionStatus('error', '❌ Connection failed', error.message);
            
            // Show error notification with retry info
            const retryMessage = this.retryCount < this.maxRetries ? 
                ` (Retrying... ${this.retryCount}/${this.maxRetries})` : 
                ' (Check your API keys)';
            
            this.showNotification(`❌ Failed to connect to Binance${retryMessage}`, 'error');
            throw error;
        }
    }

    async refreshAccountData() {
        await this.fetchAccountData();
        this.updateUI();
    }

    startPeriodicUpdates() {
        // Update account data every 30 seconds while bot is running
        this.updateInterval = setInterval(() => {
            if (this.isRunning) {
                this.fetchAccountData().then(() => {
                    this.updateLastUpdateTime();
                }).catch(error => {
                    console.error('Failed to update account data:', error);
                });
            }
        }, 30000);
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const app = document.getElementById('app');
        
        if (loadingScreen && app) {
            loadingScreen.style.display = 'none';
            app.style.display = 'block';
            
            // Show connection status after loading
            setTimeout(() => {
                this.updateUI();
            }, 100);
        }
    }

    setupEventListeners() {
        // Start Bot
        document.getElementById('start-bot')?.addEventListener('click', () => this.startBot());
        
        // Stop Bot
        document.getElementById('stop-bot')?.addEventListener('click', () => this.stopBot());
        
        // Reset Bot
        document.getElementById('reset-bot')?.addEventListener('click', () => this.resetBot());
        
        // Configuration changes
        document.getElementById('symbol-select')?.addEventListener('change', (e) => {
            this.config.symbol = e.target.value;
            this.updateChartTitle();
        });
        
        document.getElementById('leverage-select')?.addEventListener('change', (e) => {
            this.config.leverage = parseInt(e.target.value);
        });
        
        document.getElementById('risk-percent')?.addEventListener('input', (e) => {
            this.config.riskPercent = parseFloat(e.target.value);
        });
        
        document.getElementById('timeframe-select')?.addEventListener('change', (e) => {
            this.config.timeframe = e.target.value;
        });
        
        document.getElementById('strategy-mode')?.addEventListener('change', (e) => {
            this.config.strategyMode = e.target.value;
        });
        
        // Custom symbol input
        document.getElementById('custom-symbol')?.addEventListener('keyup', (e) => {
            // Auto uppercase and validate format
            e.target.value = e.target.value.toUpperCase();
            // Remove any non-alphanumeric characters except slash
            e.target.value = e.target.value.replace(/[^A-Z0-9\/_]/g, '');
        });
        
        // Add symbol to dropdown
        document.getElementById('add-symbol-btn')?.addEventListener('click', () => {
            this.addCustomSymbol();
        });
        
        // Fetch chart for custom symbol
        document.getElementById('fetch-chart-btn')?.addEventListener('click', () => {
            this.fetchAndDisplayChart();
        });
        
        // Enter key support for custom symbol
        document.getElementById('custom-symbol')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.fetchAndDisplayChart();
            }
        });
    }

    async startBot() {
        try {
            // First, check if we have a valid account balance
            if (this.accountBalance <= 0) {
                this.showNotification('⚠️ No trading balance detected. Please check your Binance account.', 'warning');
                
                // Try to fetch fresh account data
                try {
                    await this.fetchAccountData();
                    if (this.accountBalance <= 0) {
                        this.showNotification('Account balance is 0.00. Trading will not execute with real money.', 'error');
                        return;
                    }
                } catch (error) {
                    this.showNotification('Failed to connect to Binance account. Running in demo mode.', 'warning');
                }
            }
            
            // Start bot via backend API (real trading)
            const response = await fetch('/api/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                this.isRunning = true;
                this.botStatus = 'running';
                this.updateUI();
                this.showNotification(result.message, 'success');
                
                // Start periodic data updates
                this.startPeriodicUpdates();
            } else {
                throw new Error('Failed to start bot via API');
            }
            
        } catch (error) {
            console.error('Failed to start bot:', error);
            
            // Fallback: Warn about simulation mode
            this.isRunning = true;
            this.botStatus = 'running';
            this.updateUI();
            this.showNotification('⚠️ Bot started in DEMO/SIMULATION mode. No real trades will be executed.', 'warning');
            this.startSimulationLoop();
        }
    }

    stopBot() {
        this.isRunning = false;
        this.botStatus = 'stopped';
        this.updateUI();
        
        // Stop periodic updates
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        // Call backend API to stop bot
        fetch('/api/stop', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => response.json())
          .then(result => {
              console.log('Bot stopped:', result);
          })
          .catch(error => {
              console.error('Failed to stop bot via API:', error);
          });
    }

    resetBot() {
        this.isRunning = false;
        this.botStatus = 'idle';
        this.positions = [];
        this.trades = [];
        this.signals = [];
        this.marketData = [];
        
        // Reset strategy stats
        Object.keys(this.strategyStats).forEach(strategy => {
            this.strategyStats[strategy].trades = 0;
            this.strategyStats[strategy].profit = 0;
        });
        
        this.generateInitialMarketData();
        this.updateUI();
        
        // Refresh account data from real Binance account
        this.refreshAccountData();
    }

    generateInitialMarketData() {
        const data = [];
        let price = 45000;
        for (let i = 0; i < 50; i++) {
            price += (Math.random() - 0.5) * 500;
            data.push({
                time: new Date(Date.now() - (50 - i) * 60000).toLocaleTimeString(),
                price: price,
                volume: Math.random() * 1000 + 500
            });
        }
        this.marketData = data;
    }

    startSimulationLoop() {
        const interval = setInterval(() => {
            if (!this.isRunning) {
                clearInterval(interval);
                return;
            }
            
            // Safety check: Stop simulation if account balance is zero
            if (this.accountBalance <= 0) {
                console.log('⚠️ Simulation stopped: Account balance is $' + this.accountBalance.toFixed(2));
                this.isRunning = false;
                this.botStatus = 'stopped';
                this.updateUI();
                this.showNotification('Simulation stopped: Insufficient account balance', 'warning');
                clearInterval(interval);
                return;
            }
            
            // Simulate trading activity
            if (Math.random() > 0.7) {
                const strategies = Object.keys(this.strategyStats);
                const randomStrategy = strategies[Math.floor(Math.random() * strategies.length)];
                
                const newSignal = {
                    id: Date.now(),
                    strategy: randomStrategy,
                    type: Math.random() > 0.5 ? 'LONG' : 'SHORT',
                    price: 45000 + (Math.random() - 0.5) * 2000,
                    confidence: (Math.random() * 30 + 70).toFixed(1),
                    timestamp: new Date().toLocaleTimeString()
                };
                
                this.addSignal(newSignal);
                
                // Sometimes execute trade (only if balance allows)
                if (Math.random() > 0.6 && this.positions.length < 3 && this.accountBalance > 0) {
                    const tradeExecuted = this.executeTrade(newSignal);
                    if (tradeExecuted) {
                        console.log('✅ Trade simulated successfully');
                    }
                }
            }
            
            // Update positions
            this.updatePositions();
            
            // Update market data
            this.updateMarketData();
            
            // Update UI
            this.updateUI();
            
        }, 2000);
    }

    addSignal(signal) {
        this.signals.unshift(signal);
        if (this.signals.length > 10) {
            this.signals = this.signals.slice(0, 10);
        }
    }

    executeTrade(signal) {
        // Safety check: Don't execute trades with zero or insufficient balance
        if (this.accountBalance <= 0) {
            console.log('Trade blocked: Insufficient balance ($' + this.accountBalance.toFixed(2) + ')');
            return false;
        }
        
        const positionSize = (this.accountBalance * this.config.riskPercent / 100 * this.config.leverage);
        
        // Additional safety check for minimum position size
        if (positionSize < 10) { // Minimum $10 position
            console.log('Trade blocked: Position size too small ($' + positionSize.toFixed(2) + ')');
            return false;
        }
        
        const position = {
            id: Date.now(),
            symbol: this.config.symbol,
            type: signal.type,
            entry: signal.price,
            size: positionSize.toFixed(2),
            leverage: this.config.leverage,
            pnl: 0,
            strategy: signal.strategy
        };
        
        this.positions.push(position);
        return true;
    }

    updatePositions() {
        this.positions = this.positions.filter(pos => {
            const pnlChange = (Math.random() - 0.48) * 50;
            const newPnl = pos.pnl + pnlChange;
            
            // Close position if profit target or stop loss hit
            if (Math.abs(newPnl) > 200 || Math.random() > 0.95) {
                const trade = {
                    ...pos,
                    exit: pos.entry + (pos.type === 'LONG' ? newPnl : -newPnl),
                    pnl: newPnl,
                    closeTime: new Date().toLocaleTimeString()
                };
                
                this.completeTrade(trade);
                return false; // Remove position
            }
            
            pos.pnl = newPnl;
            return true; // Keep position
        });
    }

    completeTrade(trade) {
        this.trades.unshift(trade);
        if (this.trades.length > 20) {
            this.trades = this.trades.slice(0, 20);
        }
        
        this.totalPnL += trade.pnl;
        this.accountBalance += trade.pnl;
        
        // Update strategy stats
        if (this.strategyStats[trade.strategy]) {
            this.strategyStats[trade.strategy].trades += 1;
            this.strategyStats[trade.strategy].profit += trade.pnl;
        }
    }

    updateMarketData() {
        if (this.marketData.length === 0) return;
        
        const last = this.marketData[this.marketData.length - 1];
        const newPrice = last.price + (Math.random() - 0.5) * 300;
        
        this.marketData.push({
            time: new Date().toLocaleTimeString(),
            price: newPrice,
            volume: Math.random() * 1000 + 500
        });
        
        if (this.marketData.length > 50) {
            this.marketData = this.marketData.slice(1);
        }
    }

    updateUI() {
        // Update stats cards
        this.updateStatsCards();
        
        // Update positions
        this.updatePositionsDisplay();
        
        // Update signals
        this.updateSignalsDisplay();
        
        // Update trade history
        this.updateTradesDisplay();
        
        // Update strategy performance
        this.updateStrategyPerformance();
        
        // Update control buttons
        this.updateControlButtons();
    }

    updateStatsCards() {
        // Account Balance
        const balanceElement = document.getElementById('account-balance');
        if (balanceElement) {
            balanceElement.textContent = `$${this.accountBalance.toFixed(2)}`;
            
            // Add warning indicator if balance is zero
            if (this.accountBalance <= 0) {
                balanceElement.style.color = '#ff6b6b';
                balanceElement.title = 'Zero balance - No real trading will occur';
            } else {
                balanceElement.style.color = '';
                balanceElement.title = '';
            }
        }
        
        // Total P&L
        const pnlElement = document.getElementById('total-pnl');
        if (pnlElement) {
            pnlElement.textContent = `${this.totalPnL >= 0 ? '+' : ''}$${this.totalPnL.toFixed(2)}`;
            pnlElement.className = `stat-value ${this.totalPnL >= 0 ? 'positive' : 'negative'}`;
        }
        
        // P&L Change
        const pnlChangeElement = document.getElementById('pnl-change');
        if (pnlChangeElement) {
            const changePercent = this.accountBalance > 0 
                ? ((this.totalPnL / (this.accountBalance - this.totalPnL)) * 100).toFixed(1)
                : 0;
            pnlChangeElement.textContent = `${changePercent >= 0 ? '+' : ''}${changePercent}%`;
            pnlChangeElement.className = `stat-change ${this.totalPnL >= 0 ? 'positive' : 'negative'}`;
        }
        
        // Win Rate
        const winRate = this.trades.length > 0 
            ? ((this.trades.filter(t => t.pnl > 0).length / this.trades.length) * 100).toFixed(1)
            : 0;
        
        const winRateElement = document.getElementById('win-rate');
        const winRateChangeElement = document.getElementById('win-rate-change');
        
        if (winRateElement) {
            winRateElement.textContent = `${winRate}%`;
        }
        if (winRateChangeElement) {
            winRateChangeElement.textContent = `${this.trades.length} trades`;
            winRateChangeElement.className = `stat-change ${this.trades.length > 0 ? 'positive' : ''}`;
        }
        
        // Status
        const statusElement = document.getElementById('bot-status');
        const botModeElement = document.getElementById('bot-mode');
        
        if (statusElement) {
            statusElement.textContent = this.botStatus;
        }
        if (botModeElement) {
            botModeElement.textContent = 'Live Trading';
            botModeElement.className = 'stat-change';
        }
    }

    updatePositionsDisplay() {
        const positionsCount = document.getElementById('positions-count');
        const positionsList = document.getElementById('positions-list');
        
        positionsCount.textContent = this.positions.length;
        
        if (this.positions.length === 0) {
            positionsList.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">No open positions</p>';
        } else {
            positionsList.innerHTML = this.positions.map(pos => `
                <div class="p-3 mb-2 rounded-lg border-l-4" style="background: rgba(42, 42, 42, 0.5); border-color: var(--accent-500);">
                    <div class="flex justify-between items-start mb-2">
                        <span class="font-bold text-sm ${pos.type === 'LONG' ? 'text-green-400' : 'text-red-400'}">
                            ${pos.type} ${pos.symbol}
                        </span>
                        <span class="text-xs text-gray-400">${pos.leverage}x</span>
                    </div>
                    <p class="text-xs text-gray-400 mb-1">${pos.strategy}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-xs">Entry: $${pos.entry.toFixed(2)}</span>
                        <span class="font-bold text-sm ${pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}">
                            ${pos.pnl >= 0 ? '+' : ''}$${pos.pnl.toFixed(2)}
                        </span>
                    </div>
                </div>
            `).join('');
        }
    }

    updateSignalsDisplay() {
        const signalsList = document.getElementById('signals-list');
        
        if (this.signals.length === 0) {
            signalsList.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">Waiting for signals...</p>';
        } else {
            signalsList.innerHTML = this.signals.map(signal => `
                <div class="p-3 mb-2 rounded-lg" style="background: rgba(42, 42, 42, 0.5);">
                    <div class="flex justify-between items-start mb-1">
                        <span class="font-bold text-sm ${signal.type === 'LONG' ? 'text-green-400' : 'text-red-400'}">
                            ${signal.type}
                        </span>
                        <span class="text-xs" style="color: var(--accent-500);">${signal.confidence}%</span>
                    </div>
                    <p class="text-xs text-gray-400 mb-1">${signal.strategy}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-xs">@ $${signal.price.toFixed(2)}</span>
                        <span class="text-xs text-gray-500">${signal.timestamp}</span>
                    </div>
                </div>
            `).join('');
        }
    }

    updateTradesDisplay() {
        const tradesList = document.getElementById('trades-list');
        
        if (this.trades.length === 0) {
            tradesList.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">No completed trades</p>';
        } else {
            tradesList.innerHTML = this.trades.map(trade => `
                <div class="p-3 mb-2 rounded-lg" style="background: rgba(42, 42, 42, 0.5);">
                    <div class="flex justify-between items-start mb-1">
                        <span class="font-bold text-sm ${trade.type === 'LONG' ? 'text-green-400' : 'text-red-400'}">
                            ${trade.type} ${trade.symbol}
                        </span>
                        <span class="font-bold text-sm ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}">
                            ${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}
                        </span>
                    </div>
                    <p class="text-xs text-gray-400">${trade.strategy}</p>
                    <p class="text-xs text-gray-500 mt-1">${trade.closeTime}</p>
                </div>
            `).join('');
        }
    }

    updateStrategyPerformance() {
        // Update each strategy's stats
        Object.keys(this.strategyStats).forEach(strategy => {
            const stats = this.strategyStats[strategy];
            const strategyId = strategy.toLowerCase().replace(/[^a-z0-9]/g, '-');
            
            // Update trades count
            const tradesElement = document.getElementById(`${strategyId}-trades`);
            if (tradesElement) {
                tradesElement.textContent = `${stats.trades} trades`;
            }
            
            // Update profit
            const profitElement = document.getElementById(`${strategyId}-profit`);
            if (profitElement) {
                const sign = stats.profit >= 0 ? '+' : '';
                profitElement.textContent = `$${sign}$${stats.profit.toFixed(2)}`;
                profitElement.className = `text-xs text-gray-400 ${stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`;
            }
        });
    }

    updateControlButtons() {
        const startBtn = document.getElementById('start-bot');
        const stopBtn = document.getElementById('stop-bot');
        
        if (startBtn) startBtn.disabled = this.isRunning;
        if (stopBtn) stopBtn.disabled = !this.isRunning;
    }

    updateChartTitle() {
        const chartTitle = document.getElementById('chart-title');
        if (chartTitle) {
            chartTitle.textContent = `Price Action - ${this.config.symbol}`;
        }
    }

    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Display notification in UI
        const notifications = document.getElementById('notifications');
        if (!notifications) return;
        
        const notification = document.createElement('div');
        notification.className = `p-4 mb-3 rounded-lg shadow-lg border-l-4 ${
            type === 'success' ? 'bg-green-800 border-green-400 text-green-100' :
            type === 'error' ? 'bg-red-800 border-red-400 text-red-100' :
            type === 'warning' ? 'bg-yellow-800 border-yellow-400 text-yellow-100' :
            'bg-blue-800 border-blue-400 text-blue-100'
        }`;
        
        notification.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="text-sm font-medium">${message}</span>
                <button class="ml-3 text-lg leading-none hover:opacity-75" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        notifications.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    updateConnectionStatus(status, message, balance = null) {
        this.connectionStatus = status;
        const statusElement = document.getElementById('connection-status');
        const textElement = document.getElementById('connection-text');
        
        if (statusElement && textElement) {
            // Remove all status classes
            statusElement.classList.remove('connected', 'disconnected', 'connecting', 'error');
            
            // Add new status class
            statusElement.classList.add(status);
            
            // Update text
            if (balance !== null && status === 'connected') {
                textElement.textContent = `${message} - $${balance.toFixed(2)}`;
            } else {
                textElement.textContent = message;
            }
            
            // Log status change
            console.log(`🔗 Connection Status: ${status.toUpperCase()} - ${message}`);
        }
    }

    updateLastUpdateTime() {
        const lastUpdateElement = document.getElementById('last-update');
        if (lastUpdateElement && this.lastUpdateTime) {
            const now = new Date();
            const diffMs = now - this.lastUpdateTime;
            const diffMins = Math.floor(diffMs / 60000);
            const diffSecs = Math.floor((diffMs % 60000) / 1000);
            
            let timeText = '';
            if (diffMins > 0) {
                timeText = `${diffMins}m ${diffSecs}s ago`;
            } else {
                timeText = `${diffSecs}s ago`;
            }
            
            lastUpdateElement.textContent = `Last update: ${timeText}`;
        }
    }

    addCustomSymbol() {
        const customInput = document.getElementById('custom-symbol');
        const symbolSelect = document.getElementById('symbol-select');
        
        if (!customInput || !symbolSelect) return;
        
        const symbol = customInput.value.trim().toUpperCase();
        
        if (!symbol) {
            this.showNotification('Please enter a symbol', 'warning');
            return;
        }
        
        // Validate symbol format (basic validation)
        if (!/^[A-Z0-9\/]+$/.test(symbol)) {
            this.showNotification('Invalid symbol format. Use letters, numbers, and / only.', 'error');
            return;
        }
        
        // Check if symbol already exists in dropdown
        const existingOptions = Array.from(symbolSelect.options).map(opt => opt.value);
        if (existingOptions.includes(symbol)) {
            this.showNotification('Symbol already exists in dropdown', 'warning');
            return;
        }
        
        // Add to dropdown
        const option = document.createElement('option');
        option.value = symbol;
        option.textContent = symbol;
        symbolSelect.appendChild(option);
        
        // Select the new symbol
        symbolSelect.value = symbol;
        this.config.symbol = symbol;
        this.updateChartTitle();
        
        // Clear input
        customInput.value = '';
        
        this.showNotification(`Added ${symbol} to symbol list`, 'success');
    }

    async fetchAndDisplayChart() {
        const customInput = document.getElementById('custom-symbol');
        const symbolSelect = document.getElementById('symbol-select');
        
        if (!customInput || !symbolSelect) return;
        
        const symbol = customInput.value.trim().toUpperCase();
        
        if (!symbol) {
            this.showNotification('Please enter a symbol to fetch chart', 'warning');
            return;
        }
        
        // Validate symbol format
        if (!/^[A-Z0-9\/]+$/.test(symbol)) {
            this.showNotification('Invalid symbol format. Use letters, numbers, and / only.', 'error');
            return;
        }
        
        try {
            // Update the config to use the new symbol
            this.config.symbol = symbol;
            this.updateChartTitle();
            
            // Update the dropdown selection
            symbolSelect.value = symbol;
            
            // Generate market data for the new symbol
            await this.generateMarketDataForSymbol(symbol);
            
            // Update the chart with new data
            if (window.chartManager) {
                window.chartManager.updateChart(this.marketData, symbol);
            }
            
            // Clear the input
            customInput.value = '';
            
            this.showNotification(`Chart loaded for ${symbol}`, 'success');
            
        } catch (error) {
            console.error('Error fetching chart data:', error);
            this.showNotification(`Failed to load chart for ${symbol}: ${error.message}`, 'error');
        }
    }

    async generateMarketDataForSymbol(symbol) {
        // This is a simulation function that would normally fetch real data
        // In a real implementation, this would call the Binance API
        
        const data = [];
        let basePrice = this.getBasePriceForSymbol(symbol);
        
        for (let i = 0; i < 50; i++) {
            const volatility = this.getVolatilityForSymbol(symbol);
            const change = (Math.random() - 0.5) * volatility;
            basePrice += change;
            
            data.push({
                time: new Date(Date.now() - (50 - i) * 60000).toLocaleTimeString(),
                price: basePrice,
                volume: Math.random() * 1000 + 500,
                symbol: symbol
            });
        }
        
        this.marketData = data;
        this.updateMarketDisplay();
        
        // Add to recent symbols for quick access
        this.addToRecentSymbols(symbol);
    }

    updateMarketDisplay() {
        // This method can be expanded to update other market-related displays
        // For now, it will just update the chart if needed
        if (window.chartManager && this.marketData.length > 0) {
            window.chartManager.updateChart(this.marketData, this.config.symbol);
        }
    }

    getBasePriceForSymbol(symbol) {
        // Return realistic base prices for common symbols
        const priceMap = {
            'BTC': 45000,
            'ETH': 2800,
            'BNB': 320,
            'SOL': 95,
            'ADA': 0.45,
            'DOT': 6.5,
            'MATIC': 0.85,
            'LINK': 14.5,
            'UNI': 6.8,
            'ATOM': 9.2,
            'FIL': 4.8,
            'LTC': 75,
            'BCH': 110,
            'XRP': 0.52,
            'DOGE': 0.08,
            'SHIB': 0.00001
        };
        
        // Extract the base asset (before USDT)
        const baseAsset = symbol.split('USDT')[0] || symbol.split('/')[0];
        return priceMap[baseAsset] || 1.0; // Default to 1 if unknown
    }

    getVolatilityForSymbol(symbol) {
        // Return appropriate volatility for symbol type
        const highVolatility = ['BTC', 'ETH', 'DOGE', 'SHIB'];
        const mediumVolatility = ['BNB', 'SOL', 'ADA', 'DOT', 'MATIC'];
        const lowVolatility = ['LINK', 'UNI', 'ATOM', 'FIL', 'LTC', 'BCH', 'XRP'];
        
        const baseAsset = symbol.split('USDT')[0] || symbol.split('/')[0];
        
        if (highVolatility.includes(baseAsset)) return baseAsset * 0.02;
        if (mediumVolatility.includes(baseAsset)) return baseAsset * 0.015;
        if (lowVolatility.includes(baseAsset)) return baseAsset * 0.01;
        
        return 1.0; // Default volatility
    }

    addToRecentSymbols(symbol) {
        // Store recently used symbols in localStorage
        const recentSymbols = JSON.parse(localStorage.getItem('recentSymbols') || '[]');
        
        // Remove if already exists
        const filtered = recentSymbols.filter(s => s !== symbol);
        
        // Add to front
        filtered.unshift(symbol);
        
        // Keep only last 10
        const trimmed = filtered.slice(0, 10);
        
        localStorage.setItem('recentSymbols', JSON.stringify(trimmed));
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Hide loading screen after a short delay
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        const app = document.getElementById('app');
        
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (app) app.style.display = 'block';
        
        // Initialize the trading bot app
        window.tradingBotApp = new AdvancedTradingBotApp();
        
        // Initialize chart manager
        const chartCanvas = document.getElementById('price-chart');
        if (chartCanvas) {
            window.chartManager = new AdvancedChartManager('price-chart');
        }
        
    }, 2000);
});