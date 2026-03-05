'use client'

import Link from 'next/link'
import { MoreHorizontal, Pencil, ListOrdered, Trash2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PRIORITY_LABELS, type ProcedurePriority, type IntervalUnit } from '@/lib/constants'
import type { Column } from '@/components/shared/data-table'
import type { ProcedureListItem } from '@/types'

const priorityColorMap: Record<ProcedurePriority, string> = {
    LOW: 'bg-gray-100 text-gray-700 border-gray-200',
    MEDIUM: 'bg-blue-100 text-blue-700 border-blue-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    CRITICAL: 'bg-red-100 text-red-700 border-red-200',
}

const intervalUnitLabels: Record<IntervalUnit, string> = {
    DAYS: 'gün',
    WEEKS: 'hafta',
    MONTHS: 'ay',
    YEARS: 'yıl',
}

interface ProcedureColumnsOptions {
    onEdit: (procedure: ProcedureListItem) => void
    onManageSteps: (procedure: ProcedureListItem) => void
    onDelete: (procedure: ProcedureListItem) => void
}

export function getProcedureColumns({ onEdit, onManageSteps, onDelete }: ProcedureColumnsOptions): Column<ProcedureListItem>[] {
    return [
        {
            key: 'title',
            label: 'Prosedür',
            sortable: true,
            render: (proc) => (
                <div>
                    <Link href={`/dashboard/procedures/${proc.id}`} className="font-medium hover:underline">
                        {proc.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{proc.entity_name ?? `Varlık #${proc.entity}`}</p>
                </div>
            ),
        },
        {
            key: 'priority',
            label: 'Öncelik',
            className: 'w-[110px]',
            render: (proc) => (
                <Badge variant="outline" className={priorityColorMap[proc.priority] ?? ''}>
                    {PRIORITY_LABELS[proc.priority] ?? proc.priority}
                </Badge>
            ),
        },
        {
            key: 'interval_value',
            label: 'Aralık',
            className: 'w-[110px]',
            render: (proc) => (
                <span className="text-sm">
                    {proc.interval_value} {intervalUnitLabels[proc.interval_unit] ?? proc.interval_unit}
                </span>
            ),
        },
        {
            key: 'total_steps',
            label: 'Adımlar',
            className: 'w-[80px]',
            render: (proc) => (
                <span className="text-sm text-muted-foreground">{proc.total_steps ?? 0}</span>
            ),
        },
        {
            key: 'is_active',
            label: 'Durum',
            className: 'w-[90px]',
            render: (proc) =>
                proc.is_active ? (
                    <span className="flex items-center gap-1 text-sm text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Aktif
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <XCircle className="h-3.5 w-3.5" />
                        Pasif
                    </span>
                ),
        },
        {
            key: 'created_at',
            label: 'Oluşturulma',
            sortable: true,
            className: 'w-[120px]',
            render: (proc) => (
                <span className="text-sm text-muted-foreground">
                    {new Date(proc.created_at).toLocaleDateString('tr-TR')}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[60px]',
            render: (proc) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(proc)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onManageSteps(proc)}>
                            <ListOrdered className="mr-2 h-4 w-4" />
                            Adımlar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(proc)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Sil
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ]
}
