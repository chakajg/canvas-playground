class List<T> {

  protected items: Array<T>

  constructor() {
    this.items = [];
  }

  size(): number {
    return this.items.length;
  }

  add(value: T): void {
    this.items.push(value);
  }

  remove(value: T): void {
    this.items.splice(this.items.indexOf(value), 1)
  }

  clear(): void {
    this.items = []
  }

  get(index: number): T {
    return this.items[index];
  }

  includes(value: T): boolean {
    return this.items.includes(value)
  }

  forEach(action: (value: T) => void) {
    this.items.forEach(action)
  }
}

class UniqueList<T> extends List<T> {
  override add(value: T): void {
    if (!this.items.includes(value)) this.items.push(value)
  }
}

class CanvasManager {

  private canvasElements: List<HTMLElement>

  constructor() {
    this.canvasElements = new List()
  }

  create(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    canvas.style.display = "block"
    canvas.style.outline = "1px solid red"
    canvas.style.margin = "0 auto"
    canvas.style.position = "relative"
    canvas.style.top = "50%"
    canvas.style.transform = "translateY(-50%)"
    this.canvasElements.add(canvas)
    return canvas
  }

  destroy(canvas: HTMLCanvasElement): void {
    this.canvasElements.remove(canvas)
    canvas.parentNode?.removeChild(canvas)
  }

  destroyAll(): void {
    this.canvasElements.forEach(c => c.parentNode?.removeChild(c))
    this.canvasElements.clear()
  }
}

class Coordinate {
  x: number
  y: number
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
}

class Velocity extends Coordinate {
  maxX: number
  maxY: number
  minX: number
  minY: number
  constructor(x: number, y: number, maxX: number, maxY: number, minX?: number, minY?: number) {
    super(x, y)
    this.maxX = maxX
    this.maxY = maxY
    this.minX = minX || -maxX
    this.minY = minY || -maxY
  }
}

class Sprite {

  private width: number
  private height: number

  position: Coordinate
  velocity: Velocity
  color: string

  constructor(position: Coordinate, velocity: Velocity, width: number, height: number, color: string) {
    this.position = position
    this.velocity = velocity
    this.width = width
    this.height = height
    this.color = color
  }

  draw(context: CanvasRenderingContext2D) {
    context.fillStyle = this.color
    context.fillRect(this.position.x, this.position.y, this.width, this.height)
    this.update()
  }

  update() {
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y
  }

  speedUp(change: Coordinate) {
    let newX = this.velocity.x + change.x
    let newY = this.velocity.y + change.y

    if (newX > 0) {
      if (this.velocity.maxX > newX)
        this.velocity.x = newX
      else
        this.velocity.x = this.velocity.maxX
    } else if (newX < 0) {
      if (this.velocity.minX < newX)
        this.velocity.x = newX
      else
        this.velocity.x = this.velocity.minX
    }

    if (newY > 0) {
      if (this.velocity.maxY > newY)
        this.velocity.y = newY
      else
        this.velocity.y = this.velocity.maxY
    } else if (newY < 0) {
      if (this.velocity.minY < newY)
        this.velocity.y = newY
      else
        this.velocity.y = this.velocity.minY
    }
  }

  slowDown() {
    if (this.velocity.x > 0) {
      this.velocity.x--
    } else if (this.velocity.x < 0) {
      this.velocity.x++
    }

    if (this.velocity.y > 0) {
      this.velocity.y--
    } else if (this.velocity.y < 0) {
      this.velocity.y++
    }
  }
}

class KeyListener {

  key: Key
  onKeyDown: () => void
  onKeyUp: () => void
  listen: () => void

  constructor(key: Key, onKeyDown?: () => void, onKeyUp?: () => void, listen?: () => void) {
    this.key = key
    const noop = () => { }
    this.onKeyUp = onKeyUp || noop
    this.onKeyDown = onKeyDown || noop
    this.listen = listen || noop
  }
}

class InputListener {

