import {
  ArrayOfObjectsInputProps,
  FieldDefinition,
  ObjectField,
  Path,
  PreviewProps,
  SanityClient,
  SchemaType,
} from 'sanity'

export type VariantType = {
  id: string
  label: string
}
export type ExperimentType = {
  id: string
  label: string
  variants: VariantType[]
}

export type FieldPluginConfig = {
  fields: (string | FieldDefinition)[]
  experiments: ExperimentType[] | ((client: SanityClient) => Promise<ExperimentType[]>)
  apiVersion?: string
  experimentNameOverride?: string
  variantNameOverride?: string
  variantId?: string
  variantArrayName?: string
  experimentId?: string
}

export type VariantPreviewProps = Omit<PreviewProps, 'SchemaType'> & {
  [key: string]: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
}

export type ExperimentContextProps = Required<FieldPluginConfig> & {
  experiments: ExperimentType[]
}

export type ArrayInputProps = ArrayOfObjectsInputProps & {
  variantName: string
  variantId: string
  experimentId: string
}

export type ObjectFieldWithPath = ObjectField<SchemaType> & {path: Path}

export type VariantGeneric<T> = {
  [key: string]: string | T | undefined
  _type: string
  value?: T
}

export type ExperimentGeneric<T> = {
  _type: string
  default?: T
  experimentValue?: string
  [key: string]:
    | Array<
        {
          _key: string
        } & VariantGeneric<T>
      >
    | string
    | T
    | undefined
}
