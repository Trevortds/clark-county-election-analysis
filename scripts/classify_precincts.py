#!/usr/bin/env python3
"""
Classify precincts as urban or rural based on known urban centers in Clark County.
This script analyzes voting data and creates a precinct classification map.
"""

import json
import os
import re
import argparse
from pathlib import Path
from typing import Dict, List, Set, Tuple, Any, Optional
import csv

# Define known urban centers in Clark County
# Las Vegas, North Las Vegas, Henderson, and parts of Paradise are considered urban
# These precincts are rural, as determined by hand, using factors such as: looking at a map, checking the party affiliation of the sitting assemblymember (they are all Rebublicans)
# note, a lot of these are probably more appropriately called "suburban" but here it's the voting patterns that count more than the density
rural_precincts = [
# district 2
3364,
3370,
3373,
3374,
3382,
3557,
3565,
3576,
6033,
6471,
6512,
6514,
6517,
6520,
6522,
6545,
6652,
6695,
6707,
6727,
6728,

# district 4
2065,
2066,
2073,
2352,
2371,
2372,
2384,
2387,
2651,
2675,
2676,
2681,
2682,
2683,
2684,
2691,
2693,
2694,
2695,
2696,
2700,
2703,
2704,
2706,
2711,
3048,
3050,
3051,
3053,
3055,
3065,
3066,
3067,
3418,
3457,
3518,
3532,
3559,
3562,
3578,
3579,
3581,
3584,
3587,
3604,
3606,
3609,
3709,
3712,
3715,
3716,
3717,
3757,
3786,
4420,
4421,
# District 12
2045,
2126,
2444,
2733,
2743,
5042,
5324,
5330,
5403,
5405,
5412,
5417,
5501,
5504,
5513,
5530,
5531,
5547,
5612,
5652,
5656,
7017,
7019,
7024,

# district 13
2056,
2067,
2072,
2079,
2080,
2081,
2082,
2479,
2600,
2602,
2605,
2611,
2614,
2622,
2623,
2625,
2631,
2632,
2633,
2641,
2642,
2643,
2644,
2645,
2654,
2662,
2663,
2666,
2673,
3546,
3547,
3564,
3602,
3607,
3613,
3730,
3735,
# district 17 #this one has a democrat, mrybe it should be removed. its semi-urban, near Nellis AFB
# 2074,
# 2077,
# 2086,
# 2087,
# 2088,
# 2417,
# 2464,
# 2715,
# 2717,
# 2720,
# 2730,
# 2737,
# 4013,
# 4043,
# 4044,
# 4400,
# 4401,
# 4402,
# 4404,
# 4405,
# 4406,
# 4407,
# 4408,
# 4458,
# 4505,
# 4512,
# 4609,
# 4716,
# district 19
2057,
2060,
2445,
2465,
2466,
2469,
2473,
2477,
2503,
2725,
2726,
2731,
2770,
2775,
2776,
5023,
5024,
5025,
5037,
5539,
5550,
5556,
7039,
7040,
7361,
7542,
7582,
7592,
7595,
7601,
7603,

# district 22
1000,
1411,
1514,
1517,
1672,
1674,
7041,
7042,
7352,
7355,
7366,
7378,
7430,
7569,
7570,
7604,
7611,
7625,
7641,
7643,
7651,
7652,
7746,
# District 23
1012,
1067,
1072,
1074,
1394,
1510,
1518,
1525,
1550,
1606,
1671,
1712,
1715,
1717,
1719,
1750,
1751,
1753,
6001,
6003,
6004,
6022,
6154,
6161,
6309,
6374,
6376,
6377,
6378,
6381,
6509,
6528,
6552,
6741,
6742,
6754,
7052,
7545,
7552,
7553,
7562,
# district 35
6036,
6037,
6042,
6490,
6493,
6497,
6530,
6538,
6539,
6540,
6547,
6600,
6609,
6610,
6666,
6731,
6750,
6751,
6753,
# district 36
2042,
2051,
2052,
2053,
2501,
2601,
3535,
3540,
3544,
3571,
3583,
3588,
3605,
3700,
3705,
3706,
3729,
3740,
3781,
3793,
6000,
6023,
6043,
6047,
6365,
6487,
6488,
6498,
6500,
6722,

]



# The rest of Clark County is considered rural
# Including places like Moapa Valley, Mesquite, Bunkerville, etc.

