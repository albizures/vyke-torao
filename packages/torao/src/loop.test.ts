import { expect, it, vi } from 'vitest'
import { createLoop } from './loop'

it('should call the render function every frame', () => {
	const loop = createLoop()

	const render = vi.fn()
	const fixedUpdate = vi.fn()
	const update = vi.fn()

	let timestamp = 0

	loop.frame({
		timestamp,
		fixedUpdate,
		update,
		render,
	})

	expect(render).toHaveBeenCalled()
	expect(render).toHaveBeenLastCalledWith(0, 0)

	expect(update).toHaveBeenCalled()
	expect(update).toHaveBeenLastCalledWith(0)

	expect(fixedUpdate).not.toHaveBeenCalled()

	timestamp = 100
	loop.frame({
		timestamp,
		fixedUpdate,
		update,
		render,
	})

	expect(render).toHaveBeenCalled()
	expect(render).toHaveBeenLastCalledWith(0, 100)

	expect(update).toHaveBeenCalled()
	expect(update).toHaveBeenLastCalledWith(100)

	expect(fixedUpdate).toHaveBeenCalledTimes(5)
	expect(fixedUpdate).toHaveBeenLastCalledWith(20)
})
