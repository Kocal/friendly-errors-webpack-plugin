'use strict'

const webpack = require('webpack')
const FriendlyErrorsWebpackPlugin = require('../src/friendly-errors-plugin')
const { createFsFromVolume, Volume } = require('memfs')
const path = require('path')
const { captureReports } = require('./utils')

const webpackPromise = function (config, globalPlugins) {
  const compiler = webpack(config)

  // Setup in-memory file system
  const fs = createFsFromVolume(new Volume())
  fs.join = path.join.bind(path)

  // Handle both single compiler and multi-compiler
  if (compiler.compilers) {
    // MultiCompiler: set outputFileSystem on each child compiler
    compiler.compilers.forEach(c => {
      c.outputFileSystem = fs
    })
  } else {
    compiler.outputFileSystem = fs
  }

  if (Array.isArray(globalPlugins)) {
    globalPlugins.forEach(p => p.apply(compiler))
  }

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        reject(err)
      }
      resolve(stats)
    })
  })
}

async function executeAndGetLogs (fixture, globalPlugins, reporter) {
  const config = require(fixture)
  reporter = (globalPlugins || config.plugins)[0].reporter
  return captureReports(reporter, () => webpackPromise(config, globalPlugins))
}

it('integration : success', async () => {
  const logs = await executeAndGetLogs('./fixtures/success/webpack.config')

  expect(logs.join('\n')).toMatch(/DONE {2}Compiled successfully in (.\d*)ms/)
})

it('integration : module-errors', async () => {
  const logs = await executeAndGetLogs('./fixtures/module-errors/webpack.config.js')

  expect(logs).toEqual([
    'ERROR  Failed to compile with 3 errors',
    '',
    'This dependency was not found:',
    '',
    '* not-found in ./test/fixtures/module-errors/index.js',
    '',
    'To install it, you can run: npm install --save not-found',
    '',
    '',
    'These relative modules were not found:',
    '',
    '* ./non-existing in ./test/fixtures/module-errors/index.js',
    '* ../non-existing in ./test/fixtures/module-errors/index.js'
  ])
})

function filename (filePath) {
  return path.join(__dirname, path.normalize(filePath))
}

it('integration : should display eslint warnings', async () => {
  const logs = await executeAndGetLogs('./fixtures/eslint-warnings/webpack.config.js')

  const normalizedLogs = logs.join('\n')

  // eslint-webpack-plugin groups all warnings in a single message
  expect(normalizedLogs).toEqual(
    `WARN  Compiled with 1 warnings

warn  ESLintError

[eslint]${' '}
${filename('fixtures/eslint-warnings/index.js')}
  3:7  warning  'unused' is assigned a value but never used   no-unused-vars
  4:7  warning  'unused2' is assigned a value but never used  no-unused-vars

${filename('fixtures/eslint-warnings/module.js')}
  1:7  warning  'unused' is assigned a value but never used  no-unused-vars

✖ 3 problems (0 errors, 3 warnings)
`
  )
})

it('integration : babel syntax error', async () => {
  const logs = await executeAndGetLogs('./fixtures/babel-syntax/webpack.config')

  // Check structure of error output
  expect(logs[0]).toEqual('ERROR  Failed to compile with 1 errors')
  expect(logs[1]).toEqual('')
  expect(logs[2]).toEqual('error  in ./test/fixtures/babel-syntax/index.js')
  expect(logs[3]).toEqual('')

  // Check that the syntax error message contains the expected code snippet
  expect(logs[4]).toContain('Syntax Error:')
  expect(logs[4]).toContain('render()')
  expect(logs[4]).toContain('return <div>')
  expect(logs[4]).toContain('Add @babel/preset-react');
  expect(logs[4]).toContain("to the 'presets' section of your Babel config to enable transformation.");
})

it('integration : webpack multi compiler : success', async () => {
  // We apply the plugin directly to the compiler when targeting multi-compiler
  let globalPlugins = [new FriendlyErrorsWebpackPlugin()]
  const logs = await executeAndGetLogs('./fixtures/multi-compiler-success/webpack.config', globalPlugins)

  expect(logs.join('\n')).toMatch(/DONE {2}Compiled successfully in (.\d*)ms/)
})

it('integration : webpack multi compiler : module-errors', async () => {
  // We apply the plugin directly to the compiler when targeting multi-compiler
  let globalPlugins = [new FriendlyErrorsWebpackPlugin()]
  const logs = await executeAndGetLogs('./fixtures/multi-compiler-module-errors/webpack.config', globalPlugins)

  expect(logs).toEqual([
    'ERROR  Failed to compile with 2 errors',
    '',
    'This dependency was not found:',
    '',
    '* not-found in ./test/fixtures/multi-compiler-module-errors/index2.js',
    '',
    'To install it, you can run: npm install --save not-found',
    '',
    '',
    'This relative module was not found:',
    '',
    '* ./non-existing in ./test/fixtures/multi-compiler-module-errors/index.js'
  ])
})
