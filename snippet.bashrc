function push_prompt() {
  if [ "$1" != "stop" ]; then
    case "$BASH_COMMAND" in
            $PROMPT_COMMAND)
            return;; # don't infinite loop
        'echo -e "$$\nstart\n$BASH_COMMAND" > $command_file')
            return;;
        *)
            command_file=/tmp/pp-$(date +%s)
            echo -e "$$\nstart\n$BASH_COMMAND" > $command_file
            curl -X POST http://localhost:6234/status?file=$command_file &>/dev/null
    esac
  else
    command_file=/tmp/pp-$(date +%s)
    echo -e "$$\nstop" > $command_file
    curl -X POST http://localhost:6234/status?file=$command_file &>/dev/null
  fi
}

function before_prompt() { push_prompt stop; }

trap push_prompt DEBUG
PROMPT_COMMAND=before_prompt