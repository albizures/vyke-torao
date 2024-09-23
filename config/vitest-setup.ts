import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'
import type { expect } from 'vitest'
import '@testing-library/jest-dom/vitest'

declare module 'vitest' {
	// eslint-disable-next-line ts/consistent-type-definitions
	interface JestAssertion<T = any>
		extends TestingLibraryMatchers<
			ReturnType<typeof expect.stringContaining>,
			T
		> {}
}
