import type { Atlas } from './sprite'

const placeholders = new Map<string, Placeholder>()

export type Placeholder = {
	context: CanvasRenderingContext2D
	canvas: HTMLCanvasElement
}

export function getPlaceholder(atlas: Atlas): Placeholder {
	const { region } = atlas
	const { width, height } = region

	const id = `${width}x${height}`
	const cached = placeholders.get(id)

	if (cached) {
		return cached
	}

	const canvas = document.createElement('canvas')
	const context = canvas.getContext('2d')!

	const placeholder = { context, canvas }

	renderPlaceholder(placeholder, atlas)

	return placeholder
}

function renderPlaceholder(placeholder: Placeholder, atlas: Atlas) {
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
