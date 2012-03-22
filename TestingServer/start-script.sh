#!/bin/bash

echo "hi, $USER!"

cd ../../node/ 
port=3100
for (( c=1; c<=$2; c++ ))
do
	port=$((port+100))
	./node ../REST-TCC/TestingServer/server.js $1 $port &
done
