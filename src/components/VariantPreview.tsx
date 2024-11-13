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

  // exp not stored agaisnt variant
  // "title":coalesce(select(title.experimentValue == $experiment && defined(title.variants[variantId == $variant][0]) => title.variants[variantId == $variant][0].value, null), title.default),

  // exp stored agaisnt variant
  // "title":coalesce(title.variants[experimentId == $experiment && variantId == $variant][0].value, title.default),

  // exp and var stored as _key
  // "title":coalesce(title.variants[_key == $experiment+':'+$variant][0].value, title.default),

  // console.log('new props', previewProps)
  return props.renderDefault(previewProps)
}
