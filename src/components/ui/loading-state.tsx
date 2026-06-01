import { cn } from "@/lib/utils"

export interface LoadingStateProps {
    label?: string
    size?: "sm" | "md" | "lg"
    fullPage?: boolean
    className?: string
}

export function LoadingState({ label, size = "md", fullPage = false, className }: LoadingStateProps) {
    const sizeClasses = {
        sm: "h-5 w-5 stroke-[2.5]",
        md: "h-8 w-8 stroke-[2]",
        lg: "h-12 w-12 stroke-[1.5]",
    }

    const content = (
        <div className={cn("flex flex-col items-center justify-center gap-3 p-6 text-center select-none", className)}>
            <svg
                className={cn("animate-spin text-primary", sizeClasses[size])}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
            </svg>
            {label && (
                <p className="text-sm font-medium text-muted-foreground/80 animate-pulse">
                    {label}
                </p>
            )}
        </div>
    )

    if (fullPage) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/60 backdrop-blur-sm">
                {content}
            </div>
        )
    }

    return content
}
