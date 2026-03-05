import { PageHeader } from '@/components/shared/page-header'
import { Construction } from 'lucide-react'

export default function AuditPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Denetim Kayıtları"
                description="Sistem aktivite geçmişi"
            />
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <Construction className="h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">Yakında</p>
                <p className="text-sm text-muted-foreground">Bu sayfa yapım aşamasındadır.</p>
            </div>
        </div>
    )
}
