/**
 * 智能房贷计算与规划器 - 主程序
 */

// 保存计算器实例
let calculator = null;
let combinedCalculator = null; // 组合贷款计算器实例

// 图表实例
let comparisonChart = null;
let prepaymentComparisonChart = null;
let combinedLoanChart = null; // 组合贷款图表实例
let monthlyPaymentComparisonChart = null; // 提前还款前后月供对比图表实例

// 图表类型
let paymentComparisonChartType = 'line'; // 默认为折线图

// DOM元素引用
const loanForm = document.getElementById('loanForm');
const prepaymentForm = document.getElementById('prepaymentForm');
const propertyPriceInput = document.getElementById('propertyPrice');
const downPaymentInput = document.getElementById('downPayment');
const loanAmountInput = document.getElementById('loanAmount');
const interestRateInput = document.getElementById('interestRate');
const loanTermSelect = document.getElementById('loanTerm');
const showFullPaymentScheduleCheckbox = document.getElementById('showFullPaymentSchedule');
const clearPrepaymentsBtn = document.getElementById('clearPrepayments');
const showLineChartBtn = document.getElementById('showLineChartBtn');
const showBarChartBtn = document.getElementById('showBarChartBtn');

// 组合贷款元素引用
const calculateCombinedBtn = document.getElementById('calculateCombinedBtn');
const showFullCombinedScheduleCheckbox = document.getElementById('showFullCombinedSchedule');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 监听表单提交事件
    loanForm.addEventListener('submit', handleLoanFormSubmit);
    prepaymentForm.addEventListener('submit', handlePrepaymentFormSubmit);
    
    // 自动计算贷款金额
    propertyPriceInput.addEventListener('input', calculateLoanAmount);
    downPaymentInput.addEventListener('input', calculateLoanAmount);
    
    // 监听展示完整计划的开关
    showFullPaymentScheduleCheckbox.addEventListener('change', toggleFullPaymentSchedule);
    
    // 组合贷款相关事件监听
    calculateCombinedBtn.addEventListener('click', handleCombinedLoanCalculate);
    showFullCombinedScheduleCheckbox.addEventListener('change', toggleFullCombinedSchedule);
    
    // 清除所有提前还款
    clearPrepaymentsBtn.addEventListener('click', handleClearPrepayments);
    
    // 图表类型切换
    showLineChartBtn.addEventListener('click', () => switchChartType('line'));
    showBarChartBtn.addEventListener('click', () => switchChartType('bar'));
});

/**
 * 自动计算贷款金额
 */
function calculateLoanAmount() {
    const propertyPrice = parseFloat(propertyPriceInput.value) || 0;
    const downPayment = parseFloat(downPaymentInput.value) || 0;
    
    // 计算贷款金额
    const loanAmount = propertyPrice - downPayment;
    
    // 设置贷款金额
    loanAmountInput.value = loanAmount > 0 ? loanAmount.toFixed(2) : '0.00';
}

/**
 * 处理贷款表单提交
 * @param {Event} event - 表单提交事件
 */
function handleLoanFormSubmit(event) {
    event.preventDefault();
    
    // 获取表单数据
    const loanAmount = parseFloat(loanAmountInput.value);
    const interestRate = parseFloat(interestRateInput.value);
    const loanTerm = parseInt(loanTermSelect.value);
    
    // 创建计算器实例
    calculator = new MortgageCalculator(loanAmount, interestRate, loanTerm);
    
    // 显示结果
    displayResults();
}

/**
 * 处理提前还款表单提交
 * @param {Event} event - 表单提交事件
 */
function handlePrepaymentFormSubmit(event) {
    event.preventDefault();
    
    // 如果还没有计算基本贷款，则提示用户
    if (!calculator) {
        alert('请先计算基本贷款情况');
        return;
    }
    
    // 获取表单数据
    const prepaymentMonth = parseInt(document.getElementById('prepaymentMonth').value);
    const prepaymentAmount = parseFloat(document.getElementById('prepaymentAmount').value);
    const prepaymentType = document.querySelector('input[name="prepaymentType"]:checked').value;
    const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
    
    // 验证数据
    if (isNaN(prepaymentMonth) || prepaymentMonth < 1) {
        alert('请输入有效的提前还款月份');
        return;
    }
    
    if (isNaN(prepaymentAmount) || prepaymentAmount <= 0) {
        alert('请输入有效的提前还款金额');
        return;
    }
    
    // 添加提前还款
    const success = calculator.addPrepayment(prepaymentMonth, prepaymentAmount, prepaymentType, paymentType);
    
    if (!success) {
        alert('提前还款月份或金额无效，请检查');
        return;
    }
    
    // 清空表单
    document.getElementById('prepaymentMonth').value = '';
    document.getElementById('prepaymentAmount').value = '';
    
    // 更新提前还款历史记录
    displayPrepaymentHistory();
    
    // 更新还款计划表
    displayPaymentSchedule(showFullPaymentScheduleCheckbox.checked);
    
    // 显示提前还款分析结果
    if (prepaymentType === 'reduce-term') {
        const result = calculator.calculateReducedTermPrepayment(prepaymentMonth, prepaymentAmount, paymentType);
        displayReducedTermResults(result, prepaymentMonth, prepaymentAmount);
        // 隐藏减少月供结果
        document.getElementById('reducedPaymentResults').innerHTML = '';
    } else {
        const result = calculator.calculateReducedPaymentPrepayment(prepaymentMonth, prepaymentAmount, paymentType);
        displayReducedPaymentResults(result, prepaymentMonth, prepaymentAmount);
        // 隐藏缩短期限结果
        document.getElementById('reducedTermResults').innerHTML = '';
    }
    
    // 显示提前还款前后对比图表
    displayPrepaymentComparisonChart(prepaymentMonth, prepaymentAmount, prepaymentType, paymentType);
    
    // 显示月供对比图表
    displayMonthlyPaymentComparisonChart(paymentType);
    
    // 显示详细还款计划
    displayDetailedPrepaymentSchedule(prepaymentMonth, prepaymentAmount, prepaymentType, paymentType);
    
    // 滚动到结果区域
    document.getElementById('prepaymentResults').scrollIntoView({ behavior: 'smooth' });
}

