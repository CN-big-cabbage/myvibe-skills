const VITE_CONFIG_FILES = new Set(['vite.config.js', 'vite.config.mjs', 'vite.config.ts', 'vite.config.cjs'])
const NEXT_CONFIG_FILES = new Set(['next.config.js', 'next.config.mjs', 'next.config.ts', 'next.config.cjs'])
const ASTRO_CONFIG_FILES = new Set(['astro.config.js', 'astro.config.mjs', 'astro.config.ts', 'astro.config.cjs'])
const NUXT_CONFIG_FILES = new Set(['nuxt.config.js', 'nuxt.config.mjs', 'nuxt.config.ts', 'nuxt.config.cjs'])
const STATIC_OUTPUT_DIRECTORIES = new Set(['dist', 'build', 'out', 'public', 'build-output'])

function hasFile(files, target) {
  return files.has(target)
}

function hasAnyFile(files, targets) {
  return targets.some((target) => files.has(target))
}

function hasDependency(packageJson, dependencyName) {
  return Boolean(packageJson.dependencies[dependencyName] || packageJson.devDependencies[dependencyName])
}

function hasBuildScript(packageJson) {
  return typeof packageJson.scripts.build === 'string' && packageJson.scripts.build.trim().length > 0
}

function hasWorkspaceSignal(project, packageJson) {
  return (
    project.hasWorkspaceConfig === true ||
    project.packageJsonCount > 1 ||
    Array.isArray(packageJson.workspaces) ||
    Object.prototype.hasOwnProperty.call(packageJson, 'workspaces')
  )
}

function hasNestedPackageJson(files) {
  for (const file of files) {
    if (file !== 'package.json' && file.endsWith('/package.json')) {
      return true
    }
  }

  return false
}

function getStaticOutputIndexFiles(files) {
  const matches = []

  for (const file of files) {
    if (!file.endsWith('/index.html')) {
      continue
    }

    const directory = file.slice(0, -'/index.html'.length)
    if (STATIC_OUTPUT_DIRECTORIES.has(directory) || directory === '.output/public') {
      matches.push(file)
    }
  }

  return matches
}

export function normalizePackageJson(pkg = {}) {
  const normalized = {
    scripts: pkg.scripts && typeof pkg.scripts === 'object' ? pkg.scripts : {},
    dependencies: pkg.dependencies && typeof pkg.dependencies === 'object' ? pkg.dependencies : {},
    devDependencies: pkg.devDependencies && typeof pkg.devDependencies === 'object' ? pkg.devDependencies : {},
  }

  if (Object.prototype.hasOwnProperty.call(pkg, 'workspaces')) {
    normalized.workspaces = pkg.workspaces
  }

  return normalized
}

export function detectFrameworkEvidence(project = {}) {
  const files = new Set(Array.isArray(project.files) ? project.files : [])
  const packageJson = normalizePackageJson(project.packageJson)

  const frameworks = [
    {
      framework: 'vite',
      matches:
        hasAnyFile(files, [...VITE_CONFIG_FILES]) ||
        hasDependency(packageJson, 'vite') ||
        (hasBuildScript(packageJson) && hasDependency(packageJson, 'vite') && hasFile(files, 'index.html')),
    },
    {
      framework: 'nextjs',
      matches: hasAnyFile(files, [...NEXT_CONFIG_FILES]) || hasDependency(packageJson, 'next'),
    },
    {
      framework: 'astro',
      matches: hasAnyFile(files, [...ASTRO_CONFIG_FILES]) || hasDependency(packageJson, 'astro'),
    },
    {
      framework: 'nuxt',
      matches: hasAnyFile(files, [...NUXT_CONFIG_FILES]) || hasDependency(packageJson, 'nuxt'),
    },
  ]

  return frameworks.find((candidate) => candidate.matches)?.framework ?? null
}

export function detectProjectType(project = {}) {
  const files = new Set(Array.isArray(project.files) ? project.files : [])
  const packageJson = normalizePackageJson(project.packageJson)

  if (hasWorkspaceSignal(project, packageJson) || hasNestedPackageJson(files)) {
    return {
      projectClass: 'monorepo',
      framework: null,
    }
  }

  const framework = detectFrameworkEvidence(project)
  const staticOutputIndexFiles = getStaticOutputIndexFiles(files)

  if (framework === 'nuxt' && staticOutputIndexFiles.length > 0) {
    return {
      projectClass: 'pre-built',
      framework,
    }
  }

  if (framework === 'nextjs' && staticOutputIndexFiles.some((file) => file.startsWith('out/'))) {
    return {
      projectClass: 'pre-built',
      framework,
    }
  }

  if (framework) {
    return {
      projectClass: 'buildable',
      framework,
    }
  }

  if (hasBuildScript(packageJson)) {
    return {
      projectClass: 'buildable',
      framework: 'unknown-buildable',
    }
  }

  if (hasFile(files, 'index.html')) {
    return {
      projectClass: 'static',
      framework: null,
    }
  }

  if (staticOutputIndexFiles.length > 0) {
    return {
      projectClass: 'pre-built',
      framework: null,
    }
  }

  return {
    projectClass: 'unknown',
    framework: null,
  }
}
