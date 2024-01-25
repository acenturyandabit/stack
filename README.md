# Termini

Keep your background processes in your peripheral vision automatically.

## How it works

Requirements: node/npm on your system

1. Clone this folder to somewhere out of the way.
2. Copy the snippet.bashrc into your ~/.bashrc.
3. run `npm install .`
4. Run the server: ./server
5. Open the webapp and keep it pinned to top in a corner.
6. Run a background task. It will show up on the webapp. When the background task has completed, the webapp will show you that it is complete.
    - When you run another command on the same terminal as the current task, it will automatically clear the background task.
