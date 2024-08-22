export type LoopValues = {
	deltaTime: number
	fps: number
}
export type LoopFns = {
	beforeFrame: (args: LoopValues) => void
	afterFrame: (args: LoopValues) => void
	fixedUpdate: (args: LoopValues) => void
	update: (args: LoopValues) => void
	render: (args: LoopValues) => void
}

type FrameArgs = LoopFns & {
	timestamp: number
}

export type Loop = {
	readonly tickRate: number
	frame: (args: FrameArgs) => void
}

type LoopArgs = {
	tickRate?: number
}

export function createLoop(args?: LoopArgs): Loop {
	const { tickRate = 50 } = args ?? {}
	/**
	 * this is the slice of time that we will run in fixed updates
	 */
	let slice = 1000 / tickRate
	let lastTime = 0
	let accumulator = 0

	const fnArgs: LoopValues = {
		deltaTime: 0,
		fps: 0,
	}
	return {
		tickRate,
		/**
		 * it will call the fixedUpdate function every defined tickRate
		 * and the render and update function every frame
		 */
		frame(args: FrameArgs) {
			const { timestamp, fixedUpdate, update, render } = args

			const deltaTime = timestamp - lastTime
			const fps = Math.round(1 / (1000 / deltaTime))
			lastTime = timestamp
			accumulator += deltaTime

			while (accumulator >= slice) {
				fnArgs.deltaTime = slice
				fixedUpdate(fnArgs)
				accumulator -= slice
			}

			fnArgs.deltaTime = deltaTime
			fnArgs.fps = fps

			update(fnArgs)
			render(fnArgs)
		},
	}
}

type StartArgs = LoopFns

export type LoopRunner = {
	start: (args: StartArgs) => void
	stop: () => void
}

export function createRequestAnimationFrameLoopRunner(loop: Loop): LoopRunner {
	let id: number
	let isRunning = false

	return {
		start: (args: StartArgs) => {
			const { fixedUpdate, update, render, beforeFrame, afterFrame } = args
			const frameArgs: FrameArgs = {
				fixedUpdate,
				update,
				render,
				beforeFrame,
				afterFrame,
				timestamp: 0,
			}

			function tick(timestamp: number) {
				if (isRunning) {
					frameArgs.timestamp = timestamp
					loop.frame(frameArgs)
					id = requestAnimationFrame(tick)
				}
			}

			isRunning = true
			id = requestAnimationFrame(tick)
		},
		stop: () => {
			isRunning = false
			if (id) {
				cancelAnimationFrame(id)
			}
		},
	}
}
