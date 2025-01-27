import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { createDirector } from './director'
import { createGame } from './game'
import { createStepRunner } from './loop'

describe('createDirector', () => {
	it('should create a director', () => {
		const runner = createStepRunner()
		const game = createGame({ runner })
		const director = createDirector<{
			home: never
		}>(game)

		expect(director).toBeDefined()
		expect(director.start).toBeTypeOf('function')
		expect(director.scene).toBeTypeOf('function')
	})

	it('should allow to define only valid scene names', () => {
		const runner = createStepRunner()
		const game = createGame({ runner })
		const director = createDirector<{
			home: never
		}>(game)

		director.scene('home', {})
		// @ts-expect-error invalid scene name
		director.scene('invalid', {})
	})

	describe('when the scene does not exist', () => {
		it('should throw an error', () => {
			const runner = createStepRunner()
			const game = createGame({ runner })
			const director = createDirector<{
				home: never
			}>(game)

			expect(() => {
				// @ts-expect-error invalid scene name
				director.start('invalid')
			}).toThrow('Scene "invalid" does not exist')
			expect(() => {
				// in this case, the scene name is correct, but the scene has not been defined
				director.start('home')
			}).toThrow('Scene "home" does not exist')
		})
	})

	it('should start the game', () => {
		const runner = createStepRunner()
		const game = createGame({ runner })
		const director = createDirector<{
			home: never
		}>(game)

		const enter = vi.fn()
		director.scene('home', {
			enter,
		})

		director.start('home')
		expect(game.currentScene).toBe('home')
		expect(enter).toHaveBeenCalled()
	})

	it('should transition to another scene', () => {
		const runner = createStepRunner()
		const game = createGame({ runner })
		const director = createDirector<{
			home: never
			other: never
		}>(game)

		const enter = vi.fn()
		const otherEnter = vi.fn()
		director.scene('home', {
			enter,
		})
		director.scene('other', {
			enter: otherEnter,
		})

		director.start('home')
		expect(game.currentScene).toBe('home')
		expect(enter).toHaveBeenCalled()

		director.goTo('other')
		expect(game.currentScene).toBe('other')
		expect(otherEnter).toHaveBeenCalled()
	})

	it('should pass props to the scene', () => {
		const runner = createStepRunner()
		const game = createGame({ runner })
		const director = createDirector<{
			home: { message: string }
			end: { message: string }
		}>(game)

		const enter = vi.fn()
		director.scene('home', {
			enter,
		})

		director.scene('end', {
			enter(context) {
				expectTypeOf(context.scene.props).toEqualTypeOf<{ message: string }>()
			},
		})

		director.start('home', { message: 'Hello' })
		expect(enter).toHaveBeenCalledWith(expect.objectContaining({
			scene: expect.objectContaining({
				props: { message: 'Hello' },
			}),
		}))
	})
})
