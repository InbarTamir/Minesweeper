function updateTimer() {
  var timePassed = Date.now() - gStartTime;
  var strTime = '00' + Math.floor(timePassed / 1000);
  var elTimer = document.querySelector('.timer');
  elTimer.innerText = strTime.substr(-3);
}

function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}