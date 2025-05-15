/**
 * 房贷计算器核心类
 */
class MortgageCalculator {
    /**
     * 构造函数
     * @param {number} loanAmount - 贷款总额(万元)
     * @param {number} interestRate - 年利率(%)
     * @param {number} loanTerm - 贷款期限(年)
     */
    constructor(loanAmount, interestRate, loanTerm) {
        this.loanAmount = loanAmount * 10000; // 转换为元
        this.monthlyRate = interestRate / 100 / 12; // 月利率
        this.totalMonths = loanTerm * 12; // 总期数
        this.originalLoanAmount = this.loanAmount; // 保存原始贷款金额
        this.originalTotalMonths = this.totalMonths; // 保存原始总期数
        
        // 多次提前还款记录
        this.prepaymentHistory = [];
        
        // 计算还款计划
        this.equalInstallmentSchedule = this.calculateEqualInstallmentSchedule();
        this.equalPrincipalSchedule = this.calculateEqualPrincipalSchedule();
        
        // 保存原始还款计划
        this.originalEqualInstallmentSchedule = [...this.equalInstallmentSchedule];
        this.originalEqualPrincipalSchedule = [...this.equalPrincipalSchedule];
    }
    
    /**
     * 计算等额本息还款计划
     * @returns {Array} 还款计划数组
     */
    calculateEqualInstallmentSchedule() {
        const schedule = [];
        
        // 计算月供
        const monthlyPayment = this.calculateMonthlyPayment();
        
        let remainingPrincipal = this.loanAmount;
        
        for (let month = 1; month <= this.totalMonths; month++) {
            // 计算利息
            const interest = remainingPrincipal * this.monthlyRate;
            
            // 计算本金
            const principal = monthlyPayment - interest;
            
            // 计算剩余本金
            remainingPrincipal -= principal;
            
            // 添加到还款计划
            schedule.push({
                month,
                payment: monthlyPayment,
                principal,
                interest,
                remainingPrincipal: remainingPrincipal > 0 ? remainingPrincipal : 0
            });
        }
        
        return schedule;
    }
    
    /**
     * 计算等额本金还款计划
     * @returns {Array} 还款计划数组
     */
    calculateEqualPrincipalSchedule() {
        const schedule = [];
        
        // 计算每月本金
        const monthlyPrincipal = this.loanAmount / this.totalMonths;
        
        let remainingPrincipal = this.loanAmount;
        
        for (let month = 1; month <= this.totalMonths; month++) {
            // 计算利息
            const interest = remainingPrincipal * this.monthlyRate;
            
            // 计算月供
            const payment = monthlyPrincipal + interest;
            
            // 计算剩余本金
            remainingPrincipal -= monthlyPrincipal;
            
            // 添加到还款计划
            schedule.push({
                month,
                payment,
                principal: monthlyPrincipal,
                interest,
                remainingPrincipal: remainingPrincipal > 0 ? remainingPrincipal : 0
            });
        }
        
        return schedule;
    }
    
    /**
     * 计算等额本息月供
     * @returns {number} 月供金额
     */
    calculateMonthlyPayment() {
        if (this.monthlyRate === 0) {
            return this.loanAmount / this.totalMonths;
        }
        
        return this.loanAmount * this.monthlyRate * Math.pow(1 + this.monthlyRate, this.totalMonths) 
               / (Math.pow(1 + this.monthlyRate, this.totalMonths) - 1);
    }
    
    /**
     * 获取等额本息还款总摘要
     * @returns {Object} 总摘要对象
     */
    getEqualInstallmentSummary() {
        const monthlyPayment = this.equalInstallmentSchedule[0].payment;
        const totalPayment = monthlyPayment * this.totalMonths;
        const totalInterest = totalPayment - this.loanAmount;
        
        return {
            monthlyPayment,
            totalPayment,
            totalInterest,
            loanAmount: this.loanAmount
        };
    }
    
    /**
     * 获取等额本金还款总摘要
     * @returns {Object} 总摘要对象
     */
    getEqualPrincipalSummary() {
        const firstMonthPayment = this.equalPrincipalSchedule[0].payment;
        const lastMonthPayment = this.equalPrincipalSchedule[this.totalMonths - 1].payment;
        
        const totalPayment = this.equalPrincipalSchedule.reduce((sum, item) => sum + item.payment, 0);
        const totalInterest = totalPayment - this.loanAmount;
        
        return {
            firstMonthPayment,
            lastMonthPayment,
            totalPayment,
            totalInterest,
            loanAmount: this.loanAmount
        };
    }
    
