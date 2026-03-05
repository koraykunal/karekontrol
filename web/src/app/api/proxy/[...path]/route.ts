import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getTokensFromRequest, DJANGO_BASE } from '@/lib/server/cookies'

const ALLOWED_PREFIXES = [
    'users', 'organizations', 'departments', 'entities', 'procedures',
    'procedure-steps', 'procedure-templates', 'procedure-logs', 'step-logs',
    'reminders', 'step-reminders', 'issues', 'help-requests', 'permissions',
    'reports', 'schedules', 'notifications', 'dashboard', 'upload',
    'bulk-import', 'entity-images', 'entity-documents', 'entity-shares',
]

async function proxyRequest(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params
    const targetPath = path.join('/')

    if (targetPath.includes('..') || targetPath.includes('%2e') || targetPath.includes('%2E')) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
    }

    const firstSegment = decodeURIComponent(targetPath.split('/')[0])
    if (!ALLOWED_PREFIXES.includes(firstSegment)) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(request.url)
    const queryString = url.search

    const { access } = getTokensFromRequest(request)

    const headers: Record<string, string> = {}

    if (access) {
        headers['Authorization'] = `Bearer ${access}`
    }

    const contentType = request.headers.get('content-type')
    if (contentType) {
        headers['Content-Type'] = contentType
    }

    const fetchOptions: RequestInit = {
        method: request.method,
        headers,
        signal: AbortSignal.timeout(30_000),
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        if (contentType?.includes('multipart/form-data')) {
            fetchOptions.body = await request.arrayBuffer()
        } else {
            try {
                const body = await request.json()
                fetchOptions.body = JSON.stringify(body)
            } catch {
                fetchOptions.body = null
            }
        }
    }

    const finalPath = targetPath.endsWith('/') ? targetPath : `${targetPath}/`

    let djangoRes: Response
    try {
        djangoRes = await fetch(`${DJANGO_BASE}/${finalPath}${queryString}`, fetchOptions)
    } catch {
        return NextResponse.json(
            { success: false, message: 'Backend unavailable' },
            { status: 502 },
        )
    }

    if (djangoRes.status >= 500) {
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: djangoRes.status },
        )
    }

    const responseContentType = djangoRes.headers.get('content-type') ?? ''

    if (responseContentType.includes('application/json')) {
        const data = await djangoRes.json()
        return NextResponse.json(data, { status: djangoRes.status })
    }

    const blob = await djangoRes.blob()
    const responseHeaders: Record<string, string> = {
        'Content-Type': responseContentType,
    }
    const contentDisposition = djangoRes.headers.get('content-disposition')
    if (contentDisposition) {
        responseHeaders['Content-Disposition'] = contentDisposition
    }
    return new NextResponse(blob, {
        status: djangoRes.status,
        headers: responseHeaders,
    })
}

export const GET = proxyRequest
export const POST = proxyRequest
export const PUT = proxyRequest
export const PATCH = proxyRequest
export const DELETE = proxyRequest
