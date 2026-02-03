import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useFloating, autoUpdate, offset, flip, shift, useHover, useFocus, useDismiss, useRole, useInteractions, FloatingPortal } from '@floating-ui/react'
import { cn } from "../../lib/utils"

// --- Contexts ---

interface ProviderContextType {
    delayDuration: number
    skipDelayDuration: number
    disableHoverableContent: boolean
}

const ProviderContext = React.createContext<ProviderContextType>({
    delayDuration: 700,
    skipDelayDuration: 300,
    disableHoverableContent: false
})

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
        throw new Error("useTooltip must be used within a Tooltip")
    }
    return context
}

// --- Components ---

interface TooltipProviderProps {
    children: React.ReactNode
    delayDuration?: number
    skipDelayDuration?: number
    disableHoverableContent?: boolean
}

export function TooltipProvider({
    children,
    delayDuration = 700,
    skipDelayDuration = 300,
    disableHoverableContent = false
}: TooltipProviderProps) {
    const contextValue = React.useMemo(() => ({
        delayDuration,
        skipDelayDuration,
        disableHoverableContent
    }), [delayDuration, skipDelayDuration, disableHoverableContent])

    return (
        <ProviderContext.Provider value={contextValue}>
            {children}
        </ProviderContext.Provider>
    )
}

interface TooltipProps {
    children: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    openDelay?: number
    closeDelay?: number
    side?: import('@floating-ui/react').Placement
    sideOffset?: number
}

export function Tooltip({
    children,
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    openDelay: propOpenDelay,
    closeDelay = 200,
    side = 'top',
    sideOffset = 4
}: TooltipProps) {
    const providerContext = React.useContext(ProviderContext)
    const openDelay = propOpenDelay ?? providerContext.delayDuration

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

// Helper for safe ref merging
function useMergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
    return React.useMemo(() => {
        if (refs.every((ref) => ref == null)) return null
        return (node: T) => {
            refs.forEach((ref) => {
                if (typeof ref === 'function') ref(node)
                else if (ref != null) (ref as React.MutableRefObject<T | null>).current = node
            })
        }
    }, [refs])
}

export const TooltipTrigger = React.forwardRef<HTMLElement, React.HTMLProps<HTMLElement> & { asChild?: boolean }>(
    ({ children, asChild, ...props }, propRef) => {
        const context = useTooltip()
        // eslint-disable-next-line react-hooks/exhaustive-deps
        const childrenRef = (children as any).ref
        const mergedRef = useMergeRefs(context.refs.setReference, propRef, childrenRef)

        const referenceProps = context.getReferenceProps(props)

        // If asChild is true and children is a valid element, clone it with merged props
        if (asChild && React.isValidElement(children)) {
            return React.cloneElement(children as React.ReactElement<any>, {
                ref: mergedRef,
                ...referenceProps,
                'data-state': context.open ? 'delayed-open' : 'closed',
            })
        }

        return (
            <div
                ref={mergedRef}
                className="inline-block"
                {...referenceProps}
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
        const mergedRef = useMergeRefs(refs.setFloating, propRef)

        return (
            <FloatingPortal>
                <AnimatePresence>
                    {open && (
                        <div
                            ref={mergedRef}
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

/**
 * A tooltip that only appears if the child (text) is truncated by overflow.
 */
export function OverflowTooltip({
    children,
    content,
    className,
    openDelay,
    closeDelay,
    side,
    sideOffset,
    ...props
}: any) {
    const [isOverflowing, setIsOverflowing] = React.useState(false)
    const triggerRef = React.useRef<any>(null)

    const checkOverflow = React.useCallback(() => {
        const el = triggerRef.current
        if (el) {
            // Use a 1px threshold to avoid tooltips on sub-pixel differences
            const hasOverflow = el.scrollWidth > el.clientWidth + 1
            setIsOverflowing(hasOverflow)
        }
    }, [])

    React.useLayoutEffect(() => {
        checkOverflow()
        const observer = new ResizeObserver(checkOverflow)
        if (triggerRef.current) observer.observe(triggerRef.current)
        return () => observer.disconnect()
    }, [checkOverflow, children])

    if (!isOverflowing) {
        return (
            <div ref={triggerRef} className={cn("truncate", className)} {...props}>
                {children}
            </div>
        )
    }

    return (
        <Tooltip
            openDelay={openDelay}
            closeDelay={closeDelay}
            side={side}
            sideOffset={sideOffset}
        >
            <TooltipTrigger asChild ref={triggerRef}>
                <div className={cn("truncate", className)} {...props}>
                    {children}
                </div>
            </TooltipTrigger>
            <TooltipContent>
                {content}
            </TooltipContent>
        </Tooltip>
    )
}
