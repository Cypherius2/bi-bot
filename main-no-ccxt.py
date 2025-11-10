import asyncio
import aiohttp
import json
import hmac
import hashlib
from urllib.parse import urlencode
import time
import os
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.responses import FileResponse
from pydantic import BaseModel
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Simple Binance Client (No CCXT dependency)
class SimpleBinanceClient:
    def __init__(self, api_key, api_secret, testnet=True):
        self.api_key = api_key
        self.api_secret = api_secret
        self.base_url = "https://testnet.binancefuture.com" if testnet else "https://fapi.binance.com"
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def _generate_signature(self, query_string):
        """Generate HMAC SHA256 signature"""
        return hmac.new(
            self.api_secret.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
    
    async def fetch_balance(self):
        """Fetch account balance from Binance Futures"""
        try:
            timestamp = int(time.time() * 1000)
            query_string = f"timestamp={timestamp}"
            signature = self._generate_signature(query_string)
            
            url = f"{self.base_url}/fapi/v2/balance"
            params = {
                "timestamp": timestamp,
                "signature": signature
            }
            
            headers = {"X-MBX-APIKEY": self.api_key}
            
            async with self.session.get(url, params=params, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    # Extract USDT balance
                    usdt_balance = next((item for item in data if item.get('asset') == 'USDT'), None)
                    if usdt_balance:
                        return {
                            'total': float(usdt_balance.get('balance', 0)),
                            'free': float(usdt_balance.get('free', 0)),
                            'used': float(usdt_balance.get('locked', 0))
                        }
                    return {'total': 0, 'free': 0, 'used': 0}
                else:
                    logger.error(f"Error fetching balance: {response.status}")
                    return {'total': 0, 'free': 0, 'used': 0}
        except Exception as e:
            logger.error(f"Error in fetch_balance: {e}")
            return {'total': 0, 'free': 0, 'used': 0}
    
    async def fetch_positions(self):
        """Fetch open positions"""
        try:
            timestamp = int(time.time() * 1000)
            query_string = f"timestamp={timestamp}"
            signature = self._generate_signature(query_string)
            
            url = f"{self.base_url}/fapi/v2/positionRisk"
            params = {
                "timestamp": timestamp,
                "signature": signature
            }
            
            headers = {"X-MBX-APIKEY": self.api_key}
            
            async with self.session.get(url, params=params, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    # Filter active positions
                    positions = [pos for pos in data if float(pos.get('positionAmt', 0)) != 0]
                    return positions
                return []
        except Exception as e:
            logger.error(f"Error fetching positions: {e}")
            return []

# Load environment variables
def load_env():
    """Load environment variables from .env file"""
    env_vars = {}
    try:
        with open('.env', 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    key, value = line.split('=', 1)
                    env_vars[key] = value
    except FileNotFoundError:
        logger.warning(".env file not found, using default testnet credentials")
        env_vars = {
            'BINANCE_API_KEY': 'test_key',
            'BINANCE_SECRET_KEY': 'test_secret',
            'TRADING_MODE': 'testnet'
        }
    return env_vars

# Global client instance
env_vars = load_env()
binance_client = None

# Trading Bot class
class TradingBot:
    def __init__(self):
        self.api_key = env_vars.get('BINANCE_API_KEY', 'test_key')
        self.api_secret = env_vars.get('BINANCE_SECRET_KEY', 'test_secret')
        self.is_running = False
        self.positions = []
        self.trades = []
        self.total_pnl = 0.0
        
    async def start(self):
        """Start the trading bot"""
        global binance_client
        self.is_running = True
        
        async with SimpleBinanceClient(
            api_key=self.api_key,
            api_secret=self.api_secret,
            testnet=env_vars.get('TRADING_MODE', 'testnet') == 'testnet'
        ) as client:
            binance_client = client
            
            # Initial balance fetch
            await self.update_account_data()
            
            # Start the main loop
            await self.trading_loop()
    
    async def stop(self):
        """Stop the trading bot"""
        self.is_running = False
    
    async def update_account_data(self):
        """Update account data from Binance"""
        global binance_client
        if not binance_client:
            return
        
        try:
            # Fetch balance
            balance_data = await binance_client.fetch_balance()
            
            # Fetch positions
            positions_data = await binance_client.fetch_positions()
            
            # Update global account info
            self.account_data = {
                'total': balance_data.get('total', 0),
                'free': balance_data.get('free', 0),
                'used': balance_data.get('used', 0),
                'positions': positions_data,
                'trades': self.trades,
                'totalPnL': self.total_pnl,
                'lastUpdate': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error updating account data: {e}")
    
    async def trading_loop(self):
        """Main trading loop"""
        while self.is_running:
            try:
                # Update account data every 30 seconds
                await self.update_account_data()
                await asyncio.sleep(30)
                
            except Exception as e:
                logger.error(f"Error in trading loop: {e}")
                await asyncio.sleep(5)

# Initialize trading bot
trading_bot = TradingBot()
app = FastAPI(title="Advanced Binance Futures Bot", version="2.0.0")

# WebSocket manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    """Serve the main HTML file"""
    try:
        with open("index.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse(content="<h1>index.html not found</h1>", status_code=404)

@app.get("/api/account")
async def get_account():
    """Get account information"""
    try:
        global trading_bot, env_vars
        
        # If trading bot is running and has account data, use it
        if hasattr(trading_bot, 'account_data') and trading_bot.account_data:
            logger.info("Returning real account data from trading bot")
            return trading_bot.account_data
        
        # If bot is not running, try to fetch real balance directly
        else:
            logger.info("Fetching fresh account balance from Binance")
            
            # Create a temporary client to fetch balance
            api_key = env_vars.get('BINANCE_API_KEY', '')
            api_secret = env_vars.get('BINANCE_SECRET_KEY', '')
            
            if not api_key or not api_secret:
                logger.warning("No API credentials found in environment")
                return {
                    'total': 0.0,
                    'free': 0.0,
                    'used': 0.0,
                    'positions': [],
                    'trades': [],
                    'totalPnL': 0.0,
                    'lastUpdate': datetime.now().isoformat(),
                    'status': 'no_api_credentials'
                }
            
            # Fetch real balance from Binance
            async with SimpleBinanceClient(
                api_key=api_key,
                api_secret=api_secret,
                testnet=env_vars.get('TRADING_MODE', 'testnet') == 'testnet'
            ) as client:
                balance_data = await client.fetch_balance()
                
                return {
                    'total': balance_data.get('total', 0.0),
                    'free': balance_data.get('free', 0.0),
                    'used': balance_data.get('used', 0.0),
                    'positions': [],
                    'trades': [],
                    'totalPnL': 0.0,
                    'lastUpdate': datetime.now().isoformat(),
                    'status': 'real_account'
                }
                
    except Exception as e:
        logger.error(f"Error in get_account: {e}")
        return {
            'total': 0.0,
            'free': 0.0,
            'used': 0.0,
            'positions': [],
            'trades': [],
            'totalPnL': 0.0,
            'error': str(e)
        }

@app.get("/api/positions")
async def get_positions():
    """Get current positions"""
    try:
        if hasattr(trading_bot, 'account_data'):
            return trading_bot.account_data.get('positions', [])
        return []
    except Exception as e:
        logger.error(f"Error in get_positions: {e}")
        return []

@app.get("/api/trades")
async def get_trades():
    """Get trade history"""
    try:
        if hasattr(trading_bot, 'account_data'):
            return trading_bot.account_data.get('trades', [])
        return []
    except Exception as e:
        logger.error(f"Error in get_trades: {e}")
        return []

@app.post("/api/start")
async def start_bot():
    """Start the trading bot"""
    try:
        # Check if bot is already running
        if trading_bot.is_running:
            return {"status": "running", "message": "Bot is already running"}
        
        # Validate account balance before starting
        api_key = env_vars.get('BINANCE_API_KEY', '')
        api_secret = env_vars.get('BINANCE_SECRET_KEY', '')
        
        if not api_key or not api_secret:
            return {
                "status": "error", 
                "message": "API credentials not found. Please configure .env file."
            }
        
        # Check account balance
        balance_data = {'total': 0}
        try:
            async with SimpleBinanceClient(
                api_key=api_key,
                api_secret=api_secret,
                testnet=env_vars.get('TRADING_MODE', 'testnet') == 'testnet'
            ) as client:
                balance_data = await client.fetch_balance()
        except Exception as e:
            logger.error(f"Failed to fetch balance: {e}")
            return {
                "status": "error", 
                "message": f"Failed to connect to Binance API: {str(e)}"
            }
        
        # Check if account has sufficient balance
        account_balance = balance_data.get('total', 0)
        if account_balance <= 0:
            return {
                "status": "blocked", 
                "message": f"Account balance is ${account_balance:.2f}. Cannot start bot with zero balance.",
                "balance": account_balance
            }
        
        # Start the bot
        logger.info(f"Starting bot with account balance: ${account_balance:.2f}")
        asyncio.create_task(trading_bot.start())
        return {
            "status": "started", 
            "message": f"Trading bot started successfully. Balance: ${account_balance:.2f}",
            "balance": account_balance
        }
        
    except Exception as e:
        logger.error(f"Error starting bot: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/api/stop")
async def stop_bot():
    """Stop the trading bot"""
    try:
        await trading_bot.stop()
        return {"status": "stopped", "message": "Trading bot stopped successfully"}
    except Exception as e:
        logger.error(f"Error stopping bot: {e}")
        return {"status": "error", "message": str(e)}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle client messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Mount static files with better error handling
try:
    if os.path.exists("styles"):
        app.mount("/styles", StaticFiles(directory="styles"), name="styles")
        logger.info("✅ Static styles mounted")
    if os.path.exists("js"):
        app.mount("/js", StaticFiles(directory="js"), name="js")
        logger.info("✅ Static JS mounted")
except Exception as e:
    logger.warning(f"Static file mounting failed: {e}")

if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment (for platforms like Heroku, Railway, etc.)
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    logger.info("Starting Advanced Binance Futures Bot...")
    logger.info(f"🎮 Cyberpunk interface with real account integration active!")
    logger.info(f"Server running on {host}:{port}")
    
    uvicorn.run(app, host=host, port=port, log_level="info")
