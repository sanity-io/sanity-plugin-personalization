import equal from 'fast-deep-equal'
import {createContext, useContext, useMemo} from 'react'
import {type ObjectInputProps, useClient, useWorkspace} from 'sanity'
import {suspend} from 'suspend-react'

import {PersonalisationPluginConfig, PersonalistaionContextProps} from '../../types'

// This provider makes the plugin config available to all components in the document form
// But with experiments resolved

export const CONFIG_DEFAULT = {
  fields: [],
  apiVersion: '2024-11-07',
}

export const PersonalistaionContext = createContext<PersonalistaionContextProps>({
  ...CONFIG_DEFAULT,
  variants: [],
})

export function usePersonalistaionContext() {
  return useContext(PersonalistaionContext)
}

type VariantProps = ObjectInputProps & {
  personalisationFieldPluginConfig: Required<PersonalisationPluginConfig>
}

export function PersonalistaionProvider(props: VariantProps) {
  const {personalisationFieldPluginConfig} = props

  const client = useClient({apiVersion: personalisationFieldPluginConfig.apiVersion})
  const workspace = useWorkspace()

  // Fetch or return experiments
  const variants = Array.isArray(personalisationFieldPluginConfig.variants)
    ? personalisationFieldPluginConfig.variants
    : suspend(
        // eslint-disable-next-line require-await
        async () => {
          if (typeof personalisationFieldPluginConfig.variants === 'function') {
            return personalisationFieldPluginConfig.variants(client)
          }
          return personalisationFieldPluginConfig.variants
        },
        [workspace],
        {equal},
      )

  const context = useMemo(
    () => ({...personalisationFieldPluginConfig, variants}),
    [personalisationFieldPluginConfig, variants],
  )

  return (
    <PersonalistaionContext.Provider value={context}>
      {props.renderDefault(props)}
    </PersonalistaionContext.Provider>
  )
}
