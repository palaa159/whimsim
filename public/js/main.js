var mCount = 0;
var totalBytes = 0;
var cities = [],
	cityData = [];

// masonry
var $container = $('#container');

var socket = io.connect('http://localhost:9001'); // connect client to the server
socket.on('data', function(data) {
	// merge city and hits
	$.each(data.locData, function(k, v) {
		if ($.inArray(v.city, cities) === -1) {
			cities.push(v.city);
			cityData.push({
				id: cities.indexOf(v.city),
				city: v.city,
				country: v.country,
				lat: v.lat,
				lng: v.lng,
				hit: 0,
				bytes: v.bytesSent,
				photoURL: getFlickr(cities.indexOf(v.city), v.lat, v.lng) || null
			});
		} else {
			// find indexOf
			var index = cities.indexOf(v.city);
			// modify hit and bytes
			cityData[index].hit++;
			cityData[index].bytes += v.bytesSent - cityData[index].bytes;
			// update and flash
			$('#' + v.city.replace(/\s/g, '')).children('.elemHits').html(cityData[index].hit + ' hits with ' + cityData[index].bytes + ' bytes');
		}
	});
});

function getFlickr(id, lat, lng) { // get popular img URL
	var url;
	$.ajax({
		url: 'http://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=d87236b5124ce382b0f2dc4c001aa228&lat=' + lat + '&lon=' + lng + '&radius=30&radius_unit=km&per_page=10&format=json&jsoncallback=?',
		dataType: 'jsonp',
		success: function(data) {
			console.log(data.photos.photo);
			var start = data.photos.photo[Math.floor(Math.random()*10)];
			url = 'http://farm' + start.farm + '.static.flickr.com/' + start.server + '/' + start.id + '_' + start.secret + '_m.jpg';
			// console.log(url);
			// find and add back
			cityData[id].photoURL = url;
			// replace ' ' with ''
			var cityId = cityData[id].city;
			// clone
			var newElem = $('#forClone').clone().attr('id', cityId.replace(/\s/g, '')).addClass('item').addClass('isotope-item').show();
			newElem.children('img').attr('src', url);
			newElem.children('.elemCity').html(cityData[id].city + ', ' + cityData[id].country);
			newElem.children('.elemHits').html(cityData[id].hit + ' hits with ' + cityData[id].bytes + ' bytes');
			$('#container').append(newElem);
		}
	});
}