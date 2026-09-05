const RecoveryCase = require('../models/case.model');
const AuditLog = require('../models/audit.model');
const Customer = require('../models/customer.model');
const { isEmbedded } = require('../config/db');
const { EmbeddedDB } = require('../config/embeddedDb');

class DashboardController {
  /**
   * Get dynamic stats for the dashboard
   */
  static async getStats(req, res) {
    try {
      const mode = req.query.mode || 'all';
      
      let cases = [];
      let recentAudits = [];

      if (isEmbedded()) {
        cases = EmbeddedDB.find('cases');
        if (mode !== 'all') {
          cases = cases.filter(c => c.mode === mode);
        }
        
        recentAudits = EmbeddedDB.find('audits')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 8);
      } else {
        const filter = mode !== 'all' ? { mode } : {};
        cases = await RecoveryCase.find(filter);
        recentAudits = await AuditLog.find().sort({ createdAt: -1 }).limit(8);
      }

      let revenueAtRisk = 0;
      let revenueRecovered = 0;
      let totalCasesCount = cases.length;
      let activeCasesCount = 0;
      let successfulRecoveriesCount = 0;
      let escalatedCasesCount = 0;
      let stoppedCasesCount = 0;

      const riskDistribution = { LOW: 0, MEDIUM: 0, HIGH: 0 };
      const rootCauseDistribution = {};

      cases.forEach(c => {
        revenueAtRisk += (c.amountAtRisk || 0);
        revenueRecovered += (c.recoveredAmount || 0);

        if (c.status === 'active') activeCasesCount++;
        else if (c.status === 'recovered') successfulRecoveriesCount++;
        else if (c.status === 'escalated') escalatedCasesCount++;
        else if (c.status === 'stopped') stoppedCasesCount++;

        if (c.riskLevel && riskDistribution[c.riskLevel] !== undefined) {
          riskDistribution[c.riskLevel]++;
        }
        if (c.rootCause) {
          rootCauseDistribution[c.rootCause] = (rootCauseDistribution[c.rootCause] || 0) + 1;
        }
      });

      const recoveryRate = revenueAtRisk > 0 ? (revenueRecovered / revenueAtRisk) * 100 : 0;

      // Populate recent cases with customer details
      let recentCases = [];
      if (isEmbedded()) {
        const sortedCases = [...cases].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);
        recentCases = sortedCases.map(c => {
          const cust = EmbeddedDB.findOne('customers', { _id: c.customerId });
          return {
            ...c,
            customerId: cust ? { name: cust.name, email: cust.email } : { name: 'Customer' }
          };
        });
      } else {
        const filter = mode !== 'all' ? { mode } : {};
        recentCases = await RecoveryCase.find(filter)
          .sort({ updatedAt: -1 })
          .limit(5)
          .populate('customerId', 'name email');
      }

      const trendData = DashboardController.getTrendDataFromCases(cases);

      return res.status(200).json({
        revenueAtRisk,
        revenueRecovered,
        recoveryRate: parseFloat(recoveryRate.toFixed(2)),
        totalCases: totalCasesCount,
        activeCases: activeCasesCount,
        successfulRecoveries: successfulRecoveriesCount,
        escalatedCases: escalatedCasesCount,
        stoppedCases: stoppedCasesCount,
        riskDistribution,
        rootCauseDistribution,
        recentCases,
        recentAudits,
        trendData
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      return res.status(500).json({ error: 'Internal server error fetching dashboard stats' });
    }
  }

  static getTrendDataFromCases(cases) {
    const dailyMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyMap[dateStr] = { date: dateStr, risk: 0, recovered: 0 };
    }

    cases.forEach(c => {
      const dateObj = c.createdAt ? new Date(c.createdAt) : new Date();
      const dateStr = dateObj.toISOString().split('T')[0];
      if (dailyMap[dateStr]) {
        dailyMap[dateStr].risk += (c.amountAtRisk || 0);
        dailyMap[dateStr].recovered += (c.recoveredAmount || 0);
      }
    });

    return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
  }
}

module.exports = DashboardController;
