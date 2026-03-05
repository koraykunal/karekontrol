import Link from 'next/link'
import type { Metadata } from 'next'
import {
    Target,
    QrCode,
    BarChart3,
    ShieldCheck,
    Smartphone,
    ClipboardCheck,
    Zap,
    LogIn,
} from 'lucide-react'

export const metadata: Metadata = {
    title: 'Vizyon & Misyon | KareKontrol',
    description: 'KareKontrol - Güçlü Yönetim, Dijital Kontrol! Misyonumuz ve vizyonumuz.',
}

const highlights = [
    {
        icon: QrCode,
        title: 'Kare Kod ile Kontrol',
        description: 'Mobil cihazlar aracılığıyla QR kod ile hızlı ve pratik kontroller.',
    },
    {
        icon: ClipboardCheck,
        title: 'Dijital Kontrol Listeleri',
        description: 'Kağıt üzerindeki formlarınızı dijital ortama taşıyoruz.',
    },
    {
        icon: BarChart3,
        title: 'Gelişmiş Analiz',
        description: 'Geliştirilmiş analiz teknikleriyle verilerinizi anlamlandırın.',
    },
    {
        icon: ShieldCheck,
        title: 'Standart Uyumluluğu',
        description: 'Yönetim sistemleri ve ilgili standartlarla uyumlu kontroller.',
    },
    {
        icon: Smartphone,
        title: 'Mobil Erişim',
        description: 'Her yerden, her zaman mobil cihazlarınızla erişim imkanı.',
    },
    {
        icon: Zap,
        title: 'Pratik Arayüz',
        description: 'Basit ve kullanıcı dostu arayüz ile hızlı adaptasyon.',
    },
]

export default function VizyonMisyonPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <span className="text-sm font-bold">K</span>
                        </div>
                        <span className="text-lg font-semibold tracking-tight">KareKontrol</span>
                    </Link>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        <LogIn className="h-4 w-4" />
                        Giriş Yap
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section className="relative overflow-hidden border-b">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/3 to-transparent" />
                <div className="absolute right-0 top-0 -translate-y-1/4 translate-x-1/4 opacity-[0.04]">
                    <Target className="h-[500px] w-[500px] text-primary" />
                </div>
                <div className="relative mx-auto max-w-5xl px-6 py-20 md:py-28">
                    <div className="max-w-2xl space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                            <Target className="h-4 w-4" />
                            Misyonumuz
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                            Güçlü Yönetim,{' '}
                            <span className="text-primary">Dijital Kontrol!</span>
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Temel hedefimiz; kurumsal hayatın dijital dönüşümünde firmaların
                            ihtiyaç duyduğu kontrol süreçlerini modernleştirmek.
                        </p>
                    </div>
                </div>
            </section>

            {/* Mission Content */}
            <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
                <div className="grid gap-12 lg:grid-cols-5">
                    <div className="lg:col-span-3 space-y-6">
                        <h2 className="text-2xl font-bold tracking-tight">Hakkımızda</h2>
                        <div className="space-y-5 text-base leading-7 text-muted-foreground">
                            <p>
                                Kurumsal hayatın dijital dönüşümünde firmaların yer aldığı sektör her ne olursa olsun
                                ihtiyaç duyduğu rutin kontroller başta olmak üzere, alışılagelmiş olarak kağıt üzerinde
                                doldurulan kontrol formları (Check List); periyodik bakım gerektiren teçhizatları,
                                makineleri, araç gereçleri, personel evraklarını ve sektörler için büyük önem taşıyan
                                yönetim sistemi kontrol paneli olarak hizmet sağlamaktayız.
                            </p>
                            <p>
                                Bu hizmeti sağlarken yönetim sistemleri ve ilgili standartlarla uyumlu olarak
                                kontrolleri gerçekleştirmekteyiz. Hâlihazırda kullandığınız kontrol listelerinizi
                                pratik bir ara yüze dönüştürerek, iş yaşamınızda dijitalleşmeye entegre olmanızı
                                hedeflemekteyiz.
                            </p>
                            <p>
                                Sunduğumuz hizmet basit ara yüzüyle, geliştirilmiş analiz tekniklerinin bulunduğu;
                                mobil telefonlar aracılığıyla kontrollerin kare kod ile yapılacağı, pratik bir
                                uygulamadır.
                            </p>
                        </div>
                    </div>

                    {/* Side Stats */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="rounded-xl border bg-card p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Target className="h-5 w-5" />
                                </div>
                                <h3 className="font-semibold">Vizyonumuz</h3>
                            </div>
                            <p className="text-sm leading-6 text-muted-foreground">
                                Sektör fark etmeksizin tüm kurumsal yapıların dijital kontrol süreçlerinde
                                lider çözüm ortağı olmak ve iş güvenliği standartlarını en üst düzeye taşımak.
                            </p>
                        </div>
                        <div className="rounded-xl border bg-card p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <h3 className="font-semibold">Değerlerimiz</h3>
                            </div>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    Standartlara uyumluluk
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    Dijital dönüşüm odaklılık
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    Kullanıcı dostu çözümler
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    Sürekli gelişim ve yenilik
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Highlights */}
            <section className="border-t bg-muted/30">
                <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
                    <div className="mb-10 text-center">
                        <h2 className="text-2xl font-bold tracking-tight">Neler Sunuyoruz?</h2>
                        <p className="mt-2 text-muted-foreground">
                            Dijital kontrol süreçleriniz için kapsamlı çözümler
                        </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {highlights.map((item) => {
                            const Icon = item.icon
                            return (
                                <div
                                    key={item.title}
                                    className="group rounded-xl border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-sm"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <h3 className="text-sm font-semibold">{item.title}</h3>
                                            <p className="text-sm leading-relaxed text-muted-foreground">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
                            <span className="text-[10px] font-bold">K</span>
                        </div>
                        KareKontrol
                    </div>
                    <p className="text-xs text-muted-foreground">
                        &copy; {new Date().getFullYear()} Tüm hakları saklıdır.
                    </p>
                </div>
            </footer>
        </div>
    )
}
