import DS from "ember-data";

export default DS.FixtureAdapter.extend({
	simulateRemoteResponse: true,
	latency: 250
});