/**
 * 清除所有提前还款
 */
function handleClearPrepayments() {
    // 如果还没有计算基本贷款，则返回
    if (!calculator) {
        return;
    }
    
    // 清除所有提前还款记录
    calculator.clearPrepayments();
    
    // 更新提前还款历史记录
    displayPrepaymentHistory();
    
    // 更新还款计划表
    displayPaymentSchedule(showFullPaymentScheduleCheckbox.checked);
    
    // 更新提前还款分析结果
    const reducedTermResults = document.getElementById('reducedTermResults');
    const reducedPaymentResults = document.getElementById('reducedPaymentResults');
    
    reducedTermResults.innerHTML = '<p>请先设置提前还款方案</p>';
    reducedPaymentResults.innerHTML = '<p>请先设置提前还款方案</p>';
    
    // 清除图表
    if (prepaymentComparisonChart) {
        prepaymentComparisonChart.destroy();
        prepaymentComparisonChart = null;
    }
    
    if (monthlyPaymentComparisonChart) {
        monthlyPaymentComparisonChart.destroy();
        monthlyPaymentComparisonChart = null;
    }
}

/**
 * 显示提前还款历史记录
 */
function displayPrepaymentHistory() {
    const historyTable = document.getElementById('prepaymentHistoryTable');
    const historyBody = document.getElementById('prepaymentHistoryBody');
    
    // 清空表格
    historyBody.innerHTML = '';
    
    // 获取提前还款历史记录
    const history = calculator.getPrepaymentHistory();
    
    if (history.length === 0) {
        historyBody.innerHTML = '<tr><td colspan="4" class="text-center">暂无提前还款记录</td></tr>';
        return;
    }
    
    // 填充表格
    history.forEach((item, index) => {
        const row = document.createElement('tr');
        
        // 格式化还款方式
        let prepaymentTypeText = '';
        if (item.type === 'reduce-term') {
            prepaymentTypeText = '缩短期限';
        } else {
            prepaymentTypeText = '减少月供';
        }
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>第${item.month}期</td>
            <td>${item.amount.toFixed(2)}万元</td>
            <td>${prepaymentTypeText}</td>
        `;
        
        historyBody.appendChild(row);
    });
}

/**
 * 显示月供对比图表
 * @param {string} paymentType - 还款方式
 */
function displayMonthlyPaymentComparisonChart(paymentType) {
    // 获取Canvas元素
    const ctx = document.getElementById('monthlyPaymentComparisonChart').getContext('2d');
    
    // 如果已经存在图表，则销毁它
    if (monthlyPaymentComparisonChart) {
        monthlyPaymentComparisonChart.destroy();
    }
    
    // 获取月供数据
    const paymentData = calculator.getMonthlyPaymentComparisonData(paymentType);
    
    // 为了图表美观性，如果期数过多（超过120个月），每半年取一个点
    let months = paymentData.months;
    let originalPayments = paymentData.originalPayments;
    let currentPayments = paymentData.currentPayments;
    
    if (months.length > 120) {
        const sampledMonths = [];
        const sampledOriginalPayments = [];
        const sampledCurrentPayments = [];
        
        for (let i = 0; i < months.length; i += 6) {
            sampledMonths.push(months[i]);
            sampledOriginalPayments.push(originalPayments[i]);
            sampledCurrentPayments.push(currentPayments[i]);
        }
        
        months = sampledMonths;
        originalPayments = sampledOriginalPayments;
        currentPayments = sampledCurrentPayments;
    }
    
    // 创建图表数据
    const data = {
        labels: months,
        datasets: [
            {
                label: '原始月供',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                data: originalPayments.map(payment => payment / 10000), // 转换为万元
                pointRadius: months.length > 60 ? 0 : 3, // 如果点太多，不显示点
                pointHoverRadius: 5
            },
            {
                label: '当前月供',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                data: currentPayments.map(payment => payment / 10000), // 转换为万元
                pointRadius: months.length > 60 ? 0 : 3, // 如果点太多，不显示点
                pointHoverRadius: 5
            }
        ]
    };
    
    // 图表配置
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                title: {
                    display: true,
                    text: '还款期数'
                },
                ticks: {
                    maxTicksLimit: 20 // 限制横轴标签数量
                }
            },
            y: {
                title: {
                    display: true,
                    text: '月供 (万元)'
                }
            }
        },
        plugins: {
            title: {
                display: true,
                text: '提前还款前后月供对比'
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return context.dataset.label + ': ' + context.raw.toFixed(2) + ' 万元';
                    }
                }
            }
        }
    };
    
    // 创建图表
    monthlyPaymentComparisonChart = new Chart(ctx, {
        type: paymentComparisonChartType,
        data: data,
        options: options
    });
}

/**
 * 切换图表类型
 * @param {string} type - 图表类型 ('line' 或 'bar')
 */
function switchChartType(type) {
    if (type === paymentComparisonChartType) {
        return; // 如果类型相同，不做操作
    }
    
    paymentComparisonChartType = type;
    
    // 更新按钮状态
    if (type === 'line') {
        showLineChartBtn.classList.add('active');
        showBarChartBtn.classList.remove('active');
    } else {
        showLineChartBtn.classList.remove('active');
        showBarChartBtn.classList.add('active');
    }
    
    // 如果有计算器和图表实例，则重新显示图表
    if (calculator && monthlyPaymentComparisonChart) {
        const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
        displayMonthlyPaymentComparisonChart(paymentType);
    }
}

/**
 * 显示提前还款分析结果
 * @param {number} prepaymentMonth - 提前还款月份
 * @param {number} prepaymentAmount - 提前还款金额
 * @param {string} prepaymentType - 提前还款方式
 * @param {string} paymentType - 还款方式
 */
function displayPrepaymentResults(prepaymentMonth, prepaymentAmount, prepaymentType, paymentType) {
    // 计算提前还款方案
    const reducedTermResult = calculator.calculateReducedTermPrepayment(prepaymentMonth, prepaymentAmount, paymentType);
    const reducedPaymentResult = calculator.calculateReducedPaymentPrepayment(prepaymentMonth, prepaymentAmount, paymentType);
    
    // 显示结果
    displayReducedTermResults(reducedTermResult, prepaymentMonth, prepaymentAmount);
    displayReducedPaymentResults(reducedPaymentResult, prepaymentMonth, prepaymentAmount);
    
    // 显示提前还款对比图表
    displayPrepaymentComparisonChart(prepaymentMonth, prepaymentAmount, prepaymentType, paymentType);
}

/**
 * 显示计算结果
 */
function displayResults() {
    // 显示等额本息摘要
    displayEqualInstallmentSummary();
    
    // 显示等额本金摘要
    displayEqualPrincipalSummary();
    
    // 显示还款计划表
    displayPaymentSchedule();
    
    // 显示对比图表
    displayComparisonChart();
}

/**
 * 显示等额本息摘要
 */
function displayEqualInstallmentSummary() {
    const summary = calculator.getEqualInstallmentSummary();
    const container = document.getElementById('equalInstallmentSummary');
    
    container.innerHTML = `
        <p>每月月供：<strong>${formatCurrency(summary.monthlyPayment)}</strong></p>
        <p>贷款总额：${formatCurrency(summary.loanAmount)}</p>
        <p>支付利息：<span class="text-danger-highlight">${formatCurrency(summary.totalInterest)}</span></p>
        <p>还款总额：${formatCurrency(summary.totalPayment)}</p>
        <p>总还款期限：${calculator.totalMonths}个月(${calculator.totalMonths / 12}年)</p>
    `;
}

/**
 * 显示等额本金摘要
 */
function displayEqualPrincipalSummary() {
    const summary = calculator.getEqualPrincipalSummary();
    const container = document.getElementById('equalPrincipalSummary');
    
    container.innerHTML = `
        <p>首月月供：<strong>${formatCurrency(summary.firstMonthPayment)}</strong></p>
        <p>末月月供：<strong>${formatCurrency(summary.lastMonthPayment)}</strong></p>
        <p>贷款总额：${formatCurrency(summary.loanAmount)}</p>
        <p>支付利息：<span class="text-danger-highlight">${formatCurrency(summary.totalInterest)}</span></p>
        <p>还款总额：${formatCurrency(summary.totalPayment)}</p>
        <p>总还款期限：${calculator.totalMonths}个月(${calculator.totalMonths / 12}年)</p>
    `;
}

/**
 * 显示还款计划表
 * @param {boolean} showFull - 是否显示完整计划
 */
function displayPaymentSchedule(showFull = false) {
    const table = document.getElementById('paymentScheduleTable');
    const tbody = table.querySelector('tbody');
    const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
    
    // 选择合适的还款计划
    const schedule = paymentType === 'equal-installment' 
        ? calculator.equalInstallmentSchedule 
        : calculator.equalPrincipalSchedule;
    
    // 清空表格
    tbody.innerHTML = '';
    
    // 决定显示哪些月份
    let displayMonths = [];
    
    if (showFull) {
        // 显示所有月份
        displayMonths = schedule;
    } else {
        // 只显示关键月份（第1年每月，之后每年第1个月）
        const totalMonths = schedule.length;
        
        displayMonths = schedule.filter(item => {
            // 第1年每月
            if (item.month <= 12) return true;
            
            // 之后每年第1个月
            if (item.month % 12 === 1) return true;
            
            // 最后一个月
            if (item.month === totalMonths) return true;
            
            return false;
        });
    }
    
    // 填充表格
    displayMonths.forEach(item => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${item.month}</td>
            <td>${formatCurrency(item.payment)}</td>
            <td>${formatCurrency(item.principal)}</td>
            <td>${formatCurrency(item.interest)}</td>
            <td>${formatCurrency(item.remainingPrincipal)}</td>
        `;
        
        tbody.appendChild(row);
    });
}

