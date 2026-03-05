'use client'

import { useRef, useState } from 'react'
import { ImageIcon, Plus, Star, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useEntityImages, useUploadEntityImage, useDeleteEntityImage, useSetPrimaryImage } from '@/hooks/queries/use-entities'

interface ImagesTabProps {
    entityId: number
}

export function ImagesTab({ entityId }: ImagesTabProps) {
    const { data, isLoading } = useEntityImages(entityId)
    const uploadMutation = useUploadEntityImage(entityId)
    const deleteMutation = useDeleteEntityImage(entityId)
    const setPrimaryMutation = useSetPrimaryImage(entityId)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

    const images = data?.data ?? []

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        const formData = new FormData()
        formData.append('image', file)
        uploadMutation.mutate(formData)
        e.target.value = ''
    }

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadMutation.isPending}
                >
                    <Plus className="mr-1 h-4 w-4" />
                    Görsel Yükle
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            {images.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                    <ImageIcon className="h-10 w-10 opacity-30" />
                    <p className="text-sm">Henüz görsel eklenmemiş</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {images.map((img) => (
                        <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
                            <img
                                src={img.thumbnail ?? img.image}
                                alt={img.caption ?? ''}
                                className="h-full w-full object-cover"
                            />
                            {img.is_primary && (
                                <Badge className="absolute left-1 top-1 bg-emerald-500 text-white text-xs px-1.5 py-0.5">
                                    Birincil
                                </Badge>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                {!img.is_primary && (
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="h-7 w-7"
                                        onClick={() => setPrimaryMutation.mutate(img.id)}
                                        disabled={setPrimaryMutation.isPending}
                                        title="Birincil Yap"
                                    >
                                        <Star className="h-3 w-3" />
                                    </Button>
                                )}
                                <Button
                                    size="icon"
                                    variant="destructive"
                                    className="h-7 w-7"
                                    onClick={() => setDeleteTarget(img.id)}
                                    title="Sil"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
                title="Görseli Sil"
                description="Bu görsel kalıcı olarak silinecek. Devam etmek istiyor musunuz?"
                onConfirm={() => {
                    if (deleteTarget !== null) {
                        deleteMutation.mutate(deleteTarget, { onSuccess: () => setDeleteTarget(null) })
                    }
                }}
                isLoading={deleteMutation.isPending}
            />
        </div>
    )
}
