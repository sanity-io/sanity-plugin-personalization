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
}

export type VariantPreviewProps = PreviewProps & {
  experiment: string
  variant: string
  value: unknown
}

export type ExperimentContextProps = Required<FieldPluginConfig> & {
  experiments: ExperimentType[]
}

export type ArrayInputProps = ArrayOfObjectsInputProps & {
  objectName: string
}

export type ObjectFieldWithPath = ObjectField<SchemaType> & {path: Path}
