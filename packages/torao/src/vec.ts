export type Vec2D = {
	x: number
	y: number
}

export function vec2D(x: number, y: number): Vec2D {
	return { x, y }
}

vec2D.divide = (a: Vec2D, b: Vec2D): Vec2D => {
	return vec2D(a.x / b.x, a.y / b.y)
}

vec2D.add = (a: Vec2D, b: Vec2D): Vec2D => {
	return vec2D(a.x + b.x, a.y + b.y)
}

vec2D.divideScalar = (a: Vec2D, scalar: number): Vec2D => {
	return vec2D(a.x / scalar, a.y / scalar)
}
