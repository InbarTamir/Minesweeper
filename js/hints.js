'use strict'
function useHint(i, j) {
    if (!gGame.isOn) return;
    var elList = document.querySelector('.hints-list');
    if (!gGame.isHintMode) {
        elList.lastChild.classList.add('highlight');
        gGame.isHintMode = true;
        return;
    } else if (i || j) {
        renderCellsHint(i, j);
        setTimeout(() => {
            elList.lastChild.remove();
            gGame.isHintMode = false;
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
                gHintCells.push({ i, j });
            }
        }
    }
    var minesAroundCount = board[rowIdx][colIdx].minesAroundCount;
    if (minesMarked === minesAroundCount) {
        saveHistory();
        gHintCells = [];
        expandShown(board, rowIdx, colIdx);
        return;
    }
    for (var i = 0; i < gHintCells.length; i++) {
        var currCell = gHintCells[i];
        var elCell = document.querySelector(`.cell-${currCell.i}-${currCell.j}`);
        elCell.classList.remove('hide');
        elCell.classList.add('opts');
    }
}

function hideClickOpts(elCell) {
    var isHidden = elCell.classList.contains('hide');
    if (!gGame.isHintMode || isHidden) return;
    for (var i = 0; i < gHintCells.length; i++) {
        var currCell = gHintCells[i];
        var elCell = document.querySelector(`.cell-${currCell.i}-${currCell.j}`);
        elCell.classList.add('hide');
        elCell.classList.remove('opts');
    }
    gHintCells = [];
    gGame.isHintMode = false;
}

function safeClick(elBtn) {
    var rndRow;
    var rndCol;
    if (!gGame.isOn) return;
    elBtn.disabled = true;
    var elClicksLeft = document.querySelector('.safe-left span');
    var clicksLeft = +elClicksLeft.innerText;
    if (!clicksLeft) {
        return;
    }
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
    setTimeout(() => {
        if (!gBoard[rndRow][rndCol].isShown) elCell.classList.add('hide');
        elBtn.disabled = (!clicksLeft || !gGame.isOn) ? true : false;
    }, 2000);
}