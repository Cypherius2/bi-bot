'use client'

import { useState } from 'react'
import { 
  Play, 
  Pause, 
  Square, 
  Edit, 
  Trash2, 
  Clock, 
  TrendingUp, 
  Activity,
  MoreVertical
} from 'lucide-react'
import { Workflow } from '@/types/workflow'
import { format } from 'date-fns'

interface WorkflowCardProps {
  workflow: Workflow
  onAction: (id: string, action: 'start' | 'stop' | 'pause') => void
  onDelete: (id: string) => void
  onEdit: (id: string) => void
}

export default function WorkflowCard({ workflow, onAction, onDelete, onEdit }: WorkflowCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const getStatusColor = (status: Workflow['status']) => {
    switch (status) {
      case 'running':
        return 'status-running'
      case 'stopped':
        return 'status-stopped'
      case 'pending':
        return 'status-pending'
      case 'error':
        return 'bg-red-600'
      default:
        return 'status-stopped'
    }
  }

  const getStatusText = (status: Workflow['status']) => {
    switch (status) {
      case 'running':
        return 'Running'
      case 'stopped':
        return 'Stopped'
      case 'pending':
        return 'Paused'
      case 'error':
        return 'Error'
      default:
        return 'Unknown'
    }
  }

  const handleAction = (action: 'start' | 'stop' | 'pause') => {
    onAction(workflow.id, action)
    setShowMenu(false)
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      onDelete(workflow.id)
    }
    setShowMenu(false)
  }

  return (
    <div className="cyber-card relative group">
      {/* Status Indicator */}
      <div className="absolute top-4 right-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(workflow.status)}`} />
          <span className="text-sm text-gray-300">{getStatusText(workflow.status)}</span>
        </div>
      </div>

      {/* Menu Button */}
      <div className="absolute top-4 left-4">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 rounded hover:bg-gray-700 transition-colors"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        
        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute top-8 left-0 bg-gray-800 border border-gray-600 rounded shadow-lg z-10 min-w-32">
            <button
              onClick={() => onEdit(workflow.id)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center space-x-2"
            >
              <Edit className="h-3 w-3" />
              <span>Edit</span>
            </button>
            <button
              onClick={handleDelete}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 text-red-400 flex items-center space-x-2"
            >
              <Trash2 className="h-3 w-3" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Workflow Info */}
      <div className="pt-8">
        <h3 className="text-lg font-semibold text-white mb-2 pr-16">
          {workflow.name}
        </h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {workflow.description}
        </p>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-cyber-primary">
              {workflow.executionCount}
            </div>
            <div className="text-xs text-gray-500">Executions</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-cyber-accent">
              {Math.round(workflow.successRate * 100)}%
            </div>
            <div className="text-xs text-gray-500">Success Rate</div>
          </div>
        </div>

        {/* Last Execution */}
        {workflow.lastExecuted && (
          <div className="flex items-center text-xs text-gray-500 mb-4">
            <Clock className="h-3 w-3 mr-1" />
            <span>
              Last run: {format(workflow.lastExecuted, 'MMM dd, HH:mm')}
            </span>
          </div>
        )}

        {/* Node Count */}
        <div className="flex items-center text-xs text-gray-500 mb-4">
          <Activity className="h-3 w-3 mr-1" />
          <span>{workflow.nodes.length} nodes, {workflow.connections.length} connections</span>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {workflow.status === 'running' ? (
            <>
              <button
                onClick={() => handleAction('pause')}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center space-x-1"
              >
                <Pause className="h-3 w-3" />
                <span>Pause</span>
              </button>
              <button
                onClick={() => handleAction('stop')}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center space-x-1"
              >
                <Square className="h-3 w-3" />
                <span>Stop</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => handleAction('start')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center space-x-1"
            >
              <Play className="h-3 w-3" />
              <span>Start</span>
            </button>
          )}
        </div>
      </div>

      {/* Click overlay to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  )
}