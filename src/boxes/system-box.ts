import type { Entity } from '../ecs/entity'
import { type System, SystemType } from '../ecs'
import { set } from '../types'

type SystemIterator<TEntity extends Entity> = Iterable<System<TEntity>>

export type SystemBox<TEntity extends Entity> = {
	all: SystemIterator<TEntity>
	fixedUpdate: SystemIterator<TEntity>
	update: SystemIterator<TEntity>
	render: SystemIterator<TEntity>
	enterScene: SystemIterator<TEntity>
	beforeFrame: SystemIterator<TEntity>
	afterFrame: SystemIterator<TEntity>
	add: (system: System<TEntity>) => void
	remove: (system: System<TEntity>) => void
	size: () => number
}

export function createSystemBox<TEntity extends Entity>(): SystemBox<TEntity> {
	const allSystems = set<System<TEntity>>()
	const byType = {
		[SystemType.EnterScene]: set<System<TEntity>>(),
		[SystemType.FixedUpdate]: set<System<TEntity>>(),
		[SystemType.BeforeFrame]: set<System<TEntity>>(),
		[SystemType.Update]: set<System<TEntity>>(),
		[SystemType.Render]: set<System<TEntity>>(),
		[SystemType.AfterFrame]: set<System<TEntity>>(),
		[SystemType.ExitScene]: set<System<TEntity>>(),
	}

	function add(system: System<TEntity>) {
		allSystems.add(system)
		byType[system.type].add(system)
	}

	function remove(system: System<TEntity>) {
		allSystems.delete(system)
		byType[system.type].delete(system)
	}

	function size() {
		return allSystems.size
	}

	return {
		all: allSystems,
		fixedUpdate: byType[SystemType.FixedUpdate],
		update: byType[SystemType.Update],
		render: byType[SystemType.Render],
		enterScene: byType[SystemType.EnterScene],
		beforeFrame: byType[SystemType.BeforeFrame],
		afterFrame: byType[SystemType.AfterFrame],
		add,
		remove,
		size,
	}
}
