import type { SystemContext } from './ecs'
import type { AnyEntity } from './ecs/entity'
import { describe, expect, it, vi } from 'vitest'
import { Canvas } from './canvas'
import { createWorld } from './ecs/world'
import { createGame, start } from './game'
import { createStepRunner } from './loop'
import { noop } from './types'

type MyEntity = AnyEntity

const world = createWorld<MyEntity>()

const canvas: Canvas = new Canvas(
	{} as unknown as HTMLCanvasElement,
	() => {
		return noop
	},
	{ x: 100, y: 100 },
)

describe('createGame', () => {
	it('should create create a game', () => {
		const { game, createScene } = createGame({
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

		const startup = vi.fn()
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

		const { game, createScene } = createGame({
			canvas,
		})

		let entity: MyEntity
		const startup = vi.fn((context: SystemContext<MyEntity>) => {
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
