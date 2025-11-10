# Advanced Binance Futures Trading Bot - Backend
# File: main.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ccxt
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import asyncio
from typing import List, Dict, Optional
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Advanced Binance Futures Bot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====================== CONFIGURATION ======================

class BotConfig(BaseModel):
    symbol: str = "BTC/USDT:USDT"
    leverage: int = 10
    risk_percent: float = 1.0
    timeframe: str = "5m"
    strategy_mode: str = "advanced"
    max_positions: int = 3

class TradeSignal(BaseModel):
    symbol: str
    type: str
    entry_price: float
    stop_loss: float
    take_profit: float
    strategy: str
    confidence: float
    size: float

# ====================== EXCHANGE SETUP ======================

exchange = ccxt.binance({
    'apiKey': os.getenv('BINANCE_API_KEY'),
    'secret': os.getenv('BINANCE_SECRET_KEY'),
    'enableRateLimit': True,
    'options': {
        'defaultType': 'future',
        'adjustForTimeDifference': True
    }
})

# ====================== ADVANCED INDICATORS ======================

class AdvancedIndicators:
    
    @staticmethod
    def calculate_ema(data: pd.Series, period: int) -> pd.Series:
        """Exponential Moving Average"""
        return data.ewm(span=period, adjust=False).mean()
    
    @staticmethod
    def calculate_rsi(data: pd.Series, period: int = 14) -> pd.Series:
        """Relative Strength Index"""
        delta = data.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))
    
    @staticmethod
    def calculate_vwap(df: pd.DataFrame) -> pd.Series:
        """Volume Weighted Average Price"""
        typical_price = (df['high'] + df['low'] + df['close']) / 3
        return (typical_price * df['volume']).cumsum() / df['volume'].cumsum()
    
    @staticmethod
    def calculate_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
        """Average True Range"""
        high_low = df['high'] - df['low']
        high_close = np.abs(df['high'] - df['close'].shift())
        low_close = np.abs(df['low'] - df['close'].shift())
        ranges = pd.concat([high_low, high_close, low_close], axis=1)
        true_range = ranges.max(axis=1)
        return true_range.rolling(period).mean()
    
    @staticmethod
    def calculate_bollinger_bands(data: pd.Series, period: int = 20, std: float = 2):
        """Bollinger Bands"""
        sma = data.rolling(window=period).mean()
        std_dev = data.rolling(window=period).std()
        upper = sma + (std_dev * std)
        lower = sma - (std_dev * std)
        return upper, sma, lower
    
    @staticmethod
    def calculate_macd(data: pd.Series, fast=12, slow=26, signal=9):
        """Moving Average Convergence Divergence"""
        ema_fast = data.ewm(span=fast, adjust=False).mean()
        ema_slow = data.ewm(span=slow, adjust=False).mean()
        macd = ema_fast - ema_slow
        signal_line = macd.ewm(span=signal, adjust=False).mean()
        histogram = macd - signal_line
        return macd, signal_line, histogram
    
    @staticmethod
    def calculate_obv(df: pd.DataFrame) -> pd.Series:
        """On Balance Volume"""
        obv = (np.sign(df['close'].diff()) * df['volume']).fillna(0).cumsum()
        return obv
    
    @staticmethod
    def calculate_delta(df: pd.DataFrame) -> pd.Series:
        """Price Delta (buying vs selling pressure)"""
        return df['close'] - df['open']

# ====================== ADVANCED STRATEGIES ======================

