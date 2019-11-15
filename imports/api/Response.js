import { Meteor } from 'meteor/meteor'
const submitUrl = Meteor.settings.submitUrl

export const Response = {
  name: 'response',
  label: 'response.title',
  icon: 'edit'
}

Response.schema = {
  userId: String,
  type: String,
  contentId: String,
  taskId: String,
  sessionId: String,
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
    userId: String,
    type: String,
    contentId: String,
    taskId: String,
    sessionId: String,
    responses: {
      type: Array,
      optional: true
    },
    'responses.$': {
      type: String
    }
  },
  run: Meteor.isServer && function ({ userId, type, contentId, taskId, sessionId, responses }) {
    // TODO SECURITY check if sessions is running (call content server)
    // TODO and deny updating if session does not exists or is expired
    const timeStamp = new Date()
    const ResponseCollection = Response.collection()
    const responseDoc = ResponseCollection.findOne({ userId, contentId, taskId, sessionId })
    if (responseDoc) {
      return ResponseCollection.update(responseDoc._id, { $set: { responses, updatedAt: timeStamp } })
    } else {
      return ResponseCollection.insert({ userId, type, contentId, taskId, sessionId, responses, createdAt: timeStamp })
    }
  }
}
