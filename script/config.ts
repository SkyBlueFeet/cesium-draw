/*
 * @author: SkyBlue
 * @LastEditors: SkyBlue
 * @Date: 2020-10-06 19:13:41
 * @LastEditTime: 2020-10-07 00:54:40
 * @Gitee: https://gitee.com/skybluefeet
 * @Github: https://github.com/SkyBlueFeet
 */
import BabelPlugin from '@rollup/plugin-babel'
import NodeResolve from '@rollup/plugin-node-resolve'
import CommonJS from '@rollup/plugin-commonjs'
import { DEFAULT_EXTENSIONS } from '@babel/core'
import filesize from 'rollup-plugin-filesize'
import { eslint } from 'rollup-plugin-eslint'
import { RollupOptions, OutputOptions, ModuleFormat } from 'rollup'

import Typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'

import {
  name as $name,
  version as $version,
  author as $author
} from '../package.json'

const $entry: string | string[] = 'bin/index.ts'
const $outDir = 'dist'
const $useEslint = true
const $eslintFeild = ['.js', '.jsx', '.tsx', '.ts', '.vue']
const $extensions = ['.vue', 'js', '.ts', '.tsx', '.jsx', '.json']
const $babelTransformFeild = ['.ts', '.tsx', '.vue', ...DEFAULT_EXTENSIONS]

const $format: ModuleFormat[] = ['cjs', 'iife', 'esm']

const $preSetExternal = {
  cesium: 'Cesium'
}

const rollupConfig: RollupOptions = {
  input: $entry,
  output: $format.map<OutputOptions>(format => ({
    name: 'CesiumDraw',
    file: `${$outDir}/${$name}.${format}.min.js`,
    format,
    banner:
      `${'/*!\n' + ' * '} ${$name}.${format}.js v${$version}\n` +
      ` * (c) 2019-${new Date().getFullYear()} ${$author}\n` +
      ` * Released under the MIT License.\n` +
      ` */`,
    globals: $preSetExternal
  })),
  inlineDynamicImports: true,
  plugins: [
    Typescript(),
    BabelPlugin({
      extensions: $babelTransformFeild,
      babelHelpers: 'bundled'
    }),

    // 载入CommonJS模块

    NodeResolve({
      extensions: $extensions
    }),
    CommonJS(),
    // VuePlugin({
    //   normalizer: '~vue-runtime-helpers/dist/normalize-component.js',
    //   css: false,
    // }),
    terser({
      include: [/^.+\.min\.js$/],
      exclude: ['some*'],
      ecma: 5,
      keep_classnames: true,
      keep_fnames: true,
      output: {
        comments: 'some'
      }
    }),

    filesize()
  ],
  external: Object.keys($preSetExternal)
}

if ($useEslint) {
  rollupConfig.plugins.push(
    eslint({
      fix: true,
      include: $eslintFeild.map(ext => new RegExp(`/\\${ext}$/`))
    })
  )
}

export default rollupConfig