class AdvancedStrategies:
    
    def __init__(self, df: pd.DataFrame):
        self.df = df
        self.indicators = AdvancedIndicators()
    
    def ema_crossover_rsi_strategy(self) -> Optional[Dict]:
        """
        EMA Crossover with RSI Confirmation
        - Fast EMA (9) crosses Slow EMA (21)
        - RSI confirms momentum
        - Volume above average
        """
        df = self.df.copy()
        
        df['ema_9'] = self.indicators.calculate_ema(df['close'], 9)
        df['ema_21'] = self.indicators.calculate_ema(df['close'], 21)
        df['ema_50'] = self.indicators.calculate_ema(df['close'], 50)
        df['rsi'] = self.indicators.calculate_rsi(df['close'], 14)
        df['volume_avg'] = df['volume'].rolling(20).mean()
        
        last = df.iloc[-1]
        prev = df.iloc[-2]
        
        # Long Signal
        if (prev['ema_9'] <= prev['ema_21'] and 
            last['ema_9'] > last['ema_21'] and
            last['rsi'] > 50 and last['rsi'] < 70 and
            last['close'] > last['ema_50'] and
            last['volume'] > last['volume_avg'] * 1.2):
            
            atr = self.indicators.calculate_atr(df).iloc[-1]
            return {
                'type': 'LONG',
                'entry': last['close'],
                'stop_loss': last['close'] - (2 * atr),
                'take_profit': last['close'] + (4 * atr),
                'confidence': 75,
                'strategy': 'EMA Crossover with RSI'
            }
        
        # Short Signal
        if (prev['ema_9'] >= prev['ema_21'] and 
            last['ema_9'] < last['ema_21'] and
            last['rsi'] < 50 and last['rsi'] > 30 and
            last['close'] < last['ema_50'] and
            last['volume'] > last['volume_avg'] * 1.2):
            
            atr = self.indicators.calculate_atr(df).iloc[-1]
            return {
                'type': 'SHORT',
                'entry': last['close'],
                'stop_loss': last['close'] + (2 * atr),
                'take_profit': last['close'] - (4 * atr),
                'confidence': 75,
                'strategy': 'EMA Crossover with RSI'
            }
        
        return None
    
    def volume_profile_order_flow_strategy(self) -> Optional[Dict]:
        """
        Volume Profile + Order Flow Analysis
        - High volume nodes as support/resistance
        - Delta divergence detection
        - VWAP confirmation
        """
        df = self.df.copy()
        
        df['vwap'] = self.indicators.calculate_vwap(df)
        df['delta'] = self.indicators.calculate_delta(df)
        df['delta_ema'] = self.indicators.calculate_ema(df['delta'], 9)
        df['volume_ma'] = df['volume'].rolling(20).mean()
        
        last = df.iloc[-1]
        
        # Long Signal - Strong buying pressure at VWAP
        if (last['close'] > last['vwap'] and
            last['delta'] > 0 and
            last['delta'] > last['delta_ema'] * 1.5 and
            last['volume'] > last['volume_ma'] * 1.5):
            
            atr = self.indicators.calculate_atr(df).iloc[-1]
            return {
                'type': 'LONG',
                'entry': last['close'],
                'stop_loss': last['vwap'] - atr,
                'take_profit': last['close'] + (3 * atr),
                'confidence': 80,
                'strategy': 'Volume Profile + Order Flow'
            }
        
        # Short Signal - Strong selling pressure at VWAP
        if (last['close'] < last['vwap'] and
            last['delta'] < 0 and
            last['delta'] < last['delta_ema'] * 1.5 and
            last['volume'] > last['volume_ma'] * 1.5):
            
            atr = self.indicators.calculate_atr(df).iloc[-1]
            return {
                'type': 'SHORT',
                'entry': last['close'],
                'stop_loss': last['vwap'] + atr,
                'take_profit': last['close'] - (3 * atr),
                'confidence': 80,
                'strategy': 'Volume Profile + Order Flow'
            }
        
        return None
    
    def market_structure_break_strategy(self) -> Optional[Dict]:
        """
        Market Structure Break Detection
        - Identifies swing highs/lows
        - Detects break of structure (BOS)
        - Confirms with momentum
        """
        df = self.df.copy()
        
        # Find swing points
        df['swing_high'] = df['high'].rolling(5, center=True).max()
        df['swing_low'] = df['low'].rolling(5, center=True).min()
        df['is_swing_high'] = df['high'] == df['swing_high']
        df['is_swing_low'] = df['low'] == df['swing_low']
        
        df['rsi'] = self.indicators.calculate_rsi(df['close'], 14)
        macd, signal, hist = self.indicators.calculate_macd(df['close'])
        df['macd_hist'] = hist
        
        last = df.iloc[-1]
        
        # Get recent swing points
        recent_highs = df[df['is_swing_high']].tail(3)
        recent_lows = df[df['is_swing_low']].tail(3)
        
        if len(recent_highs) >= 2:
            prev_high = recent_highs.iloc[-2]['high']
            if (last['close'] > prev_high and
                last['rsi'] > 55 and
                last['macd_hist'] > 0):
                
                atr = self.indicators.calculate_atr(df).iloc[-1]
                return {
                    'type': 'LONG',
                    'entry': last['close'],
                    'stop_loss': recent_lows.iloc[-1]['low'] if len(recent_lows) > 0 else last['close'] - (2 * atr),
                    'take_profit': last['close'] + (3 * atr),
                    'confidence': 72,
                    'strategy': 'Market Structure Break'
                }
        
        if len(recent_lows) >= 2:
            prev_low = recent_lows.iloc[-2]['low']
            if (last['close'] < prev_low and
                last['rsi'] < 45 and
                last['macd_hist'] < 0):
                
                atr = self.indicators.calculate_atr(df).iloc[-1]
                return {
                    'type': 'SHORT',
                    'entry': last['close'],
                    'stop_loss': recent_highs.iloc[-1]['high'] if len(recent_highs) > 0 else last['close'] + (2 * atr),
                    'take_profit': last['close'] - (3 * atr),
                    'confidence': 72,
                    'strategy': 'Market Structure Break'
                }
        
        return None
    
    def liquidity_sweep_fvg_strategy(self) -> Optional[Dict]:
        """
        Liquidity Sweep + Fair Value Gap Detection
        - Detects liquidity grabs (stop hunts)
        - Identifies fair value gaps (imbalances)
        - Confirms with volume
        """
        df = self.df.copy()
        
        # Detect Fair Value Gaps
        df['fvg_up'] = (df['low'].shift(-1) > df['high'].shift(1))
        df['fvg_down'] = (df['high'].shift(-1) < df['low'].shift(1))
        
        df['volume_ma'] = df['volume'].rolling(20).mean()
        df['atr'] = self.indicators.calculate_atr(df, 14)
        
        last_3 = df.tail(3)
        last = last_3.iloc[-1]
        
        # Long Signal - Liquidity sweep below low, then reversal into FVG
        if (last_3['low'].min() < last_3['low'].iloc[0] and
            last['close'] > last_3['high'].iloc[1] and
            last['fvg_up'] and
            last['volume'] > last['volume_ma'] * 1.5):
            
            return {
                'type': 'LONG',
                'entry': last['close'],
                'stop_loss': last_3['low'].min() - last['atr'],
                'take_profit': last['close'] + (last['close'] - last_3['low'].min()) * 2,
                'confidence': 82,
                'strategy': 'Liquidity Sweep + FVG'
            }
        
        # Short Signal - Liquidity sweep above high, then reversal into FVG
        if (last_3['high'].max() > last_3['high'].iloc[0] and
            last['close'] < last_3['low'].iloc[1] and
            last['fvg_down'] and
            last['volume'] > last['volume_ma'] * 1.5):
            
            return {
                'type': 'SHORT',
                'entry': last['close'],
                'stop_loss': last_3['high'].max() + last['atr'],
                'take_profit': last['close'] - (last_3['high'].max() - last['close']) * 2,
                'confidence': 82,
                'strategy': 'Liquidity Sweep + FVG'
            }
        
        return None
    
    def delta_divergence_strategy(self) -> Optional[Dict]:
        """
        Volume Delta Divergence Strategy
        - Price makes higher high but delta makes lower high (bearish)
        - Price makes lower low but delta makes higher low (bullish)
        - OBV confirmation
        """
        df = self.df.copy()
        
        df['delta'] = self.indicators.calculate_delta(df)
        df['obv'] = self.indicators.calculate_obv(df)
        df['obv_ma'] = df['obv'].rolling(20).mean()
        df['rsi'] = self.indicators.calculate_rsi(df['close'], 14)
        
        last_20 = df.tail(20)
        
        # Bullish Divergence
        price_lows = last_20.nsmallest(2, 'low')
        if len(price_lows) == 2:
            if (price_lows.iloc[1]['low'] < price_lows.iloc[0]['low'] and
                price_lows.iloc[1]['delta'] > price_lows.iloc[0]['delta'] and
                last_20.iloc[-1]['obv'] > last_20.iloc[-1]['obv_ma'] and
                last_20.iloc[-1]['rsi'] < 40):
                
                atr = self.indicators.calculate_atr(df).iloc[-1]
                return {
                    'type': 'LONG',
                    'entry': last_20.iloc[-1]['close'],
                    'stop_loss': price_lows.iloc[1]['low'] - atr,
                    'take_profit': last_20.iloc[-1]['close'] + (3 * atr),
                    'confidence': 78,
                    'strategy': 'Delta Divergence'
                }
        
        # Bearish Divergence
        price_highs = last_20.nlargest(2, 'high')
        if len(price_highs) == 2:
            if (price_highs.iloc[1]['high'] > price_highs.iloc[0]['high'] and
                price_highs.iloc[1]['delta'] < price_highs.iloc[0]['delta'] and
                last_20.iloc[-1]['obv'] < last_20.iloc[-1]['obv_ma'] and
                last_20.iloc[-1]['rsi'] > 60):
                
                atr = self.indicators.calculate_atr(df).iloc[-1]
                return {
                    'type': 'SHORT',
                    'entry': last_20.iloc[-1]['close'],
                    'stop_loss': price_highs.iloc[1]['high'] + atr,
                    'take_profit': last_20.iloc[-1]['close'] - (3 * atr),
                    'confidence': 78,
                    'strategy': 'Delta Divergence'
                }
        
        return None

