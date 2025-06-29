/**
 * @param {Object} body — { value, index_value, value_classification }
 * @returns {{ value: number, index_value: number, value_classification: string }}
 */
export function parseFearGreed(body) {
  const { value, index_value, value_classification } = body;
  if (value == null || index_value == null || !value_classification) {
    throw new Error('value, index_value and value_classification are required');
  }
  return {
    value: Number(value),
    index_value: Number(index_value),
    value_classification: String(value_classification)
  };
}
