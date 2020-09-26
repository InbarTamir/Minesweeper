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
var gMoves = [];
var gEmptyCells = [];
var gRightClickShownCells = [];
var gLevel = null;
var gGame = null;
var gGameInterval;
var gStartTime;
var gIsVictory;
var gIsHintMode;
var gIsFirstClick;
var gIsManualMines;
var gLives;
var gHints;

function initGame() {
    gMines = [];
    gFlags = [];
    gMoves = [];
    gEmptyCells = [];
    gRightClickShownCells = [];
    gStartTime = 0;
    gLives = 3;
    gHints = 3;
    gIsVictory = false;
    gIsHintMode = false;
    gIsFirstClick = true;
    gIsManualMines = false;
    gLevel = checkLevel() || { size: 4, mines: 2 };
    gGame = { isOn: false, shownCount: 0, markedCount: 0, secsPassed: 0 };
    gBoard = buildBoard();
    renderBoard(gBoard);
    if (gGameInterval) clearInterval(gGameInterval);
    // DOM
    document.querySelector('.smiley').innerHTML = SMILEY_INIT;
    document.querySelector('.hints').innerHTML = `<ul class="hints-list" onclick="useHint()"><li>${HINT}</li><li>${HINT}</li><li>${HINT}</li></ul>`;
    document.querySelector('.timer').innerText = '000';
    document.querySelector('.lives span').innerText = '3';
    document.querySelector('.mines-left span').innerText = gLevel.mines;
    document.querySelector('.highscore span').innerText = localStorage.getItem(gLevel.size);
    document.querySelector('.safe-left span').innerText = '3';
    document.querySelector('.safe-click').disabled = false;
    document.querySelector('.manually').classList.remove('focus-mode');
    document.querySelector('.manually').style.display = 'inline';
    document.querySelector('.manually').classList.remove('highlight');
    document.querySelector('.mines-pick').style.display = 'none';
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
                var searchIdx = findIndex(gEmptyCells, i, j);
                if (searchIdx >= 0) gEmptyCells.splice(searchIdx, 1);
                renderCell({ i, j }, negsCount || '');
            }
        }
    }
}

function cellClicked(elCell, i, j) {
    var strMove = `var elCell = ${elCell}; var i = ${i}; var j = ${j}; `;
    var currCell = gBoard[i][j];
    strMove = `var currCell = ${currCell}; `;
    if (currCell.isMarked || currCell.isShown) return;
    // First Click
    if (gIsFirstClick) {
        if (gIsManualMines) {
            if (gMines.length > gLevel.mines) return;
            var elSpan = document.querySelector('.mines-pick span');
            var pickMinesLeft = +elSpan.innerText;

            if (currCell.isMine) {
                currCell.isMine = false;
                var searchIdx = findIndex(gMines, i, j);
                if (searchIdx >= 0) gMines.splice(searchIdx, 1);
                elCell.classList.add('hide');
                renderCell({ i, j }, '');
                elSpan.innerText = ++pickMinesLeft;
                return;
            }
            if (gMines.length === gLevel.mines) return;
            currCell.isMine = true;
            gMines.push({ i, j });
            elCell.classList.remove('hide');
            renderCell({ i, j }, MINE);
            elSpan.innerText = --pickMinesLeft;
            if (pickMinesLeft === 0) {
                setTimeout(() => {
                    if (gMines.length < gLevel.mines) return;
                    document.querySelector('.manually').style.display = 'none';
                    document.querySelector('.mines-pick').style.display = 'none';
                    hideMines(gMines);
                    gIsManualMines = false;
                }, 1000);
            }
            return;
        }
        document.querySelector('.manually').style.display = 'none';
        gStartTime = Date.now();
        gGame.isOn = true;
        gIsFirstClick = false;
        if (!gMines.length) {
            var searchIdx = findIndex(gEmptyCells, i, j);
            var firstCellIdx = (searchIdx >= 0) ? gEmptyCells.splice(searchIdx, 1)[0] : null;
            gMines = locateMines(gBoard);
            if (firstCellIdx >= 0) gEmptyCells.push(firstCellIdx);
        }
        setMinesNegsCount(gBoard);
        gGameInterval = setInterval(updateTimer, 1000);
        if (!currCell.isMine) {
            expandShown(gBoard, i, j);
            checkGameOver();
            return;
        }
    }
    if (gGame.isOn) {
        if (gIsHintMode) {
            useHint(i, j);
            return;
        }
        if (currCell.isMine) {
            strMove += `elCell.style.backgroundColor = ${elCell.style.backgroundColor}; `;
            elCell.style.backgroundColor = 'red';
            currCell.isShown = true;
            strMove += 'currCell.isShown = false; ';
            gGame.shownCount++;
            strMove += 'gGame.shownCount--; ';
            gLives--;
            strMove += 'gLives++; ';
            var elLives = document.querySelector('.lives span');
            strMove += `var elLives = ${elLives}; `;
            elLives.innerText = gLives;
            strMove += `elLives.innerText = ${gLives}; `;
            var elMinesLeft = document.querySelector('.mines-left span');
            strMove += `var elMinesLeft = ${elMinesLeft}; `;
            strMove += `elMinesLeft.innerText = ${elMinesLeft.innerText}; `;
            elMinesLeft.innerText = +elMinesLeft.innerText - 1;
            gMoves.push(strMove);
            if (gLives) {
                showMines([{ i, j }]);
                checkGameOver();
                return;
            } else {
                showMines(gMines);
                gameOver();
                return;
            }
        }
        expandShown(gBoard, i, j);
        checkGameOver();
    }
}

