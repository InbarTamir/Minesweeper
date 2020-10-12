'use strict';
function locateMines(board) {
    var mines = [];
    for (var i = 0; i < gLevel.mines; i++) {
        var length = gEmptyCells.length;
        var rndIdx = getRandomIntInclusive(0, length - 1);
        var rndCell = gEmptyCells.splice(rndIdx, 1)[0];
        board[rndCell.i][rndCell.j].isMine = true;
        mines.push(rndCell);
        var location = { i: rndCell.i, j: rndCell.j };
        renderCell(location, MINE);
    }
    return mines;
}

function setMinesAroundCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {
            var currCell = board[i][j];
            if (!currCell.isMine) {
                currCell.minesAroundCount = countMinesAround(board, i, j);
                if (currCell.minesAroundCount) {
                    var searchIdx = findIndex(gEmptyCells, i, j);
                    if (searchIdx >= 0) gEmptyCells.splice(searchIdx, 1);
                    renderCell({ i, j }, currCell.minesAroundCount);
                }
            }
        }
    }
}

function countMinesAround(board, rowIdx, colIdx) {
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

function manualMinesPick(elDiv) {
    if (gGame.isManualMines) {
        document.querySelector('.mines-left span').innerText = gLevel.mines;
        hideManualMines(gMines);
    }
    elDiv.classList.toggle('highlight');
    gGame.isManualMines = !gGame.isManualMines;
}

function hideManualMines() {
    var elMines = document.querySelectorAll('.mine');
    for (var i = 0; i < elMines.length; i++) {
        elMines[i].classList.add('hide');
    }
}

function explodeAllMines(mines) {
    for (var i = 0; i < mines.length; i++) {
        var boom = new Audio('sounds/boom.wav');
        boom.play();
        var idx = mines[i];
        gBoard[idx.i][idx.j].isShown = true;
        renderCell(idx, MINE);
    }
}