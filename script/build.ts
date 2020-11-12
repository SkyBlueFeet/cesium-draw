/*
 * @author: SkyBlue
 * @LastEditors: SkyBlue
 * @Date: 2020-10-06 19:13:41
 * @LastEditTime: 2020-10-07 00:25:26
 * @Gitee: https://gitee.com/skybluefeet
 * @Github: https://github.com/SkyBlueFeet
 */
import { rollup, RollupBuild } from 'rollup'

import ora from 'ora'
import chalk from 'chalk'

process.env.NODE_ENV = 'production'

const spinner = ora('building for production...')
spinner.start()

async function build(): Promise<void> {
  const conf = (await import('./config')).default
  // 处理不必要的警告
  conf.onwarn = (warning): void => {
    // 跳过某些警告
    // if (warning.code === "INPUT_HOOK_IN_OUTPUT_PLUGIN") return;

    // 抛出异常
    // if (warning.code === "NON_EXISTENT_EXPORT")
    //     throw new Error(warning.message);
    console.warn(warning)
  }

  // https://juejin.im/post/5c49eb28f265da613a545a4b
  // function awaitWrap<T, U = any>(
  //     promise: Promise<T>
  // ): Promise<[U | null, T | null]> {
  //     return promise
  //         .then<[null, T]>((data: T) => [null, data])
  //         .catch<[U, null]>(err => [err, null]);
  // }
  const bundle: RollupBuild = await rollup(conf)

  if (!Array.isArray(conf.output)) conf.output = [conf.output]

  conf.output.map(outputOption => bundle.generate(outputOption))

  // for (const chunkOrAsset of output) {
  //     if (chunkOrAsset.type === "asset") {
  // For assets, this contains
  // {
  //   fileName: string,              // the asset file name
  //   source: string | Buffer        // the asset source
  //   type: 'asset'                  // signifies that this is an asset
  // }
  // console.log("Asset", chunkOrAsset);
  //     } else {
  // For chunks, this contains
  // {
  //   code: string,                  // the generated JS code
  //   dynamicImports: string[],      // external modules imported dynamically by the chunk
  //   exports: string[],             // exported variable names
  //   facadeModuleId: string | null, // the id of a module that this chunk corresponds to
  //   fileName: string,              // the chunk file name
  //   imports: string[],             // external modules imported statically by the chunk
  //   isDynamicEntry: boolean,       // is this chunk a dynamic entry point
  //   isEntry: boolean,              // is this chunk a static entry point
  //   map: string | null,            // sourcemaps if present
  //   modules: {                     // information about the modules in this chunk
  //     [id: string]: {
  //       renderedExports: string[]; // exported variable names that were included
  //       removedExports: string[];  // exported variable names that were removed
  //       renderedLength: number;    // the length of the remaining code in this module
  //       originalLength: number;    // the original length of the code in this module
  //     };
  //   },
  //   name: string                   // the name of this chunk as used in naming patterns
  //   type: 'chunk',                 // signifies that this is a chunk
  // }
  // console.log("Chunk", chunkOrAsset.modules);
  //     }
  // }

  // or write the bundle to disk

  conf.output.forEach(item => {
    bundle.write(item)
  })
}
build()
  .then(() => {
    spinner.stop()
    console.log(chalk.cyan('  Build complete.\n'))
    console.log(chalk.green('   The list below is the size of each package\n'))
  })
  .catch(err => {
    spinner.stop()
    console.log(chalk.red(`\n ${err}`))
  })
