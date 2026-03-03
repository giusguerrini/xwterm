#!/bin/bash
#

echo -en '\ec'

clear

echo -en '\e[0;'$((LINES/2))'r'

n=0

while [ $n -lt $((LINES/2)) ] ; do echo $n; n=$((n+1)); done

echo -en '\e['$((LINES/2+1))'f'; echo '----'

n=0
while [ $n -lt $((LINES/4-1)) ] ; do echo $n; n=$((n+1)); sleep 0.5; done