/**
 * 切换显示完整还款计划
 */
function toggleFullPaymentSchedule() {
    // 如果还没有计算基本贷款，则返回
    if (!calculator) {
        return;
    }
    
    // 显示还款计划表
    displayPaymentSchedule(showFullPaymentScheduleCheckbox.checked);
}

/**
 * 显示贷款对比图表
 */
function displayComparisonChart() {
    // 获取Canvas元素
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    
    // 如果已经存在图表，则销毁它
    if (comparisonChart) {
        comparisonChart.destroy();
    }
    
    // 获取数据
    const equalInstallmentSummary = calculator.getEqualInstallmentSummary();
    const equalPrincipalSummary = calculator.getEqualPrincipalSummary();
    
    // 创建图表数据
    const data = {
        labels: ['等额本息', '等额本金'],
        datasets: [
            {
                label: '贷款本金',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                data: [
                    equalInstallmentSummary.loanAmount / 10000,
                    equalPrincipalSummary.loanAmount / 10000
                ]
            },
            {
                label: '支付利息',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                data: [
                    equalInstallmentSummary.totalInterest / 10000,
                    equalPrincipalSummary.totalInterest / 10000
                ]
            }
        ]
    };
    
    // 图表配置
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                stacked: true
            },
            y: {
                stacked: true,
                title: {
                    display: true,
                    text: '金额 (万元)'
                }
            }
        },
        plugins: {
            title: {
                display: true,
                text: '还款方式对比'
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return context.dataset.label + ': ' + context.raw.toFixed(2) + ' 万元';
                    }
                }
            }
        }
    };
    
    // 创建图表
    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: options
    });
    
    // 创建月供比较折线图
    createMonthlyPaymentChart();
}

