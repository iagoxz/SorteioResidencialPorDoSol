import { db } from '../../db/drizzle';
import { pagamentos, cotas, rifas } from '../../db/schema/rifas';
import { eq, and, inArray } from 'drizzle-orm';
import { paymentClient } from '../../config/mercadopago';
import { redisClient } from '../../config/redis';
import { logger } from '../../utils/logger';
import { CheckoutInput } from './pagamento.validator';

export class PagamentoService {
  private readonly RESERVA_EXPIRA_MINUTOS = 15;
  private readonly PAGAMENTO_EXPIRA_MINUTOS = 30;

  /**
   * Sorteia cotas aleatoriamente
   */
  private sortearCotas(cotasDisponiveis: any[], quantidade: number) {
    const shuffled = [...cotasDisponiveis].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, quantidade);
  }

  /**
   * Cria checkout PIX via Mercado Pago
   */
  async criarCheckout(input: CheckoutInput, userId?: string) {
    // 1. Buscar rifa
    const rifa = await db.query.rifas.findFirst({
      where: eq(rifas.id, input.rifaId),
    });

    if (!rifa) {
      throw new Error('Rifa não encontrada');
    }

    if (rifa.status !== 'ativa') {
      throw new Error('Rifa não está ativa');
    }

    // 2. Buscar cotas disponíveis e sortear aleatoriamente
    const todasCotasDisponiveis = await db.query.cotas.findMany({
      where: and(
        eq(cotas.rifaId, input.rifaId),
        eq(cotas.status, 'disponivel')
      ),
    });

    if (todasCotasDisponiveis.length < input.quantidadeCotas) {
      throw new Error(`Apenas ${todasCotasDisponiveis.length} cota(s) disponível(is)`);
    }

    // Sortear cotas aleatoriamente
    const cotasSorteadas = this.sortearCotas(todasCotasDisponiveis, input.quantidadeCotas);
    const numerosCotasSorteadas = cotasSorteadas.map(c => c.numero);

    // 3. Reservar cotas no Redis (evitar double-booking)
    // Usar telefone ou userId como identificador
    const identificador = userId || input.clienteTelefone;
    const reservaKey = `reserva:${identificador}:${input.rifaId}`;
    const reservaExistente = await redisClient.get(reservaKey);

    if (reservaExistente) {
      throw new Error('Você já possui uma reserva ativa para esta rifa');
    }

    await redisClient.setEx(
      reservaKey,
      this.RESERVA_EXPIRA_MINUTOS * 60,
      JSON.stringify(numerosCotasSorteadas)
    );

    // 4. Atualizar cotas no banco para "reservada"
    const expiraEm = new Date();
    expiraEm.setMinutes(expiraEm.getMinutes() + this.RESERVA_EXPIRA_MINUTOS);

    await db
      .update(cotas)
      .set({
        status: 'reservada',
        usuarioId: userId || null,
        clienteTelefone: input.clienteTelefone,
        clienteCpf: input.clienteCpf,
        reservaExpiraEm: expiraEm,
      })
      .where(
        and(
          eq(cotas.rifaId, input.rifaId),
          inArray(cotas.numero, numerosCotasSorteadas)
        )
      );

    // 5. Calcular valor total
    const valorTotal = Number(rifa.precoCota) * input.quantidadeCotas;

    // 6. Criar pagamento no Mercado Pago (ou simular)
    const expiraEmPagamento = new Date();
    expiraEmPagamento.setMinutes(expiraEmPagamento.getMinutes() + this.PAGAMENTO_EXPIRA_MINUTOS);

    let payment: any;
    const isSimulationMode = process.env.MP_SIMULATE === 'true';

    if (isSimulationMode) {
      // Modo de simulação - gera dados fake
      const fakePaymentId = `SIMULATED-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      payment = {
        id: fakePaymentId,
        point_of_interaction: {
          transaction_data: {
            qr_code: '00020126580014br.gov.bcb.pix013612345678901234567890123456789012520400005303986540510.005802BR5913Mercado Pago6009SAO PAULO62410503***50300017br.gov.bcb.brcode01051.0.06304ABCD',
            qr_code_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            ticket_url: 'https://www.mercadopago.com.br/payments/123456789/ticket?caller_id=123456789&hash=abcd1234'
          }
        }
      };
      logger.info({ paymentId: payment.id }, '🎭 Pagamento PIX SIMULADO criado (modo teste)');
    } else {
      // Modo real - chama Mercado Pago
      const paymentBody = {
        transaction_amount: valorTotal,
        description: `${rifa.titulo} - ${input.quantidadeCotas} cota(s): ${numerosCotasSorteadas.join(', ')}`,
        payment_method_id: 'pix',
        payer: {
          email: 'cliente@email.com',
        },
        notification_url: `${process.env.APP_URL || 'http://localhost:3000'}/api/pagamentos/webhook`,
        date_of_expiration: expiraEmPagamento.toISOString(),
        metadata: {
          user_id: userId || '',
          cliente_telefone: input.clienteTelefone,
          cliente_cpf: input.clienteCpf,
          rifa_id: input.rifaId.toString(),
          numeros_cota: numerosCotasSorteadas.join(','),
        },
      };

      logger.info({ paymentBody, accessToken: process.env.MP_ACCESS_TOKEN?.substring(0, 20) + '...' }, 'Tentando criar pagamento no Mercado Pago');

      payment = await paymentClient.create({
        body: paymentBody,
      });

      logger.info({ paymentId: payment.id }, 'Pagamento PIX criado no Mercado Pago');
    }

    // 7. Salvar no banco
    const [pagamentoDb] = await db
      .insert(pagamentos)
      .values({
        usuarioId: userId || null,
        clienteTelefone: input.clienteTelefone,
        clienteCpf: input.clienteCpf,
        rifaId: input.rifaId,
        valor: valorTotal.toString(),
        metodo: input.metodoPagamento,
        status: 'pendente',
        mpPaymentId: payment.id?.toString(),
        qrCode: payment.point_of_interaction?.transaction_data?.qr_code,
        qrCodeUrl: payment.point_of_interaction?.transaction_data?.qr_code_base64,
        pixPayload: payment.point_of_interaction?.transaction_data?.qr_code,
        expiraEm: expiraEmPagamento,
      })
      .returning();

    return {
      pagamentoId: pagamentoDb.id,
      mpPaymentId: payment.id,
      status: payment.status,
      qrCode: payment.point_of_interaction?.transaction_data?.qr_code_base64,
      pixPayload: payment.point_of_interaction?.transaction_data?.qr_code,
      valor: valorTotal,
      expiraEm: expiraEmPagamento,
      cotas: numerosCotasSorteadas,
    };
  }

  /**
   * Processa webhook do Mercado Pago
   */
  async processarWebhook(paymentId: string) {
    logger.info({ paymentId }, 'Processando webhook do Mercado Pago');

    // 1. Buscar informações do pagamento no MP
    const payment = await paymentClient.get({ id: paymentId });

    if (!payment) {
      throw new Error('Pagamento não encontrado no Mercado Pago');
    }

    logger.info({ status: payment.status, paymentId }, 'Status do pagamento no MP');

    // 2. Buscar pagamento no banco
    const pagamentoDb = await db.query.pagamentos.findFirst({
      where: eq(pagamentos.mpPaymentId, paymentId),
    });

    if (!pagamentoDb) {
      logger.warn({ paymentId }, 'Pagamento não encontrado no banco de dados');
      return;
    }

    // 3. Atualizar status do pagamento
    const novoStatus = this.mapearStatusMP(payment.status || 'pending');

    await db
      .update(pagamentos)
      .set({
        status: novoStatus,
        transacaoId: payment.id?.toString(),
        updatedAt: new Date(),
      })
      .where(eq(pagamentos.id, pagamentoDb.id));

    // 4. Se aprovado, confirmar cotas e liberar reserva
    if (payment.status === 'approved') {
      await this.confirmarPagamento(pagamentoDb);
    }

    // 5. Se cancelado/expirado, liberar cotas
    if (['cancelled', 'expired', 'rejected'].includes(payment.status || '')) {
      await this.liberarCotas(pagamentoDb);
    }
  }

  /**
   * Confirma pagamento e libera cotas
   */
  private async confirmarPagamento(pagamento: typeof pagamentos.$inferSelect) {
    logger.info({ pagamentoId: pagamento.id }, 'Confirmando pagamento');

    // 1. Buscar cotas reservadas pelo usuário/cliente para esta rifa
    const condicoes = [eq(cotas.rifaId, pagamento.rifaId), eq(cotas.status, 'reservada')];
    
    if (pagamento.usuarioId) {
      condicoes.push(eq(cotas.usuarioId, pagamento.usuarioId));
    } else {
      condicoes.push(eq(cotas.clienteTelefone, pagamento.clienteTelefone!));
      condicoes.push(eq(cotas.clienteCpf, pagamento.clienteCpf!));
    }

    const cotasReservadas = await db.query.cotas.findMany({
      where: and(...condicoes),
    });

    if (cotasReservadas.length === 0) {
      logger.warn({ pagamentoId: pagamento.id }, 'Nenhuma cota reservada encontrada');
      return;
    }

    // 2. Atualizar cotas para "paga"
    await db
      .update(cotas)
      .set({
        status: 'paga',
        reservaExpiraEm: null,
      })
      .where(
        and(...condicoes)
      );

    // 3. Limpar reserva no Redis
    const identificador = pagamento.usuarioId || pagamento.clienteTelefone;
    const reservaKey = `reserva:${identificador}:${pagamento.rifaId}`;
    await redisClient.del(reservaKey);

    logger.info(
      { pagamentoId: pagamento.id, qtdCotas: cotasReservadas.length },
      'Pagamento confirmado e cotas liberadas'
    );
  }

  /**
   * Libera cotas em caso de cancelamento/expiração
   */
  private async liberarCotas(pagamento: typeof pagamentos.$inferSelect) {
    logger.info({ pagamentoId: pagamento.id }, 'Liberando cotas');

    const condicoes = [eq(cotas.rifaId, pagamento.rifaId), eq(cotas.status, 'reservada')];
    
    if (pagamento.usuarioId) {
      condicoes.push(eq(cotas.usuarioId, pagamento.usuarioId));
    } else {
      condicoes.push(eq(cotas.clienteTelefone, pagamento.clienteTelefone!));
      condicoes.push(eq(cotas.clienteCpf, pagamento.clienteCpf!));
    }

    await db
      .update(cotas)
      .set({
        status: 'disponivel',
        usuarioId: null,
        clienteTelefone: null,
        clienteCpf: null,
        reservaExpiraEm: null,
      })
      .where(
        and(...condicoes)
      );

    // Limpar reserva no Redis
    const identificador = pagamento.usuarioId || pagamento.clienteTelefone;
    const reservaKey = `reserva:${identificador}:${pagamento.rifaId}`;
    await redisClient.del(reservaKey);
  }

  /**
   * Mapear status do Mercado Pago para nosso sistema
   */
  private mapearStatusMP(statusMP: string): string {
    const mapa: Record<string, string> = {
      pending: 'pendente',
      approved: 'pago',
      authorized: 'pago',
      in_process: 'pendente',
      in_mediation: 'pendente',
      rejected: 'cancelado',
      cancelled: 'cancelado',
      refunded: 'cancelado',
      charged_back: 'cancelado',
      expired: 'expirado',
    };

    return mapa[statusMP] || 'pendente';
  }

  /**
   * Buscar status de um pagamento
   */
  async buscarPagamento(pagamentoId: number, userId: string) {
    const pagamento = await db.query.pagamentos.findFirst({
      where: and(
        eq(pagamentos.id, pagamentoId),
        eq(pagamentos.usuarioId, userId)
      ),
    });

    if (!pagamento) {
      throw new Error('Pagamento não encontrado');
    }

    // Se tiver MP Payment ID, buscar status atualizado no MP
    if (pagamento.mpPaymentId && process.env.MP_SIMULATE !== 'true') {
      try {
        const payment = await paymentClient.get({ id: pagamento.mpPaymentId });
        
        return {
          ...pagamento,
          statusMP: payment.status,
          statusDescription: payment.status_detail,
        };
      } catch (error) {
        logger.error({ error }, 'Erro ao buscar pagamento no MP');
      }
    }

    return pagamento;
  }

  /**
   * Simular aprovação de pagamento (modo simulação apenas)
   */
  async simularAprovacao(pagamentoId: number, userId: string) {
    const pagamento = await db.query.pagamentos.findFirst({
      where: and(
        eq(pagamentos.id, pagamentoId),
        eq(pagamentos.usuarioId, userId)
      ),
    });

    if (!pagamento) {
      throw new Error('Pagamento não encontrado');
    }

    if (pagamento.status !== 'pendente') {
      throw new Error(`Pagamento já está com status: ${pagamento.status}`);
    }

    logger.info({ pagamentoId }, '🎭 Simulando aprovação de pagamento');

    // Atualizar status para pago
    await db
      .update(pagamentos)
      .set({
        status: 'pago',
        updatedAt: new Date(),
      })
      .where(eq(pagamentos.id, pagamentoId));

    // Buscar pagamento atualizado
    const pagamentoAtualizado = await db.query.pagamentos.findFirst({
      where: eq(pagamentos.id, pagamentoId),
    });

    if (!pagamentoAtualizado) {
      throw new Error('Erro ao buscar pagamento atualizado');
    }

    // Confirmar cotas
    await this.confirmarPagamento(pagamentoAtualizado);

    logger.info({ pagamentoId }, '✅ Pagamento simulado aprovado com sucesso');
  }
}