    /**
     * 计算提前还款方案 - 缩短还款期限
     * @param {number} prepaymentMonth - 提前还款月份
     * @param {number} prepaymentAmount - 提前还款金额(万元)
     * @param {string} paymentType - 还款方式('equal-installment' 或 'equal-principal')
     * @returns {Object} 提前还款分析结果
     */
    calculateReducedTermPrepayment(prepaymentMonth, prepaymentAmount, paymentType) {
        prepaymentAmount = prepaymentAmount * 10000; // 转换为元
        
        // 选择合适的原始还款计划（使用未经修改的原始计划）
        const originalSchedule = paymentType === 'equal-installment' 
            ? this.originalEqualInstallmentSchedule 
            : this.originalEqualPrincipalSchedule;
            
        // 选择当前的还款计划（可能包含之前的提前还款）
        const currentSchedule = paymentType === 'equal-installment' 
            ? this.equalInstallmentSchedule 
            : this.equalPrincipalSchedule;
        
        // 如果提前还款月份超过总期数，返回null
        if (prepaymentMonth > this.totalMonths) {
            return null;
        }
        
        // 获取提前还款前的剩余本金
        const remainingPrincipalBeforePrepayment = currentSchedule[prepaymentMonth - 1].remainingPrincipal;
        
        // 如果提前还款金额大于剩余本金，则全部还清
        if (prepaymentAmount >= remainingPrincipalBeforePrepayment) {
            // 计算原始总利息（使用原始计划）
            const totalInterestOriginal = this.calculateTotalInterest(originalSchedule);
            
            // 计算提前还款前已支付的利息（使用当前计划）
            const totalInterestBeforePrepayment = this.calculateTotalInterestBeforeMonth(
                currentSchedule, 
                prepaymentMonth
            );
            
            // 提前还清贷款节省的是剩余所有利息
            const interestSaved = totalInterestOriginal - totalInterestBeforePrepayment;
            
            return {
                newTotalMonths: prepaymentMonth,
                monthsReduced: this.totalMonths - prepaymentMonth,
                totalInterestOriginal: totalInterestOriginal,
                totalInterestNew: totalInterestBeforePrepayment,
                interestSaved: interestSaved,
                fullPayoff: true,
                originalTotalMonths: this.totalMonths
            };
        }
        
        // 计算提前还款后的剩余本金
        const remainingPrincipalAfterPrepayment = remainingPrincipalBeforePrepayment - prepaymentAmount;
        
        // 如果是等额本息
        if (paymentType === 'equal-installment') {
            // 计算新的还款期限
            const monthlyPayment = currentSchedule[0].payment;
            const newRemainingMonths = Math.ceil(
                Math.log(monthlyPayment / (monthlyPayment - remainingPrincipalAfterPrepayment * this.monthlyRate)) /
                Math.log(1 + this.monthlyRate)
            );
            
            // 计算新的总还款期限
            const newTotalMonths = prepaymentMonth + newRemainingMonths;
            
            // 计算原始总利息（使用原始计划）
            const totalInterestOriginal = this.calculateTotalInterest(originalSchedule);
            
            // 计算新的总利息
            const totalInterestBeforePrepayment = this.calculateTotalInterestBeforeMonth(
                currentSchedule, 
                prepaymentMonth
            );
            
            // 计算还款后剩余期数的利息总额
            const totalInterestAfterPrepayment = (monthlyPayment * newRemainingMonths) - remainingPrincipalAfterPrepayment;
            
            const totalInterestNew = totalInterestBeforePrepayment + totalInterestAfterPrepayment;
            
            // 计算节省的利息
            const interestSaved = totalInterestOriginal - totalInterestNew;
            
            return {
                newTotalMonths,
                monthsReduced: this.totalMonths - newTotalMonths,
                totalInterestOriginal,
                totalInterestNew,
                interestSaved,
                fullPayoff: false,
                originalTotalMonths: this.totalMonths
            };
        } 
        // 如果是等额本金
        else {
            // 计算每月本金
            const monthlyPrincipal = currentSchedule[0].principal;
            
            // 提前还款相当于多少个月的本金
            const principalMonthsReduced = Math.floor(prepaymentAmount / monthlyPrincipal);
            
            // 计算新的总还款期限
            const newTotalMonths = this.totalMonths - principalMonthsReduced;
            
            // 计算原始总利息（使用原始计划）
            const totalInterestOriginal = this.calculateTotalInterest(originalSchedule);
            
            // 创建新的还款计划计算总利息
            const newSchedule = [];
            let newRemainingPrincipal = remainingPrincipalAfterPrepayment;
            
            // 重新计算从提前还款月开始的还款计划
            for (let month = prepaymentMonth; month < newTotalMonths; month++) {
                const interest = newRemainingPrincipal * this.monthlyRate;
                newRemainingPrincipal -= monthlyPrincipal;
                
                newSchedule.push({
                    month,
                    interest,
                    principal: monthlyPrincipal,
                    remainingPrincipal: newRemainingPrincipal > 0 ? newRemainingPrincipal : 0
                });
            }
            
            // 计算新的总利息
            const totalInterestBeforePrepayment = this.calculateTotalInterestBeforeMonth(
                currentSchedule, 
                prepaymentMonth
            );
            
            const totalInterestAfterPrepayment = newSchedule.reduce((sum, item) => sum + item.interest, 0);
            
            const totalInterestNew = totalInterestBeforePrepayment + totalInterestAfterPrepayment;
            
            // 计算节省的利息
            const interestSaved = totalInterestOriginal - totalInterestNew;
            
            return {
                newTotalMonths,
                monthsReduced: this.totalMonths - newTotalMonths,
                totalInterestOriginal,
                totalInterestNew,
                interestSaved,
                fullPayoff: false,
                originalTotalMonths: this.totalMonths
            };
        }
    }
    
