/*
 * @Date: 2020-09-14 00:37:15
 * @LastEditors: skyblue
 * @LastEditTime: 2020-09-14 00:41:36
 * @repository: https://github.com/SkyBlueFeet
 */

declare module '*.jsonc' {
  const content: JSON
  export default content
}

declare module '*.json5' {
  const content: JSON
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.ejs' {
  type ejs = (
    data?: Record<string, unknown> | Array<unknown> | unknown
  ) => string
  const Ejs: ejs
  export default Ejs
}
