export const Scores = {
  name: 'scores',
  label: 'scores.title',
  type: 'scored'
}

Scores.collection = function () {
  throw new Error('Collection not yet implemented')
}

Scores.schema = {
  userId: String,
  sessionId: String,
  url: String,
  tempId: String,
  content: String,
  createdAt: Date
}