/**
 * 创建月供比较折线图
 */
function createMonthlyPaymentChart() {
    // 如果Canvas元素不存在，则返回
    if (!document.getElementById('monthlyPaymentChart')) {
        return;
    }
    
    // 获取Canvas元素
    const ctx = document.getElementById('monthlyPaymentChart').getContext('2d');
    
    // 准备数据
    const equalInstallmentPayments = calculator.equalInstallmentSchedule.map(item => item.payment);
    const equalPrincipalPayments = calculator.equalPrincipalSchedule.map(item => item.payment);
    
    // 选择一些关键月份作为标签
    const labels = [];
    const months = calculator.totalMonths;
    
    if (months <= 24) {
        // 如果还款期限不超过2年，则每月显示
        for (let i = 1; i <= months; i++) {
            labels.push(i);
        }
    } else {
        // 否则只显示每年的第1个月
        for (let i = 1; i <= months; i++) {
            if (i <= 12 || i % 12 === 1 || i === months) {
                labels.push(i);
            }
        }
    }
    
    // 筛选出对应标签的数据点
    const equalInstallmentDataPoints = [];
    const equalPrincipalDataPoints = [];
    
    labels.forEach(month => {
        equalInstallmentDataPoints.push(equalInstallmentPayments[month - 1]);
        equalPrincipalDataPoints.push(equalPrincipalPayments[month - 1]);
    });
    
    // 创建图表数据
    const data = {
        labels: labels,
        datasets: [
            {
                label: '等额本息月供',
                data: equalInstallmentDataPoints,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                tension: 0.1,
                fill: false
            },
            {
                label: '等额本金月供',
                data: equalPrincipalDataPoints,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                tension: 0.1,
                fill: false
            }
        ]
    };
    
    // 图表配置
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                title: {
                    display: true,
                    text: '月供金额 (元)'
                }
            },
            x: {
                title: {
                    display: true,
                    text: '还款月份'
                }
            }
        },
        plugins: {
            title: {
                display: true,
                text: '月供变化趋势'
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return context.dataset.label + ': ' + formatCurrency(context.raw);
                    }
                }
            }
        }
    };
    
    // 创建图表
    monthlyPaymentChart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
    });
}

