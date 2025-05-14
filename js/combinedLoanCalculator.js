/**
 * 组合贷款计算器类
 */
class CombinedLoanCalculator {
    /**
     * 构造函数
     * @param {number} pfAmount - 公积金贷款金额(万元)
     * @param {number} pfRate - 公积金年利率(%)
     * @param {number} pfTerm - 公积金贷款期限(年)
     * @param {number} commAmount - 商业贷款金额(万元)
     * @param {number} commRate - 商业贷款年利率(%)
     * @param {number} commTerm - 商业贷款期限(年)
     * @param {string} repaymentMethod - 还款方式('equal_installment' 或 'equal_principal')
     */
    constructor(pfAmount, pfRate, pfTerm, commAmount, commRate, commTerm, repaymentMethod) {
        // 初始化参数
        this.pfAmount = pfAmount * 10000; // 转换为元
        this.pfMonthlyRate = pfRate / 100 / 12; // 公积金月利率
        this.pfTotalMonths = pfTerm * 12; // 公积金总期数

        this.commAmount = commAmount * 10000; // 转换为元
        this.commMonthlyRate = commRate / 100 / 12; // 商业贷款月利率
        this.commTotalMonths = commTerm * 12; // 商业贷款总期数

        this.repaymentMethod = repaymentMethod;
        
        // 计算总贷款金额
        this.totalLoanAmount = this.pfAmount + this.commAmount;
        
        // 计算最长贷款期限
        this.maxTotalMonths = Math.max(this.pfTotalMonths, this.commTotalMonths);
        
        // 计算还款计划
        if (repaymentMethod === 'equal_installment') {
            this.pfSchedule = this.calculateEqualInstallmentSchedule(
                this.pfAmount, this.pfMonthlyRate, this.pfTotalMonths
            );
            this.commSchedule = this.calculateEqualInstallmentSchedule(
                this.commAmount, this.commMonthlyRate, this.commTotalMonths
            );
        } else {
            this.pfSchedule = this.calculateEqualPrincipalSchedule(
                this.pfAmount, this.pfMonthlyRate, this.pfTotalMonths
            );
            this.commSchedule = this.calculateEqualPrincipalSchedule(
                this.commAmount, this.commMonthlyRate, this.commTotalMonths
            );
        }
        
        // 计算组合还款计划
        this.combinedSchedule = this.calculateCombinedSchedule();
    }
    
