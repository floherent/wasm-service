import { AppConfig, Config, loadConfig, DEFAULT_CONFIG } from './app.config';

describe('AppConfig', () => {
  describe('loadConfig', () => {
    it('should use default config', () => {
      const config: Config = loadConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });
  });

  describe('getInstance', () => {
    it('should return a singleton instance of AppConfig', () => {
      const instance1 = AppConfig.getInstance();
      const instance2 = AppConfig.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('printUsage', () => {
    it('should print usage in verbose mode', () => {
      const appConfig = AppConfig.getInstance();
      const spy = jest.spyOn(appConfig, 'printVerbose').mockImplementation();
      appConfig.printUsage();
      expect(spy).not.toHaveBeenCalled();

      appConfig.printUsage(true);
      expect(spy).toHaveBeenCalled();

      spy.mockRestore();
    });
  });
});
