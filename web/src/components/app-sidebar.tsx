'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarHeader,
    SidebarFooter,
    SidebarRail,
} from '@/components/ui/sidebar'
import { navigationConfig } from '@/config/navigation'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuthStore } from '@/store/auth'
import { useTenantStore } from '@/store/tenant'
import { TenantSwitcher } from '@/components/tenant-switcher'
import { UserNav } from '@/components/user-nav'
import { useNotificationUnreadCount } from '@/hooks/queries/use-notifications'

export function AppSidebar() {
    const pathname = usePathname()
    const { role, isPlatformOwner } = usePermissions()
    const user = useAuthStore((s) => s.user)
    const { currentOrganization } = useTenantStore()
    const { data: unreadCount } = useNotificationUnreadCount()

    const orgDisplayName = isPlatformOwner
        ? 'Platform Yönetimi'
        : currentOrganization?.name ?? user?.organization_name ?? ''

    const filteredGroups = navigationConfig
        .map((group) => ({
            ...group,
            items: group.items.filter((item) => {
                if (!role) return false
                return item.allowedRoles.includes(role)
            }),
        }))
        .filter((group) => group.items.length > 0)

    return (
        <Sidebar>
            <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                        <span className="text-sm font-bold">K</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold">KareKontrol</span>
                        <span className="text-xs text-sidebar-foreground/60">
                            {orgDisplayName}
                        </span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                {isPlatformOwner && (
                    <SidebarGroup className="px-3 pt-3">
                        <TenantSwitcher />
                    </SidebarGroup>
                )}

                {filteredGroups.map((group) => (
                    <SidebarGroup key={group.title}>
                        <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => {
                                    const Icon = item.icon
                                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                                    return (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton asChild isActive={isActive}>
                                                <Link href={item.href} className="flex items-center justify-between">
                                                    <span className="flex items-center gap-2">
                                                        <Icon className="h-4 w-4" />
                                                        <span>{item.label}</span>
                                                    </span>
                                                    {item.href === '/dashboard/notifications' && unreadCount && unreadCount.count > 0 && (
                                                        <span className="flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white leading-4">
                                                            {unreadCount.count > 99 ? '99+' : unreadCount.count}
                                                        </span>
                                                    )}
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border p-3">
                <UserNav />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
