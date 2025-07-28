#!/usr/bin/env node
/**
 * 🎯 CHECKLIST EXECUTIVO - 3 FASES
 * Controle de execução das 3 fases estratégicas
 */

const chalk = require('chalk');

// Status de execução
const EXECUTION_STATUS = {
    FASE_1: {
        name: 'CORE BACKEND',
        status: 'READY_TO_START',
        days: 6,
        progress: 0,
        tasks: {
            day1: { name: 'API Keys + Infraestrutura', completed: false, priority: 'CRITICAL' },
            day2: { name: 'Stripe Integration Complete', completed: false, priority: 'CRITICAL' },
            day3: { name: 'Sistema Saldo Pré-pago', completed: false, priority: 'IMPORTANT' },
            day4: { name: 'IA Águia Sistema Completo', completed: false, priority: 'IMPORTANT' },
            day5: { name: 'WhatsApp Integration Avançada', completed: false, priority: 'IMPORTANT' },
            day6: { name: 'Testes + Otimizações', completed: false, priority: 'CRITICAL' }
        }
    },
    FASE_2: {
        name: 'FRONTEND REAL',
        status: 'WAITING',
        days: 6,
        progress: 0,
        tasks: {
            day7: { name: 'Eliminação Total Dados Mock', completed: false, priority: 'CRITICAL' },
            day8: { name: 'Sistema API Services Expandido', completed: false, priority: 'IMPORTANT' },
            day9: { name: 'Área do Usuário - Dashboard', completed: false, priority: 'CRITICAL' },
            day10: { name: 'Área do Usuário - Funcionalidades', completed: false, priority: 'IMPORTANT' },
            day11: { name: 'Área do Afiliado - Completa', completed: false, priority: 'IMPORTANT' },
            day12: { name: 'Notificações Real-time', completed: false, priority: 'IMPORTANT' }
        }
    },
    FASE_3: {
        name: 'INTEGRAÇÃO TOTAL',
        status: 'WAITING',
        days: 6,
        progress: 0,
        tasks: {
            day13: { name: 'Decision Engine Real', completed: false, priority: 'IMPORTANT' },
            day14: { name: 'Decision Engine Finalizado', completed: false, priority: 'IMPORTANT' },
            day15: { name: 'Order Executor + Signal Processor', completed: false, priority: 'IMPORTANT' },
            day16: { name: 'Deploy Production Railway', completed: false, priority: 'CRITICAL' },
            day17: { name: 'Testes Integração Completos', completed: false, priority: 'CRITICAL' },
            day18: { name: 'Monitoramento + Go-Live', completed: false, priority: 'CRITICAL' }
        }
    }
};

// Comandos por dia
const DAILY_COMMANDS = {
    day1: [
        'node dia1-sistema-perfis-completo.js',
        'node create-api-keys-system.js',
        'node setup-infrastructure.js'
    ],
    day2: [
        'node dia2-sistema-comissoes-correto.js',
        'node create-stripe-integration-complete.js',
        'node setup-webhooks-stripe.js'
    ],
    day3: [
        'node create-prepaid-balance-system.js',
        'node setup-auto-recharge.js'
    ],
    day4: [
        'node create-ai-aguia-complete.js',
        'node setup-ai-reports.js'
    ],
    day5: [
        'node create-whatsapp-advanced.js',
        'node setup-chat-integration.js'
    ],
    day6: [
        'npm test',
        'node optimize-performance.js',
        'node setup-monitoring.js'
    ]
};

// Métricas de progresso
function calculateOverallProgress() {
    let totalTasks = 0;
    let completedTasks = 0;
    
    Object.values(EXECUTION_STATUS).forEach(phase => {
        const phaseTasks = Object.values(phase.tasks);
        totalTasks += phaseTasks.length;
        completedTasks += phaseTasks.filter(task => task.completed).length;
    });
    
    return {
        total: totalTasks,
        completed: completedTasks,
        percentage: ((completedTasks / totalTasks) * 100).toFixed(1)
    };
}

