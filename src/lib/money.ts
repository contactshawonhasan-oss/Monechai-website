// BDT amounts are integer poisha, never floating-point totals.
export function bdtToMinor(taka: number): number {
  if (!Number.isSafeInteger(taka) || taka < 0 || taka > Math.floor(2147483647 / 100)) {
    throw new RangeError("BDT amount must be a nonnegative whole taka amount within the database limit");
  }
  return taka * 100;
}

export function addMinor(...amounts: number[]): number {
  let total = 0;
  for (const amount of amounts) {
    if (!Number.isSafeInteger(amount) || amount < 0) throw new RangeError("Invalid minor-unit amount");
    total += amount;
    if (!Number.isSafeInteger(total)) throw new RangeError("Money total overflow");
  }
  return total;
}

export function multiplyMinor(amount: number, quantity: number): number {
  if (!Number.isSafeInteger(amount) || amount < 0 || !Number.isSafeInteger(quantity) || quantity < 1) {
    throw new RangeError("Invalid price or quantity");
  }
  const total = amount * quantity;
  if (!Number.isSafeInteger(total)) throw new RangeError("Money total overflow");
  return total;
}

export function formatBdt(minor: number, locale: "en-BD" | "bn-BD" = "en-BD"): string {
  if (!Number.isSafeInteger(minor) || minor < 0) throw new RangeError("Invalid minor-unit amount");
  return new Intl.NumberFormat(locale, { style: "currency", currency: "BDT" }).format(minor / 100);
}
