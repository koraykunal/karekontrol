'use client'

import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { useTenantStore } from '@/store/tenant'

export function useAuth() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const { user, isAuthenticated, hydrated, setUser, logout: storeLogout } = useAuthStore()
    const { setPlatformOwner, setOrganization, reset: resetTenant } = useTenantStore()

    const login = async (email: string, password: string) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        })

        const payload = await res.json()

        if (!res.ok || !payload.success) {
            throw new Error(payload.error?.message ?? payload.message ?? 'Giriş başarısız')
        }

        const meRes = await fetch('/api/auth/me')
        if (!meRes.ok) {
            throw new Error('Kullanıcı bilgileri alınamadı')
        }

        const mePayload = await meRes.json()
        const me = mePayload.data ?? mePayload

        setUser(me)
        useAuthStore.getState().setAuthenticated()

        const isSuperAdmin = me.role === 'SUPER_ADMIN'
        setPlatformOwner(isSuperAdmin)

        if (!isSuperAdmin && me.organization) {
            setOrganization(me.organization)
        }

        router.push('/dashboard')
    }

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
        } catch {
        } finally {
            storeLogout()
            resetTenant()
            queryClient.clear()
            router.push('/login')
        }
    }

    return { user, isAuthenticated, hydrated, login, logout }
}