  private listeners: Map<Key, List<KeyListener>> = new Map()

  init() {
    document.addEventListener("keydown", (event) => {
      this.getListenersFor(event.key).forEach(listener => listener.onKeyDown())
    })

    document.addEventListener("keyup", (event) => {
      this.getListenersFor(event.key).forEach(listener => listener.onKeyUp())
    })
  }

  getListenersFor(key: string): List<KeyListener> {
    let listeners = new List<KeyListener>()
    if (key == Key.LEFT || key == Key.UP || key == Key.RIGHT || key == Key.DOWN)
      listeners = this.listeners.get(key) || new List()
    return listeners
  }

  addKeyListener(listener: KeyListener) {
    if (!this.listeners.get(listener.key)) this.listeners.set(listener.key, new List())

    this.listeners.get(listener.key)?.add(listener)
  }
}

enum Key {
  LEFT = "a",
  RIGHT = "d",
  UP = "w",
  DOWN = "s",
  NONE = ""
}

class Game {

  private PLAYER_SPEED = 1
  private PLAYER_MAX_SPEED = 3

  private canvas: HTMLCanvasElement
  private context: CanvasRenderingContext2D

  private sprites: List<Sprite>
  private player: Sprite

  private inputListener: InputListener
  private pressedKeys: List<Key> = new UniqueList()
  private lastKey = Key.NONE

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.context = canvas.getContext("2d")!

    this.sprites = new List()
    this.player = this.createPlayer()
    this.sprites.add(this.player)

    this.inputListener = this.createInputListener()
  }

  init(): void {
    this.draw()
  }

  draw(): void {
    requestAnimationFrame(() => this.draw())

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)

    this.sprites.forEach(s => s.draw(this.context))

    if (this.pressedKeys.includes(Key.LEFT) && this.lastKey == Key.LEFT) {
      this.player.speedUp({ x: -this.PLAYER_SPEED, y: 0 })
    }
    if (this.pressedKeys.includes(Key.RIGHT) && this.lastKey == Key.RIGHT) {
      this.player.speedUp({ x: this.PLAYER_SPEED, y: 0 })
    }
    if (this.pressedKeys.includes(Key.UP) && this.lastKey == Key.UP) {
      this.player.speedUp({ x: 0, y: -this.PLAYER_SPEED })
    }
    if (this.pressedKeys.includes(Key.DOWN) && this.lastKey == Key.DOWN) {
      this.player.speedUp({ x: 0, y: this.PLAYER_SPEED })
    }

    if (this.pressedKeys.size() == 0) {
      this.player.slowDown()
    }
  }

  private createInputListener(): InputListener {
    const inputListener = new InputListener()
    inputListener.init()

    inputListener.addKeyListener(new KeyListener(Key.LEFT, () => {
      this.lastKey = Key.LEFT
      this.pressedKeys.add(Key.LEFT)
    }, () => this.pressedKeys.remove(Key.LEFT)))
    inputListener.addKeyListener(new KeyListener(Key.RIGHT, () => {
      this.lastKey = Key.RIGHT
      this.pressedKeys.add(Key.RIGHT)
    }, () => this.pressedKeys.remove(Key.RIGHT)))
    inputListener.addKeyListener(new KeyListener(Key.UP, () => {
      this.lastKey = Key.UP
      this.pressedKeys.add(Key.UP)
    }, () => this.pressedKeys.remove(Key.UP)))
    inputListener.addKeyListener(new KeyListener(Key.DOWN, () => {
      this.lastKey = Key.DOWN
      this.pressedKeys.add(Key.DOWN)
    }, () => this.pressedKeys.remove(Key.DOWN)))

    return inputListener
  }

  private createPlayer(): Sprite {
    const position = new Coordinate(10, 476)
    const velocity = new Velocity(0, 0, this.PLAYER_MAX_SPEED, this.PLAYER_MAX_SPEED)
    const width = 24
    const height = 24
    const color = "red"
    return new Sprite(position, velocity, width, height, color)
  }
}