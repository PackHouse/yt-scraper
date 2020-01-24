const url = require("url")
const cheerio = require("cheerio")
const request = require("request")

const globalVariables = require("./variables")
const errors = require("./errors")
const channel = require("./channel")
const parser = require("./parser")

function videoInfo(videoUrl, options = { detailedChannelData: true }) {
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
    request({
      url: ytUrl,
      headers: globalVariables.headers
    }, async (err, res, body) => {
      if (err) {
        reject(err)
        return
      }

      if (!body) {
        reject(new errors.YTScraperMissingData)
        return
      }

      var parsedBody
      try {
        parsedBody = await parser.parse(body)
      } catch (err) {
        reject(err)
        return
      }

      if (!parsedBody.match.args || !parsedBody.match.args.player_response) {
        reject(new errors.YTScraperMissingData)
        return
      }

      let playerResponse
      try {
        playerResponse = JSON.parse(parsedBody.match.args.player_response)
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

      function parseScrapedInt(intString) {
        if (!intString) {
          return undefined
        }

        const parsed = parseInt(intString)
        return parsed == NaN ? undefined : parsed
      }

      let likes = parsedBody.dom.find(".like-button-renderer-like-button .yt-uix-button-content").first().text()
      likes = parseScrapedCount(likes)
      let dislikes = parsedBody.dom.find(".like-button-renderer-dislike-button .yt-uix-button-content").first().text()
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

      let data = {
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
          data.channel = await channel.info(microformatDetails.ownerProfileUrl)
          resolve(data)
        } catch (err) {
          reject(err)
        }
      } else {
        data.channel = {
          url: microformatDetails.ownerProfileUrl
        }
        resolve(data)
      }

    })
  })
}

exports.info = videoInfo