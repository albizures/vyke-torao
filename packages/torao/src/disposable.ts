/* eslint-disable ts/consistent-type-definitions */
export interface Disposable {
	// for public use
	isDisposed?: boolean
	dispose?: () => void
}

export function createDisposableBox() {
	const disposables = new Map<Disposable, boolean>()

	return {
		register<TDisposable extends Disposable>(disposable: TDisposable) {
			const isDisposed = disposables.get(disposable) ?? false
			if (!isDisposed) {
				disposables.set(disposable, false)
			}

			return disposable
		},
		dispose() {
			for (const [disposable, isDisposed] of disposables) {
				if (isDisposed) {
					disposables.delete(disposable)
				}
				else {
					disposable.dispose?.()
					disposables.delete(disposable)
				}
			}
		},
	}
}

export const disposableBox = createDisposableBox()
