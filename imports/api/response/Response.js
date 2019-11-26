import { Meteor } from 'meteor/meteor'
import { HTTP } from 'meteor/http'
import { EvalRequestCSVStringBuilder } from './evalRequestCSVStringBuilder'
import { Feedback } from '../feedback/Feedback'
import { Scores } from '../scores/Scores'
import { Data } from '../data/Data'

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
  tokenRequired: true,
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

const evalUrl = evalContext.base + evalContext.url
const evalParam = evalContext.paramName

Response.httpRoutes.evaluateSession = {
  name: 'response.httpRoutes.evaluateSession',
  method: 'post',
  projection: {},
  numRequests: 10,
  timeInterval: 1000,
  path: evalContext.path,
  tokenRequired: true,
  schema: {
    userId: String,
    sessionId: String
  },
  run: Meteor.isServer && function ({ userId, sessionId }) {
    // to reduce the amount of evaluations for re-runs
    // we just return the already saved evaluation
    const existingFeedbackDoc = Feedback.collection().findOne({ userId, sessionId })
    if (existingFeedbackDoc) {
      return existingFeedbackDoc
    }

    // Then we collection all responses and build a request
    // which uses for our current opencpu setup a csv-styled query string.
    //
    // In order to build the request string we use a dedicated String Builder
    const ResponseCollection = Response.collection()
    const allResponses = ResponseCollection.find({ userId, sessionId }).fetch()
    const requestBuilder = new EvalRequestCSVStringBuilder(evalContext)
    allResponses.forEach(responseDoc => {
      const pageIndex = responseDoc.page
      const taskId = responseDoc.taskId
      responseDoc.responses.forEach((value, responseIndex) => {
        requestBuilder.add({ taskId, value, pageIndex, responseIndex })
      })
    })

    const requestStr = requestBuilder.build()
    console.log(requestStr)

    const callOptions = { params: { [ evalParam ]: requestStr } }
    const response = HTTP.post(evalUrl, callOptions)
    const contentList = response.content.split('\n')
    const csvResults = contentList.filter(entry => entry.indexOf('.csv') > -1)
    const createdAt = new Date()

    const userResponse =  HTTP.get(evalContext.base + contentList[0])
    console.log(userResponse.content)

    // SAVE CSV FILES
    const allResults = csvResults.map(resultStr => {
      const url = resultStr
      const type = getType(resultStr)
      const tempId = getTmpId(resultStr)
      const getResult = HTTP.get(evalContext.base + resultStr)
      const content = getResult.statusCode === 200 && getResult.content
      return { userId, sessionId, url, type, tempId, content, createdAt }
    })

    // save all the generated csv in their respective collection

    const scoredResult = allResults.find(el => el.type === 'scored')
    Scores.collection().insert(scoredResult)

    const dataResult = allResults.find(el => el.type === 'data')
    Data.collection().insert(dataResult)

    const feedBackResult = allResults.find(el => el.type === 'feedback')
    feedBackResult.userResponse = userResponse && userResponse.statusCode === 200 && userResponse.content
    Feedback.collection().insert(feedBackResult)

    return feedBackResult
  }
}

function getType (csvStr) {
  if (csvStr.indexOf('data') > -1) return 'data'
  if (csvStr.indexOf('feedback') > -1) return 'feedback'
  if (csvStr.indexOf('scored') > -1) return 'scored'
}

function getTmpId (csvStr) {
  const split = csvStr && csvStr.split('/')
  return split && split[ 2 ]
}