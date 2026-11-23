export abstract class Payment {
  protected change = 0;

  abstract process(total: number, paid: number): void;

  getChange(): number {
    return this.change;
  }
}
