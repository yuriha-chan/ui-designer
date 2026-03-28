#!/usr/bin/env python3
import json
import sys

with open(sys.argv[1], 'r') as f:
    data = json.load(f)

entities = [
    {
        "name": entity["name"],
        "properties": [
            {"name": prop, "type": "string"}
            for prop in entity["properties"]
        ]
    }
    for entity in data["entities"]
]

print(json.dumps(entities, ensure_ascii=False, indent=2))
