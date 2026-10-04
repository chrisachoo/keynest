// oxlint-disable no-console
import { useForm } from "@tanstack/react-form"
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate } from "react-router"
import * as v from "valibot"

import { Button } from "@/components/ui/button"
import { Github, Google } from "@/components/ui/icons"
import { Fieldset, Input, Legend } from "@/components/ui/input"
import Logo from "@/components/ui/logo"
import { authCopy } from "@/constants"

export function Component() {
	const navigate = useNavigate()

	const form = useForm({
		defaultValues: {
			email: "",
			password: ""
		},
		onSubmit: ({ value }) => {
			setTimeout(() => {
				console.log("value: ", value)
			}, 3000)
		},
		validators: {
			onSubmit: v.object({
				email: v.pipe(
					v.string(),
					v.nonEmpty("Email is required"),
					v.email("Enter a valid email address")
				),
				password: v.pipe(v.string(), v.nonEmpty("Password is required"))
			})
		}
	})

	const [showPassword, setShowPassword] = useState(false)
	const copy = authCopy["signup"]

	return (
		<div className="mx-auto flex w-full max-w-md flex-col justify-center gap-7">
			<div className="flex flex-col items-center gap-4 text-center">
				<Logo
					size="md"
					logoClassName="rounded-2xl"
					onClick={() => navigate("/")}
				/>

				<div className="space-y-2">
					<h1 className="text-3xl font-semibold tracking-tight">
						{copy.title}
					</h1>
					<p className="text-muted-foreground text-sm">{copy.subtitle}</p>
				</div>
			</div>

			<div className="flex items-center justify-center gap-2">
				<button className="btn btn-square border-black bg-black text-white">
					<Github />
				</button>

				<button className="btn btn-square border-white bg-white text-black">
					<Google />
				</button>
			</div>

			<div className="relative flex items-center">
				<div className="flex-1 border-t" />
				<span className="text-muted-foreground px-3 text-xs">
					OR CONTINUE WITH EMAIL
				</span>
				<div className="flex-1 border-t" />
			</div>

			<form
				onSubmit={(event) => {
					event.preventDefault()
					event.stopPropagation()
					form.handleSubmit()
				}}
				className="space-y-4"
			>
				<form.Field name="email">
					{(field) => (
						<Fieldset className="space-y-2">
							<Legend className="m-0">Email</Legend>

							<div className="relative">
								<Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />

								<Input
									id={field.name}
									name={field.name}
									type="email"
									autoComplete="email"
									placeholder="you@example.com"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									required
								/>
							</div>

							{field.state.meta.errors.map((error) => (
								<p key={error?.message} className="text-destructive text-sm">
									{error?.message}
								</p>
							))}
						</Fieldset>
					)}
				</form.Field>

				<form.Field name="password">
					{(field) => (
						<Fieldset className="space-y-2">
							<Legend className="m-0">Password</Legend>

							<div className="relative">
								<LockKeyhole className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />

								<Input
									id={field.name}
									name={field.name}
									type={showPassword ? "text" : "password"}
									autoComplete="current-password"
									placeholder="Password"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									required
								/>

								<button
									type="button"
									aria-label={showPassword ? "Hide password" : "Show password"}
									aria-pressed={showPassword}
									onClick={() => setShowPassword((visible) => !visible)}
									className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
								>
									{showPassword ? (
										<EyeOff className="size-4" />
									) : (
										<Eye className="size-4" />
									)}
								</button>
							</div>

							{field.state.meta.errors.map((error) => (
								<p key={error?.message} className="text-destructive text-sm">
									{error?.message}
								</p>
							))}
						</Fieldset>
					)}
				</form.Field>

				<div className="flex items-center justify-between gap-2">
					<span className="text-sm">Password</span>

					<Button
						type="button"
						variant="link"
						size="sm"
						className="h-auto px-0 text-xs"
					>
						Forgot password?
					</Button>
				</div>

				<form.Subscribe
					selector={(state) => ({
						canSubmit: state.canSubmit,
						isSubmitting: state.isSubmitting
					})}
				>
					{({ canSubmit, isSubmitting }) => (
						<Button
							type="submit"
							className="w-full"
							disabled={!canSubmit || isSubmitting}
						>
							{isSubmitting ? "Signing up..." : "Sign up"}
						</Button>
					)}
				</form.Subscribe>

				<div className="text-muted-foreground text-center text-sm">
					{copy.switchPrompt}{" "}
					<Link className="link link-primary" to="/login">
						{copy.switchLink}
					</Link>
				</div>
			</form>

			{/* Footer */}
			<div className="text-muted-foreground flex items-center justify-center gap-2 text-xs">
				<LockKeyhole className="size-3.5" />
				Your credentials. Your control.
			</div>
		</div>
	)
}
