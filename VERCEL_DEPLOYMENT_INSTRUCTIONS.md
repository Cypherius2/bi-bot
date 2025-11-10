# Vercel Deployment Instructions

## Quick Deployment Options

### Option 1: Direct GitHub Integration (Recommended)

1. **Upload to GitHub**:
   - Create a new repository on GitHub
   - Upload all files from the `nextjs-workflow` folder
   - Connect your GitHub repo to Vercel

2. **Deploy via Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect Next.js and deploy

### Option 2: Manual Upload

1. **Download the deployment file**:
   - Use the `nextjs-workflow-deployment.tar.gz` file
   - Extract it on your local machine

2. **Upload to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Choose "Import Project" and upload the folder

## Environment Variables Setup

After successful deployment, configure the following environment variable:

**BOT_API_BASE**: `https://your-binance-bot-url.vercel.app/api`

- Replace `your-binance-bot-url` with your actual Binance bot deployment URL
- This enables integration between the workflow system and your existing bot

## Verification Steps

After deployment, verify that:

1. ✅ **No Webpack Errors**: Dashboard loads without publicPath errors
2. ✅ **No 500 Server Errors**: Favicon and main page load successfully
3. ✅ **Dashboard Accessible**: Main workflow dashboard displays properly
4. ✅ **API Routes Working**: Workflow management endpoints function correctly
5. ✅ **Environment Variable Set**: BOT_API_BASE configured for bot integration

## Troubleshooting

### If Build Fails:
- Ensure all files are uploaded correctly
- Check that package.json is in the root directory
- Verify Next.js version compatibility

### If Runtime Errors:
- Check Vercel function logs
- Ensure environment variables are set
- Verify API routes are working

### If Integration Issues:
- Confirm BOT_API_BASE points to a valid Binance bot URL
- Test bot connection via Vercel deployment settings
- Check CORS configuration if needed

## Expected Result

Once deployed, you should have:
- A fully functional AI Workflow System
- Visual workflow builder with drag-and-drop
- Real-time execution monitoring
- Integration with your existing Binance trading bot
- Clean, cyberpunk-themed interface