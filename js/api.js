/**
 * Binance API Integration
 * Binance Futures Trading Bot
 */

class BinanceAPI {
    constructor(config) {
        this.config = config;
        this.baseUrl = config.getApiConfig().baseUrl;
        this.apiKey = config.getApiConfig().apiKey;
        this.secretKey = config.getApiConfig().secretKey;

        this.rateLimits = {
            requests: [],
            maxRequests: 1200, // per minute
            windowMs: 60000
        };
    }
    
    // Update configuration
    updateConfig(config) {
        this.config = config;
        const apiConfig = config.getApiConfig();
        this.baseUrl = apiConfig.baseUrl;
        this.apiKey = apiConfig.apiKey;
        this.secretKey = apiConfig.secretKey;

    }
    
    // Generate signature for authenticated requests
    generateSignature(queryString) {
        return crypto.createHmac('sha256', this.secretKey)
                    .update(queryString)
                    .digest('hex');
    }
    
    // Rate limiting check
    checkRateLimit() {
        const now = Date.now();
        // Remove old requests outside the window
        this.rateLimits.requests = this.rateLimits.requests.filter(
            time => now - time < this.rateLimits.windowMs
        );
        
        if (this.rateLimits.requests.length >= this.rateLimits.maxRequests) {
            throw new Error('Rate limit exceeded. Please wait before making more requests.');
        }
        
        this.rateLimits.requests.push(now);
    }
    
