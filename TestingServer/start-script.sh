#!/bin/bash

cd ../../node/ 
port=4100
for (( c=1; c<=$2; c++ ))
do
	port=$((port+10))
	numactl --cpubind=0 --membind=0 ./node ../REST-TCC/TestingServer/server_nologs.js $1 $port $c &
done
