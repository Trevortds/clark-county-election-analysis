# Election Data Processing

This directory contains scripts to process the large election CSV data into smaller, web-friendly JSON files for our Observable Plot visualizations.

## Setup

1. Install Python requirements:
   ```
   pip install -r requirements.txt
   ```

2. Process the data (this will take some time for large files):

   ```
   # First, analyze the CSV structure to confirm column names
   python process_election_data.py "../data/24G_CVRExport_NOV_Final_Confidential/24G_CVRExport_NOV_Final_Confidential.csv" --analyze

   # After confirming column names are correct in the script, run the full processing
   python process_election_data.py "../data/24G_CVRExport_NOV_Final_Confidential/24G_CVRExport_NOV_Final_Confidential.csv" --output-dir "../data/processed_data"
   ```

3. The script will create JSON files in the output directory:
   - `early_votes.json` - Early voting data (main focus)
   - `mail_votes.json` - Mail-in voting data
   - `election_day_votes.json` - Election Day voting data
   - `summary.json` - Summary statistics

## Important Notes

- You may need to adjust the column names in the script after running with `--analyze` to match your actual CSV structure
- The script processes data in chunks to handle large files efficiently
- For very large files, consider adjusting the `chunk_size` variable in the script
