'use strict';
function updateTimer() {
    var timePassed = Date.now() - gGame.startTime;
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