class YTScraperInvalidVideoURL extends Error {
	constructor(message) {
		super(message)
		this.name = "YTScraperInvalidVideoURL"
	}
}
exports.YTScraperInvalidVideoURL = YTScraperInvalidVideoURL

class YTScraperInvalidVideoID extends Error {
	constructor(message) {
		super(message)
		this.name = "YTScraperInvalidVideoID"
	}
}
exports.YTScraperInvalidVideoID = YTScraperInvalidVideoID

class YTScraperInvalidChannelID extends Error {
	constructor(message) {
		super(message)
		this.name = "YTScraperInvalidChannelID"
	}
}
exports.YTScraperInvalidChannelID = YTScraperInvalidChannelID

class YTScraperMissingData extends Error {
	constructor(message) {
		super(message)
		this.name = "YTScraperMissingData"
	}
}
exports.YTScraperMissingData = YTScraperMissingData