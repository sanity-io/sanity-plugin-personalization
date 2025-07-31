# @sanity/personalization-plugin - GrowthBook

## Previously know as @sanity/personalisation-plugin

> This is a **Sanity Studio v3** plugin.

This plugin allows users to add a/b/n testing experiments to individual fields connecting to the [Growthbook](https://www.growthbook.io/) A/B testing service.

- [@sanity/personalization-plugin - GrowthBook](#sanitypersonalization-plugin---GrowthBook)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Loading Experiments](#loading-experiments)

This plugin is built on top of the `fieldLevelExperiments` export so see the main readme for details of:

- [Using complex field configurations](/#using-complex-field-configurations)
- [Validation of individual array items](/#validation-of-individual-array-items)
- [Shape of stored data](/#shape-of-stored-data)
- [Querying data](/#querying-data)
- [License](#license)
- [Develop \& test](#develop--test)
  - [Release new version](#release-new-version)
- [License](#license-1)

## Installation

```sh
npm install @sanity/personalization-plugin
```

## Usage

Add it as a plugin in `sanity.config.ts` (or .js):

```ts
import {defineConfig} from 'sanity'
import {fieldLevelExperiments} from '@sanity/personalization-plugin/growthbook'

export default defineConfig({
  //...
  plugins: [
    //...
    fieldLevelExperiments({
      fields: ['string'],
      environment: 'production', // the growthbook environment
      projectId: 'string', // optional filter parameter for fetching features/experiments
      convertBooleans: true, // convert boolean experiments to store values of "control"/"variant" default to false
      tags: ['string'], // optional filter, if included feature must have at least one of the tag specified
      enableAudiences: true, // enable audience targeting functionality
    }),
  ],
})
```

## Targeting Modes

When `enableAudiences` is enabled, the plugin supports three content targeting scenarios:

### 1. A/B Testing (Experiment Mode)

Traditional A/B testing with experiment variants from GrowthBook:

- Select "A/B Testing (Experiment)" as targeting mode
- Choose an experiment from GrowthBook
- Optionally target a specific audience
- Create variants based on experiment variations

### 2. Audience-Only Targeting

Serve specific content to audiences without experiments:

- Select "Audience Only" as targeting mode
- Choose a target audience (required)
- Create a single variant with content specifically for that audience
- The **default** content will be shown to everyone else

### 3. Experiment + Audience Targeting

A/B testing targeted to a specific audience:

- Select "A/B Testing (Experiment)" as targeting mode
- Choose both an experiment AND an audience
- Create experiment variants that will only be shown to the selected audience

## Data Structure

The plugin creates enhanced field types based on the fields you specify. For example, with `fields: ['string']`, you get:

### Field Structure

- `experimentString` - Main field with:
  - `default` - Default content for everyone
  - `active` - Boolean to enable personalization
  - `targetingMode` - "experiment" or "audience"
  - `experimentAudienceId` - Optional audience for experiments (only shown in experiment mode)
  - `audienceId` - Required audience for audience-only mode (only shown in audience mode)
  - `experimentId` - Selected experiment (required for experiments)
  - `variants` - Array of experiment variants
  - `audienceVariants` - Array of audience-specific content

### Variant Structure

**Experiment variants:**

```json
{
  "_key": "abc123",
  "_type": "variantString",
  "variantId": "control",
  "experimentId": "feature-homepage",
  "value": "Variant content"
}
```

**Audience variants:**

```json
{
  "_key": "def456",
  "_type": "variantString",
  "variantId": "audience-content",
  "audienceId": "premium-users",
  "value": "Content for premium users"
}
```

Use the experiment field in your schema like this:

```ts
//for Example in post.ts

fields: [
  defineField({
    name: 'title',
    type: 'experimentString',
  }),
]
```

## Loading Experiments

This plugin uses [@sanity/studio-secrets](https://www.npmjs.com/package/@sanity/studio-secrets) for storing your GrowthBook API key. The first time you open a document that has an experiment you will be asked to provide your API key. This is stored in a private document on the dataset.

Once you have entered you API key the plugin will fetch non archived features and variants of experiments for those features. If features/experiments are updated on Growthbook you will need to refresh the page.

The values stored for an experiment will be the Feature Key amd the variants will stored the variation value. The exception to this is boolean values when the `convertBooleans` config flag is set to true. In that case `false` will be set as `control` and true will be set as `variant`
