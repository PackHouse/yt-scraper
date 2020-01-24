# yt-scraper

Modern YouTube scraper capable of retrieving video and channel info.

## Branch v2

**This branch is for v2 and therefore is undocumented and may be unstable.** The goals for v2 are as follows:

- [x] Real error handling
- [x] Use `ytplayer.config` for video info allowing more info
- [x] Less strict requirements for YT video urls
- [ ] Update tests with more info

## Install (v1)

First install through NPM:

`npm install yt-scraper`

Then import into your project:

`const ytScraper = require("yt-scraper")`

## Testing / Coverage (v2 not supported)

[jest](https://jestjs.io) is currently used to perform coverage and unit tests. Tests can be performed using `npm test`, coverage tests can be performed using `npm coverage`.

## Contributing 

We heavily value contributions, if you would like to contribute please feel free put in a pull request.

### Contributors

* Big thanks to [elBarkey](https://github.com/elBarkey) for bug fixes and stability contributions.
