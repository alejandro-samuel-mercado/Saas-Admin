import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currencyCode: string = 'USD', customSymbol?: string) {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(value)) return formatCurrency(0, currencyCode, customSymbol);

  const locales: Record<string, string> = { 
    ARS: 'es-AR', MXN: 'es-MX', USD: 'en-US', EUR: 'es-ES', 
    CLP: 'es-CL', COP: 'es-CO', UYU: 'es-UY', BRL: 'pt-BR',
    PEN: 'es-PE', BOB: 'es-BO', PYG: 'es-PY', GBP: 'en-GB',
    VES: 'es-VE', CRC: 'es-CR', DOP: 'es-DO', GTQ: 'es-GT',
    HNL: 'es-HN', NIO: 'es-NI', PAB: 'es-PA', CAD: 'en-CA',
    CHF: 'de-CH'
  };
  const locale = locales[currencyCode] || 'en-US';

  const zeroDecimalCurrencies = ['ARS', 'CLP', 'COP', 'PYG', 'JPY', 'VES'];
  const hasDecimals = !zeroDecimalCurrencies.includes(currencyCode);

  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0
  }).format(value);

  if (customSymbol) {
    return formatted.replace(/[A-Z$€£¥]+/, customSymbol);
  }

  return formatted;
}
