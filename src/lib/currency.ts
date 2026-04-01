/**
 * Currency minor-unit utilities for Dodo Payments.
 *
 * Dodo (and most payment gateways) transmit monetary amounts in the
 * currency's smallest unit (e.g. cents for USD, yen for JPY).
 * These helpers centralise the scaling logic so every call-site
 * uses the same canonical list.
 */

/** Currencies whose smallest unit equals the major unit (0 decimal places). */
const ZERO_DECIMAL = new Set([
    'BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW',
    'MGA', 'PYG', 'RWF', 'TWD', 'UGX', 'VND', 'VUV', 'XAF',
    'XOF', 'XPF',
]);

/** Currencies that use 3 decimal places (1/1000). */
const THREE_DECIMAL = new Set(['BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND']);

/**
 * Return the number of minor-unit decimal places for a currency code.
 *
 * @example getMinorUnitDecimals('USD') → 2
 * @example getMinorUnitDecimals('JPY') → 0
 * @example getMinorUnitDecimals('BHD') → 3
 */
export function getMinorUnitDecimals(currencyCode: string): number {
    const upper = currencyCode.toUpperCase();
    if (ZERO_DECIMAL.has(upper)) return 0;
    if (THREE_DECIMAL.has(upper)) return 3;
    return 2;
}

/**
 * Convert a minor-unit amount (integer) to its major-unit value (decimal).
 *
 * @example minorToMajor(1999, 'USD') → 19.99
 * @example minorToMajor(500, 'JPY')  → 500
 */
export function minorToMajor(minorAmount: number, currencyCode: string): number {
    const decimals = getMinorUnitDecimals(currencyCode);
    return minorAmount / Math.pow(10, decimals);
}