    /**
     * 计算等额本息还款计划
     * @param {number} loanAmount - 贷款金额(元)
     * @param {number} monthlyRate - 月利率
     * @param {number} totalMonths - 总期数
     * @returns {Array} 还款计划数组
     */
    calculateEqualInstallmentSchedule(loanAmount, monthlyRate, totalMonths) {
        const schedule = [];
        
        // 计算月供
        const monthlyPayment = this.calculateMonthlyPayment(loanAmount, monthlyRate, totalMonths);
        
        let remainingPrincipal = loanAmount;
        
        for (let month = 1; month <= totalMonths; month++) {
            // 计算利息
            const interest = remainingPrincipal * monthlyRate;
            
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
     * @param {number} loanAmount - 贷款金额(元)
     * @param {number} monthlyRate - 月利率
     * @param {number} totalMonths - 总期数
     * @returns {Array} 还款计划数组
     */
    calculateEqualPrincipalSchedule(loanAmount, monthlyRate, totalMonths) {
        const schedule = [];
        
        // 计算每月本金
        const monthlyPrincipal = loanAmount / totalMonths;
        
        let remainingPrincipal = loanAmount;
        
        for (let month = 1; month <= totalMonths; month++) {
            // 计算利息
            const interest = remainingPrincipal * monthlyRate;
            
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
     * @param {number} loanAmount - 贷款金额(元)
     * @param {number} monthlyRate - 月利率
     * @param {number} totalMonths - 总期数
     * @returns {number} 月供金额
     */
    calculateMonthlyPayment(loanAmount, monthlyRate, totalMonths) {
        if (monthlyRate === 0) {
            return loanAmount / totalMonths;
        }
        
        return loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) 
               / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }
    
    /**
     * 计算组合还款计划
     * @returns {Array} 组合还款计划数组
     */
    calculateCombinedSchedule() {
        const combinedSchedule = [];
        
        for (let month = 1; month <= this.maxTotalMonths; month++) {
            const pfData = month <= this.pfTotalMonths ? this.pfSchedule[month - 1] : null;
            const commData = month <= this.commTotalMonths ? this.commSchedule[month - 1] : null;
            
            const pfPayment = pfData ? pfData.payment : 0;
            const pfPrincipal = pfData ? pfData.principal : 0;
            const pfInterest = pfData ? pfData.interest : 0;
            const pfRemainingPrincipal = pfData ? pfData.remainingPrincipal : 0;
            
            const commPayment = commData ? commData.payment : 0;
            const commPrincipal = commData ? commData.principal : 0;
            const commInterest = commData ? commData.interest : 0;
            const commRemainingPrincipal = commData ? commData.remainingPrincipal : 0;
            
            // 添加到组合还款计划
            combinedSchedule.push({
                month,
                pfPayment,
                pfPrincipal,
                pfInterest,
                pfRemainingPrincipal,
                commPayment,
                commPrincipal,
                commInterest,
                commRemainingPrincipal,
                totalPayment: pfPayment + commPayment
            });
        }
        
        return combinedSchedule;
    }
    
    /**
     * 获取公积金贷款摘要
     * @returns {Object} 摘要对象
     */
    getProvidentFundSummary() {
        if (this.repaymentMethod === 'equal_installment') {
            const monthlyPayment = this.pfSchedule[0].payment;
            const totalPayment = monthlyPayment * this.pfTotalMonths;
            const totalInterest = totalPayment - this.pfAmount;
            
            return {
                monthlyPayment,
                totalPayment,
                totalInterest,
                loanAmount: this.pfAmount
            };
        } else {
            const firstMonthPayment = this.pfSchedule[0].payment;
            const lastMonthPayment = this.pfSchedule[this.pfTotalMonths - 1].payment;
            
            const totalPayment = this.pfSchedule.reduce((sum, item) => sum + item.payment, 0);
            const totalInterest = totalPayment - this.pfAmount;
            
            return {
                firstMonthPayment,
                lastMonthPayment,
                totalPayment,
                totalInterest,
                loanAmount: this.pfAmount
            };
        }
    }
    
    /**
     * 获取商业贷款摘要
     * @returns {Object} 摘要对象
     */
    getCommercialSummary() {
        if (this.repaymentMethod === 'equal_installment') {
            const monthlyPayment = this.commSchedule[0].payment;
            const totalPayment = monthlyPayment * this.commTotalMonths;
            const totalInterest = totalPayment - this.commAmount;
            
            return {
                monthlyPayment,
                totalPayment,
                totalInterest,
                loanAmount: this.commAmount
            };
        } else {
            const firstMonthPayment = this.commSchedule[0].payment;
            const lastMonthPayment = this.commSchedule[this.commTotalMonths - 1].payment;
            
            const totalPayment = this.commSchedule.reduce((sum, item) => sum + item.payment, 0);
            const totalInterest = totalPayment - this.commAmount;
            
            return {
                firstMonthPayment,
                lastMonthPayment,
                totalPayment,
                totalInterest,
                loanAmount: this.commAmount
            };
        }
    }
    
    /**
     * 获取组合贷款摘要
     * @returns {Object} 摘要对象
     */
    getCombinedSummary() {
        const pfSummary = this.getProvidentFundSummary();
        const commSummary = this.getCommercialSummary();
        
        // 计算首月总月供
        let firstMonthTotalPayment = 0;
        if (this.repaymentMethod === 'equal_installment') {
            firstMonthTotalPayment = (pfSummary.monthlyPayment || 0) + (commSummary.monthlyPayment || 0);
        } else {
            firstMonthTotalPayment = (pfSummary.firstMonthPayment || 0) + (commSummary.firstMonthPayment || 0);
        }
        
        return {
            firstMonthTotalPayment,
            totalInterest: pfSummary.totalInterest + commSummary.totalInterest,
            totalPayment: pfSummary.totalPayment + commSummary.totalPayment,
            totalLoanAmount: this.totalLoanAmount
        };
    }
} 