class SoccerSchedule extends React.Component {
	state = {
		loaded: false,
		defaultStatus: 'SCHEDULED',
		activeState: 'SCHEDULED',
		schedule: [],
		standings: [],
		standingsVisible: false,
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
					schedule: response.data.matches
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
			activeState: status
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
	getStandings = () => {
		// TODO: Retrieve standings for the competition a user has requested to see the table for (remove hard-coding of PL as competition code)
		axios({
			url: 'https://api.football-data.org/v2/competitions/PL/standings?standingType=TOTAL',
			method: 'get',
			headers: {
				'X-Auth-Token': config.apiKey
			}
		}).then(response => {
			if(response.status == 200) {
				this.setState({
					loaded: true,
					standings: response.data.standings[0].table,
					standingsVisible: true
				})
			}
		}).catch(function(error) {
			console.log(error);
		})
	}
	render() {
		// Sort matches by league name first, then by start time
		const sortedMatches = this.state.schedule
								.sort((a, b) => a.competition.name > b.competition.name)
								.map((match, index) => (
									<div key={match.id} className="row match mt-4 p-4">
										<div className={"col-sm-8 " + this.formatClassName(match.competition.name)}>
											<h2 className="match-league">{match.competition.name}</h2>
										{/* TODO: Adjust this so that user local time is displayed */}
											{match.status == this.state.defaultStatus && 
												<p className="match-details">{match.homeTeam.name} vs {match.awayTeam.name} at {this.getStartTime(match.utcDate)}</p>
											}

											{(match.status == 'IN_PLAY' || match.status == 'PAUSED') && 
												<p className="match-details">{match.homeTeam.name} vs {match.awayTeam.name}</p>
											}

											{match.status == 'FINISHED' && 
												<p className="match-details">{match.homeTeam.name} vs {match.awayTeam.name}</p>
											}
										</div>
										<div className="col-sm-4">
											<div className="row">
												<div className="hoverable-icon" onClick={this.getStandings}>
													<span className="hoverable-icon-desc">View Table</span>
													<div className="clearfix"></div>
													<i className="fas fa-table"></i>
												</div>
											</div>
										</div>
									</div>
								))

		const leagueTable = this.state.standings
								.map((club, index) => (
									<tr key={club.position}>
								    	<th scope="row">{club.position}</th>
								    	<td>
								    		<img src={club.team.crestUrl} className="club-crest mr-4" />
								    		{club.team.name}
								    	</td>
								    	<td>{club.playedGames}</td>
								    	<td>{club.won}</td>
								    	<td>{club.draw}</td>
								    	<td>{club.lost}</td>
								    	<td>{club.points}</td>
								    </tr>
								))


		return (
			<div className="container">
				<h1 className="main-heading mt-4 mb-5 text-center">Games today: {this.state.today.toDateString()}</h1>
				
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
				
				{this.state.schedule.length == 0 && 
					<p className="text-center">Sorry, there are no available {this.state.activeState.toLowerCase()} matches right now - please try again soon!</p>
				}

				{sortedMatches}

				{this.state.standings.length > 0 && 
					<div className="row mt-4">
						<table className={"table table-bordered bg-white " + (this.state.standingsVisible ? 'visible' : 'invisible')}>
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

				{/* TODO: Add retrieval of live/finished match data when that status is requested */}

				<p className="text-center mt-5">Football data provided by the <a href="https://www.football-data.org/" className="text-success" target="_blank">
				Football-Data.org API</a>
				</p>
			</div>
		) 
	}
}

ReactDOM.render(<SoccerSchedule />, document.getElementById('root'));