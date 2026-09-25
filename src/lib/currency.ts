/**
 * Currency Utility Module - SIP-ANGGARAN v1.3.0
 * Provides Full Number Rupiah Formatting (No Abbreviation) & Terbilang Converter
 */

/**
 * Formats a number into full Indonesian Rupiah currency format.
 * Example: 1500000000 -> "Rp 1.500.000.000"
 */
export function formatRp(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'Rp 0';
  }
  const val = Math.round(Number(amount));
  return 'Rp ' + val.toLocaleString('id-ID');
}

/**
 * Formats a number into plain formatted Indonesian integer string without prefix.
 * Example: 1500000000 -> "1.500.000.000"
 */
export function formatNumber(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '0';
  }
  const val = Math.round(Number(amount));
  return val.toLocaleString('id-ID');
}

/**
 * Converts a number into Indonesian words (Terbilang).
 * Example: 1500000000 -> "Satu Miliar Lima Ratus Juta Rupiah"
 */
export function terbilang(n: number | string): string {
  let num = Math.abs(Math.round(Number(n)));
  if (isNaN(num) || num === 0) return 'Nol Rupiah';

  const angka = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  
  function spell(val: number): string {
    if (val < 12) return angka[val];
    if (val < 20) return spell(val - 10) + ' Belas';
    if (val < 100) return spell(Math.floor(val / 10)) + ' Puluh ' + spell(val % 10);
    if (val < 200) return 'Seratus ' + spell(val - 100);
    if (val < 1000) return spell(Math.floor(val / 100)) + ' Ratus ' + spell(val % 100);
    if (val < 2000) return 'Seribu ' + spell(val - 1000);
    if (val < 1000000) return spell(Math.floor(val / 1000)) + ' Ribu ' + spell(val % 1000);
    if (val < 1000000000) return spell(Math.floor(val / 1000000)) + ' Juta ' + spell(val % 1000000);
    if (val < 1000000000000) return spell(Math.floor(val / 1000000000)) + ' Miliar ' + spell(val % 1000000000);
    if (val < 1000000000000000) return spell(Math.floor(val / 1000000000000)) + ' Triliun ' + spell(val % 1000000000000);
    return val.toString();
  }

  return (spell(num) + ' Rupiah').replace(/\s+/g, ' ').trim();
}

/**
 * Checks if a proposal has a budget spike (Usulan Pagu P2 > 50% of Pagu Awal P1)
 */
export function isSpikeAlert(initialBudget: number, proposedAddition: number): boolean {
  if (!initialBudget || initialBudget <= 0) return false;
  return proposedAddition > (initialBudget * 0.5);
}
