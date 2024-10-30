import type { AnyComponents, Query, System } from '../ecs'

export type Register = <TComponents extends AnyComponents>(args: Query<TComponents>) => void

export type ScenePlugin = {
	id: string
	queries?: (register: Register) => void
	systems?: Array<System<any>>
}

export type GamePlugin = {
	scene?: ScenePlugin
}
