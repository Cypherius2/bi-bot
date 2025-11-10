# AI Workflow System

A powerful Next.js-based AI workflow management system designed for automated processes and agent orchestration. Built specifically for deployment on Vercel with seamless integration capabilities.

## 🚀 Features

- **Visual Workflow Builder**: Create complex workflows with drag-and-drop interface
- **Real-time Execution Monitoring**: Track workflow execution status and results
- **AI Agent Integration**: Connect with existing bot systems and external APIs
- **Cyberpunk UI Theme**: Modern, responsive interface with neon aesthetics
- **Multi-step Workflows**: Support for conditional logic, loops, and API calls
- **Execution History**: Track all workflow runs with detailed logs
- **Webhook Support**: Trigger workflows from external events
- **Schedule Management**: Automate workflow execution based on time intervals
- **Vercel Optimized**: Built for serverless deployment with Edge Runtime

## 🛠 Technology Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom cyberpunk theme
- **UI Components**: Lucide React icons
- **State Management**: React hooks and context
- **API**: Next.js API routes with TypeScript
- **Deployment**: Vercel with serverless functions
- **Charts**: Recharts for analytics visualization

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Vercel account (for deployment)

### Local Development

1. **Clone and Install**
```bash
git clone <your-repo>
cd nextjs-workflow
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

3. **Run Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🚀 Vercel Deployment

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
vercel --prod
```

### Method 2: Vercel Dashboard

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository

2. **Configure Environment Variables**
   ```env
   BOT_API_BASE=https://your-bot-vercel-url.vercel.app/api
   NEXTAUTH_URL=https://your-workflow-url.vercel.app
   NEXTAUTH_SECRET=your-random-secret-here
   ```

3. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

## 🔧 Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `BOT_API_BASE` | Base URL for bot API integration | `https://your-bot.vercel.app/api` |
| `NEXTAUTH_SECRET` | Secret for authentication | `random-32-char-string` |
| `NEXTAUTH_URL` | Base URL of your deployment | `https://your-workflow.vercel.app` |
| `DATABASE_URL` | Database connection (optional) | `postgresql://...` |

### Bot Integration

To integrate with your existing bot:

1. **Update BOT_API_BASE** in environment variables
2. **Test Connection** using the Bot Health API endpoint
3. **Create Workflows** that call your bot endpoints

Example integration:
```typescript
// In your workflow builder
{
  "type": "api",
  "config": {
    "method": "GET",
    "url": "https://your-bot.vercel.app/api/account",
    "headers": {
      "Authorization": "Bearer your-api-key"
    }
  }
}
```

## 📚 Usage Guide

### Creating Your First Workflow

1. **Access Workflow Builder**
   - Click "New Workflow" in the dashboard
   - Enter workflow name and description

2. **Add Workflow Steps**
   - Select node type (API, Condition, Action, etc.)
   - Configure each node's parameters
   - Connect nodes in execution order

3. **Test and Deploy**
   - Save the workflow
   - Use action buttons to start/stop execution
   - Monitor execution status and results

### Workflow Node Types

- **API Call**: Make HTTP requests to external services
- **Condition**: Check if conditions are met before proceeding
- **Action**: Perform actions (trading, notifications, etc.)
- **Trigger**: Start workflows based on events or schedules
- **Data Source**: Fetch data from APIs or databases
- **Loop**: Iterate over data sets
- **Delay**: Add time delays between steps

### Example: Binance Bot Integration

```typescript
// Create a monitoring workflow
{
  "name": "Binance Balance Monitor",
  "description": "Monitors trading account balance",
  "nodes": [
    {
      "type": "api",
      "config": {
        "method": "GET",
        "url": "/api/account",
        "timeout": 10000
      }
    },
    {
      "type": "condition",
      "config": {
        "condition": "balance < 10",
        "operator": "less_than"
      }
    },
    {
      "type": "action",
      "config": {
        "action": "send_alert",
        "parameters": {
          "type": "low_balance",
          "threshold": 10
        }
      }
    }
  ]
}
```

