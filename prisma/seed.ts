import { db } from '../src/lib/db';

/**
 * Database seed script
 * Run with: bunx tsx prisma/seed.ts
 */
async function main() {
  console.log('🌱 Seeding database...');

  // Create a test organization
  const org = await db.organization.create({
    data: {
      name: 'Test Organization',
      aiSettings: {
        defaultProvider: 'openai',
        providers: ['openai', 'anthropic'],
      },
      approvalThreshold: 'SINGLE',
    },
  });
  console.log(`✅ Created organization: ${org.name}`);

  // Create a test user
  const user = await db.user.create({
    data: {
      id: 'gh_test_user_123',
      username: 'testuser',
      email: 'test@example.com',
      avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
      githubToken: 'ghu_test_token_123',
    },
  });
  console.log(`✅ Created user: ${user.username}`);

  // Add user to organization as admin
  const membership = await db.orgMember.create({
    data: {
      userId: user.id,
      orgId: org.id,
      role: 'admin',
    } as any,
  });
  console.log(`✅ Added user to organization as ${membership.role}`);

  // Create a test project
  const project = await db.project.create({
    data: {
      name: 'Example Project',
      description: 'A test project to explore SeqForge',
      orgId: org.id,
    } as any,
  });
  console.log(`✅ Created project: ${project.name}`);

  // Create a test feature
  const feature = await db.feature.create({
    data: {
      title: 'User Authentication',
      description: 'Implement GitHub OAuth authentication',
      projectId: project.id,
      status: 'ACTIVE',
      createdBy: user.id,
    } as any,
  });
  console.log(`✅ Created feature: ${feature.title}`);

  // Create a spec revision
  const spec = await db.specRevision.create({
    data: {
      featureId: feature.id,
      revNumber: 1,
      branchName: `spec/example-project/${feature.id}-r1`,
      commitSha: '0000000000000000000000000000000000000000',
      status: 'DRAFT',
    } as any,
  });
  console.log(`✅ Created spec revision: v${spec.revNumber}`);

  console.log('✨ Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
