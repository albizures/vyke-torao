import type { Entity } from './ecs/entity'

export type Prefab<TArgs> = {
	id: string
	create: (args: TArgs) => Entity
}

export function createPrefab<TArgs>(args: Prefab<TArgs>): Prefab<TArgs> {
	return { ...args }
}
