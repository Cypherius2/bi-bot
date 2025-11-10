'use client'

import { useState } from 'react'

export default function Home() {
  const [workflows] = useState([
    {
      id: '1',
      name: 'Binance Trading Monitor',
      description: 'Monitors Binance futures and executes trading strategies',
      status: 'running',
      executionCount: 42,
      successRate: 0.95,
    }
  ])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000000', color: '#ffffff' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #22c55e', backgroundColor: '#1a1a1a' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>🚀</span>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e', fontFamily: 'monospace' }}>
                AI Workflow System
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button style={{ border: '2px solid #22c55e', color: '#22c55e', padding: '12px 24px', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>
                + New Workflow
              </button>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #22c55e', padding: '24px', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#ffffff' }}>
              Welcome to AI Workflow System
            </h2>
            <p style={{ color: '#d1d5db', marginBottom: '16px' }}>
              Your Next.js-based workflow management system is successfully deployed on Vercel!
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#374151', borderRadius: '8px', border: '1px solid #6b7280' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>{workflows.length}</div>
                <div style={{ fontSize: '14px', color: '#9ca3af' }}>Total Workflows</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#374151', borderRadius: '8px', border: '1px solid #6b7280' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#06b6d4' }}>1</div>
                <div style={{ fontSize: '14px', color: '#9ca3af' }}>Running</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#374151', borderRadius: '8px', border: '1px solid #6b7280' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>95%</div>
                <div style={{ fontSize: '14px', color: '#9ca3af' }}>Success Rate</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#374151', borderRadius: '8px', border: '1px solid #6b7280' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#06b6d4' }}>42</div>
                <div style={{ fontSize: '14px', color: '#9ca3af' }}>Total Executions</div>
              </div>
            </div>
          </div>
        </div>

        {/* Workflows Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#22c55e' }}>Workflows</h2>
        </div>

        {/* Workflow Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {workflows.map((workflow) => (
            <div key={workflow.id} style={{ backgroundColor: '#1a1a1a', border: '1px solid #22c55e', padding: '24px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                <span style={{ fontSize: '14px', color: '#d1d5db' }}>Running</span>
              </div>
              
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
                {workflow.name}
              </h3>
              <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>
                {workflow.description}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#22c55e' }}>{workflow.executionCount}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>Executions</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#06b6d4' }}>{Math.round(workflow.successRate * 100)}%</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>Success Rate</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ flex: 1, border: '1px solid #22c55e', color: '#22c55e', padding: '8px 16px', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '14px' }}>
                  View Details
                </button>
                <button style={{ flex: 1, border: '1px solid #06b6d4', color: '#06b6d4', padding: '8px 16px', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '14px' }}>
                  Execute
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Integration Status */}
        <div style={{ marginTop: '32px', padding: '24px', backgroundColor: '#1a1a1a', border: '1px solid #f59e0b', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f59e0b', marginBottom: '16px' }}>
            🔗 Bot Integration Status
          </h3>
          <p style={{ color: '#d1d5db', marginBottom: '8px' }}>
            Set the <code style={{ backgroundColor: '#374151', padding: '2px 6px', borderRadius: '4px', color: '#06b6d4' }}>BOT_API_BASE</code> environment variable to connect with your Binance bot.
          </p>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>
            Example: <code style={{ backgroundColor: '#374151', padding: '2px 6px', borderRadius: '4px', color: '#22c55e' }}>https://your-binance-bot.vercel.app/api</code>
          </p>
        </div>
      </main>
    </div>
  )
}
                  <div className="text-lg font-bold text-green-500">
                    {workflow.executionCount}
                  </div>
                  <div className="text-xs text-gray-500">Executions</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-cyan-400">
                    {Math.round(workflow.successRate * 100)}%
                  </div>
                  <div className="text-xs text-gray-500">Success Rate</div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center space-x-1">
                  <Pause className="h-3 w-3" />
                  <span>Pause</span>
                </button>
                <button className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center space-x-1">
                  <Square className="h-3 w-3" />
                  <span>Stop</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Integration Status */}
        <div className="mt-8">
          <div className="bg-gray-900 border border-cyan-500 rounded-lg p-6 backdrop-blur-sm" style={{boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)'}}>
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">Integration Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Next.js App</span>
                <span className="text-green-500 flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Running</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Vercel Deployment</span>
                <span className="text-green-500 flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Active</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">API Routes</span>
                <span className="text-green-500 flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Connected</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8">
          <div className="bg-gray-900 border border-purple-500 rounded-lg p-6 backdrop-blur-sm" style={{boxShadow: '0 0 20px rgba(147, 51, 234, 0.3)'}}>
            <h3 className="text-lg font-semibold text-purple-400 mb-4">Next Steps</h3>
            <div className="space-y-2 text-gray-300">
              <p>✅ Next.js application successfully deployed on Vercel</p>
              <p>✅ Custom cyberpunk theme applied</p>
              <p>✅ Basic workflow management interface created</p>
              <p>🔄 <strong>Next:</strong> Integrate with your Binance bot API</p>
              <p>🔄 <strong>Next:</strong> Add workflow builder functionality</p>
              <p>🔄 <strong>Next:</strong> Connect real execution engine</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}