# @sanity/personalization-plugin - launchDarklyFieldLevel

## Previously know as @sanity/personalisation-plugin

> This is a **Sanity Studio v3** plugin.

This plugin allows users to add a/b/n testing experiments to individual fields connecting to the [LaunchDarkly](https://launchdarkly.com//) A/B testing service.

- [@sanity/personalization-plugin - launchDarklyFieldLevel](#sanitypersonalization-plugin---launchDarklyFieldLevel)
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
import {launchDarklyFieldLevel} from '@sanity/personalization-plugin'

export default defineConfig({
  //...
  plugins: [
    //...
    launchDarklyFieldLevel({
      fields: ['string'],
      projectKey: 'string', // optional filter parameter for fetching features/experiments
      tags: ['string'] // filters the list to flags that have all of the tags in the list
    }),
  ],
})
```

This will register two new fields to the schema., based on the setting passed into `fields:`

- `experimentString` an Object field with `string` field called `default`, a `string` field called `experimentId` and an array field of type:
- `varirantsString` an object field with a `string` field called `value`, a string field called `variantId`, a `string` field called `experimentId`.

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

This plugin uses [@sanity/studio-secrets](https://www.npmjs.com/package/@sanity/studio-secrets) for storing your Launch Darkly API key. The first time you open a document that has an experiment you will be asked to provide your API key. This is stored in a private document on the dataset.

Once you have entered you API key the plugin will fetch feature flags and variants flags. If features/experiments are updated on LaunchDarkly you will need to refresh the page.

The values stored for an experiment will be the Feature Key amd the variants will stored the variation value.