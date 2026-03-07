import Link from 'next/link'
import type { Metadata } from 'next'
import { Shield, LogIn } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Gizlilik Politikası | KareKontrol',
    description: 'KareKontrol Gizlilik Politikası - Kişisel verilerinizin korunması hakkında bilgilendirme.',
}

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-background">
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

            <section className="relative overflow-hidden border-b">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/3 to-transparent" />
                <div className="relative mx-auto max-w-5xl px-6 py-16 md:py-20">
                    <div className="max-w-2xl space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                            <Shield className="h-4 w-4" />
                            Gizlilik Politikası
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                            KareKontrol Gizlilik Politikası
                        </h1>
                        <p className="text-muted-foreground">
                            Son Güncelleme: 05.03.2026
                        </p>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-5xl px-6 py-12 md:py-16">
                <div className="max-w-3xl space-y-10">

                    <div className="space-y-3">
                        <h2 className="text-xl font-bold tracking-tight">1. Veri Sorumlusu</h2>
                        <p className="leading-7 text-muted-foreground">
                            Bu uygulama KareKontrol tarafından işletilmektedir. Kişisel verilerinizin güvenliği bizim için önceliklidir.
                        </p>
                        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                            <li>İletişim: <a href="mailto:karekontrol@gmail.com" className="text-primary hover:underline">karekontrol@gmail.com</a></li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-xl font-bold tracking-tight">2. Toplanan Veriler</h2>
                        <p className="leading-7 text-muted-foreground">
                            Uygulamamızı kullanırken aşağıdaki veriler toplanabilir:
                        </p>
                        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                            <li><strong>Kimlik Bilgileri:</strong> Ad, soyad (eğer kayıt varsa)</li>
                            <li><strong>İletişim Bilgileri:</strong> E-posta adresi, telefon numarası</li>
                            <li><strong>Kullanım Verileri:</strong> Uygulama içi etkileşimler, hata raporları</li>
                            <li><strong>Cihaz Bilgileri:</strong> Cihaz modeli, işletim sistemi sürümü</li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-xl font-bold tracking-tight">3. Veri İşleme Amaçları</h2>
                        <p className="leading-7 text-muted-foreground">
                            Toplanan veriler aşağıdaki amaçlarla kullanılır:
                        </p>
                        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                            <li>Uygulamanın temel işlevlerini yerine getirmek.</li>
                            <li>Kullanıcı deneyimini iyileştirmek ve hataları gidermek.</li>
                            <li>Üyelik işlemlerini yönetmek.</li>
                            <li>Yasal yükümlülüklere uyum sağlamak.</li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-xl font-bold tracking-tight">4. Verilerin Üçüncü Taraflarla Paylaşımı</h2>
                        <p className="leading-7 text-muted-foreground">
                            Verileriniz, uygulamanın çalışması için gerekli olan hizmet sağlayıcılar dışında üçüncü taraflarla paylaşılmaz.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-xl font-bold tracking-tight">5. Veri Güvenliği</h2>
                        <p className="leading-7 text-muted-foreground">
                            Kişisel verilerinizi korumak için endüstri standartlarında güvenlik
                            önlemleri uygulanmaktadır. Verileriniz şifreli bağlantı (SSL/TLS)
                            üzerinden iletilir ve güvenli sunucularda saklanır.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-xl font-bold tracking-tight">6. Kullanıcı Hakları</h2>
                        <p className="leading-7 text-muted-foreground">
                            KVKK kapsamında aşağıdaki haklara sahipsiniz:
                        </p>
                        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                            <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
                            <li>Kişisel verilerinizin düzeltilmesini isteme</li>
                            <li>Kişisel verilerinizin silinmesini veya yok edilmesini isteme</li>
                        </ul>
                        <p className="leading-7 text-muted-foreground">
                            Bu haklarınızı kullanmak için{' '}
                            <a href="mailto:karekontrol@gmail.com" className="text-primary hover:underline">
                                karekontrol@gmail.com
                            </a>{' '}
                            adresine başvurabilirsiniz.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-xl font-bold tracking-tight">7. Çerezler ve İzleme Teknolojileri</h2>
                        <p className="leading-7 text-muted-foreground">
                            Mobil uygulamamız çerez kullanmamaktadır. Web platformumuzda oturum
                            yönetimi için gerekli çerezler kullanılmaktadır.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-xl font-bold tracking-tight">8. Değişiklikler</h2>
                        <p className="leading-7 text-muted-foreground">
                            Bu gizlilik politikası zaman zaman güncellenebilir. Önemli değişikliklerde
                            kullanıcılarımız bilgilendirilecektir. Güncel politikayı bu sayfadan
                            takip edebilirsiniz.
                        </p>
                    </div>

                    <div className="rounded-xl border bg-card p-6 space-y-2">
                        <h3 className="font-semibold">İletişim</h3>
                        <p className="text-sm text-muted-foreground">
                            Gizlilik politikamız hakkında sorularınız için bizimle iletişime geçebilirsiniz.
                        </p>
                        <p className="text-sm">
                            <a href="mailto:karekontrol@gmail.com" className="text-primary hover:underline">
                                karekontrol@gmail.com
                            </a>
                        </p>
                    </div>

                </div>
            </section>

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
