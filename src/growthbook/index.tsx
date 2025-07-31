import {definePlugin, isObjectInputProps, SanityClient} from 'sanity'

import {ExperimentProvider} from '../components/ExperimentContext'
import {fieldLevelExperiments as baseFieldLevelExperiments} from '../fieldExperiments'
import {flattenSchemaType} from '../utils/flattenSchemaType'
import {GROWTHBOOK_CONFIG_DEFAULT, GrowthbookProvider} from './Components/GrowthbookContext'
import {createEnhancedFieldSchema} from './createEnhancedFields'
import {GrowthbookExperimentFieldPluginConfig} from './types'
import {getExperiments} from './utils'

export const fieldLevelExperiments = definePlugin<GrowthbookExperimentFieldPluginConfig>(
  (config) => {
    const pluginConfig = {...GROWTHBOOK_CONFIG_DEFAULT, ...config}
    const {fields, environment, project, convertBooleans, baseUrl, tags, enableAudiences} =
      pluginConfig

    // If audiences are not enabled, just use the base plugin
    if (!enableAudiences) {
      return {
        name: 'sanity-growthbook-personalistaion-plugin-field-level-experiments',
        plugins: [
          baseFieldLevelExperiments({
            fields,
            experiments: (client) =>
              getExperiments({client, environment, baseUrl, project, convertBooleans, tags}),
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

              const providerProps = {
                ...props,
                growthbookFieldPluginConfig: {
                  ...pluginConfig,
                },
              }
              return GrowthbookProvider(providerProps)
            },
          },
        },
      }
    }

    // Use enhanced schema with audience support
    const experimentNameOverride = 'experiment'
    const variantNameOverride = 'variant'
    const variantId = 'variantId'
    const variantArrayName = 'variants'
    const experimentId = 'experimentId'

    const fieldSchemaConfig = createEnhancedFieldSchema({
      fields,
      experimentNameOverride,
      variantNameOverride,
      variantId,
      variantArrayName,
      experimentId,
      enableAudiences: true,
    })

    return {
      name: 'sanity-growthbook-personalistaion-plugin-field-level-experiments',
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

            const hasExperiment = flatFieldTypeNames.some((name) => name.startsWith('experiment'))

            if (!hasExperiment) {
              return props.renderDefault(props)
            }

            // We need to provide both experiment and audience contexts
            // First wrap with experiment context, then audience context

            const experimentProviderProps = {
              ...props,
              experimentFieldPluginConfig: {
                fields,
                experiments: (client: SanityClient) =>
                  getExperiments({client, environment, baseUrl, project, convertBooleans, tags}),
                apiVersion: '2024-11-07',
                experimentNameOverride,
                variantNameOverride,
                variantId,
                variantArrayName,
                experimentId,
              },
            }

            // Return nested providers: GrowthBook (audiences) wrapping Experiment (experiments)
            return (
              <GrowthbookProvider {...props} growthbookFieldPluginConfig={pluginConfig}>
                <ExperimentProvider {...experimentProviderProps} />
              </GrowthbookProvider>
            )
          },
        },
      },
    }
  },
)
