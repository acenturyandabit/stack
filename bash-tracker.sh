#!/usr/bin/env bash

function mmap() { while IFS= read -r line; do "$1" "$line"; done; }

function urlEncode() {
    echo $1 | curl -Gso /dev/null -w %{url_effective} --data-urlencode @- "" | sed -E 's/..(.*).../\1/'
}

function find_subtasks(){
    PID=$(ps -e -o ppid,pid | grep "^ *$1" | sed 's/^ *[0-9]* *//g')
    if ! [ -z $PID ]; then
        CMD=$(ps -q $PID -o args | tail -n +2 | grep -v bash-tracker)
        if ! [ -z "$CMD" ]; then
            curl -X POST http://localhost:6234/status?shell_id=$(urlEncode "$1")\&cmd=$(urlEncode "$CMD")\&start_or_stop=start\&ttl=7000;
        fi
    else
        curl -X POST http://localhost:6234/status?shell_id=$(urlEncode "$1")\&start_or_stop=stop\&ttl=7000;
    fi
}

while true; do
    BASH_PIDS=$(ps -eo pid,args | grep shellIntegration | grep -v grep | awk '{print $1;}')
    echo "$BASH_PIDS" | mmap find_subtasks; 
    sleep 5;
done
