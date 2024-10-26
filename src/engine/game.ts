import type { AnyAsset } from '../assets'
import type { AnyComponents, Query, System } from '../ecs'
import type { Director, Scenes } from '../engine/director'
import type { Texture } from '../texture'
import { Canvas, type CanvasArgs, createCanvas } from '../canvas'
import { assert } from '../error'
import { CanvasRes } from '../resources'
import { is, type OptionalProps } from '../types'
import { createRequestAnimationFrameRunner, type Runner } from './loop'

export type Register = <TComponents extends AnyComponents>(args: Query<TComponents>) => void

export type ScenePlugin = {
	id: string
	queries?: (register: Register) => void
	systems?: Array<System<any>>
}

type Game<TScenes extends Scenes> = Director<TScenes> & {
	canvas: Canvas
	runner: Runner
	start: <TName extends keyof TScenes>(name: TName, ...args: OptionalProps<TScenes[TName]>) => void
}

export type Assets = Record<string, AnyAsset>
export type Textures = Record<string, Texture>

type GameArgs<TScenes extends Scenes> = {
	canvas: Canvas | CanvasArgs
	director: Director<TScenes>
	runner?: Runner
}

export function createGame<TScenes extends Scenes>(
	args: GameArgs<TScenes>,
): Game<TScenes> {
	const { canvas: maybeCanvas, director, runner = createRequestAnimationFrameRunner() } = args

	const canvas = is(maybeCanvas, Canvas) ? maybeCanvas : createCanvas(maybeCanvas)

	const game = {
		canvas,
		runner,
		...director,
		start<TName extends keyof TScenes>(name: TName, ...args: OptionalProps<TScenes[TName]>) {
			assert(
				Object.values(director.scenes).length > 0,
				'No scenes added to the director',
				'Did you forget to add scenes to the director?',
			)
			const [props] = args
			CanvasRes.set(canvas)
			director.runner = runner
			director.transitTo(name, props as TScenes[TName])
		},
	}

	return game
}
