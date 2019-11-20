import { Response } from '../../api/response/Response'
import { createRoutes } from '../../api/factories/createRoute'
import { createCollection } from '../../api/factories/createCollection'

const ResponseCollection = createCollection(Response)
Response.collection = function () {
  return ResponseCollection
}

const httpRoutes = Object.values(Response.httpRoutes)
createRoutes(httpRoutes)
