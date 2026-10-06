import type { AnyFieldApi } from "@tanstack/react-form"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Fieldset, Input, Legend } from "@/components/ui/input"

export default function AuthFormField({
	autoComplete,
	field,
	icon: Icon,
	label,
	placeholder,
	trailing,
	type = "text"
}: Readonly<{
	autoComplete: string
	field: AnyFieldApi
	icon: LucideIcon
	label: string
	placeholder: string
	trailing?: ReactNode
	type?: string
}>) {
	return (
		<Fieldset className="space-y-2">
			<Legend className="m-0">{label}</Legend>

			<div className="relative">
				<Icon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />

				<Input
					id={field.name}
					name={field.name}
					type={type}
					autoComplete={autoComplete}
					placeholder={placeholder}
					value={field.state.value}
					onBlur={field.handleBlur}
					onChange={(event) => field.handleChange(event.target.value)}
					required
				/>

				{trailing}
			</div>

			{field.state.meta.errors.flatMap(
				(error: { message?: string } | undefined) => {
					const message = error?.message

					if (!message) {
						return []
					}

					return [
						<p key={message} className="text-destructive text-sm">
							{message}
						</p>
					]
				}
			)}
		</Fieldset>
	)
}
