import { MercadoPagoConfig, Payment } from 'mercadopago';
import { env } from './env';

const client = new MercadoPagoConfig({
  accessToken: env.MP_ACCESS_TOKEN || 'fake-token-for-simulation',
  options: {
    timeout: 5000,
  },
});

export const paymentClient = new Payment(client);
