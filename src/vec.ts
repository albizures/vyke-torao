export type Vec2d = {
	x: number
	y: number
}

export function vec2d(x: number, y: number): Vec2d {
	return { x, y }
}

vec2d.divide = (a: Vec2d, b: Vec2d): Vec2d => {
	return vec2d(a.x / b.x, a.y / b.y)
}

vec2d.add = (a: Vec2d, b: Vec2d): Vec2d => {
	return vec2d(a.x + b.x, a.y + b.y)
}

vec2d.divideScalar = (a: Vec2d, scalar: number): Vec2d => {
	return vec2d(a.x / scalar, a.y / scalar)
}

vec2d.complete = (partial: Partial<Vec2d>): Vec2d => {
	const { x = 0, y = 0 } = partial

	return {
		x,
		y,
	}
}
