/**
 * Show decimal digits maximum. Eg with precision = 2
 * 0.000022123 => 0.000022
 * 12.345 => 12.34
 * 1234 => 1234
 * 
 * @param x The number
 * @param precision The number of decimal
 */
export const toPrecision = (x: number, precision = 2) => {
    const numberOfDigits = x >= 0 ? Math.floor(Math.log10(x)) + 1 : 1;
    return Intl.NumberFormat('en-US', {
        minimumSignificantDigits: 1,
        notation: x > 1e6 ? 'compact' : 'standard',
        maximumSignificantDigits: Math.max(1, x > 1e6 ? precision : Math.max(numberOfDigits, precision, 1)),
    }).format(x);
};

export const toAPY = (x: number, precision = 4) => {
    if (x < 0.1) {
        return '< 0.1';
    }

    return toPrecision(x, precision);
}
