import { Scores } from '../../api/scores/Scores'
import { createCollection } from '../../api/factories/createCollection'

const ScoresCollection = createCollection(Scores)
Scores.collection = function () {
  return ScoresCollection
}
