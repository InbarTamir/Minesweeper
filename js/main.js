'use strict';
const MINE = '&#x2734';
const FLAG = '&#x1F6A9';

var gBoard = [];
var gMines = [];
var gLevel = null;
var gGame = null;
var gIsVictory;
var gGameInterval;
var gStartTime;

function initGame() {
    closeModal();
    gMines = [];
    gStartTime = 0;
    gIsVictory = false;
    gLevel = { size: 4, mines: 2 };
    gGame = { isOn: false, shownCount: 0, markedCount: 0, secsPassed: 0 };
    gBoard = buildBoard();
    setMinesNegsCount(gBoard);
    renderBoard(gBoard);
    if (gGameInterval) clearInterval(gGameInterval);
    document.querySelector('.timer').innerText = '000';
    document.querySelector('.score span').innerText = '0';
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
                isMarked: false
            };
        }
    }
    gMines = locateMines(board);
    return board;
}

function locateMines(board) {
    var mines = [];
    for (var mineIdx = 0; mineIdx < gLevel.mines; mineIdx++) {
        var i = getRandomIntInclusive(0, board.length - 1);
        var j = getRandomIntInclusive(0, board.length - 1);
        board[i][j].isMine = true;
        mines.push({ i, j });
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

function countMinesNegs(board, rowIdx, colIdx) {
    var negsCount = 0;
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if ((j < 0 || j >= board.length) ||
                (i === rowIdx && j === colIdx)) continue;
            if (board[i][j].isMine) negsCount++;
        }
    }
    return negsCount;
}

function renderBoard(board) {
    var strHTML = '<table class="board" oncontextmenu="return false;"><tbody>';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < board.length; j++) {
            var className = `cell cell${i}-${j} hide`;
            var cell = '';
            if (board[i][j].isMine) {
                cell = MINE;
                className += ' mine';
            }
            strHTML += `<td class="${className}" onclick="cellClicked(this,${i},${j},event)" oncontextmenu="cellMarked(this,${i},${j},event)">${cell}</td>`;
        }
        strHTML += '</tr>';
    }
    strHTML += '</tbody></table>';
    var elContainer = document.querySelector('.board-container');
    elContainer.innerHTML = strHTML;
}

function renderMines() {
    var elMines = document.querySelectorAll('.mine');
    for (var i = 0; i < elMines.length; i++) {
        elMines[i].classList.remove('hide');
    }
}

function cellClicked(elCell, i, j, ev) {
    var currCell = gBoard[i][j];
    if (currCell.isMarked || currCell.isShown) return;
    if (!gGame.isOn) {
        if (gStartTime) gameOver();
        gGame.isOn = true;
        gStartTime = Date.now();
        gGameInterval = setInterval(updateTimer, 1000);
    }
    if (currCell.isMine) {
        elCell.style.backgroundColor = 'red';
        for (var mineIdx = 0; mineIdx < gMines.length; mineIdx++) {
            var currMine = gBoard[i][j];
            currMine.isShown = true;
            gGame.shownCount++;
        }
        renderMines();
        gGame.isOn = false;
        gameOver();
    }
    currCell.isShown = true;
    gGame.shownCount++;
    elCell.classList.remove('hide');
    checkGameOver();
}

function cellMarked(elCell, i, j, ev) {
    var currCell = gBoard[i][j];
    if (!gGame.isOn || currCell.isShown) return;

    if (!currCell.isMarked) {
        if (gGame.markedCount === gLevel.mines) return;
        var isEmpty = elCell.innerHTML === '';
        var newContent = (isEmpty) ? FLAG : (`${FLAG}<!--${elCell.innerText}-->`);
        elCell.innerHTML = newContent;
        gGame.markedCount++;
    } else {
        var length = elCell.innerHTML.length;
        if (elCell.innerHTML[length - 1] === '>') {
            var fromIdx = 6;
            var toIdx = length - 3;
            var prevContent = elCell.innerHTML.substring(fromIdx, toIdx);
            console.log(prevContent);
            elCell.innerHTML = prevContent;
        } else elCell.innerHTML = '';
        gGame.markedCount--;
    }
    currCell.isMarked = !currCell.isMarked;
    elCell.classList.toggle('flag');
    checkGameOver();
}

function checkGameOver() {
    var cellsChanged = gGame.shownCount + gGame.markedCount;
    if (cellsChanged !== gLevel.size ** 2) return;
    gIsVictory = true;
    gameOver();
}

function gameOver(winOrLose) {
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
    var size = +elRadio.value;
    if (size !== gLevel.size) {
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