import {useEffect, useState} from 'react'
import {
  isImage,
  isReference,
  ObjectSchemaType,
  PreviewProps,
  ReferenceSchemaType,
  useClient,
} from 'sanity'

import {VariantPreviewProps} from '../../types'
import {usePersonalistaionContext} from './PersonalisationContext'

export const PersonalisationVariantPreview = (props: PreviewProps) => {
  const [subtitle, setSubtitle] = useState<string | undefined>(undefined)
  const [title, setTitle] = useState<string | undefined>(undefined)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [media, setMedia] = useState<any>(undefined)
  const client = useClient({apiVersion: '2025-01-01'})
  const {variants} = usePersonalistaionContext()

  const {variant, value} = props as VariantPreviewProps
  // console.log(variant, value)

  const selectedVariant = variants.find((variantItem) => {
    return variantItem.id === variant
  })

  useEffect(() => {
    const getPrevieProps = async () => {
      setTitle(selectedVariant?.label)
      if (typeof value === 'string') {
        return setSubtitle(value)
      }
      if (isReference(value)) {
        const doc = await client.getDocument(value._ref)
        const type = props.schemaType as ObjectSchemaType
        const valueField = type.fields.find((field) => field.name === 'value') as ObjectSchemaType
        const referenceField = valueField?.type as ReferenceSchemaType
        const referenceType = referenceField.to.find((field) => field.type?.name === doc?._type)

        const selectFields = {} as Record<string, unknown>
        const previewFields = referenceType?.preview?.select || {}
        Object.keys(previewFields).forEach((key) => {
          const valueKey = referenceType?.preview?.select?.[key]
          selectFields[key] =
            valueKey && doc
              ? valueKey?.split('.').reduce((acc, index) => acc[index], doc)
              : undefined
        })

        const previewContent = referenceType?.preview?.prepare?.(selectFields)
        setMedia(previewContent?.media || selectFields.media)
        return setSubtitle(previewContent?.title || (selectFields?.title as string))
      }
      if (isImage(value)) {
        setMedia(value)
      }
      return ''
    }
    getPrevieProps()
  }, [value, client, selectedVariant, props.schemaType])

  const previewProps = {
    ...props,
    title: title,
    subtitle: subtitle,
    media: media,
  }

  return props.renderDefault(previewProps)
}
