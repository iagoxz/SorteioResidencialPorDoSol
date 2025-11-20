import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../../db/drizzle';
import { usuarios } from '../../db/schema/users';
import { env } from '../../config/env';
import { RegisterInput, LoginInput } from './auth.validator';

const SALT_ROUNDS = 10;

export class AuthService {
  async register(input: RegisterInput) {
    const existingUser = await db.query.usuarios.findFirst({
      where: eq(usuarios.email, input.email),
    });

    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    const [user] = await db
      .insert(usuarios)
      .values({
        nome: input.nome,
        cpf: input.cpf,
        telefone: input.telefone,
        email: input.email,
        password: hashedPassword,
        role: input.role,
      })
      .returning({
        id: usuarios.id,
        nome: usuarios.nome,
        email: usuarios.email,
        role: usuarios.role,
        createdAt: usuarios.createdAt,
      });

    const token = this.generateToken(user.id, user.role);

    return { user, token };
  }

  async login(input: LoginInput) {
    const user = await db.query.usuarios.findFirst({
      where: eq(usuarios.email, input.email),
    });

    if (!user || !user.password) {
      throw new Error('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(input.password, user.password);

    if (!passwordMatch) {
      throw new Error('Credenciais inválidas');
    }

    const token = this.generateToken(user.id, user.role);

    return {
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  private generateToken(userId: string, role: string): string {
    return jwt.sign({ userId, role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }
}
