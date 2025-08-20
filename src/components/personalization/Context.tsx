import equal from 'fast-deep-equal'
import {createContext, useContext, useMemo} from 'react'
import {ObjectInputProps, useClient, useWorkspace} from 'sanity'
import {suspend} from 'suspend-react'

import {PersonalizationContextProps, PersonalizationFieldPluginConfig} from '../../types'

export const CONFIG_DEFAULT = {
  fields: [],
  apiVersion: '2024-11-07',
  personalizationNameOverride: 'personalization',
  segmentNameOverride: 'segment',
  segmentId: 'segmentId',
  segmentArrayName: 'segments',
}

export const PersonalizationContext = createContext<PersonalizationContextProps>({
  ...CONFIG_DEFAULT,
  segments: [],
})

export function usePersonalizationContext() {
  return useContext(PersonalizationContext)
}

type PersonalizationProps = ObjectInputProps & {
  personalizationFieldPluginConfig: Required<PersonalizationFieldPluginConfig>
}

export function PersonalizationProvider(props: PersonalizationProps) {
  const {personalizationFieldPluginConfig} = props

  const client = useClient({apiVersion: personalizationFieldPluginConfig.apiVersion})
  const workspace = useWorkspace()

  // Fetch or return experiments
  const segments = Array.isArray(personalizationFieldPluginConfig.segments)
    ? personalizationFieldPluginConfig.segments
    : suspend(
        // eslint-disable-next-line require-await
        async () => {
          if (typeof personalizationFieldPluginConfig.segments === 'function') {
            return personalizationFieldPluginConfig.segments(client)
          }
          return personalizationFieldPluginConfig.segments
        },
        [workspace],
        {equal},
      )

  const context = useMemo(
    () => ({...personalizationFieldPluginConfig, segments}),
    [personalizationFieldPluginConfig, segments],
  )

  return (
    <PersonalizationContext.Provider value={context}>
      {props.renderDefault(props)}
    </PersonalizationContext.Provider>
  )
}
