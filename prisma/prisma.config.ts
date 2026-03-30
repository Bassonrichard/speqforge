import { defineConfig } from '@prisma/internals';

export default defineConfig({
  datasources: {
    db: {
      provider: 'sqlite',
      url: process.env.DATABASE_URL || 'file:./dev.db',
    },
  },
});
