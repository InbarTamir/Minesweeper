'use strict'
function renderInitPage() {
    document.querySelector('.smiley').innerHTML = SMILEY_INIT;
    document.querySelector('.hints').innerHTML = `<ul class="hints-list" onclick="useHint()"><li>${HINT}</li><li>${HINT}</li><li>${HINT}</li></ul>`;
    document.querySelector('.lives span').innerHTML = `<ul class="lives-list"><li>${LIFE}</li><li>${LIFE}</li><li>${LIFE}</li></ul>`;
    document.querySelector('.timer').innerText = '000';
    document.querySelector('.mines-left span').innerText = gLevel.mines;
    document.querySelector('.best span').innerText = localStorage.getItem(gLevel.size);
    document.querySelector('.safe-left span').innerText = '3';
    document.querySelector('.safe-click').disabled = false;
    document.querySelector('.manually').classList.remove('focus-mode');
    document.querySelector('.manually').classList.remove('highlight');
    document.querySelector('.manually').style.display = 'inline';
}

function renderBoard(board) {
    var strHTML = '<table class="board" oncontextmenu="return false;"><tbody>';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < board.length; j++) {
            var className = `cell cell-${i}-${j}`;
            var currCell = board[i][j];
            if (!currCell.isShown) className += ' hide';
            var cell = currCell.minesAroundCount || '';
            if (currCell.isMine) {
                cell = MINE;
                className += ' mine';
                if (currCell.isShown) className += ' red';
            } else className += ' color';
            if (currCell.isMarked) {
                cell = FLAG;
                className += ' flag';
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
    var elCell = document.querySelector(`.cell-${location.i}-${location.j}`);
    elCell.innerHTML = value;
    if (value === MINE) elCell.classList.add('mine');
    var currCell = gBoard[location.i][location.j];
    if (!currCell.isShown) return;
    elCell.classList.remove('hide');
    renderColor(elCell);
}

function renderColor(elCell) {
    if (elCell.classList.contains('hide')) return;
    switch (elCell.innerHTML) {
        case '1':
            elCell.style.color = 'dodgerBlue';
            break;
        case '2':
            elCell.style.color = 'lawnGreen';
            break;
        case '3':
            elCell.style.color = 'red';
            break;
        case '4':
            elCell.style.color = 'blueViolet';
            break;
        case '5':
            elCell.style.color = 'chocolate';
            break;
        case '6':
            elCell.style.color = 'cyan';
            break;
        case '7':
            elCell.style.color = 'black';
            break;
        case '8':
            elCell.style.color = 'grey';
            break;
    }
}