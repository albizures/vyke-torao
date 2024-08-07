import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
	resolve: {
		alias: {
			'@vyke/torao': path.resolve(__dirname, '../../packages/torao/src'),
		},
	},
})
