'use client'

import { MoreHorizontal, Eye, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ISSUE_STATUS_LABELS, type IssueSeverity, type IssueStatus } from '@/lib/constants'
import type { Column } from '@/components/shared/data-table'
import type { IssueListItem } from '@/types'

const severityMap: Record<IssueSeverity, { label: string; className: string }> = {
    LOW: { label: 'Düşük', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    MEDIUM: { label: 'Orta', className: 'bg-orange-100 text-orange-800 border-orange-200' },
    HIGH: { label: 'Yüksek', className: 'bg-red-100 text-red-800 border-red-200' },
    CRITICAL: { label: 'Kritik', className: 'bg-red-200 text-red-900 border-red-300' },
}

const statusColorMap: Record<IssueStatus, string> = {
    OPEN: 'bg-blue-100 text-blue-800 border-blue-200',
    IN_PROGRESS: 'bg-amber-100 text-amber-800 border-amber-200',
    RESOLVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    VERIFIED: 'bg-green-100 text-green-800 border-green-200',
    ESCALATED: 'bg-red-100 text-red-800 border-red-200',
    CLOSED: 'bg-gray-100 text-gray-600 border-gray-200',
}

interface IssueColumnsOptions {
    onView: (issue: IssueListItem) => void
    onResolve: (issue: IssueListItem) => void
}

export function getIssueColumns({ onView, onResolve }: IssueColumnsOptions): Column<IssueListItem>[] {
    return [
        {
            key: 'title',
            label: 'Başlık',
            sortable: true,
            render: (issue) => (
                <div>
                    <button
                        className="font-medium text-left hover:underline"
                        onClick={() => onView(issue)}
                    >
                        {issue.title}
                    </button>
                    <p className="text-xs text-muted-foreground">{issue.entity_name ?? `Varlık #${issue.entity}`}</p>
                </div>
            ),
        },
        {
            key: 'severity',
            label: 'Şiddet',
            className: 'w-[110px]',
            render: (issue) => {
                const s = severityMap[issue.severity]
                return (
                    <Badge variant="outline" className={s?.className ?? ''}>
                        {s?.label ?? issue.severity}
                    </Badge>
                )
            },
        },
        {
            key: 'status',
            label: 'Durum',
            className: 'w-[130px]',
            render: (issue) => (
                <Badge variant="outline" className={statusColorMap[issue.status] ?? ''}>
                    {ISSUE_STATUS_LABELS[issue.status] ?? issue.status}
                </Badge>
            ),
        },
        {
            key: 'assigned_to_user',
            label: 'Atanan',
            className: 'w-[140px]',
            render: (issue) => (
                <span className="text-sm text-muted-foreground">
                    {(issue as IssueListItem & { assigned_to_user_name?: string }).assigned_to_user_name ?? '—'}
                </span>
            ),
        },
        {
            key: 'due_date',
            label: 'Bitiş',
            className: 'w-[110px]',
            render: (issue) =>
                issue.due_date ? (
                    <span className="text-sm">{new Date(issue.due_date).toLocaleDateString('tr-TR')}</span>
                ) : (
                    <span className="text-muted-foreground">—</span>
                ),
        },
        {
            key: 'created_at',
            label: 'Oluşturulma',
            sortable: true,
            className: 'w-[120px]',
            render: (issue) => (
                <span className="text-sm text-muted-foreground">
                    {new Date(issue.created_at).toLocaleDateString('tr-TR')}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[60px]',
            render: (issue) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(issue)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Görüntüle
                        </DropdownMenuItem>
                        {issue.status === 'OPEN' || issue.status === 'IN_PROGRESS' ? (
                            <DropdownMenuItem onClick={() => onResolve(issue)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Çözümle
                            </DropdownMenuItem>
                        ) : null}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ]
}
