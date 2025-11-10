'use client'

import { useState } from 'react'
import { X, Plus, Save } from 'lucide-react'
import { Workflow, WorkflowNode, WorkflowConnection } from '@/types/workflow'

interface WorkflowBuilderProps {
  onClose: () => void
  onSave: (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>) => void
}

const NODE_TYPES = [
  { type: 'api', label: 'API Call', description: 'Make HTTP requests to external APIs' },
  { type: 'condition', label: 'Condition', description: 'Check if conditions are met' },
  { type: 'action', label: 'Action', description: 'Perform an action' },
  { type: 'trigger', label: 'Trigger', description: 'Start workflow based on events' },
  { type: 'data', label: 'Data Source', description: 'Fetch data from sources' },
  { type: 'loop', label: 'Loop', description: 'Iterate over data' },
  { type: 'delay', label: 'Delay', description: 'Wait for specified time' },
]

export default function WorkflowBuilder({ onClose, onSave }: WorkflowBuilderProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [nodes, setNodes] = useState<Omit<WorkflowNode, 'id'>[]>([])
  const [connections, setConnections] = useState<WorkflowConnection[]>([])
  const [selectedNodeType, setSelectedNodeType] = useState<string>('')

  const handleAddNode = () => {
    if (!selectedNodeType) return

    const newNode: Omit<WorkflowNode, 'id'> = {
      type: selectedNodeType as any,
      config: getDefaultConfig(selectedNodeType as any),
      position: { x: 100 + nodes.length * 150, y: 100 },
      label: NODE_TYPES.find(nt => nt.type === selectedNodeType)?.label || selectedNodeType,
    }

    setNodes(prev => [...prev, newNode])
    setSelectedNodeType('')
  }

  const getDefaultConfig = (type: string) => {
    switch (type) {
      case 'api':
        return {
          method: 'GET',
          url: '',
          headers: {},
          timeout: 10000,
        }
      case 'condition':
        return {
          condition: '',
          operator: 'equals',
          value: '',
        }
      case 'action':
        return {
          action: '',
          parameters: {},
        }
      case 'trigger':
        return {
          trigger: '',
          config: {},
        }
      case 'data':
        return {
          source: '',
          query: '',
          format: 'json',
        }
      case 'loop':
        return {
          items: '',
          variable: 'item',
        }
      case 'delay':
        return {
          duration: 1000,
          unit: 'ms',
        }
      default:
        return {}
    }
  }

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a workflow name')
      return
    }

    const workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name.trim(),
      description: description.trim(),
      status: 'stopped',
      nodes: nodes.map((node, index) => ({
        ...node,
        id: `node-${index}`,
      })),
      connections,
      executionCount: 0,
      successRate: 0,
    }

    onSave(workflow)
  }

  const handleConnectNodes = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    
    const fromNodeId = `node-${fromIndex}`
    const toNodeId = `node-${toIndex}`
    
    // Check if connection already exists
    const exists = connections.some(c => c.from === fromNodeId && c.to === toNodeId)
    if (exists) return

    setConnections(prev => [...prev, { from: fromNodeId, to: toNodeId }])
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-cyber-primary rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Create New Workflow</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Basic Info */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Workflow Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="cyber-input w-full"
                  placeholder="Enter workflow name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="cyber-input w-full"
                  placeholder="Brief description..."
                />
              </div>
            </div>
          </div>

          {/* Add Nodes */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-4">Add Workflow Steps</h3>
            
            {/* Node Type Selector */}
            <div className="flex space-x-2 mb-4">
              <select
                value={selectedNodeType}
                onChange={(e) => setSelectedNodeType(e.target.value)}
                className="cyber-input flex-1"
              >
                <option value="">Select node type...</option>
                {NODE_TYPES.map(nodeType => (
                  <option key={nodeType.type} value={nodeType.type}>
                    {nodeType.label} - {nodeType.description}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddNode}
                disabled={!selectedNodeType}
                className="cyber-button flex items-center space-x-1 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span>Add Node</span>
              </button>
            </div>

            {/* Node List */}
            {nodes.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">Workflow Steps:</h4>
                {nodes.map((node, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded border border-gray-600"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-cyber-primary/20 rounded flex items-center justify-center text-cyber-primary text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-white font-medium">{node.label || node.type}</div>
                        <div className="text-gray-400 text-sm">{node.type}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {index < nodes.length - 1 && (
                        <button
                          onClick={() => handleConnectNodes(index, index + 1)}
                          className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                        >
                          Connect →
                        </button>
                      )}
                      <button
                        onClick={() => setNodes(prev => prev.filter((_, i) => i !== index))}
                        className="p-1 text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Connections */}
          {connections.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-4">Connections</h3>
              <div className="space-y-2">
                {connections.map((conn, index) => {
                  const fromNode = nodes[parseInt(conn.from.replace('node-', ''))]
                  const toNode = nodes[parseInt(conn.to.replace('node-', ''))]
                  return (
                    <div key={index} className="text-sm text-gray-300">
                      <span className="text-cyber-primary">{fromNode?.label || fromNode?.type}</span>
                      {' → '}
                      <span className="text-cyber-accent">{toNode?.label || toNode?.type}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Preview */}
          {nodes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-4">Preview</h3>
              <div className="cyber-card">
                <h4 className="text-white font-medium mb-2">{name || 'Untitled Workflow'}</h4>
                <p className="text-gray-400 text-sm mb-3">{description || 'No description'}</p>
                <div className="text-sm text-gray-300">
                  <div>{nodes.length} steps, {connections.length} connections</div>
                  <div className="mt-2 text-xs text-gray-500">
                    Workflow flow: {nodes.map((node, index) => (
                      <span key={index}>
                        {node.label || node.type}
                        {index < nodes.length - 1 && (
                          <span className="text-cyber-primary mx-1">→</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            {nodes.length > 0 ? `${nodes.length} steps ready` : 'Add steps to build your workflow'}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-600 text-gray-300 rounded hover:border-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="cyber-button flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Create Workflow</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}