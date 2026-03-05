import 'server-only'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const DJANGO_BASE = process.env.DJANGO_API_URL ?? 'http://localhost:8000/api/v1'

const COOKIE_ACCESS = 'kk_access'
const COOKIE_REFRESH = 'kk_refresh'

export function setCookies(
    response: NextResponse,
    access: string,
    refresh: string
) {
    const isProd = process.env.NODE_ENV === 'production'

    response.cookies.set(COOKIE_ACCESS, access, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'strict' : 'lax',
        path: '/',
        maxAge: 30 * 60,
    })

    response.cookies.set(COOKIE_REFRESH, refresh, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'strict' : 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
    })
}

export function clearCookies(response: NextResponse) {
    response.cookies.delete(COOKIE_ACCESS)
    response.cookies.delete(COOKIE_REFRESH)
}

export function getTokensFromRequest(request: NextRequest) {
    return {
        access: request.cookies.get(COOKIE_ACCESS)?.value ?? null,
        refresh: request.cookies.get(COOKIE_REFRESH)?.value ?? null,
    }
}

export { DJANGO_BASE, COOKIE_ACCESS, COOKIE_REFRESH }
