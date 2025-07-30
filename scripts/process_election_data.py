#!/usr/bin/env python3
"""
Process large election CSV data into smaller JSON files for web visualization.
This script extracts voting data by category (early, mail, election day) and
creates optimized JSON files for use with Observable Plot visualizations.
"""

import pandas as pd
import json
import os
import re
import sys
import argparse
import numpy as np
from pathlib import Path
import traceback

# all headers:
all_metadata_headers= "CvrNumber,TabulatorNum,BatchId,RecordId,ImprintedId,CountingGroup,PrecinctPortion,BallotType,ImagePath,SessionType,VoterFlag,Modified,CardInfo,PdfName,UniqueVotingIdentifier,VotingSessionIdentifier".split(',')

def create_custom_headers(first_rows, candidate_start_idx=16):
    """
    Creates custom headers from the complex multi-row header structure in the CSV.
    
    Args:
        first_rows: DataFrame containing the first few rows of the CSV
        candidate_start_idx: Index where candidate columns start (default: 16)
        
    Returns:
        custom_headers: List of custom headers
        counting_group_col: Name of the counting group column
    """
    # Based on verified structure:
    # Row 0: Election name
    # Row 1: Race Name 
    # Row 2: Candidate names (header=None means this is 0-indexed)
    # Row 3: Column headers like CvrNumber, CountingGroup, etc., then Party affiliations (DEM, REP, etc.)
    # Row 4+: Actual data starts
    
    # Extract header information
    candidate_row = first_rows.iloc[2].tolist()
    metadata_row = first_rows.iloc[3].tolist()
    party_row = first_rows.iloc[3].tolist()  # Party info is also in row 3
    
    # Find the CountingGroup column in the metadata row
    counting_group_col = 'CountingGroup'  # Default
    counting_group_idx = None
    
    for i, col in enumerate(metadata_row):
        if isinstance(col, str) and 'count' in col.lower() and 'group' in col.lower():
            counting_group_idx = i
            counting_group_col = col
            print(f"Found counting group column: '{col}' at index {i}")
            break
    
    if counting_group_idx is None:
        print("WARNING: Could not find CountingGroup column. Will use 'CountingGroup' as the column name.")
    
    # Create custom headers for the CSV
    custom_headers = []
    header_counts = {}  # Track occurrences of each header to avoid duplicates
    
    # Process each column to create headers
    for i in range(len(metadata_row)):
        if i < candidate_start_idx:
            # For metadata columns, use metadata_row
            # Check if this is a known metadata header
            header = str(metadata_row[i]) if pd.notna(metadata_row[i]) and metadata_row[i] != '' else f"Column_{i}"
            # Clean the header
            header = header.strip()
            
            # Check if this header matches a known metadata field
            for known_header in all_metadata_headers:
                if known_header.lower() in header.lower():
                    header = known_header  # Use the standardized version
                    break
        else:
            # For candidate columns, combine candidate name with party
            candidate = str(candidate_row[i]) if pd.notna(candidate_row[i]) and candidate_row[i] != '' else ""
            party = str(party_row[i]) if pd.notna(party_row[i]) and party_row[i] != '' else ""
            
            # Clean up the strings
            candidate = candidate.strip()
            party = party.strip()
            
            if candidate and candidate.lower() != "nan":
                if party and party.lower() != "nan":
                    header = f"{candidate} ({party})"
                else:
                    header = candidate
            else:
                header = f"Column_{i}"
        
        # Ensure header is unique
        base_header = str(header)
        if base_header in header_counts:
            header_counts[base_header] += 1
            header = f"{base_header}_{header_counts[base_header]}"
        else:
            header_counts[base_header] = 0
        
        custom_headers.append(header)
    
    print(f"Created {len(custom_headers)} custom headers")
    
    # Print some sample headers for verification
    print("Sample metadata headers:", custom_headers[:candidate_start_idx][:5])
    print("Sample candidate headers:", custom_headers[candidate_start_idx:candidate_start_idx+5])
    
    return custom_headers, counting_group_col


