'use client'

import { useRef, useState } from 'react'
import { FileText, Plus, Download, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useEntityDocuments, useUploadEntityDocument, useDeleteEntityDocument } from '@/hooks/queries/use-entities'

const DOCUMENT_TYPES = [
    { value: 'MANUAL', label: 'Kullanım Kılavuzu' },
    { value: 'MAINTENANCE', label: 'Bakım Belgesi' },
    { value: 'CERTIFICATE', label: 'Sertifika' },
    { value: 'WARRANTY', label: 'Garanti Belgesi' },
    { value: 'INSPECTION', label: 'Denetim Raporu' },
    { value: 'OTHER', label: 'Diğer' },
]

const uploadSchema = z.object({
    title: z.string().min(1, 'Başlık zorunludur'),
    document_type: z.string().min(1, 'Tür seçiniz'),
})

type UploadForm = z.infer<typeof uploadSchema>

interface DocumentsTabProps {
    entityId: number
}

export function DocumentsTab({ entityId }: DocumentsTabProps) {
    const { data, isLoading } = useEntityDocuments(entityId)
    const uploadMutation = useUploadEntityDocument(entityId)
    const deleteMutation = useDeleteEntityDocument(entityId)
    const [uploadOpen, setUploadOpen] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const form = useForm<UploadForm>({
        resolver: zodResolver(uploadSchema),
        defaultValues: { title: '', document_type: 'OTHER' },
    })

    const documents = data?.data ?? []

    function handleSubmit(values: UploadForm) {
        if (!selectedFile) return
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('title', values.title)
        formData.append('document_type', values.document_type)
        uploadMutation.mutate(formData, {
            onSuccess: () => {
                setUploadOpen(false)
                setSelectedFile(null)
                form.reset()
            },
        })
    }

    if (isLoading) {
        return <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button size="sm" onClick={() => setUploadOpen(true)}>
                    <Plus className="mr-1 h-4 w-4" />
                    Doküman Yükle
                </Button>
            </div>

            {documents.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                    <FileText className="h-10 w-10 opacity-30" />
                    <p className="text-sm">Henüz doküman eklenmemiş</p>
                </div>
            ) : (
                <div className="divide-y rounded-lg border">
                    {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{doc.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(doc.created_at).toLocaleDateString('tr-TR')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-4">
                                <Badge variant="outline" className="text-xs">
                                    {DOCUMENT_TYPES.find((t) => t.value === doc.document_type)?.label ?? doc.document_type}
                                </Badge>
                                <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                                    <a href={doc.file} target="_blank" rel="noopener noreferrer" download>
                                        <Download className="h-3.5 w-3.5" />
                                    </a>
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-destructive"
                                    onClick={() => setDeleteTarget(doc.id)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Doküman Yükle</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                            <div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {selectedFile ? selectedFile.name : 'Dosya Seç'}
                                </Button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Başlık</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Doküman başlığı" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="document_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tür</FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {DOCUMENT_TYPES.map((t) => (
                                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>İptal</Button>
                                <Button type="submit" disabled={!selectedFile || uploadMutation.isPending}>
                                    {uploadMutation.isPending ? 'Yükleniyor...' : 'Yükle'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
                title="Dokümanı Sil"
                description="Bu doküman kalıcı olarak silinecek. Devam etmek istiyor musunuz?"
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
