'use client'

import { useRef, useState } from 'react'
import { Upload, Download, CheckCircle2, XCircle, Loader2, FileSpreadsheet } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { useImportProcedures } from '@/hooks/queries/use-imports'
import { importsApi } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/utils'
import type { ImportError } from '@/types'

interface ProcedureImportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

type DialogState = 'idle' | 'uploading' | 'success' | 'error'

export function ProcedureImportDialog({ open, onOpenChange }: ProcedureImportDialogProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [state, setState] = useState<DialogState>('idle')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [createdCount, setCreatedCount] = useState(0)
    const [stepsCount, setStepsCount] = useState(0)
    const [errors, setErrors] = useState<ImportError[]>([])
    const [errorMessage, setErrorMessage] = useState('')

    const importMutation = useImportProcedures()

    const reset = () => {
        setState('idle')
        setSelectedFile(null)
        setCreatedCount(0)
        setStepsCount(0)
        setErrors([])
        setErrorMessage('')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleOpenChange = (open: boolean) => {
        if (!open) reset()
        onOpenChange(open)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) setSelectedFile(file)
    }

    const handleUpload = async () => {
        if (!selectedFile) return
        setState('uploading')

        try {
            const result = await importMutation.mutateAsync({ file: selectedFile })
            if (result.success) {
                const d = result.data as { created_count: number; steps_count?: number }
                setCreatedCount(d.created_count)
                setStepsCount(d.steps_count || 0)
                setState('success')
            } else {
                setErrorMessage(result.message || 'Bilinmeyen hata')
                setErrors('errors' in result.data ? result.data.errors : [])
                setState('error')
            }
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: { message?: string; details?: { errors?: ImportError[] } }; data?: { errors?: ImportError[] } } } }
            const resp = axiosErr?.response?.data
            setErrorMessage(getApiErrorMessage(err, 'Yükleme sırasında bir hata oluştu'))
            setErrors(resp?.error?.details?.errors ?? resp?.data?.errors ?? [])
            setState('error')
        }
    }

    const handleDownloadTemplate = async () => {
        try {
            await importsApi.downloadTemplate('procedures')
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Şablon indirilemedi'))
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Toplu Prosedür Yükleme</DialogTitle>
                    <DialogDescription>
                        Excel şablonunu indirin, doldurun ve yükleyin
                    </DialogDescription>
                </DialogHeader>

                {state === 'idle' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 rounded-lg border p-4">
                            <FileSpreadsheet className="h-8 w-8 text-green-600 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">Excel Şablonu</p>
                                <p className="text-xs text-muted-foreground">
                                    Prosedürler ve adımlar için 2 sheet&apos;li şablon
                                </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                                <Download className="mr-2 h-4 w-4" />
                                İndir
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                className="w-full justify-center h-20 border-dashed"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <Upload className="h-5 w-5 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                        {selectedFile ? selectedFile.name : '.xlsx dosyası seçin'}
                                    </span>
                                </div>
                            </Button>
                        </div>

                        <Button
                            className="w-full"
                            disabled={!selectedFile}
                            onClick={handleUpload}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Yükle ve İşle
                        </Button>
                    </div>
                )}

                {state === 'uploading' && (
                    <div className="flex flex-col items-center gap-3 py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">İşleniyor...</p>
                    </div>
                )}

                {state === 'success' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                            <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-green-800">
                                    {createdCount} prosedür ve {stepsCount} adım başarıyla oluşturuldu
                                </p>
                            </div>
                        </div>
                        <Button className="w-full" onClick={() => handleOpenChange(false)}>
                            Kapat
                        </Button>
                    </div>
                )}

                {state === 'error' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                            <XCircle className="h-6 w-6 text-red-600 shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-red-800">{errorMessage}</p>
                            </div>
                        </div>

                        {errors.length > 0 && (
                            <div className="max-h-60 overflow-y-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-16">Satır</TableHead>
                                            <TableHead className="w-24">Alan</TableHead>
                                            <TableHead>Hata</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {errors.map((err, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-mono text-xs">
                                                    {err.row > 0 ? err.row : '-'}
                                                </TableCell>
                                                <TableCell className="text-xs">{err.field}</TableCell>
                                                <TableCell className="text-xs">{err.message}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={reset}>
                                Tekrar Dene
                            </Button>
                            <Button variant="outline" className="flex-1" onClick={() => handleOpenChange(false)}>
                                Kapat
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