def process_csv_chunks(input_file, custom_headers, candidate_start_idx, counting_group_col, output_dir):
    """
    Process the CSV data in chunks and generate output JSON files.
    
    Args:
        input_file: Path to the CSV file
        custom_headers: List of custom column headers
        candidate_start_idx: Index where candidate columns start
        counting_group_col: Column containing vote type information
        output_dir: Directory to save output files
    """
    # Regular expressions for vote type patterns - keep these simple for accuracy
    vote_type_patterns = {
        'mail': re.compile('mail', re.IGNORECASE),
        'early': re.compile('early', re.IGNORECASE),
        'election_day': re.compile('election', re.IGNORECASE)
    }
    
    # Create dictionaries to hold the processed data by vote type
    voting_data = {
        'early': [],
        'mail': [],
        'election_day': [],
        'other': []
    }
    
    # Process the CSV in chunks to handle large files
    chunk_size = 1000
    total_rows = 0
    
    # Initialize candidate column lists
    president_cols = []
    # Senate candidate columns we care about
    rosen_cols = []
    brown_cols = []
    # Keep track of specific president columns for summary later
    harris_cols = []
    trump_cols = []
    
    # Read the CSV, skipping the first 4 rows which contain our header information
    # Note: The data actually starts at row 5 (0-indexed would be 4)
    for chunk_num, chunk in enumerate(pd.read_csv(input_file, skiprows=4, names=custom_headers, chunksize=chunk_size)):
        try:
            print(f"Processing chunk {chunk_num+1}...")
            total_rows += len(chunk)
            
            # Clean data: replace Excel-style quotations and convert everything to strings
            for col in chunk.columns:
                if chunk[col].dtype == 'object':
                    chunk[col] = chunk[col].astype(str)
                    chunk[col] = chunk[col].str.replace(r'^="(.*)"$', r'\1', regex=True)
            
            # Find the important metadata columns
            metadata_cols = []
            
            # Find matches in our actual columns (case-insensitive)
            for col in chunk.columns[:candidate_start_idx]:
                for meta in all_metadata_headers:
                    if meta.lower() in col.lower():
                        metadata_cols.append(col)
                        break
            
            # Only print metadata columns once
            if chunk_num == 0:
                print(f"Found metadata columns: {metadata_cols}")
            
            # Find the CountingGroup column if it exists
            if chunk_num == 0 and counting_group_col not in chunk.columns:
                counting_group_cols = [col for col in metadata_cols if ('count' in col.lower() and 'group' in col.lower()) or 'mode' in col.lower()]
                if counting_group_cols:
                    counting_group_col = counting_group_cols[0]
                    print(f"Using '{counting_group_col}' as the counting group column")
                else:
                    print("WARNING: Could not find a counting group column in the data")
                    # Create a dummy column for testing
                    chunk['DummyCountingGroup'] = 'Mail'
                    counting_group_col = 'DummyCountingGroup'
                    metadata_cols.append(counting_group_col)
            
            # Find presidential candidate columns (only do this once)
            if not president_cols and chunk_num == 0:
                all_candidate_cols = chunk.columns[candidate_start_idx:].tolist()
                
                # Detect presidential candidates with flexible matching
                harris_cols = [col for col in all_candidate_cols if 'harris' in col.lower() and 'kamala' in col.lower()]
                trump_cols = [col for col in all_candidate_cols if 'trump' in col.lower() and 'donald' in col.lower()]

                # Detect senate candidates Jacky Rosen and Sam Brown
                rosen_cols = [col for col in all_candidate_cols if 'rosen' in col.lower() and 'jacky' in col.lower()]
                brown_cols = [col for col in all_candidate_cols if 'brown' in col.lower() and 'sam' in col.lower()]

                # Combine all relevant candidate columns for processing
                candidate_cols = harris_cols + trump_cols + rosen_cols + brown_cols
                if candidate_cols:
                    print(f"Found candidate columns: {candidate_cols}")
                else:
                    # Fallback: use first few candidate columns
                    candidate_cols = all_candidate_cols[:10] if len(all_candidate_cols) >= 10 else all_candidate_cols
                    print(f"No specific candidates found. Using fallback columns: {candidate_cols}")
            
            # Process the chunk and extract vote data by type
            # Note: this mutates voting_data in place
            process_chunk_data(chunk, counting_group_col, vote_type_patterns, candidate_cols, metadata_cols, voting_data)
            
        except Exception as e:
            print(f"Error processing chunk {chunk_num+1}: {e}")
            traceback.print_exc()
            continue
    
    # Create output from the processed data
    summary = generate_output_files(voting_data, candidate_cols, metadata_cols, total_rows, output_dir)

    # Generate president–senate combination summary
    combo_counts = generate_pres_senate_combo_summary(
        voting_data,
        trump_cols=trump_cols,
        harris_cols=harris_cols,
        rosen_cols=rosen_cols,
        brown_cols=brown_cols,
        output_dir=output_dir
    )
    summary["pres_senate_combo_counts"] = combo_counts
    return summary


