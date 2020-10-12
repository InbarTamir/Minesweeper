'use strict';
const MINE = '&#x2734';
const FLAG = '&#x1F6A9';
const HINT = '&#x1F4A1';
const LIFE = '&#x2764';
const SMILEY_WIN = '&#x1F973';
const SMILEY_LOSE = '&#x1F62B';
const SMILEY_INIT = '&#x1F604';

var gLevel = null;
var gGame = null;
var gBoard = [];
var gMines = [];
var gFlags = [];
var gHistory = [];
var gHintCells = [];
var gEmptyCells = [];
var gGameInterval;

function initGame() {
    gMines = [];
    gFlags = [];
    gHistory = [];
    gEmptyCells = [];
    gHintCells = [];
    if (!gLevel) gLevel = { size: 4, mines: 2 };
    gGame = {
        isOn: false,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0,
        lives: 3,
        startTime: 0,
        isVictory: false,
        isHintMode: false,
        isFirstClick: true,
        isManualMines: false
    };
    gBoard = buildBoard();
    renderBoard(gBoard);
    if (gGameInterval) clearInterval(gGameInterval);
    // DOM
    renderInitPage();
}

function buildBoard() {
    var board = [];
    var size = gLevel.size;
    for (var i = 0; i < size; i++) {
        board.push([]);
        for (var j = 0; j < size; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false,
            };
            gEmptyCells.push({ i, j });
        }
    }
    return board;
}

function cellClicked(elCell, i, j) {
    var currCell = gBoard[i][j];
    if (currCell.isMarked || currCell.isShown) return;
    // First Click
    if (gGame.isFirstClick) {
        if (gGame.isManualMines) {
            if (gMines.length > gLevel.mines) return;
            var elSpan = document.querySelector('.mines-left span');
            var pickMinesLeft = +elSpan.innerText;

            if (currCell.isMine) {
                currCell.isMine = false;
                var searchIdx = findIndex(gMines, i, j);
                if (searchIdx >= 0) gMines.splice(searchIdx, 1);
                elCell.classList.add('hide');
                elSpan.innerText = ++pickMinesLeft;
                renderCell({ i, j }, '');
            } else {
                if (gMines.length === gLevel.mines) return;
                currCell.isMine = true;
                gMines.push({ i, j });
                elCell.classList.remove('hide');
                elSpan.innerText = --pickMinesLeft;
                renderCell({ i, j }, MINE);
                if (pickMinesLeft === 0) {
                    setTimeout(() => {
                        if (gMines.length < gLevel.mines) return;
                        var elManually = document.querySelector('.manually');
                        elManually.style.display = 'none';
                        document.querySelector('.mines-left span').innerText = gLevel.mines;
                        gGame.isManualMines = false;
                        hideManualMines();
                    }, 1000);
                }
            }
        } else {
            var elManually = document.querySelector('.manually');
            elManually.style.display = 'none';
            gGame.startTime = Date.now();
            gGame.isOn = true;
            gGame.isFirstClick = false;
            if (!gMines.length) {
                var searchIdx = findIndex(gEmptyCells, i, j);
                var firstCellIdx = (searchIdx >= 0) ? gEmptyCells.splice(searchIdx, 1)[0] : null;
                gMines = locateMines(gBoard);
                if (firstCellIdx >= 0) gEmptyCells.push(firstCellIdx);
            }
            setMinesAroundCount(gBoard);
            gGameInterval = setInterval(updateTimer, 1000);
            saveHistory();
            if (!currCell.isMine) {
                expandShown(gBoard, i, j);
                return;
            }
        }
    }
    if (gGame.isOn) {
        saveHistory();
        if (gGame.isHintMode) {
            useHint(i, j);
        } else {
            if (currCell.isMine) {
                elCell.classList.add('red');
                currCell.isShown = true;
                gGame.shownCount++;
                gGame.lives--;
                var elLives = document.querySelector('.lives-list');
                elLives.lastChild.remove();
                var elMinesLeft = document.querySelector('.mines-left span');
                elMinesLeft.innerText = +elMinesLeft.innerText - 1;
                if (gGame.lives) {
                    explodeAllMines([{ i, j }]);
                    checkGameOver();
                    return;
                } else {
                    explodeAllMines(gMines);
                    gameOver();
                    return;
                }
            }else expandShown(gBoard, i, j);
        }
    }
}

function cellMarked(elCell, i, j) {
    var currCell = gBoard[i][j];
    if (!gGame.isOn || currCell.isShown) return;
    saveHistory();
    if (!currCell.isMarked) { // Add Flag
        if (gGame.markedCount === gLevel.mines) return;
        var flag = {
            location: {
                i,
                j
            },
            currCellContent: elCell.innerHTML
        };
        gFlags.push(flag);
        currCell.isMarked = true;
        gGame.markedCount++;
        var elMinesLeft = document.querySelector('.mines-left span');
        var minesLeftCount = +elMinesLeft.innerText;
        if (minesLeftCount > 0) elMinesLeft.innerText = minesLeftCount - 1;
        renderCell(flag.location, FLAG);
    } else { // Remove Flag
        var flagIdx;
        for (var idx = 0; idx < gFlags.length; idx++) {
            var currFlagLoc = gFlags[idx].location;
            if (currFlagLoc.i === i && currFlagLoc.j === j) {
                flagIdx = idx;
                break;
            }
        }
        var currFlag = (flagIdx >= 0) ? gFlags.splice(flagIdx, 1)[0] : null;
        currCell.isMarked = false;
        gGame.markedCount--;
        var elMinesLeft = document.querySelector('.mines-left span');
        elMinesLeft.innerText = +elMinesLeft.innerText + 1;
        renderCell({ i, j }, currFlag.currCellContent || '');
    }
    elCell.classList.toggle('flag');
    checkGameOver();
}

