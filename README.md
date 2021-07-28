# RedditEmbedFix - redditfx.com 
![License MIT](https://img.shields.io/badge/license-MIT-green)  

Make Reddit videos appear in Discord embeds! Just edit `reddit.com` into `redditfx.com`.  

![Demo](https://github.com/Cosmiiko/RedditEmbedFix/blob/main/demo.gif?raw=true)  
## Cost of Operation
![Current Disk Usage](https://img.shields.io/badge/current%20disk%20space%20used-low-green)  

Because Reddit stores audio and video seperately, I have to encode and store those on my own dedicated server.  
This costs precious CPU cycles and disk usage.  
This is why the videos are only stored for seven days then deleted from my server. This should not affect user experience too much as they will be re-cached if the link is re-used.
#### However what this really means is that I will not always be able to host this by myself, that is, without financial help.
That being said, we still have a fair bit of time ahead of us before this happens.

## Usage
```
npm run start
```
I'd recommend using this in some monitoring service, like a docker container or a pm2 instance.

## Config
```
+-----------------------+------------+---------------+----------------------------------------------------------------+
| Key                   | Value type | Default value | Info                                                           |
+-----------------------+------------+---------------+----------------------------------------------------------------+
| subUrl                | string     |               | Use if you don't host at the root of your domain.              |
|                       |            |               | Example: yoursite.com/redditfix/ would have this               |
|                       |            |               | configured as "/redditfix"                                     |
+-----------------------+------------+---------------+----------------------------------------------------------------+
| debug                 | boolean    | true          | Enables more verbose logging                                   |
+-----------------------+------------+---------------+----------------------------------------------------------------+
| encodingPreset        | string     | veryfast      | x264 preset used for encoding, from ultrafast to veryslow.     |
|                       |            |               | veryfast gives the best performance/file size ration.          |
+-----------------------+------------+---------------+----------------------------------------------------------------+
| cacheDuration         | number     | 604800000     | Time in milliseconds a video will be kept stored on the disk.  |
|                       |            |               | Default is one week.                                           |
+-----------------------+------------+---------------+----------------------------------------------------------------+
| redirectUnknownAgents | boolean    | true          | Redirects users who click the link to the reddit post if true, |
|                       |            |               | shows the info page (response.ejs) if false.                   |
+-----------------------+------------+---------------+----------------------------------------------------------------+
| httpPort              | number     | 80            | Port the express server will use.                              |
+-----------------------+------------+---------------+----------------------------------------------------------------+
```

## Note
Yes, I am aware the code for this isn't the greatest. I made this out of boredom in an afternoon, I never intended this to be perfect, just good enough to work.
