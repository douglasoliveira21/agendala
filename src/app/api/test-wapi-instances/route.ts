import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.WAPI_BASE_URL
    const token = process.env.WAPI_TOKEN

    if (!baseUrl || !token) {
      return NextResponse.json({ 
        error: 'Configuração da W-API não encontrada' 
      }, { status: 500 })
    }

    console.log('[W-API Test] Testando listagem de instâncias...')
    console.log('[W-API Test] Base URL:', baseUrl)
    console.log('[W-API Test] Token:', token.substring(0, 10) + '...')

    const url = `${baseUrl}/instances`
    
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }

    console.log('[W-API Test] Fazendo requisição para:', url)
    
    const response = await fetch(url, options)
    const result = await response.json()
    
    console.log('[W-API Test] Status da resposta:', response.status)
    console.log('[W-API Test] Resposta:', result)

    if (!response.ok) {
      return NextResponse.json({ 
        error: `W-API Error: ${result.message || response.statusText}`,
        status: response.status,
        details: result
      }, { status: response.status })
    }

    return NextResponse.json({ 
      success: true,
      instances: result.instances || result,
      total: result.instances?.length || 0
    })

  } catch (error) {
    console.error('[W-API Test] Erro:', error)
    return NextResponse.json({ 
      error: error.message,
      type: 'fetch_error'
    }, { status: 500 })
  }
}