import {Button, Inline, Stack} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {useCallback} from 'react'
import {useFormValue} from 'sanity'

import {useGrowthbookContext} from '../growthbook/Components/GrowthbookContext'
import {ArrayInputProps, VariantType} from '../types'
import {useExperimentContext} from './ExperimentContext'

export const ArrayInput = (props: ArrayInputProps) => {
  const fieldPath = props.path.slice(0, -1)
  const {
    onItemAppend,
    variantName,
    variantId,
    experimentId,
    targetingMode: propTargetingMode,
  } = props
  const experimentValue = useFormValue([...fieldPath, experimentId])
  const contextTargetingMode = useFormValue([...fieldPath, 'targetingMode'])
  const audienceId = useFormValue([...fieldPath, 'audienceId'])
  const experimentAudienceId = useFormValue([...fieldPath, 'experimentAudienceId'])

  // Use prop targeting mode if provided, otherwise fall back to context
  const targetingMode = propTargetingMode || contextTargetingMode

  // Get the appropriate audience ID based on targeting mode
  const currentAudienceId = targetingMode === 'experiment' ? experimentAudienceId : audienceId

  const {experiments} = useExperimentContext()
  const growthbookContext = useGrowthbookContext()
  const audiences = growthbookContext?.audiences || []

  const handleClick = useCallback(
    async (variant: VariantType) => {
      const item = {
        _key: uuid(),
        [variantId]: variant.id,
        _type: variantName,
      }

      // Add the appropriate ID field based on targeting mode
      if (targetingMode === 'experiment') {
        item[experimentId] = experimentValue as string
      } else if (targetingMode === 'audience') {
        item.audienceId = currentAudienceId as string
      }

      // Patch the document
      onItemAppend(item)
    },
    [
      variantId,
      experimentId,
      experimentValue,
      currentAudienceId,
      targetingMode,
      variantName,
      onItemAppend,
    ],
  )

  // Get variants based on targeting mode
  let filteredVariants: VariantType[] = []

  if (targetingMode === 'experiment' && experimentValue) {
    filteredVariants = experiments.find((option) => option.id === experimentValue)?.variants || []
  } else if (targetingMode === 'audience' && currentAudienceId) {
    // Create a single audience-specific variant
    const selectedAudience = audiences.find((audience) => audience.id === currentAudienceId)
    if (selectedAudience) {
      filteredVariants = [{id: 'audience-content', label: `Content for ${selectedAudience.label}`}]
    }
  }

  type Value = {
    value?: unknown
    [key: string]: string | unknown
    variantId: string
    _key: string
    _type: string
  }

  // there is probably some better was of getting the type of this?
  const values = (props.value as Value[]) || []

  const usedVariants = values?.map((variant) => variant[variantId])

  return (
    <Stack space={3}>
      {props.renderDefault({...props, arrayFunctions: () => null})}

      <Inline space={1}>
        {filteredVariants.map((variant) => {
          const keyValue = targetingMode === 'experiment' ? experimentValue : currentAudienceId
          return (
            <Button
              key={`${keyValue}-${variant.id}`}
              text={`Add ${variant.label}`}
              mode="ghost"
              disabled={usedVariants?.includes(variant.id)}
              onClick={() => handleClick(variant)}
            />
          )
        })}
      </Inline>
    </Stack>
  )
}
