import type { KnipConfig } from 'knip'

const config: KnipConfig = {
	astro: {
		entry: [
			'astro.config.ts',
			'examples/content/config.ts',
			'examples/pages/**/*.{astro,mdx,js,ts}',
			'examples/content/**/*.mdx',
		],
	},
}

export default config
