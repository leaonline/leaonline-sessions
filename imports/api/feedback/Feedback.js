export const Feedback = {
  name: 'feedback',
  label: 'feedback.title',
  type: 'feedback'
}

Feedback.collection = function () {
  throw new Error('Collection not yet implemented')
}

Feedback.schema = {
  userId: String,
  sessionId: String,
  url: String,
  tempId: String,
  content: String,
  createdAt: Date,
  userResponse: String
}
