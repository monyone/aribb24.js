import { Event } from './events'

export default class EventEmitter {
  private listeners = new Map<keyof Event, ((payload: unknown) => void)[]>();

  public on<T extends keyof Event>(type: T, handler: ((payload: Event[T]) => void)): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(handler as ((payload: unknown) => void));
  }

  public off<T extends keyof Event>(type: T, handler: ((payload: Event[T]) => void)): void {
    if (!this.listeners.has(type)) { return; }
    this.listeners.set(type, this.listeners.get(type)!.filter((elem) => elem !== handler));
  }

  public emit<T extends keyof Event>(type: T, payload: Event[T]) {
    (this.listeners.get(type) ?? []).forEach((func) => { func(payload); });
  }
};
