'use client'

import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    override componentDidCatch(error: Error, info: { componentStack: string }) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('ErrorBoundary caught:', error, info.componentStack)
        }
    }

    override render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback

            return (
                <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center">
                    <h2 className="text-xl font-semibold">Bir şeyler ters gitti</h2>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        Beklenmeyen bir hata oluştu.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => this.setState({ hasError: false, error: null })}
                    >
                        Tekrar Dene
                    </Button>
                </div>
            )
        }

        return this.props.children
    }
}
