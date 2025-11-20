import { eq } from 'drizzle-orm';
import { db } from '../../db/drizzle';
import { usuarios } from '../../db/schema/users';
import { GetUsersInput } from './user.validator';

export class UserService {
  async getUsers(input: GetUsersInput) {
    const page = parseInt(input.page);
    const limit = parseInt(input.limit);
    const offset = (page - 1) * limit;

    const allUsers = await db.query.usuarios.findMany({
      limit,
      offset,
      columns: {
        password: false,
      },
    });

    return allUsers;
  }

  async getUserById(userId: string) {
    const user = await db.query.usuarios.findFirst({
      where: eq(usuarios.id, userId),
      columns: {
        password: false,
      },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return user;
  }
}
