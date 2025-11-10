/**
 * Configuration Management
 * Binance Futures Trading Bot
 */

class ConfigManager {
    constructor() {
        this.defaultConfig = {
            // API Configuration
            api: {
                baseUrl: 'https://fapi.binance.com',
                websocketUrl: 'wss://fstream.binance.com',
                apiKey: '',
                secretKey: '',
                useTestnet: false
            },
            
            // Trading Configuration
            trading: {
                symbol: 'BTCUSDT',
                leverage: 10,
                riskPercent: 1.0,
                maxPositions: 3,
                tradingMode: 'live' // 'demo' removed - live trading only
            },
            
            // Strategy Configuration
            strategies: {
                orb: {
                    enabled: true,
                    timeframe: '5m',
                    breakoutThreshold: 0.5,
                    atrMultiplier: 2
                },
                fractals: {
                    enabled: true,
                    timeframe: '15m',
                    minBars: 5,
                    trendConfirmation: true
                },
                smc: {
                    enabled: true,
                    timeframe: '1h',
                    orderBlockConfirmation: true,
                    liquiditySweepDetection: true
                }
            },
            
            // Risk Management
            risk: {
                stopLossPercent: 2.0,
                takeProfitPercent: 6.0,
                maxDrawdownPercent: 10.0,
                dailyLossLimitPercent: 3.0
            },
            
            // UI Configuration
            ui: {
                theme: 'dark',
                autoRefresh: true,
                refreshInterval: 1000, // milliseconds
                notifications: true,
                soundAlerts: false
            }
        };
        
        this.config = this.loadConfig();
    }
    
    loadConfig() {
        try {
            const savedConfig = localStorage.getItem('binanceBotConfig');
            if (savedConfig) {
                const parsed = JSON.parse(savedConfig);
                // Merge with defaults to ensure all keys exist
                return this.mergeDeep(this.defaultConfig, parsed);
            }
        } catch (error) {
            console.warn('Failed to load config, using defaults:', error);
        }
        return { ...this.defaultConfig };
    }
    
    saveConfig() {
        try {
            localStorage.setItem('binanceBotConfig', JSON.stringify(this.config));
            return true;
        } catch (error) {
            console.error('Failed to save config:', error);
            return false;
        }
    }
    
    get(path) {
        return this.getNestedValue(this.config, path);
    }
    
    set(path, value) {
        this.setNestedValue(this.config, path, value);
        this.saveConfig();
    }
    
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }
    
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);
        target[lastKey] = value;
    }
    
    mergeDeep(target, source) {
        const isObject = (item) => item && typeof item === 'object';
        
        if (!isObject(target) || !isObject(source)) {
            return source;
        }
        
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                this.mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
        
        return target;
    }
    
    reset() {
        this.config = { ...this.defaultConfig };
        this.saveConfig();
    }
    
    // API Configuration Methods
    getApiConfig() {
        return {
            baseUrl: this.get('api.baseUrl'),
            websocketUrl: this.get('api.websocketUrl'),
            apiKey: this.get('api.apiKey'),
            secretKey: this.get('api.secretKey'),
            useTestnet: false
        };
    }
    
    setApiCredentials(apiKey, secretKey) {
        this.set('api.apiKey', apiKey);
        this.set('api.secretKey', secretKey);
    }
    

    
    // Trading Configuration Methods
    getTradingConfig() {
        return {
            symbol: this.get('trading.symbol'),
            leverage: this.get('trading.leverage'),
            riskPercent: this.get('trading.riskPercent'),
            maxPositions: this.get('trading.maxPositions'),
            tradingMode: this.get('trading.tradingMode')
        };
    }
    
    setTradingSymbol(symbol) {
        this.set('trading.symbol', symbol);
    }
    
    setLeverage(leverage) {
        this.set('trading.leverage', leverage);
    }
    
    setRiskPercent(percent) {
        this.set('trading.riskPercent', percent);
    }
    
    setMaxPositions(max) {
        this.set('trading.maxPositions', max);
    }
    
    // Strategy Configuration Methods
    getStrategyConfig(strategy) {
        return this.get(`strategies.${strategy}`);
    }
    
    setStrategyEnabled(strategy, enabled) {
        this.set(`strategies.${strategy}.enabled`, enabled);
    }
    
    updateStrategyConfig(strategy, config) {
        Object.keys(config).forEach(key => {
            this.set(`strategies.${strategy}.${key}`, config[key]);
        });
    }
    
    // Risk Management Methods
    getRiskConfig() {
        return this.get('risk');
    }
    
    setStopLossPercent(percent) {
        this.set('risk.stopLossPercent', percent);
    }
    
    setTakeProfitPercent(percent) {
        this.set('risk.takeProfitPercent', percent);
    }
    
    // UI Configuration Methods
    getUiConfig() {
        return this.get('ui');
    }
    
    setTheme(theme) {
        this.set('ui.theme', theme);
    }
    
    setAutoRefresh(enabled) {
        this.set('ui.autoRefresh', enabled);
    }
    
    setRefreshInterval(interval) {
        this.set('ui.refreshInterval', interval);
    }
    
    // Utility Methods
    exportConfig() {
        return JSON.stringify(this.config, null, 2);
    }
    
    importConfig(configJson) {
        try {
            const config = JSON.parse(configJson);
            this.config = this.mergeDeep(this.defaultConfig, config);
            this.saveConfig();
            return true;
        } catch (error) {
            console.error('Failed to import config:', error);
            return false;
        }
    }
    
    // Validation Methods
    validateConfig() {
        const errors = [];
        
        // API Validation
        if (!this.get('api.apiKey')) {
            errors.push('API key is required for trading');
        }
        
        if (!this.get('api.secretKey')) {
            errors.push('API secret key is required for trading');
        }
        
        // Trading Validation
        const riskPercent = this.get('trading.riskPercent');
        if (riskPercent < 0.1 || riskPercent > 5.0) {
            errors.push('Risk per trade must be between 0.1% and 5.0%');
        }
        
        const maxPositions = this.get('trading.maxPositions');
        if (maxPositions < 1 || maxPositions > 10) {
            errors.push('Max positions must be between 1 and 10');
        }
        
        // Risk Management Validation
        const stopLoss = this.get('risk.stopLossPercent');
        if (stopLoss < 0.5 || stopLoss > 10.0) {
            errors.push('Stop loss must be between 0.5% and 10.0%');
        }
        
        const takeProfit = this.get('risk.takeProfitPercent');
        if (takeProfit < 1.0 || takeProfit > 20.0) {
            errors.push('Take profit must be between 1.0% and 20.0%');
        }
        
        return errors;
    }
    
    // Environment Detection
    isLive() {
        return this.get('trading.tradingMode') === 'live';
    }
    
    // Event System for Configuration Changes
    onConfigChange(callback) {
        if (!this.callbacks) {
            this.callbacks = [];
        }
        this.callbacks.push(callback);
    }
    
    notifyConfigChange(path) {
        if (this.callbacks) {
            this.callbacks.forEach(callback => {
                try {
                    callback(path, this.get(path));
                } catch (error) {
                    console.error('Error in config change callback:', error);
                }
            });
        }
    }
    
    // Auto-save with debouncing
    debouncedSave = this.debounce(() => {
        this.saveConfig();
    }, 1000);
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Export for use in other modules
window.ConfigManager = ConfigManager;