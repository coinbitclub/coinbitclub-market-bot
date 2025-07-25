import axios from 'axios';
import logger from '../../common/logger.js';

// Using the provided API key and endpoints
const COINSTATS_API_KEY = 'ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI=';
const BASE_URL = 'https://openapiv1.coinstats.app';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'X-API-KEY': COINSTATS_API_KEY,
    'accept': 'application/json'
  },
  timeout: 10000
});

/**
 * Get market overview data
 * @returns {Promise<Object>} Market data including market cap, volume, BTC dominance
 */
export async function getMarketData() {
  try {
    const { data } = await apiClient.get('/markets');
    logger.info('Market data retrieved successfully', { 
      marketCap: data.marketCap,
      btcDominance: data.btcDominance 
    });
    return {
      market_cap: data.marketCap,
      volume_24h: data.volume,
      btc_dominance: data.btcDominance,
      market_cap_change: data.marketCapChange,
      volume_change: data.volumeChange,
      btc_dominance_change: data.btcDominanceChange,
      timestamp: new Date()
    };
  } catch (error) {
    logger.error('Error fetching market data:', { 
      error: error.message,
      response: error.response?.data 
    });
    throw error;
  }
}

/**
 * Get Fear and Greed Index
 * @returns {Promise<Object>} Fear and greed index data
 */
export async function getFearAndGreed() {
  try {
    const { data } = await apiClient.get('/insights/fear-and-greed');
    logger.info('Fear and Greed data retrieved successfully', { 
      value: data.now.value,
      classification: data.now.value_classification 
    });
    return {
      value: data.now.value,
      classification: data.now.value_classification,
      timestamp: new Date(data.now.update_time),
      yesterday_value: data.yesterday?.value,
      last_week_value: data.lastWeek?.value
    };
  } catch (error) {
    logger.error('Error fetching Fear and Greed data:', { 
      error: error.message,
      response: error.response?.data 
    });
    throw error;
  }
}

/**
 * Get BTC Dominance history (24h data points)
 * @returns {Promise<Array>} Array of [timestamp, dominance] pairs
 */
export async function getBtcDominanceHistory() {
  try {
    const { data } = await apiClient.get('/insights/btc-dominance?type=24h');
    logger.info('BTC Dominance history retrieved successfully', { 
      dataPoints: data.data?.length || 0 
    });
    return data.data.map(([timestamp, dominance]) => ({
      dominance_percentage: dominance,
      timestamp: new Date(timestamp * 1000), // Convert Unix timestamp to Date
      created_at: new Date()
    }));
  } catch (error) {
    logger.error('Error fetching BTC Dominance history:', { 
      error: error.message,
      response: error.response?.data 
    });
    throw error;
  }
}

/**
 * Get current BTC dominance (latest value from history)
 * @returns {Promise<number>} Current BTC dominance percentage
 */
export async function getCurrentBtcDominance() {
  try {
    const history = await getBtcDominanceHistory();
    if (history && history.length > 0) {
      const latest = history[history.length - 1];
      return latest.dominance_percentage;
    }
    throw new Error('No BTC dominance data available');
  } catch (error) {
    logger.error('Error getting current BTC dominance:', error.message);
    throw error;
  }
}

// Legacy functions for backward compatibility
export async function getBtcDominance() {
  return getCurrentBtcDominance();
}
