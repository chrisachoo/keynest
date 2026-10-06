import { Button } from "@/components/ui/button"
import { Github, Google } from "@/components/ui/icons"

export default function SocialButtons() {
	return (
		<div className="flex items-center justify-center gap-2">
			<Button
				type="button"
				shape="square"
				aria-label="Continue with GitHub"
				className="border-black bg-black text-white"
			>
				<Github />
			</Button>

			<Button
				type="button"
				shape="square"
				aria-label="Continue with Google"
				className="border-white bg-white text-black"
			>
				<Google />
			</Button>
		</div>
	)
}
