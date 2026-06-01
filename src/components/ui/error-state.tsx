import { AlertCircle } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

export interface ErrorStateProps {
    title?: string
    message: string
    onRetry?: () => void
    retryLabel?: string
    className?: string
}

export function ErrorState({
    title = "Something went wrong",
    message,
    onRetry,
    retryLabel = "Retry",
    className
}: ErrorStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center p-6 text-center select-none max-w-sm mx-auto", className)}>
            <div className="mb-4 p-3 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-1">
                {title}
            </h3>
            <p className="text-sm text-muted-foreground/80 mb-6 leading-relaxed">
                {message}
            </p>
            {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                    {retryLabel}
                </Button>
            )}
        </div>
    )
}
