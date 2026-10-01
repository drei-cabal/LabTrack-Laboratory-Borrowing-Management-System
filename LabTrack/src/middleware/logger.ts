export class AppLogger {
  static info(tag: string, message: string, data?: any) {
    const time = new Date().toISOString();
    if (data !== undefined) {
      console.log(`[INFO] [${time}] [${tag}]: ${message}`, data);
    } else {
      console.log(`[INFO] [${time}] [${tag}]: ${message}`);
    }
  }

  static warn(tag: string, message: string, data?: any) {
    const time = new Date().toISOString();
    console.warn(`[WARN] [${time}] [${tag}]: ${message}`, data ?? '');
  }

  static error(tag: string, message: string, error?: any) {
    const time = new Date().toISOString();
    console.error(`[ERROR] [${time}] [${tag}]: ${message}`, error ?? '');
  }
}