def process_chunk_data(chunk, counting_group_col, vote_type_patterns, president_cols, metadata_cols, voting_data):
    """
    Process a single chunk of data and extract vote information.
    
    Args:
        chunk: DataFrame chunk to process
        counting_group_col: Column with vote type information
        vote_type_patterns: Dictionary of regex patterns for vote types
        president_cols: List of presidential candidate columns
        metadata_cols: List of metadata columns to include
        voting_data: Dictionary to append processed vote data to
    """
    if counting_group_col in chunk.columns:
        # Process each vote type category
        for vote_category, pattern in vote_type_patterns.items():
            # Create a clean mask for this vote type
            mask = chunk[counting_group_col].astype(str).str.contains(pattern, na=False, regex=True)
            matching_rows = mask.sum()
            
            if matching_rows > 0:
                # Get the subset of data for this vote type
                category_chunk = chunk[mask].copy()
                
                # Process each row
                vote_records = []
                for _, row in category_chunk.iterrows():
                    # Create a record with metadata
                    record = {}
                    for col in metadata_cols:
                        if col in row:
                            # Clean the data value
                            val = row[col]
                            if pd.isna(val):
                                val = None
                            else:
                                # Remove quotes if they exist
                                val = str(val).strip('=""')
                            record[col] = val
                    
                    # Add candidate votes
                    for col in president_cols:
                        if col in row:
                            val = row[col]
                            # Convert vote values to a clean format
                            if pd.isna(val):
                                record[col] = 0
                            elif val == '1' or val == 1 or str(val).lower() == 'yes' or str(val).lower() == 'true':
                                record[col] = 1
                            else:
                                record[col] = 0
                    
                    # Add the record if it has valid data
                    if record:
                        vote_records.append(record)
                
                # Add to the appropriate category data
                voting_data[vote_category].extend(vote_records)
        
        # Check for any remaining votes that don't match our patterns
        combined_pattern = '|'.join(pattern.pattern for pattern in vote_type_patterns.values())
        all_categorized = chunk[counting_group_col].astype(str).str.contains(combined_pattern, na=False, regex=True, case=False)
        not_categorized = ~all_categorized
        
        if not_categorized.any():
            other_chunk = chunk[not_categorized].copy()
            print("Found some votes that don't match our patterns", not_categorized.sum(), other_chunk[counting_group_col].unique())
            
            # Process these the same way as above
            vote_records = []
            for _, row in other_chunk.iterrows():
                record = {}
                for col in metadata_cols:
                    if col in row:
                        val = row[col]
                        if pd.isna(val):
                            val = None
                        else:
                            val = str(val).strip('=""')
                        record[col] = val
                
                # Add candidate votes
                for col in president_cols:
                    if col in row:
                        val = row[col]
                        if pd.isna(val):
                            record[col] = 0
                        elif val == '1' or val == 1 or str(val).lower() == 'yes' or str(val).lower() == 'true':
                            record[col] = 1
                        else:
                            record[col] = 0
                
                if record:
                    vote_records.append(record)
            
            voting_data['other'].extend(vote_records)
    else:
        # Fallback if counting group column is missing
        vote_records = []
        for _, row in chunk.iterrows():
            record = {}
            for col in metadata_cols:
                if col in row:
                    val = row[col]
                    record[col] = None if pd.isna(val) else str(val).strip('=""')
            
            # Add candidate votes
            for col in president_cols:
                if col in row:
                    val = row[col]
                    if pd.isna(val):
                        record[col] = 0
                    elif val == '1' or val == 1 or str(val).lower() == 'yes' or str(val).lower() == 'true':
                        record[col] = 1
                    else:
                        record[col] = 0
            
            if record:
                vote_records.append(record)
        
        voting_data['other'].extend(vote_records)


