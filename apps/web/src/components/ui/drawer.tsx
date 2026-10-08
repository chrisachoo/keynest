import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { createContext, use, useId, type ComponentProps } from "react"

const drawerVariants = cva("drawer", {
	variants: {
		placement: {
			end: "drawer-end"
		}
	}
})

const DrawerContext = createContext<string | null>(null)

function drawerCheckedProps(open?: boolean, defaultOpen?: boolean) {
	if (open !== undefined) return { checked: open }
	if (defaultOpen !== undefined) return { defaultChecked: defaultOpen }
	return {}
}

function useDrawerId() {
	const id = use(DrawerContext)
	if (!id) throw new Error("Drawer components must be used inside Drawer")
	return id
}

type DrawerProps = ComponentProps<"div"> &
	VariantProps<typeof drawerVariants> & {
		defaultOpen?: boolean
		onOpenChange?: (open: boolean) => void
		open?: boolean
	}

function Drawer({
	children,
	className,
	defaultOpen,
	id,
	onOpenChange,
	open,
	placement,
	...props
}: Readonly<DrawerProps>) {
	const generatedId = useId()
	const drawerId = id ?? generatedId
	const checkedProps = drawerCheckedProps(open, defaultOpen)

	return (
		<DrawerContext value={drawerId}>
			<div
				className={cn(drawerVariants({ placement }), className)}
				data-slot="drawer"
				{...props}
			>
				<input
					className="drawer-toggle"
					id={drawerId}
					onChange={(event) => onOpenChange?.(event.currentTarget.checked)}
					type="checkbox"
					{...checkedProps}
				/>
				{children}
			</div>
		</DrawerContext>
	)
}

function DrawerContent({
	className,
	...props
}: Readonly<ComponentProps<"div">>) {
	return (
		<div
			className={cn("drawer-content", className)}
			data-slot="drawer-content"
			{...props}
		/>
	)
}

function DrawerSide({
	children,
	className,
	closeLabel = "Close",
	...props
}: Readonly<ComponentProps<"div"> & { closeLabel?: string }>) {
	const id = useDrawerId()

	return (
		<div
			className={cn("drawer-side", className)}
			data-slot="drawer-side"
			{...props}
		>
			<label aria-label={closeLabel} className="drawer-overlay" htmlFor={id} />
			{children}
		</div>
	)
}

function DrawerTrigger({
	className,
	...props
}: Readonly<ComponentProps<"label">>) {
	const id = useDrawerId()

	return (
		<label
			{...props}
			className={cn("drawer-button", className)}
			data-slot="drawer-trigger"
			htmlFor={id}
		/>
	)
}

export { Drawer, DrawerContent, DrawerSide, DrawerTrigger, drawerVariants }
export type { DrawerProps }