function cellMarked(elCell, i, j) {
    var currCell = gBoard[i][j];
    if (!gGame.isOn || currCell.isShown) return;
    var strMove = `var currCell = ${currCell}; `;

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
        strMove += `gFlags.pop(); `;
        currCell.isMarked = true;
        strMove += 'currCell.isMarked = false; ';
        gGame.markedCount++;
        strMove += 'gGame.markedCount--; ';
        var elMinesLeft = document.querySelector('.mines-left span');
        var minesLeftCount = +elMinesLeft.innerText;
        if (minesLeftCount > 0) elMinesLeft.innerText = minesLeftCount - 1;
        renderCell(flag.location, FLAG);
    } else { // Remove Flag
        var flagIdx = findIndex(gFlags, i, j);
        var currFlag = (flagIdx >= 0) ? gFlags.splice(flagIdx, 1)[0] : null;
        strMove += `var currFlag = ${currFlag}; `;
        currCell.isMarked = false;
        strMove += `currCell.isMarked = true; `;
        gGame.markedCount--;
        strMove += 'gGame.markedCount++; ';
        var elMinesLeft = document.querySelector('.mines-left span');
        elMinesLeft.innerText = +elMinesLeft.innerText + 1;
        renderCell({ i, j }, currFlag.currCellContent || '');
    }
    elCell.classList.toggle('flag');
    strMove += `elCell.classList.toggle('flag'); `;
    gMoves.push(strMove);
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
    if (gIsVictory) checkNewHighscore();
}

function changeLevel(elRadio) {
    if (!gGame.isOn) initGame();
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

function expandShown(board, i, j) {
    var currCell = board[i][j];
    // var strMove = `var currCell = ${currCell}; `;
    if (currCell.minesAroundCount && !currCell.isShown) {
        currCell.isShown = true;
        // strMove += 'currCell.isShown = false; ';
        gGame.shownCount++;
        // strMove += 'gGame.shownCount--; ';
        // strMove += `${elCell}.classList.add('hide'); `;
        renderCell({ i, j }, currCell.minesAroundCount || '');
        // gMoves.push(strMove);
    } else {
        showFirstNegs(board, i, j);
    }
    checkGameOver();
}

function showFirstNegs(board, rowIdx, colIdx) {
    // var strMove = '';
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= board.length) continue;
            var currCell = board[i][j];
            // strMove += `var currCell = ${currCell}; `;
            if (!currCell.isMine && !currCell.isShown && !currCell.isMarked) {
                currCell.isShown = true;
                // strMove += 'currCell.isShown = false; ';
                gGame.shownCount++;
                // strMove += 'gGame.shownCount--; ';
                renderCell({ i, j }, currCell.minesAroundCount || '');
                if (currCell.minesAroundCount > 0) continue;
                expandShown(board, i, j);
            }
        }
    }
    // gMoves.push(strMove);
}

function useHint(i, j) {
    if (!gGame.isOn) return;
    var elList = document.querySelector('.hints-list');
    var strMove = `var elList = ${elList}; `;
    if (!gIsHintMode) {
        elList.lastChild.classList.add('hint-mode');
        strMove += `elList.lastChild.classList.remove('hint-mode'); `;
        gIsHintMode = true;
        strMove += 'gIsHintMode = false; ';
        gMoves.push(strMove);
        return;
    } else if (i || j) {
        renderCellsHint(i, j);
        strMove += `elList.appendChild(${elList.lastChild}); `;
        strMove += 'gIsHintMode = true; ';
        gMoves.push(strMove);
        setTimeout(() => {
            elList.lastChild.remove();
            gIsHintMode = false;
        }, 1000);
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
                var elCell = document.querySelector(`.cell-${i}-${j}`);
                elCell.classList.toggle('hide');
            }
        }
    }
}

