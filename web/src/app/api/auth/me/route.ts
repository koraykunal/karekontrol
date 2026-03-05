import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getTokensFromRequest, DJANGO_BASE } from '@/lib/server/cookies'

export async function GET(request: NextRequest) {
    const { access } = getTokensFromRequest(request)

    if (!access) {
        return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 })
    }

    let djangoRes: Response
    try {
        djangoRes = await fetch(`${DJANGO_BASE}/auth/me/`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${access}`,
            },
            signal: AbortSignal.timeout(10_000),
        })
    } catch {
        return NextResponse.json({ success: false, message: 'Backend unavailable' }, { status: 502 })
    }

    const payload = await djangoRes.json()

    if (!djangoRes.ok) {
        return NextResponse.json(payload, { status: djangoRes.status })
    }

    return NextResponse.json(payload)
}
