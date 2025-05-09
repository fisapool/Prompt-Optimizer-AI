import { IndustryPlugin, PluginConfig } from './types';
import { SoftwareDevPlugin } from './softwareDevPlugin';

export class PluginManager {
  private static instance: PluginManager;
  private plugins: Map<string, IndustryPlugin> = new Map();
  private configs: Map<string, PluginConfig> = new Map();

  private constructor() {
    this.registerDefaultPlugins();
  }

  public static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  private registerDefaultPlugins(): void {
    // Register the software development plugin
    const softwareDevPlugin = new SoftwareDevPlugin();
    this.registerPlugin(softwareDevPlugin);
  }

  public registerPlugin(plugin: IndustryPlugin): void {
    this.plugins.set(plugin.industry, plugin);
  }

  public getPlugin(industry: string): IndustryPlugin | undefined {
    return this.plugins.get(industry);
  }

  public getAvailableIndustries(): string[] {
    return Array.from(this.plugins.keys());
  }

  public getSubIndustries(industry: string): string[] {
    const plugin = this.plugins.get(industry);
    return plugin?.subIndustries || [];
  }

  public configurePlugin(config: PluginConfig): void {
    this.configs.set(config.industry, config);
  }

  public getPluginConfig(industry: string): PluginConfig | undefined {
    return this.configs.get(industry);
  }

  public isPluginEnabled(industry: string): boolean {
    const config = this.configs.get(industry);
    return config?.enabled ?? true;
  }

  public getEnabledPlugins(): IndustryPlugin[] {
    return Array.from(this.plugins.values()).filter(plugin => 
      this.isPluginEnabled(plugin.industry)
    );
  }
} 