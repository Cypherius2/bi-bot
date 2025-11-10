'use client'

import { TrendingUp, Activity, Clock, Zap } from 'lucide-react'
import { Workflow, WorkflowExecution } from '@/types/workflow'

interface WorkflowStatsProps {
  workflows: Workflow[]
  executions: WorkflowExecution[]
}

export default function WorkflowStats({ workflows, executions }: WorkflowStatsProps) {
  const totalWorkflows = workflows.length
  const runningWorkflows = workflows.filter(w => w.status === 'running').length
  const totalExecutions = workflows.reduce((sum, w) => sum + w.executionCount, 0)
  const avgSuccessRate = workflows.length > 0 
    ? workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length 
    : 0
  const recentExecutions = executions.filter(e => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return e.startTime > oneDayAgo
  }).length

  const stats = [
    {
      label: 'Total Workflows',
      value: totalWorkflows,
      subtext: `${runningWorkflows} running`,
      icon: Activity,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      label: 'Total Executions',
      value: totalExecutions,
      subtext: `${recentExecutions} today`,
      icon: Zap,
      color: 'text-cyber-primary',
      bgColor: 'bg-cyber-primary/10',
    },
    {
      label: 'Success Rate',
      value: `${Math.round(avgSuccessRate * 100)}%`,
      subtext: 'Last 30 days',
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    {
      label: 'Uptime',
      value: '99.8%',
      subtext: 'Last 24 hours',
      icon: Clock,
      color: 'text-cyber-accent',
      bgColor: 'bg-cyber-accent/10',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon
        return (
          <div key={index} className="cyber-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.subtext}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <IconComponent className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}