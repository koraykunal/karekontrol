'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { ErrorBoundary } from '@/components/error-boundary'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, hydrated, isAuthenticated, logout } = useAuth()
    const setUser = useAuthStore((s) => s.setUser)
    const router = useRouter()
    const [userLoaded, setUserLoaded] = useState(false)
    const logoutRef = useRef(logout)
    logoutRef.current = logout

    useEffect(() => {
        if (hydrated && !isAuthenticated) {
            router.push('/login')
        }
    }, [hydrated, isAuthenticated, router])

    useEffect(() => {
        if (!hydrated || !isAuthenticated || user || userLoaded) return

        let cancelled = false
        fetch('/api/auth/me')
            .then((res) => {
                if (!res.ok) throw new Error('Unauthorized')
                return res.json()
            })
            .then((payload) => {
                if (cancelled) return
                const me = payload.data ?? payload
                setUser(me)
            })
            .catch(() => {
                if (!cancelled) {
                    toast.error('Oturum doğrulanamadı, tekrar giriş yapınız')
                    logoutRef.current()
                }
            })
            .finally(() => {
                if (!cancelled) setUserLoaded(true)
            })

        return () => { cancelled = true }
    }, [hydrated, isAuthenticated, user, userLoaded, setUser])

    if (!hydrated || (isAuthenticated && !user && !userLoaded)) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="flex flex-1 items-center justify-between">
                        <div />
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {user?.full_name}
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-6">
                    <ErrorBoundary>
                        {children}
                    </ErrorBoundary>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
