import { describe, expect, it, vi } from 'vitest'
import { Canvas } from './canvas'
import { createWorld, type Entity } from './ecs/world'
import { createGame, type SceneContext, start } from './game'
import { createStepRunner } from './loop'

type MyEntity = Entity

const world = createWorld<MyEntity>()

const canvas: Canvas = new Canvas(
	{} as unknown as HTMLCanvasElement,
	() => {
		return () => {}
	},
	{ x: 100, y: 100 },
)

describe('createGame', () => {
	it('should create create a game', () => {
		const { game, createScene } = createGame<MyEntity>({
			canvas,
		})

		expect(game).toBeDefined()
		expect(createScene).toBeDefined()
	})

	it('should create a scene', () => {
		const { game, createScene } = createGame({
			canvas,
		})

		const scene = createScene({
			id: 'test',
			world,
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
		})

		const startup = vi.fn(() => {})
		const scene = createScene({
			id: 'test',
			world,
			startup,
		})

		await start(game, scene, runner)

		expect(game.currentScene).toBe(scene)
		expect(startup).toHaveBeenCalled()
	})

	it('should build the scene', async () => {
		const runner = createStepRunner()

		const { game, createScene } = createGame<MyEntity>({
			canvas,
		})

		let entity: MyEntity
		const startup = vi.fn((context: SceneContext<MyEntity>) => {
			const { spawn } = context
			entity = spawn('player', {})
		})

		const scene = createScene({
			id: 'test',
			world,
			startup,
		})

		await start(game, scene, runner)

		expect(startup).toHaveBeenCalled()
		expect(scene.world.entities.has(entity!)).toBe(true)
	})
})
