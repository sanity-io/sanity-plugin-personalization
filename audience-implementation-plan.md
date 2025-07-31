# GrowthBook Audience-Based Content Implementation Plan

## Overview

This document outlines the implementation plan for adding audience-based content targeting to the `@sanity/personalization-plugin`. This will create a separate plugin export that allows content creators to serve different content based on GrowthBook Saved Groups (audiences) rather than A/B test experiments.

## Goals

- **Separate Plugin**: Create `fieldLevelAudiences` as a distinct export alongside existing `fieldLevelExperiments`
- **Audience Targeting**: Use GrowthBook Saved Groups API for content targeting
- **Independent UI**: Separate field types and Studio interface components
- **Shared Infrastructure**: Reuse authentication, base field logic, and configuration patterns

## Architecture Overview

### Current Structure

```
src/
├── fieldExperiments.tsx          # Base plugin logic
├── growthbook/
│   ├── index.ts                  # fieldLevelExperiments export
│   ├── utils.ts                  # getExperiments()
│   ├── types.ts                  # Experiment types
│   └── Components/
│       ├── GrowthbookContext.tsx
│       └── Secrets.tsx
```

### Proposed Structure

```
src/
├── fieldExperiments.tsx          # Base plugin logic (unchanged)
├── growthbook/
│   ├── index.ts                  # Both exports: experiments + audiences
│   ├── experiments/              # Move existing experiment code
│   │   ├── utils.ts             # getExperiments()
│   │   ├── types.ts             # Experiment types
│   │   └── Components/
│   │       └── ExperimentContext.tsx
│   ├── audiences/                # New audience functionality
│   │   ├── utils.ts             # getSavedGroups()
│   │   ├── types.ts             # Audience types
│   │   └── Components/
│   │       └── AudienceContext.tsx
│   └── shared/                   # Shared components
│       ├── types.ts             # Common types
│       └── Components/
│           └── Secrets.tsx      # Shared authentication
```

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)

#### 1.1 Create New File Structure

- [ ] Create `src/growthbook/audiences/` directory
- [ ] Create `src/growthbook/shared/` directory
- [ ] Move existing experiment code to `src/growthbook/experiments/`

#### 1.2 Shared Types and Utilities

**File: `src/growthbook/shared/types.ts`**

```typescript
export type GrowthbookBaseConfig = {
  fields: (string | FieldDefinition)[]
  environment: string
  baseUrl?: string
  project?: string
}

export type GrowthbookExperimentConfig = GrowthbookBaseConfig & {
  convertBooleans?: boolean
  tags?: string[]
}

export type GrowthbookAudienceConfig = GrowthbookBaseConfig & {
  defaultVariantStrategy?: 'in-out' | 'custom'
  audienceMatchLogic?: 'any' | 'all'
}
```

**File: `src/growthbook/shared/Components/Secrets.tsx`**

- [ ] Move existing `Secrets.tsx` to shared location
- [ ] Update imports in existing files

#### 1.3 Base Audience Plugin Structure

**File: `src/growthbook/audiences/utils.ts`**

```typescript
export const getSavedGroups = async ({
  client,
  baseUrl,
  project,
}: {
  client: SanityClient
  baseUrl: string
  project?: string
}): Promise<AudienceType[]> => {
  // Implementation details in Phase 2
}
```

### Phase 2: GrowthBook Saved Groups Integration (Week 1-2)

#### 2.1 API Integration

**File: `src/growthbook/audiences/utils.ts`**

```typescript
import {SanityClient} from 'sanity'
import {AudienceType, GrowthbookSavedGroup} from './types'
import {namespace, pluginConfigKeys} from '../shared/Components/Secrets'

export const getSavedGroups = async ({
  client,
  baseUrl,
  project,
}: {
  client: SanityClient
  baseUrl: string
  project?: string
}): Promise<AudienceType[]> => {
  const secret = await client.fetch(
    `*[_id == 'secrets.${namespace}'][0].secrets.${pluginConfigKeys[0].key}`,
  )
  if (!secret) return []

  let allGroups: GrowthbookSavedGroup[] = []
  let hasMore = true
  let offset = 0

  const url = new URL(`${baseUrl}/saved-groups`)
  if (project) {
    url.searchParams.set('projectId', project)
  }

  while (hasMore) {
    url.searchParams.set('offset', offset.toString())
    url.searchParams.set('limit', '100')

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    })

    const {savedGroups, hasMore: responseHasMore, nextOffset} = await response.json()

    hasMore = responseHasMore
    offset = nextOffset
    allGroups = [...allGroups, ...savedGroups]
  }

  return allGroups
    .filter((group) => !group.archived) // Filter out archived groups
    .map((group) => ({
      id: group.id,
      label: group.name,
      variants: [
        {id: `${group.id}-in`, label: 'In Audience'},
        {id: `${group.id}-out`, label: 'Not In Audience'},
        {id: `${group.id}-default`, label: 'Default Content'},
      ],
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
```

