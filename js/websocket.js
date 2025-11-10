/**
 * WebSocket Handler for Real-time Data
 * Binance Futures Trading Bot
 */

class BinanceWebSocket {
    constructor(config) {
        this.config = config;
        this.websocketUrl = config.getApiConfig().websocketUrl;

        this.connections = new Map();
        this.reconnectAttempts = new Map();
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.heartbeatInterval = 30000; // 30 seconds
        this.isConnecting = false;
        this.eventListeners = new Map();
        
        // Initialize heartbeats
        this.heartbeats = new Map();
    }
    
    // Update configuration
    updateConfig(config) {
        this.config = config;
        const apiConfig = config.getApiConfig();
        this.websocketUrl = apiConfig.websocketUrl;

    }
    
    // Add event listener
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event).add(callback);
    }
    
    // Remove event listener
    off(event, callback) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).delete(callback);
        }
    }
    
    // Emit event
    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
    
    // Create WebSocket connection
    async connect(streamName, onMessage, onError = null, onClose = null) {
        const streamKey = `${streamName}`;
        
        if (this.connections.has(streamKey)) {
            console.warn(`Stream ${streamKey} already connected`);
            return;
        }
        
        if (this.isConnecting) {
            console.warn('Connection already in progress, waiting...');
            return new Promise((resolve) => {
                setTimeout(() => resolve(this.connect(streamName, onMessage, onError, onClose)), 1000);
            });
        }
        
        this.isConnecting = true;
        this.reconnectAttempts.set(streamKey, 0);
        
        try {
            const ws = new WebSocket(this.websocketUrl + `/ws/${streamName}`);
            this.connections.set(streamKey, ws);
            
            ws.onopen = () => {
                console.log(`WebSocket connected: ${streamKey}`);
                this.isConnecting = false;
                this.reconnectAttempts.delete(streamKey);
                this.startHeartbeat(streamKey, ws);
                this.emit('connected', { stream: streamKey });
            };
            
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    // Handle different message types
                    if (data.stream) {
                        // Stream data
                        onMessage(data.data, data.stream);
                    } else {
                        // Individual message
                        onMessage(data);
                    }
                } catch (error) {
                    console.error(`Error parsing message from ${streamKey}:`, error);
                }
            };
            
            ws.onerror = (error) => {
                console.error(`WebSocket error for ${streamKey}:`, error);
                if (onError) onError(error);
                this.emit('error', { stream: streamKey, error });
            };
            
            ws.onclose = (event) => {
                console.log(`WebSocket closed: ${streamKey}`, event.code, event.reason);
                this.stopHeartbeat(streamKey);
                this.connections.delete(streamKey);
                
                if (onClose) onClose(event);
                this.emit('disconnected', { stream: streamKey, code: event.code, reason: event.reason });
                
                // Auto-reconnect unless it was a clean close
                if (event.code !== 1000 && this.reconnectAttempts.get(streamKey) < this.maxReconnectAttempts) {
                    this.scheduleReconnect(streamName, onMessage, onError, onClose);
                }
            };
            
            return ws;
        } catch (error) {
            this.isConnecting = false;
            console.error(`Failed to connect to WebSocket ${streamKey}:`, error);
            throw error;
        }
    }
    
    // Schedule reconnection
    scheduleReconnect(streamName, onMessage, onError, onClose) {
        const streamKey = `${streamName}`;
        const attempts = this.reconnectAttempts.get(streamKey) || 0;
        const delay = this.reconnectDelay * Math.pow(2, attempts);
        
        console.log(`Scheduling reconnect for ${streamKey} in ${delay}ms (attempt ${attempts + 1})`);
        
        setTimeout(() => {
            this.reconnectAttempts.set(streamKey, attempts + 1);
            this.connect(streamName, onMessage, onError, onClose);
        }, delay);
    }
    
    // Disconnect stream
    disconnect(streamName) {
        const streamKey = `${streamName}`;
        const ws = this.connections.get(streamKey);
        
        if (ws) {
            this.stopHeartbeat(streamKey);
            ws.close(1000, 'Manual disconnect');
            this.connections.delete(streamKey);
            this.reconnectAttempts.delete(streamKey);
            console.log(`Disconnected stream: ${streamKey}`);
        }
    }
    
    // Disconnect all streams
    disconnectAll() {
        for (const [streamName, ws] of this.connections) {
            this.stopHeartbeat(streamName);
            ws.close(1000, 'Disconnect all');
        }
        this.connections.clear();
        this.reconnectAttempts.clear();
        console.log('Disconnected all WebSocket connections');
    }
    
    // Start heartbeat
    startHeartbeat(streamName, ws) {
        const streamKey = `${streamName}`;
        
        this.stopHeartbeat(streamKey);
        
        const heartbeat = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send(JSON.stringify({ method: 'ping' }));
                } catch (error) {
                    console.error(`Heartbeat failed for ${streamKey}:`, error);
                }
            }
        }, this.heartbeatInterval);
        
        this.heartbeats.set(streamKey, heartbeat);
    }
    
    // Stop heartbeat
    stopHeartbeat(streamName) {
        const streamKey = `${streamName}`;
        const heartbeat = this.heartbeats.get(streamKey);
        
        if (heartbeat) {
            clearInterval(heartbeat);
            this.heartbeats.delete(streamKey);
        }
    }
    
    // Subscribe to symbol ticker
    subscribeTicker(symbol, onUpdate) {
        const streamName = `${symbol.toLowerCase()}@ticker`;
        return this.connect(streamName, (data) => {
            if (onUpdate) onUpdate(data);
            this.emit('ticker', { symbol, data });
        });
    }
    
    // Subscribe to order book
    subscribeOrderBook(symbol, depth = 100, onUpdate) {
        const streamName = `${symbol.toLowerCase()}@depth${depth}@100ms`;
        return this.connect(streamName, (data) => {
            if (onUpdate) onUpdate(data);
            this.emit('orderbook', { symbol, data });
        });
    }
    
    // Subscribe to trades
    subscribeTrades(symbol, onTrade) {
        const streamName = `${symbol.toLowerCase()}@trade`;
        return this.connect(streamName, (data) => {
            if (onTrade) onTrade(data);
            this.emit('trade', { symbol, data });
        });
    }
    
    // Subscribe to kline/candlestick data
    subscribeKline(symbol, interval, onKline) {
        const streamName = `${symbol.toLowerCase()}@kline_${interval}`;
        return this.connect(streamName, (data) => {
            if (onKline) onKline(data);
            this.emit('kline', { symbol, interval, data });
        });
    }
    
    // Subscribe to user data stream (requires authentication)
    subscribeUserData(listenKey, onEvent) {
        const streamName = `${listenKey}`;
        return this.connect(streamName, (data) => {
            if (onEvent) onEvent(data);
            this.emit('userData', data);
        });
    }
    
    // Subscribe to aggregate trade
    subscribeAggregateTrades(symbol, onTrade) {
        const streamName = `${symbol.toLowerCase()}@aggTrade`;
        return this.connect(streamName, (data) => {
            if (onTrade) onTrade(data);
            this.emit('aggregateTrade', { symbol, data });
        });
    }
    
    // Subscribe to mark price update
    subscribeMarkPrice(symbol, onUpdate) {
        const streamName = `${symbol.toLowerCase()}@markPrice`;
        return this.connect(streamName, (data) => {
            if (onUpdate) onUpdate(data);
            this.emit('markPrice', { symbol, data });
        });
    }
    
    // Subscribe to liquidation order
    subscribeLiquidation(symbol, onLiquidation) {
        const streamName = `${symbol.toLowerCase()}@forceOrder`;
        return this.connect(streamName, (data) => {
            if (onLiquidation) onLiquidation(data);
            this.emit('liquidation', { symbol, data });
        });
    }
    
    // Subscribe to order book delta
    subscribeOrderBookDelta(symbol, onUpdate) {
        const streamName = `${symbol.toLowerCase()}@depth@100ms`;
        return this.connect(streamName, (data) => {
            if (onUpdate) onUpdate(data);
            this.emit('orderbookDelta', { symbol, data });
        });
    }
    
    // Utility methods
    isConnected(streamName = null) {
        if (streamName) {
            const streamKey = `${streamName}`;
            const ws = this.connections.get(streamKey);
            return ws && ws.readyState === WebSocket.OPEN;
        }
        
        // Check if any connection is open
        for (const [streamName, ws] of this.connections) {
            if (ws.readyState === WebSocket.OPEN) {
                return true;
            }
        }
        return false;
    }
    
    getConnectionStatus() {
        const status = {};
        for (const [streamName, ws] of this.connections) {
            status[streamName] = {
                readyState: ws.readyState,
                url: ws.url,
                binaryType: ws.binaryType,
                bufferedAmount: ws.bufferedAmount,
                extensions: ws.extensions,
                protocol: ws.protocol
            };
        }
        return status;
    }
    
    // Get statistics
    getStats() {
        return {
            totalConnections: this.connections.size,
            reconnecting: this.reconnectAttempts.size,
            heartbeats: this.heartbeats.size,
            events: {
                connected: this.eventListeners.get('connected')?.size || 0,
                disconnected: this.eventListeners.get('disconnected')?.size || 0,
                error: this.eventListeners.get('error')?.size || 0,
                ticker: this.eventListeners.get('ticker')?.size || 0,
                trade: this.eventListeners.get('trade')?.size || 0,
                kline: this.eventListeners.get('kline')?.size || 0,
                userData: this.eventListeners.get('userData')?.size || 0
            }
        };
    }
    
    // Cleanup
    destroy() {
        this.disconnectAll();
        this.eventListeners.clear();
        this.heartbeats.clear();
        this.reconnectAttempts.clear();
        console.log('WebSocket handler destroyed');
    }
}

// Export for use in other modules
window.BinanceWebSocket = BinanceWebSocket;