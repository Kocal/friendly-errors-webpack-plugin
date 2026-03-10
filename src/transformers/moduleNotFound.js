'use strict'

const TYPE = 'module-not-found'

function isModuleNotFoundError (e) {
  const webpackError = e.webpackError || {}

  // Webpack 5: dependencies is no longer available, check name and message
  if (e.name === 'ModuleNotFoundError' && e.message.indexOf('Module not found') === 0) {
    return true
  }

  // Webpack 4 compatibility
  return webpackError.dependencies &&
    webpackError.dependencies.length > 0 &&
    e.name === 'ModuleNotFoundError' &&
    e.message.indexOf('Module not found') === 0
}

function extractModuleFromMessage (message) {
  // Extract module name from "Module not found: Error: Can't resolve 'module-name'"
  const match = message.match(/Can't resolve '([^']+)'/)
  return match ? match[1] : null
}

function transform (error) {
  const webpackError = error.webpackError
  if (isModuleNotFoundError(error)) {
    let module

    // Try Webpack 4 style first (dependencies)
    if (webpackError && webpackError.dependencies && webpackError.dependencies.length > 0) {
      const dependency = webpackError.dependencies[0]
      module = dependency.userRequest || dependency.request
    }

    // Webpack 5 style: parse from message
    if (!module) {
      module = extractModuleFromMessage(error.message)
    }

    if (module) {
      return Object.assign({}, error, {
        message: `Module not found ${module}`,
        type: TYPE,
        severity: 900,
        module,
        name: 'Module not found'
      })
    }
  }

  return error
}

module.exports = transform
