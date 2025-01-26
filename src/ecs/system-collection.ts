import type { ScenePlugin } from '../engine'
import type { LoopFns, LoopValues } from '../engine/loop'
import type { System, SystemContext } from './system'
import type { World } from './world'
import { createSystemBox, type SystemBox } from '../boxes/system-box'
import { LoopRes } from '../resources'

type SystemCollection = {
	box: SystemBox
	intoLoop: (world: World) => LoopFns
}

export type SystemCollectionArgs = {
	systems?: Array<System>
	plugins?: Array<ScenePlugin>
}

export function createSystemCollection(args: SystemCollectionArgs): SystemCollection {
	const { systems: initSystems = [], plugins = [] } = args
	const box = createSystemBox()

	for (const system of initSystems) {
		box.add(system)
	}

	for (const plugin of plugins) {
		for (const system of plugin.systems ?? []) {
			box.add(system)
		}
	}

	return {
		box,
		intoLoop(world: World) {
			const systemContext: SystemContext = {
				spawn: world.spawn,
				select: world.select,
				getEntity: world.entities.getById,
				update: world.update,
			}

			for (const system of box.enterScene) {
				system.run(systemContext)
			}

			function beforeFrame(args: LoopValues) {
				LoopRes.set(args)
				for (const system of box.beforeFrame) {
					system.run(systemContext)
				}
			}

			function afterFrame() {
				for (const system of box.afterFrame) {
					system.run(systemContext)
				}
			}

			function update() {
				for (const system of box.update) {
					system.run(systemContext)
				}
			}

			function render() {
				for (const system of box.render) {
					system.run(systemContext)
				}
			}

			function fixedUpdate(args: LoopValues) {
				LoopRes.set(args)
				for (const system of box.fixedUpdate) {
					system.run(systemContext)
				}
			}

			return {
				fixedUpdate,
				update,
				render,
				beforeFrame,
				afterFrame,
			}
		},
	}
}
