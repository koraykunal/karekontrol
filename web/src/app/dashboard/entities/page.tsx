'use client'

import { useState, useMemo } from 'react'
import { Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { usePagination } from '@/hooks/usePagination'
import { useEntities, useDeleteEntity } from '@/hooks/queries/use-entities'
import { getEntityColumns } from './_components/entity-columns'
import { EntityFormDialog } from './_components/entity-form-dialog'
import { EntityImportDialog } from './_components/import-dialog'
import type { EntityListItem } from '@/types'

export default function EntitiesPage() {
    const { page, pageSize, search, ordering, setPage, setSearch, setOrdering } = usePagination()

    const [formOpen, setFormOpen] = useState(false)
    const [importOpen, setImportOpen] = useState(false)
    const [editingEntity, setEditingEntity] = useState<EntityListItem | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<EntityListItem | null>(null)

    const { data, isLoading } = useEntities({ page, page_size: pageSize, search, ordering })

    const deleteMutation = useDeleteEntity({
        onSuccess: () => setDeleteTarget(null),
    })

    const columns = useMemo(
        () =>
            getEntityColumns({
                onEdit: (entity) => {
                    setEditingEntity(entity)
                    setFormOpen(true)
                },
                onDelete: (entity) => setDeleteTarget(entity),
            }),
        []
    )

    const handleFormClose = (open: boolean) => {
        setFormOpen(open)
        if (!open) setEditingEntity(null)
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Varlıklar"
                description="Ekipman, makine ve varlıkları yönetin"
                action={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setImportOpen(true)}>
                            <Upload className="mr-2 h-4 w-4" />
                            Toplu Yükle
                        </Button>
                        <Button onClick={() => setFormOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Yeni Varlık
                        </Button>
                    </div>
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
                searchPlaceholder="Varlık ara..."
                emptyMessage="Henüz varlık eklenmemiş"
            />

            <EntityFormDialog
                open={formOpen}
                onOpenChange={handleFormClose}
                editingEntity={editingEntity}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                title="Varlığı Sil"
                description={`"${deleteTarget?.name}" varlığını silmek istediğinizden emin misiniz?`}
                variant="danger"
                confirmLabel="Sil"
                isLoading={deleteMutation.isPending}
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            />

            <EntityImportDialog
                open={importOpen}
                onOpenChange={setImportOpen}
            />
        </div>
    )
}