#### 2.2 Audience Types

**File: `src/growthbook/audiences/types.ts`**

```typescript
import {FieldDefinition} from 'sanity'
import {VariantType} from '../../types'

export type AudienceType = {
  id: string
  label: string
  variants: VariantType[]
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

export type GrowthbookAudienceFieldPluginConfig = {
  fields: (string | FieldDefinition)[]
  environment: string
  baseUrl?: string
  project?: string
  defaultVariantStrategy?: 'in-out' | 'custom'
  includeArchivedGroups?: boolean
}

export type AudienceContextProps = {
  setSecret: (secret: string | undefined) => void
  secret: string | undefined
}
```

### Phase 3: Audience Components (Week 2)

#### 3.1 Audience Context Provider

**File: `src/growthbook/audiences/Components/AudienceContext.tsx`**

```typescript
import { createContext, useContext, useMemo, useState } from 'react'
import { ObjectInputProps } from 'sanity'
import { AudienceContextProps, GrowthbookAudienceFieldPluginConfig } from '../types'
import { Secrets } from '../../shared/Components/Secrets'

export const AUDIENCE_CONFIG_DEFAULT = {
  baseUrl: 'https://api.growthbook.io/api/v1',
  defaultVariantStrategy: 'in-out' as const,
  includeArchivedGroups: false,
}

export const AudienceContext = createContext<AudienceContextProps>({
  setSecret: () => undefined,
  secret: undefined,
})

export function useAudienceContext() {
  return useContext(AudienceContext)
}

type AudienceProviderProps = ObjectInputProps & {
  growthbookAudienceFieldPluginConfig: GrowthbookAudienceFieldPluginConfig
}

export function AudienceProvider(props: AudienceProviderProps) {
  const { growthbookAudienceFieldPluginConfig } = props
  const [secret, setSecret] = useState<string | undefined>()

  const context = useMemo(
    () => ({ ...growthbookAudienceFieldPluginConfig, secret, setSecret }),
    [growthbookAudienceFieldPluginConfig, secret, setSecret]
  )

  return (
    <AudienceContext.Provider value={context}>
      <Secrets {...props} />
    </AudienceContext.Provider>
  )
}
```

#### 3.2 Audience Field Components

**File: `src/growthbook/audiences/Components/AudienceField.tsx`**

```typescript
// Similar to ExperimentField but for audiences
// Will need to be created based on existing ExperimentField patterns
```

**File: `src/growthbook/audiences/Components/AudienceInput.tsx`**

```typescript
// Similar to ExperimentInput but shows saved groups instead of experiments
// Will need to be created based on existing ExperimentInput patterns
```

### Phase 4: Main Plugin Implementation (Week 2-3)

#### 4.1 Create Base Audience Fields Plugin

**File: `src/fieldAudiences.tsx`**

```typescript
// Similar structure to fieldExperiments.tsx but for audience-based content
// Creates audienceString, audienceText, etc. field types
// Uses 'audience' prefix instead of 'experiment'
```

#### 4.2 Update Main GrowthBook Index

**File: `src/growthbook/index.ts`**