def process_election_data_complex_headers(input_file, output_dir, counting_group_col='CountingGroup'):
    """
    Process election data CSV with complex multi-row header structure.
    
    Args:
        input_file: Path to the large CSV file
        output_dir: Directory to save the processed JSON files
        counting_group_col: Column containing vote type information (early, mail, etc)
    """
    try:
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        print(f"Processing {input_file}...")
        
        # First, look at the raw data to understand its structure
        print("Reading header structure...")
        
        # Read the first few rows to understand the structure
        first_rows = pd.read_csv(input_file, header=None, nrows=5)
        print(f"CSV shape: {first_rows.shape}")
        
        # Determine where candidate columns start (after metadata columns)
        # Based on sample data analysis, candidates start at column 16
        candidate_start_idx = 16
        print(f"Candidate columns start at index {candidate_start_idx}")
        
        # Create custom headers
        custom_headers, counting_group_col = create_custom_headers(first_rows, candidate_start_idx)
        
        # Now process the CSV data with our custom headers
        print("\nProcessing election data...")
        
        # Process the CSV in chunks and generate output files
        return process_csv_chunks(input_file, custom_headers, candidate_start_idx, counting_group_col, output_dir)
        
    except Exception as e:
        print(f"Error processing election data: {e}")
        traceback.print_exc()
        return None


def generate_pres_senate_combo_summary(voting_data, trump_cols, harris_cols, rosen_cols, brown_cols, output_dir):
    """Generate a summary of ballot combinations between presidential and senate candidates.

    The summary includes counts for:
        - trump-rosen
        - trump-brown
        - trump-none
        - harris-rosen
        - harris-brown
        - harris-none

    Args:
        voting_data: Dict of vote records by vote type.
        trump_cols, harris_cols, rosen_cols, brown_cols: Lists of column names corresponding to each candidate.
        output_dir: Directory to save the summary JSON file.
    Returns:
        Dictionary mapping combination name to count.
    """
    combo_keys = [
        "trump-rosen",
        "trump-brown",
        "trump-none",
        "harris-rosen",
        "harris-brown",
        "harris-none",
    ]

    # Overall counts
    combo_counts = {k: 0 for k in combo_keys}
    # Per-vote-type counts
    per_vote_type_counts = {vt: {k: 0 for k in combo_keys} for vt in voting_data.keys()}

    has_vote = lambda record, cols: any(record.get(col, 0) == 1 for col in cols)

    for vote_type, records in voting_data.items():
        for record in records:
            pres_choice = None
            senate_choice = None

            if has_vote(record, trump_cols):
                pres_choice = "trump"
            elif has_vote(record, harris_cols):
                pres_choice = "harris"

            if has_vote(record, rosen_cols):
                senate_choice = "rosen"
            elif has_vote(record, brown_cols):
                senate_choice = "brown"
            else:
                senate_choice = "none"

            if pres_choice:
                key = f"{pres_choice}-{senate_choice}"
                if key in combo_counts:
                    combo_counts[key] += 1
                    per_vote_type_counts[vote_type][key] += 1

    # Build final structure including both views
    summary_dict = {
        **combo_counts,  # keep flat keys for backward compatibility
        "by_vote_type": per_vote_type_counts,
    }

    # Save summary to JSON
    os.makedirs(output_dir, exist_ok=True)
    summary_path = os.path.join(output_dir, "pres_senate_combo_summary.json")
    with open(summary_path, "w") as f:
        json.dump(summary_dict, f, indent=2)
    print(f"Saved president–senate combination summary to {summary_path}")

    return summary_dict


