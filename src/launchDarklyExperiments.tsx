import {definePlugin, FieldDefinition, isObjectInputProps} from 'sanity'

import {Secrets} from './components/Secrets'
import {fieldLevelExperiments} from './fieldExperiments'
import {flattenSchemaType} from './utils/flattenSchemaType'
import {getExperiments} from './utils/launchDarkly'

export type LaunchDarklyFieldLevelConfig = {
  fields: (string | FieldDefinition)[]
  projectKey: string
  tags?: string[]
}

export const launchDarklyFieldLevel = definePlugin<LaunchDarklyFieldLevelConfig>((config) => {
  const {fields, projectKey, tags} = config
  return {
    name: 'sanity-growthbook-personalistaion-plugin-field-level-experiments',
    plugins: [
      fieldLevelExperiments({
        fields,
        experiments: (client) => getExperiments({client, projectKey, tags}),
      }),
    ],

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

          const hasExperiment = flatFieldTypeNames.some((name) => name.startsWith('experiment'))

          if (!hasExperiment) {
            return props.renderDefault(props)
          }
          return Secrets(props, 'launchdarkly')
        },
      },
    },
  }
})
