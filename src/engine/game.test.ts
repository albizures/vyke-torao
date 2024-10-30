import { describe, expect, it, vi } from 'vitest'
import { noop } from '../types'
import { Canvas } from './canvas'
import { createDirector } from './director'
import { createGame } from './game'
import { createStepRunner } from './loop'

const entity = {}

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
			entity,
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
			entity,
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
			canvas,
			runner,
			director,
			entity,
		})

		const enter = vi.fn()
		const scene = game.scene('test', {
			enter,
		})

		game.start('test')

		expect(director.currentScene).toBe(scene)
		expect(enter).toHaveBeenCalled()
	})
})
