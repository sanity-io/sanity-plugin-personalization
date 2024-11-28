import {SanityClient} from 'sanity'

import {ExperimentType, GrowthbookExperiment} from '../types'

export const getExperiments = async (client: SanityClient, secret: string | undefined) => {
  if (!secret) {
    return []
  }
  const response = await fetch('https://api.growthbook.io/api/v1/experiments', {
    headers: {
      Authorization: `Bearer ${secret}`,
    },
  })
  const {experiments: growthbookExperiments} = await response.json()

  const experiments: ExperimentType[] = growthbookExperiments?.map(
    (experiment: GrowthbookExperiment) => {
      const experimentId = experiment.id
      const experimentLabel = experiment.name
      const variants = experiment.variations?.map((variant) => {
        return {
          id: variant.variationId,
          label: variant.name,
        }
      })
      return {
        id: experimentId,
        label: experimentLabel,
        variants,
      }
    },
  )
  return experiments
}
