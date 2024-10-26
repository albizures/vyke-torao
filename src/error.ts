export class InvalidSystemTypeError extends Error {
	constructor(type: unknown) {
		super(`Invalid system type: ${type}`)
	}
}

export function assert(check: unknown, message: string, ...data: Array<unknown>): asserts check {
	if (!check) {
		if (data.length > 0) {
			console.error(message, ...data)
		}
		throw new Error(message)
	}
}
