import { describe, expect, it, vi } from 'vitest'
import { Transform } from '../components'
import { createEntity } from './entity'
import { createQuery } from './query'
import { createSystem, SystemType } from './system'
import { createComponentTag } from './tag'

function createTest() {
	const Enemy = createComponentTag('enemy')
	const player = createEntity({
		id: 'player',
		components: [
			Transform.entryFrom({ position: { x: 0, y: 0 } }),
		],
	})

	const enemies = [
		createEntity({
			id: 'enemy 1',
			components: [
				[Transform, Transform.create({ position: { x: 0, y: 0 } })],
				[Enemy, Enemy.create()],
			],
		}),
		createEntity({
			id: 'enemy 2',
			components: [
				Transform.entryFrom({ position: { x: 0, y: 0 } }),
				Enemy.entryFrom(),
			],
		}),
	]

	const fn = vi.fn()
	const system = createSystem({
		id: 'follow-player',
		type: SystemType.Update,
		queries: {
			player: createQuery({
				id: 'query-test',
				params: {
					transform: Transform,
				},
			}).required().first(),
			enemies: createQuery({
				id: 'query-test',
				params: {
					transform: Transform,
					enemy: Enemy,
				},
			}),
		},
		fn,
	})

	return {
		player,
		enemies,
		fn,
		system,
	}
}

describe('when no entities are given', () => {
	it('should not run', () => {
		const { system, fn: update } = createTest()
		system.run()

		expect(update).not.toHaveBeenCalled()
	})
})

describe('when entities match', () => {
	it('should run', () => {
		const { system, fn: update, player, enemies } = createTest()

		for (const query of system.queries) {
			query.compute([player, ...enemies])
		}

		system.run()

		expect(update).toHaveBeenCalledTimes(1)
		expect(update).toHaveBeenCalledWith(expect.objectContaining({
			entities: expect.objectContaining({
				player: expect.objectContaining({
					entity: player,
					values: expect.objectContaining({
						transform: expect.objectContaining({
							position: { x: 0, y: 0 },
							scale: { x: 1, y: 1 },
							angle: 0,
						}),
					}),
				}),
				enemies: expect.arrayContaining([
					expect.objectContaining({
						entity: expect.any(Object),
						values: expect.objectContaining({
							transform: expect.objectContaining({
								position: { x: 0, y: 0 },
								scale: { x: 1, y: 1 },
								angle: 0,
							}),
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

		system.run()

		expect(system.queries).toHaveLength(0)
		expect(fn).toHaveBeenCalledTimes(1)
		expect(fn).toHaveBeenCalledWith(expect.objectContaining({
			entities: {},
		}))
	})
})
