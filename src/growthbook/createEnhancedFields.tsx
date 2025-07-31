import {ArrayOfObjectsInputProps, defineField, defineType, FieldDefinition} from 'sanity'

import {ArrayInput} from '../components/Array'
import {ExperimentField} from '../components/ExperimentField'
import {ExperimentInput} from '../components/ExperimentInput'
import {VariantInput} from '../components/VariantInput'
import {VariantPreview} from '../components/VariantPreview'
import {AudienceInput} from './Components/AudienceInput'

const createExperimentType = ({
  field,
  experimentNameOverride,
  variantNameOverride,
  variantId,
  variantArrayName,
  experimentId,
  enableAudiences = false,
}: {
  field: string | FieldDefinition
  experimentNameOverride: string
  variantNameOverride: string
  variantId: string
  variantArrayName: string
  experimentId: string
  enableAudiences?: boolean
}) => {
  const typeName = typeof field === `string` ? field : field.name
  const usedName = String(typeName[0]).toUpperCase() + String(typeName).slice(1)
  const variantName = `${variantNameOverride}${usedName}`

  const baseFields = [
    typeof field === `string`
      ? defineField({
          name: 'default',
          type: field,
        })
      : {
          ...field,
          name: 'default',
        },
    defineField({
      name: 'active',
      type: 'boolean',
      hidden: true,
      initialValue: false,
    }),
    defineField({
      name: 'targetingMode',
      title: 'Targeting Mode',
      type: 'string',
      options: {
        list: [
          {title: 'A/B Testing (Experiment)', value: 'experiment'},
          {title: 'Audience Only', value: 'audience'},
        ],
        layout: 'radio',
      },
      initialValue: 'experiment',
      hidden: ({parent}) => !parent?.active,
    }),
  ]

  // Add audience fields if enabled (separate for each mode)
  const audienceField = enableAudiences
    ? [
        // Audience field for experiment mode (optional)
        defineField({
          name: 'experimentAudienceId',
          title: 'Target Audience (Optional)',
          type: 'string',
          description: 'Optionally target this experiment to a specific audience',
          components: {
            input: AudienceInput,
          },
          hidden: ({parent}) => {
            if (!parent?.active) return true
            return parent?.targetingMode !== 'experiment'
          },
        }),
        // Audience field for audience-only mode (required)
        defineField({
          name: 'audienceId',
          title: 'Target Audience',
          type: 'string',
          description: 'Select the audience to show specific content to',
          components: {
            input: AudienceInput,
          },
          hidden: ({parent}) => {
            if (!parent?.active) return true
            return parent?.targetingMode !== 'audience'
          },
          validation: (Rule) =>
            Rule.custom((audienceId, context) => {
              const parent = context.parent as {targetingMode?: string}
              if (parent?.targetingMode === 'audience' && !audienceId) {
                return 'Audience selection is required for audience-only targeting'
              }
              return true
            }),
        }),
      ]
    : []

  const experimentFields = [
    defineField({
      name: experimentId,
      type: 'string',
      components: {
        input: (props) => (
          <ExperimentInput
            {...props}
            experimentNameOverride={experimentNameOverride}
            variantNameOverride={variantNameOverride}
          />
        ),
      },
      hidden: ({parent}) => {
        if (!parent?.active) return true
        // Hide experiment selection for audience-only mode
        return parent?.targetingMode === 'audience'
      },
      validation: (Rule) =>
        Rule.custom((id, context) => {
          const parent = context.parent as {targetingMode?: string}
          if (parent?.targetingMode === 'experiment' && !id) {
            return 'Experiment selection is required for A/B testing mode'
          }
          return true
        }),
    }),
    // Experiment variants (only shown in experiment mode)
    defineField({
      name: variantArrayName,
      title: 'Experiment Variants',
      type: 'array',
      hidden: ({parent}) => {
        if (!parent?.active) return true
        if (parent?.targetingMode !== 'experiment') return true
        return !parent?.[experimentId]
      },
      components: {
        input: (props: ArrayOfObjectsInputProps & {targetingMode?: string}) => (
          <ArrayInput
            {...props}
            variantName={variantName}
            variantId={variantId}
            experimentId={experimentId}
            targetingMode="experiment"
          />
        ),
      },
      of: [
        defineField({
          name: variantName,
          type: variantName,
        }),
      ],
    }),
    // Audience variants (only shown in audience mode)
    defineField({
      name: 'audienceVariants',
      title: 'Audience Content',
      type: 'array',
      hidden: ({parent}) => {
        if (!parent?.active) return true
        if (parent?.targetingMode !== 'audience') return true
        return !parent?.audienceId
      },
      components: {
        input: (props: ArrayOfObjectsInputProps & {targetingMode?: string}) => (
          <ArrayInput
            {...props}
            variantName={variantName}
            variantId={variantId}
            experimentId={experimentId}
            targetingMode="audience"
          />
        ),
      },
      of: [
        defineField({
          name: variantName,
          type: variantName,
        }),
      ],
    }),
  ]

  return defineType({
    name: `${experimentNameOverride}${usedName}`,
    type: 'object',
    components: {
      field: (props) => (
        <ExperimentField
          {...props}
          experimentId={experimentId}
          experimentNameOverride={experimentNameOverride}
          variantNameOverride={variantNameOverride}
        />
      ),
    },
    fields: [...baseFields, ...audienceField, ...experimentFields],
    preview: {
      select: {
        base: 'default',
        experiment: experimentId,
      },
      prepare: ({base, experiment}) => {
        const title = base?.title || base?.name || ''
        const experimentTitle = experiment ? `Experiment: ${experiment}` : ''
        const media = base?.image || base?.photo || base?.media || ''
        return {
          title: title || experimentTitle,
          subtitle: title ? experimentTitle : '',
          media,
        }
      },
    },
  })
}

