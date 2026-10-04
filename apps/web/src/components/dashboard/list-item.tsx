import { EllipsisVertical, Star } from "lucide-react"

import { Button } from "@/components/ui/button"

import { Badge } from "../ui/badge"

function ListItem() {
	return <ul className="list rounded-box bg-base-100 shadow-md" />
}

function ListRow() {
	return (
		<li className="list-row">
			<div>
				<img
					className="size-10 rounded-box"
					alt="Tailwind CSS list item"
					src="https://img.daisyui.com/images/profile/demo/1@94.webp"
				/>
			</div>
			<div>
				<div>Website</div>
				<div className="text-xs font-semibold uppercase opacity-60">
					Username
				</div>
			</div>
			<Badge variant="ghost">Work</Badge>
			<Button variant="ghost" shape="square">
				<Star />
			</Button>
			<Button variant="ghost" shape="square">
				<EllipsisVertical />
			</Button>
		</li>
	)
}

export { ListItem, ListRow }
