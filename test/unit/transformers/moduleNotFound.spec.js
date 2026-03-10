const moduleNotFound = require('../../../src/transformers/moduleNotFound')

// Webpack 5 format: module name is extracted from the message
const error = {
  name: 'ModuleNotFoundError',
  message: "Module not found: Error: Can't resolve 'redux' in '/path/to/project'",
  webpackError: {}
}

it('Sets severity to 900', () => {
  expect(moduleNotFound(error).severity).toEqual(900)
})

it('Sets module name', () => {
  expect(moduleNotFound(error).module).toEqual('redux')
})

it('Sets the appropriate message', () => {
  const message = 'Module not found redux'
  expect(moduleNotFound(error).message).toEqual(message)
})

it('Sets the appropriate type', () => {
  expect(moduleNotFound({
    name: 'ModuleNotFoundError',
    message: "Module not found: Error: Can't resolve 'lodash'",
    webpackError: {}
  }).type).toEqual('module-not-found')
})

it('Ignores other errors', () => {
  const error = { name: 'OtherError' }
  expect(moduleNotFound(error)).toEqual(error)
})

it('Handles scoped packages correctly', () => {
  const scopedError = {
    name: 'ModuleNotFoundError',
    message: "Module not found: Error: Can't resolve '@scope/package' in '/path/to/project'",
    webpackError: {}
  }
  expect(moduleNotFound(scopedError).module).toEqual('@scope/package')
  expect(moduleNotFound(scopedError).message).toEqual('Module not found @scope/package')
})
