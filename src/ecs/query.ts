import type { Entity } from './entity'
import { set } from '../types'

type WhereFn<TEntity extends Entity> = (values: TEntity) => boolean

export type AnyQuery = Query<Entity>

export type QueryArgs<TEntity extends Entity> = {
	id: string
	with: Array<keyof TEntity>
	without?: Array<keyof TEntity>
	where?: WhereFn<TEntity>
}

export type Query<TEntity extends Entity> = {
	id: string
	with: Set<keyof TEntity>
	without: Set<keyof TEntity>
	where?: WhereFn<TEntity> | undefined
}

export type InferQueryValues<TQuery extends AnyQuery> = TQuery extends Query<infer TValues>
	? TValues
	: never

export function defineQuery<TEntity extends Entity>(args: QueryArgs<TEntity>): Query<TEntity> {
	const { id, where } = args
	const withComponents = set(args.with)
	const withoutComponents = set(args.without || [])
	const query: Query<TEntity> = {
		id,
		with: withComponents,
		without: withoutComponents,
		where,
	}

	return query
}
