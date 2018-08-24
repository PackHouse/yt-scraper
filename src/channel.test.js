var channel = require("./channel")

test("retrives information on a YouTube channel", () => {
	return channel.info("https://www.youtube.com/user/google")
	.then(data => {
		expect(data).toEqual(
			expect.objectContaining({
				id: expect.any(String),
				name: expect.any(String),
				subscribers: expect.any(Number),
				views: expect.any(Number),
				joined: expect.any(Date),
				url: expect.any(String),
				description: expect.any(String)
			})
		)
	})

	expect.assertions(1)
})

var invalidChannelUrlError = "Invalid channel URL"
test("trigger hostname YouTube channel url error", () => {
	return channel.info("https://www.youtub.com/user/google")
	.catch(e => expect(e).toBe(invalidChannelUrlError))
})

test("trigger YouTube channel id url error", () => {
	return channel.info("https://youtube.com/x")
	.catch(e => expect(e).toBe(invalidChannelUrlError))
})