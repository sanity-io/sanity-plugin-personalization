import {SettingsView, useSecrets} from '@sanity/studio-secrets'
import {useEffect, useState} from 'react'
import {ObjectInputProps} from 'sanity'

import {useExperimentContext} from './ExperimentContext'

const namespace = 'growthbook'

const pluginConfigKeys = [
  {
    key: 'apiKey',
    title: 'Your secret API key',
  },
]

export const Secrets = (props: ObjectInputProps) => {
  const {secrets} = useSecrets(namespace) as {secrets: {apiKey: string}}
  const {setSecret} = useExperimentContext()
  const [showSettings, setShowSettings] = useState<boolean>(false)

  useEffect(() => {
    if (!secrets) {
      setSecret(undefined)
      return setShowSettings(true)
    }
    setSecret(secrets.apiKey)
    return setShowSettings(false)
  }, [secrets, setSecret])

  if (!showSettings) {
    return props.renderDefault(props)
  }
  return (
    <>
      <SettingsView
        title={'Growthbook secret'}
        namespace={namespace}
        keys={pluginConfigKeys}
        onClose={() => {
          setShowSettings(false)
        }}
      />
      {props.renderDefault(props)}
    </>
  )
}
