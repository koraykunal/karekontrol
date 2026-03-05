'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useEntities } from '@/hooks/queries/use-entities'
import { useProcedureOptions } from '@/hooks/queries/use-procedures'
import { useCreateProcedureLog } from '@/hooks/queries/use-execution'
import { useAuthStore } from '@/store/auth'

const schema = z.object({
    entity: z.string().min(1, 'Varlık seçiniz'),
    procedure: z.string().min(1, 'Prosedür seçiniz'),
})

type FormData = z.infer<typeof schema>

interface StartExecutionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function StartExecutionDialog({ open, onOpenChange }: StartExecutionDialogProps) {
    const router = useRouter()
    const user = useAuthStore((s) => s.user)
    const [selectedEntityId, setSelectedEntityId] = useState<number | undefined>()

    const { data: entitiesData } = useEntities({ page_size: 200 })
    const { data: proceduresData } = useProcedureOptions(selectedEntityId)
    const createMutation = useCreateProcedureLog({
        onSuccess: (id) => {
            onOpenChange(false)
            router.push(`/dashboard/execution/${id}`)
        },
    })

    const entities = entitiesData?.data ?? []
    const procedures = proceduresData?.data ?? []

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { entity: '', procedure: '' },
    })

    function handleSubmit(values: FormData) {
        if (!user?.organization) {
            toast.error('Organizasyon bilgisi bulunamadı. Lütfen tekrar giriş yapın.')
            return
        }
        createMutation.mutate({
            entity: parseInt(values.entity, 10),
            procedure: parseInt(values.procedure, 10),
            organization: user.organization,
        })
    }

    function handleOpenChange(open: boolean) {
        if (!open) {
            form.reset()
            setSelectedEntityId(undefined)
        }
        onOpenChange(open)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Yeni Yürütme Başlat</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="entity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Varlık</FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={(val) => {
                                            field.onChange(val)
                                            setSelectedEntityId(parseInt(val, 10))
                                            form.setValue('procedure', '')
                                        }}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Varlık seçin" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {entities.map((e) => (
                                                <SelectItem key={e.id} value={String(e.id)}>
                                                    {e.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="procedure"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Prosedür</FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        disabled={!selectedEntityId}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={selectedEntityId ? 'Prosedür seçin' : 'Önce varlık seçin'} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {procedures.map((p) => (
                                                <SelectItem key={p.id} value={String(p.id)}>
                                                    {p.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                                İptal
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending ? 'Başlatılıyor...' : 'Başlat'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
