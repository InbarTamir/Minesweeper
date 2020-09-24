'use strict';
const MINE = '&#x2734';
const FLAG = '&#x1F6A9';

var gBoard = [];
var gMines = [];
var gFlags = [];
var gEmptyCells = [];
var gLevel = null;
var gGame = null;
var gIsVictory;
var gGameInterval;
var gStartTime;

function initGame() {
    closeModal();
    gMines = [];
    gFlags = [];
    gEmptyCells = [];
    gStartTime = 0;
    gIsVictory = false;
    gLevel = checkLevel() || { size: 4, mines: 2 };
    gGame = { isOn: true, shownCount: 0, markedCount: 0, secsPassed: 0 };
    gBoard = buildBoard();
    if (gGameInterval) clearInterval(gGameInterval);
    document.querySelector('.timer').innerText = '000';
    document.querySelector('.score span').innerText = '0';
    renderBoard(gBoard);
}

function checkLevel() {
    var elRadios = document.querySelectorAll('input[type="radio"]');
    for (var i = 0; i < elRadios.length; i++) {
        var elRadio = elRadios[i];
        if (elRadio.checked) {
            var size = +elRadio.value;
            var mines = +elRadio.dataset.mines;
            return { size, mines };
        }
    }
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

function locateMines(board) {
    var mines = [];
    for (var mineIdx = 0; mineIdx < gLevel.mines; mineIdx++) {
        var length = gEmptyCells.length;
        var rndIdx = getRandomIntInclusive(0, length - 1);
        var rndCell = gEmptyCells[rndIdx];
        board[rndCell.i][rndCell.j].isMine = true;
        gEmptyCells.splice(rndIdx, 1);
        mines.push(rndCell);
        var location = { i: rndCell.i, j: rndCell.j };
        renderCell(location, MINE);
    }
    return mines;
}

function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {
            var currCell = board[i][j];
            currCell.minesAroundCount = countMinesNegs(board, i, j);
        }
    }
}

function cellClicked(elCell, i, j) {
    var currCell = gBoard[i][j];
    if (!gGame.isOn || currCell.isMarked || currCell.isShown) return;
    // First Click
    if (!gStartTime) {
        gStartTime = Date.now();
        gMines = locateMines(gBoard);
        setMinesNegsCount(gBoard);
        gGameInterval = setInterval(updateTimer, 1000);
    } else if (currCell.isMine) {
        elCell.style.backgroundColor = 'red';
        for (var mineIdx = 0; mineIdx < gMines.length; mineIdx++) {
            var currMine = gBoard[i][j];
            currMine.isShown = true;
            gGame.shownCount++;
        }
        showMines();
        gameOver();
    }
    currCell.isShown = true;
    gGame.shownCount++;
    elCell.classList.remove('hide');
    checkGameOver();
}

function cellMarked(elCell, i, j) {
    var currCell = gBoard[i][j];
    if (!gGame.isOn || currCell.isShown) return;

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
        renderCell(flag.location, FLAG);
    } else { // Remove Flag
        var flagIdx = gFlags.findIndex((flag) => flag.location.i === i && flag.location.j === j);
        var currFlag = gFlags.splice(flagIdx, 1)[0];
        currCell.isMarked = false;
        renderCell({ i, j }, currFlag.currCellContent);
        gGame.markedCount--;
    }
    elCell.classList.toggle('flag');
    checkGameOver();
}

function checkGameOver() {
    var cellsChanged = gGame.shownCount + gGame.markedCount;
    if (cellsChanged !== gLevel.size ** 2) return;
    gIsVictory = true;
    gameOver();
}

function gameOver() {
    clearInterval(gGameInterval);
    gGame.isOn = false;
    var elModal = document.querySelector('.game-over');
    document.querySelector('.game-over h3').innerText = (gIsVictory) ? 'Victorious!' : 'Game Over!';
    elModal.style.display = 'inline-block';
}

function closeModal() {
    var elModal = document.querySelector('.game-over');
    elModal.style.display = 'none';
}

function changeLevel(elRadio) {
    if (!gStartTime) initGame();
    var newSize = +elRadio.value;
    if (newSize !== gLevel.size) {
        var stopTime = Date.now();
        var isReset = confirm('Reset the game?');
        if (isReset) initGame();
        else {
            elRadio.checked = false;
            var elPrevRadio = document.querySelector(`input[value="${gLevel.size}"]`);
            elPrevRadio.checked = true;
            var delayTime = Date.now() - stopTime;
            gStartTime += delayTime;
        }
    }
}

function expandShown(board, elCell, i, j) {

}

function handleKey(ev) {
    if (ev.key === 'Escape') closeModal();
    if (ev.key === 'Enter') initGame();
}