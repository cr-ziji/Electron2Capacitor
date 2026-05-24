import { E2CPlugin, E2CConfig } from '../../types';

export async function loadPlugins(config: E2CConfig): Promise<E2CPlugin[]> {
  const plugins: E2CPlugin[] = [];

  if (config.plugins) {
    for (const plugin of config.plugins) {
      if (plugin.enabled !== false) {
        plugins.push(plugin);
      }
    }
  }

  if (config.nodejs?.engine) {
    plugins.push(config.nodejs.engine);
  }

  if (config.nodejs?.packages) {
    for (const pkg of Object.values(config.nodejs.packages)) {
      if (pkg.enabled !== false) {
        plugins.push(pkg);
      }
    }
  }

  if (config.content?.AST) {
    for (const contentPlugin of config.content.AST) {
      if (contentPlugin.enabled !== false) {
        plugins.push(contentPlugin);
      }
    }
  }

  return plugins;
}

export function mergePluginConfigs(plugins: E2CPlugin[]): E2CPlugin[] {
  const merged: E2CPlugin[] = [];
  const seen = new Map<string, E2CPlugin>();

  for (const plugin of plugins) {
    if (seen.has(plugin.name)) {
      const existing = seen.get(plugin.name)!;
      merged.splice(merged.indexOf(existing), 1);
      const mergedPlugin = { ...existing, ...plugin };
      seen.set(plugin.name, mergedPlugin);
      merged.push(mergedPlugin);
    } else {
      seen.set(plugin.name, plugin);
      merged.push(plugin);
    }
  }

  return merged;
}