## 🔌 API Reference

### Workflows API

```http
# Get all workflows
GET /api/workflows

# Create new workflow
POST /api/workflows
Content-Type: application/json

{
  "name": "My Workflow",
  "description": "Description",
  "nodes": [...],
  "connections": [...]
}

# Update workflow
PUT /api/workflows/:id

# Delete workflow
DELETE /api/workflows/:id
```

### Executions API

```http
# Get executions
GET /api/executions?workflowId=:id&status=running

# Start execution
POST /api/executions
Content-Type: application/json

{
  "workflowId": "workflow-id",
  "action": "execute"
}

# Control execution
PUT /api/executions
Content-Type: application/json

{
  "executionId": "execution-id",
  "action": "cancel"
}
```

### Bot Integration API

```http
# Get bot data
GET /api/bot?endpoint=account

# Execute bot action
POST /api/bot
Content-Type: application/json

{
  "endpoint": "trade",
  "method": "POST",
  "data": {...}
}
```

## 🎨 Customization

### Theming

The application uses a cyberpunk theme that can be customized:

```css
/* In globals.css */
:root {
  --cyber-primary: #00ff88;
  --cyber-secondary: #ff0080;
  --cyber-accent: #00ffff;
  --cyber-dark: #0a0a0a;
  --cyber-gray: #1a1a1a;
}
```

### Adding New Node Types

1. **Define Node Type**
```typescript
// types/workflow.ts
export interface CustomNode {
  type: 'custom_type'
  config: {
    // your config
  }
}
```

2. **Add to Builder**
```typescript
// components/WorkflowBuilder.tsx
const NODE_TYPES = [
  // ... existing types
  { type: 'custom_type', label: 'Custom Node', description: '...' }
]
```

3. **Implement Handler**
```typescript
// Create execution logic for your custom node
```

## 📊 Monitoring & Analytics

- **Real-time Status**: Live workflow execution monitoring
- **Performance Metrics**: Success rates, execution times, error tracking
- **Execution History**: Detailed logs and results
- **Alert System**: Notifications for failures and important events

## 🔒 Security

- **Environment Variables**: Sensitive data stored securely
- **CORS Configuration**: Properly configured for API security
- **Input Validation**: All API inputs validated
- **Error Handling**: Secure error messages without data leakage

## 🐛 Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**API Connection Issues**
- Check `BOT_API_BASE` environment variable
- Verify bot deployment is accessible
- Test API endpoints manually

**Vercel Deployment Issues**
- Check `vercel.json` configuration
- Verify environment variables are set
- Review build logs for specific errors

### Debug Mode

Enable debug logging:
```bash
# In .env.local
DEBUG=workflow:*
```

## 🤝 Integration Examples

### Trading Bot Integration

```typescript
// Workflow for automated trading
const tradingWorkflow = {
  name: "Auto Trading",
  nodes: [
    {
      type: "api",
      config: {
        method: "GET",
        url: "/api/market-data"
      }
    },
    {
      type: "condition",
      config: {
        condition: "price_change > 0.05"
      }
    },
    {
      type: "action",
      config: {
        action: "execute_trade",
        parameters: {
          symbol: "BTCUSDT",
          side: "buy",
          quantity: 0.001
        }
      }
    }
  ]
}
```

### Notification System

```typescript
// Workflow for alerts
const alertWorkflow = {
  name: "Price Alert",
  nodes: [
    {
      type: "trigger",
      config: {
        trigger: "price_threshold",
        symbol: "BTCUSDT",
        threshold: 50000
      }
    },
    {
      type: "action",
      config: {
        action: "send_notification",
        parameters: {
          type: "telegram",
          message: "Bitcoin reached $50,000!"
        }
      }
    }
  ]
}
```

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review API documentation
3. Create an issue in the repository
4. Check Vercel deployment logs

---

**Built with ❤️ for AI automation and workflow management on Vercel**