export function uniqueId(): string {
  let _val = "";

  do {
    _val = Math.random()
      .toString(36)
      .slice(-8);
  } while (_val.length < 8);

  return _val;
}

/**
 *
 * @param length 字符串长度 @default 32
 * @param chars 字符集 @default  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
 */
export function randomString(length = 32, chars?: string): string {
  let result = "";
  chars =
    chars || "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  while (length > 0) {
    result += chars[Math.floor(Math.random() * chars.length)];
    --length;
  }

  return result;
}
