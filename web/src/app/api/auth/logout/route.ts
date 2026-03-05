import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getTokensFromRequest, clearCookies, DJANGO_BASE } from '@/lib/server/cookies'

export async function POST(request: NextRequest) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    if (origin && host && !origin.endsWith(host)) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
    }

    const { refresh } = getTokensFromRequest(request)

    const response = NextResponse.json({ success: true })
    clearCookies(response)

    if (refresh) {
        try {
            await fetch(`${DJANGO_BASE}/auth/logout/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refresh }),
                signal: AbortSignal.timeout(10_000),
            })
        } catch {
        }
    }

    return response
}
