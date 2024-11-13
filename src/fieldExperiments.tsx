import {
  ArrayOfObjectsInputProps,
  defineField,
  definePlugin,
  defineType,
  FieldDefinition,
  isObjectInputProps,
  SanityClient,
} from 'sanity'

import {ArrayImput} from './components/Array'
import {CONFIG_DEFAULT, ExperimentProvider} from './components/ExperimentContext'
import {ExperimentInput} from './components/ExperimentInput'
import {VariantPreview} from './components/VariantPreview'
import {ExperimentType, FieldPluginConfig} from './types'
import {flattenSchemaType} from './utils/flattenSchemaType'

const createFieldType = ({
  field,
}: {
  field: string | FieldDefinition
  experiments: ExperimentType[] | ((client: SanityClient) => Promise<ExperimentType[]>)
}) => {
  const typeName = typeof field === `string` ? field : field.name
  const usedName = String(typeName[0]).toUpperCase() + String(typeName).slice(1)
  const objectName = `variant${usedName}`

  return defineType({
    name: `experiment${usedName}`,
    type: 'object',
    fields: [
      typeof field === `string`
        ? // Define a simple field if all we have is the name as a string
          defineField({
            name: 'default',
            type: field,
          })
        : // Pass in the configured options, but overwrite the name
          {
            ...field,
            name: 'default',
          },
      defineField({
        title: 'Experiment',
        name: 'experimentValue',
        type: 'string',
        components: {
          input: ExperimentInput,
        },
      }),
      defineField({
        name: 'variants',
        type: 'array',
        hidden: ({parent}) => {
          return !parent?.experimentValue
        },
        components: {
          input: (props: ArrayOfObjectsInputProps) => (
            <ArrayImput {...props} objectName={objectName} />
          ),
        },
        of: [
          defineField({
            name: objectName,
            type: objectName,
          }),
        ],
      }),
    ],
  })
}

const createFieldObjectType = ({
  field,
}: {
  field: string | FieldDefinition
  experiments: ExperimentType[] | ((client: SanityClient) => Promise<ExperimentType[]>)
}) => {
  const typeName = typeof field === `string` ? field : field.name
  const usedName = String(typeName[0]).toUpperCase() + String(typeName).slice(1)
  return defineType({
    name: `variant${usedName}`,
    title: `Experiment array ${usedName}`,
    type: 'object',
    components: {
      preview: VariantPreview,
    },
    fields: [
      {
        type: 'string',
        name: 'variantId',
        readOnly: true,
      },
      {
        type: 'string',
        name: 'experimentId',
        hidden: true,
      },
      typeof field === `string`
        ? // Define a simple field if all we have is the name as a string
          defineField({
            name: 'value',
            type: field,
            hidden: ({parent}) => !parent?.variantId,
          })
        : // Pass in the configured options, but overwrite the name
          {
            ...field,
            name: 'value',
            hidden: ({parent}) => !parent?.variantId,
          },
    ],
    preview: {
      select: {
        variant: 'variantId',
        experiment: 'experimentId',
        value: 'value',
      },
    },
  })
}

const fieldSchema = ({fields, experiments}: FieldPluginConfig) => {
  return [
    ...fields.map((field) => createFieldObjectType({field, experiments})),
    ...fields.map((field) => createFieldType({field, experiments})),
  ]
}

export const fieldLevelExperiments = definePlugin<FieldPluginConfig>((config) => {
  const pluginConfig = {...CONFIG_DEFAULT, ...config}
  const {fields, experiments} = pluginConfig
  const fieldSchemaConfig = fieldSchema({fields, experiments})
  return {
    name: 'sanity-plugin-field-level-experiments',
    schema: {
      types: fieldSchemaConfig,
    },
    form: {
      components: {
        input: (props) => {
          const isRootInput = props.id === 'root' && isObjectInputProps(props)

          if (!isRootInput) {
            return props.renderDefault(props)
          }

          const flatFieldTypeNames = flattenSchemaType(props.schemaType).map(
            (field) => field.type.name,
          )
          const hasInternationalizedArray = flatFieldTypeNames.some((name) =>
            name.startsWith('experiment'),
          )

          if (!hasInternationalizedArray) {
            return props.renderDefault(props)
          }
          const providerProps = {...props, experimentFieldPluginConfig: pluginConfig}
          return ExperimentProvider(providerProps)
        },
      },
    },
  }
})
