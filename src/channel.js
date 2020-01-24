const url = require("url")
const cheerio = require("cheerio")
const request = require("request-promise-native")

const errors = require("./errors")
const parser = require("./parser")
const globalVariables = require("./variables")

function channelInfo(channelUrl) {
  return new Promise((resolve, reject) => {

    let channelId
    let channelUrlType

    const httpRegex = /^(http|https):\/\//g
    if (!httpRegex.test(channelUrl)) {
      channelUrl = "https://" + channelUrl
    }

    const parsedUrl = url.parse(channelUrl)
    if (!/^(www.)?youtube.com/g.test(parsedUrl.hostname)) {
      reject(new errors.YTScraperInvalidChannelURL)
      return
    }

    if (!/^\/(channel|user)\/[_\-A-Za-z0-9]{1,}$/g.test(parsedUrl.pathname)) {
      reject(new errors.YTScraperInvalidChannelURL)
      return
    }

    const channelUrlTypeMatches = parsedUrl.pathname.match(/(channel|user)/g)
    if (channelUrlTypeMatches.legnth <= 0) {
      reject(new errors.YTScraperInvalidChannelURL)
      return
    }
    channelUrlType = channelUrlTypeMatches[0]

    const channelIdMatches = parsedUrl.pathname.match(/[_\-A-Za-z0-9]{1,}$/g)
    if (channelIdMatches.length <= 0) {
      reject(new errors.YTScraperInvalidChannelID)
      return
    }

    channelId = channelIdMatches[0]

    const ytUrl = `https://www.youtube.com/${channelUrlType}/${channelId}/about?gl=US&hl=en&has_verified=1`
    request({
      url: ytUrl,
      headers: globalVariables.globalVariables
    }, async (err, res, body) => {
      if (err) {
        reject(err)
        return
      }

      if (!body) {
        reject(new errors.YTScraperMissingData)
        return
      }

      function parseScrapedCount(count) {
        count = count.toLowerCase()
        let parsedCount
        if (/^[0-9]{1,}\.[0-9]{2}(k|m|b)?$/) {
          parsedCount = parseInt(count.toLowerCase().replace(/k/g, "0").replace(/m/g, "0000").replace(/k/g, "0000000").replace(/\D/g, ""))
        } else if (/^[0-9](k|m|b)$/) {
          parsedCount = parseInt(count.toLowerCase().replace(/k/g, "000").replace(/m/g, "000000").replace(/b/g, "000000000").replace(/\D/g, ""))
        }

        return parsedCount == NaN ? undefined : parsedCount
      }

      var $ = cheerio.load(body)

      let joined = undefined
      let approxSubscribers = undefined
      let approxViews = undefined

      // All 3 elements we need all come under about-stat class
      $(".about-stat").each((index, element) => {
        var elementText = $(element).text()
        if (/views/g.test(elementText)) {
          // Views
          approxViews = parseScrapedCount(elementText.replace(/[^1-9]/g, ""))
        } else if (/Joined/g.test(elementText)) {
          // Joined date
          let parsedDate = new Date(elementText.replace(/Joined /g, ""))
          joined = typeof parsedDate != "object" ? undefined : parsedDate
        }
      })

      approxSubscribers = parseScrapedCount($(".channel-header-subscription-button-container .yt-subscription-button-subscriber-count-branded-horizontal").text())
      const description = $(".about-description pre").text()

      resolve({
        id: channelId,
        name: $(".qualified-channel-title-text a").text(),
        url: `https://www.youtube.com/${channelUrlType}/${channelId}`,
        description: description,
        joined: joined,
        approx: {
          subscribers: approxSubscribers,
          views: approxViews
        }
      })

    })
  })
}

exports.info = channelInfo