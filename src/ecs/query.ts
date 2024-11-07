import type { AnyComponent, InferWithComponents } from './entity'
import { set } from '../types'

export type Maybe<TComponents> = { component: TComponents }

export type AnyComponents = Array<AnyComponent | Maybe<AnyComponent>>

type WhereFn<TComponents extends AnyComponents> = (values: InferWithComponents<TComponents>) => boolean

export type AnyQuery = Query<AnyComponents>

export type QueryArgs<TComponents extends AnyComponents> = {
	id: string
	with: TComponents
	without?: Array<AnyComponent>
	where?: WhereFn<TComponents>
}

export type Query<TComponents extends AnyComponents> = {
	id: string
	with: Set<TComponents[number]>
	without: Set<AnyComponent>
	where?: WhereFn<TComponents> | undefined
}

export function defineQuery<const TComponents extends AnyComponents>(args: QueryArgs<TComponents>): Query<TComponents> {
	const { id, where } = args
	const withComponents = set(args.with)
	const withoutComponents = set(args.without || [])
	const query: Query<TComponents> = {
		id,
		with: withComponents,
		without: withoutComponents,
		where,
	}

	return query
}

export function maybe<const TComponent extends AnyComponent>(component: TComponent): Maybe<TComponent> {
	return { component }
}
