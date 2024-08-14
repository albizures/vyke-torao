import { describe, expect, it, vi } from 'vitest'
import { Transform } from '../components'
import { createSystem } from './system'
import { createQuery } from './query'
import { createEntity } from './entity'
import { createComponentTag } from './tag'

function createTest() {
	const Enemy = createComponentTag('enemy')
	const player = createEntity({
		label: 'player',
		components: [
			Transform.entryFrom({ position: { x: 0, y: 0 } }),
		],
	})

	const enemies = [
		createEntity({
			label: 'enemy 1',
			components: [
				[Transform, Transform.create({ position: { x: 0, y: 0 } })],
				[Enemy, Enemy.create()],
			],
		}),
		createEntity({
			label: 'enemy 2',
			components: [
				Transform.entryFrom({ position: { x: 0, y: 0 } }),
				Enemy.entryFrom(),
			],
		}),
	]

	const update = vi.fn()
	const system = createSystem({
		label: 'follow-player',
		queries: {
			player: createQuery({
				label: 'query-test',
				params: {
					transform: Transform,
				},
			}).required().first(),
			enemies: createQuery({
				label: 'query-test',
				params: {
					transform: Transform,
					enemy: Enemy,
				},
			}),
		},
		update,
	})

	return {
		player,
		enemies,
		update,
		system,
	}
}

describe('when no entities are given', () => {
	it('should not run', () => {
		const { system, update } = createTest()
		system.run()

		expect(update).not.toHaveBeenCalled()
	})
})

describe('when entities match', () => {
	it('should run', () => {
		const { system, update, player, enemies } = createTest()

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
