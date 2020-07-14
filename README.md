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

`ytScraper.videoInfo(videoUrl, options = {})`

|Argument|Type|Description|
|-|-|-|
|videoUrl|String|`(www.)youtube.com` and `youtu.be` links are accepted alongside simply providing the video id without a url.|
|options.detailedChannelData|Bool|Should make a second request to fetch channel data, is `true` by default.|
|options.includeRawData|Bool|`raw.player` and `raw.page` objects returned with other data. If `detailedChannelData` then `channel` will also provide `raw.page`. More info on raw objects found below.|
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

`ytScraper.channelInfo(channelUrl, options = {})`

|Argument|Type|Description|
|-|-|-|
|videoUrl|String|Accepts `(www.)youtube.com` urls.|
|options.includeRawData|Bool|`raw.page` objects returned with other data. More info on raw objects found below.|

A promise will be returned, the resolved promise returns the object described in the table below and the rejected promise returns a custom error documented below.

|Key|Type|Description|
|-|-|-|
|id|String|ID of the channel.|
|url|String|Vanity URL of the channel|
|name|String|Name of the channel.|
|description|String|Description of the channel. Can be optional is none is given.|
|location|String|Country that the channel is based. Can be optional is channel doesn't set info.|
|joined|Date|Creation date of channel|
|keywords|Array<string>|Array of keywords set by the channel.|
|approx.views|Number|Number of channel total views. Note that the page does not provide live numbers and may be outdated by a few hours.|
|approx.subscribers|Number|Number of channel subscribers. Note that the page does not provide detailed numbers and therefore will be rounded numbers (e.g. `728000`).|
|images.avatar|Array<thumbnail>|Avatar for the channel provided in different sizes. Thumbnail documentation found below.|
|images.banner|Array<thumbnail>|Banner art for the channel provided in different sizes. Can be `undefined` is none is provided.|
|privacy.familySafe|Bool|Is video family safe (deemed by YouTube).|
|privacy.availableCountries|Array<String>|Array of two letter capitalized country coded where video can be viewed (e.g. `US`). Note it can contain 150+ items.|

### Thumbnail

Thumbnails are provided by the YouTube API. Each thumbnail may represent the same image at a different size.

|Key|Type|Description|
|-|-|-|
|url|String|URL of the thumbnail, most likely a jpg.|
|width|Number|Width of thumbnail.|
|height|Number|Height of thumbnail.|

### Errors

|Error Name|Description|
|-|-|
|`YTScraperInvalidVideoURL`|An invalid video url was provided.|
|`YTScraperInvalidVideoID`|An invalid video id was provided. Can be bypassed for `videoInfo` method, check documentation.|
|`YTScraperInvalidChannelID`|An invalid channel id was provided.|
|`YTScraperInvalidChannelURL`|An invalid channel url was provided.|
|`YTScraperMissingData`|The webpage provided missing data and the scrape could not be completed.|

### Raw Objects

This module works by scraping two sources of JSON data embedded in a YouTube HTML page. The first is named `ytInitialData` and contains components that make the page work, e.g. strings, related videos, keyboard shortcuts. The second is from the YouTube player which contains technical info about a video, e.g. runtime, name, privacy settings.

This data is long and mostly human unreadable which is why the module collects it all together and returns a single object. However if you need more information it is worth checking if that info is present in the raw data YouTube provides. This is possible by passing the `includeRawData` option to either video or channel info methods. When passed a new `raw` property is present in the returned object which contains both the page (`raw.page`) and player (`raw.player`, only present for video scraping) info.

As previously mentioned raw objects are long and ever changing therefore making it a futile task to document them, however it only takes a few minutes to look through an object if you need to.

## Contributing 

We heavily value contributions, if you would like to contribute please feel free to put in a pull request.

### Contributors

* Thanks to [elBarkey](https://github.com/elBarkey) for bug fixes and stability contributions in v1.
