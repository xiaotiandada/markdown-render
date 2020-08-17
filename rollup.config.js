import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/main.js',
  output: [{
      file: 'dist/markdown-render-js.js',
      format: 'es',
    },
    {
      file: 'dist/markdown-render-js.min.js',
      format: 'es',
      plugins: [terser()],
    }
  ],
  external: ['jquery'],
  plugins: [
    json(),
    resolve({
      customResolveOptions: {
        moduleDirectory: 'node_modules'
      }
    }),
    commonjs(),
    babel({
      babelHelpers: 'bundled'
    }),
  ],
  // https://stackoverflow.com/questions/61827807/svelte-i18n-svelte-rollup-compiler-warning-this-has-been-rewritten-to-unde
  moduleContext: (id) => {
    // In order to match native module behaviour, Rollup sets `this`
    // as `undefined` at the top level of modules. Rollup also outputs
    // a warning if a module tries to access `this` at the top level.
    // The following modules use `this` at the top level and expect it
    // to be the global `window` object, so we tell Rollup to set
    // `this = window` for these modules.
    const thisAsWindowForModules = [
      'node_modules/pdfobject/pdfobject.js'
    ];

    if (thisAsWindowForModules.some(id_ => id.trimRight().endsWith(id_))) {
      return 'window';
    }
  }
};