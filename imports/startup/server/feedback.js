import { Feedback } from '../../api/feedback/Feedback'
import { createCollection } from '../../api/factories/createCollection'

const FeedbackCollection = createCollection(Feedback)
Feedback.collection = function () {
  return FeedbackCollection
}
