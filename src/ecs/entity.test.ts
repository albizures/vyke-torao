import type { Vec2d } from '../vec'
import { assertType, describe, expect, it } from 'vitest'
import { vec2d } from '../vec'
import { defineEntity } from './entity'

describe('defineEntity', () => {
	it('creates an entity', () => {
		const entity = defineEntity({
			position: vec2d.complete.bind(null),
			velocity: vec2d.complete.bind(null),
		})

		expect(entity).toEqual(expect.objectContaining({
			position: expect.any(Function),
			velocity: expect.any(Function),
		}))
	})

	it('creates an entity with values', () => {
		const entity = defineEntity({
			position: vec2d.complete.bind(null),
			velocity: vec2d.complete.bind(null),
		})

		const result1 = {
			position: entity.position({ x: 1 }),
			velocity: entity.velocity({ y: 4 }),
		}
		const result2 = {
			position: entity.position({ x: 1 }),
		}

		expect(result1).toEqual({
			position: { x: 1, y: 0 },
			velocity: { x: 0, y: 4 },
		})
		assertType<{ position: Vec2d, velocity: Vec2d }>(result1)

		expect(result2).toEqual({
			position: { x: 1, y: 0 },
		})
		assertType<{ position: Vec2d }>(result2)
	})
})
