import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory storage
let workflows: any[] = []

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const id = searchParams.get('id')

    if (id) {
      const workflow = workflows.find(w => w.id === id)
      if (!workflow) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
      }
      return NextResponse.json(workflow)
    }

    let filteredWorkflows = workflows
    if (status) {
      filteredWorkflows = workflows.filter(w => w.status === status)
    }

    return NextResponse.json(filteredWorkflows, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (error) {
    console.error('GET workflows error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to fetch workflows' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const workflow = {
      ...body,
      id: `wf-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionCount: 0,
      successRate: 0,
    }

    workflows.push(workflow)
    return NextResponse.json(workflow, { 
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (error) {
    console.error('POST workflows error:', error)
    return NextResponse.json(
      { error: 'Failed to create workflow', message: 'Invalid request data' },
      { status: 400 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Workflow ID required' }, { status: 400 })
    }

    const body = await request.json()
    const index = workflows.findIndex(w => w.id === id)
    
    if (index === -1) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    workflows[index] = {
      ...workflows[index],
      ...body,
      updatedAt: new Date(),
    }

    return NextResponse.json(workflows[index])
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 400 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Workflow ID required' }, { status: 400 })
  }

  const index = workflows.findIndex(w => w.id === id)
  
  if (index === -1) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
  }

  workflows.splice(index, 1)
  return NextResponse.json({ message: 'Workflow deleted successfully' })
}