function checkNewHighscore() {
    var currScore = gGame.secsPassed;
    var strMove = `var currScore = ${currScore}; `;
    var currLevel = gLevel.size;
    strMove += `var currLevel = ${currLevel}; `;
    var highScore = localStorage.getItem(currLevel);
    strMove += `var highScore = ${highScore}; `;
    if (!highScore || currScore < highScore) {
        localStorage.setItem(currLevel, currScore);
        strMove += `localStorage.setItem(currLevel, highScore); `;
    }
    var elBest = document.querySelector('.highscore span');
    strMove += `var elBest = ${elBest}; `;
    strMove += `elBest.innerText = localStorage.getItem(gLevel.size); `;
    elBest.innerText = localStorage.getItem(gLevel.size);
    gMoves.push(strMove);
}

function safeClick(elBtn) {
    var rndRow;
    var rndCol;
    if (!gGame.isOn) return;
    elBtn.disabled = true;
    var elClicksLeft = document.querySelector('.safe-left span');
    var clicksLeft = +elClicksLeft.innerText;
    if (!clicksLeft) return;
    elClicksLeft.innerText = --clicksLeft;
    var isSafe = false;
    while (!isSafe) {
        rndRow = getRandomIntInclusive(0, gBoard.length - 1);
        rndCol = getRandomIntInclusive(0, gBoard.length - 1);
        var rndCell = gBoard[rndRow][rndCol];
        if (rndCell.isMine || rndCell.isMarked || rndCell.isShown) continue;
        isSafe = true;
    }
    var elCell = document.querySelector(`.cell-${rndRow}-${rndCol}`);
    elCell.classList.remove('hide');
    setTimeout((elBtn) => {
        elCell.classList.add('hide');
        elBtn.disabled = (!clicksLeft || !gGame.isOn) ? true : false;
    }, 2000, elBtn, clicksLeft);
}

function manualMinesPick(elDiv) {
    if (gMines.length) return;
    if (gIsManualMines) {
        gIsManualMines = false;
        elDiv.classList.remove('highlight');
        document.querySelector('.mines-pick').style.display = 'none';
        hideMines(gMines);
        return;
    }
    gIsManualMines = true;
    elDiv.classList.add('highlight');
    document.querySelector('.mines-pick span').innerText = gLevel.mines;
    document.querySelector('.mines-pick').style.display = 'block';
}

function undo() {

}

function handleClick(ev, elCell, i, j) {
    if (ev.buttons === 3) {
        var isHidden = elCell.classList.contains('hide');
        if (isHidden) return;
        gIsHintMode = true;
        showClickOpts(gBoard, i, j);
    } else if (ev.button === 0) {
        cellClicked(elCell, i, j);
    }
    else if (ev.button === 2 && gGame.isOn) {
        cellMarked(elCell, i, j);
    }
}
function showClickOpts(board, rowIdx, colIdx) {
    var minesMarked = 0;
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if ((j < 0 || j >= board.length) ||
                (rowIdx === i && colIdx === j)) continue;
            var currCell = board[i][j];
            if (currCell.isMine &&
                (currCell.isMarked || currCell.isShown)) minesMarked++;
            if (!currCell.isShown && !currCell.isMarked) {
                gRightClickShownCells.push({ i, j });
            }
        }
    }
    var minesAroundCount = board[rowIdx][colIdx].minesAroundCount;
    if (minesMarked === minesAroundCount) {
        gRightClickShownCells = [];
        expandShown(board, rowIdx, colIdx);
        return;
    }
    for (var i = 0; i < gRightClickShownCells.length; i++) {
        var currCell = gRightClickShownCells[i];
        var elCell = document.querySelector(`.cell-${currCell.i}-${currCell.j}`);
        elCell.classList.remove('hide');
        elCell.classList.add('opts');
    }
}

function hideClickOpts(elCell) {
    var isHidden = elCell.classList.contains('hide');
    if (!gIsHintMode || isHidden) return;
    for (var i = 0; i < gRightClickShownCells.length; i++) {
        var currCell = gRightClickShownCells[i];
        var elCell = document.querySelector(`.cell-${currCell.i}-${currCell.j}`);
        elCell.classList.add('hide');
        elCell.classList.remove('opts');
    }
    gRightClickShownCells = [];
    gIsHintMode = false;
}