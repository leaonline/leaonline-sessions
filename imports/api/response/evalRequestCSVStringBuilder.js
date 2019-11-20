/**
 * A builder for creating requests to the eval server.
 * @param startIndex {number|string} Sets, whether indices start with 0 or 1
 * @param responseIdSeparator {string} Defines the separator character within ids.
 * @param validate {RegExp} Pattern to validate a single responseId
 * @param idPrefix {string} Prefix, which indicate the first entry in the indices row
 * @param valuePrefix {string} Prefix, which indicate the first entry in the values row
 * @param newLineChar {string} a character, which can be used ot indicate a newline
 * @param separator {string} a character, which separates the entries within a row
 * @constructor
 */
function EvalRequestCSVStringBuilder ({ startIndex, responseIdSeparator, idPrefix, valuePrefix, newLineChar, separator, validate }) {
  this.responseIds = []
  this.responseValues = []

  // responseId related
  this.startIndex = parseInt(startIndex, 10)
  this.responseIdSeparator = responseIdSeparator
  this.responseIdValidator = new RegExp(validate, 'g')
  this.responseIdValidatorStr = this.responseIdValidator.toString()

  // csv string related
  this.idPrefix = idPrefix
  this.valuePrefix = valuePrefix
  this.newLineChar = newLineChar
  this.separator = separator

}

EvalRequestCSVStringBuilder.prototype.build = function () {
  // sanity check since we need same length arrays with
  // entries at the same indices of these arrays
  if (this.responseIds.length !== this.responseValues.length) {
    throw new Error(`Unexpected mismatch of responseIds and responseValues, ${this.responseIds.length} !== ${this.responseValues.length}`)
  }

  const tokens = []
  const addToken = value => {
    tokens.push(value)
    tokens.push(this.separator)
  }

  addToken(this.idPrefix)
  this.responseIds.forEach(responseId => addToken(responseId))

  addToken(this.valuePrefix)
  this.responseValues.forEach(responseValue => addToken(responseValue))

  return tokens.join('')
}


EvalRequestCSVStringBuilder.prototype.add = function ({ taskId, pageIndex, responseIndex, value }) {
  const pageStr = toNumStr(pageIndex + this.startIndex)
  const responseIndexStr = toNumStr(responseIndex + this.startIndex)
  const responseValueStr = typeof value === 'undefined' || value === null || value === '__undefined__' ? '' : value
  const responseId = this.buildId(taskId, pageStr, responseIndexStr)
  this.validateId(responseId)
  this.responseIds.push(responseId)
  this.responseValues.push(responseValueStr)
  return this
}

EvalRequestCSVStringBuilder.prototype.buildId = function (taskId, pageIndex, responseIndex) {
  return `${taskId}${this.responseIdSeparator}${pageIndex}${this.responseIdSeparator}${responseIndex}`
}

EvalRequestCSVStringBuilder.prototype.validateId = function (responseId) {
  if (!this.responseIdValidator.test(responseId)) {
    throw new Error(`ResponseId <${responseId}> does not match pattern <${this.responseIdValidatorStr}>`)
  }
}

function toNumStr (value) {
  const type = typeof value
  if (value === null || type === 'undefined') {
    throw new Error(`Unexpected undefined or null value`)
  }
  let strValue = type === 'string'
    ? value
    : value.toString()
  return strValue.length < 2 ? `0${strValue}` : strValue
}

export { EvalRequestCSVStringBuilder }
