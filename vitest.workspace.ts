import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    extends: 'apps/backend/vitest.config.ts',
    test: {
      name: 'backend',
      root: 'apps/backend',
    },
  },
  {
    extends: 'packages/shared/vitest.config.ts',
    test: {
      name: 'shared',
      root: 'packages/shared',
    },
  },
]);
