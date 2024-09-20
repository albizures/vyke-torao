import type { Simplify } from 'type-fest'
import type { Rectangle } from './shapes/Rectangle'
import type { Vec2D } from './vec'

export type Region2d = Simplify<Rectangle & Vec2D>
