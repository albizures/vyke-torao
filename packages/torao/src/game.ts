import { rootSola } from './sola'
import type { Renderer } from './renderer'
import type { BuildableScene, Scene } from './scene'
import { canvasRect } from './resources/canvas-rect'
import { vec2 } from './vec'
import { createLoop } from './loop'

const _sola = rootSola.withTag('game')

type Game = {
	canvas: HTMLCanvasElement
	scenes: Map<string, BuildableScene>
	startScene: string
	renderer: Renderer
	start: () => void
}

type GameArgs<TScenes extends Record<string, BuildableScene>, TStartScene extends keyof TScenes> = {
	canvas: HTMLCanvasElement
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
		startScene,
		tickRate = 40,
	} = args
	const loop = createLoop(tickRate)
	const scenes = new Map(Object.entries(sceneEntries))
	const readyScenes = new Map<string, Scene>()

	let currentScene: Scene
	renderer.setup(canvas)

	function update() {
		if (currentScene.update) {
			currentScene.update()
		}

		for (const system of currentScene.systems) {
			system.update()
		}
	}

	function render() {
		renderer.render(currentScene.entities)
	}

	return {
		canvas,
		scenes,
		startScene: startScene as string,
		renderer,
		async start() {
			const scene = scenes.get(startScene as string)!

			currentScene = await scene.build()
			readyScenes.set(scene.label, currentScene)

			const rect = canvas.getBoundingClientRect()
			const size = vec2(rect.width, rect.height)

			canvasRect.set({
				size,
				position: vec2(rect.left, rect.top),
				halfSize: vec2.divideScalar(size, 2),
			})

			loop.start({
				update,
				render,
			})
		},
	}
}
