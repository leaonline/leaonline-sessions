export const Data = {
  name: 'data',
  label: 'data.title',
  type: 'data'
}

Data.collection = function () {
  throw new Error('Collection not yet implemented')
}

Data.schema = {
  userId: String,
  sessionId: String,
  url: String,
  tempId: String,
  content: String,
  createdAt: Date
}