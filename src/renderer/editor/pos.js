export default class Pos {
  constructor(line, char) {
    this.line = line;
    this.char = char;
  }

  toString() {
    return `Pos: [${this.line}, ${this.char}]`;
  }
}
