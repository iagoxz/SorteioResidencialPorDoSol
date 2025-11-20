import { eq, and, inArray } from 'drizzle-orm';
import { db } from '../../db/drizzle';
import { rifas, cotas, pagamentos, cupons } from '../../db/schema/rifas';
import { CreateRifaInput, ReservarCotaInput, ComprarCotaInput } from './rifa.validator';

export class RifaService {
  async createRifa(input: CreateRifaInput) {
    // Cria a rifa
    const [rifa] = await db
      .insert(rifas)
      .values({
        titulo: input.titulo,
        descricao: input.descricao,
        precoCota: input.precoCota,
        totalCotas: input.totalCotas,
        dataFim: new Date(input.dataFim),
        sorteioTipo: input.sorteioTipo,
      })
      .returning();

    // Cria todas as cotas automaticamente
    const cotasData = Array.from({ length: input.totalCotas }, (_, i) => ({
      rifaId: rifa.id,
      numero: i + 1,
      status: 'disponivel',
    }));

    await db.insert(cotas).values(cotasData);

    return rifa;
  }

  async getRifas() {
    const allRifas = await db.query.rifas.findMany({
      where: eq(rifas.status, 'ativa'),
    });

    return allRifas;
  }

  async getRifaById(rifaId: number) {
    const rifa = await db.query.rifas.findFirst({
      where: eq(rifas.id, rifaId),
    });

    if (!rifa) {
      throw new Error('Rifa não encontrada');
    }

    return rifa;
  }

  async getCotasByRifa(rifaId: number) {
    const cotasRifa = await db.query.cotas.findMany({
      where: eq(cotas.rifaId, rifaId),
    });

    return cotasRifa;
  }

  async reservarCota(input: ReservarCotaInput, userId: string) {
    const cota = await db.query.cotas.findFirst({
      where: and(
        eq(cotas.rifaId, input.rifaId),
        eq(cotas.numero, input.numeroCota)
      ),
    });

    if (!cota) {
      throw new Error('Cota não encontrada');
    }

    if (cota.status !== 'disponivel') {
      throw new Error('Cota não está disponível');
    }

    // Reserva por 15 minutos
    const reservaExpira = new Date();
    reservaExpira.setMinutes(reservaExpira.getMinutes() + 15);

    const [cotaReservada] = await db
      .update(cotas)
      .set({
        status: 'reservada',
        usuarioId: userId,
        reservaExpiraEm: reservaExpira,
      })
      .where(eq(cotas.id, cota.id))
      .returning();

    return cotaReservada;
  }

  async comprarCotas(input: ComprarCotaInput, userId: string) {
    const rifa = await this.getRifaById(input.rifaId);

    if (rifa.status !== 'ativa') {
      throw new Error('Rifa não está ativa');
    }

    // Busca as cotas
    const cotasSelecionadas = await db.query.cotas.findMany({
      where: and(
        eq(cotas.rifaId, input.rifaId),
        inArray(cotas.id, input.cotaIds)
      ),
    });

    if (cotasSelecionadas.length !== input.cotaIds.length) {
      throw new Error('Algumas cotas não foram encontradas');
    }

    // Verifica se todas estão reservadas pelo usuário
    for (const cota of cotasSelecionadas) {
      if (cota.status !== 'reservada' || cota.usuarioId !== userId) {
        throw new Error(`Cota ${cota.numero} não está reservada por você`);
      }
    }

    // Calcula valor total
    const valorTotal = parseFloat(rifa.precoCota) * input.cotaIds.length;

    // Cria pagamento
    const [pagamento] = await db
      .insert(pagamentos)
      .values({
        usuarioId: userId,
        rifaId: input.rifaId,
        valor: valorTotal.toFixed(2),
        metodo: input.metodo,
        status: 'pendente',
        transacaoId: `TXN-${Date.now()}`,
      })
      .returning();

    // Marca cotas como pagas
    await db
      .update(cotas)
      .set({ status: 'paga' })
      .where(inArray(cotas.id, input.cotaIds));

    // Cria cupons
    const cuponsData = input.cotaIds.map(cotaId => ({
      pagamentoId: pagamento.id,
      cotaId,
    }));

    await db.insert(cupons).values(cuponsData);

    return { pagamento, cotas: cotasSelecionadas };
  }
}
