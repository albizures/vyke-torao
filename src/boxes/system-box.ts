import type { System } from '../ecs'
import { SystemType } from '../ecs'
import { set } from '../types'

type SystemIterator = Iterable<System>

export type SystemBox = {
	all: SystemIterator
	fixedUpdate: SystemIterator
	update: SystemIterator
	render: SystemIterator
	enterScene: SystemIterator
	beforeExitScene: SystemIterator
	beforeFrame: SystemIterator
	afterFrame: SystemIterator
	add: (system: System) => void
	remove: (system: System) => void
	size: () => number
}

export function createSystemBox(): SystemBox {
	const allSystems = set<System>()
	const byType = {
		[SystemType.EnterScene]: set<System>(),
		[SystemType.FixedUpdate]: set<System>(),
		[SystemType.BeforeFrame]: set<System>(),
		[SystemType.Update]: set<System>(),
		[SystemType.Render]: set<System>(),
		[SystemType.AfterFrame]: set<System>(),
		[SystemType.BeforeExitScene]: set<System>(),
	}

	function add(system: System) {
		allSystems.add(system)
		byType[system.type].add(system)
	}

	function remove(system: System) {
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
		beforeExitScene: byType[SystemType.BeforeExitScene],
		beforeFrame: byType[SystemType.BeforeFrame],
		afterFrame: byType[SystemType.AfterFrame],
		add,
		remove,
		size,
	}
}
