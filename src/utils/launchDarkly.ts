import {ExperimentType} from '../types'

const secret = 'api-221c9c51-f7a1-49a2-93e9-195df69bfdfb'
const projectKey = 'default'

export const getExperiments = async () => {
  const featureExperiments: ExperimentType[] = []
  // let hasMore = true
  // let offset = 0
  const url = new URL(`https://app.launchdarkly.com/api/v2/flags/${projectKey}`)

  const response = await fetch(url, {
    headers: {
      Authorization: secret,
    },
  })

  const data = await response.json()

  console.log(data)

  return []
}
