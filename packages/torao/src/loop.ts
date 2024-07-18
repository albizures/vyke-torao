type StartArgs = {
	update: () => void
	render: () => void
}

export type Loop = {
	readonly tickRate: number
	readonly isRunning: boolean
	start: (args: StartArgs) => void
	stop: () => void
}

export function createLoop(tickRate: number): Loop {
	let isRunnig = false
	/**
	 * this is the slice of time that we will use to update the game
	 */
	let slice = 1000 / tickRate
	return {
		tickRate,
		get isRunning() {
			return isRunnig
		},
		/**
		 * start the game loop
		 * it will call the update function every defined tickRate
		 * and the render function every frame
		 */
		start: (args: StartArgs) => {
			const { update, render } = args
			let lastTime = 0
			let accumulator = 0
			isRunnig = true

			const loop = (now: number) => {
				if (!isRunnig) {
					return
				}

				const deltaTime = now - lastTime
				lastTime = now
				accumulator += deltaTime

				while (accumulator >= slice) {
					// this will ensure the update function is called
					// the correct amount of times regardless of the frame rate
					update()
					accumulator -= slice
				}

				render()

				requestAnimationFrame(loop)
			}

			requestAnimationFrame((now) => {
				lastTime = now
				requestAnimationFrame(loop)
			})
		},
		stop: () => {
			isRunnig = false
		},
	}
}
