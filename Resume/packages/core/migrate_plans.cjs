const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Migrating PRO users to EARLY_BIRD...');
  // Since we haven't pushed the schema yet, the client might not know EARLY_BIRD.
  // We can use a raw query.
  try {
    const result = await prisma.$executeRawUnsafe(
        "UPDATE users SET plan = 'EARLY_BIRD' WHERE plan = 'PRO'"
    );
    console.log(`Successfully migrated ${result} users.`);
  } catch (e) {
    console.error('Migration failed. This might be because EARLY_BIRD is not yet in the enum.', e.message);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