# ====================== BOT CORE ======================

class TradingBot:
    def __init__(self, config: BotConfig):
        self.config = config
        self.is_running = False
        self.positions = []
        self.balance = 10000  # Starting balance
        
    async def fetch_ohlcv(self, symbol: str, timeframe: str, limit: int = 100):
        """Fetch OHLCV data from exchange"""
        try:
            ohlcv = exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
            df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            return df
        except Exception as e:
            print(f"Error fetching data: {e}")
            return None
    
    async def analyze_market(self, df: pd.DataFrame) -> List[Dict]:
        """Run all strategies and return signals"""
        strategies = AdvancedStrategies(df)
        signals = []
        
        # Run all strategies
        strategy_methods = [
            strategies.ema_crossover_rsi_strategy,
            strategies.volume_profile_order_flow_strategy,
            strategies.market_structure_break_strategy,
            strategies.liquidity_sweep_fvg_strategy,
            strategies.delta_divergence_strategy
        ]
        
        for method in strategy_methods:
            signal = method()
            if signal:
                signals.append(signal)
        
        # Sort by confidence
        signals.sort(key=lambda x: x['confidence'], reverse=True)
        return signals
    
    def calculate_position_size(self, entry: float, stop_loss: float) -> float:
        """Calculate position size based on risk management"""
        risk_amount = self.balance * (self.config.risk_percent / 100)
        stop_distance = abs(entry - stop_loss)
        position_size = (risk_amount / stop_distance) * self.config.leverage
        return round(position_size, 3)
    
    async def execute_trade(self, signal: Dict):
        """Execute trade based on signal"""
        try:
            size = self.calculate_position_size(signal['entry'], signal['stop_loss'])
            
            # In production, use exchange.create_order()
            # For demo, just log
            print(f"📈 TRADE EXECUTED: {signal['type']} @ {signal['entry']}")
            print(f"   Strategy: {signal['strategy']}")
            print(f"   Size: {size}, SL: {signal['stop_loss']}, TP: {signal['take_profit']}")
            
            return True
        except Exception as e:
            print(f"Error executing trade: {e}")
            return False
    
    async def run(self):
        """Main bot loop"""
        self.is_running = True
        print("🤖 Bot started...")
        
        while self.is_running:
            try:
                # Fetch market data
                df = await self.fetch_ohlcv(
                    self.config.symbol,
                    self.config.timeframe
                )
                
                if df is not None and len(df) > 50:
                    # Analyze market
                    signals = await self.analyze_market(df)
                    
                    if signals and len(self.positions) < self.config.max_positions:
                        # Execute best signal
                        best_signal = signals[0]
                        await self.execute_trade(best_signal)
                
                # Wait before next iteration
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                print(f"Error in bot loop: {e}")
                await asyncio.sleep(60)
    
    def stop(self):
        """Stop the bot"""
        self.is_running = False
        print("🛑 Bot stopped")

# ====================== API ENDPOINTS ======================

bot_instance = None

@app.post("/start-bot")
async def start_bot(config: BotConfig):
    global bot_instance
    
    if bot_instance and bot_instance.is_running:
        raise HTTPException(400, "Bot is already running")
    
    bot_instance = TradingBot(config)
    asyncio.create_task(bot_instance.run())
    
    return {"status": "Bot started successfully"}

@app.post("/stop-bot")
async def stop_bot():
    global bot_instance
    
    if not bot_instance:
        raise HTTPException(400, "Bot is not running")
    
    bot_instance.stop()
    return {"status": "Bot stopped successfully"}

@app.get("/status")
async def get_status():
    if not bot_instance:
        return {
            "is_running": False,
            "balance": 0,
            "positions": []
        }
    
    return {
        "is_running": bot_instance.is_running,
        "balance": bot_instance.balance,
        "positions": bot_instance.positions
    }

@app.get("/")
async def root():
    return {"message": "Advanced Binance Futures Bot API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)