function fetchLiveScores() {
    const today = new Date().toISOString().slice(0, 10); // Get today's date in YYYY-MM-DD format
    const url = `https://apiv3.apifootball.com/?action=get_events&match_live=1&from=${today}&to=${today}&APIkey=9fb8bee0735cef7cfc6a79f2871d9e27b1320d0cbb9a5ff9212165e8fe44aafc`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const liveMatches = data.filter(match => match.match_live === "1");
            const groupedMatches = groupMatchesByCountryAndLeague(liveMatches);
            const liveScoresDiv = document.getElementById('live');
            liveScoresDiv.innerHTML = '';

            // Update the spinner
            const countrySpinner = document.getElementById('country-spinner');
            countrySpinner.innerHTML = '';
            const activeCountries = [...new Set(liveMatches.map(match => match.country_name))];
            activeCountries.forEach(country => {
                const option = document.createElement('option');
                option.value = country;
                option.textContent = country;
                countrySpinner.appendChild(option);
            });

            // Get the selected country from localStorage or default to the first active country
            let selectedCountry = localStorage.getItem('selectedCountry');
            if (!selectedCountry || !activeCountries.includes(selectedCountry)) {
                selectedCountry = activeCountries[0];
                localStorage.setItem('selectedCountry', selectedCountry);
            }

            // Update the selected option in the spinner
            countrySpinner.value = selectedCountry;

            // Filter matches by the selected country
            const selectedMatches = liveMatches.filter(match => match.country_name === selectedCountry);

            // Display matches for the selected country only
            for (const countryName in groupedMatches) {
                if (countryName === selectedCountry) {
                    const countryDiv = document.createElement('div');
                    countryDiv.classList.add('country');
                    countryDiv.innerHTML = `<h2>${countryName}</h2>`;
                    const countryLeagues = groupedMatches[countryName];
                    for (const leagueName in countryLeagues) {
                        const leagueDiv = document.createElement('div');
                        leagueDiv.classList.add('league');
                        leagueDiv.innerHTML = `<h3>${leagueName}</h3>`;
                        const matches = countryLeagues[leagueName];
                        matches.forEach(match => {
                            const matchDiv = document.createElement('div');
                            matchDiv.classList.add('live-match');
                            const scoreRingColor = match.goalscorer ? 'green' : 'transparent';
                            const scoreRingClass = match.goalscorer ? 'ring' : '';
                            matchDiv.innerHTML = `
                                <div class="match-info">
                                    <div class="team">
                                        <img src="${match.team_home_badge}" alt="${match.match_hometeam_name} badge">
                                        <span>${match.match_hometeam_name}</span>
                                    </div>
                                    <div class="score">
                                        <span class="${scoreRingClass}" style="border: 2px solid ${scoreRingColor};">${match.match_hometeam_score}</span> -
                                        <span class="${scoreRingClass}" style="border: 2px solid ${scoreRingColor};">${match.match_awayteam_score}</span>
                                    </div>
                                    <div class="team">
                                        <span>${match.match_awayteam_name}</span>
                                        <img src="${match.team_away_badge}" alt="${match.match_awayteam_name} badge"></div>
                                </div>
                                <p class="status">${match.match_status}</p>
                                <p class="time">Time: ${match.match_time}</p>
                            `;
                            leagueDiv.appendChild(matchDiv);
                        });
                        countryDiv.appendChild(leagueDiv);
                    }
                    liveScoresDiv.appendChild(countryDiv);
                }
            }
            playGoalSoundIfPresent(data);
        })
        .catch(error => {
            console.error('Error fetching live scores:', error);
        });
}

document.getElementById('country-spinner').addEventListener('change', function() {
    localStorage.setItem('selectedCountry', this.value);
    fetchLiveScores();
});

function groupMatchesByCountryAndLeague(matches) {
    // Sort countries alphabetically
    matches.sort((a, b) => a.country_name.localeCompare(b.country_name));

    const groupedMatches = {};
    matches.forEach(match => {
        if (!(match.country_name in groupedMatches)) {
            groupedMatches[match.country_name] = {};
        }
        if (!(match.league_name in groupedMatches[match.country_name])) {
            groupedMatches[match.country_name][match.league_name] = [];
        }
        groupedMatches[match.country_name][match.league_name].push(match);
    });
    return groupedMatches;
}

let previousScores = {};

function playGoalSoundIfPresent(matches) {
    matches.forEach(match => {
        const previousScore = previousScores[match.match_id];
        if (previousScore) {
            if (previousScore.home !== match.match_hometeam_score || previousScore.away !== match.match_awayteam_score) {
                const audio = new Audio('Voicy_Goaaaaaal!.mp3');
                audio.play();
                console.log('Goal scored:', match);
                showPopup(match);
            }
        }
        previousScores[match.match_id] = {
            home: match.match_hometeam_score,
            away: match.match_awayteam_score
        };
    });
}

function showPopup(match) {
    const popupDiv = document.createElement('div');
    popupDiv.classList.add('popup');
    popupDiv.innerHTML = `
        <div class="popup-content">
            <span class="close">&times;</span>
            <h3>Goal!</h3>
            <p>${match.match_hometeam_name} ${match.match_hometeam_score} - ${match.match_awayteam_score} ${match.match_awayteam_name}</p>
        </div>`;

    // Append the popup to the body
    document.body.appendChild(popupDiv);

    // Get the close button inside the popup
    const closeBtn = popupDiv.querySelector('.close');

    // Close the popup when the close button is clicked
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(popupDiv);
    });

    // Close the popup after 5 seconds
    setTimeout(() => {
        document.body.removeChild(popupDiv);
    }, 5000);
}

// Fetch live scores every minute
setInterval(fetchLiveScores, 60000); // 60000 milliseconds = 1 minute

// Initial fetch
fetchLiveScores();
