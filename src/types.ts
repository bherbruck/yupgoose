import type { InferType, object } from 'yup'

export type ObjectType = ReturnType<typeof object>

export type ModelType<T extends ObjectType> = InferType<T>

// export type
