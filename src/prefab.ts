import type { Entity } from './ecs'

export type Prefab<TArgs> = {
	id: string
	create: (args: TArgs) => Entity
}

export function createPrefab<TArgs>(args: Prefab<TArgs>): Prefab<TArgs> {
	return { ...args }
}
