# yt-scraper

Modern YouTube scraper capable of retrieving video and channel info

## Install

First install through NPM:

`npm install yt-scraper`

Then import into your project:

`const ytScraper = require("yt-scraper")`

## Usage

### Functions

| Function | Arguments | Promise Resolve |
|----------|-----------|----------------|
| `videoInfo(url, minimalChannelInfo)` | `url`, the URL of a YouTube video, `minimalChannelInfo`, will ensure only a request to the video page is made instead of the default video and channel page scrape | Returns a video data object (read below) |
| `channelInfo(url)` | `url`, the URL of a YouTube channel page | Returns a channel data object (read below) |

#### Example

    // Import module
    const ytScraper = require("yt-scraper")

    // Retrieve video info
    ytScraper.videoInfo("https://www.youtube.com/watch?v=dd_FBkfkcaM")
    .then(data => {
      // Print data
      console.log(data)
    })
    .catch(console.log)

### Video object

| Key | Description |
|-----|-------------|
| title | The title of the video |
| id | ID of the video |
| views | Integer view count |
| description | The video description |
| likes | Integer like count |
| dislikes | Integer dislike count |
| uploadDate | JS `Date` object of video upload date |
| channel | A channel object (below) |

### Channel object

| Key | Description |
|-----|-------------|
| id | ID of the channel |
| name | Name of the channel |
| subscribers | Integer subscriber count |
| views | Integer channel view count |
| joined | JS `Date` object to channel creation date |
| url | URL of the channel |
| description | Channel description |

**NOTE:** If `minimalChannelInfo` is enabled within `videoInfo(url, minimalChannelInfo)` then only `id`, `name` and `url` will be returned in the channel object.

## Testing / Coverage

[jest](https://jestjs.io) is currently used to perform coverage and unit tests. Tests can be performed using `npm test`, coverage tests can be performed using `npm coverage`.

## Contributing 

We heavily value contributions, if you would like to contribute please feel free put in a pull request.

### Contributors

* Big thanks to [elBarkey](https://github.com/elBarkey) for bug fixes and stability contributions.
