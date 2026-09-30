import {colorInput} from '@sanity/color-input'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {SEO_SINGLETON_TYPES} from './schemaTypes/siteSeoPages'
import {structure} from './structure'

// Actions allowed on the SEO singletons: they can be edited, but not created/duplicated/deleted
const SINGLETON_ACTIONS = new Set(['publish', 'discardChanges', 'restore'])

export default defineConfig({
  name: 'default',
  title: 'kondor-device-admin',

  projectId: 'qmszlzqu',
  dataset: 'production',

  plugins: [structureTool({structure}), visionTool(), colorInput()],

  schema: {
    types: schemaTypes,
    templates: (templates) =>
      templates.filter(({schemaType}) => !SEO_SINGLETON_TYPES.includes(schemaType)),
  },

  document: {
    actions: (prev, {schemaType}) =>
      SEO_SINGLETON_TYPES.includes(schemaType)
        ? prev.filter(({action}) => action && SINGLETON_ACTIONS.has(action))
        : prev,
  },
})
