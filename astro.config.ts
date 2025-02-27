// @ts-check
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
	srcDir: './examples',
	outDir: './build',
	devToolbar: {
		enabled: false,
	},
})
