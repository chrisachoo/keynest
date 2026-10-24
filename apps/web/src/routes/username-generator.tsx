import ToolLayout from "@/components/marketing/tool-layout"
import UsernameGenerator from "@/components/username-generator"
import { toolCopy } from "@/constants"
import { ToolScreen } from "@/routes/dashboard/password"

export function Component() {
	const copy = toolCopy.username

	return (
		<ToolLayout description={copy.description} title={copy.title}>
			<ToolScreen description={copy.description} title={copy.title}>
				<UsernameGenerator />
			</ToolScreen>
		</ToolLayout>
	)
}
