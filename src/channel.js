const url = require("url")
const request = require("request")

const errors = require("./errors")
const parser = require("./parser")
const globalVariables = require("./variables")

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

      var extractedPageData
      try {
        extractedPageData = await parser.parse(body, /window\["ytInitialData"\]\s?=\s?{.{0,}}/gm)
      } catch (err) {
        reject(err)
        return
      }

      let aboutData = extractedPageData.contents.twoColumnBrowseResultsRenderer.tabs.filter(tab => {
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
      const descriptionStr = extractedPageData.metadata.channelMetadataRenderer.description
      if (descriptionStr.length > 0) {
        description = descriptionStr
      }

      let views = 0
      if (aboutData.viewCountText) {
        views = cleanScrapedNumber(aboutData.viewCountText.simpleText || aboutData.viewCountText.runs[0].text)
      }

      let subscribers = 0
      if (extractedPageData.header.c4TabbedHeaderRenderer.subscriberCountText.simpleText) {
        subscribers = parseSubscriberCount(extractedPageData.header.c4TabbedHeaderRenderer.subscriberCountText.simpleText)
      }

      let banner = undefined
      if (extractedPageData.header.c4TabbedHeaderRenderer.banner) {
        banner = extractedPageData.header.c4TabbedHeaderRenderer.banner.thumbnails
      }

      var data = {
        id: extractedPageData.metadata.channelMetadataRenderer.externalId,
        url: extractedPageData.metadata.channelMetadataRenderer.vanityChannelUrl.replace(/^http:\/\//g, "https://"),
        name: extractedPageData.metadata.channelMetadataRenderer.title,
        description: description,
        location: (aboutData.country || {}).simpleText,
        joined: new Date(aboutData.joinedDateText.runs[1].text),
        keywords: extractedPageData.microformat.microformatDataRenderer.tags || [],
        approx: {
          views: views,
          subscribers: subscribers
        },
        images: {
          avatar: extractedPageData.metadata.channelMetadataRenderer.avatar.thumbnails,
          banner: banner
        },
        privacy: {
          familySafe: extractedPageData.metadata.channelMetadataRenderer.isFamilySafe,
          availableCountries: extractedPageData.metadata.channelMetadataRenderer.availableCountryCodes
        }
      }

      if (options.includeRawData) {
        data.raw = { page: extractedPageData }
      }

      resolve(data)
    })
  })
}

exports.info = channelInfo