def generate_output_files(voting_data, president_cols, metadata_cols, total_rows, output_dir):
    """
    Generate JSON output files from the processed voting data.
    
    Args:
        voting_data: Dictionary of processed vote data by type
        president_cols: List of presidential candidate columns
        metadata_cols: List of metadata columns included
        total_rows: Total number of rows processed
        output_dir: Directory to save output files
    
    Returns:
        Summary information dictionary
    """
    # Extract candidate party information from the headers
    candidate_party = {}
    
    for col in president_cols:
        party = "Unknown"
        if "(" in col and ")" in col:
            party_start = col.find("(") + 1
            party_end = col.find(")")
            party = col[party_start:party_end]
        
        # Map to standard party names
        if party.upper() == "DEM":
            party = "Democratic"
        elif party.upper() == "REP":
            party = "Republican"
            
        candidate_party[col] = party
        
        # Clean up candidate names for better display
        display_name = col.split("(")[0].strip() if "(" in col else col
        # Reverse the order if the name is in "Last, First" format
        if "," in display_name:
            name_parts = display_name.split(",")
            if len(name_parts) >= 2:
                display_name = f"{name_parts[1].strip()} {name_parts[0].strip()}"
        candidate_party[f"display_{col}"] = display_name
    
    # Count votes for each candidate by vote type
    candidate_summary = {}
    for vote_type, records in voting_data.items():
        if records:
            candidate_summary[vote_type] = {}
            for candidate_col in president_cols:
                # Sum the 1/0 values we converted earlier
                votes = sum(record.get(candidate_col, 0) for record in records)
                candidate_summary[vote_type][candidate_col] = votes
    
    # Create summary data suitable for Observable Plot
    plot_data = []
    for vote_type, candidates in candidate_summary.items():
        for candidate, votes in candidates.items():
            display_name = candidate_party.get(f"display_{candidate}", candidate)
            party = candidate_party.get(candidate, "Unknown")
            
            plot_data.append({
                "vote_type": vote_type,
                "candidate": display_name,
                "party": party,
                "votes": votes
            })
    
    # Create metadata about the processing
    summary = {
        "total_rows_processed": total_rows,
        "vote_type_counts": {k: len(v) for k, v in voting_data.items()},
        "candidate_columns": president_cols,
        "candidate_vote_counts": candidate_summary,
        "metadata_columns": metadata_cols,
        "plot_ready_data": plot_data,
        "candidate_party_info": candidate_party
    }
    
    # Save processed data to JSON files
    print("Saving processed data to JSON files...")
    
    # Custom JSON encoder to handle NaN values and numpy types
    class NpEncoder(json.JSONEncoder):
        def default(self, obj):
            if isinstance(obj, (np.integer, np.floating)):
                return int(obj) if isinstance(obj, np.integer) else float(obj)
            if isinstance(obj, np.ndarray):
                return obj.tolist()
            if pd.isna(obj):
                return None  # Convert NaN to null in JSON
            return super().default(obj)
    
    # Save the summary data first
    with open(os.path.join(output_dir, 'summary.json'), 'w') as f:
        json.dump(summary, f, cls=NpEncoder, indent=2)
    print(f"Saved summary data with {len(plot_data)} plot-ready records")
    
    # Save the plot-ready data separately for easy loading
    with open(os.path.join(output_dir, 'plot_data.json'), 'w') as f:
        json.dump(plot_data, f, cls=NpEncoder, indent=2)
    print("Saved plot-ready data for Observable Plot")
    
    # Save the candidate party information for reference
    with open(os.path.join(output_dir, 'candidate_info.json'), 'w') as f:
        json.dump(candidate_party, f, cls=NpEncoder, indent=2)
    print("Saved candidate party information")
    
    # Save the raw data by vote type
    for category, data in voting_data.items():
        if data:  # Only save non-empty data
            # Clean the data to handle NaN values
            clean_data = []
            for record in data:
                clean_record = {}
                for k, v in record.items():
                    # Convert NaN to None (null in JSON)
                    clean_record[k] = None if pd.isna(v) else v
                clean_data.append(clean_record)
                
            # with open(os.path.join(output_dir, f'{category}_votes.json'), 'w') as f:
            #     json.dump(clean_data, f, cls=NpEncoder)
            print(f"Saved {len(clean_data)} {category} votes to {category}_votes.json (not really)")
    
    return summary


