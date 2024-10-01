import type { Vec2D } from '../vec'
import { assertType, describe, expect, it } from 'vitest'
import { defineComponent, defineEntity } from './entity'

const position = defineComponent('position', (values: Partial<Vec2D>) => {
	const { x = 0, y = 0 } = values

	return { x, y }
})

const velocity = defineComponent('velocity', (values: Partial<Vec2D>) => {
	const { x = 0, y = 0 } = values

	return { x, y }
})

describe('defineComponent', () => {
	it('creates a component', () => {
		const component = defineComponent('position', (values: Partial<Vec2D>) => {
			const { x = 0, y = 0 } = values

			return { x, y }
		})

		expect(component.name).toEqual('position')
		expect(component.creator({ x: 1 })).toEqual({ x: 1, y: 0 })
	})
})

describe('defineEntity', () => {
	it('creates an entity', () => {
		const entity = defineEntity()
			.add(position)
			.add(velocity)
			.get()

		expect(entity.components.position).toEqual(expect.objectContaining({
			name: 'position',
			creator: expect.any(Function),
		}))
		expect(entity.components.velocity).toEqual(expect.objectContaining({
			name: 'velocity',
			creator: expect.any(Function),
		}))
	})

	it('creates an entity with values', () => {
		const entity = defineEntity()
			.add(position)
			.add(velocity)
			.get()

		const result1 = entity.build({
			position: { x: 1 },
			velocity: { y: 4 },
		})
		const result2 = entity.build({
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
