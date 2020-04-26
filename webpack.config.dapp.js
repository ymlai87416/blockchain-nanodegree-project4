const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: ['babel-polyfill', path.join(__dirname, "src/dapp")],
  output: {
    path: path.join(__dirname, "prod/dapp"),
    filename: "bundle.js"
  },
  module: {
    rules: [
    {
        test: /\.(js|jsx)$/,
        use: "babel-loader",
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          'file-loader'
        ]
      },
      {
        test: /\.html$/,
        use: "html-loader",
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({ 
      template: path.join(__dirname, "src/dapp/index.html")
    }),
    new HtmlWebpackPlugin({ 
      filename: 'fundAirline.html',
      template: path.join(__dirname, "src/dapp/fundAirline.html")
    }),
    new HtmlWebpackPlugin({ 
      filename: 'regAirline.html',
      template: path.join(__dirname, "src/dapp/regAirline.html")
    }),
    new HtmlWebpackPlugin({ 
      filename: 'buyInsurance.html',
      template: path.join(__dirname, "src/dapp/buyInsurance.html")
    }),
    new HtmlWebpackPlugin({ 
      filename: 'flightStatus.html',
      template: path.join(__dirname, "src/dapp/flightStatus.html")
    }),
    new HtmlWebpackPlugin({ 
      filename: 'withdraw.html',
      template: path.join(__dirname, "src/dapp/withdraw.html")
    }),
  ],
  resolve: {
    extensions: [".js"]
  },
  devServer: {
    contentBase: path.join(__dirname, "dapp"),
    port: 8000,
    stats: "minimal"
  }
};
