export function whatsappHref(number: string | null | undefined, message?: string): string | null {
  if (!number || !/^[1-9]\d{7,14}$/.test(number)) return null;
  const url = new URL(`https://wa.me/${number}`);
  if (message) url.searchParams.set("text", message);
  return url.toString();
}

export function supportEmailHref(email: string | null | undefined): string | null {
  if (!email || !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) return null;
  return `mailto:${encodeURIComponent(email)}`;
}
