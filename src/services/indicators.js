import { EMA } from 'technicalindicators';

/**
 * Calcula a série EMA a partir de um array de valores.
 * @param {number[]} values - Fechamentos.
 * @param {number} period - Período da EMA.
 * @returns {number[]} - Array de valores da EMA.
 */
export function calcEMA(values, period) {
  return EMA.calculate({ period, values });
}

/**
 * Calcula a diferença entre valor atual e valor da EMA.
 * @param {number} current - Valor atual.
 * @param {number} emaValue - Valor da EMA.
 * @returns {number}
 */
export function calcDiff(current, emaValue) {
  return current - emaValue;
}
