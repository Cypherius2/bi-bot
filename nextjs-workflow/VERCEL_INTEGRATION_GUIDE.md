# Vercel Integration Guide: AI Workflow System + Binance Bot

This guide covers how to deploy the AI Workflow System alongside your existing Binance Futures trading bot on Vercel for seamless integration.

## 🔗 Integration Architecture

```
┌─────────────────────┐    ┌─────────────────────┐
│   AI Workflow       │    │   Binance Bot       │
│   System            │◄──►│   (Existing)        │
│   (New)             │    │                     │
│                     │    │                     │
│ • Workflow Builder  │    │ • Trading Logic     │
│ • Execution Engine  │    │ • API Endpoints     │
│ • Dashboard         │    │ • Real-time Data    │
│                     │    │                     │
│ Vercel URL:         │    │ Vercel URL:         │
│ workflow-app.vercel │    │ bot-app.vercel      │
└─────────────────────┘    └─────────────────────┘
```

## 📋 Prerequisites

1. **Existing Bot Deployment**: Your Binance bot is already deployed on Vercel
2. **Vercel Account**: Both projects should be in the same Vercel account
3. **Environment Access**: Ability to set environment variables

## 🚀 Step-by-Step Integration

### Step 1: Deploy Workflow System

1. **Upload Workflow System**
   ```bash
   # In the nextjs-workflow directory
   git add .
   git commit -m "Add AI Workflow System"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to Vercel Dashboard
   - Click "New Project" 
   - Import the workflow system repository
   - Configure environment variables (see below)

### Step 2: Configure Environment Variables

**For Workflow System (`workflow-app`):**
```env
BOT_API_BASE=https://your-bot-url.vercel.app/api
NEXTAUTH_URL=https://workflow-app.vercel.app
NEXTAUTH_SECRET=your-secure-random-string
NODE_ENV=production
```

**For Existing Bot (`bot-app`):**
```env
# Add CORS headers to allow workflow system access
ALLOWED_ORIGINS=https://workflow-app.vercel.app
CORS_ORIGIN=https://workflow-app.vercel.app
```

### Step 3: Update Bot API for CORS

Update your existing bot's `api/index.py` to allow requests from the workflow system:

```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://workflow-app.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

### Step 4: Test Integration

1. **Deploy Both Applications**
   - Deploy bot application first
   - Deploy workflow system
   - Wait for both to be ready

2. **Test Bot Connection**
   ```bash
   # From workflow system
   curl https://workflow-app.vercel.app/api/bot?endpoint=account
   
   # Should return bot data from your existing bot
   ```

3. **Create Test Workflow**
   - Access workflow dashboard
   - Create a simple workflow that calls your bot's `/account` endpoint
   - Execute and verify it works

## 🔧 Configuration Options

### Option 1: Same Domain (Recommended)

Deploy both applications as subdomains:

```
workflow.yourdomain.com -> AI Workflow System
bot.yourdomain.com     -> Binance Bot
```

Update environment variables:
```env
BOT_API_BASE=https://bot.yourdomain.com/api
```

### Option 2: Separate Domains

Use Vercel's automatic domains:
- `workflow-app.vercel.app` - AI Workflow System  
- `bot-app.vercel.app` - Binance Bot

### Option 3: Custom Domains

Point custom domains to each Vercel deployment:

1. **Workflow System**: `workflow.yourdomain.com`
2. **Bot**: `bot.yourdomain.com`

## 📊 Integration Examples

### Example 1: Bot Monitoring Workflow

```typescript
const botMonitorWorkflow = {
  name: "Bot Health Monitor",
  description: "Monitors bot performance and alerts on issues",
  nodes: [
    {
      id: "check_bot",
      type: "api",
      config: {
        method: "GET",
        url: "https://bot-app.vercel.app/api/health"
      }
    },
    {
      id: "check_balance",
      type: "api", 
      config: {
        method: "GET",
        url: "https://bot-app.vercel.app/api/account"
      }
    },
    {
      id: "alert_if_issue",
      type: "condition",
      config: {
        condition: "balance < 10"
      }
    }
  ]
}
```

### Example 2: Automated Trading Workflow

```typescript
const autoTradingWorkflow = {
  name: "Auto Trading with Risk Management",
  description: "Executes trades based on market conditions",
  nodes: [
    {
      id: "get_market_data",
      type: "api",
      config: {
        method: "GET",
        url: "https://bot-app.vercel.app/api/market-data"
      }
    },
    {
      id: "check_strategy",
      type: "action",
      config: {
        action: "evaluate_strategy",
        parameters: {
          symbol: "BTCUSDT",
          timeframe: "1h"
        }
      }
    },
    {
      id: "execute_trade",
      type: "api",
      config: {
        method: "POST",
        url: "https://bot-app.vercel.app/api/execute-trade",
        headers: {
          "Content-Type": "application/json"
        }
      }
    }
  ]
}
```

### Example 3: Portfolio Analysis Workflow

