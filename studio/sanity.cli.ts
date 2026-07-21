import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '6flkjd1o',
    dataset: 'production'
  },
  studioHost: 'khaled-blog',
  deployment: {
    autoUpdates: true,
  },
})
