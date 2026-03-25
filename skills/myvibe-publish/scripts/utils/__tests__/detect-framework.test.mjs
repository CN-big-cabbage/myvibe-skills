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
      evidence: ['vite.config.ts'],
      likelyOutputs: ['dist'],
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
      evidence: ['dependency:vite', 'script:build', 'file:index.html'],
      likelyOutputs: ['dist'],
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
      evidence: ['next.config.mjs'],
      likelyOutputs: ['out'],
    },
  },
  {
    name: 'uses .next as supporting Next.js evidence but not publishable pre-built output',
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
      evidence: ['dependency:next', 'directory:.next'],
      likelyOutputs: ['out'],
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
      evidence: ['astro.config.ts'],
      likelyOutputs: ['dist'],
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
      evidence: ['nuxt.config.ts'],
      likelyOutputs: ['.output/public'],
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
      evidence: ['dependency:nuxt', 'file:.output/public/index.html'],
      likelyOutputs: ['.output/public'],
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
      evidence: ['script:build'],
      likelyOutputs: [],
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
      evidence: ['file:index.html'],
      likelyOutputs: [],
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
      evidence: ['file:build-output/index.html'],
      likelyOutputs: [],
    },
  },
  {
    name: 'does not treat public/index.html as generic pre-built output',
    fixture: {
      files: ['public/index.html'],
      directories: ['public'],
      packageJson: { ...basePackageJson },
    },
    expected: {
      projectClass: 'unknown',
      framework: null,
      evidence: [],
      likelyOutputs: [],
    },
  },
  {
    name: 'does not treat nested package.json files as monorepo without workspace signals',
    fixture: {
      files: ['examples/demo/package.json', 'vite.config.ts'],
      directories: ['examples', 'examples/demo'],
      packageJson: { ...basePackageJson },
    },
    expected: {
      projectClass: 'buildable',
      framework: 'vite',
      evidence: ['vite.config.ts'],
      likelyOutputs: ['dist'],
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
      evidence: ['workspace'],
      likelyOutputs: [],
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
