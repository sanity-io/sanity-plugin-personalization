import {
  ArrayOfObjectsInputProps,
  defineField,
  definePlugin,
  defineType,
  FieldDefinition,
  isObjectInputProps,
  SanityClient,
} from 'sanity'

import {PersonalisationArrayInput} from './components/personalisation/Array'
import {
  CONFIG_DEFAULT,
  PersonalistaionProvider,
} from './components/personalisation/PersonalisationContext'
import {PersonalisationVariantPreview} from './components/personalisation/VariantPreview'
import {PersonalisationPluginConfig, VariantType} from './types'
import {flattenSchemaType} from './utils/flattenSchemaType'

const createFieldType = ({
  field,
}: {
  field: string | FieldDefinition
  variants: VariantType[] | ((client: SanityClient) => Promise<VariantType[]>)
}) => {
  const typeName = typeof field === `string` ? field : field.name
  const usedName = String(typeName[0]).toUpperCase() + String(typeName).slice(1)
  const objectName = `variantPersonalisation${usedName}`

  return defineType({
    name: `personalisation${usedName}`,
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
        name: 'variants',
        type: 'array',
        components: {
          input: (props: ArrayOfObjectsInputProps) => (
            <PersonalisationArrayInput {...props} objectName={objectName} />
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
  variants: VariantType[] | ((client: SanityClient) => Promise<VariantType[]>)
}) => {
  const typeName = typeof field === `string` ? field : field.name
  const usedName = String(typeName[0]).toUpperCase() + String(typeName).slice(1)
  return defineType({
    name: `variantPersonalisation${usedName}`,
    title: `Personalisation array ${usedName}`,
    type: 'object',
    components: {
      preview: PersonalisationVariantPreview,
    },
    fields: [
      {
        type: 'string',
        name: 'variantId',
        readOnly: true,
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
        value: 'value',
      },
    },
  })
}

const fieldSchema = ({fields, variants}: PersonalisationPluginConfig) => {
  return [
    ...fields.map((field) => createFieldObjectType({field, variants})),
    ...fields.map((field) => createFieldType({field, variants})),
  ]
}

export const fieldLevelPersonalisation = definePlugin<PersonalisationPluginConfig>((config) => {
  const pluginConfig = {...CONFIG_DEFAULT, ...config}
  const {fields, variants} = pluginConfig
  const fieldSchemaConfig = fieldSchema({fields, variants})
  return {
    name: 'sanity-personalistaion-plugin-field-level-personalisation',
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
          const hasPersonalisation = flatFieldTypeNames.some((name) =>
            name.startsWith('personalisation'),
          )

          if (!hasPersonalisation) {
            return props.renderDefault(props)
          }
          const providerProps = {...props, personalisationFieldPluginConfig: pluginConfig}
          return PersonalistaionProvider(providerProps)
        },
      },
    },
  }
})
