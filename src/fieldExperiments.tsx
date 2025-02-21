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
import {VariantInput} from './components/VariantInput'
import {VariantPreview} from './components/VariantPreview'
import {FieldPluginConfig} from './types'
import {flattenSchemaType} from './utils/flattenSchemaType'

const createExperimentType = ({
  field,
  experimentNameOverride,
  variantNameOverride,
  variantId,
  variantArrayName,
  experimentId,
}: {
  field: string | FieldDefinition
  experimentNameOverride: string
  variantNameOverride: string
  variantId: string
  variantArrayName: string
  experimentId: string
}) => {
  const typeName = typeof field === `string` ? field : field.name
  const usedName = String(typeName[0]).toUpperCase() + String(typeName).slice(1)
  const variantName = `${variantNameOverride}${usedName}`

  return defineType({
    name: `${experimentNameOverride}${usedName}`,
    type: 'object',
    components: {
      field: (props) => (
        <ExperimentField
          {...props}
          experimentId={experimentId}
          experimentNameOverride={experimentNameOverride}
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
        name: experimentId,
        type: 'string',
        components: {
          input: (props) => (
            <ExperimentInput {...props} variantNameOverride={variantNameOverride} />
          ),
        },
        hidden: ({parent}) => {
          return !parent?.active
        },
      }),
      defineField({
        name: variantArrayName,
        type: 'array',
        hidden: ({parent}) => {
          return !parent?.[experimentId]
        },
        components: {
          input: (props: ArrayOfObjectsInputProps) => (
            <ArrayInput
              {...props}
              variantName={variantName}
              variantId={variantId}
              experimentId={experimentId}
            />
          ),
        },
        of: [
          defineField({
            name: variantName,
            type: variantName,
          }),
        ],
      }),
    ],
  })
}

const createVariantType = ({
  field,
  variantNameOverride,
  variantId,
  experimentId,
}: {
  field: string | FieldDefinition
  variantNameOverride: string
  variantId: string
  experimentId: string
}) => {
  const typeName = typeof field === `string` ? field : field.name
  const usedName = String(typeName[0]).toUpperCase() + String(typeName).slice(1)
  return defineType({
    name: `${variantNameOverride}${usedName}`,
    title: `${variantNameOverride} array ${usedName}`,
    type: 'object',
    components: {
      preview: VariantPreview,
      input: VariantInput,
    },
    fields: [
      {
        type: 'string',
        name: variantId,
        readOnly: true,
      },
      {
        type: 'string',
        name: experimentId,
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
        variant: variantId,
        experiment: experimentId,
        value: 'value',
      },
    },
  })
}

const fieldSchema = ({
  fields,
  experimentNameOverride,
  variantNameOverride,
  variantId,
  variantArrayName,
  experimentId,
}: Required<Omit<FieldPluginConfig, 'apiVersion' | 'experiments'>>) => {
  return [
    ...fields.map((field) =>
      createVariantType({field, variantNameOverride, variantId, experimentId}),
    ),
    ...fields.map((field) =>
      createExperimentType({
        field,
        experimentNameOverride,
        variantNameOverride,
        variantId,
        variantArrayName,
        experimentId,
      }),
    ),
  ]
}

export const fieldLevelExperiments = definePlugin<FieldPluginConfig>((config) => {
  const pluginConfig = {...CONFIG_DEFAULT, ...config}
  const {fields, experimentNameOverride, variantNameOverride} = pluginConfig

  const experimentId = `${experimentNameOverride}Id`
  const variantArrayName = `${variantNameOverride}s`
  const variantId = `${variantNameOverride}Id`

  const fieldSchemaConfig = fieldSchema({
    fields,
    experimentNameOverride,
    variantNameOverride,
    variantId,
    variantArrayName,
    experimentId,
  })
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
            name.startsWith(experimentNameOverride),
          )

          if (!hasExperiment) {
            return props.renderDefault(props)
          }
          const providerProps = {
            ...props,
            experimentFieldPluginConfig: {
              ...pluginConfig,
              variantId,
              variantArrayName,
              experimentId,
            },
          }
          return ExperimentProvider(providerProps)
        },
      },
    },
  }
})