    /**
     * 计算提前还款方案 - 减少月供
     * @param {number} prepaymentMonth - 提前还款月份
     * @param {number} prepaymentAmount - 提前还款金额(万元)
     * @param {string} paymentType - 还款方式('equal-installment' 或 'equal-principal')
     * @returns {Object} 提前还款分析结果
     */
    calculateReducedPaymentPrepayment(prepaymentMonth, prepaymentAmount, paymentType) {
        prepaymentAmount = prepaymentAmount * 10000; // 转换为元
        
        // 选择合适的原始还款计划（使用未经修改的原始计划）
        const originalSchedule = paymentType === 'equal-installment' 
            ? this.originalEqualInstallmentSchedule 
            : this.originalEqualPrincipalSchedule;
            
        // 选择当前的还款计划（可能包含之前的提前还款）
        const currentSchedule = paymentType === 'equal-installment' 
            ? this.equalInstallmentSchedule 
            : this.equalPrincipalSchedule;
        
        // 如果提前还款月份超过总期数，返回null
        if (prepaymentMonth > this.totalMonths) {
            return null;
        }
        
        // 获取提前还款前的剩余本金
        const remainingPrincipalBeforePrepayment = currentSchedule[prepaymentMonth - 1].remainingPrincipal;
        
        // 如果提前还款金额大于剩余本金，则全部还清
        if (prepaymentAmount >= remainingPrincipalBeforePrepayment) {
            // 计算原始总利息（使用原始计划）
            const totalInterestOriginal = this.calculateTotalInterest(originalSchedule);
            
            // 计算提前还款前已支付的利息（使用当前计划）
            const totalInterestBeforePrepayment = this.calculateTotalInterestBeforeMonth(
                currentSchedule, 
                prepaymentMonth
            );
            
            // 提前还清贷款节省的是剩余所有利息
            const interestSaved = totalInterestOriginal - totalInterestBeforePrepayment;
            
            return {
                fullPayoff: true,
                originalMonthlyPayment: originalSchedule[0].payment,
                newMonthlyPayment: 0,
                paymentReduction: originalSchedule[0].payment,
                totalInterestOriginal: totalInterestOriginal,
                totalInterestNew: totalInterestBeforePrepayment,
                interestSaved: interestSaved
            };
        }
        
        // 计算提前还款后的剩余本金
        const remainingPrincipalAfterPrepayment = remainingPrincipalBeforePrepayment - prepaymentAmount;
        
        // 如果是等额本息
        if (paymentType === 'equal-installment') {
            // 计算原始月供
            const originalMonthlyPayment = originalSchedule[0].payment;
            
            // 计算新的月供
            const remainingMonths = this.totalMonths - prepaymentMonth + 1;
            const newMonthlyPayment = this.calculateMonthlyPaymentForAmount(
                remainingPrincipalAfterPrepayment, 
                this.monthlyRate, 
                remainingMonths
            );
            
            // 计算月供减少额
            const paymentReduction = originalMonthlyPayment - newMonthlyPayment;
            
            // 计算原始总利息
            const totalInterestOriginal = this.calculateTotalInterest(originalSchedule);
            
            // 计算新的总利息
            const totalInterestBeforePrepayment = this.calculateTotalInterestBeforeMonth(
                originalSchedule, 
                prepaymentMonth
            );
            
            // 计算剩余期限的新利息总额
            const totalInterestAfterPrepayment = (newMonthlyPayment * remainingMonths) - remainingPrincipalAfterPrepayment;
            
            const totalInterestNew = totalInterestBeforePrepayment + totalInterestAfterPrepayment;
            
            // 计算节省的利息
            const interestSaved = totalInterestOriginal - totalInterestNew;
            
            return {
                originalMonthlyPayment,
                newMonthlyPayment,
                paymentReduction,
                totalInterestOriginal,
                totalInterestNew,
                interestSaved,
                fullPayoff: false
            };
        } 
        // 如果是等额本金
        else {
            // 计算原始首月月供
            const originalFirstMonthPayment = originalSchedule[prepaymentMonth - 1].payment;
            
            // 计算新的每月本金
            const remainingMonths = this.totalMonths - prepaymentMonth + 1;
            const newMonthlyPrincipal = remainingPrincipalAfterPrepayment / remainingMonths;
            
            // 计算新的首月月供
            const newFirstMonthPayment = newMonthlyPrincipal + remainingPrincipalAfterPrepayment * this.monthlyRate;
            
            // 计算月供减少额
            const paymentReduction = originalFirstMonthPayment - newFirstMonthPayment;
            
            // 计算原始总利息
            const totalInterestOriginal = this.calculateTotalInterest(originalSchedule);
            
            // 计算提前还款前已支付的利息
            const totalInterestBeforePrepayment = this.calculateTotalInterestBeforeMonth(
                originalSchedule, 
                prepaymentMonth
            );
            
            // 创建新的还款计划计算总利息
            const newSchedule = [];
            let newRemainingPrincipal = remainingPrincipalAfterPrepayment;
            
            // 计算剩余期限的新还款计划
            for (let month = 0; month < remainingMonths; month++) {
                const interest = newRemainingPrincipal * this.monthlyRate;
                newRemainingPrincipal -= newMonthlyPrincipal;
                
                newSchedule.push({
                    month: prepaymentMonth + month,
                    interest,
                    principal: newMonthlyPrincipal,
                    remainingPrincipal: newRemainingPrincipal > 0 ? newRemainingPrincipal : 0
                });
            }
            
            // 计算剩余期限的新利息总额
            const totalInterestAfterPrepayment = newSchedule.reduce((sum, item) => sum + item.interest, 0);
            
            const totalInterestNew = totalInterestBeforePrepayment + totalInterestAfterPrepayment;
            
            // 计算节省的利息
            const interestSaved = totalInterestOriginal - totalInterestNew;
            
            return {
                originalFirstMonthPayment,
                newFirstMonthPayment,
                paymentReduction,
                totalInterestOriginal,
                totalInterestNew,
                interestSaved,
                fullPayoff: false
            };
        }
    }
    
