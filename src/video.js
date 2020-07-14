const url = require("url")
const bent = require("bent")

const globalVariables = require("./variables")
const errors = require("./errors")
const channel = require("./channel")
const parser = require("./parser")

function videoInfo(videoUrl, givenOptions = {}) {
  return new Promise(async (resolve, reject) => {

    const options = {
      detailedChannelData: givenOptions.detailedChannelData != undefined ? givenOptions.detailedChannelData : true,
      includeRawData: givenOptions.includeRawData != undefined ? givenOptions.includeRawData : false,
      bypassIdCheck: givenOptions.bypassIdCheck != undefined ? givenOptions.bypassIdCheck : false
    }

    const videoIdRegex = /^[0-9A-Za-z_-]{10,}[048AEIMQUYcgkosw]$/g
    let videoId

    if (videoIdRegex.test(videoUrl)) {
      videoId = videoUrl
    } else {
      const httpRegex = /^(http|https):\/\//g
      if (!httpRegex.test(videoUrl)) {
        videoUrl = "https://" + videoUrl
      }

      const parsedUrl = url.parse(videoUrl)

      if (/^(www.)?youtube.com/g.test(parsedUrl.hostname)) {
        const urlQueries = {}
        parsedUrl.query.split("&").forEach(query => {
          const split = query.split("=")
          urlQueries[split[0]] = split[1]
        })

        if (!urlQueries.v) {
          reject(new errors.YTScraperInvalidVideoURL)
          return
        }

        if (!videoIdRegex.test(urlQueries.v)) {
          if (!options.bypassIdCheck) {
            reject(new errors.YTScraperInvalidVideoID)
            return
          }
        }

        videoId = urlQueries.v
      } else if (/^youtu.be/g.test(parsedUrl.hostname)) {
        const pathnameId = parsedUrl.pathname.slice(1,)

        if (pathnameId.length <= 0) {
          reject(new errors.YTScraperInvalidVideoURL)
          return
        }

        if (!videoIdRegex.test(pathnameId)) {
          if (!options.bypassIdCheck) {
            reject(new errors.YTScraperInvalidVideoID)
            return
          }
        }

        videoId = pathnameId
      } else {
        reject(new errors.YTScraperInvalidVideoURL)
        return
      }
    }

    const ytUrl = `https://www.youtube.com/watch?v=${videoId}&gl=US&hl=en&has_verified=1&bpctr=9999999999`

    const get = bent("GET")
    var body
    try {
      const request = await get(ytUrl, null, globalVariables.headers)
      body = await request.text()
    } catch (err) {
      reject(err)
      return
    }

    if (!body) {
      reject(new errors.YTScraperMissingData)
      return
    }

    var extractedPageData
    var extractedPlayerData
    try {
      extractedPageData = await parser.parse(body, /window\["ytInitialData"\]\s?=\s?{.{0,}}/gm)
      extractedPlayerData = await parser.parse(body, /ytplayer.config\s?=\s?\{.{0,}\};ytplayer/gm)
    } catch (err) {
      reject(err)
      return
    }

    if (!extractedPlayerData.args || !extractedPlayerData.args.player_response) {
      reject(new errors.YTScraperMissingData)
      return
    }

    let playerResponse
    try {
      playerResponse = JSON.parse(extractedPlayerData.args.player_response)
    } catch (err) {
      reject(new errors.YTScraperMissingData)
      return
    }
     
    function parseScrapedCount(count) {
      const parsed = parseInt(count.toLowerCase().replace(/k/g, "000").replace(/m/g, "000000").replace(/b/g, "000000000").replace(/,/g, ""))
      return parsed == NaN ? undefined : parsed
    }

    function parseScrapedDate(dateString) {
      if (!dateString) {
        return undefined
      }

      const parsed = new Date(dateString)
      if (parsed == "Invalid Date") {
        return undefined
      }

      return parsed
    }

    function parseScrapedLikeCount(count) {
      const parsed = parseInt(count.replace(/[^0-9]/g, ""))
      return parsed == NaN ? undefined : parsed
    }

    function parseScrapedInt(intString) {
      if (!intString) {
        return undefined
      }

      const parsed = parseInt(intString)
      return parsed == NaN ? undefined : parsed
    }

    let likes = undefined
    let disliked = undefined

    const menuButtons = extractedPageData.contents.twoColumnWatchNextResults.results.results.contents[0].videoPrimaryInfoRenderer.videoActions.menuRenderer.topLevelButtons
    const likeButtons = menuButtons.filter(button => {
      if (!button.toggleButtonRenderer) {
        return false
      }
      return button.toggleButtonRenderer.defaultIcon.iconType == "LIKE"
    })
    const dislikeButtons = menuButtons.filter(button => {
      if (!button.toggleButtonRenderer) {
        return false
      }
      return button.toggleButtonRenderer.defaultIcon.iconType == "DISLIKE"
    })

    if (likeButtons.length >= 1) {
      likes = parseScrapedLikeCount(likeButtons[0].toggleButtonRenderer.defaultText.accessibility.accessibilityData.label)
    }
    if (dislikeButtons.length >= 1) {
      dislikes = parseScrapedLikeCount(dislikeButtons[0].toggleButtonRenderer.defaultText.accessibility.accessibilityData.label)
    }

    const videoDetails = playerResponse.videoDetails
    if (!videoDetails) {
      reject(new errors.YTScraperMissingData)
      return
    }


    if (!playerResponse.microformat || !playerResponse.microformat.playerMicroformatRenderer) {
      reject(new errors.YTScraperMissingData)
      return
    }
    const microformatDetails = playerResponse.microformat.playerMicroformatRenderer

    var data = {
      id: videoDetails.videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: videoDetails.title,
      views: parseScrapedInt(videoDetails.viewCount),
      description: microformatDetails.description ? microformatDetails.description.simpleText : undefined,
      category: microformatDetails.category,
      length: parseScrapedInt(microformatDetails.lengthSeconds),
      thumbnails: microformatDetails.thumbnail ? microformatDetails.thumbnail.thumbnails : undefined,
      live: videoDetails.isLiveContent,

      rating: {
        average: videoDetails.averageRating,
        allowed: videoDetails.allowRatings,
        approx: {
          likes: likes,
          dislikes: dislikes
        }
      },
      privacy: {
        private: videoDetails.isPrivate,
        unlisted: microformatDetails.isUnlisted,
        familySafe: microformatDetails.isFamilySafe,
        availableCountries: microformatDetails.availableCountries
      },
      dates: {
        published: parseScrapedDate(microformatDetails.publishDate),
        uploaded: parseScrapedDate(microformatDetails.uploadDate)
      }
      
    }

    if (options.detailedChannelData) {
      try {
        data.channel = await channel.info(microformatDetails.ownerProfileUrl, options)
      } catch (err) {
        reject(err)
      }
    } else {
      data.channel = {}
    }

    if (options.includeRawData) {
      data.raw = { page: extractedPageData, player: playerResponse }
    }

    resolve(data)
  })
}

exports.info = videoInfo