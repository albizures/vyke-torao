import type { Vec2d } from '../vec'
import { assertType, beforeEach, describe, expect, it } from 'vitest'
import { createWorld, defineEntity, defineQuery, identity, maybe } from './'

const entity = defineEntity({
	position(values: Partial<Vec2d>) {
		const { x = 0, y = 0 } = values

		return { x, y }
	},
	player: identity<true>(),
	enemy: identity<'boss' | 'minion'>(),
	buff: identity<{ type: 'speed' | 'damage' }>(),
})

const world = createWorld()
const { spawn, despawn, reset, update, select } = world

const allPlayers = defineQuery({
	id: 'all-players-test',
	with: [entity.position, entity.player, maybe(entity.buff)],
})

const allEnemies = defineQuery({
	id: 'query-test',
	with: [entity.position, entity.enemy, maybe(entity.buff)],
})

beforeEach(() => {
	reset()
})

describe('spawn', () => {
	it('should create an entity', () => {
		const entity = spawn('test', {})

		expect(entity).toEqual(expect.objectContaining({ }))
	})

	it('should add entity to world', () => {
		const entity = spawn('test', {})

		expect(world.entities).toContain(entity)
	})
})

describe('despawn', () => {
	it('should remove entity from world', () => {
		const entity = spawn('test', {})

		despawn(entity)

		expect(world.entities).not.toContain(entity)
	})
})

describe('querying', () => {
	it('should return entities with all components', () => {
		const player = spawn('player', { position: entity.position({ y: 20 }), player: true })
		const enemis = [
			spawn('enemy-1', { position: { x: 0, y: 0 }, enemy: 'boss' }),
			spawn('enemy-2', { position: { x: 10, y: 10 }, enemy: 'minion', buff: { type: 'speed' } }),
		]

		let enemisWithBuff = 0
		for (const item of select(allEnemies)) {
			assertType<{
				position: { x: number, y: number }
				enemy: 'boss' | 'minion'
				buff?: { type: 'speed' | 'damage' }
			}>(item)
			expect(enemis).include(item)
			expect(item.enemy).toStrictEqual(expect.stringMatching(/boss|minion/))

			if (item.buff) {
				enemisWithBuff += 1
			}
		}

		expect(enemisWithBuff).toBe(1)

		for (const entity of select(allPlayers)) {
			assertType<{
				position: { x: number, y: number }
				player: true
				buff?: { type: 'speed' | 'damage' }
			}>(entity)
			expect(entity.position).toEqual({ x: 0, y: 20 })
			expect(entity.player).toBe(true)
		}

		expect(allEnemies).not.toContain(player)
	})

	describe('when entity is despawned', () => {
		it('should update query results', () => {
			const player = spawn('player', { position: { x: 20, y: 20 }, player: true })
			const enemy = spawn('enemy', { position: { x: 0, y: 0 }, enemy: 'boss' })

			const allPlayerEntities = select(allPlayers)
			const allEnemiesEntities = select(allEnemies)

			expect(allPlayerEntities).toContain(player)
			expect(allEnemiesEntities).toContain(enemy)

			despawn(player)

			expect(allPlayerEntities).not.toContain(player)
			expect(allEnemiesEntities).toContain(enemy)
		})
	})

	describe('when entity is updated', () => {
		it('should update query results', () => {
			const player = spawn('player', { player: true })
			const enemy = spawn('enemy', { position: { x: 0, y: 0 }, enemy: 'boss' })

			const allPlayerEntities = select(allPlayers)
			const allEnemiesEntities = select(allEnemies)

			expect(allPlayerEntities).not.toContain(player)
			expect(allEnemiesEntities).toContain(enemy)

			update(player, 'position', { x: 10, y: 10 })

			expect(allPlayerEntities).toContain(player)
			expect(allEnemiesEntities).toContain(enemy)
		})
	})

	describe('when a where clause is given', () => {
		it('should filter entities', () => {
			const bossEnemy = spawn('enemy-1', { position: { x: 0, y: 0 }, enemy: 'boss' })
			const minionEnemy = spawn('enemy-2', { position: { x: 0, y: 0 }, enemy: 'minion' })

			const onlyBosses = defineQuery({
				id: 'only-bosses',
				with: [entity.enemy],
				where: (values) => values.enemy === 'boss',
			})

			const onlyBossesEntities = select(onlyBosses)

			expect(onlyBossesEntities).toContain(bossEnemy)
			expect(onlyBossesEntities).not.toContain(minionEnemy)
			expect(onlyBossesEntities.size()).toBe(1)
		})

		describe('when entity is updated', () => {
			it('should update query results', () => {
				const player = spawn('player', { position: { x: 20, y: 20 }, player: true })
				const bossEnemy = spawn('enemy-1', { position: { x: 0, y: 0 }, enemy: 'boss' })
				const minionEnemy = spawn('enemy-2', { position: { x: 0, y: 0 }, enemy: 'minion' })

				const farAwayEntities = defineQuery({
					id: 'far-way-entities',
					with: [entity.position],
					where: (values) => values.position.x > 10,
				})

				const onlyBosses = defineQuery({
					id: 'only-bosses',
					with: [entity.enemy],
					where: (values) => values.enemy === 'boss',
				})

				const farAwayEntitiesEntities = select(farAwayEntities)
				const onlyBossesEntities = select(onlyBosses)

				expect(farAwayEntitiesEntities.size()).toBe(1)
				expect(farAwayEntitiesEntities).toContain(player)

				expect(onlyBossesEntities.size()).toBe(1)
				expect(onlyBossesEntities).toContain(bossEnemy)

				update(player, 'position', { x: 5, y: 5 })
				update(minionEnemy, 'enemy', 'boss')

				expect(farAwayEntitiesEntities.size()).toBe(0)

				expect(onlyBossesEntities).toContain(bossEnemy)
				expect(onlyBossesEntities).toContain(minionEnemy)
				expect(onlyBossesEntities.size()).toBe(2)
			})

			describe('when deep property is updated', () => {
				it('should NOT update query results', () => {
					const player = spawn('player', { position: { x: 20, y: 20 }, player: true })

					const farAwayEntities = defineQuery({
						id: 'far-way-entities',
						with: [entity.position],
						where: (values) => values.position.x > 10,
					})

					const farAwayEntitiesEntities = select(farAwayEntities)

					expect(farAwayEntitiesEntities.size()).toBe(1)

					player.position!.x = 5

					expect(farAwayEntitiesEntities).toContain(player)
					expect(farAwayEntitiesEntities.size()).toBe(1)
				})
			})
		})
	})
})