```typescript
import {definePlugin, isObjectInputProps} from 'sanity'

// Existing experiment imports
import {fieldLevelExperiments as baseFieldLevelExperiments} from '../fieldExperiments'
import {flattenSchemaType} from '../utils/flattenSchemaType'
import {
  GROWTHBOOK_CONFIG_DEFAULT,
  GrowthbookProvider,
} from './experiments/Components/ExperimentContext'
import {GrowthbookExperimentFieldPluginConfig} from './experiments/types'
import {getExperiments} from './experiments/utils'

// New audience imports
import {fieldLevelAudiences as baseFieldLevelAudiences} from '../fieldAudiences'
import {AUDIENCE_CONFIG_DEFAULT, AudienceProvider} from './audiences/Components/AudienceContext'
import {GrowthbookAudienceFieldPluginConfig} from './audiences/types'
import {getSavedGroups} from './audiences/utils'

// Existing experiment export (moved to experiments/ folder)
export const fieldLevelExperiments = definePlugin<GrowthbookExperimentFieldPluginConfig>(
  (config) => {
    const pluginConfig = {...GROWTHBOOK_CONFIG_DEFAULT, ...config}
    const {fields, environment, project, convertBooleans, baseUrl, tags} = pluginConfig
    return {
      name: 'sanity-growthbook-personalization-plugin-field-level-experiments',
      plugins: [
        baseFieldLevelExperiments({
          fields,
          experiments: (client) =>
            getExperiments({client, environment, baseUrl, project, convertBooleans, tags}),
        }),
      ],
      form: {
        components: {
          input: (props) => {
            const isRootInput = props.id === 'root' && isObjectInputProps(props)
            if (!isRootInput) return props.renderDefault(props)

            const flatFieldTypeNames = flattenSchemaType(props.schemaType).map(
              (field) => field.type.name,
            )

            const hasExperiment = flatFieldTypeNames.some((name) => name.startsWith('experiment'))
            if (!hasExperiment) return props.renderDefault(props)

            const providerProps = {
              ...props,
              growthbookFieldPluginConfig: {...pluginConfig},
            }
            return GrowthbookProvider(providerProps)
          },
        },
      },
    }
  },
)

// New audience export
export const fieldLevelAudiences = definePlugin<GrowthbookAudienceFieldPluginConfig>((config) => {
  const pluginConfig = {...AUDIENCE_CONFIG_DEFAULT, ...config}
  const {fields, environment, project, baseUrl} = pluginConfig
  return {
    name: 'sanity-growthbook-personalization-plugin-field-level-audiences',
    plugins: [
      baseFieldLevelAudiences({
        fields,
        audiences: (client) => getSavedGroups({client, baseUrl, project}),
      }),
    ],
    form: {
      components: {
        input: (props) => {
          const isRootInput = props.id === 'root' && isObjectInputProps(props)
          if (!isRootInput) return props.renderDefault(props)

          const flatFieldTypeNames = flattenSchemaType(props.schemaType).map(
            (field) => field.type.name,
          )

          const hasAudience = flatFieldTypeNames.some((name) => name.startsWith('audience'))
          if (!hasAudience) return props.renderDefault(props)

          const providerProps = {
            ...props,
            growthbookAudienceFieldPluginConfig: {...pluginConfig},
          }
          return AudienceProvider(providerProps)
        },
      },
    },
  }
})
```

### Phase 5: Documentation and Testing (Week 3-4)

#### 5.1 Update Documentation

**File: `audiences.md`**

- [ ] Create comprehensive documentation for audience plugin
- [ ] Include setup instructions
- [ ] Add usage examples
- [ ] Document data structure and querying

**File: `README.md`**

- [ ] Update main README to mention both experiments and audiences
- [ ] Add links to specific documentation

#### 5.2 Update Package Configuration

**File: `package.json`**

- [ ] Update exports to include audience functionality
- [ ] Update TypeScript build configuration if needed

**File: `src/index.ts`**

```typescript
// Export both base plugins
export {fieldLevelExperiments} from './fieldExperiments'
export {fieldLevelAudiences} from './fieldAudiences'

// Export GrowthBook-specific plugins
export {
  fieldLevelExperiments as growthbookExperiments,
  fieldLevelAudiences as growthbookAudiences,
} from './growthbook'
```

## Usage Examples

### Experiments (Existing)

```typescript
import {fieldLevelExperiments} from '@sanity/personalization-plugin/growthbook'

export default defineConfig({
  plugins: [
    fieldLevelExperiments({
      fields: ['string', 'text'],
      environment: 'production',
      project: 'my-project',
    }),
  ],
})
```

### Audiences (New)

