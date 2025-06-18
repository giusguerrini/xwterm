#|/bin/bash
#

if [ "x$1" = 'x' ]; then
	n=1000
else
	n=$1
fi

for ((i=0; i<$n; ++i)) do
	echo ---- $i ----
done

