import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useFloating, autoUpdate, offset, flip, shift, useHover, useFocus, useDismiss, useRole, useInteractions, FloatingPortal } from '@floating-ui/react'
import { cn } from "../../lib/utils"

interface TooltipContextType {
    open: boolean
    setOpen: (open: boolean) => void
    x: number | null
    y: number | null
    strategy: any
    refs: any
    context: any
    getFloatingProps: any
    getReferenceProps: any
}

const TooltipContext = React.createContext<TooltipContextType>(null!)

export const useTooltip = () => {
    const context = React.useContext(TooltipContext)
    if (!context) {
        throw new Error("useTooltip must be used within a TooltipProvider & Tooltip")
    }
    return context
}

// --- Components ---

export function TooltipProvider({ children }: { children: React.ReactNode, delayDuration?: number, skipDelayDuration?: number, disableHoverableContent?: boolean, openDelay?: number, closeDelay?: number }) {
    return <>{children}</>
}

export function Tooltip({ children, open: controlledOpen, onOpenChange: setControlledOpen, openDelay = 300, closeDelay = 200, side = 'top', sideOffset = 4 }: any) {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)

    const open = controlledOpen ?? uncontrolledOpen
    const setOpen = setControlledOpen ?? setUncontrolledOpen

    const data = useFloating({
        placement: side,
        open,
        onOpenChange: setOpen,
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(sideOffset),
            flip({ fallbackAxisSideDirection: "start" }),
            shift(),
        ],
    })

    const context = data.context

    const hover = useHover(context, {
        move: false,
        enabled: true,
        delay: { open: openDelay, close: closeDelay },
    })
    const focus = useFocus(context)
    const dismiss = useDismiss(context)
    const role = useRole(context, { role: "tooltip" })

    const interactions = useInteractions([hover, focus, dismiss, role])

    return (
        <TooltipContext.Provider value={{ open, setOpen, ...interactions, ...data }}>
            {children}
        </TooltipContext.Provider>
    )
}

export const TooltipTrigger = React.forwardRef<HTMLElement, React.HTMLProps<HTMLElement> & { asChild?: boolean }>(
    ({ children, asChild, ...props }, propRef) => {
        const context = useTooltip()
        const childrenRef = (children as any).ref
        const ref = React.useMemo(() => {
            // Merge refs: context.refs.setReference, propRef, and children's ref
            return (node: HTMLElement) => {
                context.refs.setReference(node)
                if (typeof propRef === 'function') propRef(node)
                else if (propRef) (propRef as any).current = node

                if (typeof childrenRef === 'function') childrenRef(node)
                else if (childrenRef) childrenRef.current = node
            }
        }, [context.refs, propRef, childrenRef])


        return (
            <div
                ref={ref}
                className="inline-block"
                {...context.getReferenceProps(props)}
                data-state={context.open ? 'delayed-open' : 'closed'}
            >
                {children}
            </div>
        )
    }
)
TooltipTrigger.displayName = "TooltipTrigger"

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
    sideOffset?: number
}



export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
    ({ className, children, ...props }, propRef) => {
        const { refs, strategy, x, y, getFloatingProps, open } = useTooltip()

        const ref = React.useMemo(() => {
            return (node: HTMLDivElement) => {
                refs.setFloating(node)
                if (typeof propRef === 'function') propRef(node)
                else if (propRef) (propRef as any).current = node
            }
        }, [refs, propRef])

        return (
            <FloatingPortal>
                <AnimatePresence>
                    {open && (
                        <div
                            ref={ref}
                            style={{
                                position: strategy,
                                top: y ?? 0,
                                left: x ?? 0,
                                width: 'max-content',
                                zIndex: 9999,
                            }}
                            {...getFloatingProps(props)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.96 }}
                                transition={{ duration: 0.15 }}
                                className={cn(
                                    "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                                    className
                                )}
                            >
                                {children}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </FloatingPortal>
        )
    }
)
TooltipContent.displayName = "TooltipContent"
