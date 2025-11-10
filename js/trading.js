/**
 * Trading Execution Logic
 * Binance Futures Trading Bot
 */

class TradingManager {
    constructor(api, config) {
        this.api = api;
        this.config = config;
        this.positions = new Map();
        this.orders = new Map();
        this.isRunning = false;
        this.maxPositions = this.config.get('trading.maxPositions') || 3;
        this.riskPercent = this.config.get('trading.riskPercent') || 1.0;
        this.tradingMode = this.config.get('trading.tradingMode') || 'live';
        this.symbol = this.config.get('trading.symbol') || 'BTCUSDT';
        this.leverage = this.config.get('trading.leverage') || 10;
        
        this.dailyStats = {
            trades: 0,
            wins: 0,
            losses: 0,
            totalPnL: 0,
            startTime: Date.now()
        };
        
        this.riskLimits = {
            maxDrawdown: this.config.get('risk.maxDrawdownPercent') || 10.0,
            dailyLoss: this.config.get('risk.dailyLossLimitPercent') || 3.0,
            maxRisk: this.config.get('trading.riskPercent') || 1.0
        };
    }
    
    // Update configuration
    updateConfig(config) {
        this.config = config;
        this.maxPositions = config.get('trading.maxPositions') || 3;
        this.riskPercent = config.get('trading.riskPercent') || 1.0;
        this.tradingMode = config.get('trading.tradingMode') || 'live';
        this.symbol = config.get('trading.symbol') || 'BTCUSDT';
        this.leverage = config.get('trading.leverage') || 10;
        
        this.riskLimits = {
            maxDrawdown: this.config.get('risk.maxDrawdownPercent') || 10.0,
            dailyLoss: this.config.get('risk.dailyLossLimitPercent') || 3.0,
            maxRisk: this.config.get('trading.riskPercent') || 1.0
        };
    }
    
    // Start trading
    async start() {
        if (this.isRunning) {
            console.warn('Trading already running');
            return;
        }
        
        this.isRunning = true;
        
        try {
            // Validate account
            if (this.tradingMode === 'live') {
                await this.validateAccount();
            }
            
            // Load existing positions
            await this.loadPositions();
            
            // Start risk monitoring
            this.startRiskMonitoring();
            
            console.log(`Trading started in ${this.tradingMode} mode`);
        } catch (error) {
            console.error('Failed to start trading:', error);
            this.isRunning = false;
            throw error;
        }
    }
    
    // Stop trading
    stop() {
        if (!this.isRunning) {
            return;
        }
        
        this.isRunning = false;
        
        // Stop risk monitoring
        this.stopRiskMonitoring();
        
        console.log('Trading stopped');
    }
    
    // Validate account for trading
    async validateAccount() {
        try {
            const account = await this.api.getAccount();
            const symbolInfo = await this.getSymbolInfo();
            
            if (!symbolInfo) {
                throw new Error(`Symbol ${this.symbol} not found or not available for trading`);
            }
            
            // Check if trading is allowed
            if (!account.canTrade) {
                throw new Error('Trading is disabled on this account');
            }
            
            console.log('Account validation successful');
            return true;
        } catch (error) {
            console.error('Account validation failed:', error);
            throw error;
        }
    }
    
    // Get symbol information
    async getSymbolInfo() {
        try {
            const exchangeInfo = await this.api.getExchangeInfo();
            return exchangeInfo.symbols.find(s => s.symbol === this.symbol);
        } catch (error) {
            console.error('Failed to get symbol info:', error);
            return null;
        }
    }
    
    // Load existing positions
    async loadPositions() {
        try {
            const positions = await this.api.getPosition();
            const openPositions = positions.filter(p => 
                Math.abs(parseFloat(p.positionAmt)) > 0
            );
            
            this.positions.clear();
            
            for (const position of openPositions) {
                const positionData = {
                    symbol: position.symbol,
                    side: parseFloat(position.positionAmt) > 0 ? 'long' : 'short',
                    size: Math.abs(parseFloat(position.positionAmt)),
                    entryPrice: parseFloat(position.entryPrice),
                    markPrice: parseFloat(position.markPrice),
                    unrealizedPnL: parseFloat(position.unRealizedProfit),
                    margin: parseFloat(position.initialMargin) + parseFloat(position.maintMargin),
                    leverage: parseInt(position.leverage),
                    maxNotional: parseFloat(position.maxNotional),
                    openTime: Date.now(), // This would need to be stored properly
                    orderId: null,
                    strategy: 'manual'
                };
                
                this.positions.set(position.symbol, positionData);
            }
            
            console.log(`Loaded ${this.positions.size} open positions`);
        } catch (error) {
            console.error('Failed to load positions:', error);
        }
    }
    
