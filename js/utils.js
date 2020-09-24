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
      strHTML += `<td class="${className}" onclick="cellClicked(this,${i},${j})" oncontextmenu="cellMarked(this,${i},${j})">${cell}</td>`;
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
  if (!gBoard[location.i][location.j].isShown) return;
  elCell.classList.remove('hide');
  elCell.style.textShadow = '-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black';
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

function showMines() {
  var elMines = document.querySelectorAll('.mine');
  for (var i = 0; i < elMines.length; i++) {
    elMines[i].classList.remove('hide');
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

function getClassName(location) {
	var cellClass = 'cell-' + location.i + '-' + location.j;
	return cellClass;
}

function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}