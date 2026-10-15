import DashboardWrapper from "@/components/dashboard/dashboard-wrapper"
import RoutingTabs from "@/components/dashboard/routing-tabs"
import { AccountSecurity } from "@/components/dashboard/vault-security"
import { Badge } from "@/components/ui/badge"
import { useAppSelector } from "@/store"
import { selectUser } from "@/store/auth/auth-slice"

export function Component() {
	const user = useAppSelector(selectUser)

	return (
		<DashboardWrapper
			description="Manage your profile and how you sign in."
			title="Account"
		>
			<RoutingTabs />

			<section className="rounded-box border border-base-300 bg-base-100 p-5">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div>
						<h2 className="font-semibold">Profile</h2>
						<p className="mt-1 text-sm text-base-content/70">
							Your account identity and verification status.
						</p>
					</div>
					<Badge variant={user?.emailVerified ? "success" : "warning"}>
						{user?.emailVerified ? "Email verified" : "Email unverified"}
					</Badge>
				</div>

				<dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
					<div>
						<dt className="text-base-content/60">Name</dt>
						<dd className="mt-1 font-medium">{user?.name}</dd>
					</div>
					<div>
						<dt className="text-base-content/60">Email</dt>
						<dd className="mt-1 font-medium">{user?.email}</dd>
					</div>
				</dl>
			</section>

			<AccountSecurity />
		</DashboardWrapper>
	)
}
