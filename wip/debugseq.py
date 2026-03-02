#!/usr/bin/python3

import json
import time
import sys

with open(sys.argv[1], "r", encoding="utf8") as f:
    for line in f:
        s= json.loads(line.strip())
        time.sleep(0.5)
        print(s, end="")

