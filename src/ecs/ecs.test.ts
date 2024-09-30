import { assertType, beforeEach, describe, expect, it } from 'vitest'
import {	createQuery, createWorld } from './'

type Position = { position: { x: number, y: number } }
type Player = { player: true }
type Enemy = { enemy: 'boss' | 'minion' }

type Components = Partial<Position & Player & Enemy>

const world = createWorld<Components>()
const { spawn, despawn, reset, update, select, registerQuery } = world

const allPlayers = createQuery<Position & Player>({
	id: 'query-test',
	with: ['position', 'player'],
})

const allEnemies = createQuery<Position & Enemy>({
	id: 'query-test',
	with: ['position', 'enemy'],
})

registerQuery(allPlayers)
registerQuery(allEnemies)

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
		const player = spawn('player', { position: { x: 20, y: 20 }, player: true })
		const enemis = [
			spawn('enemy-1', { position: { x: 0, y: 0 }, enemy: 'boss' }),
			spawn('enemy-2', { position: { x: 10, y: 10 }, enemy: 'minion' }),
		]

		for (const item of select(allEnemies)) {
			assertType<{
				position: { x: number, y: number }
				enemy: 'boss' | 'minion'
			}>(item)
			expect(enemis).include(item)
			expect(item.enemy).toStrictEqual(expect.stringMatching(/boss|minion/))
		}

		for (const entity of select(allPlayers)) {
			assertType<{
				position: { x: number, y: number }
				player: true
			}>(entity)
			expect(entity.position).toEqual({ x: 20, y: 20 })
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

			const onlyBosses = createQuery<Components>({
				id: 'only-bosses',
				with: ['enemy'],
				where: (values) => values.enemy === 'boss',
			})

			registerQuery(onlyBosses)

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

				const farAwayEntities = createQuery<Position>({
					id: 'far-way-entities',
					with: ['position'],
					where: (values) => values.position.x > 10,
				})

				const onlyBosses = createQuery<Components>({
					id: 'only-bosses',
					with: ['enemy'],
					where: (values) => values.enemy === 'boss',
				})

				registerQuery(farAwayEntities)
				registerQuery(onlyBosses)

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

					const farAwayEntities = createQuery<Position>({
						id: 'far-way-entities',
						with: ['position'],
						where: (values) => values.position.x > 10,
					})

					registerQuery(farAwayEntities)

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
