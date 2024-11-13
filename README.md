# sanity-plugin-personalisation

> This is a **Sanity Studio v3** plugin.

## Installation

```sh
npm install sanity-plugin-personalisation
```

## Usage

Add it as a plugin in `sanity.config.ts` (or .js):

```ts
import {defineConfig} from 'sanity'
import {fieldLevelExperiments} from 'sanity-plugin-personalisation'

export default defineConfig({
  //...
  plugins: [
    //...
    fieldLevelExperiments({
      fields: [
        'string',
        defineField({
          name: 'other',
          type: 'reference',
          to: [{type: 'post'}],
        }),
      ],

      // either an array of experiments or async function that returns an array of experiments
      experiments: [experiment1, experiment2],
    }),
  ],
})
```

## License

[MIT](LICENSE) © Jon Burbridge

## Develop & test

This plugin uses [@sanity/plugin-kit](https://github.com/sanity-io/plugin-kit)
with default configuration for build & watch scripts.

See [Testing a plugin in Sanity Studio](https://github.com/sanity-io/plugin-kit#testing-a-plugin-in-sanity-studio)
on how to run this plugin with hotreload in the studio.