    // Execute trade based on signal
    async executeSignal(signal) {
        if (!this.isRunning) {
            throw new Error('Trading is not running');
        }
        
        // Risk checks
        if (!(await this.checkRiskLimits(signal))) {
            throw new Error('Risk limits exceeded');
        }
        
        // Position size calculation
        const positionSize = await this.calculatePositionSize(signal);
        if (positionSize <= 0) {
            throw new Error('Invalid position size calculated');
        }
        
        // Create order
        const orderParams = {
            symbol: this.symbol,
            side: signal.direction === 'long' ? 'BUY' : 'SELL',
            type: 'MARKET',
            quantity: positionSize.toString(),
            timeInForce: 'GTC'
        };
        
        try {
            // Execute real order
            const result = await this.api.newOrder(orderParams);
            
            // Record position
            const position = {
                symbol: this.symbol,
                side: signal.direction,
                size: positionSize,
                entryPrice: signal.price,
                markPrice: signal.price,
                unrealizedPnL: 0,
                margin: this.calculateMargin(positionSize, signal.price),
                leverage: this.leverage,
                openTime: Date.now(),
                orderId: result.orderId,
                strategy: signal.strategy,
                signal: signal
            };
            
            this.positions.set(this.symbol, position);
            
            // Add stop loss and take profit
            await this.addRiskManagementOrders(position);
            
            // Update statistics
            this.dailyStats.trades++;
            
            console.log(`Trade executed: ${signal.direction} ${positionSize} ${this.symbol} at ${signal.price}`);
            
            this.emit('tradeExecuted', { signal, position, order: result });
            
            return position;
            
        } catch (error) {
            console.error('Trade execution failed:', error);
            this.emit('tradeFailed', { signal, error });
            throw error;
        }
    }
    

    
    // Calculate position size based on risk
    async calculatePositionSize(signal) {
        try {
            const account = await this.api.getBalance();
            const usdtBalance = account.find(b => b.asset === 'USDT');
            const availableBalance = parseFloat(usdtBalance ? usdtBalance.availableBalance : '0')
            
            // Calculate risk amount
            const riskAmount = (availableBalance * this.riskPercent) / 100;
            
            // Get current price
            const currentPrice = signal.price || await this.api.getCurrentPrice(this.symbol);
            if (!currentPrice) {
                throw new Error('Unable to get current price');
            }
            
            // Calculate position size
            const riskPerUnit = currentPrice * (this.config.get('risk.stopLossPercent') || 2.0) / 100;
            const positionSize = Math.floor(riskAmount / riskPerUnit);
            
            // Get symbol precision
            const symbolInfo = await this.getSymbolInfo();
            const lotSizeFilter = symbolInfo.filters.find(f => f.filterType === 'LOT_SIZE');
            
            if (lotSizeFilter) {
                const stepSize = parseFloat(lotSizeFilter.stepSize);
                positionSize = Math.floor(positionSize / stepSize) * stepSize;
            }
            
            return positionSize;
        } catch (error) {
            console.error('Failed to calculate position size:', error);
            return 0;
        }
    }
    
    // Calculate margin required
    calculateMargin(positionSize, price) {
        const positionValue = positionSize * price;
        return positionValue / this.leverage;
    }
    
