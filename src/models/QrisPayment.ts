import { Payment } from "@/models/Payment";

export class QrisPayment extends Payment {
  process(total: number, _paid: number): void {
    void total;
    void _paid;
    this.change = 0;
  }

  getPaidAmount(total: number): number {
    return total;
  }
}