const createVariantType = ({
  field,
  variantNameOverride,
  variantId,
  experimentId,
}: {
  field: string | FieldDefinition
  variantNameOverride: string
  variantId: string
  experimentId: string
}) => {
  const typeName = typeof field === `string` ? field : field.name
  const usedName = String(typeName[0]).toUpperCase() + String(typeName).slice(1)
  return defineType({
    name: `${variantNameOverride}${usedName}`,
    title: `${variantNameOverride} array ${usedName}`,
    type: 'object',
    components: {
      preview: VariantPreview,
      input: VariantInput,
    },
    fields: [
      {
        type: 'string',
        name: variantId,
        readOnly: true,
      },
      {
        type: 'string',
        name: experimentId,
        hidden: true,
      },
      {
        type: 'string',
        name: 'audienceId',
        hidden: true,
      },
      typeof field === `string`
        ? defineField({
            name: 'value',
            type: field,
          })
        : {
            ...field,
            name: 'value',
          },
    ],
    preview: {
      select: {
        variant: variantId,
        experiment: experimentId,
        audience: 'audienceId',
        value: 'value',
      },
    },
  })
}

export const createEnhancedFieldSchema = ({
  fields,
  experimentNameOverride,
  variantNameOverride,
  variantId,
  variantArrayName,
  experimentId,
  enableAudiences = false,
}: {
  fields: (string | FieldDefinition)[]
  experimentNameOverride: string
  variantNameOverride: string
  variantId: string
  variantArrayName: string
  experimentId: string
  enableAudiences?: boolean
}) => {
  return [
    ...fields.map((field) =>
      createVariantType({field, variantNameOverride, variantId, experimentId}),
    ),
    ...fields.map((field) =>
      createExperimentType({
        field,
        experimentNameOverride,
        variantNameOverride,
        variantId,
        variantArrayName,
        experimentId,
        enableAudiences,
      }),
    ),
  ]
}
