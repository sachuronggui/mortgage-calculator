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
        
        // 计算还款计划
        this.equalInstallmentSchedule = this.calculateEqualInstallmentSchedule();
        this.equalPrincipalSchedule = this.calculateEqualPrincipalSchedule();
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
        
        // 选择合适的还款计划
        const originalSchedule = paymentType === 'equal-installment' 
            ? this.equalInstallmentSchedule 
            : this.equalPrincipalSchedule;
        
        // 如果提前还款月份超过总期数，返回null
        if (prepaymentMonth > this.totalMonths) {
            return null;
        }
        
        // 获取提前还款前的剩余本金
        const remainingPrincipalBeforePrepayment = originalSchedule[prepaymentMonth - 1].remainingPrincipal;
        
        // 如果提前还款金额大于剩余本金，则全部还清
        if (prepaymentAmount >= remainingPrincipalBeforePrepayment) {
            return {
                newTotalMonths: prepaymentMonth,
                monthsReduced: this.totalMonths - prepaymentMonth,
                totalInterestOriginal: this.calculateTotalInterest(originalSchedule),
                totalInterestNew: this.calculateTotalInterestBeforeMonth(originalSchedule, prepaymentMonth),
                interestSaved: this.calculateTotalInterest(originalSchedule) - 
                               this.calculateTotalInterestBeforeMonth(originalSchedule, prepaymentMonth),
                fullPayoff: true,
                originalTotalMonths: this.totalMonths
            };
        }
        
        // 计算提前还款后的剩余本金
        const remainingPrincipalAfterPrepayment = remainingPrincipalBeforePrepayment - prepaymentAmount;
        
        // 如果是等额本息
        if (paymentType === 'equal-installment') {
            // 计算新的还款期限
            const monthlyPayment = originalSchedule[0].payment;
            const newRemainingMonths = Math.ceil(
                Math.log(monthlyPayment / (monthlyPayment - remainingPrincipalAfterPrepayment * this.monthlyRate)) /
                Math.log(1 + this.monthlyRate)
            );
            
            // 计算新的总还款期限
            const newTotalMonths = prepaymentMonth + newRemainingMonths;
            
            // 计算原始总利息
            const totalInterestOriginal = this.calculateTotalInterest(originalSchedule);
            
            // 计算新的总利息
            const totalInterestBeforePrepayment = this.calculateTotalInterestBeforeMonth(
                originalSchedule, 
                prepaymentMonth
            );
            
            const totalInterestAfterPrepayment = monthlyPayment * newRemainingMonths - remainingPrincipalAfterPrepayment;
            
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
            const monthlyPrincipal = originalSchedule[0].principal;
            
            // 提前还款相当于多少个月的本金
            const principalMonthsReduced = Math.floor(prepaymentAmount / monthlyPrincipal);
            
            // 计算新的总还款期限
            const newTotalMonths = this.totalMonths - principalMonthsReduced;
            
            // 计算原始总利息
            const totalInterestOriginal = this.calculateTotalInterest(originalSchedule);
            
            // 创建新的还款计划计算总利息
            const newSchedule = [];
            let newRemainingPrincipal = remainingPrincipalAfterPrepayment;
            
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
                originalSchedule, 
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
        
        // 选择合适的还款计划
        const originalSchedule = paymentType === 'equal-installment' 
            ? this.equalInstallmentSchedule 
            : this.equalPrincipalSchedule;
        
        // 如果提前还款月份超过总期数，返回null
        if (prepaymentMonth > this.totalMonths) {
            return null;
        }
        
        // 获取提前还款前的剩余本金
        const remainingPrincipalBeforePrepayment = originalSchedule[prepaymentMonth - 1].remainingPrincipal;
        
        // 如果提前还款金额大于剩余本金，则全部还清
        if (prepaymentAmount >= remainingPrincipalBeforePrepayment) {
            return {
                fullPayoff: true,
                originalMonthlyPayment: originalSchedule[0].payment,
                newMonthlyPayment: 0,
                paymentReduction: originalSchedule[0].payment,
                totalInterestOriginal: this.calculateTotalInterest(originalSchedule),
                totalInterestNew: this.calculateTotalInterestBeforeMonth(originalSchedule, prepaymentMonth),
                interestSaved: this.calculateTotalInterest(originalSchedule) - 
                               this.calculateTotalInterestBeforeMonth(originalSchedule, prepaymentMonth)
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
            
            const totalInterestAfterPrepayment = newMonthlyPayment * remainingMonths - remainingPrincipalAfterPrepayment;
            
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
            
            // 创建新的还款计划计算总利息
            const newSchedule = [];
            let newRemainingPrincipal = remainingPrincipalAfterPrepayment;
            
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
            
            // 计算新的总利息
            const totalInterestBeforePrepayment = this.calculateTotalInterestBeforeMonth(
                originalSchedule, 
                prepaymentMonth
            );
            
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
}

// 导出计算器类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MortgageCalculator;
} 