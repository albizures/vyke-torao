import { describe, expect, it, vi } from 'vitest'
import {
	compute,
	createComponent,
	createEntity,
	createQuery,
	createSystem,
	type Entity,
	entryFrom,
	first,
	required,
	type SystemFnArgs,
	SystemType,
} from './'

const Position = createComponent({
	id: 'position',
	create(args: { x: number, y: number }) {
		return args
	},
})

const Enemy = createComponent({
	id: 'enemy',
	create() {
		return {}
	},
})

function createTest() {
	const player = createEntity({
		id: 'player',
		components: [
			entryFrom(Position, { x: 0, y: 0 }),
		],
	})

	const enemies = [
		createEntity({
			id: 'enemy 1',
			components: [
				entryFrom(Position, { x: 0, y: 0 }),
				entryFrom(Enemy, {}),
			],
		}),
		createEntity({
			id: 'enemy 2',
			components: [
				entryFrom(Position, { x: 0, y: 0 }),
				entryFrom(Enemy, {}),
			],
		}),
	]

	type Values = {
		player: {
			entity: Entity
			values: { position: { x: number, y: number } }
		}
		enemies: Array<{
			entity: Entity
			values: { position: { x: number, y: number } }
		}>
	}
	const fn = vi.fn((args: SystemFnArgs<Values>) => {
		args.spawn({ id: 'test', components: [] })
	})
	const system = createSystem({
		id: 'follow-player',
		type: SystemType.Update,
		queries: {
			player: first(required(createQuery({
				id: 'query-test',
				params: {
					position: Position,
				},
			}))),
			enemies: required(createQuery({
				id: 'query-test',
				params: {
					position: Position,
					enemy: Enemy,
				},
			})),
		},
		fn,
	})

	const runArgs = {
		spawn: vi.fn(),
	}

	return {
		player,
		runArgs,
		enemies,
		fn,
		system,
	}
}

describe('when no entities are given', () => {
	it('should not run', () => {
		const { system, fn: update, runArgs } = createTest()
		system.run(runArgs)

		expect(update).not.toHaveBeenCalled()
	})
})

describe('when entities match', () => {
	it('should run', () => {
		const { system, fn: update, player, enemies, runArgs } = createTest()

		for (const query of system.queries) {
			compute(query, [player, ...enemies])
		}

		system.run(runArgs)

		expect(update).toHaveBeenCalledTimes(1)
		expect(update).toHaveBeenCalledWith(expect.objectContaining({
			entities: expect.objectContaining({
				player: expect.objectContaining({
					entity: player,
					values: expect.objectContaining({
						position: expect.objectContaining({ x: 0, y: 0 }),
					}),
				}),
				enemies: expect.arrayContaining([
					expect.objectContaining({
						entity: expect.any(Object),
						values: expect.objectContaining({
							position: expect.objectContaining({ x: 0, y: 0 }),
						}),
					}),
				]),
			}),
		}))
	})
})

describe('when not queries are given', () => {
	it('should run', () => {
		const fn = vi.fn()

		const system = createSystem({
			id: 'follow-player',
			type: SystemType.Update,
			fn,
		})

		system.run({
			spawn: vi.fn(),
		})

		expect(system.queries).toHaveLength(0)
		expect(fn).toHaveBeenCalledTimes(1)
		expect(fn).toHaveBeenCalledWith(expect.objectContaining({
			entities: {},
		}))
	})
})

it('should provide a spawn function', () => {
	const { system, runArgs, player, enemies } = createTest()

	for (const query of system.queries) {
		compute(query, [player, ...enemies])
	}

	system.run(runArgs)

	expect(runArgs.spawn).toHaveBeenCalledTimes(1)
	expect(runArgs.spawn).toHaveBeenCalledWith(expect.any(Object))
})
