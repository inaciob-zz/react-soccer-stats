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
	render() {
		// Sort matches by league name first, then by start time
		const sortedMatches = this.state.schedule
								.sort((a, b) => a.competition.name > b.competition.name)
								.map((match, index) => (
									<div key={match.id} className={"match mt-4 p-4 " + this.formatClassName(match.competition.name)}>
										<h2 className="match-league">{match.competition.name}</h2>
									{/* TODO: Adjust this so that user local time is displayed */}
										{match.status == this.state.defaultStatus && 
											<p className="match-details">{match.homeTeam.name} vs {match.awayTeam.name} at {this.getStartTime(match.utcDate)}</p>
										}

										{match.status == 'IN_PLAY' && 
											<p className="match-details">{match.homeTeam.name} vs {match.awayTeam.name}</p>
										}

										{match.status == 'FINISHED' && 
											<p className="match-details">{match.homeTeam.name} vs {match.awayTeam.name}</p>
										}
									</div>
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
					<p className="text-center">Sorry, there are no available matches right now - please try again soon!</p>
				}

				{sortedMatches}

				{/* TODO: Add retrieval of live/finished match data when that status is requested */}

				<p className="text-center mt-5">Football data provided by the <a href="https://www.football-data.org/" className="text-success" target="_blank">
				Football-Data.org API</a>
				</p>
			</div>
		) 
	}
}

ReactDOM.render(<SoccerSchedule />, document.getElementById('root'));