def analyze_csv_structure(input_file, num_rows=10):
    """
    Analyze the multi-row header CSV structure.
    
    Args:
        input_file: Path to the CSV file
        num_rows: Number of rows to read for analysis
    
    Returns:
        DataFrame with CSV structure information
    """
    try:
        # First, read the file without headers to see the raw data including header rows
        print("Reading raw CSV data to analyze header structure...")
        raw_df = pd.read_csv(input_file, header=None, nrows=num_rows)
        
        print("\nFirst 4 rows (raw data):\n")
        for i in range(min(4, len(raw_df))):
            # Print just a sample of columns for each row
            row_sample = raw_df.iloc[i, :20].tolist()
            print(f"Row {i+1}: {row_sample}")
        
        # Based on user description, construct proper headers by combining rows 2-4 (1-indexed)
        # This corresponds to rows 1-3 (0-indexed) in our DataFrame
        print("\nAnalyzing multi-row header structure...")
        
        # Read a few extra rows to make sure we get all headers plus some data
        sample_with_headers = pd.read_csv(input_file, header=None, nrows=10)
        
        if len(sample_with_headers) >= 4:
            # Extract header rows (0-indexed)
            contest_row = sample_with_headers.iloc[1].tolist()  # Row 2 (1-indexed)
            candidate_row = sample_with_headers.iloc[2].tolist()  # Row 3 (1-indexed)
            metadata_row = sample_with_headers.iloc[3].tolist()  # Row 4 (1-indexed)
            
            print("\nRow 2 (Contest Info) sample: ", contest_row[:10])
            print("Row 3 (Candidate Names) sample: ", candidate_row[:10])
            print("Row 4 (Metadata/Party) sample: ", metadata_row[:10])
            
            # Count non-NaN values in each row
            contest_count = sum(1 for x in contest_row if pd.notna(x))
            candidate_count = sum(1 for x in candidate_row if pd.notna(x))
            metadata_count = sum(1 for x in metadata_row if pd.notna(x))
            
            print(f"\nNon-empty cell counts - Contest row: {contest_count}, Candidate row: {candidate_count}, Metadata row: {metadata_count}")
            
            # Identify where candidate columns begin
            candidate_start_idx = None
            for i, val in enumerate(candidate_row):
                if pd.notna(val) and i > 10:  # Look after the first few columns
                    candidate_start_idx = i
                    print(f"\nCandidate columns appear to start at column {i} (column {chr(65 + min(i, 25))})")  
                    break
        
        # Now try reading with different header configurations to see which works best
        print("\nSample with standard header (row 0):")
        try:
            standard_header = pd.read_csv(input_file, nrows=3)
            print(standard_header.columns[:10].tolist())
            print(standard_header.head(2))
        except Exception as e:
            print(f"Error with standard header: {e}")
            
        print("\nSample with header row 4 (index 3):")
        try:
            metadata_header = pd.read_csv(input_file, header=3, nrows=3)
            print(metadata_header.columns[:10].tolist())
            print(metadata_header.head(2))
        except Exception as e:
            print(f"Error with metadata header: {e}")
            
        return raw_df
    except Exception as e:
        print(f"Error analyzing CSV structure: {e}")
        return None

def main():
    # Set up command line arguments
    parser = argparse.ArgumentParser(description='Process election data CSV into JSON files')
    parser.add_argument('input_file', help='Path to input CSV file')
    parser.add_argument('--output-dir', default='processed_data', help='Directory to save processed JSON files')
    parser.add_argument('--analyze', action='store_true', help='Just analyze CSV structure without processing')
    parser.add_argument('--counting-group-col', default='CountingGroup', help='Column name containing voting method information (early, mail, etc)')
    parser.add_argument('--extract-sample', action='store_true', help='Extract a small sample for testing')
    parser.add_argument('--sample-size', type=int, default=1000, help='Number of rows to extract for sample')
    
    args = parser.parse_args()
    
    # Create absolute paths
    input_file = os.path.abspath(args.input_file)
    output_dir = os.path.abspath(args.output_dir)
    
    if args.analyze:
        analyze_csv_structure(input_file)
    elif args.extract_sample:
        # Extract a small sample file for easier testing
        sample_output = os.path.join(os.path.dirname(input_file), 'sample_election_data.csv')
        print(f"Extracting sample to {sample_output}...")
        
        # Read and write the sample rows
        df = pd.read_csv(input_file, nrows=args.sample_size)
        df.to_csv(sample_output, index=False)
        print(f"Sample extracted: {sample_output} ({args.sample_size} rows)")
    else:
        # Process with our complex header function
        process_election_data_complex_headers(input_file, output_dir, 
                                           counting_group_col=args.counting_group_col)

if __name__ == "__main__":
    main()
