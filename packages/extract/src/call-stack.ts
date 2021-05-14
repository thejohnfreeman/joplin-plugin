export function identity<T>(x: T) {
  return x
}

export class CallStack {
  public constructor(private level = 0) {}

  public log(format: (...args: any[]) => any = identity): MethodDecorator {
    const self = this
    return (_prototype, _name, descriptor: PropertyDescriptor) => {
      const underlying = descriptor.value
      descriptor.value = function (...args: any[]) {
        console.log(' '.repeat(2 * self.level), format.apply(this, args))
        self.level += 1
        const value = underlying.apply(this, args)
        self.level -= 1
        return value
      }
    }
  }
}

export const CALL_STACK = new CallStack()
