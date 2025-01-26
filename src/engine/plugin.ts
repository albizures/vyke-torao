import type { AnyComponents, Query, System } from '../ecs'
import type { AnyDirectorScenes } from './director'
import type { Torao } from './game'

export type Register = <TComponents extends AnyComponents>(args: Query<TComponents>) => void

export type ScenePlugin = {
	id: string
	queries?: (register: Register) => void
	systems?: Array<System>
}

export type GamePlugin = {
	scene?: ScenePlugin
	beforeStart?: <TScenes extends AnyDirectorScenes>(game: Torao<TScenes>) => void
}
