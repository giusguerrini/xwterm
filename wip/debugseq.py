#!/usr/bin/python3

import json
import time

with open("test", "r", encoding="utf8") as f:
    for line in f:
        s= json.loads(line.strip())
        time.sleep(0.5)
        print(s, end="")

