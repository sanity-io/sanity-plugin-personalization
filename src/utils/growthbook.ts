import {SanityClient} from 'sanity'

import {ExperimentType, GrowthbookFeature} from '../types'

export const getExperiments = async (
  client: SanityClient,
  environment: string,
  project?: string,
) => {
  const query = `*[_id == 'secrets.growthbook'][0].secrets.apiKey`

  const secret = await client.fetch(query) // secret is stored in the content lake using @sanity/studio-secrets

  if (!secret) return []

  const url = new URL('https://api.growthbook.io/api/v1/features')
  if (project) {
    url.searchParams.append('projectId', project)
  }

  url.searchParams.append('limit', '100')
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${secret}`,
    },
  })
  const {features} = await response.json()

  if (!features) return []

  const featureExperiments: (ExperimentType | undefined)[] = features
    ?.filter((feature: GrowthbookFeature) => !feature.archived)
    .map((feature: GrowthbookFeature) => {
      const experiments = feature.environments[environment]?.rules.filter(
        (experiment) => experiment.type === 'experiment-ref' || experiment.type === 'experiment',
      )[0]

      if (!experiments) {
        return undefined
      }
      const variations = experiments?.variations.map((variant) => ({
        id: variant.value,
        label: variant.value,
      }))

      return {id: feature.id, label: feature.id, variants: variations}
    })

  return featureExperiments.filter(Boolean) as ExperimentType[]
}
