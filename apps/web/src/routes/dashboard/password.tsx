import PageHeading from "@/components/dashboard/page-heading"
import PasswordGenerator from "@/components/password-generator"
import Container from "@/components/ui/container"

export function Component() {
	return (
		<Container className="w-full space-y-6">
			<PageHeading
				eyebrow="Utilities"
				description="Create unique, strong passwords for your accounts."
				title="Password generator"
			/>

			<PasswordGenerator />
		</Container>
	)
}
