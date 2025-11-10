import os
import json
import asyncio
import aiohttp
import hmac
import hashlib
import time
from urllib.parse import urlencode
from datetime import datetime
from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse, Response

def main(request, context=None):
    """Main Vercel handler for Binance Bot"""
    
    path = request.path
    method = request.method
    
    try:
        # Serve main page
        if path == "/" and method == "GET":
            try:
                # Try different locations for index.html
                for file_path in ["index.html", "../index.html", "./index.html"]:
                    if os.path.exists(file_path):
                        with open(file_path, "r", encoding="utf-8") as f:
                            return HTMLResponse(content=f.read())
                return HTMLResponse(content="<h1>index.html not found</h1>", status_code=404)
            except Exception as e:
                return HTMLResponse(content=f"<h1>Error loading page: {e}</h1>", status_code=500)
        
        # Handle static files
        elif path.startswith("/styles/") or path.startswith("/js/"):
            file_path = path[1:]  # Remove leading slash
            for try_path in [file_path, f"../{file_path}", f"./{file_path}"]:
                if os.path.exists(try_path):
                    try:
                        with open(try_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                            if try_path.endswith('.css'):
                                return Response(content, media_type='text/css')
                            elif try_path.endswith('.js'):
                                return Response(content, media_type='application/javascript')
                    except:
                        continue
            return JSONResponse(content={"error": "File not found"}, status_code=404)
        
        # Handle API routes
        elif path.startswith("/api/"):
            return handle_api_request(path, method)
        
        else:
            return JSONResponse(content={"error": "Route not found"}, status_code=404)
    
    except Exception as e:
        return JSONResponse(
            content={"error": f"Server error: {str(e)}"}, 
            status_code=500
        )

def handle_api_request(path, method):
    """Handle API requests"""
    
    try:
        # Get environment variables
        api_key = os.environ.get('BINANCE_API_KEY', '')
        secret_key = os.environ.get('BINANCE_SECRET_KEY', '')
        trading_mode = os.environ.get('TRADING_MODE', 'testnet')
        
        if path == "/api/account" and method == "GET":
            if not api_key or not secret_key:
                return JSONResponse(
                    content={"error": "API keys not configured"}, 
                    status_code=400
                )
            
            # Get balance from Binance
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                balance_data = loop.run_until_complete(fetch_binance_balance(api_key, secret_key, trading_mode == 'testnet'))
                return JSONResponse(content=balance_data)
            except Exception as e:
                return JSONResponse(content={"error": f"Balance fetch failed: {str(e)}"}, status_code=500)
            finally:
                loop.close()
        
        elif path == "/api/start" and method == "POST":
            if not api_key or not secret_key:
                return JSONResponse(content={"status": "error", "message": "API keys not configured"}, status_code=400)
            
            # Check balance before starting
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                balance_data = loop.run_until_complete(fetch_binance_balance(api_key, secret_key, trading_mode == 'testnet'))
                if balance_data.get('total', 0) < 10:
                    return JSONResponse(
                        content={"status": "error", "message": "Insufficient balance (minimum $10 required)"}, 
                        status_code=400
                    )
                return JSONResponse(content={"status": "started", "message": "Bot started successfully"})
            except Exception as e:
                return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)
            finally:
                loop.close()
        
        elif path == "/api/stop" and method == "POST":
            return JSONResponse(content={"status": "stopped", "message": "Trading bot stopped successfully"})
        
        elif path == "/api/positions" and method == "GET":
            return JSONResponse(content={"positions": [], "status": "ok"})
        
        elif path == "/api/trades" and method == "GET":
            return JSONResponse(content={"trades": [], "status": "ok"})
        
        else:
            return JSONResponse(content={"error": "API endpoint not found"}, status_code=404)
    
    except Exception as e:
        return JSONResponse(content={"error": f"API error: {str(e)}"}, status_code=500)

async def fetch_binance_balance(api_key, secret_key, testnet=True):
    """Fetch account balance from Binance Futures"""
    base_url = "https://testnet.binancefuture.com" if testnet else "https://fapi.binance.com"
    
    timestamp = int(time.time() * 1000)
    query_string = f"timestamp={timestamp}"
    signature = hmac.new(
        secret_key.encode('utf-8'),
        query_string.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    headers = {
        'X-MBX-APIKEY': api_key
    }
    
    async with aiohttp.ClientSession() as session:
        url = f"{base_url}/fapi/v2/account?{query_string}&signature={signature}"
        async with session.get(url, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                # Calculate total balance
                total_balance = 0
                for balance in data.get('balances', []):
                    wallet_balance = float(balance.get('walletBalance', 0))
                    if wallet_balance > 0:
                        total_balance += wallet_balance
                
                return {
                    "total": round(total_balance, 2),
                    "currency": "USDT",
                    "status": "ok"
                }
            else:
                error_text = await response.text()
                raise Exception(f"Binance API error: {response.status} - {error_text}")

# Vercel entry point
app = main