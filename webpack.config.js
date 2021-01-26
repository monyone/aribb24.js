var path = require('path')

module.exports = {
  entry: path.resolve(__dirname, 'src', 'index.ts'),
  output: {
    filename: 'aribb24.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'aribb24js',
    libraryTarget: 'umd',
  },

  resolve: {
    extensions: ['.ts', '.js', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          { loader: 'babel-loader'},
          { loader: 'ts-loader' },
        ],
      }
    ]
  }
}