/**
 * 显示缩短还款期限的提前还款结果
 * @param {Object} result - 计算结果
 * @param {number} prepaymentMonth - 提前还款月份
 * @param {number} prepaymentAmount - 提前还款金额(万元)
 */
function displayReducedTermResults(result, prepaymentMonth, prepaymentAmount) {
    const reducedTermResults = document.getElementById('reducedTermResults');
    
    if (!result) {
        reducedTermResults.innerHTML = '<p class="text-danger">提前还款方案计算失败，请检查输入数据</p>';
        return;
    }
    
    const template = `
        <div class="prepayment-analysis">
            <div class="analysis-header">
                <h4>缩短还款期限方案分析</h4>
                <p class="text-muted">在第${prepaymentMonth}期提前还款${formatCurrency(prepaymentAmount * 10000)}</p>
            </div>
            
            <div class="analysis-simple">
                <div class="analysis-item highlight">
                    <span class="label">节省总利息</span>
                    <span class="value text-success">${formatCurrency(result.interestSaved)}</span>
                </div>
                
                <div class="analysis-item highlight">
                    <span class="label">缩短期限</span>
                    <span class="value text-primary">${result.monthsReduced}个月（${Math.floor(result.monthsReduced/12)}年${result.monthsReduced%12}个月）</span>
                </div>
                
                <div class="analysis-item">
                    <span class="label">新还款期限</span>
                    <span class="value">${result.newTotalMonths}期（${Math.floor(result.newTotalMonths/12)}年${result.newTotalMonths%12}个月）</span>
                </div>
            </div>
            
            ${result.fullPayoff ? 
                '<div class="alert alert-success mt-3">提前还款金额足够还清所有贷款！</div>' : 
                '<div class="text-muted mt-3">月供金额保持不变，但还款期限缩短。</div>'
            }
        </div>
    `;
    
    reducedTermResults.innerHTML = template;
}

/**
 * 显示减少月供金额的提前还款结果
 * @param {Object} result - 计算结果
 * @param {number} prepaymentMonth - 提前还款月份
 * @param {number} prepaymentAmount - 提前还款金额(万元)
 */
function displayReducedPaymentResults(result, prepaymentMonth, prepaymentAmount) {
    const reducedPaymentResults = document.getElementById('reducedPaymentResults');
    
    if (!result) {
        reducedPaymentResults.innerHTML = '<p class="text-danger">提前还款方案计算失败，请检查输入数据</p>';
        return;
    }
    
    const template = `
        <div class="prepayment-analysis">
            <div class="analysis-header">
                <h4>减少月供方案分析</h4>
                <p class="text-muted">在第${prepaymentMonth}期提前还款${formatCurrency(prepaymentAmount * 10000)}</p>
            </div>
            
            <div class="analysis-simple">
                <div class="analysis-item highlight">
                    <span class="label">节省总利息</span>
                    <span class="value text-success">${formatCurrency(result.interestSaved)}</span>
                </div>
                
                <div class="analysis-item highlight">
                    <span class="label">月供减少</span>
                    <span class="value text-primary">${formatCurrency(result.paymentReduction)}</span>
                </div>
                
                <div class="analysis-item">
                    <span class="label">新月供</span>
                    <span class="value">${formatCurrency(result.newMonthlyPayment)}</span>
                </div>
            </div>
            
            ${result.fullPayoff ? 
                '<div class="alert alert-success mt-3">提前还款金额足够还清所有贷款！</div>' : 
                '<div class="text-muted mt-3">还款期限保持不变，但月供金额减少。</div>'
            }
        </div>
    `;
    
    reducedPaymentResults.innerHTML = template;
}

/**
 * 显示提前还款对比图表
 * @param {number} prepaymentMonth - 提前还款月份
 * @param {number} prepaymentAmount - 提前还款金额(万元)
 * @param {string} prepaymentType - 提前还款方式
 * @param {string} paymentType - 还款方式
 */