def extract_precinct_number(precinct_portion: str) -> Optional[int]:
    """
    Extract the precinct number from the PrecinctPortion field.
    
    Args:
        precinct_portion: String containing precinct information, e.g., "2048 (2048|00)"
        
    Returns:
        Precinct number as integer or None if not found
    """
    if not precinct_portion:
        return None
        
    # Try to extract the number before the parenthesis
    match = re.search(r'(\d+)\s*\(', precinct_portion)
    if match:
        return int(match.group(1))
    
    # If that fails, try to extract any number
    match = re.search(r'(\d+)', precinct_portion)
    if match:
        return int(match.group(1))
    
    return None

def is_urban_precinct(precinct_number: int) -> bool:
    """
    Determine if a precinct is in an urban area based on its number.
    
    Args:
        precinct_number: Precinct number
        
    Returns:
        True if the precinct is in an urban area, False otherwise
    """
    # Check if the precinct is in our rural precincts list
    if precinct_number in rural_precincts:
        return False
    return True

def process_vote_data(vote_file: str, output_dir: str, max_records: int = None, by_tabulator: bool = True) -> Dict[str, Any]:
    """
    Process vote data and classify precincts as urban or rural.
    
    Args:
        vote_file: Path to the vote data JSON file
        output_dir: Directory to save the output files
        max_records: Maximum number of records to process (for testing)
        
    Returns:
        Dictionary with statistics and classifications
    """
    print(f"Processing {vote_file}...")
    
    # Initialize counters and collections
    urban_precincts_found = set()
    rural_precincts_found = set()
    precinct_classifications = {}
    precinct_vote_counts = {}
    precinct_trump_percentages = {}
    
    # Keep track of tabulator numbers
    tabulator_to_precinct = {}
    
    # Data for the scatter plot (votes per machine vs Trump percentage)
    scatter_data = []
    
    # Tabulator data for machine-level analysis
    tabulator_data = {}
    
    # Count votes by candidate and area type
    urban_votes = {"Harris, Kamala D. (DEM)": 0, "Trump, Donald J. (REP)": 0}
    rural_votes = {"Harris, Kamala D. (DEM)": 0, "Trump, Donald J. (REP)": 0}
    
    # Process the file line by line to avoid loading the entire file into memory
    record_count = 0
    
    with open(vote_file, 'r') as f:
        # Check if the file starts with a JSON array
        first_char = f.read(1)
        if first_char != '[':
            print(f"Error: File {vote_file} does not start with a JSON array")
            return {}
        
        # Reset file pointer and skip the opening bracket
        f.seek(1)
        
        # Process each JSON object in the array
        depth = 0
        current_object = ""
        in_string = False
        escape_next = False
        
        for char in f.read():
            # Handle escape sequences
            if escape_next:
                escape_next = False
                current_object += char
                continue
                
            if char == '\\':
                escape_next = True
                current_object += char
                continue
                
            current_object += char
            
            # Handle string literals
            if char == '"' and not escape_next:
                in_string = not in_string
                continue
                
            # Only process structural characters outside of strings
            if not in_string:
                if char == '{':
                    depth += 1
                elif char == '}':
                    depth -= 1
                    if depth == 0:
                        # We've reached the end of a complete JSON object
                        try:
                            # Parse the JSON object
                            vote_record = json.loads(current_object)
                            
                            # Extract precinct information
                            precinct_portion = vote_record.get("PrecinctPortion", "")
                            precinct_number = extract_precinct_number(precinct_portion)
                            
                            # Extract tabulator information
                            tabulator_num = vote_record.get("TabulatorNum", "")
                                                        # Track votes by tabulator for the scatter plot
                            if by_tabulator and tabulator_num:
                                if tabulator_num not in tabulator_data:
                                    tabulator_data[tabulator_num] = {
                                        "total_votes": 0,
                                        "trump_votes": 0,
                                        "harris_votes": 0,
                                        "precincts": [],
                                        "is_urban": None,  # Will be set based on the majority of its precincts
                                        "vote_history": [],  # List to store the sequence of votes (0 for Harris, 1 for Trump)
                                        "urban_voter": [],  # List to track if each voter is from an urban precinct (1) or rural (0)
                                        "urban_votes": 0,  # Count of votes from urban precincts
                                        "rural_votes": 0   # Count of votes from rural precincts
                                    }
                                
                                # Check if this record has a vote for either Harris or Trump
                                # Note: In the vote record, a value of 1 indicates a vote for that candidate
                                harris_vote = vote_record.get("Harris, Kamala D. (DEM)", 0)
                                trump_vote = vote_record.get("Trump, Donald J. (REP)", 0)
                                
                                # Skip if neither candidate received a vote in this record
                                if harris_vote == 0 and trump_vote == 0:
                                    continue
                                
                                # Determine if this is an urban or rural precinct
                                is_urban_vote = False
                                if precinct_number:
                                    is_urban_vote = is_urban_precinct(precinct_number)
                                    tabulator_data[tabulator_num]["precincts"].append(precinct_number)
                                
                                # Process a Trump vote
                                if trump_vote > 0:
                                    tabulator_data[tabulator_num]["total_votes"] += 1
                                    tabulator_data[tabulator_num]["trump_votes"] += 1
                                    tabulator_data[tabulator_num]["vote_history"].append(1)  # 1 for Trump
                                    tabulator_data[tabulator_num]["urban_voter"].append(1 if is_urban_vote else 0)
                                    
                                    # Update urban/rural counts
                                    if is_urban_vote:
                                        tabulator_data[tabulator_num]["urban_votes"] += 1
                                    else:
                                        tabulator_data[tabulator_num]["rural_votes"] += 1
                                
                                # Process a Harris vote
                                elif harris_vote > 0:
                                    tabulator_data[tabulator_num]["total_votes"] += 1
                                    tabulator_data[tabulator_num]["harris_votes"] += 1
                                    tabulator_data[tabulator_num]["vote_history"].append(0)  # 0 for Harris
                                    tabulator_data[tabulator_num]["urban_voter"].append(1 if is_urban_vote else 0)
                                    
                                    # Update urban/rural counts
                                    if is_urban_vote:
                                        tabulator_data[tabulator_num]["urban_votes"] += 1
                                    else:
                                        tabulator_data[tabulator_num]["rural_votes"] += 1
                            
                            if precinct_number:
                                # Classify the precinct
                                is_urban = is_urban_precinct(precinct_number)
                                
                                # Store classification
                                if is_urban:
                                    urban_precincts_found.add(precinct_number)
                                else:
                                    rural_precincts_found.add(precinct_number)
                                
                                precinct_classifications[precinct_number] = "urban" if is_urban else "rural"
                                
                                # Map tabulator to precinct
                                if tabulator_num:
                                    tabulator_to_precinct[tabulator_num] = precinct_number
                                
                                # Get vote counts for Harris and Trump
                                harris_votes = vote_record.get("Harris, Kamala D. (DEM)", 0)
                                trump_votes = vote_record.get("Trump, Donald J. (REP)", 0)
                                
                                # Update vote counts by area type
                                if is_urban:
                                    urban_votes["Harris, Kamala D. (DEM)"] += harris_votes
                                    urban_votes["Trump, Donald J. (REP)"] += trump_votes
                                else:
                                    rural_votes["Harris, Kamala D. (DEM)"] += harris_votes
                                    rural_votes["Trump, Donald J. (REP)"] += trump_votes
                                
                                # Update precinct vote counts
                                if precinct_number not in precinct_vote_counts:
                                    precinct_vote_counts[precinct_number] = {
                                        "Harris, Kamala D. (DEM)": 0,
                                        "Trump, Donald J. (REP)": 0,
                                        "total": 0
                                    }
                                
                                precinct_vote_counts[precinct_number]["Harris, Kamala D. (DEM)"] += harris_votes
                                precinct_vote_counts[precinct_number]["Trump, Donald J. (REP)"] += trump_votes
                                precinct_vote_counts[precinct_number]["total"] += harris_votes + trump_votes
                            
                            record_count += 1
                            if max_records and record_count >= max_records:
                                break
                                
                        except json.JSONDecodeError as e:
                            # Skip invalid JSON objects
                            print(f"Warning: Could not parse record: {e}")
                        
                        # Reset for the next object
                        current_object = ""
                
                # Skip the comma and whitespace between objects
                if depth == 0 and char in [',', ' ', '\n', '\r', '\t']:
                    current_object = ""
    
    # Calculate Trump percentage for each precinct
    precinct_trump_percentages = {}
    for precinct, votes in precinct_vote_counts.items():
        if votes["total"] > 0:
            trump_percentage = (votes["Trump, Donald J. (REP)"] / votes["total"]) * 100
            precinct_trump_percentages[precinct] = trump_percentage
    
    # Process tabulator data for the scatter plot
    if by_tabulator:
        for tabulator_num, data in tabulator_data.items():
            # Calculate Trump percentage
            trump_percentage = 0.0
            if data["total_votes"] > 0:
                trump_percentage = (data["trump_votes"] / data["total_votes"]) * 100
            
            # Calculate urban percentage
            urban_percentage = 0.0
            total_votes = data["urban_votes"] + data["rural_votes"]
            if total_votes > 0:
                urban_percentage = (data["urban_votes"] / total_votes) * 100
            
            # Determine if the tabulator is primarily urban or rural based on the percentage
            is_urban = urban_percentage >= 50.0
            
            # Store the classification
            data["is_urban"] = is_urban
            data["urban_percentage"] = urban_percentage
            
            # Add to scatter plot data
            scatter_data.append({
                "tabulator": tabulator_num,
                "total_votes": data["total_votes"],
                "trump_votes": data["trump_votes"],
                "trump_percentage": trump_percentage,
                "is_urban": is_urban,
                "urban_percentage": urban_percentage,
                "precincts": list(data["precincts"]),
                "vote_history": data["vote_history"],
                "urban_voter": data["urban_voter"]
            })
    
    # Generate statistics
    urban_total = urban_votes["Harris, Kamala D. (DEM)"] + urban_votes["Trump, Donald J. (REP)"]
    rural_total = rural_votes["Harris, Kamala D. (DEM)"] + rural_votes["Trump, Donald J. (REP)"]
    
    urban_trump_pct = (urban_votes["Trump, Donald J. (REP)"] / urban_total * 100) if urban_total > 0 else 0
    rural_trump_pct = (rural_votes["Trump, Donald J. (REP)"] / rural_total * 100) if rural_total > 0 else 0
    
    # Print statistics
    print("\nClassification Results:")
    print(f"Urban Precincts: {len(urban_precincts_found)}")
    print(f"Rural Precincts: {len(rural_precincts_found)}")
    print(f"\nUrban Votes: {urban_total} (Trump: {urban_trump_pct:.2f}%)")
    print(f"Rural Votes: {rural_total} (Trump: {rural_trump_pct:.2f}%)")
    
    # Save results
    output_base = os.path.basename(vote_file).split('.')[0]
    
    # Save precinct classifications
    classifications_file = os.path.join(output_dir, f"{output_base}_precinct_classifications.json")
    with open(classifications_file, 'w') as f:
        json.dump({
            "urban_precincts": list(urban_precincts_found),
            "rural_precincts": list(rural_precincts_found),
            "precinct_classifications": precinct_classifications,
            "tabulator_to_precinct": tabulator_to_precinct
        }, f, indent=2)
    
    print(f"\nSaved precinct classifications to {classifications_file}")
    
    # Save precinct vote statistics
    stats_file = os.path.join(output_dir, f"{output_base}_precinct_stats.json")
    with open(stats_file, 'w') as f:
        json.dump({
            "urban_votes": urban_votes,
            "rural_votes": rural_votes,
            "precinct_vote_counts": precinct_vote_counts,
            "precinct_trump_percentages": precinct_trump_percentages
        }, f, indent=2)
    
    print(f"Saved precinct statistics to {stats_file}")
    
    # Create a CSV for easy analysis
    csv_file = os.path.join(output_dir, f"{output_base}_precinct_analysis.csv")
    with open(csv_file, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["Precinct", "Classification", "Total Votes", "Harris Votes", "Trump Votes", "Trump Percentage"])
        
        for precinct, classification in precinct_classifications.items():
            if precinct in precinct_vote_counts:
                votes = precinct_vote_counts[precinct]
                trump_pct = precinct_trump_percentages.get(precinct, 0)
                
                writer.writerow([
                    precinct,
                    classification,
                    votes["total"],
                    votes["Harris, Kamala D. (DEM)"],
                    votes["Trump, Donald J. (REP)"],
                    f"{trump_pct:.2f}%"
                ])
    
    print(f"Saved CSV analysis to {csv_file}")
    
    # Save scatter plot data
    if by_tabulator:
        scatter_file = os.path.join(output_dir, f"{output_base}_scatter_data.json")
        with open(scatter_file, 'w') as f:
            json.dump({
                "data": scatter_data,
                "vote_type": output_base,
                "total_tabulators": len(tabulator_data)
            }, f, indent=2)
        
        print(f"Saved scatter plot data to {scatter_file}")
    
    return {
        "urban_precincts": len(urban_precincts_found),
        "rural_precincts": len(rural_precincts_found),
        "urban_trump_pct": urban_trump_pct,
        "rural_trump_pct": rural_trump_pct
    }

def main():
    parser = argparse.ArgumentParser(description='Classify precincts as urban or rural')
    parser.add_argument('vote_file', help='Path to vote data JSON file')
    parser.add_argument('--output-dir', default='data/processed_data', help='Directory to save output files')
    parser.add_argument('--max-records', type=int, help='Maximum number of records to process (for testing)')
    parser.add_argument('--by-precinct', action='store_true', help='Generate statistics by precinct instead of by tabulator')
    
    args = parser.parse_args()
    
    # Ensure output directory exists
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Process the vote data
    process_vote_data(args.vote_file, args.output_dir, args.max_records, not args.by_precinct)

if __name__ == "__main__":
    main()
