import equal from 'fast-deep-equal'
import React, {createContext, useContext, useMemo, useState} from 'react'
import {ObjectInputProps, useClient, useWorkspace} from 'sanity'
import {suspend} from 'suspend-react'

import {AudienceType, GrowthbookContextProps, GrowthbookExperimentFieldPluginConfig} from '../types'
import {getSavedGroups} from '../utils'
import {Secrets} from './Secrets'

export const GROWTHBOOK_CONFIG_DEFAULT = {
  baseUrl: 'https://api.growthbook.io/api/v1',
  enableAudiences: false,
  includeArchivedGroups: false,
}

export const GrowthbookContext = createContext<
  GrowthbookContextProps & {audiences?: AudienceType[]}
>({
  setSecret: () => undefined,
  secret: undefined,
})

export function useGrowthbookContext() {
  return useContext(GrowthbookContext)
}

type GrowthbookProps = ObjectInputProps & {
  growthbookFieldPluginConfig: GrowthbookExperimentFieldPluginConfig
  children?: React.ReactNode
}

export function GrowthbookProvider(props: GrowthbookProps) {
  const {growthbookFieldPluginConfig} = props
  const [secret, setSecret] = useState<string | undefined>()

  const client = useClient({apiVersion: '2024-11-07'})
  const workspace = useWorkspace()

  // Fetch audiences if enabled
  const audiences = growthbookFieldPluginConfig.enableAudiences
    ? suspend(
        async () => {
          return getSavedGroups({
            client,
            baseUrl: growthbookFieldPluginConfig.baseUrl || GROWTHBOOK_CONFIG_DEFAULT.baseUrl,
            project: growthbookFieldPluginConfig.project,
            includeArchivedGroups: growthbookFieldPluginConfig.includeArchivedGroups,
          })
        },
        [workspace, growthbookFieldPluginConfig.baseUrl, growthbookFieldPluginConfig.project],
        {equal},
      )
    : []

  const context = useMemo(
    () => ({...growthbookFieldPluginConfig, audiences, secret, setSecret}),
    [growthbookFieldPluginConfig, audiences, secret, setSecret],
  )

  return (
    <GrowthbookContext.Provider value={context}>
      {props.children ? props.children : <Secrets {...props} />}
    </GrowthbookContext.Provider>
  )
}
