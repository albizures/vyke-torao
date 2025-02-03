import type { AnyCreator, InferWithComponents } from './entity'
import { set } from '../types'

export class Maybe<TCreator> {
	constructor(public readonly creator: TCreator) {
	}
}

export type AnyCreators = Array<AnyCreator | Maybe<AnyCreator>>

type WhereFn<TComponents extends AnyCreators> = (values: InferWithComponents<TComponents>) => boolean

export type AnyQuery = Query<AnyCreators>

export type QueryArgs<TComponents extends AnyCreators> = {
	id: string
	with: TComponents
	without?: Array<AnyCreator>
	where?: WhereFn<TComponents>
}

export type Query<TCreators extends AnyCreators> = {
	id: string
	with: Set<TCreators[number]>
	without: Set<AnyCreator>
	where?: WhereFn<TCreators> | undefined
}

export function defineQuery<const TComponents extends AnyCreators>(args: QueryArgs<TComponents>): Query<TComponents> {
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

export function maybe<const TCreator extends AnyCreator>(creator: TCreator): Maybe<TCreator> {
	return new Maybe(creator)
}
