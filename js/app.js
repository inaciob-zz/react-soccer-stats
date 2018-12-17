class SoccerSchedule extends React.Component {
	state = {
		loaded: false,
		defaultStatus: 'SCHEDULED',
		activeState: 'SCHEDULED',
		schedule: [],
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
			console.log(this.state.schedule)
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
	getStartTime = (utcDate) => {
		// Purpose of this function is to extract the start time for a match (Ex. 20:00) from match.utcDate (default format is YYYY-MM-DDTHH:MM:SSZ), then
		// format that time to match the users' locale using Moment.js & the Internationalization API
		// Approach for retrieving user time zone taken from https://www.quora.com/How-do-you-get-the-extract-users-timezone-using-JavaScript as well as 
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat/resolvedOptions
		const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		return moment(utcDate).tz(userTimezone).format('h:mmA z');
	}
	render() {
		// Formatting for current date heading
		const options = { weekday: 'short', month: 'short', day: 'numeric' };

		// Sort matches by league name first, then by start time
		const sortedMatches = this.state.schedule
								.sort((a, b) => a.competition.name > b.competition.name)
								.map((match, index) => (
									<div key={match.id} className="row match mt-4 p-4">
										<div className={"col-sm-8 " + this.formatClassName(match.competition.name)}>
											<h2 className="match-league">{match.competition.name}</h2>
											
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
											{match.referees.length > 0 && 
												<div className="row mt-3 pt-3">
													<i className="fas fa-user pt-1"></i>
													<span className="pl-3">{match.referees[0].name}</span>
												</div>
											}
										</div>
									</div>
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
				
				{this.state.schedule.length == 0 && 
					<p className="text-center">Sorry, there are no available {this.state.activeState.toLowerCase()} matches right now - please try again soon!</p>
				}

				{sortedMatches}

				<p className="text-center mt-5">Football data provided by the <a href="https://www.football-data.org/" className="text-success" target="_blank">
				Football-Data.org API</a>
				</p>
			</div>
		) 
	}
}

ReactDOM.render(<SoccerSchedule />, document.getElementById('root'));