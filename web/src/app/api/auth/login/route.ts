import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { setCookies, DJANGO_BASE } from '@/lib/server/cookies'

export async function POST(request: NextRequest) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    if (origin && host && !origin.endsWith(host)) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
    }

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 })
    }

    const { email, password } = body as Record<string, unknown>
    if (typeof email !== 'string' || typeof password !== 'string') {
        return NextResponse.json({ success: false, message: 'email and password are required' }, { status: 400 })
    }

    let djangoRes: Response
    try {
        djangoRes = await fetch(`${DJANGO_BASE}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            signal: AbortSignal.timeout(10_000),
        })
    } catch {
        return NextResponse.json({ success: false, message: 'Backend unavailable' }, { status: 502 })
    }

    const payload = await djangoRes.json()

    if (!djangoRes.ok || !payload.success) {
        return NextResponse.json(payload, { status: djangoRes.status })
    }

    const accessToken = payload.data.access_token ?? payload.data.access
    const refreshToken = payload.data.refresh_token ?? payload.data.refresh

    const response = NextResponse.json({
        success: true,
        data: { user: payload.data.user ?? null },
    })

    setCookies(response, accessToken, refreshToken)

    return response
}
