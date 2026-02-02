import { cn } from "../../lib/utils";

interface NativeLoaderProps {
    className?: string;
    size?: "sm" | "md" | "lg";
    text?: string;
}

// 12 blades, rotating with fading opacity
const blades = Array.from({ length: 12 });

export function NativeLoader({ className, size = "md", text }: NativeLoaderProps) {

    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-12 h-12"
    };

    return (
        <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
            <div className={cn("relative text-foreground/50", sizeClasses[size])} role="status" aria-label="Loading">
                {blades.map((_, i) => (
                    <div
                        key={i}
                        className="absolute top-0 left-1/2 w-[8%] h-[28%] bg-current rounded-full origin-[50%_178%]"
                        style={{
                            transform: `rotate(${i * 30}deg) translate(-50%, 0)`,
                            animation: `spinner-fade 1.2s linear infinite`,
                            animationDelay: `${-1.2 + (i * 0.1)}s`,
                        }}
                    />
                ))}
            </div>
            {text && (
                <span className="text-sm font-medium text-muted-foreground animate-pulse">
                    {text}
                </span>
            )}

            <style>{`
        @keyframes spinner-fade {
          0% { opacity: 1; }
          100% { opacity: 0.15; }
        }
      `}</style>
        </div>
    );
}
