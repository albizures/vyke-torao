import type { Vec2D } from '../vec'
import { assertType, describe, expect, it } from 'vitest'
import { build, defineComponent } from './entity'

const Position = defineComponent('position', (values: Partial<Vec2D>) => {
	const { x = 0, y = 0 } = values

	return { x, y }
})

const Velocity = defineComponent('velocity', (values: Partial<Vec2D>) => {
	const { x = 0, y = 0 } = values

	return { x, y }
})

describe('defineComponent', () => {
	it('creates a component', () => {
		expect(Position).toHaveProperty('position')
		expect(Position.position({ x: 1 })).toEqual({ x: 1, y: 0 })
	})
})

describe('defineEntity', () => {
	it('creates an entity', () => {
		const entity = {
			...Position,
			...Velocity,
		}

		expect(entity).toEqual(expect.objectContaining({
			position: Position.position,
			velocity: Velocity.velocity,
		}))
	})

	it('creates an entity with values', () => {
		const entity = {
			...Position,
			...Velocity,
		}

		const result1 = build(entity, {
			position: { x: 1 },
			velocity: { y: 4 },
		})
		const result2 = build(entity, {
			position: { x: 1 },
		})

		expect(result1).toEqual({
			position: { x: 1, y: 0 },
			velocity: { x: 0, y: 4 },
		})
		assertType<{ position: Vec2D, velocity: Vec2D }>(result1)

		expect(result2).toEqual({
			position: { x: 1, y: 0 },
		})
		assertType<{ position: Vec2D }>(result2)
	})
})
