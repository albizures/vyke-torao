import type { SystemBox } from '../boxes/system-box'
import type { SceneContext, ScenePlugin } from '../engine'
import type { LoopFns, LoopValues } from '../engine/loop'
import type { System, SystemContext } from './system'
import { createSystemBox } from '../boxes/system-box'
import { LoopRes } from '../resources'

export type SystemCollection = {
	box: SystemBox
	/**
	 * Creates loop functions for the systems in the collection.
	 * Basically, converts the systems into functions that can be called by a Runner.
	 */
	intoLoop: <TProps = never>(scene: SceneContext<TProps>) => LoopFns
	enter: <TProps = never>(scene: SceneContext<TProps>) => void
	beforeExit: <TProps = never>(scene: SceneContext<TProps>) => void
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

	function createSystemContext(scene: SceneContext<any>): SystemContext {
		const { world } = scene
		return {
			spawn: world.spawn,
			select: world.select,
			getEntity: world.entities.getById,
			update: world.update,
			scene,
		}
	}

	const collection: SystemCollection = {
		box,
		enter(scene) {
			const systemContext = createSystemContext(scene)

			for (const system of box.enterScene) {
				system.run(systemContext)
			}
		},
		beforeExit(scene) {
			const systemContext = createSystemContext(scene)

			for (const system of box.beforeExitScene) {
				system.run(systemContext)
			}
		},
		intoLoop(scene) {
			const systemContext = createSystemContext(scene)

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

	return collection
}
