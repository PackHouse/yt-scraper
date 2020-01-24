# yt-scraper

Modern YouTube scraper capable of retrieving video and channel info.

## Install

First install through NPM:

`npm install yt-scraper`

Then import into your project:

`const ytScraper = require("yt-scraper")`

## Usage

While the scraper will be updated as the YouTube video/channel page changes, all returned keys in objects described below should be treated as optional to avoid any errors causes by page changes.

### Video Info

`ytScraper.videoInfo(videoUrl, options = { detailedChannelData: true })`

|Argument|Type|Description|
|-|-|-|
|videoUrl|String|`(www.)youtube.com` and `youtu.be` links are accepted alongside simply providing the video id without a url.|
|options.detailedChannelData|Bool|Should make a second request to fetch channel data, is `true` by default.|
|options.bypassIdCheck|Bool|Make the video request without verifying the id, only works with a url provided. Is `false` by default.|

A promise will be returned, the resolved promise returns the object described in the table below and the rejected promise returns a custom error documented below.

|Key|Type|Description|
|-|-|-|
|id|String|ID of the video.|
|url|String|URL of the video (`https://www.youtube.com/watch?v=ID`).|
|title|String|Title of the video.|
|description|String|Description of the video, will contain `\n`.|
|category|String|Category of the video.|
|length|Number|Length of the video in seconds.|
|thumbnails|Array<thumbnail>|Array of thumbnails, most likely contains at least one. Documentation can be found below.|
|thumbnail.url|String|URL of the thumbnail, most likely a jpg.|
|thumbnail.width|Number|Width of thumbnail.|
|thumbnail.height|Number|Height of thumbnail.|
|live|Bool|Is video a live stream|
|rating.average|Number|YouTube provided average rating. Note that it is optional as rating can be disallowed.|
|rating.allowed|Number|Is rating allowed.|
|rating.approx.likes|Number|Number of video likes. Note that the page may not provide detailed numbers and therefore may be rounded numbers. Use `rating.average` for a detailed average if needed.|
|rating.approx.dislikes|Number|Number of video dislikes. Note that the page may not provide detailed numbers and therefore may be rounded numbers. Use `rating.average` for a detailed average if needed.|
|privacy.private|Bool|Is video private.|
|privacy.unlisted|Bool|Is video unlisted.|
|privacy.familySafe|Bool|Is video family safe (deemed by YouTube).|
|privacy.availableCountries|Array<String>|Array of two letter capitalized country coded where video can be viewed (e.g. `US`). Note it can contain 150+ items.|
|dates.published|Date|Video published video. May vary from upload date.|
|dates.uploaded|Date|Video uploaded date. May vary from publish date.|
|channel|**Channel** object|Another request will be made, this can be prevented by providing `{ detailedChannelData: false }` option as the second argument. Channel object documentation can be found below.|

### Channel Info

`ytScraper.channelInfo(channelUrl)`

|Argument|Type|Description|
|-|-|-|
|videoUrl|String|Accepts `(www.)youtube.com` urls.|

A promise will be returned, the resolved promise returns the object described in the table below and the rejected promise returns a custom error documented below.

|Key|Type|Description|
|-|-|-|
|id|String|ID of the channel.|
|name|String|Name of the channel.|
|url|String|URL of the channel. Note that the channel pathname prefix can be either `channel` or `user` depending of the creation date of the channel.|
|description|String|Description of the channel. Can be optional is none is given.|
|joined|Date|Creation date of channel|
|approx.subscribers|Number|Number of channel subscribers. Note that the page does not provide detailed numbers and therefore will be rounded numbers (e.g. `728000`).|
|approx.views|Number|Number of channel total views. Note that the page does not provide live numbers and may be outdated by a few hours.|

### Errors

|Error Name|Description|
|-|-|
|`YTScraperInvalidVideoURL`|An invalid video url was provided.|
|`YTScraperInvalidVideoID`|An invalid video id was provided. Can be bypassed for `videoInfo` method, check documentation.|
|`YTScraperInvalidChannelID`|An invalid channel id was provided.|
|`YTScraperInvalidChannelURL`|An invalid channel url was provided.|
|`YTScraperMissingData`|The webpage provided missing data and the scrape could not be completed.|

## Contributing 

We heavily value contributions, if you would like to contribute please feel free to put in a pull request.

### Contributors

* Thanks to [elBarkey](https://github.com/elBarkey) for bug fixes and stability contributions in v1.
