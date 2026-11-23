import { Payment } from "@/models/Payment";

export class CashPayment extends Payment {
  process(total: number, paid: number): void {
    if (paid < total) {
      throw new Error("Uang yang dibayarkan masih kurang dari total belanja.");
    }
    this.change = paid - total;
  }
}
