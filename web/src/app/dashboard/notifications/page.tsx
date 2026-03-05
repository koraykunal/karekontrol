'use client'

import { useState } from 'react'
import { Bell, CheckCheck, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { useNotifications, useMarkAllNotificationsRead } from '@/hooks/queries/use-notifications'
import { useAuthStore } from '@/store/auth'
import { NotificationItem } from './_components/notification-item'
import { SendNotificationDialog } from './_components/send-notification-dialog'

const FILTER_OPTIONS = [
    { value: 'all', label: 'Tümü' },
    { value: 'unread', label: 'Okunmamış' },
    { value: 'read', label: 'Okunmuş' },
]

export default function NotificationsPage() {
    const [filter, setFilter] = useState('all')
    const [page, setPage] = useState(1)
    const [sendDialogOpen, setSendDialogOpen] = useState(false)
    const user = useAuthStore((s) => s.user)
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

    const params: Record<string, unknown> = { page, page_size: 20 }
    if (filter === 'unread') params.is_read = false
    if (filter === 'read') params.is_read = true

    const { data, isLoading } = useNotifications(params)
    const markAllMutation = useMarkAllNotificationsRead()

    const notifications = data?.data ?? []
    const totalPages = data?.total_pages ?? 0

    return (
        <div className="space-y-6">
            <PageHeader
                title="Bildirimler"
                description="Sistem bildirimleri ve uyarılar"
                action={
                    <div className="flex gap-2">
                        {isAdmin && (
                            <Button size="sm" onClick={() => setSendDialogOpen(true)}>
                                <Send className="mr-2 h-4 w-4" />
                                Bildirim Gönder
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAllMutation.mutate()}
                            disabled={markAllMutation.isPending}
                        >
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Tümünü Okundu İşaretle
                        </Button>
                    </div>
                }
            />

            <div className="flex items-center gap-3">
                <Select value={filter} onValueChange={(val) => { setFilter(val); setPage(1) }}>
                    <SelectTrigger className="w-[160px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {FILTER_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <div className="space-y-1 rounded-lg border divide-y">
                    {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 rounded-none" />)}
                </div>
            ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                    <Bell className="h-10 w-10 opacity-30" />
                    <p className="text-sm">Bildirim bulunamadı</p>
                </div>
            ) : (
                <div className="rounded-lg border divide-y overflow-hidden">
                    {notifications.map((n) => (
                        <NotificationItem key={n.id} notification={n} />
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Önceki
                    </Button>
                    <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Sonraki
                    </Button>
                </div>
            )}
            {isAdmin && (
                <SendNotificationDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen} />
            )}
        </div>
    )
}