// Função para mostrar status
function showExecutionStatus() {
    console.log(chalk.cyan.bold('\n🎯 STATUS DE EXECUÇÃO - 3 FASES ESTRATÉGICAS'));
    console.log('═'.repeat(60));
    
    const progress = calculateOverallProgress();
    console.log(chalk.yellow(`\n📊 PROGRESSO GERAL: ${progress.completed}/${progress.total} (${progress.percentage}%)`));
    
    // Barra de progresso visual
    const progressBar = '█'.repeat(Math.floor(progress.percentage / 5)) + 
                       '░'.repeat(20 - Math.floor(progress.percentage / 5));
    console.log(chalk.green(`[${progressBar}] ${progress.percentage}%\n`));
    
    Object.entries(EXECUTION_STATUS).forEach(([phaseKey, phase]) => {
        console.log(chalk.bold(`\n🔥 ${phase.name} (${phase.days} dias)`));
        console.log(`Status: ${getStatusColor(phase.status)}`);
        
        Object.entries(phase.tasks).forEach(([dayKey, task]) => {
            const icon = task.completed ? '✅' : '⏳';
            const priority = task.priority === 'CRITICAL' ? chalk.red('[CRÍTICA]') : 
                           task.priority === 'IMPORTANT' ? chalk.yellow('[IMPORTANTE]') : 
                           chalk.blue('[NORMAL]');
            
            console.log(`  ${icon} ${task.name} ${priority}`);
            
            // Mostrar comandos para tarefas não completadas
            if (!task.completed && DAILY_COMMANDS[dayKey]) {
                console.log(chalk.gray(`     Comandos: ${DAILY_COMMANDS[dayKey].join(', ')}`));
            }
        });
    });
}

// Função para atualizar progresso
function markTaskCompleted(phase, day) {
    if (EXECUTION_STATUS[phase] && EXECUTION_STATUS[phase].tasks[day]) {
        EXECUTION_STATUS[phase].tasks[day].completed = true;
        
        // Atualizar progresso da fase
        const phaseTasks = Object.values(EXECUTION_STATUS[phase].tasks);
        const completed = phaseTasks.filter(task => task.completed).length;
        EXECUTION_STATUS[phase].progress = ((completed / phaseTasks.length) * 100).toFixed(1);
        
        // Atualizar status da fase
        if (completed === phaseTasks.length) {
            EXECUTION_STATUS[phase].status = 'COMPLETED';
        } else if (completed > 0) {
            EXECUTION_STATUS[phase].status = 'IN_PROGRESS';
        }
        
        console.log(chalk.green(`✅ ${phase.toUpperCase()} - ${day.toUpperCase()} CONCLUÍDO!`));
        
        return true;
    }
    return false;
}

// Função para gerar próximos passos
function generateNextSteps() {
    console.log(chalk.cyan.bold('\n🚀 PRÓXIMOS PASSOS'));
    console.log('═'.repeat(40));
    
    // Encontrar próxima tarefa
    let nextTask = null;
    let nextPhase = null;
    
    Object.entries(EXECUTION_STATUS).forEach(([phaseKey, phase]) => {
        if (!nextTask && phase.status !== 'COMPLETED') {
            Object.entries(phase.tasks).forEach(([dayKey, task]) => {
                if (!nextTask && !task.completed) {
                    nextTask = { day: dayKey, ...task };
                    nextPhase = phaseKey;
                }
            });
        }
    });
    
    if (nextTask) {
        console.log(chalk.yellow(`\n📋 PRÓXIMA TAREFA: ${nextTask.name}`));
        console.log(chalk.blue(`   Fase: ${EXECUTION_STATUS[nextPhase].name}`));
        console.log(chalk.red(`   Prioridade: ${nextTask.priority}`));
        
        if (DAILY_COMMANDS[nextTask.day]) {
            console.log(chalk.green('\n🔧 COMANDOS PARA EXECUTAR:'));
            DAILY_COMMANDS[nextTask.day].forEach((cmd, index) => {
                console.log(chalk.white(`   ${index + 1}. ${cmd}`));
            });
        }
        
        console.log(chalk.cyan(`\n⚡ Para marcar como concluído: markTaskCompleted('${nextPhase}', '${nextTask.day}')`));
    } else {
        console.log(chalk.green('\n🎉 TODAS AS TAREFAS CONCLUÍDAS! SISTEMA 100% PRONTO!'));
    }
}

