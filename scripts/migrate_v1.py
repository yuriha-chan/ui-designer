#!/usr/bin/env python3
import json
import sys

with open(sys.argv[1], "r") as f:
    old_data = json.load(f)

new_data = {
    "version": "2.0",
    "screens": [
        {
            "id": "default",
            "name": "Screen 1",
            "components": old_data["components"],
        }
    ],
    "currentScreenId": "default",
    "entities": [
        {
            "name": entity["name"],
            "properties": [
                {"name": prop, "type": "string"} for prop in entity["properties"]
            ],
        }
        for entity in old_data["entities"]
    ],
}

print(json.dumps(new_data, ensure_ascii=False, indent=2))
