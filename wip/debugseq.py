#!/usr/bin/python3

import json
import time

with open("apt-out.txt", "r", encoding="utf8") as f:
    for line in f:
        s= json.loads(line.strip())
        time.sleep(2)
        print(s, end="")

