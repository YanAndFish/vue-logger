import { ComponentInternalInstance, ComponentOptions, ComponentPublicInstance, ConcreteComponent } from 'vue'

const classifyRE = /(?:^|[-_])(\w)/g
const classify = (str: string): string => str.replace(classifyRE, (c) => c.toUpperCase()).replace(/[-_]/g, '')

interface ClassComponent {
  new (...args: any[]): ComponentPublicInstance<any, any, any, any, any>
  __vccOpts: ComponentOptions
}

function getComponentName(Component: ConcreteComponent, includeInferred = true): string | false | undefined {
  return typeof Component === 'function'
    ? Component.displayName || Component.name
    : Component.name || (includeInferred && Component.__name)
}

export function formatComponentName(
  instance: ComponentInternalInstance | null,
  Component: ConcreteComponent,
  isRoot = false
): string {
  let name = getComponentName(Component)
  if (!name && Component.__file) {
    const match = Component.__file.match(/([^/\\]+)\.\w+$/)
    if (match) {
      name = match[1]
    }
  }

  if (!name && instance && instance.parent) {
    // try to infer the name based on reverse resolution
    const inferFromRegistry = (registry: Record<string, any> | undefined) => {
      for (const key in registry) {
        if (registry[key] === Component) {
          return key
        }
      }
    }
    name =
      inferFromRegistry((instance as any).components || (instance.parent.type as ComponentOptions).components) ||
      inferFromRegistry(instance.appContext.components)
  }

  return name ? classify(name) : isRoot ? `App` : `Anonymous`
}

export function isClassComponent(value: unknown): value is ClassComponent {
  return typeof value === 'function' && '__vccOpts' in value
}
