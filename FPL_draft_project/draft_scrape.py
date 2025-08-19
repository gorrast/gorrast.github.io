import requests
import json
import logging
from logging.handlers import RotatingFileHandler
import os

debug = False
current_season = "25/26"

def api_request(league_id):
    url = f"https://draft.premierleague.com/api/league/{league_id}/details"
    
    response = requests.get(url)
    if response.status_code == 200:
        
        return response.json()
    else:
        logging.error(f'Failed API request with status code {response.status_code}')
        quit()

        
def update_data(data, entries, script_dir):
    response = api_request(LEAGUE_ID)
    gameweek = int(response['standings'][0]['matches_drawn']) + int(response['standings'][0]['matches_lost']) + int(response['standings'][0]['matches_won'])

    if max_gw == gameweek:
        logging.info('Latest data available, nothing to update')
        return data
            
    logging.info('Updating data...')

    #print("League Entries:")
    #print(response['league_entries'])

    #print("\n\nStandings:")
    #print(response['standings'])
    
    for player in response['standings']:
        league_entry = player['league_entry']
        #print(player)
        #print(entries)
        name = entries[str(league_entry)]
        
        # Retrieve data fields we are interested in
        points_for = player['points_for'] # plus_minus for
        points_against = player['points_against'] # plus_minus against
        rank = player['rank']
        total = player['total'] # Total points
        gw_score_for = int(points_for) - int(data[current_season][name][gameweek-1]['points_for'])
        gw_score_against = int(points_against) - int(data[current_season][name][gameweek-1]['points_against'])
        wins = int(player['matches_won'])
        draws = int(player['matches_drawn'])
        losses = int(player['matches_lost'])
        
        # Add the new data to the dictionary
        data[current_season][name][gameweek]['rank'] = rank
        data[current_season][name][gameweek]['points_for'] = points_for
        data[current_season][name][gameweek]['points_against'] = points_against
        data[current_season][name][gameweek]['total'] = total
        data[current_season][name][gameweek]['gw_score_for'] = gw_score_for
        data[current_season][name][gameweek]['gw_score_against'] = gw_score_against
        data[current_season][name][gameweek]['wins'] = wins
        data[current_season][name][gameweek]['draws'] = draws
        data[current_season][name][gameweek]['losses'] = losses
    
    # Save the data to file
    save_as_json(data, script_dir)
    
    logging.info('Data updated successfully!')
    
    return data

def save_as_json(data, file_path):

    with open(os.path.join(file_path, 'draft_data.json'), 'w') as file:
        json.dump(data, file)
        
        
    logging.info('Data saved as JSON-file')

def read_json(file_path):

    data_path = os.path.join(file_path, 'draft_data.json')
    entries_path = os.path.join(file_path, 'draft_entries_25_26.json')

    with open(data_path, 'r') as file:
        data = json.load(file)
        
    with open(entries_path, 'r') as file:
        entries = json.load(file)
        
    return data, entries

def update_entries(file_path):
    '''
    For new season
    Get the latest entries from an api request and update the entries variable
    '''
    response = api_request(LEAGUE_ID)
    entries = {}
    for player in response['league_entries']:
        name = player['entry_name']
        entry = player['id']
        entries[entry] = name
        
    filename = f"draft_entries_25_26.json"
    with open(os.path.join(file_path, filename), 'w') as file:
        json.dump(entries, file)
    return entries
    

def configure_logging(path):

    full_path = os.path.join(path, 'draft_data.log')
    # Configure logging with rotating file handler
    log_handler = RotatingFileHandler(full_path,maxBytes=5 * 1024 * 1024,backupCount=1)

    # Set up logging format
    log_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))

    # Get the root logger and set the logging level
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    logger.addHandler(log_handler)
    
def print_response():
    '''
    For understanding of the data coming from the API
    '''
    
    response = api_request(LEAGUE_ID)
    print("Keys level 1: ")
    print(list(response.keys()))
    
    print("\n\nLeague Entries:")
    print(response['league_entries'])
    print("\n\nStandings:")
    print(response['standings'])

    
def new_season(data, script_dir):
    """ 
    Initialize a new season with empty data structures. 
    """

    season_data = {}
    entries = update_entries(script_dir)
    for team_name in entries.values():
        season_data[team_name] = [{} for _ in range(39)] # Initialize with empty dictionaries for each gameweek
        # Initialize gameweek 0
        season_data[team_name][0] = {
            'rank': 1,
            'points_for': 0,
            'points_against': 0,
            'total': 0,
            'wins': 0,
            'draws': 0,
            'losses': 0
        }
    data[current_season] = season_data

    # save the new season data to file
    save_as_json(data, script_dir)
    return data, entries

def main():
    global LEAGUE_ID
    LEAGUE_ID_24_25 = '17526'
    LEAGUE_ID = '110'
    
    #print_response()
    
    
    # Get the directory of the current script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    configure_logging(script_dir)

    """ # Define the path to the .json file relative to the script's location
    file_path = os.path.join(script_dir, 'FPL_draft_project') """

    data, entries = read_json(script_dir)
    
    # New season?
    if current_season not in data:
        # new season, setup new dict
        logging.info("New season, preparing data...")
        data, entries = new_season(data, script_dir)
        
    
    
    for gw in range(39):
        if data[current_season]['Florian AuschWirtz'][gw] == {}: # Find the first empty gameweek
            global max_gw
            max_gw = gw - 1
            break
        if gw == 39:
            logging.info("Season complete, nothing to update")

    data = update_data(data, entries, script_dir)



        
if __name__ == '__main__':
    main()