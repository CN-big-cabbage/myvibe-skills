import { describe, it, expect } from 'vitest'
import { detectProjectType } from '../detect-framework.mjs'

const basePackageJson = {
  scripts: {},
  dependencies: {},
  devDependencies: {},
}

const cases = [
  {
    name: 'detects Vite from vite.config.ts',
    fixture: {
      files: ['vite.config.ts'],
      directories: [],
      packageJson: { ...basePackageJson },
    },
    expected: {
      projectClass: 'buildable',
      framework: 'vite',
    },
  },
  {
    name: 'detects Vite from dependency plus build script with a root index.html entrypoint',
    fixture: {
      files: ['index.html', 'src/main.ts'],
      directories: ['src'],
      packageJson: {
        ...basePackageJson,
        scripts: { build: 'vite build' },
        devDependencies: { vite: '^6.0.0' },
      },
    },
    expected: {
      projectClass: 'buildable',
      framework: 'vite',
    },
  },
  {
    name: 'detects Next.js from next.config.*',
    fixture: {
      files: ['next.config.mjs'],
      directories: [],
      packageJson: { ...basePackageJson },
    },
    expected: {
      projectClass: 'buildable',
      framework: 'nextjs',
    },
  },
  {
    name: 'treats .next output as Next.js evidence but not publishable pre-built output',
    fixture: {
      files: [],
      directories: ['.next'],
      packageJson: {
        ...basePackageJson,
        dependencies: { next: '^15.0.0' },
      },
    },
    expected: {
      projectClass: 'buildable',
      framework: 'nextjs',
    },
  },
  {
    name: 'detects Astro from astro.config.*',
    fixture: {
      files: ['astro.config.ts'],
      directories: [],
      packageJson: { ...basePackageJson },
    },
    expected: {
      projectClass: 'buildable',
      framework: 'astro',
    },
  },
  {
    name: 'detects Nuxt from nuxt.config.*',
    fixture: {
      files: ['nuxt.config.ts'],
      directories: [],
      packageJson: { ...basePackageJson },
    },
    expected: {
      projectClass: 'buildable',
      framework: 'nuxt',
    },
  },
  {
    name: 'treats Nuxt as pre-built only when a static output directory contains index.html',
    fixture: {
      files: ['.output/public/index.html'],
      directories: ['.output', '.output/public'],
      packageJson: {
        ...basePackageJson,
        dependencies: { nuxt: '^3.0.0' },
      },
    },
    expected: {
      projectClass: 'pre-built',
      framework: 'nuxt',
    },
  },
  {
    name: 'falls back to unknown-buildable when only a build script is present',
    fixture: {
      files: ['scripts/build.mjs'],
      directories: ['scripts'],
      packageJson: {
        ...basePackageJson,
        scripts: { build: 'node scripts/build.mjs' },
      },
    },
    expected: {
      projectClass: 'buildable',
      framework: 'unknown-buildable',
    },
  },
  {
    name: 'keeps a static project static',
    fixture: {
      files: ['index.html'],
      directories: [],
      packageJson: { ...basePackageJson },
    },
    expected: {
      projectClass: 'static',
      framework: null,
    },
  },
  {
    name: 'treats a static output directory with index.html as pre-built',
    fixture: {
      files: ['build-output/index.html'],
      directories: ['build-output'],
      packageJson: { ...basePackageJson },
    },
    expected: {
      projectClass: 'pre-built',
      framework: null,
    },
  },
  {
    name: 'keeps the outer level as monorepo',
    fixture: {
      files: ['packages/app/package.json', 'packages/site/package.json'],
      directories: ['packages', 'packages/app', 'packages/site'],
      packageJson: {
        ...basePackageJson,
        workspaces: ['packages/*'],
      },
    },
    expected: {
      projectClass: 'monorepo',
      framework: null,
    },
  },
]

describe('detectProjectType', () => {
  for (const { name, fixture, expected } of cases) {
    it(name, () => {
      const result = detectProjectType(fixture)
      expect(result).toStrictEqual(expected)
    })
  }
})
