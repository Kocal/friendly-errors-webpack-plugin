'use strict';

const path = require('path');
const chalk = require('chalk');
const os = require('os');
const transformErrors = require('./core/transformErrors');
const formatErrors = require('./core/formatErrors');
const Output = require('./output');
const utils = require('./utils');

const concat = utils.concat;
const uniqueBy = utils.uniqueBy;

const defaultTransformers = [
  require('./transformers/babelSyntax'),
  require('./transformers/moduleNotFound'),
  require('./transformers/esLintError')
];

const defaultFormatters = [
  require('./formatters/moduleNotFound'),
  require('./formatters/eslintError'),
  require('./formatters/defaultError')
];

const logLevels = {
  'INFO': 0,
  'WARNING': 1,
  'ERROR': 2,
  'SILENT': 3
}

class FriendlyErrorsWebpackPlugin {

  constructor(options) {
    options = options || {};
    this.compilationSuccessInfo = options.compilationSuccessInfo || {};
    this.onErrors = options.onErrors;
    this.shouldClearConsole = options.clearConsole == null ? true : Boolean(options.clearConsole);
    this.output = new Output();
    this.logLevel = logLevels[options.logLevel] || '0'
    this.formatters = concat(defaultFormatters, options.additionalFormatters);
    this.transformers = concat(defaultTransformers, options.additionalTransformers);
  }

  apply(compiler) {

    const doneFn = stats => {
      this.clearConsole();

      const hasErrors = stats.hasErrors();
      const hasWarnings = stats.hasWarnings();

      let cleared = false

      if (!hasErrors && !hasWarnings && this.logLevel < 1) {
        cleared = this.clearConsole();
        this.displaySuccess(stats);
        return;
      }

      if (hasWarnings && this.logLevel < 2) {
        cleared = this.clearConsole();
        this.displayErrors(extractErrorsFromStats(stats, 'warnings'), 'warning');
      }

      if (hasErrors && this.logLevel < 3) {
        cleared || this.clearConsole();
        this.displayErrors(extractErrorsFromStats(stats, 'errors'), 'error');
        return;
      }
    };

    const invalidFn = () => {
      this.clearConsole();
      this.output.title('info', 'WAIT', 'Compiling...');
    };

    if (compiler.hooks) {
      const plugin = { name: 'FriendlyErrorsWebpackPlugin' };

      compiler.hooks.done.tap(plugin, doneFn);
      compiler.hooks.invalid.tap(plugin, invalidFn);
    } else {
      compiler.plugin('done', doneFn);
      compiler.plugin('invalid', invalidFn);
    }
  }

  clearConsole() {
    if (this.shouldClearConsole) {
      this.output.clearConsole();
    }
    return true
  }

  displaySuccess(stats) {
    const time = getCompileTime(stats);
    this.output.title('success', 'DONE', 'Compiled successfully in ' + time + 'ms');

    if (this.compilationSuccessInfo.messages) {
      this.compilationSuccessInfo.messages.forEach(message => this.output.info(message));
    }
    if (this.compilationSuccessInfo.notes) {
      this.output.log();
      this.compilationSuccessInfo.notes.forEach(note => this.output.note(note));
    }
  }

  displayErrors(errors, severity) {
    const processedErrors = transformErrors(errors, this.transformers);

    const topErrors = getMaxSeverityErrors(processedErrors);
    const nbErrors = topErrors.length;

    const subtitle = severity === 'error' ?
      `Failed to compile with ${nbErrors} ${severity}s` :
      `Compiled with ${nbErrors} ${severity}s`;
    this.output.title(severity, severity.toUpperCase(), subtitle);

    if (this.onErrors) {
      this.onErrors(severity, topErrors);
    }

    formatErrors(topErrors, this.formatters, severity)
      .forEach(chunk => this.output.log(chunk));
  }
}

function extractErrorsFromStats(stats, type) {
  if (isMultiStats(stats)) {
    const errors = stats.stats
      .reduce((errors, stats) => errors.concat(extractErrorsFromStats(stats, type)), []);
    // Dedupe to avoid showing the same error many times when multiple
    // compilers depend on the same module.
    return uniqueBy(errors, error => error.message);
  }
  return stats.compilation[type];
}

function getCompileTime(stats) {
  if (isMultiStats(stats)) {
    // Webpack multi compilations run in parallel so using the longest duration.
    // https://webpack.github.io/docs/configuration.html#multiple-configurations
    return stats.stats
      .reduce((time, stats) => Math.max(time, getCompileTime(stats)), 0);
  }
  return stats.endTime - stats.startTime;
}

function isMultiStats(stats) {
  return stats.stats;
}

function getMaxSeverityErrors(errors) {
  const maxSeverity = getMaxInt(errors, 'severity');
  return errors.filter(e => e.severity === maxSeverity);
}

function getMaxInt(collection, propertyName) {
  return collection.reduce((res, curr) => {
    return curr[propertyName] > res ? curr[propertyName] : res;
  }, 0)
}

module.exports = FriendlyErrorsWebpackPlugin;
