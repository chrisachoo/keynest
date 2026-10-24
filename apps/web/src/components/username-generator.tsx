import { generateUsername } from "@keynest/utils"
import { WandSparkles } from "lucide-react"
import { useState } from "react"

import {
	CheckboxField,
	OptionField,
	ValueBar
} from "@/components/password-generator"
import { Button } from "@/components/ui/button"
import { USERNAME_SEPARATORS } from "@/constants"

export default function UsernameGenerator() {
	const [includeNumber, setIncludeNumber] = useState(true)
	const [separator, setSeparator] = useState("-")
	const [username, setUsername] = useState(() => generateUsername(true, "-"))

	function regenerateUsername(
		nextIncludeNumber = includeNumber,
		nextSeparator = separator
	) {
		setUsername(generateUsername(nextIncludeNumber, nextSeparator))
	}

	return (
		<div className="card w-full max-w-4xl md:bg-base-200">
			<div className="card-body gap-6 p-0 md:p-6">
				<h2 className="card-title">Choose a username</h2>

				<div className="space-y-6 rounded-3xl border border-base-300 bg-base-100 p-6 md:border-none">
					<ValueBar label="Copy username" value={username} />

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<CheckboxField
							checked={includeNumber}
							label="Include a two-digit number"
							onChange={(checked) => {
								setIncludeNumber(checked)
								regenerateUsername(checked)
							}}
						/>

						<OptionField
							legend="Separator"
							onChange={(next) => {
								setSeparator(next)
								regenerateUsername(includeNumber, next)
							}}
							options={USERNAME_SEPARATORS}
							value={separator}
						/>
					</div>
				</div>

				<div className="card-actions justify-end">
					<Button
						onClick={() => regenerateUsername()}
						type="button"
						variant="primary"
					>
						<WandSparkles className="size-5" />
						Regenerate username
					</Button>
				</div>
			</div>
		</div>
	)
}