    /**
     * 辅助方法：计算特定本金、利率和期限的月供
     * @param {number} amount - 本金
     * @param {number} rate - 月利率
     * @param {number} months - 期限(月)
     * @returns {number} 月供金额
     */
    calculateMonthlyPaymentForAmount(amount, rate, months) {
        if (rate === 0) {
            return amount / months;
        }
        
        return amount * rate * Math.pow(1 + rate, months) / (Math.pow(1 + rate, months) - 1);
    }
    
    /**
     * 辅助方法：计算还款计划中的总利息
     * @param {Array} schedule - 还款计划
     * @returns {number} 总利息
     */
    calculateTotalInterest(schedule) {
        return schedule.reduce((sum, item) => sum + item.interest, 0);
    }
    
    /**
     * 辅助方法：计算特定月份前的总利息
     * @param {Array} schedule - 还款计划
     * @param {number} month - 月份
     * @returns {number} 总利息
     */
    calculateTotalInterestBeforeMonth(schedule, month) {
        return schedule.slice(0, month).reduce((sum, item) => sum + item.interest, 0);
    }
    
    /**
     * 添加提前还款记录并重新计算还款计划
     * @param {number} prepaymentMonth - 提前还款月份
     * @param {number} prepaymentAmount - 提前还款金额(万元)
     * @param {string} prepaymentType - 提前还款方式 ('reduce-term' 或 'reduce-payment')
     * @param {string} paymentType - 还款方式 ('equal-installment' 或 'equal-principal')
     * @returns {boolean} 是否添加成功
     */
    addPrepayment(prepaymentMonth, prepaymentAmount, prepaymentType, paymentType) {
        prepaymentAmount = prepaymentAmount * 10000; // 转换为元
        
        // 选择合适的还款计划
        const currentSchedule = paymentType === 'equal-installment' 
            ? this.equalInstallmentSchedule 
            : this.equalPrincipalSchedule;
        
        // 验证提前还款月份是否有效
        if (prepaymentMonth <= 0 || prepaymentMonth > currentSchedule.length) {
            return false;
        }
        
        // 验证提前还款金额是否有效
        if (prepaymentAmount <= 0 || prepaymentAmount > currentSchedule[prepaymentMonth - 1].remainingPrincipal) {
            return false;
        }
        
        // 添加到提前还款记录
        this.prepaymentHistory.push({
            month: prepaymentMonth,
            amount: prepaymentAmount,
            type: prepaymentType,
            paymentType: paymentType,
            date: new Date()
        });
        
        // 重新计算还款计划
        this.recalculateSchedulesWithPrepayments();
        
        return true;
    }
    
