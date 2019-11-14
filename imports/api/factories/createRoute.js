import { Schema } from '../schema/Schema'
import { getCreateRoutes } from 'meteor/leaonline:factories/routes/createRoute'

const allowedOrigins = Meteor.settings.allowedOrigins

export const createRoutes = getCreateRoutes(Schema.create, allowedOrigins, true)
