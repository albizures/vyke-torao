export type LoopValues = {
	deltaTime: number
	fps: number
}
type LoopFns = {
	beforeFrame: (args: LoopValues) => void
	afterFrame: (args: LoopValues) => void
	fixedUpdate: (args: LoopValues) => void
	update: (args: LoopValues) => void
	render: (args: LoopValues) => void
}

type FrameArgs = LoopFns & {
	timestamp: number
}

type Loop = {
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
	const slice = 1000 / tickRate
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
			const { timestamp, fixedUpdate, update, render, beforeFrame, afterFrame } = args

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

			beforeFrame(fnArgs)
			update(fnArgs)
			render(fnArgs)
			afterFrame(fnArgs)
		},
	}
}

type StartArgs = LoopFns

export type Runner = {
	start: (args: StartArgs) => void
	stop: () => void
}

export function createRequestAnimationFrameRunner(loop: Loop = createLoop()): Runner {
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

type StepRunner = Runner & {
	nextStep: (time: number) => void
}

export function createStepRunner(loop: Loop = createLoop()): StepRunner {
	let timestamp = 0
	let frameArgs: FrameArgs = {
		timestamp: 0,
		fixedUpdate: () => {},
		update: () => {},
		render: () => {},
		beforeFrame: () => {},
		afterFrame: () => {},
	}

	function tick() {
		frameArgs.timestamp = timestamp
		loop.frame(frameArgs)
	}

	return {
		start: (args: StartArgs) => {
			const { fixedUpdate, update, render, beforeFrame, afterFrame } = args

			frameArgs = {
				fixedUpdate,
				update,
				render,
				beforeFrame,
				afterFrame,
				timestamp: 0,
			}
		},
		stop: () => {
			timestamp = 0
		},
		nextStep: (time: number) => {
			timestamp += time

			tick()
		},
	}
}
