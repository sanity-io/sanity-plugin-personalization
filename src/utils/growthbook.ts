import {SanityClient} from 'sanity'

import {GrowthbookABConfig} from '../growthbookFieldExperiments'
import {ExperimentType, GrowthbookFeature, VariantType} from '../types'

const getBooleanConversion = (value: string) => {
  // this way or the other way around?
  if (value === 'true') {
    return 'variant'
  } else if (value === 'false') {
    return 'control'
  }
  return value
}

export const getExperiments = async ({
  client,
  environment,
  baseUrl,
  project,
  convertBooleans,
}: Omit<GrowthbookABConfig, 'fields'> & {client: SanityClient}): Promise<ExperimentType[]> => {
  const query = `*[_id == 'secrets.growthbook'][0].secrets.apiKey`

  const secret = await client.fetch(query) // secret is stored in the content lake using @sanity/studio-secrets
  if (!secret) return []

  const featureExperiments: ExperimentType[] = []
  let hasMore = true
  let offset = 0
  const url = new URL(baseUrl ?? 'https://api.growthbook.io/api/v1/features')
  if (project) {
    url.searchParams.set('projectId', project)
  }

  while (hasMore) {
    url.searchParams.set('offset', offset.toString())
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    })

    const {features, hasMore: responseHasMore, nextOffset} = await response.json()

    hasMore = responseHasMore
    offset = nextOffset
    if (!features) continue

    features.forEach((feature: GrowthbookFeature) => {
      if (feature.archived) {
        return undefined
      }
      const experiments = feature.environments[environment]?.rules.filter(
        (experiment) => experiment.type === 'experiment-ref' || experiment.type === 'experiment',
      )

      if (!experiments) {
        return undefined
      }

      const variations: VariantType[] = []
      const uniqueValues = new Set<string>()

      experiments.forEach((experiment) => {
        experiment?.variations.forEach((variant) => {
          const value = convertBooleans ? getBooleanConversion(variant.value) : variant.value
          if (!uniqueValues.has(value)) {
            uniqueValues.add(value)
            variations.push({
              id: value,
              label: value,
            })
          }
        })
      })
      const value = {id: feature.id, label: feature.id, variants: variations}

      featureExperiments.push(value)
      return undefined
    })
  }
  return featureExperiments
}
