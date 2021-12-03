var path = require('path')

module.exports = {
  entry: {
    "aribb24": {
      import: path.resolve(__dirname, 'src', 'index.ts')
    },
    "aribb24-embedded": {
      import: path.resolve(__dirname, 'src', 'embedded.ts')
    }
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    library: 'aribb24js',
    libraryTarget: 'umd',
  },

  resolve: {
    extensions: ['.ts', '.js', '.json']
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
