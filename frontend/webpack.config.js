// frontend/webpack.config.js
module.exports = {
  resolve: {
    fallback: {
      process: require.resolve('process/browser'),
    },
  },
};
