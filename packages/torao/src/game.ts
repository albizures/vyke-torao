import { rootSola } from './sola'
import type { Renderer } from './renderer'
import type { BuildableScene, Scene } from './scene'
import { createLoop } from './loop'
import type { Canvas } from './canvas'

const _sola = rootSola.withTag('game')

type Game = {
	canvas: Canvas
	scenes: Map<string, BuildableScene>
	startScene: string
	renderer: Renderer
	start: () => void
}

type GameArgs<TScenes extends Record<string, BuildableScene>, TStartScene extends keyof TScenes> = {
	canvas: Canvas
	renderer: Renderer
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
		renderer,
		tickRate = 40,
	} = args
	const startScene = args.startScene as string
	const loop = createLoop(tickRate)
	const scenes = new Map(Object.entries(sceneEntries))
	const readyScenes = new Map<string, Scene>()

	let currentScene: Scene
	renderer.setup(canvas)

	function update() {
		for (const system of currentScene.systems.update) {
			system.update()
		}
	}

	function render() {
		for (const system of currentScene.systems.render) {
			system.update()
		}
	}

	return {
		canvas,
		scenes,
		startScene,
		renderer,
		async start() {
			const scene = scenes.get(startScene)!

			currentScene = await scene.build(renderer.systems)

			readyScenes.set(scene.label, currentScene)

			loop.start({
				update,
				render,
			})
		},
	}
}