    // Add stop loss and take profit orders
    async addRiskManagementOrders(position) {
        const stopLossPercent = this.config.get('risk.stopLossPercent') || 2.0;
        const takeProfitPercent = this.config.get('risk.takeProfitPercent') || 6.0;
        
        const stopLossPrice = position.side === 'long' 
            ? position.entryPrice * (1 - stopLossPercent / 100)
            : position.entryPrice * (1 + stopLossPercent / 100);
            
        const takeProfitPrice = position.side === 'long'
            ? position.entryPrice * (1 + takeProfitPercent / 100)
            : position.entryPrice * (1 - takeProfitPercent / 100);
        
        const stopLossOrder = {
            symbol: this.symbol,
            side: position.side === 'long' ? 'SELL' : 'BUY',
            type: 'STOP_MARKET',
            quantity: position.size.toString(),
            stopPrice: stopLossPrice.toString(),
            timeInForce: 'GTC'
        };
        
        const takeProfitOrder = {
            symbol: this.symbol,
            side: position.side === 'long' ? 'SELL' : 'BUY',
            type: 'TAKE_PROFIT_MARKET',
            quantity: position.size.toString(),
            stopPrice: takeProfitPrice.toString(),
            timeInForce: 'GTC'
        };
        
        try {
            // Execute real orders
            const slOrder = await this.api.newOrder(stopLossOrder);
            const tpOrder = await this.api.newOrder(takeProfitOrder);
            
            this.orders.set(`stop_${position.orderId}`, slOrder);
            this.orders.set(`tp_${position.orderId}`, tpOrder);
            
            console.log(`Risk management orders added: SL ${stopLossPrice}, TP ${takeProfitPrice}`);
        } catch (error) {
            console.error('Failed to add risk management orders:', error);
        }
    }
    
    // Check risk limits
    async checkRiskLimits(signal) {
        // Check maximum positions
        if (this.positions.size >= this.maxPositions) {
            throw new Error(`Maximum positions (${this.maxPositions}) reached`);
        }
        
        // Check daily loss limit
        if (this.dailyStats.totalPnL < 0 && Math.abs(this.dailyStats.totalPnL) > this.dailyStats.dailyLoss) {
            throw new Error('Daily loss limit exceeded');
        }
        
        // Check if we have an existing position in the same direction
        const existingPosition = this.positions.get(this.symbol);
        if (existingPosition && existingPosition.side === signal.direction) {
            throw new Error(`Already have a ${signal.direction} position open`);
        }
        
        return true;
    }
    
    // Close position
    async closePosition(symbol, reason = 'manual') {
        const position = this.positions.get(symbol);
        if (!position) {
            throw new Error(`No position found for ${symbol}`);
        }
        
        const closeOrder = {
            symbol: symbol,
            side: position.side === 'long' ? 'SELL' : 'BUY',
            type: 'MARKET',
            quantity: position.size.toString(),
            timeInForce: 'GTC'
        };
        
        try {
            // Execute real order
            const result = await this.api.newOrder(closeOrder);
            
            // Calculate final P&L
            const pnl = this.calculatePnL(position, result.price || position.markPrice);
            
            // Update statistics
            if (pnl > 0) {
                this.dailyStats.wins++;
            } else {
                this.dailyStats.losses++;
            }
            this.dailyStats.totalPnL += pnl;
            
            // Remove position and associated orders
            this.positions.delete(symbol);
            
            // Close risk management orders
            await this.closeRiskManagementOrders(position);
            
            console.log(`Position closed: ${symbol} P&L: ${pnl.toFixed(2)} (${reason})`);
            
            this.emit('positionClosed', { position, pnl, reason, order: result });
            
            return { position, pnl, order: result };
            
        } catch (error) {
            console.error('Failed to close position:', error);
            this.emit('closePositionFailed', { position, error });
            throw error;
        }
    }
    

    
    // Close risk management orders
    async closeRiskManagementOrders(position) {
        const stopOrderId = `stop_${position.orderId}`;
        const tpOrderId = `tp_${position.orderId}`;
        
        if (this.orders.has(stopOrderId)) {
            // In a real implementation, we would cancel the stop loss order
            this.orders.delete(stopOrderId);
        }
        
        if (this.orders.has(tpOrderId)) {
            // In a real implementation, we would cancel the take profit order
            this.orders.delete(tpOrderId);
        }
    }
    
    // Calculate P&L
    calculatePnL(position, exitPrice) {
        if (position.side === 'long') {
            return (exitPrice - position.entryPrice) * position.size;
        } else {
            return (position.entryPrice - exitPrice) * position.size;
        }
    }
    