    /**
     * 重新计算考虑所有提前还款的还款计划
     */
    recalculateSchedulesWithPrepayments() {
        // 按提前还款月份排序（升序）
        this.prepaymentHistory.sort((a, b) => a.month - b.month);
        
        // 重置还款计划为原始计划
        this.equalInstallmentSchedule = [...this.originalEqualInstallmentSchedule];
        this.equalPrincipalSchedule = [...this.originalEqualPrincipalSchedule];
        
        // 遍历所有提前还款记录，依次应用
        for (let i = 0; i < this.prepaymentHistory.length; i++) {
            const prepayment = this.prepaymentHistory[i];
            
            // 应用提前还款
            if (prepayment.type === 'reduce-term') {
                this.applyReduceTermPrepayment(i, prepayment);
            } else {
                this.applyReducePaymentPrepayment(i, prepayment);
            }
        }
    }
    
    /**
     * 应用一次缩短还款期限的提前还款
     * @param {number} index - 提前还款记录的索引
     * @param {Object} prepayment - 提前还款记录
     */
    applyReduceTermPrepayment(index, prepayment) {
        const paymentType = prepayment.paymentType;
        const prepaymentMonth = prepayment.month;
        const prepaymentAmount = prepayment.amount;
        
        // 选择合适的还款计划
        let schedule = paymentType === 'equal-installment' 
            ? this.equalInstallmentSchedule 
            : this.equalPrincipalSchedule;
        
        // 如果提前还款月份超过当前计划长度，不执行
        if (prepaymentMonth > schedule.length) {
            return;
        }
        
        // 获取提前还款前的剩余本金
        const remainingPrincipalBeforePrepayment = schedule[prepaymentMonth - 1].remainingPrincipal;
        
        // 如果提前还款金额大于剩余本金，则全部还清
        if (prepaymentAmount >= remainingPrincipalBeforePrepayment) {
            // 截断还款计划
            schedule = schedule.slice(0, prepaymentMonth);
            
            // 更新最后一个月的数据
            schedule[prepaymentMonth - 1].remainingPrincipal = 0;
            
            // 设置更新后的还款计划
            if (paymentType === 'equal-installment') {
                this.equalInstallmentSchedule = schedule;
            } else {
                this.equalPrincipalSchedule = schedule;
            }
            return;
        }
        
        // 计算提前还款后的剩余本金
        const remainingPrincipalAfterPrepayment = remainingPrincipalBeforePrepayment - prepaymentAmount;
        
        // 如果是等额本息
        if (paymentType === 'equal-installment') {
            // 计算新的还款期限
            const monthlyPayment = schedule[0].payment;
            const newRemainingMonths = Math.ceil(
                Math.log(monthlyPayment / (monthlyPayment - remainingPrincipalAfterPrepayment * this.monthlyRate)) /
                Math.log(1 + this.monthlyRate)
            );
            
            // 创建新的还款计划
            const newSchedule = schedule.slice(0, prepaymentMonth);
            let newRemainingPrincipal = remainingPrincipalAfterPrepayment;
            
            for (let month = 1; month <= newRemainingMonths; month++) {
                const interest = newRemainingPrincipal * this.monthlyRate;
                const principal = monthlyPayment - interest;
                newRemainingPrincipal -= principal;
                
                newSchedule.push({
                    month: prepaymentMonth + month,
                    payment: monthlyPayment,
                    principal: principal,
                    interest: interest,
                    remainingPrincipal: newRemainingPrincipal > 0 ? newRemainingPrincipal : 0
                });
                
                // 如果剩余本金减为0或负数，则结束
                if (newRemainingPrincipal <= 0) {
                    break;
                }
            }
            
            // 更新还款计划
            this.equalInstallmentSchedule = newSchedule;
        } 
        // 如果是等额本金
        else {
            // 计算每月本金
            const monthlyPrincipal = schedule[0].principal;
            
            // 提前还款相当于多少个月的本金
            const principalMonthsReduced = Math.floor(prepaymentAmount / monthlyPrincipal);
            const extraPrepayment = prepaymentAmount - (principalMonthsReduced * monthlyPrincipal);
            
            // 创建新的还款计划
            const newSchedule = schedule.slice(0, prepaymentMonth);
            let newRemainingPrincipal = remainingPrincipalAfterPrepayment;
            
            // 计算新的结束期数
            const newRemainingMonths = Math.ceil(newRemainingPrincipal / monthlyPrincipal);
            
            for (let month = 1; month <= newRemainingMonths; month++) {
                const interest = newRemainingPrincipal * this.monthlyRate;
                const principal = Math.min(monthlyPrincipal, newRemainingPrincipal);
                const payment = principal + interest;
                
                newRemainingPrincipal -= principal;
                
                newSchedule.push({
                    month: prepaymentMonth + month,
                    payment: payment,
                    principal: principal,
                    interest: interest,
                    remainingPrincipal: newRemainingPrincipal > 0 ? newRemainingPrincipal : 0
                });
                
                // 如果剩余本金减为0或负数，则结束
                if (newRemainingPrincipal <= 0) {
                    break;
                }
            }
            
            // 更新还款计划
            this.equalPrincipalSchedule = newSchedule;
        }
    }
    
