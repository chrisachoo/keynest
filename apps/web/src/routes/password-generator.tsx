import ToolLayout from "@/components/marketing/tool-layout"
import PasswordGenerator from "@/components/password-generator"
import { toolCopy } from "@/constants"
import { ToolScreen } from "@/routes/dashboard/password"

export function Component() {
	const copy = toolCopy.password

	return (
		<ToolLayout description={copy.description} title={copy.title}>
			<ToolScreen description={copy.description} title={copy.title}>
				<PasswordGenerator />
			</ToolScreen>
		</ToolLayout>
	)
}
