import type { AnyCreators, Query, System } from '../ecs'
import type { Torao } from './game'

export type Register = <TComponents extends AnyCreators>(args: Query<TComponents>) => void

export type ScenePlugin = {
	id: string
	queries?: (register: Register) => void
	systems?: Array<System>
}

export type GamePlugin = {
	scene?: ScenePlugin
	beforeStart?: (game: Torao) => void
}
