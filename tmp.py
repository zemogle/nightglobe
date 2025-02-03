# Write a program to read in the csv file moretargets.csv and append the data to the existing file targets.json.
# The csv file moretargets.csv contains the following data: ngc2070, emmission nebula, 84.67220, -69.09599
# The csv file targets.csv contains the following data: 
# {
#   "name": "Barnard168",
#   "ra": 328.325,
#   "dec": 47.267,
#   "desc": "Barnard 168 is a dark cloud where star formation can take place. The bright nebula is a separate but connected objected called the Cocoon Nebula. It is located in the Swan constellation and is about 500 light years away from the solar system.",
#   "filters": [
#     { "exposure": 240.0, "name": "V" },
#     { "exposure": 240.0, "name": "rp" },
#     { "exposure": 240.0, "name": "B" }
#   ],
#   "avmdesc": "Dark Nebula",
#   "avmcode": "4.2.3"
# },
# Combine the data from both files and write the combined data to the file targets.json. The data should be written in the same format as the existing data in the file targets.json.
# The file targets.json should contain the following data:
# [
#   {
#     "name": "Barnard168",
#     "ra": 328.325,
#     "dec": 47.267,
#     "desc": "Barnard 168 is a dark cloud where star formation can take place. The bright nebula is a separate but connected objected called the Cocoon Nebula. It is located in the Swan constellation and is about 500 light years away from the solar system.",
#     "filters": [
#       { "exposure": 240.0, "name": "V" },
#       { "exposure": 240.0, "name": "rp" },
#       { "exposure": 240.0, "name": "B" }
#     ],
#     "avmdesc": "Dark Nebula",
#     "avmcode": "4.2.3"
#   },
#   {
#     "name": "ngc2070",
#     "ra": 84.67220,
#     "dec": -69.09599,
#     "desc": "emmission nebula",
#     "filters": [],
#     "avmdesc": "",
#     "avmcode": ""
#   }
# ]
# The data in the file targets.json should be sorted by the name field in ascending order.

import json
import csv

# Read the data from the file targets.json
with open('targets.json', 'r') as file:
    olddata = json.load(file)

data = olddata['targets']
print('Length of old data:', len(data))


# Read the data from the file moretargets.csv
with open('moretargets.csv', 'r') as file:
    reader = csv.reader(file)
    for row in reader:
        data.append({
            "name": row[0],
            "ra": float(row[2]),
            "dec": float(row[3]),
            "desc": row[1],
            "filters": [],
            "avmdesc": "",
            "avmcode": ""
        })

# Sort the data by the name field in ascending order
data.sort(key=lambda x: x['name'])

# Write the data to the file targets.json
with open('newtargets.json', 'w') as file:
    json.dump(data, file, indent=4)

# Read the data from the file targets.json
with open('newtargets.json', 'r') as file:
    data = json.load(file)

print('Length of data:', len(data))


