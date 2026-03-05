'use client'

import Link from 'next/link'
import { MoreHorizontal, Eye, Pencil, Trash2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/shared/status-badge'
import type { Column } from '@/components/shared/data-table'
import type { EntityListItem } from '@/types'

const statusVariantMap: Record<string, 'active' | 'warning' | 'danger' | 'info'> = {
    ACTIVE: 'active',
    INACTIVE: 'info',
    MAINTENANCE: 'warning',
    DECOMMISSIONED: 'danger',
}

interface EntityColumnsOptions {
    onEdit: (entity: EntityListItem) => void
    onDelete: (entity: EntityListItem) => void
}

export function getEntityColumns({ onEdit, onDelete }: EntityColumnsOptions): Column<EntityListItem>[] {
    return [
        {
            key: 'name',
            label: 'Varlık',
            sortable: true,
            render: (entity) => (
                <Link href={`/dashboard/entities/${entity.id}`} className="flex flex-col">
                    <span className="font-medium hover:underline">{entity.name}</span>
                    <span className="text-xs text-muted-foreground">{entity.code}</span>
                </Link>
            ),
        },
        {
            key: 'entity_type',
            label: 'Tip',
            className: 'w-[120px]',
            render: (entity) => (
                <Badge variant="outline">{entity.entity_type}</Badge>
            ),
        },
        {
            key: 'organization_name',
            label: 'Organizasyon',
            className: 'w-[160px]',
            render: (entity) => (
                <span className="text-muted-foreground">{entity.organization_name}</span>
            ),
        },
        {
            key: 'department_name',
            label: 'Departman',
            className: 'w-[140px]',
            render: (entity) => (
                <span className="text-muted-foreground">{entity.department_name}</span>
            ),
        },
        {
            key: 'status',
            label: 'Durum',
            className: 'w-[110px]',
            render: (entity) => (
                <StatusBadge
                    status={entity.status}
                    variant={statusVariantMap[entity.status] ?? 'info'}
                />
            ),
        },
        {
            key: 'location',
            label: 'Konum',
            className: 'w-[140px]',
            render: (entity) =>
                entity.location ? (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {entity.location}
                    </span>
                ) : (
                    <span className="text-muted-foreground">—</span>
                ),
        },
        {
            key: 'open_issue_count',
            label: 'Sorunlar',
            className: 'w-[80px]',
            render: (entity) =>
                entity.open_issue_count > 0 ? (
                    <Badge variant="destructive" className="text-xs">{entity.open_issue_count}</Badge>
                ) : (
                    <span className="text-muted-foreground">0</span>
                ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[60px]',
            render: (entity) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/entities/${entity.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Görüntüle
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(entity)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(entity)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Sil
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ]
}
