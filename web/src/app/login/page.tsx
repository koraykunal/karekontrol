'use client'

import {useState} from 'react'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
import {toast} from 'sonner'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card'
import {useAuth} from '@/hooks/useAuth'
import Image from "next/image";

const loginSchema = z.object({
    email: z.email('Geçerli bir e-posta adresi giriniz'),
    password: z.string().min(1, 'Şifre gereklidir'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const {login} = useAuth()

    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (formData: LoginFormData) => {
        setIsLoading(true)
        try {
            await login(formData.email, formData.password)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Giriş başarısız')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md bg-white text-black border-gray-200 shadow-lg"> <CardHeader
                className="space-y-1 text-center">
                <Image src={"/karekontrol_logo.jpeg"} alt={"KareKontrol Logo"} width={250} height={250}
                       className="mx-auto"/>
            </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-posta</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="ornek@sirket.com"
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="text-sm text-destructive">{errors.email.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Şifre</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                {...register('password')}
                            />
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password.message}</p>
                            )}
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
