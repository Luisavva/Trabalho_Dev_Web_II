import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/auth';

/**
 * Popula o banco com um usuário ADMIN e algumas etiquetas iniciais.
 * Execute com: npm run seed
 */
async function main() {
  const adminEmail = 'admin@taskflow.dev';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    await prisma.user.create({
      data: {
        name: 'Administrador',
        email: adminEmail,
        password: await hashPassword('admin123'),
        role: 'ADMIN',
      },
    });
    console.log(`✅ Admin criado: ${adminEmail} (senha: admin123)`);
  } else {
    console.log('ℹ️  Admin já existe, pulando.');
  }

  const tags = [
    { name: 'urgente', color: '#e11d48' },
    { name: 'bug', color: '#f97316' },
    { name: 'feature', color: '#22c55e' },
    { name: 'documentacao', color: '#3b82f6' },
  ];
  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    });
  }
  console.log(`✅ ${tags.length} etiquetas garantidas.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