function displayPrepaymentComparisonChart(prepaymentMonth, prepaymentAmount, prepaymentType, paymentType) {
    const chartContainer = document.getElementById('prepaymentComparisonChart');
    
    // 如果已存在图表，先销毁
    if (prepaymentComparisonChart) {
        prepaymentComparisonChart.destroy();
    }
    
    // 获取原始数据和提前还款后的数据
    const result = prepaymentType === 'reduce-term' 
        ? calculator.calculateReducedTermPrepayment(prepaymentMonth, prepaymentAmount, paymentType)
        : calculator.calculateReducedPaymentPrepayment(prepaymentMonth, prepaymentAmount, paymentType);
    
    if (!result) return;
    
    // 准备数据
    const data = {
        labels: ['总还款额', '已还金额', '待还金额', '已付利息', '待付利息', '节省利息'],
        datasets: [
            {
                label: '提前还款前',
                data: [
                    result.totalPaymentOriginal,
                    result.paidAmount,
                    result.totalPaymentOriginal - result.paidAmount,
                    result.paidInterest,
                    result.totalInterestOriginal - result.paidInterest,
                    0
                ],
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            },
            {
                label: '提前还款后',
                data: [
                    result.totalPaymentNew,
                    result.paidAmount + prepaymentAmount * 10000,
                    result.totalPaymentNew - (result.paidAmount + prepaymentAmount * 10000),
                    result.paidInterest,
                    result.totalInterestNew - result.paidInterest,
                    result.interestSaved
                ],
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }
        ]
    };
    
    // 配置选项
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: '提前还款前后对比分析',
                font: {
                    size: 16
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return context.dataset.label + ': ' + formatCurrency(context.raw);
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return formatCurrency(value);
                    }
                }
            }
        }
    };
    
    // 创建图表
    prepaymentComparisonChart = new Chart(chartContainer, {
        type: 'bar',
        data: data,
        options: options
    });
}

/**
 * 格式化货币数值
 * @param {number} value - 数值
 * @returns {string} 格式化后的字符串
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('zh-CN', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value) + ' 元';
}

/**
 * 处理组合贷款计算
 */
function handleCombinedLoanCalculate() {
    // 获取公积金贷款数据
    const pfAmount = parseFloat(document.getElementById('pfAmount').value);
    const pfRate = parseFloat(document.getElementById('pfRate').value);
    const pfTerm = parseInt(document.getElementById('pfTerm').value);
    
    // 获取商业贷款数据
    const commAmount = parseFloat(document.getElementById('commAmount').value);
    const commRate = parseFloat(document.getElementById('commRate').value);
    const commTerm = parseInt(document.getElementById('commTerm').value);
    
    // 获取还款方式
    const repaymentMethod = document.querySelector('input[name="combinedPaymentType"]:checked').value;
    
    // 验证数据
    if (isNaN(pfAmount) || pfAmount < 0) {
        alert('请输入有效的公积金贷款金额');
        return;
    }
    
    if (isNaN(commAmount) || commAmount < 0) {
        alert('请输入有效的商业贷款金额');
        return;
    }
    
    if (pfAmount === 0 && commAmount === 0) {
        alert('公积金贷款金额和商业贷款金额不能同时为0');
        return;
    }
    
    // 创建组合贷款计算器实例
    combinedCalculator = new CombinedLoanCalculator(
        pfAmount, pfRate, pfTerm, 
        commAmount, commRate, commTerm, 
        repaymentMethod
    );
    
    // 显示组合贷款结果
    displayCombinedLoanResults();
}

/**
 * 显示组合贷款计算结果
 */
function displayCombinedLoanResults() {
    // 显示公积金贷款摘要
    displayProvidentFundSummary();
    
    // 显示商业贷款摘要
    displayCommercialLoanSummary();
    
    // 显示组合贷款总摘要
    displayCombinedLoanSummary();
    
    // 显示组合贷款还款计划表
    displayCombinedSchedule();
    
    // 显示组合贷款图表
    displayCombinedLoanChart();
}

/**
 * 显示公积金贷款摘要
 */
function displayProvidentFundSummary() {
    const summary = combinedCalculator.getProvidentFundSummary();
    const container = document.getElementById('pfLoanSummary');
    
    if (combinedCalculator.pfAmount === 0) {
        container.innerHTML = '<p>未使用公积金贷款</p>';
        return;
    }
    
    if (combinedCalculator.repaymentMethod === 'equal_installment') {
        container.innerHTML = `
            <p>每月月供：<strong>${formatCurrency(summary.monthlyPayment)}</strong></p>
            <p>贷款总额：${formatCurrency(summary.loanAmount)}</p>
            <p>支付利息：<span class="text-danger-highlight">${formatCurrency(summary.totalInterest)}</span></p>
            <p>还款总额：${formatCurrency(summary.totalPayment)}</p>
            <p>期限：${combinedCalculator.pfTotalMonths}个月(${combinedCalculator.pfTotalMonths / 12}年)</p>
        `;
    } else {
        container.innerHTML = `
            <p>首月月供：<strong>${formatCurrency(summary.firstMonthPayment)}</strong></p>
            <p>末月月供：<strong>${formatCurrency(summary.lastMonthPayment)}</strong></p>
            <p>贷款总额：${formatCurrency(summary.loanAmount)}</p>
            <p>支付利息：<span class="text-danger-highlight">${formatCurrency(summary.totalInterest)}</span></p>
            <p>还款总额：${formatCurrency(summary.totalPayment)}</p>
            <p>期限：${combinedCalculator.pfTotalMonths}个月(${combinedCalculator.pfTotalMonths / 12}年)</p>
        `;
    }
}

/**
 * 显示商业贷款摘要
 */
