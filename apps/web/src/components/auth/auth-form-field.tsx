import type { AnyFieldApi } from "@tanstack/react-form"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Fieldset, Input, InputGroup, Legend } from "@/components/ui/input"

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

			<InputGroup className="relative">
				<Icon className="h-[1em] opacity-50" />

				<Input
					autoComplete={autoComplete}
					className="bg-inherit"
					id={field.name}
					name={field.name}
					onBlur={field.handleBlur}
					onChange={(event) => field.handleChange(event.target.value)}
					placeholder={placeholder}
					type={type}
					value={field.state.value}
					required
				/>

				{trailing}
			</InputGroup>

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
