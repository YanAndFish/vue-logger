import { ComponentInternalInstance, getCurrentInstance } from 'vue'
import { Data } from './typing'
import { formatTrace, getComponentStack } from './trace'

type BaseLevel = 'debug' | 'log' | 'warn' | 'error'

type LoggerLevel<T extends string> = T | `>=${T}` | (T | `>=${T}`)[]

type Tags<T extends string> = T | 'default'

/** 日志等级选项 */
interface LevelOption {
  /** 日志优先级，大值数字拥有更高优先级 */
  priority: number
  /** 是否继承`warn`等级的行为与属性 */
  extendsWarn?: boolean
  /** 是否继承`error`等级的行为与属性 */
  extendsError?: boolean
}

type LevelOptions<Key extends string = string> = {
  [K in Key]: LevelOption
}

export type HookHandler<T extends string = string, M extends object = Data> = (
  messages: any[],
  tag: T,
  meta: M
) => void | false

/** logger选项 */
export interface LoggerOption<L = LevelOptions, M extends object = object, T extends string = string> {
  /**
   * 自定义的控制台示例
   * @default globalThis 的控制台实例
   */
  console?: Console
  /**
   * 自定义日志等级
   *
   * `debug`、`log`、`warn`、`error`为内置日志等级，不可覆盖；日志等级的优先级由数字表示，数字越大优先级越高
   *
   * 内置日志等级的优先级为：
   * - `debug`：`100`
   * - `log`：`200`
   * - `warn`：`300`
   * - `error`：`400`
   *
   */
  customLevel?: L
  /**
   * 是否显示日志等级
   * @default true
   */
  showLevel?: boolean
  /**
   * 是否显示日志标签
   * @default false
   */
  showTag?: boolean
  /**
   * 日志前缀，如果显示日志等级则在日志等级之后打印
   */
  prefix?: string | (() => string)
  /**
   * 在日志打印前调用的钩子，可以返回`false`拒绝打印
   */
  beforePrint?: HookHandler<Tags<T>, M> | HookHandler<Tags<T>, M>[]
  /** logger元数据 */
  meta?: M
  /** 标签定义 */
  tags?: T[]
  /** 日志打印拒绝规则 */
  rejections?: LoggerLevel<(keyof L & string) | BaseLevel>
}

interface Logger {
  log(...messages: any[]): void
  warn(...messages: any[]): void
  error(...messages: any[]): void
}

export function createLogger<L extends Readonly<LevelOptions>, M extends object, T extends string>(
  option: LoggerOption<L, M, T>
) {
  // TODO
  return (instance?: ComponentInternalInstance): Logger => {
    const _instance = instance || getCurrentInstance()

    return {
      log(...message: any[]) {
        const messages: any[] = [...message]

        if (_instance) {
          const trace = getComponentStack(_instance)
          messages.push('\n', ...formatTrace(trace))
        }
        console.trace(...messages)
      },
      warn(...message) {
        const messages: any[] = [...message]
        if (_instance) {
          const trace = getComponentStack(_instance)
          messages.push('\n', ...formatTrace(trace))
        }
        console.warn(...messages)
      },
      error(...message) {
        const messages: any[] = [...message]
        if (_instance) {
          const trace = getComponentStack(_instance)
          messages.push('\n', ...formatTrace(trace))
        }
        console.error(...messages)
      },
    }
  }
}
