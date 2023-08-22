#!/bin/bash

# Loop through the .env file
while IFS='=' read -r key value
do
    # Use eval to handle the value properly 
    eval value="$value"

    # Export the variables as environment variables
    export "$key"="$value"
    echo "Set $key to $value"
done < .env.test