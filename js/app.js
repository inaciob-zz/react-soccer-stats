class SoccerSchedule extends React.Component {
	state = {
		loaded: false,
		defaultStatus: 'SCHEDULED',
		activeState: 'SCHEDULED',
		schedule: [],
		shouldShowSchedule: true,
		competitionCode: '',
		standings: [],
		shouldShowStandings: false,
		today: new Date
	}
	// Default status for displayed matches is SCHEDULED
	componentDidMount() {
		this.getMatches(this.state.defaultStatus);
	}
	getMatches = (status) => {
		axios({
			url: 'https://api.football-data.org/v2/matches?status=' + status,
			method: 'get',
			headers: {
				'X-Auth-Token': config.apiKey
			}
		}).then(response => {
			if(response.status == 200) {
				this.setState({
					loaded: true,
					schedule: response.data.matches,
					shouldShowSchedule: true
				})
			}
		}).catch(function(error) {
			console.log(error);
		})
	}
	handleClick = (event) => {
		event.preventDefault();
		const status = event.target.id.toUpperCase();
		this.getMatches(status);
		this.setState({
			activeState: status,
			shouldShowSchedule: true,
			shouldShowStandings: false
		})
	}
	formatClassName = (competition) => {
		return competition.replace(/\s+/g, '-').toLowerCase();
	}
	getStartTime = (isoDate) => {
		// Purpose of this function is to extract only the start time for a match (Ex. 20:00) from match.utcDate (default format is YYYY-MM-DDTHH:MM:SSZ)
		const preFormattedStartTime = isoDate.slice(0, -1).split('T')[1];
		return preFormattedStartTime.substring(0, preFormattedStartTime.lastIndexOf(':'))
	}
	getLeagueCode = (event) => {
		event.preventDefault();
		const currentLeague = event.currentTarget.attributes['data-league'].value;

		switch(currentLeague) {
			case 'UEFA Champions League':
				return 'CL';
				break;
			case 'Primeira Liga':
				return 'PPL';
				break;
			case 'Premier League':
				return 'PL';
				break;
			case 'Eredivisie':
				return 'DED';
				break;
			case 'Bundesliga':
				return 'BL1';
				break;
			case 'Ligue 1':
				return 'FL1';
				break;
			case 'Serie A':
				return 'SA';
				break;
			case 'Primera Division':
				return 'PD';
				break;
			case 'Championship':
				return 'ELC';
				break;
			case 'World Cup':
				return 'WC';
				break;
			case 'European Cup of Nations':
				return 'EC';
				break;
			default:
				return 'error';
				break;
		}
	}
	getStandings = (event) => {
		let league = this.getLeagueCode(event);
		
		axios({
			url: 'https://api.football-data.org/v2/competitions/' + league + '/standings?standingType=TOTAL',
			method: 'get',
			headers: {
				'X-Auth-Token': config.apiKey
			}
		}).then(response => {
			if(response.status == 200) {
				this.setState({
					loaded: true,
					competitionCode: response.data.competition.code,
					shouldShowSchedule: false,
					standings: (response.data.competition.code == 'CL') ? response.data.standings : response.data.standings[0].table,
					shouldShowStandings: true
				})
			}
		}).catch(function(error) {
			console.log(error);
		})
	}
	render() {
		// Formatting for current date heading
		const options = { weekday: 'short', month: 'short', day: 'numeric' };

		// Sort matches by league name first, then by start time
		const sortedMatches = this.state.schedule
								.sort((a, b) => a.competition.name > b.competition.name)
								.map((match, index) => (
									<div key={match.id} className={"row match mt-4 p-4 " + (this.state.shouldShowSchedule ? 'visible' : 'hidden')}>
										<div className={"col-sm-8 " + this.formatClassName(match.competition.name)}>
											<h2 className="match-league">{match.competition.name}</h2>
											{/* TODO: Adjust this so that user local time is displayed */}
											{match.status == this.state.defaultStatus && 
												<p className="match-details mt-4">{match.homeTeam.name} vs {match.awayTeam.name} at {this.getStartTime(match.utcDate)}</p>
											}

											{(match.status == 'IN_PLAY' || match.status == 'PAUSED' || match.status == 'FINISHED') && 
												// NOTE: The conditions here are due to when scores data becomes available
												// The ternary logic here is that if the current match status is 'IN_PLAY' or 'FINISHED', then 
												// display the fullTime score which is provided as the source of truth per the API docs until 
												// an official halftime score is provided
												<p className="match-details mt-4">
													<React.Fragment>
														{match.homeTeam.name}
														<span className="fs-16 badge badge-success m-1 ml-3 p-2">{
															(match.status == 'IN_PLAY' || match.status == 'FINISHED') ? 
																match.score.fullTime.homeTeam : match.score.halfTime.homeTeam
														}
														</span>
														<span className="fs-16 badge badge-success m-1 mr-3 p-2">{
															(match.status == 'IN_PLAY' || match.status == 'FINISHED') ? 
																match.score.fullTime.awayTeam : match.score.halfTime.awayTeam
														}
														</span>
														{match.awayTeam.name}
													</React.Fragment>
												</p>
											}
										</div>
										<div className="col-sm-4">
											<div className="row mt-2 pt-1">
												<div className="hoverable-icon" data-league={match.competition.name} onClick={this.getStandings}>
													<i className="fas fa-table"></i>
													<span className="hoverable-icon-desc pl-3">View Table</span>
												</div>
											</div>
											
											{match.referees.length > 0 && 
												<div className="row mt-3 pt-3">
													<i className="fas fa-user pt-1"></i>
													<span className="pl-3">{match.referees[0].name}</span>
												</div>
											}
										</div>
									</div>
								))

		const leagueTable = (this.state.competitionCode == 'CL' || this.state.competitionCode == 'WC' || this.state.competitionCode == 'EC') ? 
									this.state.standings
										.map((group, index) => {
											return (
												<tr key={group.group}>
													<th scope="row">
														{group.group.replace('_', ' ')}
														{
															group.table.map((team, innerIndex) => {
																return (
																	<p key={team.position} className="mt-4">{team.position}</p>
																)
															})
														}
													</th>
													{/* TODO: Make this more DRY by using something like Object.keys to render in a loop */}
													<td className="pt-5">
														{
															group.table.map((team, innerIndex) => {
																return (
																	<React.Fragment key={team.team.id}>
																		<p>{team.team.name}</p>
															    	</React.Fragment>
																)
															})
														}
													</td>
													<td className="pt-5">
														{
															group.table.map((team, innerIndex) => {
																return (
																	<p key={team.team.id} className="mt-4">{team.playedGames}</p>
																)
															})
														}
													</td>
													<td className="pt-5">
														{
															group.table.map((team, innerIndex) => {
																return (
																	<p key={team.team.id} className="mt-4">{team.won}</p>
																)
															})
														}
													</td>
													<td className="pt-5">
														{
															group.table.map((team, innerIndex) => {
																return (
																	<p key={team.team.id} className="mt-4">{team.draw}</p>
																)
															})
														}
													</td>
													<td className="pt-5">
														{
															group.table.map((team, innerIndex) => {
																return (
																	<p key={team.team.id} className="mt-4">{team.lost}</p>
																)
															})
														}
													</td>
													<td className="pt-5">
														{
															group.table.map((team, innerIndex) => {
																return (
																	<p key={team.team.id} className="mt-4">{team.points}</p>
																)
															})
														}
													</td>
												</tr>
											)
										}) : 
									this.state.standings
										.map((club, index) => (
											<tr key={club.position}>
										    	<th scope="row">{club.position}</th>
										    	<td>{club.team.name}</td>
										    	<td>{club.playedGames}</td>
										    	<td>{club.won}</td>
										    	<td>{club.draw}</td>
										    	<td>{club.lost}</td>
										    	<td>{club.points}</td>
										    </tr>
										))
									

		return (
			<div className="container">
				<h1 className="main-heading mt-4 mb-5 text-center">Games today: {this.state.today.toLocaleDateString(navigator.language, options)}</h1>
				
				<div className="btn-group-filters btn-group btn-group-lg d-flex justify-content-center mb-5" role="group" aria-label="Match filters">
					<button type="button" id="scheduled" onClick={this.handleClick} 
							className={"match-filter-btn btn btn-outline-success " + (this.state.activeState == this.state.defaultStatus ? 'active' : '')}>
								Scheduled
					</button>
				  	<button type="button" id="live" onClick={this.handleClick} 
				  			className={"match-filter-btn btn btn-outline-success " + (this.state.activeState == 'LIVE' ? 'active' : '')}>
				  				Live
				  	</button>
				  	<button type="button" id="finished" onClick={this.handleClick} 
				  			className={"match-filter-btn btn btn-outline-success " + (this.state.activeState == 'FINISHED' ? 'active' : '')}>
				  				Finished
				  	</button>
				</div>

				{this.state.shouldShowStandings && 
					<a className="site-link text-success" onClick={this.handleClick}>Return to schedule</a>
				}
				
				{this.state.schedule.length == 0 && 
					<p className="text-center">Sorry, there are no available {this.state.activeState.toLowerCase()} matches right now - please try again soon!</p>
				}

				{sortedMatches}

				{this.state.standings.length > 0 && 
					<div className={"row mt-4 " + (this.state.shouldShowStandings ? 'visible' : 'hidden')}>
						<table className="table table-bordered table-striped">
							<thead className="thead-dark">
								<tr>
							      	<th scope="col">Position</th>
							      	<th scope="col">Team</th>
							      	<th scope="col">Played</th>
							      	<th scope="col">Won</th>
							      	<th scope="col">Drawn</th>
							      	<th scope="col">Lost</th>
							      	<th scope="col">Points</th>
							    </tr>
							</thead>
							<tbody>
								{leagueTable}
							</tbody>
						</table>
					</div>
				}

				<p className="text-center mt-5">Football data provided by the <a href="https://www.football-data.org/" className="text-success" target="_blank">
				Football-Data.org API</a>
				</p>
			</div>
		) 
	}
}

ReactDOM.render(<SoccerSchedule />, document.getElementById('root'));