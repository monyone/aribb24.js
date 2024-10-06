interface AVLTreeNodeInterface<K, V> {
  get parent(): AVLTreeNodeInterface<K, V> | null;
  get balanced(): boolean;
  get bias(): number;
  refresh(): void;
  rotate(): void;
  has(key: K): boolean;
  get(key: K): V | undefined;
  floor(key: K): V | undefined;
  ceil(key: K): V | undefined;
  range(from: K, to: K): Iterable<V>;
  insert(key: K, value: V): void;
  delete(key: K): void;
  replace(from: AVLTreeNode<K, V>, to: AVLTreeNode<K, V> | null): void;
}

class AVLTreeDummyNode<K, V> implements AVLTreeNodeInterface<K, V> {
  private actual: AVLTreeNode<K, V> | null = null;
  private compare: (fst: K, snd: K) => -1 | 0 | 1;

  public constructor(compare: (fst: K, snd: K) => -1 | 0 | 1) {
    this.compare = compare;
  }

  public get parent(): AVLTreeNodeInterface<K, V> | null {
    return null;
  }

  public get balanced(): boolean {
    return this.actual?.balanced ?? true;
  }

  public get bias(): number {
    return this.actual?.bias ?? 0;
  }

  public toString(): string {
    return `${this.actual}`;
  }

  public refresh(): void {}
  public rotate(): void {}

  public has(key: K): boolean {
    return this.actual?.has(key) ?? false;
  }

  public get(key: K): V | undefined {
    return this.actual?.get(key) ?? undefined;
  }

  public floor(key: K): V | undefined {
    return this.actual?.floor(key) ?? undefined;
  }

  public ceil(key: K): V | undefined {
    return this.actual?.ceil(key) ?? undefined;
  }

  public *range(from: K, to: K): Iterable<V> {
    yield* this.actual?.range(from, to) ?? [];
  }

  public insert(key: K, value: V): void {
    if (this.actual == null) {
      this.actual = new AVLTreeNode(key, value, this, this.compare);
    } else {
      this.actual.insert(key, value);
    }
  }

  public delete(key: K): void {
    this.actual?.delete(key);
  }

  public replace(from: AVLTreeNode<K, V>, to: AVLTreeNode<K, V> | null): void {
    if (from == null) { return; }
    if (this.actual !== from) { return; }
    from.parent = null;
    this.actual = to;
    if (to == null) { return; }
    to.parent = this;
  }
}

class AVLTreeNode<K, V> implements AVLTreeNodeInterface<K, V> {
  public key: K;
  public value: V;

  public parent: AVLTreeNodeInterface<K, V> | null;

  private left: AVLTreeNode<K, V> | null = null;
  private right: AVLTreeNode<K, V> | null = null;
  private depth: number = 1;
  private compare: (fst: K, snd: K) => -1 | 0 | 1;

  public constructor(key: K, value: V, parent: AVLTreeNodeInterface<K, V>, compare: (fst: K, snd: K) => -1 | 0 | 1) {
    this.key = key;
    this.value = value;
    this.parent = parent;
    this.compare = compare;
  }

  public refresh(): void {
    this.depth = Math.max(this.left?.depth ?? 0, this.right?.depth ?? 0) + 1;
  }

  public get balanced(): boolean {
    const min = Math.min(this.left?.depth ?? 0, this.right?.depth ?? 0);
    const max = Math.max(this.left?.depth ?? 0, this.right?.depth ?? 0);
    return (max - min) <= 1;
  }

  public get bias(): number {
    return (this.left?.depth ?? 0) - (this.right?.depth ?? 0);
  }

  public toString(): string {
    if (this.left) { console.log(this.left.parent === this ? 'OK': `NG`); }
    if (this.right) { console.log(this.right.parent === this ? 'OK': 'NG'); }
    return `[${JSON.stringify(this.key)}:${JSON.stringify(this.value)}, [${this.left}, ${this.right}]]`;
  }

  public leftmost(): AVLTreeNode<K, V> {
    if (this.left == null) { return this; }
    return this.left.leftmost();
  }

  public rightmost(): AVLTreeNode<K, V> {
    if (this.right == null) { return this; }
    return this.right.rightmost();
  }

  private rotateL(): void {
    if (this.right == null) { return; }
    const parent = this.right;
    this.replace(parent, parent.left);
    parent.left = this;
    this.parent?.replace(this, parent);
    this.parent = parent;
    this.refresh();
    this.parent?.refresh();
  }

  private rotateR(): void {
    if (this.left == null) { return; }
    const parent = this.left;
    this.replace(parent, parent.right);
    parent.right = this;
    this.parent?.replace(this, parent);
    this.parent = parent;
    this.refresh();
    this.parent?.refresh();
  }

  private rotateLR(): void {
    if (this.left == null) { return; }
    this.left.rotateL();
    this.rotateR();
  }

  private rotateRL(): void {
    if (this.right == null) { return; }
    this.right.rotateR();
    this.rotateL();
  }

  public rotate(): void {
    if (this.bias === 2) {
      if ((this.left?.bias ?? 0) >= 0) {
        this.rotateR();
      } else {
        this.rotateLR();
      }
    } else if (this.bias === -2) {
      if ((this.right?.bias ?? 0) <= 0) {
        this.rotateL();
      } else {
        this.rotateRL();
      }
    }
  }

