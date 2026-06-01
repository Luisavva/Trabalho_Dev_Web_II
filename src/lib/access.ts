import { prisma } from './prisma';

export type ProjectRole = 'OWNER' | 'COLLABORATOR' | null;

export interface ProjectAccess {
  /** projeto encontrado (ou null se não existir / estiver soft-deletado) */
  project: Awaited<ReturnType<typeof findProject>>;
  /** papel do usuário no projeto, ou null se não tiver acesso */
  role: ProjectRole;
}

function findProject(projectId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    include: { collaborators: true },
  });
}

/**
 * Calcula o nível de acesso de um usuário a um projeto.
 * - "OWNER": é o dono do projeto.
 * - "COLLABORATOR": consta como colaborador.
 * - null: não tem acesso (ou o projeto não existe).
 * ADMIN é tratado nas rotas (ignora a verificação de propriedade).
 */
export async function getProjectAccess(projectId: string, userId: string): Promise<ProjectAccess> {
  const project = await findProject(projectId);
  if (!project) return { project: null, role: null };
  if (project.ownerId === userId) return { project, role: 'OWNER' };
  const isCollaborator = project.collaborators.some((c) => c.userId === userId);
  return { project, role: isCollaborator ? 'COLLABORATOR' : null };
}
