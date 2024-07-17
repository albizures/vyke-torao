import type { Rectangle } from './shapes/Rectangle'
import type { Square } from './shapes/Square'
import type { Triangle } from './shapes/Triangle'
import type { Vec2d } from './vec'

export enum PlaceholderType {
	Rectangle,
	Circle,
	Triangle,
	Square,
	Ellipse,
}

export type PlaceholderData = {
	[PlaceholderType.Rectangle]: Rectangle
	[PlaceholderType.Circle]: { radius: number }
	[PlaceholderType.Triangle]: Triangle
	[PlaceholderType.Square]: Square
	[PlaceholderType.Ellipse]: Vec2d
}

export type Placeholder = {
	[K in PlaceholderType]: {
		type: K
		data: PlaceholderData[K]
		context: CanvasRenderingContext2D
		canvas: HTMLCanvasElement
	}
}[PlaceholderType]

export type PlaceholderByType<TType extends PlaceholderType> = {
	type: TType
	data: PlaceholderData[TType]
	context: CanvasRenderingContext2D
	canvas: HTMLCanvasElement
}

export function createPlaceholder<TType extends PlaceholderType>(type: TType, data: PlaceholderData[TType]): PlaceholderByType<TType> {
	const canvas = document.createElement('canvas')
	const context = canvas.getContext('2d')!

	const placeholder = { type, data, context, canvas }

	renderPlaceholder(placeholder as Placeholder)

	return placeholder
}

export function definePlaceholder<TType extends PlaceholderType>(type: TType): (data: PlaceholderData[TType]) => PlaceholderByType<TType> {
	let placeholder: PlaceholderByType<TType>
	return (data: PlaceholderData[TType]) => {
		if (!placeholder) {
			placeholder = createPlaceholder(type, data)
		}
		else {
			placeholder.data = data
			renderPlaceholder(placeholder as Placeholder)
		}
		return placeholder
	}
}

export function renderPlaceholder<TType extends PlaceholderType>(placeholder: PlaceholderByType<TType>) {
	const { context, type, data } = placeholder as Placeholder
	const { canvas } = context
	switch (type) {
		case PlaceholderType.Rectangle:
			canvas.width = data.width
			canvas.height = data.height

			context.fillStyle = 'rgba(0, 150, 0, 0.5)'
			context.fillRect(0, 0, data.width, data.height)
			context.strokeStyle = 'rgba(0, 150, 0, 1)'
			context.strokeRect(0, 0, data.width, data.height)

			context.beginPath()
			context.moveTo(0, 0)
			context.lineTo(data.width, data.width)
			context.moveTo(0, data.height)
			context.lineTo(data.width, 0)
			context.stroke()

			break
		case PlaceholderType.Circle:
			canvas.width = data.radius * 2
			canvas.height = data.radius * 2

			context.beginPath()
			context.arc(data.radius, data.radius, data.radius, 0, Math.PI * 2)
			context.fill()
			break
		case PlaceholderType.Triangle:
			canvas.width = data.base
			canvas.height = data.height

			context.beginPath()
			context.moveTo(0, data.height)
			context.lineTo(data.base, data.height)
			context.lineTo(data.base / 2, 0)
			context.fill()
			break
		case PlaceholderType.Square:
			canvas.width = data.size
			canvas.height = data.size

			context.strokeRect(0, 0, data.size, data.size)
			break
		case PlaceholderType.Ellipse:
			canvas.width = data.x
			canvas.height = data.y

			context.ellipse(data.x / 2, data.y / 2, data.x, data.y, 0, 0, Math.PI * 2)
			context.fill()
			break
	}
}
