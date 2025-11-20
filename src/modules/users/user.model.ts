import { usuarios } from '../../db/schema/users';

export type Usuario = typeof usuarios.$inferSelect;
export type CreateUsuario = typeof usuarios.$inferInsert;
