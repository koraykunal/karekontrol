import type { UserRole } from '@/lib/constants'
import {
    LayoutDashboard,
    Building2,
    Users,
    Box,
    ClipboardList,
    Play,
    ShieldCheck,
    Bell,
    BarChart3,
    Settings,
    Activity,
} from 'lucide-react'

export interface NavItem {
    label: string
    href: string
    icon: React.ElementType
    allowedRoles: UserRole[]
    children?: NavItem[]
}

export interface NavGroup {
    title: string
    items: NavItem[]
}

export const navigationConfig: NavGroup[] = [
    {
        title: 'Genel',
        items: [
            {
                label: 'Dashboard',
                href: '/dashboard',
                icon: LayoutDashboard,
                allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'WORKER'],
            },
        ],
    },
    {
        title: 'Platform Yönetimi',
        items: [
            {
                label: 'Organizasyonlar',
                href: '/dashboard/organizations',
                icon: Building2,
                allowedRoles: ['SUPER_ADMIN'],
            },
        ],
    },
    {
        title: 'Organizasyon',
        items: [
            {
                label: 'Varlıklar',
                href: '/dashboard/entities',
                icon: Box,
                allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'WORKER'],
            },
            {
                label: 'Kullanıcılar',
                href: '/dashboard/users',
                icon: Users,
                allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
            },
            {
                label: 'Prosedürler',
                href: '/dashboard/procedures',
                icon: ClipboardList,
                allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'WORKER'],
            },
            {
                label: 'Yürütme',
                href: '/dashboard/execution',
                icon: Play,
                allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'WORKER'],
            },
            {
                label: 'Uygunsuzluklar',
                href: '/dashboard/compliance',
                icon: ShieldCheck,
                allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
            },
        ],
    },
    {
        title: 'Analiz',
        items: [
            {
                label: 'Raporlar',
                href: '/dashboard/reports',
                icon: BarChart3,
                allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
            },
            {
                label: 'Denetim',
                href: '/dashboard/audit',
                icon: Activity,
                allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
            },
        ],
    },
    {
        title: 'Diğer',
        items: [
            {
                label: 'Bildirimler',
                href: '/dashboard/notifications',
                icon: Bell,
                allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'WORKER'],
            },
            {
                label: 'Ayarlar',
                href: '/dashboard/settings',
                icon: Settings,
                allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'WORKER'],
            },
        ],
    },
]
