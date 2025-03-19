import {Dispatch, SetStateAction} from 'react'
import {
  ArrayOfObjectsInputProps,
  FieldDefinition,
  ObjectField,
  Path,
  PreviewProps,
  SanityClient,
  SchemaType,
} from 'sanity'

export type VariantType = {
  id: string
  label: string
}
export type ExperimentType = {
  id: string
  label: string
  variants: VariantType[]
}

export type FieldPluginConfig = {
  fields: (string | FieldDefinition)[]
  experiments: ExperimentType[] | ((client: SanityClient) => Promise<ExperimentType[]>)
  apiVersion?: string
}

export type VariantPreviewProps = Omit<PreviewProps, 'SchemaType'> & {
  experiment: string
  variant: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
}

export type ExperimentContextProps = Required<FieldPluginConfig> & {
  experiments: ExperimentType[]
  setSecret: Dispatch<SetStateAction<string | undefined>>
  secret: string | undefined
}

export type ArrayInputProps = ArrayOfObjectsInputProps & {
  objectName: string
}

export type ObjectFieldWithPath = ObjectField<SchemaType> & {path: Path}

export type VariantGeneric<T> = {
  _type: string
  variantId?: string
  experimentId?: string
  value?: T
}

export type ExperimentGeneric<T> = {
  _type: string
  default?: T
  experimentValue?: string
  variants?: Array<
    {
      _key: string
    } & VariantGeneric<T>
  >
}

export type LaunchDarklyFlagItem = {
  name: string
  kind: string
  key: string
  _version: number
  creationDate: number
  variations: Array<{
    value: boolean
    _id: string
    name: string
  }>
  temporary: boolean
  tags: string[]
  _links: {
    parent: {
      href: string
      type: string
    }
    self: {
      href: string
      type: string
    }
  }
  experiments: {
    baselineIdx: number
    items: Array<{
      metricKey: string
      _metric: {
        _id: string
        _versionId: string
        key: string
        name: string
        kind: string
        _links: {
          parent: {
            href: string
            type: string
          }
          self: {
            href: string
            type: string
          }
        }
        tags: string[]
        _creationDate: number
        experimentCount: number
        metricGroupCount: number
        _attachedFlagCount: number
        maintainerId: string
        _maintainer: {
          _links: {
            self: {
              href: string
              type: string
            }
          }
          _id: string
          role: string
          email: string
          firstName: string
          lastName: string
        }
        category: string
        isNumeric: boolean
        percentileValue: number
      }
    }>
  }
  customProperties: {
    key: {
      name: string
      value: string[]
    }
  }
  archived: boolean
  description: string
  maintainerId: string
  _maintainer: {
    _links: {
      self: {
        href: string
        type: string
      }
    }
    _id: string
    role: string
    email: string
    firstName: string
    lastName: string
  }
  maintainerTeamKey: string
  _maintainerTeam: {
    key: string
    name: string
    _links: {
      parent: {
        href: string
        type: string
      }
      roles: {
        href: string
        type: string
      }
      self: {
        href: string
        type: string
      }
    }
  }
  archivedDate: number
  deprecated: boolean
  deprecatedDate: number
  defaults: {
    onVariation: number
    offVariation: number
  }
  _purpose: string
  migrationSettings: {
    contextKind: string
    stageCount: number
  }
  environments: {
    [key: string]: {
      on: boolean
      archived: boolean
      salt: string
      sel: string
      lastModified: number
      version: number
      _site: {
        href: string
        type: string
      }
      _environmentName: string
      trackEvents: boolean
      trackEventsFallthrough: boolean
      targets: Array<{
        values: string[]
        variation: number
        contextKind: string
      }>
      contextTargets: Array<{
        values: string[]
        variation: number
        contextKind: string
      }>
      rules: Array<{
        clauses: Array<{
          attribute: string
          op: string
          values: unknown[]
          negate: boolean
        }>
        trackEvents: boolean
      }>
      fallthrough: {
        variation: number
      }
      offVariation: number
      prerequisites: Array<{
        key: string
        variation: number
      }>
      _summary: {
        variations: {
          [key: string]: {
            rules: number
            nullRules: number
            targets: number
            contextTargets: number
            isFallthrough?: boolean
            isOff?: boolean
          }
        }
        prerequisites: number
      }
    }
  }
  includeInSnippet: boolean
  goalIds: string[]
}
