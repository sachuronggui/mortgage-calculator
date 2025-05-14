/**
 * 智能房贷计算与规划器 - 主程序
 */

// 保存计算器实例
let calculator = null;

// 图表实例
let comparisonChart = null;
let prepaymentComparisonChart = null;

// DOM元素引用
const loanForm = document.getElementById('loanForm');
const prepaymentForm = document.getElementById('prepaymentForm');
const propertyPriceInput = document.getElementById('propertyPrice');
const downPaymentInput = document.getElementById('downPayment');
const loanAmountInput = document.getElementById('loanAmount');
const interestRateInput = document.getElementById('interestRate');
const loanTermSelect = document.getElementById('loanTerm');
const showFullPaymentScheduleCheckbox = document.getElementById('showFullPaymentSchedule');

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
    
    // 计算提前还款方案
    displayPrepaymentResults(prepaymentMonth, prepaymentAmount, prepaymentType, paymentType);
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
 * 显示提前还款结果
 * @param {number} prepaymentMonth - 提前还款月份
 * @param {number} prepaymentAmount - 提前还款金额
 * @param {string} prepaymentType - 提前还款方式
 * @param {string} paymentType - 还款方式
 */
function displayPrepaymentResults(prepaymentMonth, prepaymentAmount, prepaymentType, paymentType) {
    // 根据提前还款方式选择计算方法
    if (prepaymentType === 'reduce-term') {
        // 缩短还款期限
        const result = calculator.calculateReducedTermPrepayment(prepaymentMonth, prepaymentAmount, paymentType);
        displayReducedTermResults(result, prepaymentMonth, prepaymentAmount);
    } else {
        // 减少月供金额
        const result = calculator.calculateReducedPaymentPrepayment(prepaymentMonth, prepaymentAmount, paymentType);
        displayReducedPaymentResults(result, prepaymentMonth, prepaymentAmount);
    }
    
    // 显示提前还款对比图表
    displayPrepaymentComparisonChart(prepaymentMonth, prepaymentAmount, prepaymentType, paymentType);
}

/**
 * 显示缩短还款期限的提前还款结果
 * @param {Object} result - 计算结果
 * @param {number} prepaymentMonth - 提前还款月份
 * @param {number} prepaymentAmount - 提前还款金额
 */
function displayReducedTermResults(result, prepaymentMonth, prepaymentAmount) {
    const container = document.getElementById('reducedTermResults');
    
    if (!result) {
        container.innerHTML = '<p>提前还款月份超过了总还款期限</p>';
        return;
    }
    
    if (result.fullPayoff) {
        container.innerHTML = `
            <p class="text-success-highlight">恭喜！您可以在第${prepaymentMonth}个月一次性还清所有贷款！</p>
            <p>提前还款金额：${formatCurrency(prepaymentAmount * 10000)}</p>
            <p>节省的利息：${formatCurrency(result.interestSaved)}</p>
            <p>提前结束：${result.monthsReduced}个月(${(result.monthsReduced / 12).toFixed(1)}年)</p>
        `;
    } else {
        container.innerHTML = `
            <p>在第${prepaymentMonth}个月提前还款${formatCurrency(prepaymentAmount * 10000)}元，选择缩短期限</p>
            <p>原还款期限：${result.originalTotalMonths}个月(${(result.originalTotalMonths / 12).toFixed(1)}年)</p>
            <p>新还款期限：<strong>${result.newTotalMonths}个月(${(result.newTotalMonths / 12).toFixed(1)}年)</strong></p>
            <p>缩短期限：<span class="text-success-highlight">${result.monthsReduced}个月(${(result.monthsReduced / 12).toFixed(1)}年)</span></p>
            <p>节省利息：<span class="text-success-highlight">${formatCurrency(result.interestSaved)}</span></p>
        `;
    }
}

/**
 * 显示减少月供金额的提前还款结果
 * @param {Object} result - 计算结果
 * @param {number} prepaymentMonth - 提前还款月份
 * @param {number} prepaymentAmount - 提前还款金额
 */
