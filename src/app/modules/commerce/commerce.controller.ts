import { FastifyRequest, FastifyReply } from 'fastify';
import { CommerceService } from './commerce.service';

export class CommerceController {
  private commerceService: CommerceService;

  constructor() {
    this.commerceService = new CommerceService();
  }

  public getCatalog = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const catalog = await this.commerceService.getCatalog();
    reply.send(catalog);
  }

  public createPayment = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const payment = await this.commerceService.createPayment((request.body as any).userId, (request.body as any).items);
    reply.send(payment);
  }

  public getPaymentStatus = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const payment = await this.commerceService.getPaymentStatus((request.params as any).transactionId);
    reply.send(payment);
  }
}
