export class EOFError extends Error {
  constructor(message: string, option?: ErrorOptions) {
    super(message, option);
    this.name = this.constructor.name;
  }
}

export class NotImplementedError extends Error {
  constructor(message: string, option?: ErrorOptions) {
    super(message, option);
    this.name = this.constructor.name;
  }
}

export class UnreachableError extends Error {
  constructor(message: string, option?: ErrorOptions) {
    super(message, option);
    this.name = this.constructor.name;
  }
}
