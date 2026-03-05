'use client'

import { MoreHorizontal, Pencil, Power, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/shared/status-badge'
import { USER_ROLE_LABELS, type UserRole } from '@/lib/constants'
import type { Column } from '@/components/shared/data-table'
import type { UserListItem } from '@/types'

const roleColorMap: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-500/10 text-red-600',
    ADMIN: 'bg-blue-500/10 text-blue-600',
    MANAGER: 'bg-amber-500/10 text-amber-600',
    WORKER: 'bg-gray-500/10 text-gray-600',
}

interface UserColumnsOptions {
    onEdit: (user: UserListItem) => void
    onToggleStatus: (user: UserListItem) => void
    onRoleChange: (user: UserListItem) => void
}

export function getUserColumns({ onEdit, onToggleStatus, onRoleChange }: UserColumnsOptions): Column<UserListItem>[] {
    return [
        {
            key: 'full_name',
            label: 'İsim',
            sortable: true,
            render: (user) => (
                <div>
                    <span className="font-medium">{user.full_name}</span>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
            ),
        },
        {
            key: 'role',
            label: 'Rol',
            className: 'w-[140px]',
            render: (user) => (
                <Badge variant="outline" className={roleColorMap[user.role] ?? ''}>
                    {USER_ROLE_LABELS[user.role as UserRole] ?? user.role}
                </Badge>
            ),
        },
        {
            key: 'organization_name',
            label: 'Organizasyon',
            className: 'w-[180px]',
            render: (user) => (
                <span className="text-muted-foreground">{user.organization_name ?? '—'}</span>
            ),
        },
        {
            key: 'department_name',
            label: 'Departman',
            className: 'w-[160px]',
            render: (user) => (
                <span className="text-muted-foreground">{user.department_name ?? '—'}</span>
            ),
        },
        {
            key: 'is_active',
            label: 'Durum',
            className: 'w-[100px]',
            render: (user) => <StatusBadge status={user.is_active} />,
        },
        {
            key: 'actions',
            label: '',
            className: 'w-[60px]',
            render: (user) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(user)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRoleChange(user)}>
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Rol Değiştir
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onToggleStatus(user)}>
                            <Power className="mr-2 h-4 w-4" />
                            {user.is_active ? 'Deaktif Et' : 'Aktif Et'}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ]
}
