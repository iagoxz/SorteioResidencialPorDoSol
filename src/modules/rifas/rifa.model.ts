import { rifas, cotas, pagamentos, cupons, sorteios } from '../../db/schema/rifas';

export type Rifa = typeof rifas.$inferSelect;
export type CreateRifa = typeof rifas.$inferInsert;
export type Cota = typeof cotas.$inferSelect;
export type CreateCota = typeof cotas.$inferInsert;
export type Pagamento = typeof pagamentos.$inferSelect;
export type CreatePagamento = typeof pagamentos.$inferInsert;
export type Cupom = typeof cupons.$inferSelect;
export type CreateCupom = typeof cupons.$inferInsert;
export type Sorteio = typeof sorteios.$inferSelect;
export type CreateSorteio = typeof sorteios.$inferInsert;