```typescript
import {fieldLevelAudiences} from '@sanity/personalization-plugin/growthbook'

export default defineConfig({
  plugins: [
    fieldLevelAudiences({
      fields: ['string', 'text'],
      environment: 'production',
      project: 'my-project',
      defaultVariantStrategy: 'in-out',
    }),
  ],
})
```

### Both Together

```typescript
import {fieldLevelExperiments, fieldLevelAudiences} from '@sanity/personalization-plugin/growthbook'

export default defineConfig({
  plugins: [
    // A/B testing experiments
    fieldLevelExperiments({
      fields: ['string'],
      environment: 'production',
    }),

    // Audience-based content
    fieldLevelAudiences({
      fields: ['text', 'image'],
      environment: 'production',
    }),
  ],
})
```

## Field Types Created

### Experiments

- `experimentString` - A/B test variants for strings
- `experimentText` - A/B test variants for text
- `variantString` - Individual experiment variant

### Audiences

- `audienceString` - Audience-targeted content for strings
- `audienceText` - Audience-targeted content for text
- `audienceVariantString` - Individual audience variant

## Data Structure Comparison

### Experiment Field

```json
{
  "_type": "experimentString",
  "default": "Default content",
  "active": true,
  "experimentId": "feature-123",
  "variants": [
    {
      "_key": "abc",
      "_type": "variantString",
      "variantId": "variation-a",
      "experimentId": "feature-123",
      "value": "Variant A content"
    }
  ]
}
```

### Audience Field

```json
{
  "_type": "audienceString",
  "default": "Default content",
  "active": true,
  "audienceId": "saved-group-456",
  "variants": [
    {
      "_key": "def",
      "_type": "audienceVariantString",
      "audienceId": "saved-group-456",
      "variantId": "saved-group-456-in",
      "value": "Content for audience members"
    }
  ]
}
```

## Migration Strategy

### Backward Compatibility

- [ ] Existing experiment fields continue to work unchanged
- [ ] No breaking changes to existing API
- [ ] GrowthBook experiment plugin maintains same export name

### Incremental Adoption

- [ ] Users can adopt audience functionality independently
- [ ] Both plugins can be used simultaneously
- [ ] Separate field types prevent conflicts

## Testing Strategy

### Unit Tests

- [ ] Test `getSavedGroups()` API integration
- [ ] Test audience field type creation
- [ ] Test audience context providers

### Integration Tests

- [ ] Test plugin registration
- [ ] Test field type detection
- [ ] Test Studio UI rendering

### E2E Tests

- [ ] Test complete audience workflow in Studio
- [ ] Test data storage and retrieval
- [ ] Test both plugins working together

## Success Criteria

### Technical

- [ ] `fieldLevelAudiences` plugin works independently
- [ ] No impact on existing experiment functionality
- [ ] Clean separation of concerns between experiments and audiences
- [ ] Proper error handling and loading states

### User Experience

- [ ] Clear distinction between experiments and audiences in Studio UI
- [ ] Intuitive content creation workflow
- [ ] Helpful documentation and examples
- [ ] Smooth onboarding experience

### Performance

- [ ] Efficient API calls to GrowthBook Saved Groups endpoint
- [ ] Proper caching and error handling
- [ ] No significant impact on Studio loading times

## Dependencies

### External

- [ ] GrowthBook Saved Groups API access
- [ ] `@sanity/studio-secrets` for authentication
- [ ] Existing Sanity plugin infrastructure

### Internal

- [ ] Reuse base field experiment logic
- [ ] Extend existing type system
- [ ] Leverage existing GrowthBook authentication

## Timeline

- **Week 1**: Infrastructure setup, shared components, basic API integration
- **Week 2**: Core audience plugin implementation, UI components
- **Week 3**: Plugin integration, testing, documentation
- **Week 4**: Final testing, documentation review, PR preparation

## Risks and Mitigations

### Risk: Breaking Changes

**Mitigation**: Careful separation of concerns, extensive testing of existing functionality

### Risk: API Rate Limits

**Mitigation**: Implement proper caching, pagination, and error handling

### Risk: Complex User Experience

**Mitigation**: Clear documentation, intuitive UI design, good error messages

### Risk: Maintenance Overhead

**Mitigation**: Shared components, consistent patterns, automated testing
