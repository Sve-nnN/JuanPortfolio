// cucumber.js
module.exports = {
  default: {
    paths: ['features/**/*.feature'], // Where to find .feature files
    require:
      process.env.NODE_ENV === 'production'
        ? ['features/step-definitions/**/*.js', 'features/support/**/*.js']
        : ['features/step-definitions/**/*.ts', 'features/support/**/*.ts'], // Where to find step definitions
    requireModule: ['ts-node/register'], // Use ts-node to run TypeScript files
    format: [
      'summary',
      'progress-bar',
      'html:cucumber-report.html', // Generate HTML report
    ],
    publishQuiet: true,
  },
};
