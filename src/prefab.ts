import type { AnyEntity } from './ecs/entity'

export type Prefab<TArgs> = {
	id: string
	create: (args: TArgs) => AnyEntity
}

export function createPrefab<TArgs>(args: Prefab<TArgs>): Prefab<TArgs> {
	return { ...args }
}
