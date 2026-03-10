const { stripVTControlCharacters } = require('node:util')

module.exports = {
  captureReports: async (output, callback) => {
    output.log = jest.fn()
    output.clearConsole = jest.fn()
    const logs = []

    await callback()

    for (const args of output.log.mock.calls) {
      logs.push(stripVTControlCharacters(args.join(' ')).trim())
    }
    return logs
  }
}
