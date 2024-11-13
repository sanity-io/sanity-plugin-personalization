import {FormEvent, useCallback, useMemo} from 'react'
import {
  FormPatch,
  PatchEvent,
  set,
  StringInputProps,
  unset,
  useDocumentOperation,
  useFormValue,
} from 'sanity'

import {ExperimentType} from '..'
import {useExperimentContext} from './ExperimentContext'
import {Select} from './Select'

export type SelectOption = {title: string; value: string}
const formatlistOptions = (experiments: ExperimentType[]): SelectOption[] =>
  experiments.map((experiment) => ({
    title: experiment.label,
    value: experiment.id,
  }))

export const ExperimentInput = (props: StringInputProps) => {
  const {experiments} = useExperimentContext()

  const id = useFormValue(['_id']) as string
  const aditionalChangePath = useMemo(() => [...props.path.slice(0, -1), 'variants'], [props.path])
  const subValues = useFormValue(aditionalChangePath)

  const {patch} = useDocumentOperation(id.replace('drafts.', ''), props.schemaType.name)

  const handleChange = useCallback(
    (
      event: FormEvent<Element>,
      onChange: (patchchange: FormPatch | FormPatch[] | PatchEvent) => void,
    ) => {
      const target = event.currentTarget as HTMLSelectElement
      const inputValue = target.value

      if (inputValue) {
        onChange(set(inputValue))
      } else {
        onChange(unset())
      }

      if (subValues) {
        const patchEvent = {
          unset: [aditionalChangePath.join('.')],
        }
        patch.execute([patchEvent])
      }
    },
    [patch, subValues, aditionalChangePath],
  )

  if (!experiments.length) return <></>

  return (
    <Select {...props} listOptions={formatlistOptions(experiments)} handleChange={handleChange} />
  )
}
