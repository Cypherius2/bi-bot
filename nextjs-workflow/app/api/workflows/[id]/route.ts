import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const { searchParams } = new URL(request.url)
  const includeExecutions = searchParams.get('includeExecutions') === 'true'

  try {
    // Get workflow details
    const workflowResponse = await fetch(`${request.nextUrl.origin}/api/workflows?id=${id}`)
    if (!workflowResponse.ok) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }
    const workflow = await workflowResponse.json()

    let result: any = workflow

    // Include executions if requested
    if (includeExecutions) {
      const executionsResponse = await fetch(
        `${request.nextUrl.origin}/api/executions?workflowId=${id}`
      )
      if (executionsResponse.ok) {
        const executions = await executionsResponse.json()
        result = { ...workflow, executions }
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch workflow details' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  
  try {
    const body = await request.json()
    
    // Update workflow
    const response = await fetch(`${request.nextUrl.origin}/api/workflows?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to update workflow' },
        { status: response.status }
      )
    }

    const updatedWorkflow = await response.json()
    return NextResponse.json(updatedWorkflow)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  try {
    const response = await fetch(`${request.nextUrl.origin}/api/workflows?id=${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to delete workflow' },
        { status: response.status }
      )
    }

    return NextResponse.json({ message: 'Workflow deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    )
  }
}

// Execute workflow
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  try {
    const body = await request.json()
    const { action = 'execute' } = body

    // Create execution record
    const executionResponse = await fetch(`${request.nextUrl.origin}/api/executions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflowId: id,
        action,
      }),
    })

    if (!executionResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to create execution' },
        { status: 500 }
      )
    }

    const execution = await executionResponse.json()
    return NextResponse.json(execution, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to execute workflow' },
      { status: 500 }
    )
  }
}