import { expect, it, vi } from 'vitest'
import { createLoop } from './loop'

it('should call the render function every frame', () => {
	const loop = createLoop()

	const render = vi.fn()
	const fixedUpdate = vi.fn()
	const update = vi.fn()
	const beforeFrame = vi.fn()
	const afterFrame = vi.fn()

	let timestamp = 0

	loop.frame({
		timestamp,
		fixedUpdate,
		update,
		render,
		beforeFrame,
		afterFrame,
	})

	expect(render).toHaveBeenCalled()
	expect(render).toHaveBeenLastCalledWith({
		deltaTime: 0,
		fps: 0,
	})

	expect(update).toHaveBeenCalled()
	expect(update).toHaveBeenLastCalledWith({
		deltaTime: 0,
		fps: 0,
	})

	expect(fixedUpdate).not.toHaveBeenCalled()

	timestamp = 100
	loop.frame({
		timestamp,
		fixedUpdate,
		update,
		render,
		beforeFrame,
		afterFrame,
	})

	expect(render).toHaveBeenCalled()
	expect(render).toHaveBeenLastCalledWith({
		deltaTime: 100,
		fps: 0,
	})

	expect(update).toHaveBeenCalled()
	expect(update).toHaveBeenLastCalledWith({
		deltaTime: 100,
		fps: 0,
	})

	expect(fixedUpdate).toHaveBeenCalledTimes(5)
	expect(fixedUpdate).toHaveBeenLastCalledWith({
		deltaTime: 100,
		fps: 0,
	})
})
