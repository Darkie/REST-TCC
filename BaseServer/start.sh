#!/bin/bash

#iterate input times and start server
TIMEOUT=$2
for((count=$1,port=3000;count>0;--count,port+=10)); do
    node server.js $port $TIMEOUT &
done
