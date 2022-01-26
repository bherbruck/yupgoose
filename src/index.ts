import type { object, InferType } from 'yup'
import type {
  Db,
  Document,
  Filter,
  FindOptions,
  OptionalUnlessRequiredId,
  UpdateFilter,
} from 'mongodb'

export const model = async <T extends ReturnType<typeof object>>(
  name: string,
  schema: T,
  db: Db
) => {
  type CollectionType = Partial<InferType<typeof schema>>
  type InputType = OptionalUnlessRequiredId<CollectionType>

  const collection = db.collection<CollectionType>(name)

  const uniqueFields = Object.entries(schema.describe().fields)
    // @ts-ignore
    .filter(([key, value]) => value?.meta?.unique)
    .map(([key, value]) => key)

  for (const field of uniqueFields ?? []) {
    try {
      await collection.createIndex({ [field]: 1 }, { unique: true })
    } catch (err) {
      // ignore duplicate key error
      if (err.code !== 85) console.error(err)
    }
  }

  const insertOne = async (data: InputType) => {
    if (!(await schema.isValid(data))) return null
    const result = await collection.insertOne(data)
    return result
  }

  const insertMany = async (data: InputType[]) => {
    if (!data.every((item) => schema.isValid(item))) return null
    const result = await collection.insertMany(data)
    return result
  }

  const findOne = async (filter: InputType) => {
    const result = await collection.findOne<typeof filter>(filter)
    return result
  }

  const findMany = async (filter: InputType, options?: FindOptions) => {
    const result = await collection
      .find<typeof filter>(filter, options)
      .toArray()
    return result
  }

  const updateOne: typeof collection.updateOne = async (
    filter: Filter<CollectionType>,
    update: CollectionType | UpdateFilter<CollectionType>
  ) => {
    return collection.updateOne(filter, update)
  }

  const updateMany: typeof collection.updateMany = async (
    filter: Filter<Document>,
    update: UpdateFilter<CollectionType>
  ) => {
    return collection.updateMany(filter, update)
  }

  const deleteOne = async (filter: Filter<CollectionType>) => {
    return await collection.deleteOne(filter)
  }

  const deleteMany = async (filter: InputType) => {
    return await collection.deleteMany(filter)
  }

  const type = null as InputType

  return {
    collection,
    schema,
    type,
    insertOne,
    insertMany,
    findMany,
    findOne,
    updateOne,
    updateMany,
    deleteOne,
    deleteMany,
  }
}
