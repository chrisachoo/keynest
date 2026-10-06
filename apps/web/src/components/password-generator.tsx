import {
	MEMORABLE_PASSWORD_LIMITS,
	PASSWORD_MODES,
	PASSWORD_SEPARATORS,
	RANDOM_PASSWORD_LIMITS,
	SEPARATOR_EXAMPLE_WORDS,
	type MemorablePasswordOptions
} from "@keynest/utils"
import { cn } from "cn"
import { Check, Copy, Lightbulb, Shuffle, WandSparkles } from "lucide-react"
import { type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { MEMORABLE_TOGGLES, RANDOM_TOGGLES } from "@/constants"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { usePasswordGenerator } from "@/hooks/use-password-generator"

function PasswordPreview(props: ReturnType<typeof usePasswordGenerator>) {
	const { hasCopied, copyToClipboard } = useCopyToClipboard()

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-2 rounded-full bg-base-200 p-1">
				<p className="flex-1 px-4 text-center font-mono font-medium break-all">
					{props.password || "No password"}
				</p>
				<Button
					type="button"
					shape="square"
					aria-label="Copy password"
					disabled={!props.password}
					onClick={() => copyToClipboard(props.password)}
				>
					{hasCopied ? (
						<Check className="size-5" />
					) : (
						<Copy className="size-5" />
					)}
				</Button>
			</div>

			<div className="flex items-center gap-4">
				<progress
					className={cn("progress w-full", props.meter)}
					value={props.value}
					max="100"
				/>
				<p className={cn("w-24 font-bold capitalize", props.text)}>
					{props.strength}
				</p>
			</div>
		</div>
	)
}

function RangeField(props: {
	label: string
	value: number
	min: number
	max: number
	onChange: (value: number) => void
}) {
	return (
		<div className="space-y-2">
			<p>
				{props.value} {props.label}
			</p>
			<input
				type="range"
				className="range w-full"
				min={props.min}
				max={props.max}
				value={props.value}
				onChange={(event) => props.onChange(Number(event.target.value))}
			/>
		</div>
	)
}

function CheckboxField(props: {
	label: string
	checked: boolean
	onChange: (checked: boolean) => void
}) {
	return (
		<label className="label">
			<input
				type="checkbox"
				className="checkbox"
				checked={props.checked}
				onChange={(event) => props.onChange(event.target.checked)}
			/>
			{props.label}
		</label>
	)
}

function SeparatorField(props: {
	value: MemorablePasswordOptions["separator"]
	onChange: (separator: MemorablePasswordOptions["separator"]) => void
}) {
	return (
		<fieldset className="fieldset">
			<legend className="fieldset-legend pt-0">Separator</legend>
			<select
				className="select w-full font-mono"
				value={props.value}
				onChange={(event) => {
					const selected = PASSWORD_SEPARATORS.find(
						(separator) => separator === event.target.value
					)
					if (selected) props.onChange(selected)
				}}
			>
				{PASSWORD_SEPARATORS.map((separator) => (
					<option key={separator} value={separator}>
						{SEPARATOR_EXAMPLE_WORDS.join(separator)}
					</option>
				))}
			</select>
		</fieldset>
	)
}

function RandomOptionsForm(
	props: Pick<
		ReturnType<typeof usePasswordGenerator>,
		"randomOptions" | "changeRandomOption"
	>
) {
	const { randomOptions, changeRandomOption } = props

	return (
		<>
			<RangeField
				label="characters"
				min={RANDOM_PASSWORD_LIMITS.minLength}
				max={RANDOM_PASSWORD_LIMITS.maxLength}
				value={randomOptions.length}
				onChange={(length) => changeRandomOption("length", length)}
			/>
			<div className="grid grid-cols-2 gap-4">
				{RANDOM_TOGGLES.map(({ key, label }) => (
					<CheckboxField
						key={key}
						label={label}
						checked={randomOptions[key]}
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
	const { memorableOptions, changeMemorableOption } = props

	return (
		<>
			<RangeField
				label="words"
				min={MEMORABLE_PASSWORD_LIMITS.minWords}
				max={MEMORABLE_PASSWORD_LIMITS.maxWords}
				value={memorableOptions.wordCount}
				onChange={(wordCount) => changeMemorableOption("wordCount", wordCount)}
			/>
			<div className="grid grid-cols-2 gap-4">
				<div className="flex flex-col gap-4">
					{MEMORABLE_TOGGLES.map(({ key, label }) => (
						<CheckboxField
							key={key}
							label={label}
							checked={memorableOptions[key]}
							onChange={(checked) => changeMemorableOption(key, checked)}
						/>
					))}
				</div>
				<SeparatorField
					value={memorableOptions.separator}
					onChange={(separator) =>
						changeMemorableOption("separator", separator)
					}
				/>
			</div>
		</>
	)
}

export default function PasswordGenerator() {
	const generator = usePasswordGenerator()

	return (
		<div className="card w-full max-w-3xl bg-base-200 card-md">
			<div className="card-body gap-6">
				<h2 className="card-title">Choose password type</h2>

				<div className="tabs tabs-lift">
					{PASSWORD_MODES.map(({ id, label }) => {
						const Icon = id === "memorable" ? Lightbulb : Shuffle

						return (
							<TabPanel
								key={id}
								label={label}
								icon={<Icon className="me-2 size-4" />}
								isActive={generator.mode === id}
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
							? "text-sm text-error"
							: "text-sm text-base-content/70"
					}
				>
					{generator.message ?? generator.crackTime}
				</p>

				<div className="card-actions justify-end">
					<Button
						type="button"
						variant="primary"
						onClick={generator.regeneratePassword}
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
	label: string
	icon: ReactNode
	isActive: boolean
	onSelect: () => void
	children: ReactNode
}) {
	return (
		<>
			<label className="tab">
				<input
					type="radio"
					name="password-generator"
					checked={props.isActive}
					onChange={props.onSelect}
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
