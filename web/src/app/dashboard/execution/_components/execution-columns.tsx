'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PROCEDURE_LOG_STATUS_LABELS, type ProcedureLogStatus } from '@/lib/constants'
import type { Column } from '@/components/shared/data-table'
import type { ProcedureLogListItem } from '@/types'

const statusVariants: Record<ProcedureLogStatus, string> = {
    IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
    COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
}

export function getExecutionColumns(): Column<ProcedureLogListItem>[] {
    return [
        {
            key: 'procedure_title',
            label: 'Prosedür',
            render: (log) => (
                <div>
                    <span className="font-medium">{log.procedure_title ?? `Prosedür #${log.procedure_id}`}</span>
                    <p className="text-xs text-muted-foreground">{log.entity_name ?? '—'}</p>
                </div>
            ),
        },
        {
            key: 'user_name',
            label: 'Başlatan',
            className: 'w-[140px]',
            render: (log) => (
                <span className="text-sm text-muted-foreground">{log.user_name ?? 'Bilinmiyor'}</span>
            ),
        },
        {
            key: 'started_at',
            label: 'Başlangıç',
            className: 'w-[110px]',
            sortable: true,
            render: (log) => (
                <span className="text-sm text-muted-foreground">
                    {new Date(log.started_at).toLocaleDateString('tr-TR')}
                </span>
            ),
        },
        {
            key: 'completed_at',
            label: 'Tamamlanma',
            className: 'w-[110px]',
            render: (log) => (
                <span className="text-sm text-muted-foreground">
                    {log.completed_at ? new Date(log.completed_at).toLocaleDateString('tr-TR') : '—'}
                </span>
            ),
        },
        {
            key: 'completion_percentage',
            label: 'İlerleme',
            className: 'w-[80px]',
            render: (log) => (
                <span className="text-sm text-muted-foreground">{log.completion_percentage}%</span>
            ),
        },
        {
            key: 'status',
            label: 'Durum',
            className: 'w-[120px]',
            render: (log) => (
                <Badge variant="outline" className={statusVariants[log.status] ?? ''}>
                    {PROCEDURE_LOG_STATUS_LABELS[log.status] ?? log.status}
                </Badge>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[50px]',
            render: (log) => (
                <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                    <Link href={`/dashboard/execution/${log.id}`}>
                        <ExternalLink className="h-4 w-4" />
                    </Link>
                </Button>
            ),
        },
    ]
}
