'use client'

import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { usePagination } from '@/hooks/usePagination'
import { useOrganizations, useToggleOrganizationStatus } from '@/hooks/queries/use-organizations'
import { getOrgColumns } from './_components/org-columns'
import { OrgFormDialog } from './_components/org-form-dialog'
import { OnboardFormDialog } from './_components/onboard-form-dialog'
import type { OrganizationListItem } from '@/types'

export default function OrganizationsPage() {
    const { page, pageSize, search, ordering, setPage, setSearch, setOrdering } = usePagination()

    const [onboardOpen, setOnboardOpen] = useState(false)
    const [editFormOpen, setEditFormOpen] = useState(false)
    const [editingOrg, setEditingOrg] = useState<OrganizationListItem | null>(null)
    const [toggleTarget, setToggleTarget] = useState<OrganizationListItem | null>(null)

    const { data, isLoading } = useOrganizations({ page, page_size: pageSize, search, ordering })

    const toggleMutation = useToggleOrganizationStatus({
        onSuccess: () => setToggleTarget(null),
    })

    const columns = useMemo(
        () =>
            getOrgColumns({
                onEdit: (org) => {
                    setEditingOrg(org)
                    setEditFormOpen(true)
                },
                onToggleStatus: (org) => setToggleTarget(org),
            }),
        []
    )

    const handleEditClose = (open: boolean) => {
        setEditFormOpen(open)
        if (!open) setEditingOrg(null)
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Organizasyonlar"
                description="Sisteme kayıtlı organizasyonları yönetin"
                action={
                    <Button onClick={() => setOnboardOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Yeni Organizasyon
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
                searchPlaceholder="Organizasyon ara..."
                emptyMessage="Henüz organizasyon eklenmemiş"
            />

            <OnboardFormDialog
                open={onboardOpen}
                onOpenChange={setOnboardOpen}
            />

            <OrgFormDialog
                open={editFormOpen}
                onOpenChange={handleEditClose}
                editingOrg={editingOrg}
            />

            <ConfirmDialog
                open={!!toggleTarget}
                onOpenChange={() => setToggleTarget(null)}
                title={toggleTarget?.is_active ? 'Organizasyonu Deaktif Et' : 'Organizasyonu Aktif Et'}
                description={
                    toggleTarget?.is_active
                        ? `"${toggleTarget?.name}" organizasyonunu deaktif etmek istediğinizden emin misiniz?`
                        : `"${toggleTarget?.name}" organizasyonunu tekrar aktif etmek istediğinizden emin misiniz?`
                }
                variant={toggleTarget?.is_active ? 'danger' : 'default'}
                isLoading={toggleMutation.isPending}
                onConfirm={() => toggleTarget && toggleMutation.mutate({ id: toggleTarget.id, isActive: toggleTarget.is_active })}
            />
        </div>
    )
}
