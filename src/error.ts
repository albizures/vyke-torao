export class InvalidSystemTypeError extends Error {
	constructor(type: unknown) {
		super(`Invalid system type: ${type}`)
	}
}
