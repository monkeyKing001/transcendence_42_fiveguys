export class htmlItem {
    x :number;
    y :number;
    width :number;
    height :number;
    constructor(x : number, y: number, width: number, height: number) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }
    isEqual(other : htmlItem) {
      this.x = other.x;
      this.y = other.y;
      this.width = other.width;
      this.height = other.height;
    }
}

export class ballItem {
    x :number;
    y :number;
    dx :number;
    dy :number;
    v :number;
    r :number;
    temp :number;
    constructor(x: number, y: number, dx: number, dy: number, v: number, r: number){
      this.x = x;
      this.y = y;
      this.dx = dx;
      this.dy = dy;
      this.v = v;
      this.r = r;
      this.temp = -1;
    }
    isEqual(other: ballItem){
      this.x = other.x;
      this.y = other.y;
      this.dx = other.dx;
      this.dy = other.dy;
      this.v = other.v;
      this.r = other.r;
      this.temp = other.temp;
    } 
    init(x: number, y: number, dx: number ,dy: number, v: number,r: number,temp: number){
      this.x = x;
      this.y = y;
      this.dx = dx;
      this.dy = dy;
      this.v = v;
      this.r = r;
      this.temp = temp;
    }
}
export class padItem {
    x :number;
    y :number;
    width :number;
    height :number;
    color :string;
    radi :number;
    constructor(x: number, y: number, width: number, height: number, color: string, radi: number) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.color = color;
      this.radi = radi;
    }
    isEqual(other: padItem) {
      this.x = other.x;
      this.y = other.y;
      this.width = other.width;
      this.height = other.height;
      this.color = other.color;
      this.radi = other.radi;
    }
}

export class game {
    pad :padItem[];
    board_x :number;
    board_y :number;
    ball :ballItem;
    obs :htmlItem[];
    intervalId! : NodeJS.Timeout;
    constructor(pad:padItem[], board_x:number, board_y:number, ball:ballItem, obs:htmlItem[]){
      this.pad = pad;
      this.board_x = board_x;
      this.board_y = board_y;
      this.ball = ball;
      this.obs = obs;
    }
}