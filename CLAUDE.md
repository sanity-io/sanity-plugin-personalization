# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Build**: `npm run build` - Verifies package and builds with strict mode
- **Watch**: `npm run watch` - Builds in watch mode for development
- **Lint**: `npm run lint` - Runs ESLint with auto-fix
- **Format**: `npm run format` - Formats code with Prettier
- **Type Check**: TypeScript compilation is included in lint-staged hooks

## Architecture Overview

This is a Sanity.io plugin for A/B testing and personalization at the field level. The plugin creates custom field types that allow editors to define default values and experiment variants.

### Core Structure

- **Main Plugin**: `src/fieldExperiments.tsx` - Contains the `fieldLevelExperiments` plugin definition
- **Components**: `src/components/` - React components for the field UI
  - `ExperimentField.tsx` - Main field wrapper component
  - `ExperimentInput.tsx` - Input for selecting experiments
  - `VariantInput.tsx` - Input for variant values
  - `Array.tsx` - Array input for managing variants
  - `ExperimentContext.tsx` - Context provider for experiment configuration
- **Types**: `src/types.ts` - TypeScript definitions for experiments, variants, and plugin config
- **Utilities**: `src/utils/` - Helper functions including schema type flattening

### Plugin Exports

The plugin provides two main exports:
- Main plugin: `fieldLevelExperiments` from `src/index.ts`
- GrowthBook integration: Available via `@sanity/personalization-plugin/growthbook`

### Field Generation Pattern

The plugin dynamically creates two schema types for each configured field:
1. **Experiment Type** (e.g., `experimentString`): Contains default value + experiment configuration
2. **Variant Type** (e.g., `variantString`): Individual variant values within experiments

### Configuration

Plugin accepts configuration with:
- `fields`: Array of field types (strings or FieldDefinition objects)
- `experiments`: Static array or async function returning experiment definitions
- `experimentNameOverride`/`variantNameOverride`: Customize field naming

## GrowthBook Integration

Separate GrowthBook-specific functionality available in `src/growthbook/`:
- Components for GrowthBook context and secrets management
- Type definitions for GrowthBook API responses
- Utilities for transforming GrowthBook data to plugin format