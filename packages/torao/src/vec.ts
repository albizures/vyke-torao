export type Vec2d = {
	x: number
	y: number
}

export function vec2(x: number, y: number): Vec2d {
	return { x, y }
}

vec2.divide = (a: Vec2d, b: Vec2d): Vec2d => {
	return vec2(a.x / b.x, a.y / b.y)
}

vec2.add = (a: Vec2d, b: Vec2d): Vec2d => {
	return vec2(a.x + b.x, a.y + b.y)
}

vec2.divideScalar = (a: Vec2d, scalar: number): Vec2d => {
	return vec2(a.x / scalar, a.y / scalar)
}
