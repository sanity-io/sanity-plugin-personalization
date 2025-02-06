import {SanityClient} from 'sanity'

import {ExperimentType, GrowthbookFeature} from '../types'

const getBooleanConversion = (value: string) => {
  // this way or the other way around?
  if (value === 'true') {
    return 'variant'
  } else if (value === 'false') {
    return 'control'
  }
  return value
}

export const getExperiments = async (
  client: SanityClient,
  environment: string,
  project?: string,
  convertBooleans?: boolean,
) => {
  const query = `*[_id == 'secrets.growthbook'][0].secrets.apiKey`

  const secret = await client.fetch(query) // secret is stored in the content lake using @sanity/studio-secrets
  if (!secret) return []

  // TODO: needs to be a config option for self hosted users
  const url = new URL('https://api.growthbook.io/api/v1/features')
  // TODO: add this as part of the config
  if (project) {
    url.searchParams.append('projectId', project)
  }

  // could be a config option
  url.searchParams.append('limit', '100')
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${secret}`,
    },
  })
  // TODO: add pagination if more than 100 features
  const {features} = await response.json()

  if (!features) return []

  // do you have a types package?
  const featureExperiments: (ExperimentType | undefined)[] = features
    ?.filter((feature: GrowthbookFeature) => !feature.archived)
    .map((feature: GrowthbookFeature) => {
      // what is the difference between experiment and experiment-ref?
      // anything else i need to consider?

      const experiments = feature.environments[environment]?.rules.filter(
        (experiment) => experiment.type === 'experiment-ref' || experiment.type === 'experiment',
      )[0] // TODO: handle multiple experiments and get all potential variations

      if (!experiments) {
        return undefined
      }
      // how often would a 2 variants have the same value?
      const variations = experiments?.variations.map((variant) => ({
        id: convertBooleans ? getBooleanConversion(variant.value) : variant.value,
        label: convertBooleans ? getBooleanConversion(variant.value) : variant.value,
      }))

      return {id: feature.id, label: feature.id, variants: variations}
    })

  return featureExperiments.filter(Boolean) as ExperimentType[]
}
