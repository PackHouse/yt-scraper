const url = require("url")
const cheerio = require("cheerio")
const request = require("request")

const errors = require("./errors")
const parser = require("./parser")
const globalVariables = require("./variables")

///window["ytInitialData"]\s=\s{.{0,}}\n?\t{0,}window["ytInitialPlayerResponse"]/gm

function channelInfo(channelUrl, givenOptions = {}) {
  return new Promise((resolve, reject) => {

    const options = {
      includeRawData: givenOptions.includeRawData != undefined ? givenOptions.includeRawData : false
    }

    if (!/^(https?:\/\/)?(www.)?youtube.com\/(.*\/)?.*$/g.test(channelUrl)) {
      reject(new errors.YTScraperInvalidChannelURL)
      return
    }

    const channelUrlTypeMatches = channelUrl.match(/(?<=\.com\/)(.*?)(?=\/)/g)
    const channelUrlType = channelUrlTypeMatches ? channelUrlTypeMatches[0] : undefined

    const channelIdMatches = channelUrl.match(/(?<=\/)([^\/]*?)$/g)
    const channelId = channelIdMatches ? channelIdMatches[0] : undefined
    if (!channelId) {
      reject(new errors.YTScraperInvalidChannelID)
      return
    }

    const ytUrl = `https://www.youtube.com/${channelUrlType || ""}/${channelId}/about?gl=US&hl=en&has_verified=1`
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
        parsedBody = await parser.parse(body, /window\["ytInitialData"\]\s?=\s?{.{0,}}/gm)
      } catch (err) {
        reject(err)
        return
      }

      let aboutData = parsedBody.contents.twoColumnBrowseResultsRenderer.tabs.filter(tab => {
        if (!tab.tabRenderer) {
          return false
        }
        return tab.tabRenderer.title == "About"
      })
      aboutData = aboutData[0] ? aboutData[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].channelAboutFullMetadataRenderer : {}

      function cleanScrapedNumber(number) {
        const clean = parseInt(number.replace(/\D/g, ""))
        return clean == NaN ? undefined : clean
      }

      function parseSubscriberCount(count) {
        const text = count.match(/[^\s]+/g)[0]

        const parsedFirstHalf = text.match(/[0-9]+/g)
        if (parsedFirstHalf == null) {
          return null
        }
        const firstHalf = parsedFirstHalf[0]

        const parsedSecondHalf = text.match(/(?<=\.)(.*?)(?=[A-Z])/g)
        const parsedScale = text.match(/(?<=[0-9]+?)[A-Z]$/g)

        var multiplier = 1
        if (parsedScale) {
          const scale = parsedScale[0].toLowerCase()
          if (scale == "k") { multiplier = 1000 }
          else if (scale == "m") { multiplier = 1000000 }
          else if (scale == "b") { multiplier = 1000000000 }
        }

        var finalNumberString = firstHalf

        if (parsedSecondHalf) {
          const secondHalfStr = parsedSecondHalf[0].toLowerCase()
          if (multiplier > 1) {
            multiplier /= Math.pow(10, secondHalfStr.length)
          }
          finalNumberString += secondHalfStr
        }

        let parsedFinalNumber = parseInt(finalNumberString)
        if (parsedFinalNumber == NaN) {
          return null
        }
        parsedFinalNumber *= multiplier

        return parsedFinalNumber
      }

      let description = undefined
      const descriptionStr = parsedBody.metadata.channelMetadataRenderer.description
      if (descriptionStr.length > 0) {
        description = descriptionStr
      }

      let views = 0
      if (aboutData.viewCountText) {
        views = cleanScrapedNumber(aboutData.viewCountText.simpleText || aboutData.viewCountText.runs[0].text)
      }

      let subscribers = 0
      if (parsedBody.header.c4TabbedHeaderRenderer.subscriberCountText.simpleText) {
        subscribers = parseSubscriberCount(parsedBody.header.c4TabbedHeaderRenderer.subscriberCountText.simpleText)
      }

      let banner = undefined
      if (parsedBody.header.c4TabbedHeaderRenderer.banner) {
        banner = parsedBody.header.c4TabbedHeaderRenderer.banner.thumbnails
      }

      var data = {
        id: parsedBody.metadata.channelMetadataRenderer.externalId,
        url: parsedBody.metadata.channelMetadataRenderer.vanityChannelUrl.replace(/^http:\/\//g, "https://"),
        name: parsedBody.metadata.channelMetadataRenderer.title,
        description: description,
        location: (aboutData.country || {}).simpleText,
        joinedDate: new Date(aboutData.joinedDateText.runs[1].text),
        keywords: parsedBody.microformat.microformatDataRenderer.tags || [],
        approx: {
          views: views,
          subscribers: subscribers
        },
        images: {
          avatar: parsedBody.metadata.channelMetadataRenderer.avatar.thumbnails,
          banner: banner
        },
        privacy: {
          familySafe: parsedBody.metadata.channelMetadataRenderer.isFamilySafe,
          availableCountries: parsedBody.metadata.channelMetadataRenderer.availableCountryCodes
        }
      }

      if (options.includeRawData) {
        data.raw = parsedBody
      }

      resolve(data)
    })
  })
}

exports.info = channelInfo