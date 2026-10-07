import { cn } from "cn"
import { ArrowRight, Check, ShieldCheck } from "lucide-react"
import { Link } from "react-router"

import Logo from "@/components/ui/logo"
import { marketingCopy } from "@/constants"

import SectionLink from "./section-link"

const previewTones = {
	github: "bg-neutral text-neutral-content",
	linear: "bg-accent text-accent-content",
	notion: "bg-base-content text-base-100",
	wifi: "bg-warning text-warning-content"
} as const

function VaultPreview() {
	const { preview } = marketingCopy

	return (
		<div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none">
			<div
				aria-hidden="true"
				className="absolute -inset-4 rounded-box bg-success/15 blur-2xl"
			/>
			<div
				aria-hidden="true"
				className="card relative overflow-hidden bg-base-100 shadow-sm card-border"
			>
				<div className="flex items-center justify-between gap-3 border-b border-base-300 bg-base-100 px-4 py-3">
					<Logo name size="xs" />
					<div className="flex items-center gap-2 text-xs text-base-content/60">
						<span className="status status-success status-sm" />
						{preview.status}
					</div>
				</div>

				<div className="grid sm:grid-cols-[11rem_minmax(0,1fr)]">
					<aside className="hidden h-full flex-col border-e border-base-300 bg-base-200 p-3 sm:flex">
						<ul className="menu w-full menu-sm p-0">
							<li className="menu-title">{preview.workspaceTitle}</li>
							{preview.workspace.map((item, index) => (
								<li key={item}>
									<a tabIndex={-1} className={cn(index === 0 && "menu-active")}>
										{item}
									</a>
								</li>
							))}
						</ul>
						<div className="mt-auto rounded-box border border-base-300 bg-base-100 p-3">
							<div className="flex items-center gap-1.5 text-xs font-medium">
								<ShieldCheck className="size-3.5 text-success" />
								{preview.healthLabel}
							</div>
							<progress
								className="progress mt-2 w-full progress-success"
								value={preview.healthValue}
								max={100}
							/>
							<p className="mt-1.5 text-xs text-base-content/50">
								{preview.healthStatus}
							</p>
						</div>
					</aside>

					<div className="min-w-0 p-4 sm:p-5">
						<div className="mb-5 flex items-end justify-between gap-3">
							<div className="min-w-0">
								<p className="text-xs font-medium tracking-wide text-base-content/50 uppercase">
									{preview.eyebrow}
								</p>
								<h2 className="mt-1 truncate text-lg font-semibold tracking-tight">
									{preview.greeting}
								</h2>
							</div>
							<div className="hidden shrink-0 items-center gap-1 sm:flex">
								<kbd className="kbd kbd-xs">⌘</kbd>
								<kbd className="kbd kbd-xs">K</kbd>
							</div>
						</div>

						<div className="mb-3 sm:hidden">
							<div className="mb-1.5 flex items-center justify-between text-xs">
								<span className="inline-flex items-center gap-1.5 font-medium">
									<ShieldCheck className="size-3.5 text-success" />
									{preview.healthLabel}
								</span>
								<span className="text-base-content/50">
									{preview.healthValue}%
								</span>
							</div>
							<progress
								className="progress w-full progress-success"
								value={preview.healthValue}
								max={100}
							/>
						</div>

						<div className="mb-2 flex items-center justify-between text-xs">
							<span className="font-medium">{preview.recentLabel}</span>
							<span className="text-base-content/50">
								{preview.items.length} items
							</span>
						</div>

						<ul className="list">
							{preview.items.map((item) => (
								<li key={item.key} className="list-row px-1">
									<div className="avatar avatar-placeholder">
										<div
											className={cn("w-8 rounded-full", previewTones[item.key])}
										>
											<span className="text-xs font-medium">
												{item.initial}
											</span>
										</div>
									</div>
									<div className="min-w-0">
										<div className="truncate text-sm font-medium">
											{item.name}
										</div>
										<div className="truncate text-xs text-base-content/50">
											{item.detail}
										</div>
									</div>
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</div>
	)
}

export default function HeroSection() {
	const { account, hero } = marketingCopy

	return (
		<section className="hero overflow-x-clip bg-base-100">
			<div className="hero-content mx-auto w-full max-w-7xl flex-col items-stretch gap-12 px-5 py-16 sm:px-8 lg:flex-row lg:items-center lg:gap-16 lg:px-12 lg:py-24">
				<div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:min-w-0 lg:flex-1 lg:text-left">
					<div className="badge gap-2 badge-soft badge-success">
						<span className="status status-success status-xs" />
						<span>{hero.badge}</span>
					</div>
					<h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance text-base-content sm:text-5xl lg:text-6xl">
						{hero.title}{" "}
						<span className="text-base-content/45">{hero.titleAccent}</span>
					</h1>
					<p className="mx-auto mt-6 max-w-lg text-base leading-7 text-base-content/70 sm:text-lg lg:mx-0">
						{hero.body}
					</p>
					<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
						<Link
							to={account.getStarted.to}
							className="btn w-full btn-primary sm:w-auto"
						>
							{hero.primaryCta}
							<ArrowRight className="size-4" />
						</Link>
						<SectionLink
							href="#security"
							className="btn w-full btn-outline sm:w-auto"
						>
							{hero.secondaryCta}
						</SectionLink>
					</div>
					<ul className="mt-8 flex flex-col items-center gap-2 text-sm text-base-content/70 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-5 lg:justify-start">
						{hero.highlights.map(({ key, label }) => (
							<li key={key} className="flex items-center gap-1.5">
								<Check className="size-4 text-success" />
								{label}
							</li>
						))}
					</ul>
				</div>
				<div className="mx-auto w-full max-w-xl min-w-0 lg:mx-0 lg:max-w-none lg:flex-1">
					<VaultPreview />
				</div>
			</div>
		</section>
	)
}