    /**
     * 应用一次减少月供的提前还款
     * @param {number} index - 提前还款记录的索引
     * @param {Object} prepayment - 提前还款记录
     */
    applyReducePaymentPrepayment(index, prepayment) {
        const paymentType = prepayment.paymentType;
        const prepaymentMonth = prepayment.month;
        const prepaymentAmount = prepayment.amount;
        
        // 选择合适的还款计划
        let schedule = paymentType === 'equal-installment' 
            ? this.equalInstallmentSchedule 
            : this.equalPrincipalSchedule;
        
        // 如果提前还款月份超过当前计划长度，不执行
        if (prepaymentMonth > schedule.length) {
            return;
        }
        
        // 获取提前还款前的剩余本金
        const remainingPrincipalBeforePrepayment = schedule[prepaymentMonth - 1].remainingPrincipal;
        
        // 如果提前还款金额大于剩余本金，则全部还清
        if (prepaymentAmount >= remainingPrincipalBeforePrepayment) {
            // 截断还款计划
            schedule = schedule.slice(0, prepaymentMonth);
            
            // 更新最后一个月的数据
            schedule[prepaymentMonth - 1].remainingPrincipal = 0;
            
            // 设置更新后的还款计划
            if (paymentType === 'equal-installment') {
                this.equalInstallmentSchedule = schedule;
            } else {
                this.equalPrincipalSchedule = schedule;
            }
            return;
        }
        
        // 计算提前还款后的剩余本金
        const remainingPrincipalAfterPrepayment = remainingPrincipalBeforePrepayment - prepaymentAmount;
        
        // 保留原计划前半部分
        const newSchedule = schedule.slice(0, prepaymentMonth);
        
        // 剩余月数
        const remainingMonths = this.originalTotalMonths - prepaymentMonth;
        
        // 如果是等额本息
        if (paymentType === 'equal-installment') {
            // 计算新的月供
            const newMonthlyPayment = this.calculateMonthlyPaymentForAmount(
                remainingPrincipalAfterPrepayment, 
                this.monthlyRate, 
                remainingMonths
            );
            
            // 创建新的还款计划
            let newRemainingPrincipal = remainingPrincipalAfterPrepayment;
            
            for (let month = 0; month < remainingMonths; month++) {
                const interest = newRemainingPrincipal * this.monthlyRate;
                const principal = newMonthlyPayment - interest;
                newRemainingPrincipal -= principal;
                
                newSchedule.push({
                    month: prepaymentMonth + month + 1,
                    payment: newMonthlyPayment,
                    principal: principal,
                    interest: interest,
                    remainingPrincipal: newRemainingPrincipal > 0 ? newRemainingPrincipal : 0
                });
                
                // 如果剩余本金减为0或负数，则结束
                if (newRemainingPrincipal <= 0) {
                    break;
                }
            }
            
            // 更新还款计划
            this.equalInstallmentSchedule = newSchedule;
        } 
        // 如果是等额本金
        else {
            // 计算新的每月本金
            const newMonthlyPrincipal = remainingPrincipalAfterPrepayment / remainingMonths;
            
            // 创建新的还款计划
            let newRemainingPrincipal = remainingPrincipalAfterPrepayment;
            
            for (let month = 0; month < remainingMonths; month++) {
                const interest = newRemainingPrincipal * this.monthlyRate;
                const principal = newMonthlyPrincipal;
                const payment = principal + interest;
                
                newRemainingPrincipal -= principal;
                
                newSchedule.push({
                    month: prepaymentMonth + month + 1,
                    payment: payment,
                    principal: principal,
                    interest: interest,
                    remainingPrincipal: newRemainingPrincipal > 0 ? newRemainingPrincipal : 0
                });
                
                // 如果剩余本金减为0或负数，则结束
                if (newRemainingPrincipal <= 0) {
                    break;
                }
            }
            
            // 更新还款计划
            this.equalPrincipalSchedule = newSchedule;
        }
    }
    
