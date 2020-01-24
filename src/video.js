const url = require("url")
const cheerio = require("cheerio")
const request = require("request-promise-native")

const globalVariables = require("./variables")
const errors = require("./errors")
const channel = require("./channel")

function videoInfo(videoUrl, options = {}) {
  return new Promise((resolve, reject) => {
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
      // if (!/^((www.)?youtube.com|youtu.be)$/g.test(parsedUrl.hostname)) {
      //   reject(new errors.YTScraperInvalidVideoURL)
      //   return
      // }

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
          reject(new errors.YTScraperInvalidVideoID)
          return
        }

        videoId = urlQueries.v
      } else if (/^youtu.be/g.test(parsedUrl.hostname)) {
        const pathnameId = parsedUrl.pathname.slice(1,)

        if (pathnameId.length <= 0) {
          reject(new errors.YTScraperInvalidVideoURL)
          return
        }

        if (!videoIdRegex.test(pathnameId)) {
          reject(new errors.YTScraperInvalidVideoID)
          return
        }

        videoId = pathnameId
      } else {
        reject(new errors.YTScraperInvalidVideoURL)
        return
      }
    }

    const ytUrl = `https://www.youtube.com/watch?v=${videoId}&gl=US&hl=en&has_verified=1&bpctr=9999999999`
    request({
      url: ytUrl,
      headers: globalVariables.globalHeaders
    }, (err, res, body) => {
      if (err) {
        reject(err)
        return
      }

      if (!body) {
        reject(new errors.YTScraperMissingData)
        return
      }

      const $ = cheerio(body)
      let playerResponse
      const scriptElements = $.find("script").toArray()
      for (index in scriptElements) {
        const element = scriptElements[index]
        const text = cheerio(element).contents().first().text()
        const configMatches = text.match(/ytplayer.config\s?=\s?\{.{0,}\};ytplayer/gm)
        for (configMatchIndex in configMatches) {
          const configMatch = configMatches[configMatchIndex]

          const finalMatches = configMatch.match(/\{.{0,}\}/gm)
          for (finalMatchIndex in finalMatches) {
            const finalMatch = finalMatches[finalMatchIndex]
            try {
              parsedMatch = JSON.parse(finalMatch)
              if (parsedMatch.args && parsedMatch.args.player_response) {
                playerResponse = JSON.parse(parsedMatch.args.player_response)
                break
              }
            } catch (err) {
              console.log(err)
              continue
            }
          }
        }
      }
      
      if (!playerResponse) {
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

      function parseScrapedInt(intString) {
        if (!intString) {
          return undefined
        }

        const parsed = parseInt(intString)
        return parsed == NaN ? undefined : parsed
      }

      let likes = $.find(".like-button-renderer-like-button .yt-uix-button-content").first().text()
      likes = parseScrapedCount(likes)
      let dislikes = $.find(".like-button-renderer-dislike-button .yt-uix-button-content").first().text()
      dislikes = parseScrapedCount(dislikes)

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

      resolve({
        id: videoDetails.videoId,
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
        
      })

    })
  })
}

exports.info = videoInfo