function expandShown(board, i, j) {
    var currCell = board[i][j];
    if (currCell.minesAroundCount && !currCell.isShown) {
        currCell.isShown = true;
        gGame.shownCount++;
        renderCell({ i, j }, currCell.minesAroundCount || '');
    } else {
        showFirstNegs(board, i, j);
    }
    checkGameOver();
}

function showFirstNegs(board, rowIdx, colIdx) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= board.length) continue;
            var currCell = board[i][j];
            if (!currCell.isMine && !currCell.isShown && !currCell.isMarked) {
                currCell.isShown = true;
                gGame.shownCount++;
                renderCell({ i, j }, currCell.minesAroundCount || '');
                if (currCell.minesAroundCount > 0) continue;
                expandShown(board, i, j);
            }
        }
    }
}

function handleClick(ev, elCell, i, j) {
    if (ev.buttons === 3) {
        var isHidden = elCell.classList.contains('hide');
        if (isHidden) return;
        gGame.isHintMode = true;
        showClickOpts(gBoard, i, j);
    } else if (ev.button === 0) {
        cellClicked(elCell, i, j);
    }
    else if (ev.button === 2 && gGame.isOn) {
        cellMarked(elCell, i, j);
    }
}

function changeLevel(elRadio) {
    if (gLevel.size === +elRadio.value) return;
    if (!gGame.isOn && +elRadio.value !== gLevel.size) {
        gLevel = {
            size: +elRadio.value,
            mines: +elRadio.dataset.mines
        };
        gEmptyCells = [];
        gBoard = buildBoard();
        renderBoard(gBoard);
        document.querySelector('.mines-left span').innerText = gLevel.mines;
        document.querySelector('.best span').innerText = localStorage.getItem(gLevel.size);
    } else {
        var stopTime = Date.now();
        var isReset = confirm('Reset the game?');
        if (isReset) {
            gLevel = {
                size: +elRadio.value,
                mines: +elRadio.dataset.mines
            };
            initGame();
        }
        else {
            elRadio.checked = false;
            var elPrevRadio = document.querySelector(`input[value="${gLevel.size}"]`);
            elPrevRadio.checked = true;
            var delayTime = Date.now() - stopTime;
            gGame.startTime += delayTime;
        }
    }
}

function undo() {
    var prevState = gHistory.pop();
    if (!prevState || !gGame.isOn) return;

    gBoard = prevState.board;
    gFlags = prevState.flags;
    gGame = prevState.game;

    if (!gHistory.length) {
        clearInterval(gGameInterval);
        gGame.startTime = Date.now();
        gGame.isFirstClick = true;
    } else gGame.startTime = Date.now() - prevState.game.secsPassed * 1000;
    updateTimer();

    // DOM
    renderBoard(gBoard);
    document.querySelector('.lives span').innerHTML = prevState.elLives;
    document.querySelector('.mines-left span').innerText = prevState.minesLeft;
    var elNumbers = document.querySelectorAll('.color');
    for (var i = 0; i < elNumbers.length; i++) {
        renderColor(elNumbers[i]);
    }
}

function saveHistory() {
    var currState = {
        board: [],
        flags: gFlags.slice(),
        game: Object.assign({}, gGame),
        elLives: document.querySelector('.lives span').innerHTML,
        minesLeft: +document.querySelector('.mines-left span').innerText
    };
    var copyBoard = [];
    for (var i = 0; i < gBoard.length; i++) {
        copyBoard.push([]);
        for (var j = 0; j < gBoard.length; j++) {
            copyBoard[i].push(Object.assign({}, gBoard[i][j]));
        }
    }
    currState.board = copyBoard;
    gHistory.push(currState);
}

function checkGameOver() {
    var cellsChanged = gGame.shownCount + gGame.markedCount;
    if (cellsChanged !== gLevel.size ** 2) return;
    gGame.isVictory = true;
    gameOver();
}

function gameOver() {
    clearInterval(gGameInterval);
    gGame.isOn = false;
    document.querySelector('.smiley').innerHTML = (gGame.isVictory) ? SMILEY_WIN : SMILEY_LOSE;
    if (gGame.isVictory) {
        var win = new Audio('sounds/win.wav');
        win.play();
        checkNewHighscore();
    }
}

function checkNewHighscore() {
    var currScore = gGame.secsPassed;
    var currLevel = gLevel.size;
    var highScore = localStorage.getItem(currLevel);
    if (!highScore || currScore < highScore) {
        localStorage.setItem(currLevel, currScore);
    }
    var elBest = document.querySelector('.best span');
    elBest.innerText = localStorage.getItem(gLevel.size);
}
