const path = require('path');
var glob = require("glob");

const doAsync = async () => {

  const files = await glob.sync("src/projects/**/index.js", {})
  
  let projects = {};
  files.forEach(file => {
    const split = file.split('/')
    split.pop()
    projects[split.pop()] = './' + file
  });

  console.log({projects})

  return {
    entry: projects,
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    output: {
      path: path.resolve(__dirname, 'src/_includes/compiled'),
      filename: '[name].js'
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            // Creates `style` nodes from JS strings
            'style-loader',
            // Translates CSS into CommonJS
            'css-loader',
            // Compiles Sass to CSS
            'sass-loader',
          ],
        },
        {
          test: /\.(glsl|vs|fs|vert|frag)$/,
          exclude: /node_modules/,
          use: [
            'raw-loader',
            'glslify-loader'
          ]
        }
      ],
    },
    resolve: {
      extensions: [ '.tsx', '.ts', '.js' ],
    }
  };
};

module.exports = doAsync();