// Função para gerar relatório detalhado
function generateDetailedReport() {
    console.log(chalk.magenta.bold('\n📋 RELATÓRIO DETALHADO - EXECUÇÃO 3 FASES'));
    console.log('═'.repeat(60));
    
    const progress = calculateOverallProgress();
    const today = new Date().toLocaleDateString('pt-BR');
    
    console.log(`\n📅 Data: ${today}`);
    console.log(`📊 Progresso: ${progress.percentage}% (${progress.completed}/${progress.total})`);
    
    Object.entries(EXECUTION_STATUS).forEach(([phaseKey, phase]) => {
        const completedTasks = Object.values(phase.tasks).filter(t => t.completed).length;
        const totalTasks = Object.values(phase.tasks).length;
        const phaseProgress = ((completedTasks / totalTasks) * 100).toFixed(1);
        
        console.log(`\n🔥 ${phase.name}:`);
        console.log(`   Status: ${phase.status}`);
        console.log(`   Progresso: ${phaseProgress}% (${completedTasks}/${totalTasks})`);
        console.log(`   Duração: ${phase.days} dias`);
        
        // Tarefas críticas pendentes
        const criticalPending = Object.values(phase.tasks)
            .filter(t => !t.completed && t.priority === 'CRITICAL');
        
        if (criticalPending.length > 0) {
            console.log(chalk.red(`   ⚠️ ${criticalPending.length} tarefas CRÍTICAS pendentes`));
        }
    });
    
    // Estimativa de conclusão
    const remainingTasks = progress.total - progress.completed;
    const estimatedDays = Math.ceil(remainingTasks / 3); // 3 tarefas por dia
    
    console.log(chalk.yellow(`\n⏱️ ESTIMATIVA DE CONCLUSÃO: ${estimatedDays} dias`));
    
    // Próximos marcos
    console.log(chalk.green('\n🎯 PRÓXIMOS MARCOS:'));
    Object.entries(EXECUTION_STATUS).forEach(([phaseKey, phase]) => {
        if (phase.status !== 'COMPLETED') {
            const incompleteTasks = Object.values(phase.tasks).filter(t => !t.completed).length;
            console.log(`   ${phase.name}: ${incompleteTasks} tarefas restantes`);
        }
    });
}

// Função auxiliar para cores de status
function getStatusColor(status) {
    switch (status) {
        case 'COMPLETED': return chalk.green('✅ CONCLUÍDO');
        case 'IN_PROGRESS': return chalk.yellow('🟡 EM ANDAMENTO');
        case 'READY_TO_START': return chalk.blue('🔵 PRONTO PARA INICIAR');
        case 'WAITING': return chalk.gray('⏳ AGUARDANDO');
        default: return chalk.red('❌ ERRO');
    }
}

// Função principal
function runPhaseControl() {
    console.log(chalk.cyan.bold('🎯 CONTROLE DE EXECUÇÃO - 3 FASES COINBITCLUB'));
    console.log('═'.repeat(60));
    
    showExecutionStatus();
    generateNextSteps();
    generateDetailedReport();
    
    console.log(chalk.cyan('\n💡 COMANDOS DISPONÍVEIS:'));
    console.log('- markTaskCompleted(phase, day) - Marcar tarefa como concluída');
    console.log('- showExecutionStatus() - Mostrar status atual');
    console.log('- generateNextSteps() - Gerar próximos passos');
    console.log('- generateDetailedReport() - Relatório detalhado');
}

// Executar se chamado diretamente
if (require.main === module) {
    runPhaseControl();
}

module.exports = {
    EXECUTION_STATUS,
    markTaskCompleted,
    showExecutionStatus,
    generateNextSteps,
    generateDetailedReport,
    calculateOverallProgress
};

// Exemplos de uso:
// markTaskCompleted('FASE_1', 'day1');
// markTaskCompleted('FASE_1', 'day2');
