import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getTokensFromRequest, setCookies, DJANGO_BASE } from '@/lib/server/cookies'

export async function POST(request: NextRequest) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    if (origin && host && !origin.endsWith(host)) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
    }

    const { refresh } = getTokensFromRequest(request)

    if (!refresh) {
        return NextResponse.json({ success: false, message: 'No refresh token' }, { status: 401 })
    }

    let djangoRes: Response
    try {
        djangoRes = await fetch(`${DJANGO_BASE}/auth/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh }),
            signal: AbortSignal.timeout(10_000),
        })
    } catch {
        return NextResponse.json(
            { success: false, message: 'Backend unavailable' },
            { status: 502 },
        )
    }

    const payload = await djangoRes.json()

    if (!djangoRes.ok) {
        return NextResponse.json(payload, { status: djangoRes.status })
    }

    const newAccess = payload.access_token ?? payload.access
    const newRefresh = payload.refresh_token ?? refresh

    const response = NextResponse.json({ success: true })

    setCookies(response, newAccess, newRefresh)

    return response
}
