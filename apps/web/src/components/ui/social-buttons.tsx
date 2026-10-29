import { Button } from "@/components/ui/button"
import { Github, Google } from "@/components/ui/icons"

export default function SocialButtons({
	onGoogle
}: Readonly<{ onGoogle?: () => void }>) {
	return (
		<div className="flex items-center justify-center gap-2">
			<Button
				type="button"
				shape="square"
				aria-label="Continue with GitHub"
				className="border-neutral bg-neutral text-neutral-content"
			>
				<Github />
			</Button>

			<Button
				type="button"
				shape="square"
				aria-label="Continue with Google"
				disabled={!onGoogle}
				onClick={onGoogle}
				className="border-base-300 bg-base-100 text-base-content"
			>
				<Google />
			</Button>
		</div>
	)
}
