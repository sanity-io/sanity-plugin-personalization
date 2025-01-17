import {Button, Inline, Stack} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {useCallback} from 'react'

import {ArrayInputProps, VariantType} from '../../types'
import {usePersonalistaionContext} from './PersonalisationContext'

export const PersonalisationArrayInput = (props: ArrayInputProps) => {
  const {variants} = usePersonalistaionContext()

  const {onItemAppend, objectName} = props

  const handleClick = useCallback(
    async (variant: VariantType) => {
      const item = {
        _key: uuid(),
        variantId: variant.id,
        _type: objectName,
      }

      // Patch the document
      onItemAppend(item)
    },
    [objectName, onItemAppend],
  )

  type Value = {
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
        {variants.map((variant) => {
          return (
            <Button
              key={`${variant.id}`}
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
