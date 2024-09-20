import { rootSola } from './sola'
import type { BuildableScene, Scene } from './scene'
import type { LoopValues } from './loop'
import { createLoop, createRequestAnimationFrameLoopRunner } from './loop'
import type { Canvas as CanvasValue } from './canvas'
import type { System } from './ecs'
import { SystemType } from './ecs'
import { Canvas, Loop } from './resources'

const _sola = rootSola.withTag('game')

type Game = {
	canvas: CanvasValue
	scenes: Map<string, BuildableScene>
	startScene: string
	start: () => void
}

type GameArgs<TScenes extends Record<string, BuildableScene>, TStartScene extends keyof TScenes> = {
	canvas: CanvasValue
	systems: Array<System>
	scenes: TScenes
	startScene: TStartScene
	tickRate?: number
}

export function createGame<
	TScenes extends Record<string, BuildableScene>,
	TStartScene extends keyof TScenes,
>(args: GameArgs<TScenes, TStartScene>): Game {
	const {
		canvas,
		scenes: sceneEntries,
		tickRate = 50,
		systems,
	} = args
	const startScene = args.startScene as string
	const loop = createLoop({ tickRate })
	const loopRunner = createRequestAnimationFrameLoopRunner(loop)
	const scenes = new Map(Object.entries(sceneEntries))
	const readyScenes = new Map<string, Scene>()

	let currentScene: Scene
	Canvas.set(canvas)
	for (const system of systems) {
		if (system.type === SystemType.Setup) {
			system.run()
		}
	}

	function beforeFrame(args: LoopValues) {
		Loop.set(args)
		for (const system of currentScene.systems.beforeFrame) {
			system.run()
		}
	}

	function afterFrame() {
		for (const system of currentScene.systems.afterFrame) {
			system.run()
		}
	}

	function update() {
		for (const system of currentScene.systems.update) {
			system.run()
		}
	}

	function render() {
		for (const system of currentScene.systems.render) {
			system.run()
		}
	}

	function fixedUpdate(args: LoopValues) {
		Loop.set(args)
		for (const system of currentScene.systems.fixedUpdate) {
			system.run()
		}
	}

	return {
		canvas,
		scenes,
		startScene,
		async start() {
			const scene = scenes.get(startScene)!

			currentScene = await scene.build(new Set(systems))

			for (const system of currentScene.systems.enterScene) {
				system.run()
			}
			readyScenes.set(scene.id, currentScene)

			loopRunner.start({
				fixedUpdate,
				update,
				render,
				beforeFrame,
				afterFrame,
			})
		},
	}
}
