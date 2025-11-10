# Alternative simple Binance API client (without CCXT)
import asyncio
import aiohttp
import json
import hmac
import hashlib
from urllib.parse import urlencode
import time
from datetime import datetime

class SimpleBinanceClient:
    def __init__(self, api_key, api_secret, testnet=True):
        self.api_key = api_key
        self.api_secret = api_secret
        self.base_url = "https://testnet.binancefuture.com" if testnet else "https://fapi.binance.com"
        self.session = aiohttp.ClientSession()
    
    async def close(self):
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
                    print(f"Error fetching balance: {response.status}")
                    return {'total': 0, 'free': 0, 'used': 0}
        except Exception as e:
            print(f"Error in fetch_balance: {e}")
            return {'total': 0, 'free': 0, 'used': 0}

# Usage example:
# client = SimpleBinanceClient("your_api_key", "your_secret", testnet=True)
# balance = await client.fetch_balance()
# print(f"USDT Balance: ${balance['total']}")
