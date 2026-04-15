const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const ROW = 20;
const COL = 10;
const SIZE = 30;

let board, piece, score;
let gameStarted = false;

const COLORS = ["cyan","blue","orange","yellow","green","purple","red"];

const SHAPES = [
    [[1,1,1,1]],
    [[1,0,0],[1,1,1]],
    [[0,0,1],[1,1,1]],
    [[1,1],[1,1]],
    [[0,1,1],[1,1,0]],
    [[0,1,0],[1,1,1]],
    [[1,1,0],[0,1,1]]
];

// SRS
const kicks = {
    normal: [
        [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
        [[0,0],[1,0],[1,-1],[0,2],[1,2]],
        [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
        [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]]
    ],
    I: [
        [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
        [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
        [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
        [[0,0],[1,0],[-2,0],[1,-2],[-2,1]]
    ]
};

function resetGame() {
    board = Array.from({ length: ROW }, () => Array(COL).fill(0));
    piece = randomPiece();
    score = 0;
    updateScore();
}

function randomPiece() {
    let i = Math.floor(Math.random() * SHAPES.length);
    return {
        shape: SHAPES[i],
        color: COLORS[i],
        x: 3,
        y: 0,
        type: i,
        rotation: 0
    };
}

function drawCell(x,y,color){
    ctx.fillStyle=color;
    ctx.fillRect(x*SIZE,y*SIZE,SIZE,SIZE);
    ctx.strokeRect(x*SIZE,y*SIZE,SIZE,SIZE);
}

function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    board.forEach((row,y)=>{
        row.forEach((cell,x)=>{
            if(cell) drawCell(x,y,cell);
        });
    });

    piece.shape.forEach((row,y)=>{
        row.forEach((val,x)=>{
            if(val) drawCell(piece.x+x,piece.y+y,piece.color);
        });
    });
}

function drawStart(){
    ctx.fillStyle="black";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle="white";
    ctx.font="20px Arial";
    ctx.textAlign="center";

    ctx.fillText("TETRIS",150,250);
    ctx.fillText("Tap or Press Key",150,300);
}

function collision(dx,dy){
    return piece.shape.some((row,y)=>{
        return row.some((val,x)=>{
            if(!val) return false;
            let nx = piece.x + x + dx;
            let ny = piece.y + y + dy;

            return (
                nx < 0 || nx >= COL ||
                ny >= ROW ||
                (board[ny] && board[ny][nx])
            );
        });
    });
}

function merge(){
    piece.shape.forEach((row,y)=>{
        row.forEach((val,x)=>{
            if(val) board[piece.y+y][piece.x+x] = piece.color;
        });
    });
}

function clearLines(){
    let lines = 0;

    board = board.filter(row=>{
        if(row.every(c=>c)){
            lines++;
            return false;
        }
        return true;
    });

    while(board.length < ROW){
        board.unshift(Array(COL).fill(0));
    }

    score += lines * 10;
    updateScore();
}

function updateScore(){
    document.getElementById("score").innerText = "Score: " + score;
}

function rotate(matrix){
    return matrix[0].map((_,i)=>matrix.map(r=>r[i]).reverse());
}

function tryRotateSRS(){
    let oldShape = piece.shape;
    let oldRot = piece.rotation;

    let newShape = rotate(oldShape);
    let newRot = (oldRot + 1) % 4;

    let data = (piece.type === 0) ? kicks.I : kicks.normal;

    for(let i=0;i<data[oldRot].length;i++){
        let [dx,dy] = data[oldRot][i];

        piece.shape = newShape;
        piece.x += dx;
        piece.y += dy;

        if(!collision(0,0)){
            piece.rotation = newRot;
            return;
        }

        piece.x -= dx;
        piece.y -= dy;
    }

    piece.shape = oldShape;
}

// loop ลื่น
let dropCounter = 0;
let dropInterval = 800;
let lastTime = 0;

function update(time=0){
    const delta = time - lastTime;
    lastTime = time;

    if(gameStarted){
        dropCounter += delta;

        if(dropCounter > dropInterval){
            if(!collision(0,1)){
                piece.y++;
            } else {
                merge();
                clearLines();
                piece = randomPiece();
                dropInterval = Math.max(200, dropInterval - 10);
            }
            dropCounter = 0;
        }

        draw();
    } else {
        drawStart();
    }

    requestAnimationFrame(update);
}

// keyboard
document.addEventListener("keydown", e=>{
    if(!gameStarted){
        gameStarted=true;
        resetGame();
        return;
    }

    if(e.key==="ArrowLeft" && !collision(-1,0)) piece.x--;
    if(e.key==="ArrowRight" && !collision(1,0)) piece.x++;
    if(e.key==="ArrowDown" && !collision(0,1)) piece.y++;
    if(e.key==="ArrowUp") tryRotateSRS();
});

// touch gesture
let startX=0, startY=0;

canvas.addEventListener("touchstart", e=>{
    if(!gameStarted){
        gameStarted=true;
        resetGame();
        return;
    }

    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
});

canvas.addEventListener("touchend", e=>{
    let dx = e.changedTouches[0].clientX - startX;
    let dy = e.changedTouches[0].clientY - startY;

    if(Math.abs(dx)<10 && Math.abs(dy)<10){
        tryRotateSRS();
        return;
    }

    if(dx < -30 && !collision(-1,0)) piece.x--;
    else if(dx > 30 && !collision(1,0)) piece.x++;

    if(dy > 30){
        while(!collision(0,1)){
            piece.y++;
        }
    }
});

update();