function displayReducedPaymentResults(result, prepaymentMonth, prepaymentAmount) {
    const container = document.getElementById('reducedPaymentResults');
    
    if (!result) {
        container.innerHTML = '<p>提前还款月份超过了总还款期限</p>';
        return;
    }
    
    if (result.fullPayoff) {
        container.innerHTML = `
            <p class="text-success-highlight">恭喜！您可以在第${prepaymentMonth}个月一次性还清所有贷款！</p>
            <p>提前还款金额：${formatCurrency(prepaymentAmount * 10000)}</p>
            <p>节省的利息：${formatCurrency(result.interestSaved)}</p>
            <p>月供减少：${formatCurrency(result.paymentReduction)}</p>
        `;
    } else {
        const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
        
        if (paymentType === 'equal-installment') {
            container.innerHTML = `
                <p>在第${prepaymentMonth}个月提前还款${formatCurrency(prepaymentAmount * 10000)}元，选择减少月供</p>
                <p>原月供：${formatCurrency(result.originalMonthlyPayment)}</p>
                <p>新月供：<strong>${formatCurrency(result.newMonthlyPayment)}</strong></p>
                <p>月供减少：<span class="text-success-highlight">${formatCurrency(result.paymentReduction)}</span></p>
                <p>节省利息：<span class="text-success-highlight">${formatCurrency(result.interestSaved)}</span></p>
            `;
        } else {
            container.innerHTML = `
                <p>在第${prepaymentMonth}个月提前还款${formatCurrency(prepaymentAmount * 10000)}元，选择减少月供</p>
                <p>原首月月供：${formatCurrency(result.originalFirstMonthPayment)}</p>
                <p>新首月月供：<strong>${formatCurrency(result.newFirstMonthPayment)}</strong></p>
                <p>首月月供减少：<span class="text-success-highlight">${formatCurrency(result.paymentReduction)}</span></p>
                <p>节省利息：<span class="text-success-highlight">${formatCurrency(result.interestSaved)}</span></p>
                <p class="text-muted">注：等额本金方式下，月供会逐月递减</p>
            `;
        }
    }
}

/**
 * 显示提前还款对比图表
 * @param {number} prepaymentMonth - 提前还款月份
 * @param {number} prepaymentAmount - 提前还款金额
 * @param {string} prepaymentType - 提前还款方式
 * @param {string} paymentType - 还款方式
 */
function displayPrepaymentComparisonChart(prepaymentMonth, prepaymentAmount, prepaymentType, paymentType) {
    // 获取Canvas元素
    const ctx = document.getElementById('prepaymentComparisonChart').getContext('2d');
    
    // 如果已经存在图表，则销毁它
    if (prepaymentComparisonChart) {
        prepaymentComparisonChart.destroy();
    }
    
    // 计算结果
    let reducedTermResult = calculator.calculateReducedTermPrepayment(prepaymentMonth, prepaymentAmount, paymentType);
    let reducedPaymentResult = calculator.calculateReducedPaymentPrepayment(prepaymentMonth, prepaymentAmount, paymentType);
    
    // 如果是全部还清的情况，使用相同的结果
    if (reducedTermResult && reducedTermResult.fullPayoff) {
        reducedPaymentResult = reducedTermResult;
    }
    
    // 准备图表数据
    const labels = ['不提前还款', '缩短还款期限', '减少月供'];
    const interestData = [
        calculator.getEqualInstallmentSummary().totalInterest / 10000,
        reducedTermResult ? reducedTermResult.totalInterestNew / 10000 : 0,
        reducedPaymentResult ? reducedPaymentResult.totalInterestNew / 10000 : 0
    ];
    
    // 计算节省的利息
    const interestSavedData = [
        0,
        reducedTermResult ? (reducedTermResult.interestSaved / 10000) : 0,
        reducedPaymentResult ? (reducedPaymentResult.interestSaved / 10000) : 0
    ];
    
    // 创建图表数据
    const data = {
        labels: labels,
        datasets: [
            {
                label: '支付利息',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                data: interestData
            },
            {
                label: '节省利息',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                data: interestSavedData
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
                    text: '金额 (万元)'
                }
            }
        },
        plugins: {
            title: {
                display: true,
                text: '提前还款方案对比'
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
    prepaymentComparisonChart = new Chart(ctx, {
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