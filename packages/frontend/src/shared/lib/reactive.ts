// The two-level version counter; every nested write is attributed to the ROOT store field it belongs to, so a poll writing S.agentActivity re-renders only the components subscribed to that field.
// Wrappers are cached per target (WeakMap), so the same nested object always yields the same proxy - React memo and @pierre's element-identity checks stay stable across reads.
// The Proxy handlers wrap unknowns by design (that is the seam), so the type assertions here are the wrap/unwrap boundary, lint-exempted in oxlint.config.ts.

let storeVersion = 0
const listeners = new Set<() => void>()
const fieldVersions = new Map<string, number>()
const fieldListeners = new Map<string, Set<() => void>>()

const ROOT = '__store__'

export function getStoreVersion(): number {
	return storeVersion
}

export function getFieldVersion(field: string): number {
	return fieldVersions.get(field) ?? 0
}

function bumpVersion(field: string): void {
	storeVersion += 1
	fieldVersions.set(field, (fieldVersions.get(field) ?? 0) + 1)
	for (const listener of listeners) listener()
	const subscribed = fieldListeners.get(field)
	if (subscribed) for (const listener of subscribed) listener()
}

export function subscribeStore(listener: () => void): () => void {
	listeners.add(listener)
	return () => listeners.delete(listener)
}

export function subscribeStoreFields(
	fields: string[],
	listener: () => void,
): () => void {
	const unsubs = fields.map(field => subscribeStoreField(field, listener))
	return () => unsubs.forEach(unsub => unsub())
}

export function subscribeStoreField(
	field: string,
	listener: () => void,
): () => void {
	let subscribed = fieldListeners.get(field)
	if (!subscribed) {
		subscribed = new Set()
		fieldListeners.set(field, subscribed)
	}
	subscribed.add(listener)
	return () => subscribed.delete(listener)
}

// Array iteration methods on a store proxy bind to the RAW target (identity rule), so a nested write on their elements - e.g. flipping comment.status - misses the proxy set handler and never bumps.
// Mutation sites call this after writing so the React chrome repaints.
export function notifyStateMutation(): void {
	bumpVersion('state')
}

type UnknownFn = (...args: unknown[]) => unknown

const wrapperCache = new WeakMap<object, object>()
const proxies = new WeakSet()
const rootFields = new WeakMap<object, string>()

const mutatingCollectionMethods = new Set([
	'add',
	'delete',
	'clear',
	'set',
	'push',
	'pop',
	'shift',
	'unshift',
	'splice',
	'sort',
	'reverse',
	'fill',
])

// Raw targets become their cached wrappers; functions stay bound to their raw object (wrapping a function would break its `this`).
function readValue(member: unknown, thisArg: object, field: string): unknown {
	if (typeof member === 'function') return (member as UnknownFn).bind(thisArg)
	return wrapValue(member, field)
}

function bumpingCall(
	method: UnknownFn,
	thisArg: object,
	field: string,
): UnknownFn {
	return (...args: unknown[]) => {
		const outcome = Reflect.apply(method, thisArg, args.map(unwrap))
		bumpVersion(field)
		return outcome
	}
}

function wrapValue(candidate: unknown, field: string): unknown {
	if (typeof candidate !== 'object' || candidate === null) return candidate
	const cached = wrapperCache.get(candidate)
	if (cached) return cached
	let proxy: object
	if (Array.isArray(candidate)) {
		proxy = new Proxy(candidate, arrayHandler)
	} else if (candidate instanceof Set || candidate instanceof Map) {
		proxy = new Proxy(candidate, collectionHandler)
	} else {
		proxy = new Proxy(candidate, objectHandler)
	}
	wrapperCache.set(candidate, proxy)
	rootFields.set(candidate, field)
	proxies.add(proxy)
	return proxy
}

// A write of an already-wrapped value stores the raw target, so identity comparisons inside the store never hit proxies.
function unwrap(candidate: unknown): unknown {
	if (typeof candidate !== 'object' || candidate === null) return candidate
	const raw = wrapperCache.get(candidate)
	if (raw) return raw
	return candidate
}

const objectHandler: ProxyHandler<object> = {
	get(target, key, receiver) {
		if (key === '__isStoreProxy') return true
		const field =
			rootFields.get(target) === ROOT
				? String(key)
				: (rootFields.get(target) ?? ROOT)
		return readValue(Reflect.get(target, key, receiver), target, field)
	},
	set(target, key, written) {
		const previous = Reflect.get(target, key)
		const next = unwrap(written)
		const changed = !Object.is(previous, next)
		const accepted = Reflect.set(target, key, next)
		if (changed && accepted) {
			bumpVersion(
				rootFields.get(target) === ROOT
					? String(key)
					: (rootFields.get(target) as string),
			)
		}
		return accepted
	},
	deleteProperty(target, key) {
		const existed = Reflect.has(target, key)
		const accepted = Reflect.deleteProperty(target, key)
		if (existed && accepted) {
			bumpVersion(
				rootFields.get(target) === ROOT
					? String(key)
					: (rootFields.get(target) as string),
			)
		}
		return accepted
	},
}

const arrayHandler: ProxyHandler<unknown[]> = {
	...objectHandler,
	get(target, key, receiver) {
		const member = Reflect.get(target, key, receiver)
		if (typeof member !== 'function')
			return wrapValue(member, rootFields.get(target) ?? ROOT)
		if (!mutatingCollectionMethods.has(String(key))) {
			return (member as UnknownFn).bind(target)
		}
		return bumpingCall(
			member as UnknownFn,
			target,
			rootFields.get(target) ?? ROOT,
		)
	},
}

const collectionHandler: ProxyHandler<Set<unknown> | Map<unknown, unknown>> = {
	...objectHandler,
	get(target, key, receiver) {
		const member = Reflect.get(target, key, receiver)
		if (typeof member !== 'function')
			return wrapValue(member, rootFields.get(target) ?? ROOT)
		if (!mutatingCollectionMethods.has(String(key))) {
			return (member as UnknownFn).bind(target)
		}
		return bumpingCall(
			member as UnknownFn,
			target,
			rootFields.get(target) ?? ROOT,
		)
	},
}

export function reactive<T extends object>(target: T): T {
	const proxy = wrapValue(target, ROOT) as T
	return proxy
}

export function isStoreProxy(candidate: unknown): boolean {
	return (
		typeof candidate === 'object' &&
		candidate !== null &&
		proxies.has(candidate)
	)
}
