import { isRef, pauseTracking, resetTracking, toRaw } from '@vue/reactivity'
import { ComponentInternalInstance, ConcreteComponent, VNode } from 'vue'
import { formatComponentName } from './component'
import { Data } from './typing'

type ComponentVNode = VNode & {
  type: ConcreteComponent
}

type TraceEntry = {
  vnode: ComponentVNode
  recurseCount: number
}

type ComponentTraceStack = TraceEntry[]

export function getComponentStack(instance: ComponentInternalInstance) {
  pauseTracking()
  const trace = getComponentTrace(instance)
  resetTracking()
  return trace
}

function getComponentTrace(instance: ComponentInternalInstance): ComponentTraceStack {
  let currentVNode: VNode | null = instance.vnode

  const normalizedStack: ComponentTraceStack = []

  while (currentVNode) {
    const last = normalizedStack[0]
    if (last && last.vnode === currentVNode) {
      last.recurseCount++
    } else {
      normalizedStack.push({
        vnode: currentVNode as ComponentVNode,
        recurseCount: 0,
      })
    }
    const parentInstance: ComponentInternalInstance | null = currentVNode.component && currentVNode.component.parent
    currentVNode = parentInstance && parentInstance.vnode
  }

  return normalizedStack
}

export function formatTrace(trace: ComponentTraceStack): any[] {
  const logs: any[] = []
  trace.forEach((entry, i) => {
    logs.push(...(i === 0 ? [] : [`\n`]), ...formatTraceEntry(entry))
  })
  return logs
}

function formatTraceEntry({ vnode, recurseCount }: TraceEntry): any[] {
  const postfix = recurseCount > 0 ? `... (${recurseCount} recursive calls)` : ``
  const isRoot = vnode.component ? vnode.component.parent == null : false
  const open = ` at <${formatComponentName(vnode.component, vnode.type, isRoot)}`
  const close = `>` + postfix
  return vnode.props ? [open, ...formatProps(vnode.props), close] : [open + close]
}

function formatProps(props: Data): any[] {
  const res: any[] = []
  const keys = Object.keys(props)
  keys.slice(0, 3).forEach((key) => {
    res.push(...formatProp(key, props[key]))
  })
  if (keys.length > 3) {
    res.push(` ...`)
  }
  return res
}

function formatProp(key: string, value: unknown): any[]
function formatProp(key: string, value: unknown, raw: true): any
/* istanbul ignore next */
function formatProp(key: string, value: unknown, raw?: boolean): any {
  if (typeof value === 'string') {
    value = JSON.stringify(value)
    return raw ? value : [`${key}=${value}`]
  } else if (typeof value === 'number' || typeof value === 'boolean' || value == null) {
    return raw ? value : [`${key}=${value}`]
  } else if (isRef(value)) {
    value = formatProp(key, toRaw(value.value), true)
    return raw ? value : [`${key}=Ref<`, value, `>`]
  } else if (typeof value === 'function') {
    return [`${key}=fn${value.name ? `<${value.name}>` : ``}`]
  } else {
    value = toRaw(value)
    return raw ? value : [`${key}=`, value]
  }
}
