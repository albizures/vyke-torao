<div align="center">
	<h1>
		@vyke/torao
	</h1>
</div>
Small and type-friendly library for game development

## Installation
```sh
npm i @vyke/torao
```

## API
### defineComponent
Define a new component.

```ts
const Size = defineComponent('size', (value: number) => value)
const Position = defineComponent('position', (pos: {x?: number, y?: number}) => {
	return {x: pos.x ?? 0, y: pos.y ?? 0}
})
```

### createResource
Creates a resource that can be shared between systems.

### createGame
Create a new game.

```ts
const entity = {
	// ...your components
}

const director = createDirector<{
home: never,
	// ...your scenes
}>()

const game = createGame({
	director,
	entity,
})
```

## Others vyke projects
- [Flowmodoro app by vyke](https://github.com/albizures/vyke-flowmodoro)
- [@vyke/tsdocs](https://github.com/albizures/vyke-tsdocs)
- [@vyke/val](https://github.com/albizures/vyke-val)
- [@vyke/dom](https://github.com/albizures/vyke-dom)
