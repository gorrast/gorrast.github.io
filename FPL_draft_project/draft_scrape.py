import requests
import json
import logging
from logging.handlers import RotatingFileHandler
import os

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
    for player in response['standings']:
        league_entry = player['league_entry']
        name = entries[league_entry]
        
        # Retrieve data fields we are interested in
        points_for = player['points_for'] # plus_minus for
        points_against = player['points_against'] # plus_minus against
        rank = player['rank']
        total = player['total'] # Total points
        gw_score_for = int(points_for) - int(data[name][gameweek-1]['points_for'])
        gw_score_against = int(points_against) - int(data[name][gameweek-1]['points_against'])
        
        # Add the new data to the dictionary
        data[name][gameweek]['rank'] = rank
        data[name][gameweek]['points_for'] = points_for
        data[name][gameweek]['points_against'] = points_against
        data[name][gameweek]['total'] = total
        data[name][gameweek]['gw_score_for'] = gw_score_for
        data[name][gameweek]['gw_score_against'] = gw_score_against
    
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
    entries_path = os.path.join(file_path, 'draft_entries.json')

    with open(data_path, 'r') as file:
        data = json.load(file)
        
    with open(entries_path, 'r') as file:
        entries = json.load(file)
        
    return data, entries

def configure_logging():
    # Configure logging with rotating file handler
    log_handler = RotatingFileHandler('draft_data.log',maxBytes=5 * 1024 * 1024,backupCount=1)

    # Set up logging format
    log_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))

    # Get the root logger and set the logging level
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    logger.addHandler(log_handler)
    

def main():
    global LEAGUE_ID
    LEAGUE_ID = '17526'
    configure_logging()

    # Get the directory of the current script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    print(script_dir)

    """ # Define the path to the .json file relative to the script's location
    file_path = os.path.join(script_dir, 'FPL_draft_project') """

    data, entries = read_json(script_dir)
    
    for gw in range(len(data['Gorast Gunners'])):
        if data['Gorast Gunners'][gw] == {}:
            global max_gw
            max_gw = gw - 1
            break

    data = update_data(data, entries, script_dir)

    


        
if __name__ == '__main__':
    main()