    /**
     * 清除所有提前还款记录并恢复原始还款计划
     */
    clearPrepayments() {
        this.prepaymentHistory = [];
        this.equalInstallmentSchedule = [...this.originalEqualInstallmentSchedule];
        this.equalPrincipalSchedule = [...this.originalEqualPrincipalSchedule];
        return true;
    }
    
    /**
     * 获取多次提前还款后的月供明细数据（用于图表显示）
     * @param {string} paymentType - 还款方式 ('equal-installment' 或 'equal-principal')
     * @returns {Object} 月供明细数据，包含原始月供和当前月供
     */
    getMonthlyPaymentComparisonData(paymentType) {
        const originalSchedule = paymentType === 'equal-installment' 
            ? this.originalEqualInstallmentSchedule 
            : this.originalEqualPrincipalSchedule;
            
        const currentSchedule = paymentType === 'equal-installment' 
            ? this.equalInstallmentSchedule 
            : this.equalPrincipalSchedule;
        
        // 创建月供数据数组
        const months = [];
        const originalPayments = [];
        const currentPayments = [];
        
        // 获取最大期数
        const maxMonths = Math.max(originalSchedule.length, currentSchedule.length);
        
        for (let i = 0; i < maxMonths; i++) {
            // 月份
            months.push(i + 1);
            
            // 原始月供
            if (i < originalSchedule.length) {
                originalPayments.push(originalSchedule[i].payment);
            } else {
                originalPayments.push(0);
            }
            
            // 当前月供
            if (i < currentSchedule.length) {
                currentPayments.push(currentSchedule[i].payment);
            } else {
                currentPayments.push(0);
            }
        }
        
        return {
            months,
            originalPayments,
            currentPayments
        };
    }
    
    /**
     * 获取提前还款历史记录
     * @returns {Array} 提前还款历史记录
     */
    getPrepaymentHistory() {
        return this.prepaymentHistory.map(item => ({
            month: item.month,
            amount: item.amount / 10000, // 转回万元
            type: item.type,
            paymentType: item.paymentType,
            date: item.date
        }));
    }
}

// 导出计算器类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MortgageCalculator;
} 