function displayCommercialLoanSummary() {
    const summary = combinedCalculator.getCommercialSummary();
    const container = document.getElementById('commLoanSummary');
    
    if (combinedCalculator.commAmount === 0) {
        container.innerHTML = '<p>未使用商业贷款</p>';
        return;
    }
    
    if (combinedCalculator.repaymentMethod === 'equal_installment') {
        container.innerHTML = `
            <p>每月月供：<strong>${formatCurrency(summary.monthlyPayment)}</strong></p>
            <p>贷款总额：${formatCurrency(summary.loanAmount)}</p>
            <p>支付利息：<span class="text-danger-highlight">${formatCurrency(summary.totalInterest)}</span></p>
            <p>还款总额：${formatCurrency(summary.totalPayment)}</p>
            <p>期限：${combinedCalculator.commTotalMonths}个月(${combinedCalculator.commTotalMonths / 12}年)</p>
        `;
    } else {
        container.innerHTML = `
            <p>首月月供：<strong>${formatCurrency(summary.firstMonthPayment)}</strong></p>
            <p>末月月供：<strong>${formatCurrency(summary.lastMonthPayment)}</strong></p>
            <p>贷款总额：${formatCurrency(summary.loanAmount)}</p>
            <p>支付利息：<span class="text-danger-highlight">${formatCurrency(summary.totalInterest)}</span></p>
            <p>还款总额：${formatCurrency(summary.totalPayment)}</p>
            <p>期限：${combinedCalculator.commTotalMonths}个月(${combinedCalculator.commTotalMonths / 12}年)</p>
        `;
    }
}

/**
 * 显示组合贷款总摘要
 */
function displayCombinedLoanSummary() {
    const summary = combinedCalculator.getCombinedSummary();
    const container = document.getElementById('combinedLoanSummary');
    
    container.innerHTML = `
        <p>首月总月供：<strong>${formatCurrency(summary.firstMonthTotalPayment)}</strong></p>
        <p>贷款总额：${formatCurrency(summary.totalLoanAmount)}</p>
        <p>支付总利息：<span class="text-danger-highlight">${formatCurrency(summary.totalInterest)}</span></p>
        <p>还款总额：${formatCurrency(summary.totalPayment)}</p>
        <p>最长期限：${combinedCalculator.maxTotalMonths}个月(${combinedCalculator.maxTotalMonths / 12}年)</p>
    `;
}

/**
 * 显示组合贷款还款计划表
 * @param {boolean} showFull - 是否显示完整计划
 */
function displayCombinedSchedule(showFull = false) {
    const table = document.getElementById('combinedScheduleTable');
    const tbody = document.getElementById('combinedScheduleBody');
    const schedule = combinedCalculator.combinedSchedule;
    
    // 清空表格
    tbody.innerHTML = '';
    
    // 决定显示哪些月份
    let displayMonths = [];
    
    if (showFull) {
        // 显示所有月份
        displayMonths = schedule;
    } else {
        // 只显示关键月份（第1年每月，之后每年第1个月，以及贷款转折点）
        const totalMonths = schedule.length;
        const pfTotalMonths = combinedCalculator.pfTotalMonths;
        const commTotalMonths = combinedCalculator.commTotalMonths;
        
        displayMonths = schedule.filter(item => {
            // 第1年每月
            if (item.month <= 12) return true;
            
            // 之后每年第1个月
            if (item.month % 12 === 1) return true;
            
            // 公积金贷款结束月
            if (item.month === pfTotalMonths) return true;
            
            // 商业贷款结束月
            if (item.month === commTotalMonths) return true;
            
            // 最后一个月
            if (item.month === totalMonths) return true;
            
            return false;
        });
    }
    
    // 填充表格
    displayMonths.forEach(item => {
        const row = document.createElement('tr');
        
        if (item.month === combinedCalculator.pfTotalMonths && item.month !== combinedCalculator.maxTotalMonths) {
            row.classList.add('table-warning'); // 公积金贷款结束月份高亮
        }
        
        if (item.month === combinedCalculator.commTotalMonths && item.month !== combinedCalculator.maxTotalMonths) {
            row.classList.add('table-info'); // 商业贷款结束月份高亮
        }
        
        row.innerHTML = `
            <td>${item.month}</td>
            <td>${formatCurrency(item.pfPayment)}</td>
            <td>${formatCurrency(item.pfPrincipal)}</td>
            <td>${formatCurrency(item.pfInterest)}</td>
            <td>${formatCurrency(item.pfRemainingPrincipal)}</td>
            <td>${formatCurrency(item.commPayment)}</td>
            <td>${formatCurrency(item.commPrincipal)}</td>
            <td>${formatCurrency(item.commInterest)}</td>
            <td>${formatCurrency(item.commRemainingPrincipal)}</td>
            <td><strong>${formatCurrency(item.totalPayment)}</strong></td>
        `;
        
        tbody.appendChild(row);
    });
}

/**
 * 切换是否显示完整的组合贷款还款计划
 */
function toggleFullCombinedSchedule() {
    if (!combinedCalculator) return;
    
    const showFull = showFullCombinedScheduleCheckbox.checked;
    displayCombinedSchedule(showFull);
}

