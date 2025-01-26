import { describe, expect, it, vi } from 'vitest'

import { createDirector } from './director'
import { createGame } from './game'
import { createStepRunner } from './loop'

describe('createGame', () => {
	it('should create create a game', () => {
		const director = createDirector()
		const game = createGame({
			director,
		})

		expect(game).toBeDefined()
		expect(game.start).toBeDefined()
	})

	it('should create a scene', () => {
		const director = createDirector<{
			test: never
		}>()
		const game = createGame({
			director,
		})

		const scene = game.scene('test', {
			enter: vi.fn(),
		})

		director.setScene('test', scene)

		expect(scene).toBeDefined()
		expect(director.scenes.test).toBe(scene)
	})
})

describe('start', () => {
	it('should start the game', async () => {
		const runner = createStepRunner()
		const director = createDirector<{
			test: never
		}>()

		const game = createGame({
			runner,
			director,
		})

		const enter = vi.fn()
		const scene = game.scene('test', {
			enter,
		})

		game.start('test')

		expect(director.currentScene).toBe(scene)
		expect(enter).toHaveBeenCalled()
	})

	it('should run the plugin', () => {
		const runner = createStepRunner()
		const director = createDirector<{
			test: never
		}>()
		const beforeStart = vi.fn()

		const game = createGame({
			runner,
			director,
			plugins: [
				{
					beforeStart,
				},
			],
		})

		const enter = vi.fn()
		game.scene('test', {
			enter,
		})

		game.start('test')

		expect(beforeStart).toHaveBeenCalled()
	})
})
