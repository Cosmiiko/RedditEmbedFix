const fs = require('fs');
const express = require('express');
const request = require('request');
const ffmpegPath = require('ffmpeg-static');

const path = require('path');
const { exec } = require('child_process');

const DISCORD_AGENTS = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:38.0) Gecko/20100101 Firefox/38.0',
    'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)'
];
const CACHE_PATH = path.join(__dirname, 'cache');
const POSTID_REGEX = /(?:comments|^)\/([0-9a-z][0-9a-z][0-9a-z][0-9a-z][0-9a-z][0-9a-z])(?:\/|$)/;

const config = require('./config.json');
const app = express();

let cachedIDs = [];

try {
    fs.mkdirSync(CACHE_PATH);
}
catch (e) {
    if (e.code != 'EEXIST') throw e;

    for (let dir of fs.readdirSync(CACHE_PATH)) {
        cachedIDs.push(dir);
    }

    console.log(cachedIDs.length, 'elements in cache');
}

const cleanCache = () => {
    let oldLength = cachedIDs.length;

    for (let dir of fs.readdirSync(CACHE_PATH)) {
        let stats = fs.statSync(path.join(CACHE_PATH, dir, 'meta.json'));

        if (stats.mtime.getTime() + config.cacheDuration < Date.now()) {
            fs.rmdirSync(path.join(CACHE_PATH, dir), { recursive: true });
            cachedIDs.splice(cachedIDs.indexOf(dir), 1);
        }
    }

    console.log('removed', oldLength - cachedIDs.length, 'expired elements from cache');
}

// Check every day for cache cleaning
setInterval(cleanCache, 1000 * 60 * 60 * 24);
cleanCache();

app.set('view engine', 'ejs');
app.use('/cache', express.static('cache'));

app.get('/', (req, res) => {
    res.render('home');
});

// Bad practice to have a '*' route but whatever
app.get('*', (req, res) => {
    if (console.debug)
        console.log('request from:', req.headers['user-agent']);

    if (!DISCORD_AGENTS.includes(req.headers['user-agent']) && config.redirectUnknownAgents) {
        res.writeHead(302, {
            'location': 'https://reddit.com' + req.url
        });
        res.end();
        return;
    }

    let postId = 't3_';

    if (POSTID_REGEX.test(req.url)) {
        postId += POSTID_REGEX.exec(req.url)[1];
    }
    else {
        res.render('error', { error: 'Could not parse link.' });
        return;
    }

    // Post has been cached already
    if (cachedIDs.includes(postId)) {
        let data = JSON.parse(fs.readFileSync(path.join(CACHE_PATH, postId, 'meta.json'), 'utf-8'));
        res.render('response', { data: data });
        return;
    }

    // Post hasn't been cached yet, querying Reddit
    request('https://reddit.com/by_id/' + postId + '.json', function (_, redditRes, jsonBody) {
        console.log('https://reddit.com/by_id/' + postId + '.json');

        if (redditRes.statusCode != 200) {
            res.render('error', {
                error: 'Reddit API returned code ' + redditRes.statusCode + '.'
            });
            return;
        }

        let json = JSON.parse(jsonBody);

        let data = {};

        try {
            data.sub = json.data.children[0].data.subreddit_name_prefixed;
            data.title = json.data.children[0].data.title;
            data.fallbackUrl = json.data.children[0].data.secure_media.reddit_video.fallback_url;
            data.dashUrl = json.data.children[0].data.secure_media.reddit_video.dash_url;
            data.postUrl = 'https://www.reddit.com/' + postId.split('_')[1];
        }
        catch (e) {
            if (e.name != 'TypeError')
                throw e;

            res.render('error', { error: 'Could not parse Reddit\'s API response.' });
            return;
        }

        let cachedPostPath = path.join(CACHE_PATH, postId);
        fs.mkdirSync(cachedPostPath, { 'recursive': true });

        exec(`${ffmpegPath} -i "${data.dashUrl}" -c:v libx264 -preset ${config.encodingPreset} ${path.join(cachedPostPath, 'vid.mp4')}`, (e, o, stde) => {
            if (e) {
                res.render('error', { error: 'Could not encode video.' });

                if (config.debug)
                    console.log(e);

                return;
            }

            data.vidUrl = `${req.protocol}://${req.get('host')}${config.subUrl}/cache/${postId}/vid.mp4`;

            fs.writeFileSync(path.join(cachedPostPath, 'meta.json'), JSON.stringify(data, null, 2));

            // This is all async so we need to check for race conditions
            if (!cachedIDs.includes(postId)) {
                cachedIDs.push(postId);

                if (config.debug)
                    console.log('added', postId, 'into the cache');
            }

            res.render('response', { data: data })
        });
    });
});

app.listen(config.httpPort, () => {
    console.log('web server listening on port:', config.httpPort);
});