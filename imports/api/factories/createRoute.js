import { Meteor } from 'meteor/meteor'
import { Schema } from '../schema/Schema'
import { getCreateRoutes } from 'meteor/leaonline:factories/routes/createRoute'

const allowedOrigins = Meteor.settings.allowedOrigins
const sessionCredential = Meteor.settings.sessionCredential

export const createRoutes = getCreateRoutes({
  allowedOrigins: allowedOrigins,
  schemaResolver: Schema.create,
  xAuthToken: sessionCredential,
  debug: false
})