/**
 * 显示组合贷款图表
 */
function displayCombinedLoanChart() {
    const ctx = document.getElementById('combinedLoanChart').getContext('2d');
    
    // 如果已经有图表，则销毁
    if (combinedLoanChart) {
        combinedLoanChart.destroy();
    }
    
    // 准备数据
    const pfSummary = combinedCalculator.getProvidentFundSummary();
    const commSummary = combinedCalculator.getCommercialSummary();
    
    // 创建图表
    combinedLoanChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['贷款金额', '支付利息', '还款总额'],
            datasets: [
                {
                    label: '公积金贷款',
                    data: [
                        pfSummary.loanAmount / 10000, 
                        pfSummary.totalInterest / 10000, 
                        pfSummary.totalPayment / 10000
                    ],
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: '商业贷款',
                    data: [
                        commSummary.loanAmount / 10000, 
                        commSummary.totalInterest / 10000, 
                        commSummary.totalPayment / 10000
                    ],
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: '组合贷款对比 (万元)',
                    font: {
                        size: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + '万元';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '金额 (万元)'
                    }
                }
            }
        }
    });
    
    // 如果组合贷款期限不同，显示月供变化图表
    if (combinedCalculator.pfTotalMonths !== combinedCalculator.commTotalMonths) {
        displayMonthlyPaymentChangeChart();
    }
}

/**
 * 显示月供变化图表
 * 当公积金贷款和商业贷款期限不同时，展示月供如何随时间变化
 */
function displayMonthlyPaymentChangeChart() {
    // 可以在这里添加一个新图表来展示月供随时间的变化
    // 这个功能可以根据需要进一步实现
}

function displayDetailedPrepaymentSchedule(prepaymentMonth, prepaymentAmount, prepaymentType, paymentType) {
    const scheduleContainer = document.getElementById('detailedPrepaymentSchedule');
    
    // 获取提前还款结果
    const result = prepaymentType === 'reduce-term' 
        ? calculator.calculateReducedTermPrepayment(prepaymentMonth, prepaymentAmount, paymentType)
        : calculator.calculateReducedPaymentPrepayment(prepaymentMonth, prepaymentAmount, paymentType);
    
    if (!result) {
        scheduleContainer.innerHTML = '<p class="text-danger">无法生成还款计划，请检查输入数据</p>';
        return;
    }
    
    // 获取新的还款计划
    const schedule = result.newSchedule;
    
    // 创建表格模板
    const template = `
        <div class="detailed-schedule">
            <div class="schedule-header">
                <h4>提前还款后的详细还款计划</h4>
                <p class="text-muted">第${prepaymentMonth}期提前还款${formatCurrency(prepaymentAmount * 10000)}</p>
            </div>
            
            <div class="schedule-summary">
                <div class="summary-item">
                    <span class="label">总还款额</span>
                    <span class="value">${formatCurrency(result.totalPaymentNew)}</span>
                </div>
                <div class="summary-item">
                    <span class="label">总利息</span>
                    <span class="value">${formatCurrency(result.totalInterestNew)}</span>
                </div>
                <div class="summary-item highlight">
                    <span class="label">节省利息</span>
                    <span class="value text-success">${formatCurrency(result.interestSaved)}</span>
                </div>
            </div>
            
            <div class="schedule-table-container">
                <table class="schedule-table">
                    <thead>
                        <tr>
                            <th>期数</th>
                            <th>还款日期</th>
                            <th>月供</th>
                            <th>本金</th>
                            <th>利息</th>
                            <th>剩余本金</th>
                            <th>备注</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${schedule.map((item, index) => `
                            <tr class="${index + 1 === prepaymentMonth ? 'prepayment-row' : ''}">
                                <td>${item.month}</td>
                                <td>${formatDate(addMonths(new Date(), item.month))}</td>
                                <td>${formatCurrency(item.payment)}</td>
                                <td>${formatCurrency(item.principal)}</td>
                                <td>${formatCurrency(item.interest)}</td>
                                <td>${formatCurrency(item.remainingPrincipal)}</td>
                                <td>
                                    ${index + 1 === prepaymentMonth 
                                        ? `<span class="badge bg-success">提前还款${formatCurrency(prepaymentAmount * 10000)}</span>` 
                                        : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="schedule-notes">
                <p class="text-muted">
                    注：1. 实际还款日期以银行放款日期为准
                    <br>2. 最后一期还款金额可能会有尾差
                    ${paymentType === 'equal-principal' ? '<br>3. 等额本金方式下，月供会逐月递减' : ''}
                </p>
            </div>
        </div>
    `;
    
    scheduleContainer.innerHTML = template;
}

// 辅助函数：格式化日期
function formatDate(date) {
    return date.getFullYear() + '-' + 
           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
           String(date.getDate()).padStart(2, '0');
}

// 辅助函数：添加月份
function addMonths(date, months) {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() + months - 1);
    return newDate;
} 