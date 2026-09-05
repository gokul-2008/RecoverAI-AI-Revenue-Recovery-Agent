const fs = require('fs');
const path = require('path');
const { evaluate } = require('../scripts/evaluate');

class EvaluationController {
  /**
   * Get batch evaluation results
   */
  static getResults(req, res) {
    try {
      const dataDir = path.join(__dirname, '../../../data');
      const resultsCsvPath = path.join(dataDir, 'evaluation-results.csv');
      const sampleCsvPath = path.join(dataDir, 'sample-payments.csv');

      // If results don't exist yet, run the evaluation script
      if (!fs.existsSync(resultsCsvPath) || !fs.existsSync(sampleCsvPath)) {
        evaluate();
      }

      // Read summary results
      const resultsContent = fs.readFileSync(resultsCsvPath, 'utf-8');
      const resultsLines = resultsContent.split('\n').filter(line => line.trim().length > 0);
      
      const metrics = {};
      resultsLines.slice(1).forEach(line => {
        const [metric, value] = line.split(',');
        if (metric && value !== undefined) {
          metrics[metric.trim()] = isNaN(value) ? value.trim() : parseFloat(value.trim());
        }
      });

      // Read sample detailed cases (return first 50 for fast UI display)
      const sampleContent = fs.readFileSync(sampleCsvPath, 'utf-8');
      const sampleLines = sampleContent.split('\n').filter(line => line.trim().length > 0);
      
      const headers = sampleLines[0].split(',').map(h => h.replace(/^"|"$/g, ''));
      const sampleCases = [];

      sampleLines.slice(1, 51).forEach(line => {
        // Parse CSV row respecting quotes
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (matches && matches.length >= headers.length) {
          const row = {};
          headers.forEach((h, idx) => {
            let val = matches[idx] ? matches[idx].replace(/^"|"$/g, '') : '';
            if (!isNaN(val) && val !== '') val = Number(val);
            row[h] = val;
          });
          sampleCases.push(row);
        }
      });

      return res.status(200).json({
        metrics,
        sampleCases,
        totalCasesEvaluated: 500
      });
    } catch (err) {
      console.error('Error serving evaluation results:', err);
      return res.status(500).json({ error: 'Internal server error fetching evaluation results' });
    }
  }
}

module.exports = EvaluationController;
