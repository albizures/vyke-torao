import type { AnyAtlas } from './texture'

export type Placeholder = {
	context: CanvasRenderingContext2D
	canvas: HTMLCanvasElement
}

function createPlaceholder(atlas?: AnyAtlas): Placeholder {
	const canvas = document.createElement('canvas')
	const context = canvas.getContext('2d')!

	const placeholder = { context, canvas }

	if (atlas) {
		renderPlaceholder(placeholder, atlas)
	}

	return placeholder
}

export function definePlaceholder(): (atlas: AnyAtlas) => Placeholder {
	let placeholder: Placeholder
	return (atlas: AnyAtlas) => {
		if (!placeholder) {
			placeholder = createPlaceholder(atlas)
		}

		renderPlaceholder(placeholder, atlas)

		return placeholder
	}
}

function renderPlaceholder(placeholder: Placeholder, atlas: AnyAtlas) {
	const { context } = placeholder as Placeholder
	const { canvas } = context
	const { region } = atlas
	const { width, height } = region

	canvas.width = width
	canvas.height = height

	context.fillStyle = 'rgba(0, 150, 0, 0.5)'
	context.fillRect(0, 0, width, height)
	context.strokeStyle = 'rgba(0, 150, 0, 1)'
	context.strokeRect(0, 0, width, height)

	context.beginPath()
	context.moveTo(0, 0)
	context.lineTo(width, width)
	context.moveTo(0, height)
	context.lineTo(width, 0)
	context.stroke()
}
