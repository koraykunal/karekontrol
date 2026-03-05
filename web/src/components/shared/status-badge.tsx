import { Badge } from '@/components/ui/badge'

type StatusVariant = 'active' | 'inactive' | 'success' | 'warning' | 'danger' | 'info' | 'default'

interface StatusBadgeProps {
    status: boolean | string
    activeLabel?: string
    inactiveLabel?: string
    variant?: StatusVariant
    className?: string
}

const variantMap: Record<StatusVariant, string> = {
    active: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800',
    inactive: 'bg-gray-500/10 text-gray-600 border-gray-200 dark:border-gray-700',
    success: 'bg-green-500/10 text-green-600 border-green-200 dark:border-green-800',
    warning: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800',
    danger: 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-800',
    info: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800',
    default: '',
}

export function StatusBadge({
    status,
    activeLabel = 'Aktif',
    inactiveLabel = 'Pasif',
    variant,
    className = '',
}: StatusBadgeProps) {
    const isActive = typeof status === 'boolean' ? status : status === 'ACTIVE'
    const resolvedVariant = variant ?? (isActive ? 'active' : 'inactive')
    const label = typeof status === 'string' ? status : isActive ? activeLabel : inactiveLabel

    return (
        <Badge variant="outline" className={`${variantMap[resolvedVariant]} ${className}`}>
            {label}
        </Badge>
    )
}
