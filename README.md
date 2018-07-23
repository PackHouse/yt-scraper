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
| `videoInfo(url)` | `url`, the URL of a YouTube video | Returns a video data object (read below) |
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
