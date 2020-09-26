function renderBoard(board) {
    var strHTML = '<table class="board" oncontextmenu="return false;"><tbody>';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < board.length; j++) {
            var className = `cell cell-${i}-${j} hide`;
            var cell = '';
            if (board[i][j].isMine) {
                cell = MINE;
                className += ' mine';
            }
            strHTML += `<td class="${className}" onmousedown="handleClick(event,this,${i},${j})" onmouseup="hideClickOpts(this)">${cell}</td>`;
        }
        strHTML += '</tr>';
    }
    strHTML += '</tbody></table>';
    var elContainer = document.querySelector('.board-container');
    elContainer.innerHTML = strHTML;
}

function renderCell(location, value) {
    var strMove = `var location = ${location}; var value = ${value}; `;
    var elCell = document.querySelector(`.cell-${location.i}-${location.j}`);
    strMove += `var elCell = ${elCell}; `;
    elCell.innerHTML = value;
    strMove += 'elCell.innerHTML = value; ';
    if (value === MINE) {
        elCell.classList.add('mine');
        strMove += `elCell.classList.remove('mine'); `;
    }
    if (!gBoard[location.i][location.j].isShown) {
        gMoves.push(strMove);
        return;
    }
    elCell.classList.remove('hide');
    strMove += `elCell.classList.add('hide'); `;
    strMove += `elCell.style.textShadow = 'none'; `;
    strMove += `elCell.style.color = 'rgba(0, 0, 0, 0)'; `;
    gMoves.push(strMove);
    switch (value) {
        case 1:
            elCell.style.color = 'dodgerBlue';
            break;
        case 2:
            elCell.style.color = 'lawnGreen';
            break;
        case 3:
            elCell.style.color = 'red';
            break;
        case 4:
            elCell.style.color = 'violet';
            break;
        case 5:
            elCell.style.color = 'chocolate';
            break;
        case 6:
            elCell.style.color = 'cyan';
            break;
        case 7:
            elCell.style.color = 'black';
            break;
        case 8:
            elCell.style.color = 'grey';
            break;
    }
}

function showMines(mines) {
    for (var i = 0; i < mines.length; i++) {
        var idx = mines[i];
        gBoard[idx.i][idx.j].isShown = true;
        renderCell(idx, MINE);
    }
}

function hideMines(mines) {
    var elMines = document.querySelectorAll('.mine');
    for (var i = 0; i < elMines.length; i++) {
        elMines[i].classList.add('hide');
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

function updateTimer() {
    var timePassed = Date.now() - gStartTime;
    gGame.secsPassed = Math.floor(timePassed / 1000);
    var strTime = '00' + gGame.secsPassed;
    var elTimer = document.querySelector('.timer');
    elTimer.innerText = strTime.substr(-3);
}

function findIndex(arr, i, j) {
    var searchIdx = arr.findIndex((loc) => loc.i === i && loc.j === j);
    return searchIdx;
}

function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}