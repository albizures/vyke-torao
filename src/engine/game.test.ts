import { describe, expect, it, vi } from 'vitest'
import { createGame } from './game'
import { createStepRunner } from './loop'

describe('createGame', () => {
	it('should create a game', () => {
		const game = createGame()

		expect(game).toBeDefined()
		expect(game.start).toBeDefined()
	})

	it('should create a scene', () => {
		const game = createGame()

		const scene = game.scene('test', {
			enter: vi.fn(),
		})

		expect(scene).toBeDefined()
	})
})

describe('start', () => {
	it('should start the game', async () => {
		const runner = createStepRunner()

		const game = createGame({
			runner,
		})

		const enter = vi.fn()
		const scene = game.scene('test', {
			enter,
		})

		game.start('test')

		expect(game.currentScene).toBe(scene.id)
		expect(enter).toHaveBeenCalled()
	})

	it('should run the plugin', () => {
		const runner = createStepRunner()
		const beforeStart = vi.fn()

		const game = createGame({
			runner,
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