  private find(key: K, algorithm: 'exact' | 'floor' | 'ceil' = 'exact'): AVLTreeNode<K, V> | null {
    let node: AVLTreeNode<K, V> = this;

    FIND:
    while (true) {
      const compare = this.compare(key, node.key);
      switch (compare) {
        case 0:
          return node;
        case -1:
          if (node.left != null) {
            node = node.left;
            continue FIND;
          } else if (algorithm === 'ceil') {
            return node;
          }
          return null;
        case 1:
          if (node.right != null) {
            node = node.right;
            continue FIND;
          } else if (algorithm === 'floor') {
            return node;
          }
          return null;
        default:
          const exhaustive: never = compare;
          throw new Error(`Exhaustive check: ${exhaustive} reached!`);
      }
    }
  }

  public has(key: K): boolean {
    return this.find(key, 'exact') != null;
  }

  public get(key: K): V | undefined {
    return this.find(key, 'exact')?.value ?? undefined;
  }

  public floor(key: K): V | undefined {
    return this.find(key, 'floor')?.value ?? undefined;
  }

  public ceil(key: K): V | undefined {
    return this.find(key, 'ceil')?.value ?? undefined;
  }

  public *range(from: K, to: K): Iterable<V> {
    const f = this.compare(from, this.key);
    const t = this.compare(to, this.key);

    if (f <= 0) { yield* (this.left?.range(from, to) ?? []); }
    if (f <= 0 && t > 0){ yield this.value; }
    if (t > 0) { yield* (this.right?.range(from, to) ?? []); }
  }

  public insert(key: K, value: V): void {
    let node: AVLTreeNode<K, V> = this;

    // Insertion
    FIND:
    while (true) {
      const compare = this.compare(key, node.key);
      switch (compare) {
        case 0:
          node.value = value;
          return;
        case -1:
          if (node.left != null) {
            node = node.left;
            continue FIND;
          }
          node.left = new AVLTreeNode(key, value, node, this.compare);
          node = node.left;
          break FIND;
        case 1:
          if (node.right != null) {
            node = node.right;
            continue FIND;
          }
          node.right = new AVLTreeNode(key, value, node, this.compare);
          node = node.right;
          break FIND;
        default:
          const exhaustive: never = compare;
          throw new Error(`Exhaustive check: ${exhaustive} reached!`);
      }
    }

    // Rotation And Update Information
    for (let curr: (typeof node.parent) = node; curr != null; curr = curr.parent) {
      curr.rotate();
      curr.refresh();
    }
  }

  public delete(key: K): void {
    let node: AVLTreeNode<K, V> | null = this.find(key);
    if (node == null) { return; }

    // Deletion
    const rightmost = node.left?.rightmost();
    const leftmost = node.right?.leftmost();
    if (rightmost) {
      rightmost.parent?.replace(rightmost, null);
      node.parent?.replace(node, rightmost);
      rightmost.right = node.right;
      if (node.right != null) { node.right.parent = rightmost; }
      if (rightmost !== node.left) {
        rightmost.left = node.left;
        if (node.left != null) { node.left.parent = rightmost; }
      }
    } else if (leftmost) {
      leftmost.parent?.replace(leftmost, null);
      node.parent?.replace(node, leftmost);
      leftmost.left = node.left;
      if (node.left != null) { node.left.parent = leftmost; }
      if (leftmost !== node.right) {
        leftmost.right = node.right;
        if (node.right != null) { node.right.parent = leftmost; }
      }
    } else {
      node.parent?.replace(node, null);
    }

    // Rotation And Update Information
    for (let curr: (typeof node.parent) = node; curr != null; curr = curr.parent) {
      curr.rotate();
      curr.refresh();
    }
  }

  replace(from: AVLTreeNode<K, V>, to: AVLTreeNode<K, V> | null): void {
    if (this.left === from) {
      if (from.parent === this.left) { from.parent = null; }
      if (to != null) { to.parent = this; }
      this.left = to;
    }
    if (this.right === from) {
      if (from.parent === this.right) { from.parent = null; }
      if (to != null) { to.parent = this; }
      this.right = to;
    }
  }
}

export default class AVLTree<K, V>  {
  private root: AVLTreeNodeInterface<K, V>;
  private compare: (fst: K, snd: K) => -1 | 0 | 1;

  public constructor(compare: (fst: K, snd: K) => -1 | 0 | 1) {
    this.compare = compare;
    this.root = new AVLTreeDummyNode<K, V>(this.compare);
  }

  public clear() {
    this.root = new AVLTreeDummyNode<K, V>(this.compare);
  }

  public has(key: K): boolean {
    return this.root.has(key);
  }

  public get(key: K): V | undefined {
    return this.root.get(key);
  }

  public floor(key: K): V | undefined {
    return this.root.floor(key);
  }

  public ceil(key: K): V | undefined {
    return this.root.ceil(key);
  }

  public *range(from: K, to: K): Iterable<V> {
    yield* this.root.range(from, to);
  }

  public insert(key: K, value: V): void {
    this.root.insert(key, value);
  }

  public delete(key: K): void {
    this.root.delete(key);
  }

  public toString(): string {
    return `${this.root}`;
  }
}
