export default class EOFError extends Error {
  constructor(message: string, option?: ErrorOptions) {
    super(message, option);
    this.name = this.constructor.name;
  }
}
