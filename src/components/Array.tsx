import {Button, Inline, Stack} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {useCallback} from 'react'
import {useFormValue} from 'sanity'

import {ArrayInputProps, VariantType} from '../types'
import {useExperimentContext} from './ExperimentContext'

export const ArrayInput = (props: ArrayInputProps) => {
  const fieldPath = props.path.slice(0, -1)
  const experimentId = useFormValue([...fieldPath, 'experimentId'])

  const {experiments} = useExperimentContext()

  const {onItemAppend, objectName} = props

  const handleClick = useCallback(
    async (variant: VariantType) => {
      const item = {
        _key: uuid(),
        variantId: variant.id,
        experimentId: experimentId,
        _type: objectName,
      }

      // Patch the document
      onItemAppend(item)
    },
    [experimentId, objectName, onItemAppend],
  )

  const filteredVariants =
    experiments.find((option) => {
      return option.id === experimentId
    })?.variants || []

  type Value = {
    experimentId: string
    value?: unknown
    variantId: string
    _key: string
    _type: string
  }

  // there is probably some better was of getting the type of this?
  const values = props.value as Value[] | []

  const usedVariants = values?.map((variant) => variant.variantId)

  return (
    <Stack space={3}>
      {props.renderDefault({...props, arrayFunctions: () => null})}

      <Inline space={1}>
        {filteredVariants.map((variant) => {
          return (
            <Button
              key={`${experimentId}-${variant.id}`}
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
