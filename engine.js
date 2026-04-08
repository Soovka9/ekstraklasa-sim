function getAttack(teamName) {
  const team = teamsData.find(t => t.name === teamName);
  return team ? team.attack : 1;
}

function getDefense(teamName) {
  const team = teamsData.find(t => t.name === teamName);
  return team ? team.defense : 1;
}

function getFormModifier(teamName) {
  const team = formData.find(t => t.name === teamName);
  if (!team) return 0;

  const [b, c, d] = team.last3;

  if (b === "W" && c === "W" && d === "W") return 0.05;
  if (b === "L" && c === "L" && d === "L") return -0.05;

  return 0;
}

function poissonRandom(lambda) {
  let L = Math.exp(-lambda);
  let k = 0;
  let p = 1;

  do {
    k++;
    p *= Math.random();
  } while (p > L);

  return k - 1;
}

function getPoissonScore(homeTeam, awayTeam) {
  let attHome = getAttack(homeTeam) + getFormModifier(homeTeam);
  let attAway = getAttack(awayTeam) + getFormModifier(awayTeam); // FIXED

  let defHome = getDefense(homeTeam);
  let defAway = getDefense(awayTeam);

  if (defHome === 0) defHome = 1;
  if (defAway === 0) defAway = 1;
  if (attHome === 0) attHome = 1;
  if (attAway === 0) attAway = 1;

  const baseGoals = 1.5;
  const homeFactor = 1.1;
  const awayFactor = 0.9;

  const lambdaHome = baseGoals * Math.pow(attHome, 1.5) * homeFactor / Math.pow(defAway, 1.5);
  const lambdaAway = baseGoals * Math.pow(attAway, 1.5) * awayFactor / Math.pow(defHome, 1.5);

  return [
    poissonRandom(lambdaHome),
    poissonRandom(lambdaAway)
  ];
}
function animateMatchWithClock(homeTeam, awayTeam, hg, ag) {

  const totalDuration = 10000; // 10 seconds in ms
  const startTime = Date.now();

  let lastMinute = -1;

  let homeScore = 0;
  let awayScore = 0;

  let remainingHome = hg;
  let remainingAway = ag;

  let homeGoalTimes = [];
  let awayGoalTimes = [];

  // generate goal times
  if (hg > 0) {
    for (let i = 0; i < hg; i++) {
      homeGoalTimes.push(Math.random() * totalDuration);
    }
    homeGoalTimes.sort((a, b) => a - b);
  }

  if (ag > 0) {
    for (let i = 0; i < ag; i++) {
      awayGoalTimes.push(Math.random() * totalDuration);
    }
    awayGoalTimes.sort((a, b) => a - b);
  }

  let nextHomeGoal = 0;
  let nextAwayGoal = 0;

  const interval = setInterval(() => {

    let elapsed = Date.now() - startTime;
    if (elapsed > totalDuration) elapsed = totalDuration;

    // ===== CLOCK =====
    let clockMinute = Math.floor((elapsed / totalDuration) * 90);

    if (clockMinute !== lastMinute) {
      document.getElementById("matchClock").textContent = clockMinute + "'";
      lastMinute = clockMinute;
    }

    // ===== HOME GOALS =====
    while (nextHomeGoal < homeGoalTimes.length &&
           elapsed >= homeGoalTimes[nextHomeGoal]) {

      homeScore++;
      document.getElementById("homeScore").textContent = homeScore;
      nextHomeGoal++;
    }

    // ===== AWAY GOALS =====
    while (nextAwayGoal < awayGoalTimes.length &&
           elapsed >= awayGoalTimes[nextAwayGoal]) {

      awayScore++;
      document.getElementById("awayScore").textContent = awayScore;
      nextAwayGoal++;
    }

    // ===== END =====
    if (elapsed >= totalDuration) {
      clearInterval(interval);

      document.getElementById("matchClock").textContent = "90+'";

      setTimeout(() => {
        // small delay like VBA
      }, 300);
    }

  }, 50); // update every 50ms (smooth enough)
}
function simulateNextMatch() {

  // ===== EKSTRAKLASA =====
  let matchIndex = fixturesEkstraklasa.findIndex(
    m => m.homeScore === null && m.awayScore === null
  );

  if (matchIndex !== -1) {

    let match = fixturesEkstraklasa[matchIndex];

    const result = getPoissonScore(match.home, match.away);

    let hg = result[0];
    let ag = result[1];

    let homeTeam = match.home;
    let awayTeam = match.away;

    animateMatchWithClock(homeTeam, awayTeam, hg, ag).then(() => finishMatch(homeTeam, awayTeam, hg, ag));

    match.homeScore = hg;
    match.awayScore = ag;

  }

  // ===== I LIGA =====
  let matchIndexPL = fixturesILiga.findIndex(
    m => m.homeScore === null && m.awayScore === null
  );

  if (matchIndexPL !== -1) {

    let matchPL = fixturesILiga[matchIndexPL];

    const resultPL = getPoissonScore(matchPL.home, matchPL.away);

    let hgPL = resultPL[0];
    let agPL = resultPL[1];

    matchPL.homeScore = hgPL;
    matchPL.awayScore = agPL;
  }
}

function UpdateDashboardTable() {

  for (let i = 0; i < 18; i++) {

    const team = currentEkstraklasaSorted[i];

    // row index in UI (row 0 = header, so teams start from row 1)
    const row = i + 1;

    for (let j = 1; j <= 7; j++) {

      const cell = document.querySelector(`[data-row="${row}"][data-col="${j}"]`);
      if (!cell) continue;

      let value = "";

      switch (j) {
        case 1:
          value = team.name;
          break;
        case 2:
          value = team.RM;
          break;
        case 3:
          value = team.Z;
          break;
        case 4:
          value = team.R;
          break;
        case 5:
          value = team.P;
          break;
        case 6:
          value = team.BZ  + ":" + team.BS;
          break;
        case 7:
          value = team.PKT;
          break;
      }

      cell.textContent = value;

      // styling
      cell.style.fontFamily = "Calibri";
      cell.style.fontSize = "12px";

      // text colouring
      if (row >= 1 && row <= 4) {
        cell.style.color = "black";
      } else {
        cell.style.color = "white";
      }
    }
  }
}

function UpdateFormDisplay() {

  for (let i = 0; i < 18; i++) {

    const row = i + 1;

    // 1. get team name from visual table (column 2 -> data-col="1")
    const nameCell = document.querySelector(`[data-row="${row}"][data-col="1"]`);
    if (!nameCell) continue;

    const teamName = nameCell.textContent;

    // 2. find matching team in currentForm
    const teamForm = currentForm.find(t => t.name === teamName);
    if (!teamForm) continue;

    // 3. get last5 (and reverse for display)
    const formArray = [...teamForm.last5].reverse();

    // 4. get circles in this row
    const circles = document.querySelectorAll(`[data-row="${row}"][data-circle]`);

    // 5. apply colors
    for (let j = 0; j < 5; j++) {

      const result = formArray[j];
      const circle = circles[j];
      if (!circle) continue;

      switch (result) {
        case "W":
          circle.style.backgroundColor = "rgb(0,176,80)";
          break;
        case "D":
          circle.style.backgroundColor = "rgb(141,139,141)";
          break;
        case "L":
          circle.style.backgroundColor = "rgb(192,0,0)";
          break;
        default:
          circle.style.backgroundColor = "rgb(220,220,220)";
      }
    }
  }
}
