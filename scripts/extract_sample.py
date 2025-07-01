#!/usr/bin/env python3
"""
Extract a small sample from the large JSON election data files for analysis.
"""

import json
import argparse
from pathlib import Path
import os

def extract_sample(input_file: str, output_file: str, sample_size: int = 20) -> None:
    """
    Extract a sample of records from a large JSON file.
    
    Args:
        input_file: Path to the large JSON file
        output_file: Path to save the sample JSON file
        sample_size: Number of records to extract
    """
    print(f"Extracting {sample_size} records from {input_file}")
    
    # Check if the input file exists
    if not os.path.exists(input_file):
        print(f"Error: Input file {input_file} does not exist")
        return
    
    try:
        # Open the file and read the first few records
        with open(input_file, 'r') as f:
            # Check if the file starts with a JSON array
            first_char = f.read(1)
            if first_char != '[':
                print(f"Error: File {input_file} does not start with a JSON array")
                return
            
            # Reset file pointer to start
            f.seek(0)
            
            # Read character by character until we have the desired number of complete JSON objects
            objects = []
            depth = 0
            current_object = ""
            in_string = False
            escape_next = False
            
            for i, char in enumerate(f.read()):
                current_object += char
                
                if escape_next:
                    escape_next = False
                    continue
                
                if char == '\\':
                    escape_next = True
                    continue
                
                if char == '"' and not escape_next:
                    in_string = not in_string
                    continue
                
                if not in_string:
                    if char == '{':
                        depth += 1
                    elif char == '}':
                        depth -= 1
                        if depth == 0:
                            objects.append(current_object)
                            current_object = ""
                            if len(objects) >= sample_size:
                                break
                            
                    # Skip whitespace between objects
                    if depth == 0 and char in [',', ' ', '\n', '\r', '\t']:
                        current_object = ""
            
            # Parse the objects
            parsed_objects = []
            for obj_str in objects:
                try:
                    obj = json.loads(obj_str)
                    parsed_objects.append(obj)
                except json.JSONDecodeError:
                    print(f"Warning: Could not parse object: {obj_str[:100]}...")
            
            # Write the sample to the output file
            with open(output_file, 'w') as out_f:
                json.dump(parsed_objects, out_f, indent=2)
                
            print(f"Successfully extracted {len(parsed_objects)} records to {output_file}")
    
    except Exception as e:
        print(f"Error extracting sample: {str(e)}")

def main():
    parser = argparse.ArgumentParser(description='Extract sample from large JSON file')
    parser.add_argument('input_file', help='Path to input JSON file')
    parser.add_argument('--output-file', help='Path to output sample JSON file')
    parser.add_argument('--sample-size', type=int, default=20, help='Number of records to extract')
    
    args = parser.parse_args()
    
    input_file = args.input_file
    output_file = args.output_file or f"{input_file.rsplit('.', 1)[0]}_sample.json"
    
    extract_sample(input_file, output_file, args.sample_size)

if __name__ == "__main__":
    main()
