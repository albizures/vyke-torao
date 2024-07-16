import { rootSola } from './sola'
import type { Renderer } from './renderer'
import type { BuildableScene, Scene } from './scene'

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
}

export function createGame<
	TScenes extends Record<string, BuildableScene>,
	TStartScene extends keyof TScenes,
>(args: GameArgs<TScenes, TStartScene>): Game {
	const { canvas, scenes: sceneEntries, renderer, startScene } = args
	const scenes = new Map(Object.entries(sceneEntries))
	const readyScenes = new Map<string, Scene>()

	let currentScene: Scene
	renderer.setup(canvas)

	function loop() {
		renderer.render(currentScene.entities)

		requestAnimationFrame(loop)
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
			loop()
		},
	}
}
