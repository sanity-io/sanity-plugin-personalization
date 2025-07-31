import {FieldDefinition} from 'sanity'

export type GrowthbookExperimentFieldPluginConfig = {
  fields: (string | FieldDefinition)[]
  environment: string
  baseUrl?: string
  project?: string
  convertBooleans?: boolean
  tags?: string[]
  enableAudiences?: boolean
  includeArchivedGroups?: boolean
}

export type GrowthbookContextProps = {
  setSecret: (secret: string | undefined) => void
  secret: string | undefined
}

export type GrowthbookSavedGroup = {
  id: string
  name: string
  owner: string
  dateCreated: string
  dateUpdated: string
  archived: boolean
  type: 'condition' | 'list'
  condition?: string
  attributeKey?: string
  values?: string[]
}

export type AudienceType = {
  id: string
  label: string
}
