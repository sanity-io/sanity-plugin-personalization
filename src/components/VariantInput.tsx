import {FormEvent, useCallback} from 'react'
import {
  FormPatch,
  PatchEvent,
  set,
  StringInputProps,
  unset,
  useDocumentOperation,
  useFormValue,
} from 'sanity'

import {VariantType} from '../types'
import {useExperimentContext} from './ExperimentContext'
import {Select} from './Select'

const formatlistOptions = (varants: VariantType[]) =>
  varants.map((variant) => ({
    title: variant.label,
    value: variant.id,
  }))

export const VariantInput = (props: StringInputProps) => {
  const experimentPath = props.path.slice(0, -3)

  const experimentValue = useFormValue([...experimentPath, 'experimentValue'])

  const id = useFormValue(['_id']) as string

  const {patch} = useDocumentOperation(id.replace('drafts.', ''), props.schemaType.name)

  const {experiments} = useExperimentContext()

  const handleChange = useCallback(
    (
      event: FormEvent<Element>,
      onChange: (patchchange: FormPatch | FormPatch[] | PatchEvent) => void,
    ) => {
      const target = event.currentTarget as HTMLSelectElement
      const inputValue = target.value
      const variantExperimentId = props.id.replace('variantId', 'experimentId')

      if (inputValue) {
        onChange(set(inputValue))
        const patchEvent = {
          set: {[variantExperimentId]: experimentValue},
        }
        patch.execute([patchEvent])
      } else {
        onChange(unset())
        const patchEvent = {
          unset: [variantExperimentId],
        }
        patch.execute([patchEvent])
      }
    },
    [experimentValue, patch, props.id],
  )

  const filteredVariants =
    experiments.find((option) => {
      return option.id === experimentValue
    })?.variants || []

  return (
    <Select
      {...props}
      listOptions={formatlistOptions(filteredVariants)}
      handleChange={handleChange}
    />
  )
}
