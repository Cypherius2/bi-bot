export interface WorkflowNode {
  id: string
  type: 'api' | 'condition' | 'action' | 'trigger' | 'data' | 'loop' | 'delay'
  config: Record<string, any>
  position: { x: number; y: number }
  label?: string
}

export interface WorkflowConnection {
  from: string
  to: string
  label?: string
}

export type WorkflowStatus = 'running' | 'stopped' | 'pending' | 'error'

export interface Workflow {
  id: string
  name: string
  description: string
  status: WorkflowStatus
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  lastExecuted?: Date
  executionCount: number
  successRate: number
  createdAt: Date
  updatedAt: Date
  schedule?: {
    enabled: boolean
    interval: string
    timezone: string
  }
  triggers?: {
    type: 'manual' | 'schedule' | 'webhook' | 'event'
    config: Record<string, any>
  }[]
}

export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'cancelled'

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: ExecutionStatus
  startTime: Date
  endTime?: Date
  duration?: number
  currentNode?: string
  results?: {
    success: boolean
    data?: any
    error?: string
  }
  logs?: ExecutionLog[]
}

export interface ExecutionLog {
  timestamp: Date
  level: 'info' | 'warn' | 'error'
  message: string
  nodeId?: string
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  nodes: Omit<WorkflowNode, 'id'>[]
  connections: WorkflowConnection[]
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  headers?: Record<string, string>
  body?: any
  timeout?: number
  retry?: {
    attempts: number
    delay: number
  }
}

export interface WebhookConfig {
  url: string
  secret: string
  events: string[]
  method: 'POST' | 'GET'
  headers?: Record<string, string>
}

export interface NotificationConfig {
  type: 'email' | 'webhook' | 'slack' | 'discord'
  config: Record<string, any>
  triggers: ('success' | 'failure' | 'start' | 'end')[]
}

export interface WorkflowMetrics {
  totalExecutions: number
  successRate: number
  averageDuration: number
  lastExecution: Date | null
  uptime: number
  errorRate: number
}