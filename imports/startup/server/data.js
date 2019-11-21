import { Data } from '../../api/data/Data'
import { createCollection } from '../../api/factories/createCollection'

const DataCollection = createCollection(Data)
Data.collection = function () {
  return DataCollection
}
