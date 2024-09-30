import type { Entity } from './ecs'
import { describe, expect, it, vi } from 'vitest'
import { Canvas } from './canvas'
import { type Assets, createGame, type SceneContext, SceneStatus, start, type Textures } from './game'
import { createStepRunner } from './loop'

type MyEntity = Entity

const canvas: Canvas = new Canvas(
	{} as unknown as HTMLCanvasElement,
	() => {
		return () => {}
	},
	{ x: 100, y: 100 },
)

describe('createGame', () => {
	it('should create create a game', () => {
		const { game, createScene } = createGame<MyEntity, Assets, Textures>({
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

		const { game, createScene } = createGame<MyEntity, Assets, Textures>({
			canvas,
			assets: {},
		})

		let entity: MyEntity
		const builder = vi.fn((context: SceneContext<MyEntity, Assets, Textures>) => {
			const { spawn } = context
			entity = spawn('player', {})

			return {
				systems: [],
			}
		})

		const scene = createScene('test', builder)

		await start(game, scene, runner)

		expect(builder).toHaveBeenCalled()
		expect(scene.status).toBe(SceneStatus.Running)
		expect(scene.world.entities.has(entity!)).toBe(true)
	})
})