    // Close all positions
    async closeAllPositions(reason = 'emergency') {
        const positions = Array.from(this.positions.values());
        const results = [];
        
        for (const position of positions) {
            try {
                const result = await this.closePosition(position.symbol, reason);
                results.push(result);
            } catch (error) {
                console.error(`Failed to close position ${position.symbol}:`, error);
                results.push({ error, position });
            }
        }
        
        return results;
    }
    
    // Start risk monitoring
    startRiskMonitoring() {
        this.riskMonitoringInterval = setInterval(() => {
            this.checkRiskMonitoring();
        }, 30000); // Check every 30 seconds
    }
    
    // Stop risk monitoring
    stopRiskMonitoring() {
        if (this.riskMonitoringInterval) {
            clearInterval(this.riskMonitoringInterval);
            this.riskMonitoringInterval = null;
        }
    }
    
    // Check risk monitoring
    async checkRiskMonitoring() {
        if (!this.isRunning) return;
        
        try {
            // Update position P&L
            await this.updatePositions();
            
            // Check risk limits
            await this.checkDrawdown();
            
            // Check open positions
            this.checkOpenPositions();
            
        } catch (error) {
            console.error('Risk monitoring error:', error);
        }
    }
    
    // Update positions with current market data
    async updatePositions() {
        for (const [symbol, position] of this.positions) {
            try {
                // Get real market data
                const ticker = await this.api.getTicker24hrStats(symbol);
                position.markPrice = parseFloat(ticker.lastPrice);
                position.unrealizedPnL = this.calculatePnL(position, position.markPrice);
            } catch (error) {
                console.error(`Failed to update position ${symbol}:`, error);
            }
        }
    }
    
    // Check drawdown
    async checkDrawdown() {
        // This would typically check against account equity
        // For now, we'll just check the daily stats
        if (this.dailyStats.totalPnL < 0) {
            const drawdownPercent = (Math.abs(this.dailyStats.totalPnL) / 10000) * 100; // Assuming 10k starting balance
            
            if (drawdownPercent > this.riskLimits.maxDrawdown) {
                console.warn(`Drawdown limit exceeded: ${drawdownPercent.toFixed(2)}%`);
                this.emit('drawdownAlert', { drawdownPercent, limit: this.riskLimits.maxDrawdown });
            }
        }
    }
    
    // Check open positions
    checkOpenPositions() {
        for (const [symbol, position] of this.positions) {
            // Check if position should be closed based on other criteria
            // This is where you might add trailing stops, time-based exits, etc.
        }
    }
    
    // Get positions
    getPositions() {
        return Array.from(this.positions.values());
    }
    
    // Get position for symbol
    getPosition(symbol) {
        return this.positions.get(symbol);
    }
    
    // Get trading statistics
    getStatistics() {
        const winRate = this.dailyStats.trades > 0 
            ? (this.dailyStats.wins / this.dailyStats.trades) * 100 
            : 0;
        
        return {
            ...this.dailyStats,
            winRate,
            openPositions: this.positions.size,
            maxPositions: this.maxPositions,
            totalUnrealizedPnL: Array.from(this.positions.values())
                .reduce((sum, p) => sum + p.unrealizedPnL, 0)
        };
    }
    
    // Manual trade execution
    async executeManualTrade(direction, size = null) {
        const signal = {
            type: 'manual',
            direction,
            strategy: 'manual',
            confidence: 100,
            reason: 'Manual trade'
        };
        
        if (size) {
            signal.size = size;
        }
        
        return await this.executeSignal(signal);
    }
    
    // Event system
    on(event, callback) {
        if (!this.eventListeners) {
            this.eventListeners = new Map();
        }
        
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        
        this.eventListeners.get(event).add(callback);
    }
    
    off(event, callback) {
        if (this.eventListeners && this.eventListeners.has(event)) {
            this.eventListeners.get(event).delete(callback);
        }
    }
    
    emit(event, data) {
        if (this.eventListeners && this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in trading event listener:`, error);
                }
            });
        }
    }
    
    // Reset statistics
    resetStatistics() {
        this.dailyStats = {
            trades: 0,
            wins: 0,
            losses: 0,
            totalPnL: 0,
            startTime: Date.now()
        };
    }
}

// Export for use in other modules
window.TradingManager = TradingManager;