'use strict';
const MINE = '&#x2734';
const FLAG = '&#x1F6A9';
const HINT = '&#x1F4A1';
const SMILEY_WIN = '&#x1F973';
const SMILEY_LOSE = '&#x1F62B';
const SMILEY_INIT = '&#x1F604';

var gBoard = [];
var gMines = [];
var gFlags = [];
var gEmptyCells = [];
var gLevel = null;
var gGame = null;
var gGameInterval;
var gStartTime;
var gIsVictory;
var gIsHintMode;
var gLives;
var gHints;

function initGame() {
    gMines = [];
    gFlags = [];
    gEmptyCells = [];
    gStartTime = 0;
    gLives = 3;
    gHints = 3;
    gIsVictory = false;
    gIsHintMode = false;
    gLevel = checkLevel() || { size: 4, mines: 2 };
    gGame = { isOn: true, shownCount: 0, markedCount: 0, secsPassed: 0 };
    gBoard = buildBoard();
    if (gGameInterval) clearInterval(gGameInterval);
    document.querySelector('.smiley').innerHTML = SMILEY_INIT;
    document.querySelector('.hints').innerHTML = `<ul class="hints-list" onclick="useHint()"><li>${HINT}</li><li>${HINT}</li><li>${HINT}</li></ul>`;
    document.querySelector('.timer').innerText = '000';
    document.querySelector('.lives span').innerText = '3';
    document.querySelector('.mines-left span').innerText = gLevel.mines;
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
        if (rndIdx >= 0) gEmptyCells.splice(rndIdx, 1);
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
            if (currCell.isMine) continue;
            var negsCount = countMinesNegs(board, i, j);
            currCell.minesAroundCount = negsCount;
            if (negsCount) {
                var searchIdx = gEmptyCells.findIndex((loc) => loc.i === i && loc.j === j);
                if (searchIdx >= 0) gEmptyCells.splice(searchIdx, 1);
            }
            renderCell({ i, j }, negsCount || '');
        }
    }
}

function cellClicked(elCell, i, j) {
    var currCell = gBoard[i][j];
    if (!gGame.isOn || currCell.isMarked || currCell.isShown) return;
    // First Click
    if (!gStartTime) {
        gStartTime = Date.now();
        var searchIdx = gEmptyCells.findIndex((loc) => loc.i === i && loc.j === j);
        var firstCellIdx = (searchIdx >= 0) ? gEmptyCells.splice(searchIdx, 1)[0] : null;
        gMines = locateMines(gBoard);
        if (firstCellIdx) gEmptyCells.push(firstCellIdx);
        setMinesNegsCount(gBoard);
        gGameInterval = setInterval(updateTimer, 1000);
    } else {
        if (gIsHintMode) {
            useHint(i, j);
            return;
        }
        if (currCell.isMine) {
            elCell.style.backgroundColor = 'red';
            currCell.isShown = true;
            gGame.shownCount++;
            gLives--;
            document.querySelector('.lives span').innerText = gLives;
            var elMinesLeft = document.querySelector('.mines-left span');
            elMinesLeft.innerText = +elMinesLeft.innerText - 1;
            if (gLives) {
                renderCell({ i, j }, MINE);
                checkGameOver();
                return;
            } else
                showMines();
            gameOver();
            return;
        }
    }
    expandShown(gBoard, elCell, i, j);
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
        var currFlag = (flagIdx >= 0) ? gFlags.splice(flagIdx, 1)[0] : null;
        currCell.isMarked = false;
        renderCell({ i, j }, currFlag.currCellContent || '');
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
    document.querySelector('.smiley').innerHTML = (gIsVictory) ? SMILEY_WIN : SMILEY_LOSE;
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
    var currCell = board[i][j];
    if (currCell.minesAroundCount) {
        currCell.isShown = true;
        gGame.shownCount++;
        elCell.classList.remove('hide');
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
            if (!currCell.isMine && !currCell.isShown) {
                currCell.isShown = true;
                gGame.shownCount++;
                renderCell({ i, j }, currCell.minesAroundCount || '');
            }
        }
    }
}

function useHint(i, j) {
    if (!gStartTime) return;
    var elList = document.querySelector('.hints-list');
    if (!gIsHintMode) {
        elList.lastChild.classList.add('hint-mode');
        gIsHintMode = true;
        return;
    } else if (i || j) {  
        renderCellsHint(i, j);
        setTimeout(() => {
            elList.lastChild.remove();
            gIsHintMode = false;}, 1000);
        setTimeout(renderCellsHint, 1000, i, j);
    }
}

function renderCellsHint(rowIdx, colIdx) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= gBoard.length) continue;
            var currCell = gBoard[i][j];
            if (!currCell.isShown) {
                var className = getClassName({ i, j });
                var elCell = document.querySelector(`.${className}`);
                elCell.classList.toggle('hide');
            }
        }
    }
}

function handleKey(ev) {
    if (ev.key === 'Escape') closeModal();
    if (ev.key === 'Enter') initGame();
}