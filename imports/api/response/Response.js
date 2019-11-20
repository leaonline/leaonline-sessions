import { Meteor } from 'meteor/meteor'
import { EvalRequestCSVStringBuilder } from './evalRequestCSVStringBuilder'

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

const idSep = evalContext.responseIdSeparator // for example _

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
    // TODO SECURITY check if sessions is running (call content server)
    // TODO and deny updating if session does not exists or is expired
    const ResponseCollection = Response.collection()
    const allResponses = ResponseCollection.find({ userId, sessionId }).fetch()
    const requestBuilder = new EvalRequestCSVStringBuilder(evalContext)

    allResponses.forEach(responseDoc => requestBuilder.add(responseDoc))
    const requestStr = requestBuilder.build()
    console.log(requestStr)


    return {
      'fulfilled': [
        {
          'competencyId': 'abc1',
          'label': 'competencies.reading.1'
        },
        {
          'competencyId': 'abc2',
          'label': 'competencies.reading.2'
        }
      ],
      'toImprove': [
        {
          'competencyId': 'abc3',
          'label': 'competencies.reading.3'
        },
        {
          'competencyId': 'abc4',
          'label': 'competencies.reading.4'
        }
      ]
    }
  }
}

