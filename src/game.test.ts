import type { Canvas } from './canvas'
import { describe, expect, it, vi } from 'vitest'
import { createGame, SceneStatus, start } from './alt'
import { createEntity } from './ecs'
import { createStepRunner } from './loop'

const canvas: Canvas = {
	element: {} as unknown as HTMLCanvasElement,
	size: { x: 100, y: 100 },
	onResize: () => {
		return () => {}
	},
}

describe('createGame', () => {
	it('should create create a game', () => {
		const { game, createScene } = createGame({
			canvas,
			assets: {},
		})

		expect(game).toBeDefined()
		expect(createScene).toBeDefined()
	})

	it('should create a scene', () => {
		const { game, createScene } = createGame({
			canvas,
			assets: {},
		})

		const scene = createScene('test', () => {
			return {}
		})

		expect(scene).toBeDefined()
		expect(game.scenes).includes(scene)
	})
})

describe('start', () => {
	it('should start the game', async () => {
		const runner = createStepRunner()

		const { game, createScene } = createGame({
			canvas,
			assets: {},
		})

		const builder = vi.fn(() => {
			return {}
		})
		const scene = createScene('test', builder)

		await start(game, scene, runner)

		expect(game.currentScene).toBe(scene)
		expect(builder).toHaveBeenCalled()
	})

	it('should build the scene', async () => {
		const runner = createStepRunner()

		const { game, createScene } = createGame({
			canvas,
			assets: {},
		})

		const entity = createEntity({
			id: 'player',
			components: [],
		})

		const builder = vi.fn(() => {
			return {
				entities: [
					entity,
				],
			}
		})

		const scene = createScene('test', builder)

		await start(game, scene, runner)

		expect(builder).toHaveBeenCalled()
		expect(scene.status).toBe(SceneStatus.Running)
		expect(scene.entities).includes(entity)
	})
})