```typescript
const portfolioAnalysisWorkflow = {
  name: "Daily Portfolio Analysis",
  description: "Analyzes portfolio performance and generates reports",
  nodes: [
    {
      id: "get_positions",
      type: "api",
      config: {
        method: "GET",
        url: "https://bot-app.vercel.app/api/positions"
      }
    },
    {
      id: "analyze_pnl",
      type: "action",
      config: {
        action: "calculate_pnl",
        parameters: {
          timeframe: "1d"
        }
      }
    },
    {
      id: "generate_report",
      type: "action",
      config: {
        action: "send_report",
        parameters: {
          format: "json",
          channels: ["email", "telegram"]
        }
      }
    }
  ]
}
```

## 🔒 Security Configuration

### 1. API Key Management

Use Vercel environment variables to store API keys securely:

**Bot Application:**
```env
BINANCE_API_KEY=your_binance_api_key
BINANCE_SECRET_KEY=your_binance_secret
API_KEY_VALIDATION=true
```

**Workflow System:**
```env
BOT_API_KEY=workflow_access_key
```

### 2. Request Validation

Add request validation to bot API:

```python
from fastapi import Header, HTTPException
import os

async def validate_api_key(api_key: str = Header(None)):
    if not api_key or api_key != os.getenv("BOT_API_KEY"):
        raise HTTPException(status_code=401, detail="Invalid API key")
    return api_key

@app.get("/api/account")
async def get_account(api_key: str = Depends(validate_api_key)):
    # Your existing account logic
    return account_data
```

### 3. Rate Limiting

Implement rate limiting for workflow requests:

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/account")
@limiter.limit("10/minute")
async def get_account(request: Request):
    return account_data
```

## 📈 Monitoring & Debugging

### 1. Health Check Endpoint

Add health check to bot API:

```python
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "binance": check_binance_connection(),
            "database": check_database_connection()
        }
    }
```

### 2. Workflow Execution Logs

Add logging to track workflow execution:

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("workflow")

@app.post("/api/execute-trade")
async def execute_trade(trade_data: dict, request_id: str = None):
    logger.info(f"Executing trade: {trade_data}, request_id: {request_id}")
    # Your trade execution logic
```

### 3. Vercel Function Logs

Monitor function execution in Vercel dashboard:

1. Go to Vercel Dashboard
2. Select your bot deployment
3. Click "Functions" tab
4. Monitor real-time logs

## 🛠️ Troubleshooting

### Common Issues

**1. CORS Errors**
```
Access to fetch at 'https://bot-app.vercel.app/api/account' from origin 
'https://workflow-app.vercel.app' has been blocked by CORS policy
```

**Solution**: Update CORS settings in bot API:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://workflow-app.vercel.app"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

**2. API Key Errors**
```
401 Unauthorized: Invalid API key
```

**Solution**: Ensure API keys are correctly set in both applications:
```env
# Bot application
BOT_API_KEY=shared_secret_key

# Workflow system  
BOT_API_KEY=shared_secret_key
```

**3. Timeout Errors**
```
504 Gateway Timeout
```

**Solution**: Increase timeout for workflow API calls:
```python
# In workflow system
const response = await fetch(botUrl, {
  method: 'GET',
  headers: { 'Timeout': '30000' }
})
```

### Debug Commands

```bash
# Test bot API directly
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://bot-app.vercel.app/api/account

# Test workflow API
curl https://workflow-app.vercel.app/api/bot?endpoint=account

# Check environment variables (Vercel CLI)
vercel env ls
vercel env get BOT_API_BASE
```

## 🚀 Advanced Features

### 1. WebSocket Integration

Connect workflow system to bot's WebSocket for real-time updates:

```typescript
// In workflow execution
const ws = new WebSocket('wss://bot-app.vercel.app/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle real-time bot updates
};
```

### 2. Webhook Integration

Set up webhooks for external triggers:

```python
@app.post("/api/webhook/trading-signal")
async def trading_signal_webhook(signal: dict):
    # Trigger workflow from external signal
    await trigger_workflow("trading-workflow", signal)
```

### 3. Scheduled Workflows

Use Vercel Cron Jobs for scheduled execution:

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/workflows/execute",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

## 📋 Checklist

- [ ] Both applications deployed on Vercel
- [ ] Environment variables configured
- [ ] CORS settings updated in bot API
- [ ] API key validation implemented
- [ ] Health check endpoint added
- [ ] Test workflow created and executed
- [ ] Monitoring and logging set up
- [ ] Security measures implemented
- [ ] Rate limiting configured (if needed)

## 🎉 Next Steps

After integration is complete:

1. **Create Advanced Workflows** - Use the visual builder to create complex automations
2. **Set Up Monitoring** - Configure alerts and health checks
3. **Add External Integrations** - Connect to other services (Slack, email, etc.)
4. **Optimize Performance** - Monitor execution times and optimize workflows
5. **Scale Usage** - Add more workflows as your automation needs grow

---

**Your AI workflow system is now integrated with your Binance bot! 🎉**

For support and questions, refer to the main README.md or create an issue in the repository.