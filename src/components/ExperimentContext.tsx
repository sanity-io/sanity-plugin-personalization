import equal from 'fast-deep-equal'
import {createContext, useContext, useMemo, useState} from 'react'
import {type ObjectInputProps, useClient, useWorkspace} from 'sanity'
import {suspend} from 'suspend-react'

import {ExperimentContextProps, FieldPluginConfig} from '../types'

// This provider makes the plugin config available to all components in the document form
// But with experiments resolved

export const CONFIG_DEFAULT = {
  fields: [],
  apiVersion: '2024-11-07',
  experimentNameOverride: 'experiment',
  variantNameOverride: 'variant',
  variantId: 'variantId',
  variantArrayName: 'variants',
  experimentId: 'experimentId',
}

export const ExperimentContext = createContext<ExperimentContextProps>({
  ...CONFIG_DEFAULT,
  experiments: [],
  setSecret: () => undefined,
  secret: undefined,
})

export function useExperimentContext() {
  return useContext(ExperimentContext)
}

type ExperimentProps = ObjectInputProps & {
  experimentFieldPluginConfig: Required<FieldPluginConfig>
}

export function ExperimentProvider(props: ExperimentProps) {
  const {experimentFieldPluginConfig} = props
  const [secret, setSecret] = useState<string | undefined>()

  const client = useClient({apiVersion: experimentFieldPluginConfig.apiVersion})
  const workspace = useWorkspace()

  // Fetch or return experiments
  const experiments = Array.isArray(experimentFieldPluginConfig.experiments)
    ? experimentFieldPluginConfig.experiments
    : suspend(
        // eslint-disable-next-line require-await
        async () => {
          if (typeof experimentFieldPluginConfig.experiments === 'function') {
            return experimentFieldPluginConfig.experiments(client)
          }
          return experimentFieldPluginConfig.experiments
        },
        [workspace, secret],
        {equal},
      )

  const context = useMemo(
    () => ({...experimentFieldPluginConfig, experiments, secret, setSecret}),
    [experimentFieldPluginConfig, experiments, secret, setSecret],
  )

  return (
    <ExperimentContext.Provider value={context}>
      {props.renderDefault(props)}
    </ExperimentContext.Provider>
  )
}
