import {Card, Text} from '@sanity/ui'
import {FormEvent, useCallback} from 'react'
import {FormPatch, PatchEvent, set, StringInputProps, unset} from 'sanity'

import {Select} from '../../components/Select'
import {AudienceType} from '../types'
import {useGrowthbookContext} from './GrowthbookContext'

export type SelectOption = {title: string; value: string}

const formatAudienceOptions = (audiences: AudienceType[]): SelectOption[] => [
  {title: 'Everyone (No Audience)', value: ''},
  ...audiences.map((audience) => ({
    title: audience.label,
    value: audience.id,
  })),
]

export const AudienceInput = (props: StringInputProps) => {
  const context = useGrowthbookContext() as {audiences?: AudienceType[]}
  const audiences = context.audiences || []

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
    },
    [],
  )

  if (!audiences.length)
    return (
      <Card padding={[3, 3, 4]} radius={2} shadow={1} tone="caution">
        <Text align="center" size={[2, 2, 3]}>
          There are no defined audiences
        </Text>
      </Card>
    )

  return (
    <Select {...props} listOptions={formatAudienceOptions(audiences)} handleChange={handleChange} />
  )
}
