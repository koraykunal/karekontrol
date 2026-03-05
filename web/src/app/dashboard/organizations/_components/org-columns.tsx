'use client'

import Link from 'next/link'
import { MoreHorizontal, Eye, Pencil, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/shared/status-badge'
import type { Column } from '@/components/shared/data-table'
import type { OrganizationListItem } from '@/types'

interface OrgColumnsOptions {
    onEdit: (org: OrganizationListItem) => void
    onToggleStatus: (org: OrganizationListItem) => void
}

export function getOrgColumns({ onEdit, onToggleStatus }: OrgColumnsOptions): Column<OrganizationListItem>[] {
    return [
        {
            key: 'name',
            label: 'Organizasyon',
            sortable: true,
            render: (org) => (
                <Link
                    href={`/dashboard/organizations/${org.id}`}
                    className="font-medium hover:underline"
                >
                    {org.name}
                </Link>
            ),
        },
        {
            key: 'company_number',
            label: 'Firma No',
            className: 'w-[140px]',
            render: (org) => (
                <span className="text-muted-foreground font-mono text-sm">{org.company_number}</span>
            ),
        },
        {
            key: 'qr_quota',
            label: 'QR Kotası',
            className: 'w-[120px]',
            render: (org) => (
                <span className="text-muted-foreground">
                    {org.qr_quota === 0 ? 'Sınırsız' : org.qr_quota}
                </span>
            ),
        },
        {
            key: 'department_count',
            label: 'Departman',
            className: 'w-[120px]',
            render: (org) => (
                <span className="text-muted-foreground">{org.department_count}</span>
            ),
        },
        {
            key: 'is_active',
            label: 'Durum',
            className: 'w-[100px]',
            render: (org) => <StatusBadge status={org.is_active} />,
        },
        {
            key: 'created_at',
            label: 'Oluşturulma',
            sortable: true,
            className: 'w-[140px]',
            render: (org) => (
                <span className="text-muted-foreground">
                    {new Date(org.created_at).toLocaleDateString('tr-TR')}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[60px]',
            render: (org) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/organizations/${org.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Görüntüle
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(org)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleStatus(org)}>
                            <Power className="mr-2 h-4 w-4" />
                            {org.is_active ? 'Deaktif Et' : 'Aktif Et'}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ]
}
