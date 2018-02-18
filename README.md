# Giftory
Convert any piece of text into an entertaining GIF movie! 

Giftory is a piece of Node code that lets you covert any piece of text (ideally a story) into a Gif Movie! 

## Install instructions (Web App coming soon!)

1. install ffmpeg for your OS
2. run "npm install" in your local Giftory directory
3. run giftory with "node gif2story.js"

note : you will need to replace the Giphy API key in the code, as well as replace the text with any story you want!

## CURRENT BUG/IMPROVEMENT LOG:

- Works for most stories, but ffmpeg fails to merge randomly -- mostly issue with gif resolution/properties (attempted fix by forcing these properties to be the same but still fails)
- Add parser from blob of text to sentences to eliminate manual insertion of sentences to array (use .split(' '))
