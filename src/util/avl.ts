import { ExhaustivenessError, UnreachableError } from "./error";

interface AVLTreeNodeInterface<K, V, O> {
  get parent(): AVLTreeNodeInterface<K, V, O> | null;
  get balanced(): boolean;
  get bias(): number;
  refresh(): void;
  rotate(): void;
  has(key: K): boolean;
  get(key: K): V | undefined;
  floor(key: K): V | undefined;
  ceil(key: K): V | undefined;
  insert(key: K, value: V): void;
  delete(key: K): void;
  replace(from: AVLTreeNode<K, V, O>, to: AVLTreeNode<K, V, O> | null): void;
  forEach(func: (value: V) => void): void;
  range(from: O, to: O): Generator<V>;
}

class AVLTreeDummyNode<K, V, O = K> implements AVLTreeNodeInterface<K, V, O> {
  private actual: AVLTreeNode<K, V, O> | null = null;
  private compareKey: (fst: K, snd: K) => -1 | 0 | 1;
  private compareOrder: (fst: O, snd: O) => -1 | 0 | 1;
  private calculateOrder: (key: K) => O;

  public constructor(compareKey: (fst: K, snd: K) => -1 | 0 | 1, compareOrder: (fst: O, snd: O) => -1 | 0 | 1, calculateOrder: (key: K) => O) {
    this.compareKey = compareKey;
    this.compareOrder = compareOrder;
    this.calculateOrder = calculateOrder;
  }

  public get parent(): AVLTreeNodeInterface<K, V, O> | null {
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

  public insert(key: K, value: V): void {
    if (this.actual == null) {
      this.actual = new AVLTreeNode(key, value, this, this.compareKey, this.compareOrder, this.calculateOrder);
    } else {
      this.actual.insert(key, value);
    }
  }

  public delete(key: K): void {
    this.actual?.delete(key);
  }

  public replace(from: AVLTreeNode<K, V, O>, to: AVLTreeNode<K, V, O> | null): void {
    if (from == null) { return; }
    if (this.actual !== from) { return; }
    from.parent = null;
    this.actual = to;
    if (to == null) { return; }
    to.parent = this;
  }

  public forEach(func: (value: V) => void): void {
    this.actual?.forEach(func);
  }

  public *range(from: O, to: O): Generator<V> {
    yield* this.actual?.range(from, to) ?? [];
  }
}

class AVLTreeNode<K, V, O = K> implements AVLTreeNodeInterface<K, V, O> {
  public key: K;
  public value: V;
  public order: O;

  public parent: AVLTreeNodeInterface<K, V, O> | null;

  private left: AVLTreeNode<K, V, O> | null = null;
  private right: AVLTreeNode<K, V, O> | null = null;
  private depth: number = 1;
  private compareKey: (fst: K, snd: K) => -1 | 0 | 1;
  private compareOrder: (fst: O, snd: O) => -1 | 0 | 1;
  private calculateOrder: (key: K) => O;

  public constructor(key: K, value: V, parent: AVLTreeNodeInterface<K, V, O>, compareKey: (fst: K, snd: K) => -1 | 0 | 1, compareOrder: (fst: O, snd: O) => -1 | 0 | 1, calculateOrder: (key: K) => O) {
    this.key = key;
    this.value = value;
    this.parent = parent;
    this.compareKey = compareKey;
    this.compareOrder = compareOrder;
    this.calculateOrder = calculateOrder;
    this.order = this.calculateOrder(this.key);
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

  public leftmost(): AVLTreeNode<K, V, O> {
    if (this.left == null) { return this; }
    return this.left.leftmost();
  }

  public rightmost(): AVLTreeNode<K, V, O> {
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

  private find(key: K, algorithm: 'exact' | 'floor' | 'ceil' = 'exact'): AVLTreeNode<K, V, O> | null {
    let node: AVLTreeNode<K, V, O> = this;

    FIND:
    while (true) {
      const compare = this.compareKey(key, node.key);
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
          throw new ExhaustivenessError(compare, `Exhaustive check reached!`);
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

  public insert(key: K, value: V): void {
    let node: AVLTreeNode<K, V, O> = this;

    // Insertion
    FIND:
    while (true) {
      const compare = this.compareKey(key, node.key);
      switch (compare) {
        case 0:
          node.value = value;
          return;
        case -1:
          if (node.left != null) {
            node = node.left;
            continue FIND;
          }
          node.left = new AVLTreeNode(key, value, node, this.compareKey, this.compareOrder, this.calculateOrder);
          node = node.left;
          break FIND;
        case 1:
          if (node.right != null) {
            node = node.right;
            continue FIND;
          }
          node.right = new AVLTreeNode(key, value, node, this.compareKey, this.compareOrder, this.calculateOrder);
          node = node.right;
          break FIND;
        default:
          throw new ExhaustivenessError(compare, `Exhaustive check reached!`);
      }
    }

    // Rotation And Update Information
    for (let curr: (typeof node.parent) = node; curr != null; curr = curr.parent) {
      curr.rotate();
      curr.refresh();
    }
  }

  public delete(key: K): void {
    let node: AVLTreeNode<K, V, O> | null = this.find(key);
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

  public replace(from: AVLTreeNode<K, V, O>, to: AVLTreeNode<K, V, O> | null): void {
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

  public forEach(func: (value: V) => void): void {
    if (this.left != null) { this.left.forEach(func); }
    func(this.value);
    if (this.right != null) { this.right.forEach(func); }
  }

  public *range(from: O, to: O): Generator<V> {
    const f = this.compareOrder(from, this.order);
    const t = this.compareOrder(to, this.order);

    if (f <= 0) { yield* (this.left?.range(from, to) ?? []); }
    if (f <= 0 && t > 0){ yield this.value; }
    if (t > 0) { yield* (this.right?.range(from, to) ?? []); }
  }
}

export default class AVLTree<K, V, O = K>  {
  private root: AVLTreeNodeInterface<K, V, O>;
  private compareKey: (fst: K, snd: K) => -1 | 0 | 1;
  private compareOrder: (fst: O, snd: O) => -1 | 0 | 1;
  private calculateOrder: (key: K) => O;

  public constructor(compare: (fst: K, snd: K) => -1 | 0 | 1, compareOrder: (fst: O, snd: O) => -1 | 0 | 1, calculateOrder: (key: K) => O) {
    this.compareKey = compare;
    this.compareOrder = compareOrder;
    this.calculateOrder = calculateOrder;
    this.root = new AVLTreeDummyNode<K, V, O>(this.compareKey, this.compareOrder, this.calculateOrder);
  }

  public clear() {
    this.root = new AVLTreeDummyNode<K, V, O>(this.compareKey, this.compareOrder, this.calculateOrder);
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

  public forEach(func: (value: V) => void): void {
    this.root.forEach(func);
  }

  public *range(from: O, to: O): Generator<V> {
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
