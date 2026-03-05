'use client'

import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { usePagination } from '@/hooks/usePagination'
import { useUsers, useToggleUserStatus, useUpdateUserRole } from '@/hooks/queries/use-users'
import { getUserColumns } from './_components/user-columns'
import { UserFormDialog } from './_components/user-form-dialog'
import { UserRole, USER_ROLE_LABELS } from '@/lib/constants'
import type { UserListItem } from '@/types'

export default function UsersPage() {
    const { page, pageSize, search, ordering, setPage, setSearch, setOrdering } = usePagination()

    const [formOpen, setFormOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<UserListItem | null>(null)
    const [toggleTarget, setToggleTarget] = useState<UserListItem | null>(null)
    const [roleTarget, setRoleTarget] = useState<UserListItem | null>(null)
    const [selectedRole, setSelectedRole] = useState<string>('')

    const { data, isLoading } = useUsers({ page, page_size: pageSize, search, ordering })

    const toggleMutation = useToggleUserStatus({
        onSuccess: () => setToggleTarget(null),
    })

    const roleMutation = useUpdateUserRole({
        onSuccess: () => {
            setRoleTarget(null)
            setSelectedRole('')
        },
    })

    const columns = useMemo(
        () =>
            getUserColumns({
                onEdit: (user) => {
                    setEditingUser(user)
                    setFormOpen(true)
                },
                onToggleStatus: (user) => setToggleTarget(user),
                onRoleChange: (user) => {
                    setSelectedRole(user.role)
                    setRoleTarget(user)
                },
            }),
        []
    )

    const handleFormClose = (open: boolean) => {
        setFormOpen(open)
        if (!open) setEditingUser(null)
    }

    const handleRoleDialogClose = (open: boolean) => {
        if (!open) {
            setRoleTarget(null)
            setSelectedRole('')
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Kullanıcılar"
                description="Sisteme kayıtlı kullanıcıları yönetin"
                action={
                    <Button onClick={() => setFormOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Yeni Kullanıcı
                    </Button>
                }
            />

            <DataTable
                columns={columns}
                data={data?.data ?? []}
                isLoading={isLoading}
                totalCount={data?.total ?? 0}
                page={page}
                pageSize={pageSize}
                search={search}
                ordering={ordering}
                onPageChange={setPage}
                onSearchChange={setSearch}
                onSortChange={setOrdering}
                searchPlaceholder="Kullanıcı ara..."
                emptyMessage="Henüz kullanıcı eklenmemiş"
            />

            <UserFormDialog
                open={formOpen}
                onOpenChange={handleFormClose}
                editingUser={editingUser}
            />

            <ConfirmDialog
                open={!!toggleTarget}
                onOpenChange={() => setToggleTarget(null)}
                title={toggleTarget?.is_active ? 'Kullanıcıyı Deaktif Et' : 'Kullanıcıyı Aktif Et'}
                description={
                    toggleTarget?.is_active
                        ? `"${toggleTarget?.full_name}" kullanıcısını deaktif etmek istediğinizden emin misiniz?`
                        : `"${toggleTarget?.full_name}" kullanıcısını tekrar aktif etmek istediğinizden emin misiniz?`
                }
                variant={toggleTarget?.is_active ? 'danger' : 'default'}
                isLoading={toggleMutation.isPending}
                onConfirm={() => toggleTarget && toggleMutation.mutate({ id: toggleTarget.id, isActive: toggleTarget.is_active })}
            />

            <Dialog open={!!roleTarget} onOpenChange={handleRoleDialogClose}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Rol Değiştir</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">{roleTarget?.full_name}</span> kullanıcısının rolünü değiştirin.
                        </p>
                        <div className="space-y-2">
                            <Label>Yeni Rol</Label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Rol seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(UserRole).map((r) => (
                                        <SelectItem key={r} value={r}>{USER_ROLE_LABELS[r]}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleRoleDialogClose(false)}>
                            İptal
                        </Button>
                        <Button
                            disabled={!selectedRole || selectedRole === roleTarget?.role || roleMutation.isPending}
                            onClick={() => roleTarget && roleMutation.mutate({ id: roleTarget.id, role: selectedRole as typeof UserRole[keyof typeof UserRole] })}
                        >
                            {roleMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