    // Generic API request method
    async request(endpoint, method = 'GET', data = null, requiresAuth = false) {
        try {
            this.checkRateLimit();
            
            let url = `${this.baseUrl}${endpoint}`;
            let headers = {
                'Content-Type': 'application/json',
                'X-MBX-APIKEY': this.apiKey
            };
            
            let requestOptions = {
                method,
                headers
            };
            
            if (requiresAuth && data) {
                // Add timestamp
                data.timestamp = Date.now();
                
                // Create query string
                const queryString = Object.keys(data)
                    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
                    .join('&');
                
                // Add signature
                data.signature = this.generateSignature(queryString);
                
                if (method === 'GET') {
                    url += `?${queryString}`;
                } else {
                    requestOptions.body = queryString;
                }
            } else if (data && method === 'GET') {
                const queryString = Object.keys(data)
                    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
                    .join('&');
                url += `?${queryString}`;
            } else if (data && method !== 'GET') {
                requestOptions.body = JSON.stringify(data);
            }
            
            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${response.status} - ${errorData.msg || 'Unknown error'}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }
    
    // Public API Methods (No authentication required)
    
    // Get exchange info
    async getExchangeInfo() {
        return await this.request('/fapi/v1/exchangeInfo', 'GET');
    }
    
    // Get server time
    async getServerTime() {
        return await this.request('/fapi/v1/time', 'GET');
    }
    
    // Get ticker 24hr price change statistics
    async getTicker24hr(symbol) {
        const params = symbol ? { symbol } : {};
        return await this.request('/fapi/v1/ticker/24hr', 'GET', params);
    }
    
    // Get ticker price
    async getTickerPrice(symbol) {
        const params = symbol ? { symbol } : {};
        return await this.request('/fapi/v1/ticker/price', 'GET', params);
    }
    
    // Get order book
    async getOrderBook(symbol, limit = 100) {
        const params = { symbol, limit };
        return await this.request('/fapi/v1/depth', 'GET', params);
    }
    
    // Get recent trades
    async getRecentTrades(symbol, limit = 500) {
        const params = { symbol, limit };
        return await this.request('/fapi/v1/trades', 'GET', params);
    }
    
    // Get historical trades
    async getHistoricalTrades(symbol, limit = 500, fromId = null) {
        const params = { symbol, limit };
        if (fromId) params.fromId = fromId;
        return await this.request('/fapi/v1/historicalTrades', 'GET', params);
    }
    
    // Get aggregate trades
    async getAggregateTrades(symbol, limit = 500, startTime = null, endTime = null) {
        const params = { symbol, limit };
        if (startTime) params.startTime = startTime;
        if (endTime) params.endTime = endTime;
        return await this.request('/fapi/v1/aggTrades', 'GET', params);
    }
    
    // Get kline/candlestick data
    async getKlines(symbol, interval, limit = 500, startTime = null, endTime = null) {
        const params = { symbol, interval, limit };
        if (startTime) params.startTime = startTime;
        if (endTime) params.endTime = endTime;
        return await this.request('/fapi/v1/klines', 'GET', params);
    }
    
    // Get continuous contract kline data
    async getContinuousKlines(pair, contractType, interval, limit = 500, startTime = null, endTime = null) {
        const params = { pair, contractType, interval, limit };
        if (startTime) params.startTime = startTime;
        if (endTime) params.endTime = endTime;
        return await this.request('/fapi/v1/continuousKlines', 'GET', params);
    }
    
    // Get index price kline data
    async getIndexPriceKlines(symbol, interval, limit = 500, startTime = null, endTime = null) {
        const params = { symbol, interval, limit };
        if (startTime) params.startTime = startTime;
        if (endTime) params.endTime = endTime;
        return await this.request('/fapi/v1/indexPriceKlines', 'GET', params);
    }
    
    // Get mark price kline data
    async getMarkPriceKlines(symbol, interval, limit = 500, startTime = null, endTime = null) {
        const params = { symbol, interval, limit };
        if (startTime) params.startTime = startTime;
        if (endTime) params.endTime = endTime;
        return await this.request('/fapi/v1/markPriceKlines', 'GET', params);
    }
    
    // Get 24hr ticker statistics
    async getTicker24hrStats(symbol) {
        const params = { symbol };
        return await this.request('/fapi/v1/ticker/24hr', 'GET', params);
    }
    
    // Get symbol price ticker
    async getSymbolPriceTicker(symbol) {
        const params = { symbol };
        return await this.request('/fapi/v1/ticker/price', 'GET', params);
    }
    
    // Get symbol order book ticker
    async getSymbolOrderBookTicker(symbol) {
        const params = { symbol };
        return await this.request('/fapi/v1/ticker/bookTicker', 'GET', params);
    }
    
    // Get open interest
    async getOpenInterest(symbol) {
        const params = { symbol };
        return await this.request('/fapi/v1/openInterest', 'GET', params);
    }
    
    // Get open interest statistics
    async getOpenInterestStats(symbol, period, limit = 30, startTime = null, endTime = null) {
        const params = { symbol, period, limit };
        if (startTime) params.startTime = startTime;
        if (endTime) params.endTime = endTime;
        return await this.request('/fapi/v1/openInterestHist', 'GET', params);
    }
    
    // Get taker long/short ratio
    async getTakerLongShortRatio(symbol, period, limit = 30, startTime = null, endTime = null) {
        const params = { symbol, period, limit };
        if (startTime) params.startTime = startTime;
        if (endTime) params.endTime = endTime;
        return await this.request('/fapi/v1/globalLongShortAccountRatio', 'GET', params);
    }
    
    // Get buy/sell ratio
    async getBuySellRatio(symbol, period, limit = 30, startTime = null, endTime = null) {
        const params = { symbol, period, limit };
        if (startTime) params.startTime = startTime;
        if (endTime) params.endTime = endTime;
        return await this.request('/fapi/v1/takerLongShortRatio', 'GET', params);
    }
    
    // Get futures funding rate
    async getFuturesFundingRate(symbol) {
        const params = { symbol };
        return await this.request('/fapi/v1/premiumIndex', 'GET', params);
    }
    
    // Get funding rate history
    async getFundingRateHistory(symbol, limit = 100, startTime = null, endTime = null) {
        const params = { symbol, limit };
        if (startTime) params.startTime = startTime;
        if (endTime) params.endTime = endTime;
        return await this.request('/fapi/v1/premiumIndex', 'GET', params);
    }
    
    // Authenticated API Methods (Authentication required)
    
    // Get account information
    async getAccount() {
        return await this.request('/fapi/v2/account', 'GET', null, true);
    }
    
    // Get balance
    async getBalance() {
        return await this.request('/fapi/v2/balance', 'GET', null, true);
    }
    
    // Change position mode (Hedge Mode or One-way Mode)
    async changePositionMode(dualSidePosition) {
        const data = { dualSidePosition: dualSidePosition ? 'true' : 'false' };
        return await this.request('/fapi/v1/positionMode', 'POST', data, true);
    }
    
    // Change margin type
    async changeMarginType(symbol, marginType) {
        const data = { symbol, marginType };
        return await this.request('/fapi/v1/marginType', 'POST', data, true);
    }
    
    // Change leverage
    async changeLeverage(symbol, leverage) {
        const data = { symbol, leverage };
        return await this.request('/fapi/v1/leverage', 'POST', data, true);
    }
    
    // Change initial margin type
    async changeInitialMarginType(symbol, marginType) {
        const data = { symbol, marginType };
        return await this.request('/fapi/v1/initialMarginType', 'POST', data, true);
    }
    
    // Get position information
    async getPosition() {
        return await this.request('/fapi/v2/positionRisk', 'GET', null, true);
    }
    
    // Get position information for a symbol
    async getPositionForSymbol(symbol) {
        const data = { symbol };
        return await this.request('/fapi/v2/positionRisk', 'GET', data, true);
    }
    
    // Get trade list
    async getUserTrades(symbol, limit = 500, startTime = null, endTime = null, fromId = null) {
        const data = { symbol, limit };
        if (startTime) data.startTime = startTime;
        if (endTime) data.endTime = endTime;
        if (fromId) data.fromId = fromId;
        return await this.request('/fapi/v1/userTrades', 'GET', data, true);
    }
    
    // Get all orders
    async getAllOrders(symbol, limit = 500, startTime = null, endTime = null, fromId = null) {
        const data = { symbol, limit };
        if (startTime) data.startTime = startTime;
        if (endTime) data.endTime = endTime;
        if (fromId) data.fromId = fromId;
        return await this.request('/fapi/v1/allOrders', 'GET', data, true);
    }
    
    // Get current open orders
    async getOpenOrders(symbol = null) {
        const data = symbol ? { symbol } : {};
        return await this.request('/fapi/v1/openOrders', 'GET', data, true);
    }
    
    // Get all_margin_loss
    async getMarginLoss(symbol) {
        const data = { symbol };
        return await this.request('/fapi/v1/allMarginLoss', 'GET', data, true);
    }
    
    // Get possible remaining withdraw amount
    async getPossibleRemainingWithdraw(asset) {
        const data = { asset };
        return await this.request('/fapi/v1/possibleRemainingWithdraw', 'GET', data, true);
    }
    
    // Place new order
    async newOrder(orderParams) {
        // orderParams: { symbol, side, type, quantity, price, stopPrice, timeInForce }
        return await this.request('/fapi/v1/order', 'POST', orderParams, true);
    }
    
    // Place test order (test order placement)
    async testNewOrder(orderParams) {
        return await this.request('/fapi/v1/order/test', 'POST', orderParams, true);
    }
    
    // Place multiple orders
    async newBatchOrders(batchOrders) {
        // batchOrders: array of order parameters
        const data = { batchOrders: JSON.stringify(batchOrders) };
        return await this.request('/fapi/v1/batchOrders', 'POST', data, true);
    }
    
    // Place multiple test orders
    async testBatchOrders(batchOrders) {
        const data = { batchOrders: JSON.stringify(batchOrders) };
        return await this.request('/fapi/v1/batchOrders', 'POST', data, true);
    }
    
    // Query order
    async getOrder(symbol, orderId = null, origClientOrderId = null) {
        const data = { symbol };
        if (orderId) data.orderId = orderId;
        if (origClientOrderId) data.origClientOrderId = origClientOrderId;
        return await this.request('/fapi/v1/order', 'GET', data, true);
    }
    
    // Cancel order
    async cancelOrder(symbol, orderId = null, origClientOrderId = null) {
        const data = { symbol };
        if (orderId) data.orderId = orderId;
        if (origClientOrderId) data.origClientOrderId = origClientOrderId;
        return await this.request('/fapi/v1/order', 'DELETE', data, true);
    }
    
    // Cancel all open orders on a symbol
    async cancelAllOrders(symbol) {
        const data = { symbol };
        return await this.request('/fapi/v1/allOpenOrders', 'DELETE', data, true);
    }
    
    // Cancel OCO (One-Cancels-the-Other)
    async cancelOCO(symbol, orderListId = null, listClientOrderId = null) {
        const data = { symbol };
        if (orderListId) data.orderListId = orderListId;
        if (listClientOrderId) data.listClientOrderId = listClientOrderId;
        return await this.request('/fapi/v1/orderList', 'DELETE', data, true);
    }
    
    // Get OCO
    async getOCO(symbol = null, orderListId = null, origClientOrderId = null) {
        const data = {};
        if (symbol) data.symbol = symbol;
        if (orderListId) data.orderListId = orderListId;
        if (origClientOrderId) data.origClientOrderId = origClientOrderId;
        return await this.request('/fapi/v1/allOrderList', 'GET', data, true);
    }
    
    // Get OCO history
    async getOCOHistory() {
        return await this.request('/fapi/v1/allOrderList', 'GET', null, true);
    }
    
    // Get account's user data
    async getUserData() {
        return await this.request('/fapi/v1/account', 'GET', null, true);
    }
    
    // Get trade fee
    async getTradeFee(symbol) {
        const data = { symbol };
        return await this.request('/fapi/v1/tradeFee', 'GET', data, true);
    }
    
    // Get income history
    async getIncomeHistory(symbol = null, incomeType = null, limit = 100, startTime = null, endTime = null) {
        const data = { limit };
        if (symbol) data.symbol = symbol;
        if (incomeType) data.incomeType = incomeType;
        if (startTime) data.startTime = startTime;
        if (endTime) data.endTime = endTime;
        return await this.request('/fapi/v1/income', 'GET', data, true);
    }
    
    // Get leverage bracket
    async getLeverageBracket(symbol) {
        const data = { symbol };
        return await this.request('/fapi/v1/leverageBracket', 'GET', data, true);
    }
    
    // Get order rate limit
    async getOrderRateLimit() {
        return await this.request('/fapi/v1/orderRateLimit', 'GET', null, true);
    }
    
    // Get user rate limit
    async getUserRateLimit() {
        return await this.request('/fapi/v1/rateLimit/order', 'GET', null, true);
    }
    
    // Utility Methods
    
    // Validate symbol exists in exchange
    async validateSymbol(symbol) {
        try {
            const exchangeInfo = await this.getExchangeInfo();
            return exchangeInfo.symbols.some(s => s.symbol === symbol && s.status === 'TRADING');
        } catch (error) {
            console.error('Failed to validate symbol:', error);
            return false;
        }
    }
    
    // Get current price for symbol
    async getCurrentPrice(symbol) {
        try {
            const ticker = await this.getTicker24hrStats(symbol);
            return parseFloat(ticker.lastPrice);
        } catch (error) {
            console.error('Failed to get current price:', error);
            return null;
        }
    }
    
    // Check if API is connected
    async isConnected() {
        try {
            await this.getServerTime();
            return true;
        } catch (error) {
            return false;
        }
    }
    
    // Health check
    async healthCheck() {
        try {
            const time = await this.getServerTime();
            const account = this.apiKey ? await this.getAccount() : null;
            
            return {
                connected: true,
                serverTime: time.serverTime,
                authenticated: !!this.apiKey,
                account: account ? {
                    canTrade: account.canTrade,
                    canWithdraw: account.canWithdraw,
                    canDeposit: account.canDeposit
                } : null,

            };
        } catch (error) {
            return {
                connected: false,
                error: error.message
            };
        }
    }
}

// Export for use in other modules
window.BinanceAPI = BinanceAPI;