import {
	MEMORABLE_PASSWORD_LIMITS,
	PASSWORD_MODES,
	PASSWORD_SEPARATORS,
	RANDOM_PASSWORD_LIMITS,
	SEPARATOR_EXAMPLE_WORDS
} from "@keynest/utils"
import { cn } from "cn"
import { Check, Copy, Lightbulb, Shuffle, WandSparkles } from "lucide-react"
import { type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { MEMORABLE_TOGGLES, RANDOM_TOGGLES } from "@/constants"
import { useClipboard } from "@/hooks/use-clipboard"
import { usePasswordGenerator } from "@/hooks/use-password-generator"

export function ValueBar({
	empty = "No password",
	label,
	value
}: Readonly<{
	empty?: string
	label: string
	value: string
}>) {
	const { copied, copy } = useClipboard({ timeout: 500 })

	return (
		<div className="flex items-center gap-2 rounded-full bg-base-200 p-1">
			<p className="flex-1 px-4 text-center font-mono font-medium break-all">
				{value || empty}
			</p>
			<Button
				aria-label={label}
				disabled={!value}
				onClick={() => void copy(value)}
				shape="square"
				type="button"
			>
				{copied ? <Check className="size-5" /> : <Copy className="size-5" />}
			</Button>
		</div>
	)
}

export function CheckboxField(props: {
	checked: boolean
	label: string
	onChange: (checked: boolean) => void
}) {
	return (
		<label className="label">
			<input
				checked={props.checked}
				className="checkbox"
				onChange={(event) => props.onChange(event.target.checked)}
				type="checkbox"
			/>
			{props.label}
		</label>
	)
}

export function OptionField(props: {
	legend: string
	onChange: (value: string) => void
	options: ReadonlyArray<{ label: string; value: string }>
	value: string
}) {
	return (
		<fieldset className="fieldset">
			<legend className="fieldset-legend pt-0">{props.legend}</legend>
			<select
				className="select w-full font-mono"
				onChange={(event) => props.onChange(event.target.value)}
				value={props.value}
			>
				{props.options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</fieldset>
	)
}

function PasswordPreview(
	props: Readonly<ReturnType<typeof usePasswordGenerator>>
) {
	return (
		<div className="space-y-6">
			<ValueBar label="Copy password" value={props.password} />
			<div className="flex items-center gap-4">
				<progress
					className={cn("progress w-full", props.meter)}
					max="100"
					value={props.value}
				/>
				<p className={cn("w-24 font-bold capitalize", props.text)}>
					{props.strength}
				</p>
			</div>
		</div>
	)
}

function RandomOptionsForm(
	props: Pick<
		ReturnType<typeof usePasswordGenerator>,
		"randomOptions" | "changeRandomOption"
	>
) {
	const { changeRandomOption, randomOptions } = props

	return (
		<>
			<RangeField
				label="characters"
				max={RANDOM_PASSWORD_LIMITS.maxLength}
				min={RANDOM_PASSWORD_LIMITS.minLength}
				onChange={(length) => changeRandomOption("length", length)}
				value={randomOptions.length}
			/>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				{RANDOM_TOGGLES.map(({ key, label }) => (
					<CheckboxField
						checked={randomOptions[key]}
						key={key}
						label={label}
						onChange={(checked) => changeRandomOption(key, checked)}
					/>
				))}
			</div>
		</>
	)
}

function MemorableOptionsForm(
	props: Pick<
		ReturnType<typeof usePasswordGenerator>,
		"memorableOptions" | "changeMemorableOption"
	>
) {
	const { changeMemorableOption, memorableOptions } = props

	return (
		<>
			<RangeField
				label="words"
				max={MEMORABLE_PASSWORD_LIMITS.maxWords}
				min={MEMORABLE_PASSWORD_LIMITS.minWords}
				onChange={(wordCount) => changeMemorableOption("wordCount", wordCount)}
				value={memorableOptions.wordCount}
			/>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div className="flex flex-col gap-4">
					{MEMORABLE_TOGGLES.map(({ key, label }) => (
						<CheckboxField
							checked={memorableOptions[key]}
							key={key}
							label={label}
							onChange={(checked) => changeMemorableOption(key, checked)}
						/>
					))}
				</div>
				<OptionField
					legend="Separator"
					onChange={(value) => {
						const separator = PASSWORD_SEPARATORS.find((item) => item === value)
						if (separator) changeMemorableOption("separator", separator)
					}}
					options={PASSWORD_SEPARATORS.map((separator) => ({
						label: SEPARATOR_EXAMPLE_WORDS.join(separator),
						value: separator
					}))}
					value={memorableOptions.separator}
				/>
			</div>
		</>
	)
}

function RangeField(props: {
	label: string
	max: number
	min: number
	onChange: (value: number) => void
	value: number
}) {
	return (
		<div className="space-y-2">
			<p>
				{props.value} {props.label}
			</p>
			<input
				className="range w-full"
				max={props.max}
				min={props.min}
				onChange={(event) => props.onChange(Number(event.target.value))}
				type="range"
				value={props.value}
			/>
		</div>
	)
}

export default function PasswordGenerator() {
	const generator = usePasswordGenerator()

	return (
		<div className="card w-full max-w-4xl md:bg-base-200">
			<div className="card-body gap-6 p-0 md:p-6">
				<h2 className="card-title">Choose password type</h2>

				<div className="tabs tabs-lift">
					{PASSWORD_MODES.map(({ id, label }) => {
						const Icon = id === "memorable" ? Lightbulb : Shuffle

						return (
							<TabPanel
								icon={<Icon className="me-2 size-4" />}
								isActive={generator.mode === id}
								key={id}
								label={label}
								onSelect={() => generator.selectMode(id)}
							>
								<PasswordPreview {...generator} />
								{id === "random" ? (
									<RandomOptionsForm {...generator} />
								) : (
									<MemorableOptionsForm {...generator} />
								)}
							</TabPanel>
						)
					})}
				</div>

				<p
					className={
						generator.message
							? "text-sm font-medium text-error"
							: "text-sm font-medium text-base-content/70"
					}
				>
					{generator.message ?? generator.crackTime}
				</p>

				<div className="card-actions justify-end">
					<Button
						onClick={generator.regeneratePassword}
						type="button"
						variant="primary"
					>
						<WandSparkles className="size-5" />
						Regenerate password
					</Button>
				</div>
			</div>
		</div>
	)
}

function TabPanel(props: {
	children: ReactNode
	icon: ReactNode
	isActive: boolean
	label: string
	onSelect: () => void
}) {
	return (
		<>
			<label className="tab">
				<input
					checked={props.isActive}
					name="password-generator"
					onChange={props.onSelect}
					type="radio"
				/>
				{props.icon}
				{props.label}
			</label>
			<div className="tab-content space-y-6 border-base-300 bg-base-100 p-6">
				{props.isActive && props.children}
			</div>
		</>
	)
}
