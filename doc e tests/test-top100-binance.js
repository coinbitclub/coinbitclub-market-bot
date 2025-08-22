"use strict";
// ========================================
// TESTE DAS TOP 100 MOEDAS BINANCE
// Valida análise detalhada do Market Pulse
// ========================================
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
function testTop100BinanceAnalysis() {
    return __awaiter(this, void 0, void 0, function () {
        var response, usdtPairs, sortedByVolume, positiveCoins, negativeCoins, neutralCoins, positivePercentage, negativePercentage, totalVolume_1, volumeWeightedDelta, trend, topGainers, topLosers, decision, reasoning, localResponse, error_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🧪 TESTE DETALHADO - TOP 100 ANÁLISE BINANCE\n');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, , 8]);
                    // 1. Buscar dados da Binance
                    console.log('📊 Buscando dados da Binance API...');
                    return [4 /*yield*/, axios_1.default.get('https://api.binance.com/api/v3/ticker/24hr', {
                            timeout: 15000
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.data || !Array.isArray(response.data)) {
                        throw new Error('Resposta inválida da Binance');
                    }
                    console.log("\u2705 Total de pares recebidos: ".concat(response.data.length));
                    usdtPairs = response.data.filter(function (ticker) {
                        return ticker.symbol.endsWith('USDT') &&
                            !ticker.symbol.includes('UP') &&
                            !ticker.symbol.includes('DOWN') &&
                            !ticker.symbol.includes('BEAR') &&
                            !ticker.symbol.includes('BULL');
                    });
                    console.log("\uD83D\uDD0D Pares USDT filtrados: ".concat(usdtPairs.length));
                    sortedByVolume = usdtPairs
                        .map(function (ticker) { return ({
                        symbol: ticker.symbol,
                        price: parseFloat(ticker.lastPrice),
                        priceChange: parseFloat(ticker.priceChange),
                        priceChangePercent: parseFloat(ticker.priceChangePercent),
                        volume: parseFloat(ticker.volume),
                        quoteVolume: parseFloat(ticker.quoteVolume), // Volume em USD
                        timestamp: new Date()
                    }); })
                        .filter(function (coin) { return coin.quoteVolume > 0; }) // Apenas com volume válido
                        .sort(function (a, b) { return b.quoteVolume - a.quoteVolume; }) // Ordenar por volume desc
                        .slice(0, 100);
                    console.log("\uD83D\uDCC8 TOP 100 por volume selecionados: ".concat(sortedByVolume.length, "\n"));
                    positiveCoins = sortedByVolume.filter(function (coin) { return coin.priceChangePercent > 0; });
                    negativeCoins = sortedByVolume.filter(function (coin) { return coin.priceChangePercent < 0; });
                    neutralCoins = sortedByVolume.filter(function (coin) { return coin.priceChangePercent === 0; });
                    positivePercentage = (positiveCoins.length / sortedByVolume.length) * 100;
                    negativePercentage = (negativeCoins.length / sortedByVolume.length) * 100;
                    totalVolume_1 = sortedByVolume.reduce(function (sum, coin) { return sum + coin.quoteVolume; }, 0);
                    volumeWeightedDelta = sortedByVolume.reduce(function (sum, coin) {
                        var weight = coin.quoteVolume / totalVolume_1;
                        return sum + (coin.priceChangePercent * weight);
                    }, 0);
                    trend = 'NEUTRAL';
                    if (positivePercentage >= 60 && volumeWeightedDelta > 0.5) {
                        trend = 'BULLISH';
                    }
                    else if (negativePercentage >= 60 && volumeWeightedDelta < -0.5) {
                        trend = 'BEARISH';
                    }
                    // 5. Relatório detalhado
                    console.log('📊 RELATÓRIO DE ANÁLISE DO MERCADO:');
                    console.log('==========================================');
                    console.log("\uD83D\uDFE2 Moedas Positivas: ".concat(positiveCoins.length, " (").concat(positivePercentage.toFixed(1), "%)"));
                    console.log("\uD83D\uDD34 Moedas Negativas: ".concat(negativeCoins.length, " (").concat(negativePercentage.toFixed(1), "%)"));
                    console.log("\u26AA Moedas Neutras: ".concat(neutralCoins.length, " (").concat((neutralCoins.length / sortedByVolume.length * 100).toFixed(1), "%)"));
                    console.log("\uD83D\uDCCA Delta Ponderado por Volume: ".concat(volumeWeightedDelta.toFixed(2), "%"));
                    console.log("\uD83D\uDCC8 Tend\u00EAncia: ".concat(trend));
                    console.log("\uD83D\uDCB0 Volume Total (USDT): $".concat((totalVolume_1 / 1000000).toFixed(2), "M\n"));
                    // 6. TOP 10 Maiores volumes
                    console.log('🔝 TOP 10 MAIORES VOLUMES:');
                    console.log('==========================================');
                    sortedByVolume.slice(0, 10).forEach(function (coin, index) {
                        var status = coin.priceChangePercent > 0 ? '🟢' : coin.priceChangePercent < 0 ? '🔴' : '⚪';
                        console.log("".concat(index + 1, ". ").concat(status, " ").concat(coin.symbol, ": $").concat(coin.price.toFixed(4), " (").concat(coin.priceChangePercent.toFixed(2), "%) Vol: $").concat((coin.quoteVolume / 1000000).toFixed(2), "M"));
                    });
                    // 7. TOP 5 Maiores ganhos
                    console.log('\n📈 TOP 5 MAIORES GANHOS (das TOP 100):');
                    console.log('==========================================');
                    topGainers = sortedByVolume
                        .filter(function (coin) { return coin.priceChangePercent > 0; })
                        .sort(function (a, b) { return b.priceChangePercent - a.priceChangePercent; })
                        .slice(0, 5);
                    topGainers.forEach(function (coin, index) {
                        console.log("".concat(index + 1, ". \uD83D\uDFE2 ").concat(coin.symbol, ": +").concat(coin.priceChangePercent.toFixed(2), "% Vol: $").concat((coin.quoteVolume / 1000000).toFixed(2), "M"));
                    });
                    // 8. TOP 5 Maiores quedas
                    console.log('\n📉 TOP 5 MAIORES QUEDAS (das TOP 100):');
                    console.log('==========================================');
                    topLosers = sortedByVolume
                        .filter(function (coin) { return coin.priceChangePercent < 0; })
                        .sort(function (a, b) { return a.priceChangePercent - b.priceChangePercent; })
                        .slice(0, 5);
                    topLosers.forEach(function (coin, index) {
                        console.log("".concat(index + 1, ". \uD83D\uDD34 ").concat(coin.symbol, ": ").concat(coin.priceChangePercent.toFixed(2), "% Vol: $").concat((coin.quoteVolume / 1000000).toFixed(2), "M"));
                    });
                    // 9. Decisão de trading
                    console.log('\n🎯 DECISÃO DE TRADING:');
                    console.log('==========================================');
                    decision = 'NEUTRAL';
                    reasoning = '';
                    if (trend === 'BULLISH') {
                        decision = 'LONG_FAVORABLE';
                        reasoning = "Mercado BULLISH: ".concat(positivePercentage.toFixed(1), "% das TOP 100 em alta com delta de volume +").concat(volumeWeightedDelta.toFixed(2), "%");
                    }
                    else if (trend === 'BEARISH') {
                        decision = 'SHORT_FAVORABLE';
                        reasoning = "Mercado BEARISH: ".concat(negativePercentage.toFixed(1), "% das TOP 100 em baixa com delta de volume ").concat(volumeWeightedDelta.toFixed(2), "%");
                    }
                    else {
                        decision = 'NEUTRAL';
                        reasoning = "Mercado NEUTRO: ".concat(positivePercentage.toFixed(1), "% positivas vs ").concat(negativePercentage.toFixed(1), "% negativas, delta: ").concat(volumeWeightedDelta.toFixed(2), "%");
                    }
                    console.log("\uD83D\uDCCA Decis\u00E3o: ".concat(decision));
                    console.log("\uD83D\uDCA1 Racioc\u00EDnio: ".concat(reasoning));
                    // 10. Teste do endpoint local
                    console.log('\n🔗 TESTANDO ENDPOINT LOCAL:');
                    console.log('==========================================');
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, axios_1.default.get('http://localhost:3000/api/market/market-pulse', {
                            timeout: 10000
                        })];
                case 4:
                    localResponse = _a.sent();
                    console.log('✅ Endpoint local funcionando!');
                    console.log('📊 Resposta:', JSON.stringify(localResponse.data, null, 2));
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    console.log('❌ Erro no endpoint local:');
                    if (error_1.code === 'ECONNREFUSED') {
                        console.log('🔴 Servidor não está rodando na porta 3000');
                    }
                    else {
                        console.log('🔴', error_1.message);
                    }
                    return [3 /*break*/, 6];
                case 6:
                    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
                    return [3 /*break*/, 8];
                case 7:
                    error_2 = _a.sent();
                    console.error('❌ ERRO NO TESTE:', error_2.message);
                    if (error_2.code === 'ECONNABORTED') {
                        console.error('🔴 Timeout na conexão com a Binance');
                    }
                    else if (error_2.response) {
                        console.error('🔴 Erro HTTP:', error_2.response.status, error_2.response.statusText);
                    }
                    else if (error_2.request) {
                        console.error('🔴 Erro de rede:', error_2.code);
                    }
                    process.exit(1);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
// Executar teste
testTop100BinanceAnalysis();
