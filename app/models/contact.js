import DS from "ember-data";

var Contact = DS.Model.extend({
	name: DS.attr("string"), // Contact's display name
	avatar: DS.attr("string") // data: avatar
});

var placeholderAvatar = "data:image/gif;base64,R0lGODdhWgBaAOMAAMzMzJaWlr6+vpycnKOjo8XFxbe3t7GxsaqqqgAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAAWgBaAAAE/hDISau9OOvNu/9gKI5kaZ5oqq5s675wLM90bd94ru987//AoHBILBqPyKRyyWw6n9CodEqtWq/YrHbL7Xq/4LB4TC4vBYMAoSApEAIIEFrNBrjhxAHBoJcQBgYBBx96fAR+gIJCAgECAIEFBQEGAAgDHoyOkJKUlouNjwEFmaEVAQEApxSkkKyoQZIEcwCMbJCrgqATsbO1oXVAB6d4vrcUCHgVwqdxxaJDBcKOrhaBlBbRoNTQA3F2k5WXFX+H2N1t4J5Df8B/gYMUgYzXFOwT7orrjrtv3hRqAN5YkEXhjj8zCBMqXMiwocOHECNKnEixosWLGDNq3Mixo8ePDSBDihxJsqTJkyiFRAAAOw==";

Contact.reopenClass({
	FIXTURES: [
		{id: "test1@nightexcessive.us", name: "Test 1", avatar: placeholderAvatar},
		{id: "test2@nightexcessive.us", name: "Test 2", avatar: placeholderAvatar},
	]
});

export default Contact;