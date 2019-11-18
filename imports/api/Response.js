import { Meteor } from 'meteor/meteor'

const submitUrl = Meteor.settings.submitUrl
const evalContext = Meteor.settings.eval

export const Response = {
  name: 'response',
  label: 'response.title',
  icon: 'edit'
}

Response.schema = {
  userId: String,
  type: String,
  sessionId: String,
  taskId: String,
  page: String,
  contentId: {
    type: String,
    optional: true
  },
  responses: {
    type: Array,
    optional: true
  },
  'responses.$': {
    type: String,
    optional: true
  },
  createdAt: Date,
  updatedAt: {
    type: Date,
    optional: true
  }
}

Response.httpRoutes = {}

Response.httpRoutes.submit = {
  name: 'response.httpRoutes.submit',
  method: 'post',
  projection: {},
  numRequests: 10,
  timeInterval: 1000,
  path: submitUrl,
  schema: {
    /**
     * _id (not username!) of the user who responded
     */
    userId: String,

    /**
     * _id of the session context of the task
     */
    sessionId: String,

    /**
     * lea taskId (not _id!) of the task, for instance w0001
     */
    taskId: String,

    /**
     * Number of the page, that this items has been placed.
     * The page also indicates the task index, which is used
     * to further distinct the repsonse contex in the evaluation environment.
     */
    page: String,

    /**
     * item type. For h5p items it is for example multichoice or blanks
     */
    type: String,

    /**
     * id of h5p format, if used
     */
    contentId: {
      type: String,
      optional: true
    },

    /**
     * Raw responses, sorted by their natural occurrence in the format.
     */
    responses: {
      type: Array,
      optional: true
    },
    'responses.$': {
      type: String,
      optional: true
    }
  },
  run: Meteor.isServer && Meteor.bindEnvironment(function ({ userId, type, contentId, page, taskId, sessionId, responses }) {
    // TODO SECURITY check if sessions is running (call content server)
    // TODO and deny updating if session does not exists or is expired
    const timeStamp = new Date()
    const ResponseCollection = Response.collection()
    console.log({ userId, type, contentId, page, taskId, sessionId, responses })
    console.log(ResponseCollection.findOne({ userId, sessionId, taskId }), ResponseCollection.find().fetch())
    const responseDoc = ResponseCollection.findOne({ userId, contentId, page, taskId, sessionId })
    if (responseDoc) {
      return ResponseCollection.update(responseDoc._id, { $set: { responses, updatedAt: timeStamp } })
    } else {
      return ResponseCollection.insert({
        userId,
        type,
        contentId,
        page,
        taskId,
        sessionId,
        responses,
        createdAt: timeStamp
      })
    }
  })
}

const idSep = evalContext.responseIdSeparator // for example _

Response.httpRoutes.evaluateSession = {
  name: 'response.httpRoutes.evaluateSession',
  method: 'post',
  projection: {},
  numRequests: 10,
  timeInterval: 1000,
  path: evalContext.path,
  schema: {
    userId: String,
    sessionId: String
  },
  run: Meteor.isServer && function ({ userId, sessionId }) {
    // TODO SECURITY check if sessions is running (call content server)
    // TODO and deny updating if session does not exists or is expired
    console.log(userId, sessionId)
    const ResponseCollection = Response.collection()
    const allResponses = ResponseCollection.find({ userId, sessionId }).fetch()
    console.log(allResponses.length)
    const responseIds = []
    const responseValues = []

    let responseIdPrefix, responseId, responseIndex, responseValue
    allResponses.forEach(responseDoc => {
      // example:
      // w0001 _ 01 _ 01
      // taskId  page responseIndex
      // where _ is the idSeparator
      const page = toDoubleNumString(responseDoc.page)
      responseIdPrefix = `${responseDoc.taskId}${idSep}${page}${idSep}`
      responseDoc.responses.forEach((value, index) => {
        responseIndex = toDoubleNumString(index)
        responseId = `${responseIdPrefix}${idSep}${responseIndex}`
        responseValue = typeof value === 'undefined' || value === null || value === '__undefined__' ? '' : value
        responseIds.push(responseId)
        responseValues.push(responseValue)
      })
    })

    const requestParams = generateRequestParams(responseIds, responseValues)
    console.log(requestParams)
  }
}

function toDoubleNumString (num) {
  if (typeof num !== 'number' || num < 1) {
    throw new Error(`Expected number > 1, got ${num}`)
  }
  const strNum = parseInt(num, 10).toString(10)
  if (num >= 10) {
    return strNum
  } else {
    return `0${strNum}`
  }
}

const sep = evalContext.separator

function generateRequestParams (responseIds, responseValues) {
  let baseStr = 'ID' + sep
  responseIds.forEach(id => {
    baseStr = baseStr + id + sep
  })
  responseValues.forEach(value => {
    baseStr = baseStr + value + sep
  })
  return baseStr
}
