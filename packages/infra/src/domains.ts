import {
	PRODUCTION_API_HOST,
	PRODUCTION_STAGE,
	PRODUCTION_WEB_HOST,
	STAGING_API_HOST,
	STAGING_STAGE,
	STAGING_WEB_HOST,
	ZONE_HOST
} from "./constants"

export type WorkerDomain = { name: string; zoneName: string }

export function limitNamespace(stage: string, offset: number) {
	return (stage === PRODUCTION_STAGE ? 1000 : 2000) + offset
}

export function apiWorkerDomain(stage: string): WorkerDomain | undefined {
	if (stage === PRODUCTION_STAGE) {
		return { name: PRODUCTION_API_HOST, zoneName: ZONE_HOST }
	}
	if (stage === STAGING_STAGE) {
		return { name: STAGING_API_HOST, zoneName: ZONE_HOST }
	}
	return undefined
}

export function webWorkerDomain(stage: string): WorkerDomain | undefined {
	if (stage === PRODUCTION_STAGE) {
		return { name: PRODUCTION_WEB_HOST, zoneName: ZONE_HOST }
	}
	if (stage === STAGING_STAGE) {
		return { name: STAGING_WEB_HOST, zoneName: ZONE_HOST }
	}
	return undefined
}
