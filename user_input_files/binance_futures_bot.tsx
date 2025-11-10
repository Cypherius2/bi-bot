import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, TrendingUp, TrendingDown, DollarSign, AlertTriangle, Play, Square, Settings, RefreshCw } from 'lucide-react';

const BinanceFuturesBot = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [botStatus, setBotStatus] = useState('idle');
  const [accountBalance, setAccountBalance] = useState(10000);
  const [totalPnL, setTotalPnL] = useState(0);
  const [positions, setPositions] = useState([]);
  const [trades, setTrades] = useState([]);
  const [signals, setSignals] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [config, setConfig] = useState({
    symbol: 'BTCUSDT',
    leverage: 10,
    riskPercent: 1.0,
    strategyMode: 'advanced',
    timeframe: '5m'
  });

  // Simulated strategies
  const strategies = {
    'EMA Crossover with RSI': { win_rate: 68, trades: 45, profit: 1250 },
    'Volume Profile + Order Flow': { win_rate: 72, trades: 38, profit: 1680 },
    'Market Structure Break': { win_rate: 65, trades: 52, profit: 980 },
    'Liquidity Sweep + FVG': { win_rate: 75, trades: 29, profit: 1820 },
    'Delta Divergence': { win_rate: 70, trades: 34, profit: 1340 }
  };

  useEffect(() => {
    // Generate initial market data
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
    setMarketData(data);
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // Simulate trading activity
      if (Math.random() > 0.7) {
        const newSignal = {
          id: Date.now(),
          strategy: Object.keys(strategies)[Math.floor(Math.random() * 5)],
          type: Math.random() > 0.5 ? 'LONG' : 'SHORT',
          price: 45000 + (Math.random() - 0.5) * 2000,
          confidence: (Math.random() * 30 + 70).toFixed(1),
          timestamp: new Date().toLocaleTimeString()
        };
        setSignals(prev => [newSignal, ...prev].slice(0, 10));

        // Sometimes execute trade
        if (Math.random() > 0.6 && positions.length < 3) {
          const position = {
            id: Date.now(),
            symbol: config.symbol,
            type: newSignal.type,
            entry: newSignal.price,
            size: (accountBalance * config.riskPercent / 100 * config.leverage).toFixed(2),
            leverage: config.leverage,
            pnl: 0,
            strategy: newSignal.strategy
          };
          setPositions(prev => [...prev, position]);
        }
      }

      // Update positions
      setPositions(prev => prev.map(pos => {
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
          setTrades(prev => [trade, ...prev].slice(0, 20));
          setTotalPnL(prev => prev + newPnl);
          setAccountBalance(prev => prev + newPnl);
          return null;
        }
        
        return { ...pos, pnl: newPnl };
      }).filter(Boolean));

      // Update market data
      setMarketData(prev => {
        const last = prev[prev.length - 1];
        const newPrice = last.price + (Math.random() - 0.5) * 300;
        return [...prev.slice(1), {
          time: new Date().toLocaleTimeString(),
          price: newPrice,
          volume: Math.random() * 1000 + 500
        }];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isRunning, accountBalance, config, positions.length]);

  const startBot = () => {
    setIsRunning(true);
    setBotStatus('running');
  };

  const stopBot = () => {
    setIsRunning(false);
    setBotStatus('stopped');
  };

  const winRate = trades.length > 0 
    ? ((trades.filter(t => t.pnl > 0).length / trades.length) * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Advanced Binance Futures Bot
          </h1>
          <p className="text-gray-400">Multi-Strategy Algorithmic Trading System</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Account Balance</span>
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-400">${accountBalance.toFixed(2)}</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total PnL</span>
              {totalPnL >= 0 ? 
                <TrendingUp className="w-5 h-5 text-green-400" /> : 
                <TrendingDown className="w-5 h-5 text-red-400" />
              }
            </div>
            <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Win Rate</span>
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-400">{winRate}%</p>
            <p className="text-xs text-gray-500">{trades.length} trades</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Status</span>
              <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            </div>
            <p className="text-2xl font-bold capitalize">{botStatus}</p>
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-purple-500/20">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuration
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">Symbol</label>
              <select 
                value={config.symbol}
                onChange={(e) => setConfig({...config, symbol: e.target.value})}
                className="w-full bg-slate-700 rounded-lg px-3 py-2 text-sm"
              >
                <option>BTCUSDT</option>
                <option>ETHUSDT</option>
                <option>BNBUSDT</option>
                <option>SOLUSDT</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Leverage</label>
              <select 
                value={config.leverage}
                onChange={(e) => setConfig({...config, leverage: parseInt(e.target.value)})}
                className="w-full bg-slate-700 rounded-lg px-3 py-2 text-sm"
              >
                <option value="5">5x</option>
                <option value="10">10x</option>
                <option value="20">20x</option>
                <option value="50">50x</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Risk %</label>
              <input 
                type="number"
                value={config.riskPercent}
                onChange={(e) => setConfig({...config, riskPercent: parseFloat(e.target.value)})}
                className="w-full bg-slate-700 rounded-lg px-3 py-2 text-sm"
                step="0.1"
                min="0.1"
                max="5"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Timeframe</label>
              <select 
                value={config.timeframe}
                onChange={(e) => setConfig({...config, timeframe: e.target.value})}
                className="w-full bg-slate-700 rounded-lg px-3 py-2 text-sm"
              >
                <option value="1m">1m</option>
                <option value="5m">5m</option>
                <option value="15m">15m</option>
                <option value="1h">1h</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Mode</label>
              <select 
                value={config.strategyMode}
                onChange={(e) => setConfig({...config, strategyMode: e.target.value})}
                className="w-full bg-slate-700 rounded-lg px-3 py-2 text-sm"
              >
                <option value="advanced">Advanced</option>
                <option value="conservative">Conservative</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={startBot}
              disabled={isRunning}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              Start Bot
            </button>

            <button
              onClick={stopBot}
              disabled={!isRunning}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Square className="w-5 h-5" />
              Stop Bot
            </button>

            <button className="flex items-center gap-2 bg-slate-700 px-6 py-3 rounded-lg font-semibold hover:bg-slate-600 transition-all">
              <RefreshCw className="w-5 h-5" />
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Price Chart */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <h3 className="text-lg font-bold mb-4">Price Action - {config.symbol}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={marketData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" tick={{fontSize: 10}} />
                <YAxis stroke="#9ca3af" tick={{fontSize: 10}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#1e293b', border: '1px solid #6366f1'}}
                  labelStyle={{color: '#fff'}}
                />
                <Area type="monotone" dataKey="price" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Active Strategies */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <h3 className="text-lg font-bold mb-4">Strategy Performance</h3>
            <div className="space-y-3">
              {Object.entries(strategies).map(([name, stats]) => (
                <div key={name} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">{name}</p>
                    <p className="text-xs text-gray-400">{stats.trades} trades</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-400">{stats.win_rate}%</p>
                    <p className="text-xs text-gray-400">+${stats.profit}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Open Positions */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <h3 className="text-lg font-bold mb-4">Open Positions ({positions.length})</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {positions.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No open positions</p>
              ) : (
                positions.map(pos => (
                  <div key={pos.id} className="p-3 bg-slate-700/50 rounded-lg border-l-4 border-purple-500">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`font-bold text-sm ${pos.type === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                        {pos.type} {pos.symbol}
                      </span>
                      <span className="text-xs text-gray-400">{pos.leverage}x</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-1">{pos.strategy}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Entry: ${pos.entry.toFixed(2)}</span>
                      <span className={`font-bold text-sm ${pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Signals */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <h3 className="text-lg font-bold mb-4">Recent Signals</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {signals.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Waiting for signals...</p>
              ) : (
                signals.map(signal => (
                  <div key={signal.id} className="p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`font-bold text-sm ${signal.type === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                        {signal.type}
                      </span>
                      <span className="text-xs text-purple-400">{signal.confidence}%</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-1">{signal.strategy}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">@ ${signal.price.toFixed(2)}</span>
                      <span className="text-xs text-gray-500">{signal.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Trade History */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <h3 className="text-lg font-bold mb-4">Trade History</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {trades.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No completed trades</p>
              ) : (
                trades.map(trade => (
                  <div key={trade.id} className="p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`font-bold text-sm ${trade.type === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.type} {trade.symbol}
                      </span>
                      <span className={`font-bold text-sm ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{trade.strategy}</p>
                    <p className="text-xs text-gray-500 mt-1">{trade.closeTime}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-500 mb-1">Risk Warning</p>
            <p className="text-sm text-gray-300">
              This is a DEMO interface. Futures trading carries high risk. Always test thoroughly before using real funds. 
              Never risk more than you can afford to lose.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BinanceFuturesBot;