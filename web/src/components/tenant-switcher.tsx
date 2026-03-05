'use client'

import { useEffect } from 'react'
import { Building2, ChevronsUpDown, Check } from 'lucide-react'
import { useTenantStore } from '@/store/tenant'
import { useOrganizationOptions } from '@/hooks/queries/use-organizations'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

export function TenantSwitcher() {
    const { currentOrganization, availableOrganizations, setOrganization, setAvailableOrganizations } = useTenantStore()
    const { data: orgsData } = useOrganizationOptions()

    useEffect(() => {
        if (orgsData?.data) {
            setAvailableOrganizations(orgsData.data as never[])
        }
    }, [orgsData, setAvailableOrganizations])

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-between gap-2 px-2 text-left">
                    <div className="flex items-center gap-2 truncate">
                        <Building2 className="h-4 w-4 shrink-0" />
                        <span className="truncate text-sm">
                            {currentOrganization?.name ?? 'Tüm Organizasyonlar'}
                        </span>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>Organizasyon Seç</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setOrganization(null)}>
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>Tüm Organizasyonlar</span>
                    {!currentOrganization && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {availableOrganizations.map((org) => (
                    <DropdownMenuItem
                        key={org.id}
                        onClick={() => setOrganization(org as never)}
                    >
                        <Building2 className="mr-2 h-4 w-4" />
                        <span className="truncate">{org.name}</span>
                        {currentOrganization?.id === org.id && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
