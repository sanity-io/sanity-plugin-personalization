import {
  ArrayOfObjectsInputProps,
  defineField,
  definePlugin,
  defineType,
  FieldDefinition,
  isObjectInputProps,
} from 'sanity'

import {ArrayInput} from './components/Array'
import {CONFIG_DEFAULT, ExperimentProvider} from './components/ExperimentContext'
import {ExperimentField} from './components/ExperimentField'
import {ExperimentInput} from './components/ExperimentInput'
import {VariantPreview} from './components/VariantPreview'
import {FieldPluginConfig} from './types'
import {flattenSchemaType} from './utils/flattenSchemaType'

const createFieldType = ({
  field,
  fieldNameOverride,
  objectNameOverride,
}: {
  field: string | FieldDefinition
  fieldNameOverride: string
  objectNameOverride: string
}) => {
  const typeName = typeof field === `string` ? field : field.name
  const usedName = String(typeName[0]).toUpperCase() + String(typeName).slice(1)
  const objectName = `${objectNameOverride}${usedName}`

  return defineType({
    name: `${fieldNameOverride}${usedName}`,
    type: 'object',
    components: {
      field: (props) => (
        <ExperimentField
          {...props}
          fieldNameOverride={fieldNameOverride}
          objectNameOverride={objectNameOverride}
        />
      ),
    },
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
        name: 'active',
        type: 'boolean',
        hidden: true,
      }),
      defineField({
        title: fieldNameOverride,
        name: `${fieldNameOverride}Id`,
        type: 'string',
        components: {
          input: (props) => <ExperimentInput {...props} objectNameOverride={objectNameOverride} />,
        },
        hidden: ({parent}) => {
          return !parent?.active
        },
      }),
      defineField({
        name: `${objectNameOverride}s`,
        type: 'array',
        hidden: ({parent}) => {
          return !parent?.[`${fieldNameOverride}Id`]
        },
        components: {
          input: (props: ArrayOfObjectsInputProps) => (
            <ArrayInput
              {...props}
              fieldNameOverride={fieldNameOverride}
              objectNameOverride={objectNameOverride}
              objectName={objectName}
            />
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
  fieldNameOverride,
  objectNameOverride,
}: {
  field: string | FieldDefinition
  fieldNameOverride: string
  objectNameOverride: string
}) => {
  const typeName = typeof field === `string` ? field : field.name
  const usedName = String(typeName[0]).toUpperCase() + String(typeName).slice(1)
  return defineType({
    name: `${objectNameOverride}${usedName}`,
    title: `${objectNameOverride} array ${usedName}`,
    type: 'object',
    components: {
      preview: VariantPreview,
    },
    fields: [
      {
        type: 'string',
        name: `${objectNameOverride}Id`,
        readOnly: true,
      },
      {
        type: 'string',
        name: `${fieldNameOverride}Id`,
        hidden: true,
      },
      typeof field === `string`
        ? // Define a simple field if all we have is the name as a string
          defineField({
            name: 'value',
            type: field,
            // hidden: ({parent}) => !parent?.[`${objectNameOverride}Id`],
          })
        : // Pass in the configured options, but overwrite the name
          {
            ...field,
            name: 'value',
            // hidden: ({parent}) => !parent?.[`${objectNameOverride}Id`],
          },
    ],
    preview: {
      select: {
        variant: `${objectNameOverride}Id`,
        experiment: `${fieldNameOverride}Id`,
        value: 'value',
      },
    },
  })
}

const fieldSchema = ({
  fields,
  fieldNameOverride,
  objectNameOverride,
}: Required<Omit<FieldPluginConfig, 'apiVersion' | 'experiments'>>) => {
  return [
    ...fields.map((field) => createFieldObjectType({field, fieldNameOverride, objectNameOverride})),
    ...fields.map((field) => createFieldType({field, fieldNameOverride, objectNameOverride})),
  ]
}

export const fieldLevelExperiments = definePlugin<FieldPluginConfig>((config) => {
  const pluginConfig = {...CONFIG_DEFAULT, ...config}
  const {fields, fieldNameOverride, objectNameOverride} = pluginConfig
  const fieldSchemaConfig = fieldSchema({fields, fieldNameOverride, objectNameOverride})
  return {
    name: 'sanity-personalistaion-plugin-field-level-experiments',
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
          const hasExperiment = flatFieldTypeNames.some((name) =>
            name.startsWith(fieldNameOverride),
          )

          if (!hasExperiment) {
            return props.renderDefault(props)
          }
          const providerProps = {...props, experimentFieldPluginConfig: pluginConfig}
          return ExperimentProvider(providerProps)
        },
      },
    },
  }
})
