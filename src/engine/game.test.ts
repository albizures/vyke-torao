import { describe, expect, it, vi } from 'vitest'
import { Canvas } from '../canvas'
import { noop } from '../types'
import { createDirector } from './director'
import { createGame } from './game'
import { createStepRunner } from './loop'
import { createScene } from './scene'

const canvas: Canvas = new Canvas(
	{} as unknown as HTMLCanvasElement,
	() => {
		return noop
	},
	{ x: 100, y: 100 },
)

describe('createGame', () => {
	it('should create create a game', () => {
		const director = createDirector()
		const game = createGame({
			canvas,
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
			canvas,
			director,
		})

		const scene = createScene({
			enter: vi.fn(),
		})

		director.setScene('test', scene)

		expect(scene).toBeDefined()
		expect(game.scenes.test).toBe(scene)
	})
})

describe('start', () => {
	it('should start the game', async () => {
		const runner = createStepRunner()
		const director = createDirector<{
			test: never
		}>()

		const game = createGame({
			canvas,
			runner,
			director,
		})

		const enter = vi.fn()
		const scene = createScene({
			enter,
		})

		director.setScene('test', scene)
		game.start('test')

		expect(director.currentScene).toBe(scene)
		expect(enter).toHaveBeenCalled()
	})
})
