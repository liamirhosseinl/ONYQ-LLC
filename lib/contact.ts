/** One stored phone value may hold several numbers separated by commas ("+374 94 809506, +374 94 406207"). */
export function phoneList(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

/** tel: link target — digits and a leading plus only. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
