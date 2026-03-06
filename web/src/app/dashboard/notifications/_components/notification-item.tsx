'use client'

import { useRouter } from 'next/navigation'
import { Bell, AlertTriangle, Clock, CheckCircle2, Share2, Users, MessageSquare, Info } from 'lucide-react'
import { useMarkNotificationRead } from '@/hooks/queries/use-notifications'
import type { Notification } from '@/types'
import type { NotificationType } from '@/lib/constants'

const typeIconMap: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
    PROCEDURE_DUE: Clock,
    PROCEDURE_OVERDUE: AlertTriangle,
    STEP_OVERDUE: AlertTriangle,
    NON_COMPLIANCE_REPORTED: AlertTriangle,
    NON_COMPLIANCE_ASSIGNED: AlertTriangle,
    NON_COMPLIANCE_RESOLVED: CheckCircle2,
    NON_COMPLIANCE_OVERDUE: AlertTriangle,
    NON_COMPLIANCE_COMMENT: MessageSquare,
    NON_COMPLIANCE_STATUS_CHANGED: Info,
    HELP_REQUEST_RECEIVED: MessageSquare,
    HELP_REQUEST_RESPONDED: MessageSquare,
    ENTITY_SHARED: Share2,
    PROCEDURE_SHARED: Share2,
    ASSIGNMENT_NEW: Users,
    ASSIGNMENT_UPDATED: Users,
    SYSTEM: Info,
}

const priorityColors: Record<string, string> = {
    low: 'text-muted-foreground',
    normal: 'text-blue-600',
    high: 'text-orange-600',
    urgent: 'text-red-600',
}

interface NotificationItemProps {
    notification: Notification
}

function getWebUrl(actionUrl: string | null): string | null {
    if (!actionUrl) return null
    return actionUrl
        .replace(/^\/procedures\/(\d+)/, '/dashboard/execution/$1')
        .replace(/^\/issues\/(\d+)/, '/dashboard/compliance')
        .replace(/^\/reports\/(\d+)/, '/dashboard/reports/$1')
        .replace(/^\/entities\/(\d+)/, '/dashboard/entities/$1')
}

export function NotificationItem({ notification }: NotificationItemProps) {
    const router = useRouter()
    const markReadMutation = useMarkNotificationRead()

    const Icon = typeIconMap[notification.type] ?? Bell
    const isUnread = !notification.is_read

    function handleClick() {
        if (isUnread) {
            markReadMutation.mutate(notification.id)
        }

        const webUrl = getWebUrl(notification.action_url)
        if (webUrl) {
            router.push(webUrl)
        }
    }

    return (
        <div
            className={`relative flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                isUnread ? 'bg-blue-50/40' : ''
            }`}
            onClick={handleClick}
        >
            {isUnread && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 rounded-r" />
            )}
            <div className={`mt-0.5 shrink-0 ${priorityColors[notification.priority] ?? 'text-muted-foreground'}`}>
                <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
                <p className={`text-sm ${isUnread ? 'font-semibold' : 'font-medium'}`}>{notification.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                <p className="text-xs text-muted-foreground">
                    {new Date(notification.created_at).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </p>
            </div>
        </div>
    )
}
