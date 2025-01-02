import {PreviewProps} from 'sanity'

import {VariantPreviewProps} from '../types'
import {useExperimentContext} from './ExperimentContext'

export const VariantPreview = (props: PreviewProps) => {
  const {experiments} = useExperimentContext()

  const {experiment, variant, value} = props as VariantPreviewProps

  const selectedExperiment = experiments.find((experimentItem) => {
    return experimentItem.id === experiment
  })

  const selectedVariant = selectedExperiment?.variants.find((variantItem) => {
    return variantItem.id === variant
  })

  const previewProps = {
    ...props,
    title: `${selectedExperiment?.label} - ${selectedVariant?.label}`,
    subtitle: typeof value === 'string' ? value : '',
  }

  return props.renderDefault(previewProps)
}
